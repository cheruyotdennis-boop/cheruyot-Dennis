<?php
/**
 * Quantiq Prime (http://quantiqprime.com)
 * Endpoint: POST /api/crypto-deposit.php
 * Creates a LIVE mainnet crypto payment invoice via NOWPayments (Simulation: OFF)
 */

declare(strict_types=1);

// Set CORS & Security Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed. Use POST.']);
    exit;
}

require_once __DIR__ . '/../config.php';

// -----------------------------------------------------------------------------
// 1. Read & Parse Incoming Request Payload
// -----------------------------------------------------------------------------
$rawInput = file_get_contents('php://input');
$inputData = json_decode($rawInput, true);

// Support both JSON body and standard application/x-www-form-urlencoded
if (!is_array($inputData)) {
    $inputData = $_POST;
}

$userId     = trim((string)($inputData['user_id'] ?? ''));
$amountUsd  = filter_var($inputData['amount_usd'] ?? null, FILTER_VALIDATE_FLOAT);
$rawCurrency = trim((string)($inputData['currency'] ?? 'USDT'));

// -----------------------------------------------------------------------------
// 2. Input Validation
// -----------------------------------------------------------------------------
if ($userId === '') {
    sendJsonResponse([
        'success' => false,
        'error'   => 'Missing required parameter: user_id'
    ], 400);
}

if ($amountUsd === false || $amountUsd <= 0) {
    sendJsonResponse([
        'success' => false,
        'error'   => 'Invalid deposit amount. amount_usd must be a positive number.'
    ], 400);
}

if ($amountUsd < 5.0) {
    sendJsonResponse([
        'success' => false,
        'error'   => 'Minimum deposit amount is $5.00 USD.'
    ], 400);
}

$payCurrency = resolveNowPaymentsCurrency($rawCurrency);
$allowedCurrencies = ['btc', 'usdtbsc', 'usdttrc20', 'usdterc20', 'eth'];
if (!in_array($payCurrency, $allowedCurrencies, true)) {
    sendJsonResponse([
        'success' => false,
        'error'   => "Unsupported currency '{$rawCurrency}'. Allowed: USDT (BEP20/TRC20/ERC20), BTC, ETH."
    ], 400);
}

// -----------------------------------------------------------------------------
// 3. Verify Live API Key
// -----------------------------------------------------------------------------
if (NOWPAYMENTS_API_KEY === '') {
    error_log('[NOWPayments Error]: NOWPAYMENTS_API_KEY environment variable is not configured.');
    sendJsonResponse([
        'success'   => false,
        'error'     => 'NOWPayments LIVE API key is not configured on the server.',
        'live_mode' => false
    ], 500);
}

$pdo = getDatabaseConnection();

// -----------------------------------------------------------------------------
// 4. Ensure User Exists in Database (Create investor row if new)
// -----------------------------------------------------------------------------
try {
    $userStmt = $pdo->prepare('SELECT id, email, status FROM users WHERE id = :id LIMIT 1');
    $userStmt->execute([':id' => $userId]);
    $user = $userStmt->fetch();

    if (!$user) {
        $insertUserStmt = $pdo->prepare('
            INSERT INTO users (id, email, full_name, balance_usd, status)
            VALUES (:id, :email, :full_name, 0.0000, "active")
        ');
        $insertUserStmt->execute([
            ':id'        => $userId,
            ':email'     => str_contains($userId, '@') ? $userId : "user_{$userId}@quantiqprime.com",
            ':full_name' => "Investor {$userId}"
        ]);
    } elseif ($user['status'] !== 'active') {
        sendJsonResponse([
            'success' => false,
            'error'   => 'User account is suspended or inactive.'
        ], 403);
    }
} catch (PDOException $e) {
    error_log('[DB Error]: Failed to check/create user: ' . $e->getMessage());
    sendJsonResponse([
        'success' => false,
        'error'   => 'Database error validating user profile.'
    ], 500);
}

// -----------------------------------------------------------------------------
// 5. Generate Order Reference and Dispatch to NOWPayments LIVE API
// -----------------------------------------------------------------------------
$orderId = sprintf('QP_%s_%d_%s', strtoupper(substr($payCurrency, 0, 4)), time(), bin2hex(random_bytes(3)));
$webhookUrl = APP_URL . '/api/crypto-webhook.php';

$paymentPayload = [
    'price_amount'       => round($amountUsd, 2),
    'price_currency'     => 'usd',
    'pay_currency'       => $payCurrency,
    'ipn_callback_url'   => $webhookUrl,
    'order_id'           => $orderId,
    'order_description'  => "Quantiq Prime Deposit #{$orderId} for User {$userId}",
    'is_fee_paid_by_user'=> false
];

$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL            => NOWPAYMENTS_API_URL . '/payment',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING       => '',
    CURLOPT_MAXREDIRS      => 5,
    CURLOPT_TIMEOUT        => 20,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST  => 'POST',
    CURLOPT_POSTFIELDS     => json_encode($paymentPayload),
    CURLOPT_HTTPHEADER     => [
        'x-api-key: ' . NOWPAYMENTS_API_KEY,
        'Content-Type: application/json',
        'User-Agent: QuantiqPrime-PHP/2.0'
    ],
]);

