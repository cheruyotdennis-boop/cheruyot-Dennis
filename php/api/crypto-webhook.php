<?php
/**
 * Quantiq Prime (http://quantiqprime.com)
 * Endpoint: POST /api/crypto-webhook.php
 * NOWPayments IPN (Instant Payment Notification) Webhook Handler
 * 
 * Verifies HMAC-SHA512 signature and credits user balance in MySQL
 * ONLY AFTER REAL ON-CHAIN CONFIRMATION (payment_status: finished / confirmed).
 */

declare(strict_types=1);

// Prevent non-POST methods
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
    exit;
}

require_once __DIR__ . '/../config.php';

// -----------------------------------------------------------------------------
// 1. Capture Raw Request & NOWPayments Signature Header
// -----------------------------------------------------------------------------
$rawPayload = file_get_contents('php://input');
$receivedSignature = $_SERVER['HTTP_X_NOWPAYMENTS_SIG'] 
    ?? $_SERVER['HTTP_X_NOWPAYMENTS_SIGNATURE'] 
    ?? $_SERVER['X-NOWPAYMENTS-SIG'] 
    ?? '';

$remoteIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

if ($rawPayload === '' || $rawPayload === false) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Empty request payload']);
    exit;
}

$payload = json_decode($rawPayload, true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON payload']);
    exit;
}

$pdo = getDatabaseConnection();

// -----------------------------------------------------------------------------
// 2. Cryptographic Signature Verification (HMAC-SHA512)
// Algorithm: Sort payload keys alphabetically, json_encode with JSON_UNESCAPED_SLASHES,
// and compute hash_hmac('sha512', $sortedJson, $ipnSecret).
// -----------------------------------------------------------------------------
$ipnSecret = trim(NOWPAYMENTS_IPN_SECRET);
$signatureValid = false;
$errorMessage = null;

if ($ipnSecret === '') {
    $errorMessage = 'NOWPAYMENTS_IPN_SECRET is not configured on server';
    error_log("[NOWPayments Webhook Error]: {$errorMessage}");
} elseif ($receivedSignature === '') {
    $errorMessage = 'Missing x-nowpayments-sig header';
    error_log("[NOWPayments Webhook Error]: {$errorMessage}");
} else {
    // Sort array by keys recursively
    $sortedPayload = $payload;
    ksort($sortedPayload);

    $sortedJson = json_encode($sortedPayload, JSON_UNESCAPED_SLASHES);
    $calculatedHmac = hash_hmac('sha512', $sortedJson, $ipnSecret);

    if (hash_equals(strtolower($calculatedHmac), strtolower($receivedSignature))) {
        $signatureValid = true;
    } else {
        $errorMessage = 'Invalid HMAC-SHA512 signature mismatch';
        error_log("[NOWPayments Webhook Error]: Signature mismatch. Expected {$calculatedHmac}, got {$receivedSignature}");
    }
}

// Log audit trail
try {
    $logStmt = $pdo->prepare('
        INSERT INTO crypto_webhook_logs (
            payment_id,
            event_status,
            signature_received,
            signature_verified,
            payload_json,
            remote_ip,
            error_message,
            created_at
        ) VALUES (
            :payment_id,
            :event_status,
            :sig,
            :verified,
            :payload,
            :ip,
            :err,
            NOW()
        )
    ');
    $logStmt->execute([
        ':payment_id' => (string)($payload['payment_id'] ?? ''),
        ':event_status' => (string)($payload['payment_status'] ?? 'unknown'),
        ':sig'        => substr($receivedSignature, 0, 255),
        ':verified'   => $signatureValid ? 1 : 0,
        ':payload'    => $rawPayload,
        ':ip'         => $remoteIp,
        ':err'        => $errorMessage
    ]);
} catch (PDOException $e) {
    error_log('[DB Error]: Failed to write webhook log: ' . $e->getMessage());
}

if (!$signatureValid) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error'   => 'Unauthorized: Invalid signature'
    ]);
    exit;
}

// -----------------------------------------------------------------------------
// 3. Extract Payment Data & On-Chain Status
// -----------------------------------------------------------------------------
$paymentId     = (string)($payload['payment_id'] ?? '');
$paymentStatus = strtolower(trim((string)($payload['payment_status'] ?? '')));
$actuallyPaid  = (float)($payload['actually_paid'] ?? $payload['outcome_amount'] ?? 0);
$outcomeAmount = (float)($payload['outcome_amount'] ?? 0);
$priceAmount   = (float)($payload['price_amount'] ?? 0);
$payCurrency   = (string)($payload['pay_currency'] ?? '');
$txHash        = (string)($payload['purchase_id'] ?? $payload['payin_hash'] ?? $payload['burn_tx'] ?? '');

