import { UserProfile, WalletState, InvestmentPlan, ActiveInvestment, Transaction, ReferralMember, ChartDataPoint, NotificationItem, PlatformContacts } from '../types';
import { INVESTMENT_IMAGES } from '../utils/investmentAssets';

export const DEFAULT_CONTACTS: PlatformContacts = {
  mpesaPaybill: '1722023',
  mpesaTillNumber: '1722023',
  mpesaMerchantName: 'Smartchoice Ventures',
  supportPhone: '+254 700 505 031',
  supportEmail: 'support@quantiqprime.com',
  officeLocation: 'Delta Corner Towers, 7th Floor, Westlands, Nairobi, Kenya',
  whatsappSupport: '+17712502005',
  whatsappGroupLink: 'https://chat.whatsapp.com/C0LXeuksKfRIxC8WO2aQv2',
  telegramSupport: '@QuantiqPrimeOfficial',
  kesUsdExchangeRate: 130.00, // 1 USD = 130 KES
  cryptoDepositWallets: {
    usdtBep20: '0xbcf65f39cd5868e8ac571c6d929255dd587f9bff',
    btc: '1KSxkSS6XQsyYfefsTK7xSMrnFxDfGwsGU'
  }
};

export const INITIAL_USER: UserProfile = {
  id: 'usr_investor_default',
  fullName: 'Investor Account',
  username: 'investor',
  email: 'investor@quantiqprime.com',
  phone: '+254 700 000 000',
  mpesaNumber: '0700000000',
  country: 'Kenya',
  referralCode: '839214',
  referredBy: 'Executive VIP Sponsor',
  joinedDate: '2026-01-15',
  tier: 'Bronze',
  kycStatus: 'Verified',
  avatar: 'luxury',
  twoFactorEnabled: true,
  walletAddressUSDT: '',
  isAdmin: false,
  role: 'user'
};

export const INITIAL_WALLET: WalletState = {
  totalBalance: 0.00,
  availableCash: 0.00,
  activeInvested: 0.00,
  totalEarnings: 0.00,
  todayYield: 0.00,
  referralEarnings: 0.00,
  pendingWithdrawals: 0
};

export const INVESTMENT_PLANS: InvestmentPlan[] = [
  {
    id: 'plan_bronze',
    name: 'Bronze',
    tagline: 'Ksh 5K - 30K Allocation • 10 Days Horizon • 7.5% Daily ROI',
    dailyRoi: 7.5, // 7.5% daily
    durationDays: 10,
    minDeposit: 5000,
    maxDeposit: 30000,
    principalReturn: true,
    colorTheme: 'from-amber-900 via-amber-800 to-amber-950',
    popular: false,
    imageUrl: INVESTMENT_IMAGES.bronze,
    features: [
      '7.50% Daily Automated Yield',
      '10 Days Cycle Duration',
      '10% Direct Referral Bonus on Referee Stake',
      'Principal 100% Returned on Maturity',
      'Instant Daily Settlement to M-PESA / Wallet',
      'Standard 24/7 Priority Support'
    ],
    totalInvestors: 2140,
    totalPoolValue: 14280000
  },
  {
    id: 'plan_silver',
    name: 'Silver',
    tagline: 'Ksh 30K - 100K Allocation • 15 Days Horizon • 7.5% Daily ROI',
    dailyRoi: 7.5, // 7.5% daily
    durationDays: 15,
    minDeposit: 30000,
    maxDeposit: 100000,
    principalReturn: true,
    colorTheme: 'from-slate-500 via-slate-400 to-slate-600',
    popular: true,
    imageUrl: INVESTMENT_IMAGES.silver,
    features: [
      '7.50% Daily Automated Yield',
      '15 Days Cycle Duration',
      '10% Direct Referral Bonus on Referee Stake',
      'Principal 100% Returned on Maturity',
      'Zero Fee Instant M-PESA Withdrawals',
      'High-Frequency Algorithmic Yield'
    ],
    totalInvestors: 4890,
    totalPoolValue: 58950000
  },
  {
    id: 'plan_gold',
    name: 'Gold',
    tagline: 'Ksh 100K - 200K Allocation • 15 Days Horizon • 7.5% Daily ROI',
    dailyRoi: 7.5, // 7.5% daily
    durationDays: 15,
    minDeposit: 100000,
    maxDeposit: 200000,
    principalReturn: true,
    colorTheme: 'from-amber-600 via-yellow-500 to-amber-700',
    popular: false,
    imageUrl: INVESTMENT_IMAGES.gold,
    features: [
      '7.50% Daily Automated Yield',
      '15 Days Cycle Duration',
      '10% Direct Referral Bonus on Referee Stake',
      'Insured Principal Capital Guarantee',
      'Direct Institutional Account Manager',
      'Unlimited Fast Liquidity Access'
    ],
    totalInvestors: 1250,
    totalPoolValue: 146200000
  },
  {
    id: 'plan_platinum',
    name: 'Platinum (VIP)',
    tagline: 'Ksh 200K - 500K Allocation • 20 Days Horizon • 7.5% Daily ROI',
    dailyRoi: 7.5, // 7.5% daily
    durationDays: 20,
    minDeposit: 200000,
    maxDeposit: 500000,
    principalReturn: true,
    colorTheme: 'from-slate-950 via-teal-950 to-amber-950',
    popular: false,
    imageUrl: INVESTMENT_IMAGES.platinum,
    features: [
      '7.50% Daily Automated Yield',
      '20 Days High-Yield Horizon',
      '10% Direct Referral Bonus on Referee Stake',
      'Dedicated Private Liquidity Desk',
      'Executive Concierge 24/7 Access',
      'Guaranteed 150% Net ROI + Capital'
    ],
    totalInvestors: 320,
    totalPoolValue: 384000000
  }
];


