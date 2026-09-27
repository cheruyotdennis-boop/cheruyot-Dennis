/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  INITIAL_USER, 
  INITIAL_WALLET, 
  INITIAL_ACTIVE_INVESTMENTS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_NOTIFICATIONS,
  INVESTMENT_PLANS,
  DEFAULT_CONTACTS 
} from './data/mockData';
import { 
  UserProfile, 
  WalletState, 
  ActiveInvestment, 
  Transaction, 
  NotificationItem, 
  InvestmentPlan,
  PlatformContacts,
  ProfileCreationData
} from './types';
import { Header } from './components/Header';
import { AuthScreen } from './components/AuthScreen';
import { DashboardOverview } from './components/DashboardOverview';
import { InvestmentsView } from './components/InvestmentsView';
import { FinancialAnalyticsView } from './components/FinancialAnalyticsView';
import { TransactionHistoryView } from './components/TransactionHistoryView';
import { ReferralAffiliateView } from './components/ReferralAffiliateView';
import { SecurityKycView } from './components/SecurityKycView';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { InvestModal } from './components/InvestModal';
import { MpesaModal } from './components/MpesaModal';
import { ContactSupportModal } from './components/ContactSupportModal';
import { CreateProfileModal } from './components/CreateProfileModal';
import { LoginModal } from './components/LoginModal';
import { Device2faModal } from './components/Device2faModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AdminCustomerDatabase } from './components/AdminCustomerDatabase';
import { Lock, PhoneCall, MessageSquare } from 'lucide-react';
import { safeGetItem, safeSetItem } from './utils/storage';
import { getInvestmentImage } from './utils/investmentAssets';
import { roundCurrency, generateUniqueReferralCode } from './utils/security';
import { isDeviceRecognized, registerCurrentDevice, generateDevice2faOtp } from './utils/deviceSecurity';

import bgWallpaper from './assets/images/quantiq_prime_bg_1787826829164.jpg';

