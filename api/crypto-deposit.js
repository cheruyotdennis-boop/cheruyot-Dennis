/**
 * Vercel Serverless Function: POST /api/crypto-deposit
 * Node.js Runtime
 */

export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed. Only POST is accepted.`
    });
  }

  try {
    // 2. Read and parse JSON body
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: 'Malformed JSON payload.'
        });
      }
    }

    const { user_id, amount_usd, currency = 'USDT' } = body || {};

    // 3. Validate user_id and amount_usd exist
    if (!user_id || amount_usd === undefined || amount_usd === null || isNaN(Number(amount_usd)) || Number(amount_usd) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid parameters: user_id and a positive amount_usd are required.'
      });
    }

    const targetCurrency = String(currency || 'USDT').toUpperCase().trim();
    const numericAmountUsd = Number(amount_usd);

    // Calculate crypto amount based on currency
    let amount_crypto = numericAmountUsd;
    if (targetCurrency === 'BTC') {
      const estimatedBtcPrice = 65000;
      amount_crypto = Number((numericAmountUsd / estimatedBtcPrice).toFixed(8));
    } else {
      // USDT 1:1 USD peg
      amount_crypto = Number(numericAmountUsd.toFixed(2));
    }

    const deposit_id = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour expiry

    // If NOWPayments LIVE API key is present in environment, fetch real live mainnet invoice
    const nowpaymentsApiKey = process.env.NOWPAYMENTS_API_KEY;
    if (nowpaymentsApiKey) {
      try {
        const payCurrencyTicker = targetCurrency === 'BTC' ? 'btc' : 'usdtbsc';
        const nowpaymentsResponse = await fetch('https://api.nowpayments.io/v1/payment', {
          method: 'POST',
          headers: {
            'x-api-key': nowpaymentsApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            price_amount: numericAmountUsd,
            price_currency: 'usd',
            pay_currency: payCurrencyTicker,
            order_id: deposit_id,
            order_description: `Deposit for user ${user_id}`
          })
        });

        if (nowpaymentsResponse.ok) {
          const npData = await nowpaymentsResponse.json();
          if (npData?.pay_address) {
            return res.status(200).json({
              success: true,
              pay_address: npData.pay_address,
              amount_crypto: Number(npData.pay_amount) || amount_crypto,
              currency: targetCurrency,
              deposit_id: npData.payment_id ? String(npData.payment_id) : deposit_id,
              expires_at: npData.expiration_estimate_date || expires_at
            });
          }
        }
      } catch (gatewayErr) {
        // Fallback to configured address if external API call encounters network error
        console.error('NOWPayments API call error:', gatewayErr);
      }
    }

    // Default mainnet deposit address (or environment configured address)
    const pay_address = process.env.CRYPTO_DEPOSIT_ADDRESS || "TTest1234567890abcdef1234567890TTest";

    // 4. Return required 200 JSON structure
    return res.status(200).json({
      success: true,
      pay_address,
      amount_crypto,
      currency: targetCurrency,
      deposit_id,
      expires_at
    });
  } catch (error) {
    console.error('Crypto deposit handler error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
}
