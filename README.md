# Fortune Investment Platform

A modern financial investment dashboard and portfolio management platform featuring automated yield generation, multi-tier referral tracking, interactive financial analytics, and seamless **Safaricom Lipa Na M-PESA** integration.

---

## Key Features

- **Profile Creation & Account Switching**:
  - **Custom Profile Registration**: Create investor profiles with chosen avatar, full name, username, email, Safaricom M-PESA number, country, password, and starting sandbox capital.
  - **Local Persistence & Quick Switcher**: Manage multiple investor accounts locally and switch between profiles with 1 click.
- **Dashboard & Portfolio Management**: Real-time asset tracking, daily automated yield accrual, and comprehensive profit summaries.

- **Lipa Na M-PESA Integration**:
  - **STK Push Express Deposit**: Instant USSD prompt simulation for Kenyan Shilling deposits.
  - **Manual Paybill / Till Verification**: Paybill `505031` / Till `892134` receipt validation.
  - **B2C Mobile Cashout**: Direct withdrawals to verified Safaricom lines.
- **Crypto & Multi-Asset Transactions**: Deposit and withdraw via USDT (TRC-20 & ERC-20), BTC, and ETH.
- **High-Yield Investment Packages**: Multiple tiers (Starter, Bronze, Silver, Gold, Platinum, VIP Prestige) with daily ROI payouts and lock-in period management.
- **Financial Growth Analytics**: Interactive area and bar charts powered by Recharts for tracking historical equity curves and yield trajectories.
- **Multi-Level Affiliate Hub**: Sponsor referral tracking with custom referral links (`?ref=505031`), commission breakdown, and team analytics.
- **Security & KYC**: Whitelisted payout addresses, 2FA Google Authenticator toggle, session logs, and personal contact management.

---

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler / Dev Server**: Vite
- **Styling**: Tailwind CSS
- **Charts & Visualization**: Recharts
- **Icons**: Lucide React
- **Animations & Effects**: Motion & Canvas Confetti

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher)
- npm, pnpm, yarn, or bun

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/fortune-investment.git
   cd fortune-investment
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) (or the port specified by Vite) in your browser.

### Build for Production

```bash
npm run build
```

The production assets will be output to the `dist/` directory.

---

## Project Structure

```text
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx                   # Root state orchestration and routing
    ├── main.tsx                  # Application entry point
    ├── index.css                 # Tailwind CSS directives
    ├── types.ts                  # Shared TypeScript interfaces & types
    ├── data/
    │   └── mockData.ts           # Initial portfolio seed data & investment plans
    └── components/
        ├── AuthScreen.tsx            # Login and registration view
        ├── Header.tsx                # Top navigation and quick action bar
        ├── DashboardOverview.tsx     # Main portfolio dashboard and yield ticker
        ├── InvestmentsView.tsx       # Investment plans and active contracts
        ├── FinancialAnalyticsView.tsx# Deep-dive financial charts and growth stats
        ├── TransactionHistoryView.tsx# Filterable ledger of deposits and payouts
        ├── ReferralAffiliateView.tsx # Multi-tier team and commission dashboard
        ├── SecurityKycView.tsx       # KYC profile, 2FA, and whitelisted wallets
        ├── DepositModal.tsx          # Multi-asset crypto deposit modal
        ├── WithdrawModal.tsx         # Payout request modal
        ├── InvestModal.tsx           # Contract subscription modal
        ├── MpesaModal.tsx            # Lipa Na M-PESA STK Push & Paybill modal
        └── ContactSupportModal.tsx   # Nairobi support desk and contact directory
```

---

## License

Apache-2.0