export default function App() {
  // Read referral code from window query parameter if present (e.g. ?ref=749216)
  const [initialRefCode, setInitialRefCode] = useState(() => generateUniqueReferralCode());

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location && typeof window.location.search === 'string') {
        const match = window.location.search.match(/[?&]ref=([^&]+)/);
        if (match && match[1]) {
          const parsed = decodeURIComponent(match[1]);
          if (parsed && parsed !== '505031') {
            setInitialRefCode(parsed);
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Saved Profiles List for multi-profile switching
  const [savedProfiles, setSavedProfiles] = useState<UserProfile[]>(() => {
    return safeGetItem<UserProfile[]>('quantiq_saved_profiles', [INITIAL_USER]);
  });

  // State with LocalStorage persistence - default to false for new public visitors on first load
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return safeGetItem<boolean>('quantiq_auth', false);
  });

  const [isGuestBrowsing, setIsGuestBrowsing] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'register' | 'login'>('login');
  const [selectedPlanForAuth, setSelectedPlanForAuth] = useState<InvestmentPlan | null>(null);

  const [user, setUser] = useState<UserProfile>(() => {
    const loaded = safeGetItem<UserProfile>('quantiq_user', INITIAL_USER);
    if (loaded && (loaded.referralCode === '505031' || !loaded.referralCode)) {
      return {
        ...loaded,
        referralCode: generateUniqueReferralCode(),
        referredBy: loaded.referredBy?.includes('505031') ? 'Quantiq Executive Sponsor' : loaded.referredBy
      };
    }
    return loaded;
  });

  const [wallet, setWallet] = useState<WalletState>(() => {
    const loaded = safeGetItem<WalletState>('quantiq_wallet', INITIAL_WALLET);
    // Purge legacy placeholder figures
    if (loaded && (loaded.totalBalance === 84850 || loaded.activeInvested === 70000)) {
      return INITIAL_WALLET;
    }
    return loaded || INITIAL_WALLET;
  });

  const [contacts, setContacts] = useState<PlatformContacts>(() => {
    const loaded = safeGetItem<PlatformContacts>('quantiq_contacts', DEFAULT_CONTACTS);
    if (loaded) {
      let updated = { ...loaded };
      if (updated.mpesaTillNumber !== '1722023') {
        updated.mpesaTillNumber = '1722023';
        updated.mpesaPaybill = '1722023';
      }
      updated.mpesaMerchantName = 'Smartchoice Ventures';
      if (updated.whatsappSupport !== '+17712502005') {
        updated.whatsappSupport = '+17712502005';
      }
      if (!updated.whatsappGroupLink || updated.whatsappGroupLink !== 'https://chat.whatsapp.com/C0LXeuksKfRIxC8WO2aQv2') {
        updated.whatsappGroupLink = 'https://chat.whatsapp.com/C0LXeuksKfRIxC8WO2aQv2';
      }
      return updated;
    }
    return DEFAULT_CONTACTS;
  });

  const [activeInvestments, setActiveInvestments] = useState<ActiveInvestment[]>(() => {
    const loaded = safeGetItem<ActiveInvestment[]>('quantiq_investments', INITIAL_ACTIVE_INVESTMENTS);
    if (Array.isArray(loaded)) {
      return loaded.filter(inv => inv.id !== 'inv_9041' && inv.id !== 'inv_8820');
    }
    return [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const loaded = safeGetItem<Transaction[]>('quantiq_txs', INITIAL_TRANSACTIONS);
    if (Array.isArray(loaded)) {
      const purgeIds = ['tx_98124', 'tx_98012', 'tx_97645', 'tx_96411', 'tx_95209', 'tx_94301'];
      return loaded.filter(tx => !purgeIds.includes(tx.id));
    }
    return [];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const loaded = safeGetItem<NotificationItem[]>('quantiq_notifications', INITIAL_NOTIFICATIONS);
    if (Array.isArray(loaded)) {
      return loaded.filter(n => n.id !== 'n2' && n.id !== 'n3' && !n.title.includes('Daily 7.5% ROI Credited'));
    }
    return INITIAL_NOTIFICATIONS;
  });

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Global Admin Access Verification
  const isUserAdmin = Boolean(
    isAuthenticated && (
      user.isAdmin === true || 
      user.role === 'admin' || 
      user.role === 'superadmin' || 
      user.email?.toLowerCase().trim() === 'admin@quantiqprime.com' ||
      user.email?.toLowerCase().trim() === 'cheruyot.dennis@student.moringaschool.com'
    )
  );
  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);
  const [isInvestOpen, setIsInvestOpen] = useState<boolean>(false);
  const [isMpesaOpen, setIsMpesaOpen] = useState<boolean>(false);
  const [isContactsOpen, setIsContactsOpen] = useState<boolean>(false);
  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [selectedPlanForInvest, setSelectedPlanForInvest] = useState<InvestmentPlan | null>(null);

  // Device 2FA verification state for login, registration, and unrecognized devices
  const [pending2faUser, setPending2faUser] = useState<{
    user: Partial<UserProfile>;
    initialDeposit?: number;
    expectedCode: string;
    mode?: 'login' | 'register' | 'device';
    channel?: 'phone' | 'email';
  } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    safeSetItem('quantiq_saved_profiles', savedProfiles);
  }, [savedProfiles]);

  useEffect(() => {
    safeSetItem('quantiq_auth', isAuthenticated);
  }, [isAuthenticated]);

  useEffect(() => {
    safeSetItem('quantiq_user', user);
  }, [user]);

  useEffect(() => {
    safeSetItem('quantiq_wallet', wallet);
    if (user?.email) {
      safeSetItem(`quantiq_wallet_${user.email.toLowerCase()}`, wallet);
    }
  }, [wallet, user?.email]);

  useEffect(() => {
    safeSetItem('quantiq_contacts', contacts);
  }, [contacts]);

  useEffect(() => {
    safeSetItem('quantiq_investments', activeInvestments);
    if (user?.email) {
      safeSetItem(`quantiq_investments_${user.email.toLowerCase()}`, activeInvestments);
    }
  }, [activeInvestments, user?.email]);

  useEffect(() => {
    safeSetItem('quantiq_txs', transactions);
    if (user?.email) {
      safeSetItem(`quantiq_txs_${user.email.toLowerCase()}`, transactions);
    }
  }, [transactions, user?.email]);

  useEffect(() => {
    safeSetItem('quantiq_notifications', notifications);
  }, [notifications]);

  // Handlers
  const handleLoginAttempt = (
    userData: Partial<UserProfile>, 
    initialDeposit?: number,
    options?: { mode?: 'login' | 'register' | 'device'; channel?: 'phone' | 'email'; skipOtp?: boolean }
  ) => {
    // Proceed directly to login and session establishment
    completeLogin(userData, initialDeposit, true);
    setIsLoginModalOpen(false);
    setIsCreateProfileOpen(false);
  };

  const handle2faSuccess = (trustedDevice: boolean) => {
    if (!pending2faUser) return;
    const { user: u, initialDeposit } = pending2faUser;
    completeLogin(u, initialDeposit, trustedDevice);
    setPending2faUser(null);
  };

  const completeLogin = (userData: Partial<UserProfile>, initialDeposit?: number, trustedDevice = false) => {
    let updatedDevices = userData.knownDeviceIds || [];
    if (trustedDevice) {
      updatedDevices = registerCurrentDevice(userData);
    }

    const isMasterAdmin = 
      userData.email?.toLowerCase() === 'admin@quantiqprime.com' ||
      userData.email?.toLowerCase() === 'cheruyot.dennis@student.moringaschool.com' || 
      userData.role === 'superadmin';

    const cleanReferralCode = (!userData.referralCode || userData.referralCode === '505031')
      ? generateUniqueReferralCode()
      : userData.referralCode;

    const fullUser: UserProfile = {
      id: userData.id || `usr_${Date.now()}`,
      fullName: userData.fullName || 'Investor Member',
      username: userData.username || 'VIPInvestor',
      email: userData.email || 'investor@quantiqprime.com',
      phone: userData.phone || '+254 712 345 678',
      mpesaNumber: userData.mpesaNumber || '0712345678',
      country: userData.country || 'Kenya',
      referralCode: cleanReferralCode,
      referredBy: userData.referredBy && !userData.referredBy.includes('505031') ? userData.referredBy : 'Quantiq Executive Sponsor',
      joinedDate: userData.joinedDate || new Date().toISOString().split('T')[0],
      tier: userData.tier || 'Gold VIP',
      kycStatus: userData.kycStatus || 'Verified',
      avatar: userData.avatar || 'luxury',
      twoFactorEnabled: userData.twoFactorEnabled ?? true,
      walletAddressUSDT: userData.walletAddressUSDT || 'TXq7j8kP39LmNxR8w92Z0A1m4kVyTe6pQc',
      isAdmin: isMasterAdmin ? true : Boolean(userData.isAdmin),
      role: isMasterAdmin ? 'superadmin' : (userData.role || (userData.isAdmin ? 'admin' : 'user')),
      knownDeviceIds: updatedDevices,
      lastLoginDevice: navigator.userAgent.slice(0, 80),
      lastLoginDate: new Date().toISOString()
    };

    setUser(fullUser);

    // Customer-specific actual figures loader
    const userEmailKey = (fullUser.email || 'investor@quantiqprime.com').toLowerCase();
    const savedUserWallet = safeGetItem<WalletState | null>(`quantiq_wallet_${userEmailKey}`, null);
    const savedUserInvestments = safeGetItem<ActiveInvestment[] | null>(`quantiq_investments_${userEmailKey}`, null);
    const savedUserTxs = safeGetItem<Transaction[] | null>(`quantiq_txs_${userEmailKey}`, null);

    if (savedUserWallet && savedUserWallet.totalBalance !== 84850 && savedUserWallet.activeInvested !== 70000) {
      // Customer has existing actual wallet on this device
      setWallet(savedUserWallet);
      setActiveInvestments(savedUserInvestments ? savedUserInvestments.filter(i => i.id !== 'inv_9041' && i.id !== 'inv_8820') : []);
      setTransactions(savedUserTxs ? savedUserTxs.filter(t => !['tx_98124', 'tx_98012', 'tx_97645', 'tx_96411', 'tx_95209', 'tx_94301'].includes(t.id)) : []);
    } else {
      // New or uninitialized customer account: actual figures start from 0 (or actual starter deposit if provided)
      const startingCash = (initialDeposit !== undefined && initialDeposit > 0) ? initialDeposit : 0;
      const cleanWallet: WalletState = {
        totalBalance: startingCash,
        availableCash: startingCash,
        activeInvested: 0,
        totalEarnings: 0,
        todayYield: 0,
        referralEarnings: 0,
        pendingWithdrawals: 0
      };
      setWallet(cleanWallet);
      setActiveInvestments([]);
      setTransactions(startingCash > 0 ? [{
        id: `tx_${Date.now()}`,
        type: 'DEPOSIT',
        amount: startingCash,
        currency: 'KES',
        fee: 0,
        status: 'COMPLETED',
        timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} EAT`,
        txHash: `0x${Math.random().toString(16).substring(2)}`,
        methodOrAddress: 'Starter Deposit',
        note: `Initial account funding for ${fullUser.fullName}`
      }] : []);
    }

    // Add to saved profiles registry if not already present
    setSavedProfiles(prev => {
      const exists = prev.some(p => p.email.toLowerCase() === fullUser.email.toLowerCase());
      if (exists) {
        return prev.map(p => p.email.toLowerCase() === fullUser.email.toLowerCase() ? fullUser : p);
      }
      return [fullUser, ...prev];
    });

    setIsAuthenticated(true);
    setIsGuestBrowsing(false);
    
    // If the user was redirected to auth after selecting a plan, open the invest modal for that plan
    if (selectedPlanForAuth) {
      setSelectedPlanForInvest(selectedPlanForAuth);
      setIsInvestOpen(true);
      setSelectedPlanForAuth(null);
    } else {
      setActiveTab('overview');
    }
  };

  const handleCreateProfile = (data: ProfileCreationData) => {
    const finalRefCode = (!data.referralCode || data.referralCode === '505031')
      ? generateUniqueReferralCode()
      : data.referralCode;

    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      fullName: data.fullName,
      username: data.username,
      email: data.email,
      phone: data.phone || '+254 712 345 678',
      mpesaNumber: data.mpesaNumber || '0712345678',
      country: data.country || 'Kenya',
      referralCode: finalRefCode,
      referredBy: `Executive Sponsor`,
      joinedDate: new Date().toISOString().split('T')[0],
      tier: (data.initialDepositUSD || 0) >= 10000 || (data.initialDepositKES || 0) >= 200000 ? 'Platinum (VIP)' : (data.initialDepositUSD || 0) >= 2500 || (data.initialDepositKES || 0) >= 100000 ? 'Gold' : (data.initialDepositUSD || 0) >= 500 || (data.initialDepositKES || 0) >= 30000 ? 'Silver' : 'Bronze',
      kycStatus: 'Verified',
      avatar: data.avatar || 'luxury',
      twoFactorEnabled: true,
      walletAddressUSDT: data.walletAddressUSDT || ''
    };

    const depositAmount = data.initialDepositKES || data.initialDepositUSD || 0;
    const newWallet: WalletState = {
      totalBalance: depositAmount,
      availableCash: depositAmount,
      activeInvested: 0,
      totalEarnings: 0,
      todayYield: 0,
      referralEarnings: 0,
      pendingWithdrawals: 0
    };

    setUser(newUser);
    setWallet(newWallet);
    setActiveInvestments([]);

    // Add initial welcome deposit transaction only if a deposit was actually made
    const initialTxs: Transaction[] = depositAmount > 0 ? [{
      id: `tx_${Date.now().toString().slice(-5)}`,
      type: 'DEPOSIT',
      amount: depositAmount,
      currency: 'KES',
      fee: 0,
      status: 'COMPLETED',
      timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} EAT`,
      txHash: `0x${Math.random().toString(16).substring(2)}`,
      methodOrAddress: `Starter Deposit (M-PESA / Bank)`,
      note: `Welcome account funding for ${data.fullName}`
    }] : [];
    setTransactions(initialTxs);

    // Add welcome notification
    const welcomeNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      title: `Welcome to Fortune Investment, ${data.fullName.split(' ')[0]}!`,
      message: depositAmount > 0 
        ? `Your profile has been created and credited with Ksh ${depositAmount.toLocaleString('en-KE')}. You can now subscribe to yield plans or deposit via M-PESA.`
        : `Your profile has been created. You can now fund your account via Lipa Na M-PESA or subscribe to a high-yield investment package.`,
      timestamp: 'Just now',
      read: false,
      type: 'deposit'
    };
    setNotifications([welcomeNotif]);

    // Save profile to registry
    setSavedProfiles(prev => [newUser, ...prev.filter(p => p.email !== newUser.email)]);

    setIsAuthenticated(true);
    setIsGuestBrowsing(false);
    setActiveTab('overview');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsGuestBrowsing(false);
    setAuthMode('login');
  };

  const handleOpenLogin = () => {
    if (isAuthenticated) {
      setIsLoginModalOpen(true);
    } else {
      setAuthMode('login');
      setIsGuestBrowsing(false);
      setIsAuthenticated(false);
    }
  };

  const handleOpenRegister = () => {
    if (isAuthenticated) {
      setIsCreateProfileOpen(true);
    } else {
      setAuthMode('register');
      setIsGuestBrowsing(false);
      setIsAuthenticated(false);
    }
  };

  const handleRedirectToAuth = (plan: InvestmentPlan) => {
    setSelectedPlanForAuth(plan);
    setAuthMode('login');
    setIsGuestBrowsing(false);
    setIsAuthenticated(false);
  };

  const handleOpenInvestWithPlan = (plan: InvestmentPlan) => {
    if (!isAuthenticated) {
      handleRedirectToAuth(plan);
      return;
    }
    setSelectedPlanForInvest(plan);
    setIsInvestOpen(true);
  };

  const handleConfirmInvest = (plan: InvestmentPlan, amount: number) => {
    const cleanAmount = roundCurrency(amount);
    const dailyYield = roundCurrency(cleanAmount * (plan.dailyRoi / 100));

    // 1. Lock capital: deduct availableCash, increase activeInvested (balance is locked until maturity)
    setWallet(prev => ({
      ...prev,
      availableCash: roundCurrency(prev.availableCash - cleanAmount),
      activeInvested: roundCurrency(prev.activeInvested + cleanAmount),
      todayYield: roundCurrency(prev.todayYield + dailyYield)
    }));

    // 2. Add active investment contract
    const newInv: ActiveInvestment = {
      id: `inv_${Date.now().toString().slice(-4)}`,
      planId: plan.id,
      planName: `${plan.name} (${plan.dailyRoi}% Daily)`,
      investedAmount: cleanAmount,
      dailyRoi: plan.dailyRoi,
      dailyYieldAmount: dailyYield,
      totalEarned: 0,
      startDate: new Date().toISOString().split('T')[0],
      maturityDate: new Date(Date.now() + plan.durationDays * 86400000).toISOString().split('T')[0],
      daysPassed: 0,
      totalDays: plan.durationDays,
      status: 'ACTIVE',
      lastPayoutTime: 'Scheduled in 24h',
      autoReinvest: false,
      imageUrl: plan.imageUrl || getInvestmentImage(plan.name)
    };
    setActiveInvestments(prev => [newInv, ...prev]);

    // 3. Create Transaction
    const newTx: Transaction = {
      id: `tx_${Date.now().toString().slice(-5)}`,
      type: 'INVESTMENT',
      amount: cleanAmount,
      currency: 'KES',
      fee: 0,
      status: 'COMPLETED',
      timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} EAT`,
      txHash: `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
      methodOrAddress: `${plan.name} Pool`,
      note: `Active allocation for ${plan.durationDays} days @ ${plan.dailyRoi}% daily (Withdraw after 24h)`
    };
    setTransactions(prev => [newTx, ...prev]);

    // 4. Notification
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      title: 'Investment Allocation Activated',
      message: `Successfully allocated Ksh ${cleanAmount.toLocaleString('en-KE')} in ${plan.name} for ${plan.durationDays} days. Daily yield is +Ksh ${dailyYield.toLocaleString('en-KE', { minimumFractionDigits: 2 })}. Withdrawals available every 24h.`,
      timestamp: 'Just now',
      read: false,
      type: 'payout'
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Track deposit timestamp for 24h withdrawal rule
    setUser(prev => ({
      ...prev,
      firstDepositTime: prev.firstDepositTime || new Date().toISOString(),
      lastDepositTime: new Date().toISOString()
    }));
  };

  const handleReleaseMaturedContract = (contractId: string) => {
    const contract = activeInvestments.find(inv => inv.id === contractId);
    if (!contract) return;

    // Release locked capital to available cash upon maturity
    setWallet(prev => ({
      ...prev,
      availableCash: roundCurrency(prev.availableCash + contract.investedAmount),
      activeInvested: Math.max(0, roundCurrency(prev.activeInvested - contract.investedAmount)),
      todayYield: Math.max(0, roundCurrency(prev.todayYield - contract.dailyYieldAmount))
    }));

    // Remove or complete contract
    setActiveInvestments(prev => prev.filter(inv => inv.id !== contractId));

    // Log transaction
    const releaseTx: Transaction = {
      id: `tx_${Date.now().toString().slice(-5)}`,
      type: 'DEPOSIT',
      amount: roundCurrency(contract.investedAmount),
      currency: 'KES',
      fee: 0,
      status: 'COMPLETED',
      timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} EAT`,
      txHash: `0x${Math.random().toString(16).substring(2)}`,
      methodOrAddress: `${contract.planName} (Maturity Release)`,
      note: `100% Principal unlocked from matured contract to available cash`
    };
    setTransactions(prev => [releaseTx, ...prev]);

    // Add Notification
    const notif: NotificationItem = {
      id: `notif_${Date.now()}`,
      title: 'Contract Capital Released',
      message: `Ksh ${contract.investedAmount.toLocaleString('en-KE')} principal from ${contract.planName} has matured and unlocked to your available liquid cash.`,
      timestamp: 'Just now',
      read: false,
      type: 'payout'
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const handleConfirmDeposit = (amount: number, currency: 'USDT' | 'BTC' | 'ETH' | 'USD' | 'KES', txHash: string, method: string) => {
    const cleanAmount = roundCurrency(amount);
    // 1. Credit wallet
    setWallet(prev => ({
      ...prev,
      totalBalance: roundCurrency(prev.totalBalance + cleanAmount),
      availableCash: roundCurrency(prev.availableCash + cleanAmount)
    }));

    // 2. Log transaction
    const newTx: Transaction = {
      id: `tx_${Date.now().toString().slice(-5)}`,
      type: 'DEPOSIT',
      amount: cleanAmount,
      currency: currency,
      fee: 0,
      status: 'COMPLETED',
      timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} EAT`,
      txHash: txHash,
      methodOrAddress: method,
      note: `Instant deposit confirmed & credited`
    };
    setTransactions(prev => [newTx, ...prev]);

    // 3. Notification
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      title: 'Deposit Received & Credited',
      message: `Ksh ${cleanAmount.toLocaleString('en-KE')} (${currency}) has been credited to your available cash balance. Receipt: ${txHash}.`,
      timestamp: 'Just now',
      read: false,
      type: 'deposit'
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Record deposit timestamp
    setUser(prev => ({
      ...prev,
      firstDepositTime: prev.firstDepositTime || new Date().toISOString(),
      lastDepositTime: new Date().toISOString()
    }));
  };

  const handleConfirmWithdrawal = (amount: number, address: string, txHash: string) => {
    const cleanAmount = roundCurrency(amount);
    // 1. Update wallet balance cleanly
    setWallet(prev => ({
      ...prev,
      totalBalance: Math.max(0, roundCurrency(prev.totalBalance - cleanAmount)),
      availableCash: Math.max(0, roundCurrency(prev.availableCash - cleanAmount))
    }));

    // 2. Log transaction
    const newTx: Transaction = {
      id: `tx_${Date.now().toString().slice(-5)}`,
      type: 'WITHDRAWAL',
      amount: cleanAmount,
      currency: 'KES',
      fee: 0,
      status: 'COMPLETED',
      timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} EAT`,
      txHash: txHash,
      methodOrAddress: address.startsWith('254') || address.startsWith('07') ? `M-PESA (${address})` : `Crypto (${address.slice(0, 8)}...${address.slice(-4)})`,
      note: 'Funds payout dispatched to personal account'
    };
    setTransactions(prev => [newTx, ...prev]);

    // 3. Notification
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      title: 'Withdrawal Successful & Dispatched',
      message: `Ksh ${cleanAmount.toLocaleString('en-KE')} has been dispatched to your account (${address}). Receipt: ${txHash}.`,
      timestamp: 'Just now',
      read: false,
      type: 'deposit'
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // M-PESA Handlers
  const handleConfirmMpesaDeposit = (usdAmount: number, kesAmount: number, receiptCode: string, phone: string) => {
    const cleanKes = roundCurrency(kesAmount);
    // 1. Credit wallet
    setWallet(prev => ({
      ...prev,
      totalBalance: roundCurrency(prev.totalBalance + cleanKes),
      availableCash: roundCurrency(prev.availableCash + cleanKes)
    }));

    // 2. Log M-PESA Transaction
    const newTx: Transaction = {
      id: `tx_${Date.now().toString().slice(-5)}`,
      type: 'DEPOSIT',
      amount: cleanKes,
      currency: 'KES',
      fee: 0,
      status: 'COMPLETED',
      timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} EAT`,
      txHash: receiptCode,
      methodOrAddress: `Lipa Na M-PESA Express (${phone})`,
      note: `M-PESA KES ${cleanKes.toLocaleString()} via Till 1722023 - Smartchoice Ventures (Receipt: ${receiptCode})`,
      mpesaReceiptNumber: receiptCode
    };
    setTransactions(prev => [newTx, ...prev]);

    // 3. Notification
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      title: 'M-PESA Deposit Credited',
      message: `KES ${cleanKes.toLocaleString()} credited to your account from ${phone}. Receipt: ${receiptCode}.`,
      timestamp: 'Just now',
      read: false,
      type: 'mpesa'
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleConfirmMpesaWithdrawal = (usdAmount: number, kesAmount: number, receiptCode: string, phone: string) => {
    const cleanKes = roundCurrency(kesAmount);
    // 1. Deduct cash cleanly
    setWallet(prev => ({
      ...prev,
      totalBalance: Math.max(0, roundCurrency(prev.totalBalance - cleanKes)),
      availableCash: Math.max(0, roundCurrency(prev.availableCash - cleanKes))
    }));

    // 2. Log M-PESA Transaction
    const newTx: Transaction = {
      id: `tx_${Date.now().toString().slice(-5)}`,
      type: 'WITHDRAWAL',
      amount: cleanKes,
      currency: 'KES',
      fee: 0,
      status: 'COMPLETED',
      timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} EAT`,
      txHash: receiptCode,
      methodOrAddress: `M-PESA B2C Payout (${phone})`,
      note: `Instant cashout KES ${cleanKes.toLocaleString()} to Safaricom ${phone} (Receipt: ${receiptCode})`,
      mpesaReceiptNumber: receiptCode
    };
    setTransactions(prev => [newTx, ...prev]);

    // 3. Notification
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      title: 'M-PESA Payout Dispatched',
      message: `KES ${cleanKes.toLocaleString()} sent to your M-PESA line (${phone}). Receipt: ${receiptCode}.`,
      timestamp: 'Just now',
      read: false,
      type: 'mpesa'
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleClaimDailyYield = () => {
    const yieldAmount = roundCurrency(wallet.todayYield);
    if (yieldAmount <= 0) return;

    // Credit available cash & total profit
    setWallet(prev => ({
      ...prev,
      totalBalance: roundCurrency(prev.totalBalance + yieldAmount),
      availableCash: roundCurrency(prev.availableCash + yieldAmount),
      totalEarnings: roundCurrency(prev.totalEarnings + yieldAmount)
    }));

    // Log transaction
    const newTx: Transaction = {
      id: `tx_${Date.now().toString().slice(-5)}`,
      type: 'ROI_PAYOUT',
      amount: yieldAmount,
      currency: 'KES',
      fee: 0,
      status: 'COMPLETED',
      timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} EAT`,
      txHash: `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
      methodOrAddress: 'Fortune Smart Contract Yield Engine',
      note: `Daily automated ROI distribution claimed to wallet`
    };
    setTransactions(prev => [newTx, ...prev]);

    // Notification
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      title: 'Daily ROI Claimed',
      message: `Ksh ${yieldAmount.toLocaleString('en-KE', { minimumFractionDigits: 2 })} has been added to your available cash balance.`,
      timestamp: 'Just now',
      read: false,
      type: 'payout'
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // If unauthenticated and not browsing as guest
  if (!isAuthenticated && !isGuestBrowsing) {
    return (
      <div className="min-h-screen bg-[#07090E] flex flex-col font-sans selection:bg-amber-500 selection:text-black relative">
        <AuthScreen 
          onLoginSuccess={(userData, initialDep) => {
            handleLoginAttempt(userData, initialDep, { skipOtp: true });
          }}
          defaultReferralCode={initialRefCode && initialRefCode !== '505031' ? initialRefCode : ''}
          savedProfiles={savedProfiles}
          initialMode={authMode}
          selectedPlan={selectedPlanForAuth}
          onBrowsePublic={() => {
            setIsGuestBrowsing(true);
            setIsAuthenticated(false);
            setActiveTab('investments');
          }}
          onOpenContacts={() => setIsContactsOpen(true)}
        />

        {/* 2FA Verification Modal for Login & Registration */}
        {pending2faUser && (
          <Device2faModal
            isOpen={Boolean(pending2faUser)}
            user={pending2faUser.user}
            expectedCode={pending2faUser.expectedCode}
            mode={pending2faUser.mode || 'login'}
            initialChannel={pending2faUser.channel || 'phone'}
            onSuccess={handle2faSuccess}
            onCancel={() => setPending2faUser(null)}
            onResendCode={(channel) => {
              const newOtp = generateDevice2faOtp();
              setPending2faUser(prev => prev ? { ...prev, expectedCode: newOtp, channel } : null);
              return newOtp;
            }}
          />
        )}

        <ContactSupportModal
          isOpen={isContactsOpen}
          onClose={() => setIsContactsOpen(false)}
          contacts={contacts}
          user={user}
        />
      </div>
    );
  }

  const renderDashboardContent = () => (
    <>
      {/* App Header with conditional Log In / Register / Account buttons */}
      <div className="relative z-50">
        <Header
          user={user}
          wallet={wallet}
          notifications={notifications}
          isAuthenticated={isAuthenticated}
          onOpenLogin={handleOpenLogin}
          onOpenRegister={handleOpenRegister}
          onOpenDeposit={() => setIsDepositOpen(true)}
          onOpenWithdraw={() => setIsWithdrawOpen(true)}
          onOpenMpesa={() => setIsMpesaOpen(true)}
          onOpenContacts={() => setIsContactsOpen(true)}
          onOpenCreateProfile={() => setIsCreateProfileOpen(true)}
          onOpenReferral={() => setActiveTab('referrals')}
          onLogout={handleLogout}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>

      {/* Guest Mode Banner if browsing unauthenticated */}
      {!isAuthenticated && (
        <div className="relative z-40 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 py-2.5 px-4 text-xs font-black shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>You are viewing Quantiq Prime Yield Plans in Guest Mode. Sign in or register to lock in investment capital and earn 7.5% daily.</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenLogin}
                className="bg-slate-950 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-slate-900 cursor-pointer"
              >
                Log In
              </button>
              <button
                onClick={handleOpenRegister}
                className="bg-amber-950 text-amber-300 px-3 py-1 rounded-lg text-xs font-bold hover:bg-amber-900 cursor-pointer"
              >
                Register Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10 pb-24 md:pb-8">
        
        {activeTab === 'overview' && (
          <DashboardOverview
            user={user}
            wallet={wallet}
            activeInvestments={activeInvestments}
            transactions={transactions}
            onOpenDeposit={() => setIsDepositOpen(true)}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
            onOpenMpesa={() => setIsMpesaOpen(true)}
            onOpenContacts={() => setIsContactsOpen(true)}
            onOpenInvest={() => {
              setSelectedPlanForInvest(INVESTMENT_PLANS[1]);
              setIsInvestOpen(true);
            }}
            onOpenReferral={() => setActiveTab('referrals')}
            onViewAllTransactions={() => setActiveTab('transactions')}
            onClaimDailyYield={handleClaimDailyYield}
          />
        )}

        {activeTab === 'investments' && (
          <InvestmentsView
            wallet={wallet}
            activeInvestments={activeInvestments}
            isAuthenticated={isAuthenticated}
            onSelectPlanToInvest={handleOpenInvestWithPlan}
            onRedirectToAuth={handleRedirectToAuth}
            onReleaseMaturedContract={handleReleaseMaturedContract}
          />
        )}

        {activeTab === 'analytics' && (
          <FinancialAnalyticsView
            wallet={wallet}
            activeInvestments={activeInvestments}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionHistoryView
            transactions={transactions}
          />
        )}

        {activeTab === 'referrals' && (
          <ReferralAffiliateView
            user={user}
            wallet={wallet}
          />
        )}

        {activeTab === 'security' && (
          <SecurityKycView
            user={user}
            onUpdateUser={(updated) => setUser(prev => ({ ...prev, ...updated }))}
            onOpenCreateProfile={() => setIsCreateProfileOpen(true)}
          />
        )}

        {activeTab === 'database' && (
          isUserAdmin ? (
            <AdminCustomerDatabase
              savedProfiles={savedProfiles}
              contacts={contacts}
              onUpdateContacts={(updated) => setContacts(updated)}
              onUpdateProfiles={(newProfiles) => {
                setSavedProfiles(newProfiles);
                const me = newProfiles.find(p => p.email.toLowerCase() === user.email.toLowerCase());
                if (me) {
                  setUser(me);
                }
              }}
            />
          ) : (
            <div className="p-8 text-center max-w-md mx-auto my-16 bg-[#0C101A] border border-rose-500/30 rounded-3xl text-slate-300 shadow-2xl">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Restricted Access</h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                The Customer Database is strictly reserved for authenticated Platform Administrators. Please sign in with an Administrator account to manage client records.
              </p>
              <button
                onClick={() => setActiveTab('overview')}
                className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer shadow-lg active:scale-95 transition-all"
              >
                Return to Dashboard
              </button>
            </div>
          )
        )}

      </main>

      {/* Mobile Bottom Navigation for Phone Viewports */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMpesa={() => setIsMpesaOpen(true)}
        onOpenContacts={() => setIsContactsOpen(true)}
      />

      {/* Footer */}
      <footer className="mt-8 border-t border-neutral-800 bg-black py-8 text-xs text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <span className="font-black text-amber-400 uppercase tracking-wider font-heading">QUANTIQ PRIME</span>
            <span>•</span>
            <span className="text-slate-300">Trade Smart | Invest Wise | Grow Together</span>
            <span>•</span>
            <span className="font-mono text-amber-300">Ref #{user.referralCode}</span>
            <span>•</span>
            <button
              onClick={() => setIsCreateProfileOpen(true)}
              className="text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
            >
              + Create Profile
            </button>
            <span>•</span>
            <button
              id="footer-contact-desk-btn"
              onClick={() => setIsContactsOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-bold cursor-pointer transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>Contact Support Desk</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsMpesaOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
            >
              Lipa Na M-PESA Direct
            </button>
          </div>
          <div className="text-center md:text-right text-slate-500 text-[11px]">
            <span>© 2026 Quantiq Prime Wealth Management LLC. All Rights Reserved.</span>
          </div>
        </div>
      </footer>
    </>
  );

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black relative overflow-x-hidden">
      
      {/* Main Responsive Dashboard Content */}
      {renderDashboardContent()}

      {/* Modals */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onConfirmDeposit={handleConfirmDeposit}
        onOpenMpesa={() => setIsMpesaOpen(true)}
        contacts={contacts}
        user={user}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        wallet={wallet}
        user={user}
        contacts={contacts}
        onConfirmWithdrawal={handleConfirmWithdrawal}
        onOpenMpesa={() => setIsMpesaOpen(true)}
        onUpdateUser={(updated) => setUser(prev => ({ ...prev, ...updated }))}
      />

      <InvestModal
        isOpen={isInvestOpen}
        onClose={() => setIsInvestOpen(false)}
        plan={selectedPlanForInvest}
        wallet={wallet}
        onConfirmInvest={handleConfirmInvest}
        onOpenDeposit={() => setIsDepositOpen(true)}
      />

      <MpesaModal
        isOpen={isMpesaOpen}
        onClose={() => setIsMpesaOpen(false)}
        user={user}
        wallet={wallet}
        contacts={contacts}
        onConfirmMpesaDeposit={handleConfirmMpesaDeposit}
        onConfirmMpesaWithdrawal={handleConfirmMpesaWithdrawal}
      />

      <ContactSupportModal
        isOpen={isContactsOpen}
        onClose={() => setIsContactsOpen(false)}
        contacts={contacts}
        user={user}
      />

      <CreateProfileModal
        isOpen={isCreateProfileOpen}
        onClose={() => setIsCreateProfileOpen(false)}
        onCreateProfile={handleCreateProfile}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        defaultReferralCode={user.referralCode && user.referralCode !== '505031' ? user.referralCode : ''}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(u) => handleLoginAttempt(u, undefined, { skipOtp: true })}
        onOpenCreateProfile={() => setIsCreateProfileOpen(true)}
        savedProfiles={savedProfiles}
      />

      {/* 2FA Verification Modal for Login, Registration & Unrecognized Devices */}
      {pending2faUser && (
        <Device2faModal
          isOpen={Boolean(pending2faUser)}
          user={pending2faUser.user}
          expectedCode={pending2faUser.expectedCode}
          mode={pending2faUser.mode || 'login'}
          initialChannel={pending2faUser.channel || 'phone'}
          onSuccess={handle2faSuccess}
          onCancel={() => setPending2faUser(null)}
          onResendCode={(channel) => {
            const newOtp = generateDevice2faOtp();
            setPending2faUser(prev => prev ? { ...prev, expectedCode: newOtp, channel } : null);
            return newOtp;
          }}
        />
      )}

    </div>
  );
}
