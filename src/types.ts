export interface UserProfile {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  mpesaNumber: string;
  country: string;
  referralCode: string;
  referredBy: string;
  joinedDate: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | string;
  kycStatus: 'Verified' | 'Pending' | 'Unverified';
  avatar: string;
  twoFactorEnabled: boolean;
  walletAddressUSDT: string;
  walletAddressBTC?: string;
  walletAddressETH?: string;
  firstDepositTime?: string;
  lastDepositTime?: string;
  role?: 'superadmin' | 'admin' | 'user';
  isAdmin?: boolean;
  knownDeviceIds?: string[];
  lastLoginDevice?: string;
  lastLoginDate?: string;
}

export interface PlatformContacts {
  mpesaPaybill: string;
  mpesaTillNumber: string;
  mpesaMerchantName?: string;
  supportPhone: string;
  supportEmail: string;
  officeLocation: string;
  whatsappSupport: string;
  whatsappGroupLink?: string;
  telegramSupport: string;
  kesUsdExchangeRate: number; // e.g. 130 KES per 1 USD
  cryptoDepositWallets?: {
    usdtBep20: string;
    btc: string;
    usdtTrc20?: string;
    usdtErc20?: string;
    eth?: string;
  };
}

export interface WalletState {
  totalBalance: number;
  availableCash: number;
  activeInvested: number;
  totalEarnings: number;
  todayYield: number;
  referralEarnings: number;
  pendingWithdrawals: number;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  tagline: string;
  dailyRoi: number; // percentage e.g. 2.5
  durationDays: number;
  minDeposit: number;
  maxDeposit: number;
  principalReturn: boolean;
  colorTheme: string;
  popular?: boolean;
  features: string[];
  totalInvestors: number;
  totalPoolValue: number;
  imageUrl?: string;
}

export interface ActiveInvestment {
  id: string;
  planId: string;
  planName: string;
  investedAmount: number;
  dailyRoi: number;
  dailyYieldAmount: number;
  totalEarned: number;
  startDate: string;
  maturityDate: string;
  daysPassed: number;
  totalDays: number;
  status: 'ACTIVE' | 'COMPLETED';
  lastPayoutTime: string;
  autoReinvest: boolean;
  imageUrl?: string;
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'INVESTMENT' | 'ROI_PAYOUT' | 'REFERRAL_BONUS';
export type TransactionStatus = 'COMPLETED' | 'PROCESSING' | 'PENDING' | 'FAILED';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: 'USDT' | 'BTC' | 'ETH' | 'USD' | 'KES';
  fee: number;
  status: TransactionStatus;
  timestamp: string;
  txHash: string;
  methodOrAddress: string;
  note: string;
  mpesaReceiptNumber?: string;
}

export interface ReferralMember {
  id: string;
  username: string;
  tierLevel: 1 | 2 | 3;
  joinedDate: string;
  activeDeposits: number;
  commissionEarned: number;
  status: 'Active' | 'Inactive';
}

export interface ChartDataPoint {
  date: string;
  portfolioValue: number;
  investedCapital: number;
  totalProfit: number;
  dailyEarnings: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'payout' | 'deposit' | 'referral' | 'security' | 'mpesa';
}

export interface UserAccount {
  user: UserProfile;
  wallet: WalletState;
  password?: string;
}


export interface ProfileCreationData {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  mpesaNumber: string;
  country: string;
  password?: string;
  referralCode?: string;
  avatar?: string;
  avatarUrl?: string;
  walletAddressUSDT?: string;
  initialDepositUSD?: number;
  initialDepositKES?: number;
  initialDeposit?: number;
}


