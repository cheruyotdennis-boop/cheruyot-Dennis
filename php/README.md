# Quantiq Prime (http://quantiqprime.com)
## Production-Ready PHP Crypto Deposit System (Simulation OFF)

This system provides a non-custodial, live mainnet cryptocurrency deposit architecture using the **NOWPayments Live API** and **MySQL InnoDB with ACID transactions**.

---

### Architecture Overview

```
Client / Investor
       │
       ▼
1. POST /api/crypto-deposit.php { user_id, amount_usd, currency }
       │
       ├─► 2. Calls NOWPayments Live API (https://api.nowpayments.io/v1/payment)
       ├─► 3. Stores pending deposit in MySQL (`crypto_deposits`)
       └─► 4. Returns live on-chain deposit address & scannable QR Code
       │
Client sends real crypto (USDT / BTC) from Binance / TrustWallet / Metamask
       │
Blockchain Network confirms transaction blocks
       │
NOWPayments Gateway sends signed webhook
       ▼
5. POST /api/crypto-webhook.php
       │
       ├─► 6. Verifies HMAC-SHA512 signature with NOWPAYMENTS_IPN_SECRET
       ├─► 7. Checks for real on-chain confirmation (status: confirmed / finished)
       ├─► 8. Enforces idempotency (SELECT ... FOR UPDATE)
       └─► 9. Credits user's `balance_usd` in `users` table atomically
```

---

### File Structure

```
php/
├── config.php                  # Database connection (PDO) & environment loader
├── database.sql                # Production MySQL schema (users, crypto_deposits, logs)
├── .env.example                # Template for live credentials
├── README.md                   # Complete documentation
└── api/
    ├── crypto-deposit.php      # Live payment creation endpoint
    └── crypto-webhook.php      # Live IPN webhook with HMAC-SHA512 verification
```

---

### Step 1: Import Database Schema

Import `database.sql` into your MySQL/MariaDB server:

```bash
mysql -u quantiq_user -p quantiq_prime < php/database.sql
```

This creates:
- `users`: Stores user balances (`balance_usd`, `total_deposited_usd`).
- `crypto_deposits`: Tracks each NOWPayments `payment_id`, target address, expected crypto amount, received crypto, and on-chain confirmation status.
- `crypto_webhook_logs`: Maintains an audit trail of every webhook received, remote IP, and signature validation result.

---

### Step 2: Configure Environment Variables

Create `.env` inside the `php/` directory (or set in server environment / Nginx / Apache / cPanel):

```bash
cp php/.env.example php/.env
nano php/.env
```

Set your live production credentials from [NOWPayments Dashboard](https://account.nowpayments.io/):
1. **`NOWPAYMENTS_API_KEY`**: Found under **Store Settings** → **API Keys**.
2. **`NOWPAYMENTS_IPN_SECRET`**: Generated under **Store Settings** → **Instant Payment Notifications (IPN)**.
3. **`APP_URL`**: `http://quantiqprime.com`

---

### Step 3: API Usage Examples

#### 1. Create a Live Deposit Payment
**Endpoint**: `POST /api/crypto-deposit.php`

**Request**:
```bash
curl -X POST http://quantiqprime.com/api/crypto-deposit.php \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "usr_9981",
    "amount_usd": 150.00,
    "currency": "USDT"
  }'
```

**Response (HTTP 201 Created)**:
```json
{
  "success": true,
  "live_mode": true,
  "payment_id": "5079182341",
  "order_id": "QP_USDT_1727602391_a1f9",
  "user_id": "usr_9981",
  "price_amount_usd": 150.00,
  "pay_amount": 149.85,
  "pay_currency": "USDTBSC",
  "network": "BSC",
  "pay_address": "0x51A8A3f4C7e62E805561a069e25e9821De9A293B",
  "pay_extra_id": null,
  "qr_code_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=0x51A8A3f4C7e62E805561a069e25e9821De9A293B",
  "payment_status": "waiting",
  "instructions": "Send exactly 149.85 USDTBSC to the on-chain address above. Account balance will be credited automatically upon on-chain confirmation."
}
```

---

#### 2. Webhook Execution (Handled automatically by NOWPayments)
**Endpoint**: `POST /api/crypto-webhook.php`

- Header: `x-nowpayments-sig: <hmac-sha512-hex>`
- The endpoint automatically verifies HMAC using `NOWPAYMENTS_IPN_SECRET`.
- Only updates and credits user balance when `payment_status` is `confirmed` or `finished`.
- Fully idempotent: duplicate webhook notifications will not double-credit.

---

### Nginx Configuration Example

```nginx
server {
    server_name quantiqprime.com;
    root /var/www/quantiqprime/public;

    index index.php index.html;

    location /api/ {
        try_files $uri $uri/ /api/$uri.php?$args;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```