$rawResponse = curl_exec($curl);
$httpCode    = curl_getinfo($curl, CURLINFO_HTTP_CODE);
$curlError   = curl_error($curl);
curl_close($curl);

if ($curlError !== '') {
    error_log('[NOWPayments cURL Error]: ' . $curlError);
    sendJsonResponse([
        'success' => false,
        'error'   => 'Failed to reach NOWPayments gateway: ' . $curlError
    ], 502);
}

$responseData = json_decode((string)$rawResponse, true);

if ($httpCode < 200 || $httpCode >= 300 || !is_array($responseData) || empty($responseData['payment_id'])) {
    $errMsg = $responseData['message'] ?? $responseData['error'] ?? 'NOWPayments API rejected the payment request.';
    error_log("[NOWPayments API Error] Code {$httpCode}: " . json_encode($responseData));
    sendJsonResponse([
        'success'       => false,
        'http_code'     => $httpCode,
        'error'         => $errMsg,
        'nowpayments'   => $responseData
    ], 400);
}

// -----------------------------------------------------------------------------
// 6. Extract Mainnet Payment Details
// -----------------------------------------------------------------------------
$paymentId   = (string)$responseData['payment_id'];
$payAddress  = (string)($responseData['pay_address'] ?? '');
$payAmount   = (float)($responseData['pay_amount'] ?? 0);
$extraId     = $responseData['payin_extra_id'] ?? null;
$network     = $responseData['network'] ?? strtoupper($payCurrency);
$initStatus  = (string)($responseData['payment_status'] ?? 'waiting');

if ($payAddress === '' || $payAmount <= 0) {
    sendJsonResponse([
        'success' => false,
        'error'   => 'NOWPayments response missing pay_address or pay_amount.'
    ], 502);
}

// Generate Scannable QR Code URL
// For Bitcoin: URI format bitcoin:<address>?amount=<amount>
// For USDT/Generic: Plain address QR
$qrData = ($payCurrency === 'btc') 
    ? sprintf('bitcoin:%s?amount=%s', $payAddress, $payAmount) 
    : $payAddress;

$qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=' . urlencode($qrData);

// -----------------------------------------------------------------------------
// 7. Store Live Deposit Record in MySQL
// -----------------------------------------------------------------------------
try {
    $insertDepositStmt = $pdo->prepare('
        INSERT INTO crypto_deposits (
            user_id,
            payment_id,
            order_id,
            price_amount,
            price_currency,
            pay_amount,
            pay_currency,
            pay_address,
            pay_extra_id,
            payment_status,
            credited,
            created_at
        ) VALUES (
            :user_id,
            :payment_id,
            :order_id,
            :price_amount,
            "USD",
            :pay_amount,
            :pay_currency,
            :pay_address,
            :pay_extra_id,
            :payment_status,
            0,
            NOW()
        )
    ');

    $insertDepositStmt->execute([
        ':user_id'        => $userId,
        ':payment_id'     => $paymentId,
        ':order_id'       => $orderId,
        ':price_amount'   => $amountUsd,
        ':pay_amount'     => $payAmount,
        ':pay_currency'   => $payCurrency,
        ':pay_address'    => $payAddress,
        ':pay_extra_id'   => $extraId,
        ':payment_status' => $initStatus
    ]);
} catch (PDOException $e) {
    error_log('[DB Error]: Failed to persist crypto deposit: ' . $e->getMessage());
    sendJsonResponse([
        'success' => false,
        'error'   => 'Database error recording payment invoice.'
    ], 500);
}

// -----------------------------------------------------------------------------
// 8. Return Live Payment Address & QR Code to Client
// -----------------------------------------------------------------------------
sendJsonResponse([
    'success'          => true,
    'live_mode'        => true,
    'payment_id'       => $paymentId,
    'order_id'         => $orderId,
    'user_id'          => $userId,
    'price_amount_usd' => round($amountUsd, 2),
    'pay_amount'       => $payAmount,
    'pay_currency'     => strtoupper($payCurrency),
    'network'          => strtoupper($network),
    'pay_address'      => $payAddress,
    'pay_extra_id'     => $extraId,
    'qr_code_url'      => $qrCodeUrl,
    'payment_status'   => $initStatus,
    'instructions'     => sprintf(
        'Send exactly %s %s to the on-chain address above. Account balance will be credited automatically upon on-chain confirmation.',
        $payAmount,
        strtoupper($payCurrency)
    )
], 201);