if ($paymentId === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing payment_id in webhook']);
    exit;
}

// -----------------------------------------------------------------------------
// 4. ACID Transaction: Verify, Update Status & Credit Balance Only On-Chain
// -----------------------------------------------------------------------------
try {
    $pdo->beginTransaction();

    // Pessimistic lock row for idempotency
    $depositStmt = $pdo->prepare('
        SELECT id, user_id, price_amount, pay_amount, payment_status, credited
        FROM crypto_deposits
        WHERE payment_id = :payment_id
        FOR UPDATE
    ');
    $depositStmt->execute([':payment_id' => $paymentId]);
    $deposit = $depositStmt->fetch();

    if (!$deposit) {
        $pdo->rollBack();
        error_log("[NOWPayments Webhook Error]: Payment ID {$paymentId} not found in database.");
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Deposit record not found']);
        exit;
    }

    // Determine if on-chain confirmation is reached
    // NOWPayments considers a payment fully confirmed on-chain when status is 'confirmed' or 'finished'
    $isOnChainConfirmed = in_array($paymentStatus, ['confirmed', 'finished'], true);
    $creditAmountUsd = ($priceAmount > 0) ? $priceAmount : (float)$deposit['price_amount'];

    if ($isOnChainConfirmed && (int)$deposit['credited'] === 0) {
        // 1. Mark deposit as confirmed and credited
        $updateDepositStmt = $pdo->prepare('
            UPDATE crypto_deposits SET
                payment_status      = :status,
                actually_paid       = :actually_paid,
                tx_hash             = :tx_hash,
                credited            = 1,
                credited_amount_usd = :credit_usd,
                credited_at         = NOW()
            WHERE id = :id
        ');
        $updateDepositStmt->execute([
            ':status'        => $paymentStatus,
            ':actually_paid' => $actuallyPaid,
            ':tx_hash'       => $txHash,
            ':credit_usd'    => $creditAmountUsd,
            ':id'            => $deposit['id']
        ]);

        // 2. Credit the investor's balance in users table
        $updateUserStmt = $pdo->prepare('
            UPDATE users SET
                balance_usd         = balance_usd + :credit_usd,
                total_deposited_usd = total_deposited_usd + :credit_usd
            WHERE id = :user_id
        ');
        $updateUserStmt->execute([
            ':credit_usd' => $creditAmountUsd,
            ':user_id'    => $deposit['user_id']
        ]);

        $pdo->commit();

        error_log(sprintf(
            '[Crypto Deposit SUCCESS]: User %s credited with $%0.2f USD from Payment %s (Status: %s, Tx: %s)',
            $deposit['user_id'],
            $creditAmountUsd,
            $paymentId,
            $paymentStatus,
            $txHash
        ));

        http_response_code(200);
        echo json_encode([
            'success'  => true,
            'message'  => 'Payment confirmed on-chain and user balance credited successfully.',
            'credited' => true,
            'amount'   => $creditAmountUsd
        ]);
        exit;

    } else {
        // If not confirmed (e.g. waiting, confirming, failed, expired) OR already credited:
        // Update the status without double crediting
        $updateDepositStmt = $pdo->prepare('
            UPDATE crypto_deposits SET
                payment_status = :status,
                actually_paid  = :actually_paid,
                tx_hash        = COALESCE(NULLIF(:tx_hash, ""), tx_hash)
            WHERE id = :id
        ');
        $updateDepositStmt->execute([
            ':status'        => $paymentStatus,
            ':actually_paid' => $actuallyPaid,
            ':tx_hash'       => $txHash,
            ':id'            => $deposit['id']
        ]);

        $pdo->commit();

        http_response_code(200);
        echo json_encode([
            'success'        => true,
            'message'        => 'Status updated. No credit performed at this stage.',
            'payment_status' => $paymentStatus,
            'already_credited' => ((int)$deposit['credited'] === 1)
        ]);
        exit;
    }

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[DB Error]: Webhook processing failed: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'Internal database error during webhook processing'
    ]);
    exit;
}