export const INITIAL_ACTIVE_INVESTMENTS: ActiveInvestment[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_REFERRALS: ReferralMember[] = [];

export const HISTORICAL_GROWTH_DATA: Record<string, ChartDataPoint[]> = {
  '7D': [
    { date: 'Day 1', portfolioValue: 0, investedCapital: 0, totalProfit: 0, dailyEarnings: 0 },
    { date: 'Day 2', portfolioValue: 0, investedCapital: 0, totalProfit: 0, dailyEarnings: 0 },
    { date: 'Day 3', portfolioValue: 0, investedCapital: 0, totalProfit: 0, dailyEarnings: 0 },
    { date: 'Day 4', portfolioValue: 0, investedCapital: 0, totalProfit: 0, dailyEarnings: 0 },
    { date: 'Day 5', portfolioValue: 0, investedCapital: 0, totalProfit: 0, dailyEarnings: 0 },
    { date: 'Day 6', portfolioValue: 0, investedCapital: 0, totalProfit: 0, dailyEarnings: 0 },
    { date: 'Day 7', portfolioValue: 0, investedCapital: 0, totalProfit: 0, dailyEarnings: 0 }
  ],
  '1M': [
    { date: 'Week 1', portfolioValue: 0, investedCapital: 0, totalProfit: 0, dailyEarnings: 0 },
    { date: 'Week 2', portfolioValue: 0, investedCapital: 0, totalProfit: 0, dailyEarnings: 0 },
    { date: 'Week 3', portfolioValue: 0, investedCapital: 0, totalProfit: 0, dailyEarnings: 0 },
    { date: 'Week 4', portfolioValue: 0, investedCapital: 0, totalProfit: 0, dailyEarnings: 0 }
  ],
  '3M': [
    { date: 'Month 1', portfolioValue: 0, investedCapital: 0, totalProfit: 0, dailyEarnings: 0 },
    { date: 'Month 2', portfolioValue: 0, investedCapital: 0, totalProfit: 0, dailyEarnings: 0 },
    { date: 'Month 3', portfolioValue: 0, investedCapital: 0, totalProfit: 0, dailyEarnings: 0 }
  ],
  '1Y': [
    { date: 'Q1', portfolioValue: 0, investedCapital: 0, totalProfit: 0, dailyEarnings: 0 },
    { date: 'Q2', portfolioValue: 0, investedCapital: 0, totalProfit: 0, dailyEarnings: 0 },
    { date: 'Q3', portfolioValue: 0, investedCapital: 0, totalProfit: 0, dailyEarnings: 0 },
    { date: 'Q4', portfolioValue: 0, investedCapital: 0, totalProfit: 0, dailyEarnings: 0 }
  ]
};

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Account Security Active',
    message: 'Your account is protected with 2FA device recognition and verified status.',
    timestamp: 'Just now',
    read: true,
    type: 'security'
  }
];

export const CRYPTO_RATES = [
  { pair: 'DAILY ROI', price: '7.50% FIXED', change: 'Automated', positive: true },
  { pair: 'REFERRAL BONUS', price: '10.00% DIRECT', change: 'On Stake', positive: true },
  { pair: 'LIPA NA M-PESA', price: 'INSTANT STK', change: 'KES Direct', positive: true },
  { pair: 'USDT / KES', price: 'Ksh 130.00', change: '+0.25%', positive: true },
  { pair: 'USD / KES', price: 'Ksh 129.50', change: '+0.15%', positive: true },
  { pair: 'BTC / KES', price: 'Ksh 12,480,000', change: '+4.12%', positive: true },
  { pair: 'ETH / KES', price: 'Ksh 428,500', change: '+3.28%', positive: true }
];


