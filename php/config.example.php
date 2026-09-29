<?php
/**
 * Quantiq Prime (http://quantiqprime.com)
 * Example Configuration File (GitHub-Safe Template)
 * Copy this file to `config.php` and fill with your environment credentials.
 * DO NOT commit `config.php` or `.env` with real credentials to GitHub.
 */

declare(strict_types=1);

// Prevent direct script execution if accessed outside API pipeline
if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    http_response_code(403);
    exit('Access Forbidden');
}

// -----------------------------------------------------------------------------
// 1. Helper to Load .env File if present
// -----------------------------------------------------------------------------
function loadEnvFile(string $filePath): void {
    if (!file_exists($filePath) || !is_readable($filePath)) {
        return;
    }
    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $key = trim($parts[0]);
            $val = trim($parts[1]);
            if ((str_starts_with($val, '"') && str_ends_with($val, '"')) ||
                (str_starts_with($val, "'") && str_ends_with($val, "'"))) {
                $val = substr($val, 1, -1);
            }
            if (getenv($key) === false) {
                putenv("{$key}={$val}");
            }
            $_ENV[$key] = $val;
            $_SERVER[$key] = $val;
        }
    }
}

// Load local environment files if present
loadEnvFile(__DIR__ . '/.env');
loadEnvFile(dirname(__DIR__) . '/.env');

// -----------------------------------------------------------------------------
// 2. Global Environment Configurations (Zero Hardcoded Secrets)
// -----------------------------------------------------------------------------
define('DB_HOST', (string)($_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: '127.0.0.1'));
define('DB_PORT', (string)($_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: '3306'));
define('DB_NAME', (string)($_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'quantiq_prime'));
define('DB_USER', (string)($_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'root'));
define('DB_PASS', (string)($_ENV['DB_PASS'] ?? getenv('DB_PASS') ?: ''));

// NOWPayments LIVE Mainnet Credentials (Required from https://account.nowpayments.io)
// Simulation: OFF. Reads strictly from $_ENV or getenv.
define('NOWPAYMENTS_API_KEY', (string)($_ENV['NOWPAYMENTS_API_KEY'] ?? getenv('NOWPAYMENTS_API_KEY') ?: ''));
define('NOWPAYMENTS_IPN_SECRET', (string)($_ENV['NOWPAYMENTS_IPN_SECRET'] ?? getenv('NOWPAYMENTS_IPN_SECRET') ?: ''));
define('NOWPAYMENTS_API_URL', 'https://api.nowpayments.io/v1'); // Strictly LIVE production mainnet endpoint

// Application Base URL for IPN Webhook callbacks
define('APP_URL', rtrim((string)($_ENV['APP_URL'] ?? getenv('APP_URL') ?: 'http://quantiqprime.com'), '/'));

// -----------------------------------------------------------------------------
// 3. Database PDO Connection Factory
// -----------------------------------------------------------------------------
function getDatabaseConnection(): PDO {
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_NAME);
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log('[DB Error]: Connection failed: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error'   => 'Database connection unavailable. Please check configuration.'
            ]);
            exit;
        }
    }

    return $pdo;
}

// -----------------------------------------------------------------------------
// 4. Utility Functions
// -----------------------------------------------------------------------------
function sendJsonResponse(array $payload, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

function resolveNowPaymentsCurrency(string $requestedCurrency): string {
    $normalized = strtoupper(trim($requestedCurrency));
    return match ($normalized) {
        'BTC', 'BITCOIN'            => 'btc',
        'USDT', 'USDT-BEP20', 'BEP20' => 'usdtbsc',
        'USDT-TRC20', 'TRC20'       => 'usdttrc20',
        'USDT-ERC20', 'ERC20'       => 'usdterc20',
        'ETH', 'ETHEREUM'           => 'eth',
        default                     => strtolower($normalized)
    };
}
