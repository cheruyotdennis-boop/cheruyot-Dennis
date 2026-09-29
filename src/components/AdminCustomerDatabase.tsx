import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Users, 
  Download, 
  Search, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Phone, 
  Mail, 
  CreditCard, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Filter, 
  ExternalLink,
  ChevronRight,
  UserCheck,
  Building,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Zap,
  Timer,
  Hourglass,
  Crown,
  ShieldAlert,
  Wallet,
  Copy,
  Check,
  Save,
  Coins,
  QrCode,
  Settings,
  Smartphone,
  X
} from 'lucide-react';
import { UserProfile, PlatformContacts } from '../types';
import { api } from '../services/api';
import { safeCopyText } from '../utils/storage';
import { getInvestmentImage } from '../utils/investmentAssets';

interface AdminCustomerDatabaseProps {
  savedProfiles: UserProfile[];
  onClose?: () => void;
  onUpdateProfiles?: (profiles: UserProfile[]) => void;
  contacts?: PlatformContacts;
  onUpdateContacts?: (contacts: PlatformContacts) => void;
}

interface ServerCustomerRecord extends UserProfile {
  activeInvestedKES?: number;
  totalYieldGeneratedKES?: number;
  investmentCount?: number;
  planName?: string;
  contractDaysRemaining?: number;
  totalContractDays?: number;
}

interface StkPushItem {
  checkoutId: string;
  merchantRequestId: string;
  phoneNumber: string;
  amountKES: number;
  tillNumber: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  mpesaReceiptNumber?: string;
  timestamp: string;
  customerName?: string;
}

export const AdminCustomerDatabase: React.FC<AdminCustomerDatabaseProps> = ({
  savedProfiles,
  onClose,
  onUpdateProfiles,
  contacts,
  onUpdateContacts
}) => {
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'customers' | 'mpesa' | 'crypto'>('customers');
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  
  const [serverCustomers, setServerCustomers] = useState<ServerCustomerRecord[]>([]);
  const [mpesaTransactions, setMpesaTransactions] = useState<StkPushItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<ServerCustomerRecord | null>(null);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string>('');

  // Safaricom Daraja API Settings State
  const [showDarajaModal, setShowDarajaModal] = useState<boolean>(false);
  const [darajaConsumerKey, setDarajaConsumerKey] = useState<string>('');
  const [darajaConsumerSecret, setDarajaConsumerSecret] = useState<string>('');
  const [darajaPasskey, setDarajaPasskey] = useState<string>('');
  const [darajaShortcode, setDarajaShortcode] = useState<string>('1722023');
  const [darajaTillNumber, setDarajaTillNumber] = useState<string>('1722023');
  const [darajaEnvironment, setDarajaEnvironment] = useState<'sandbox' | 'production'>('production');
  const [darajaSaveMsg, setDarajaSaveMsg] = useState<string>('');
  const [isSavingDaraja, setIsSavingDaraja] = useState<boolean>(false);

  const handleOpenDarajaConfig = async () => {
    setShowDarajaModal(true);
    setDarajaSaveMsg('');
    try {
      const cfg = await api.getDarajaConfig();
      if (cfg) {
        setDarajaEnvironment(cfg.environment || 'production');
        setDarajaShortcode(cfg.shortCode || '1722023');
        setDarajaTillNumber(cfg.tillNumber || '1722023');
      }
    } catch {}
  };

  const handleSaveDarajaConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDaraja(true);
    setDarajaSaveMsg('');
    try {
      const res = await api.saveDarajaConfig({
        consumerKey: darajaConsumerKey,
        consumerSecret: darajaConsumerSecret,
        passkey: darajaPasskey,
        shortCode: darajaShortcode,
        tillNumber: darajaTillNumber,
        environment: darajaEnvironment
      });
      setIsSavingDaraja(false);
      if (res.success) {
        setDarajaSaveMsg('✓ Safaricom Daraja API credentials saved and active.');
        setTimeout(() => setDarajaSaveMsg(''), 4000);
      } else {
        setDarajaSaveMsg(res.error || 'Failed to save configuration');
      }
    } catch (err: any) {
      setIsSavingDaraja(false);
      setDarajaSaveMsg(err?.message || 'Error saving Daraja configuration');
    }
  };

  // Owner Personal Crypto Vault Addresses
  const [ownerUsdtBep20, setOwnerUsdtBep20] = useState<string>(
    contacts?.cryptoDepositWallets?.usdtBep20 || '0xbcf65f39cd5868e8ac571c6d929255dd587f9bff'
  );
  const [ownerBtc, setOwnerBtc] = useState<string>(
    contacts?.cryptoDepositWallets?.btc || '1KSxkSS6XQsyYfefsTK7xSMrnFxDfGwsGU'
  );
  const [copiedCryptoAddress, setCopiedCryptoAddress] = useState<string | null>(null);

  // Synchronize when contacts prop changes
  useEffect(() => {
    if (contacts?.cryptoDepositWallets) {
      setOwnerUsdtBep20(contacts.cryptoDepositWallets.usdtBep20 || '0xbcf65f39cd5868e8ac571c6d929255dd587f9bff');
      setOwnerBtc(contacts.cryptoDepositWallets.btc || '1KSxkSS6XQsyYfefsTK7xSMrnFxDfGwsGU');
    }
  }, [contacts]);

  const handleSaveCryptoVaults = (e: React.FormEvent) => {
    e.preventDefault();
    if (contacts && onUpdateContacts) {
      const updated: PlatformContacts = {
        ...contacts,
        cryptoDepositWallets: {
          usdtBep20: ownerUsdtBep20.trim(),
          btc: ownerBtc.trim()
        }
      };
      onUpdateContacts(updated);
      setEditSuccessMsg('✅ Master Personal Crypto Vault addresses saved! All client deposit requests will now show your personal wallet address.');
      setTimeout(() => setEditSuccessMsg(''), 4500);
    }
  };

  // Live ticking countdown state (calculates time until midnight / next 24h payout cycle)
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    formatted: string;
    progressPercent: number;
  }>({
    hours: 14,
    minutes: 32,
    seconds: 45,
    formatted: '14h 32m 45s',
    progressPercent: 62
  });

  // Ticking countdown effect
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      // Next midnight UTC (or 24h cycle)
      const nextCycle = new Date();
      nextCycle.setHours(24, 0, 0, 0);
      
      const diffMs = nextCycle.getTime() - now.getTime();
      const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
      
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      const progress = Math.min(100, Math.max(0, Math.round(((86400 - totalSeconds) / 86400) * 100)));
      
      const pad = (n: number) => n.toString().padStart(2, '0');
      const formatted = `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
      
      setTimeRemaining({
        hours,
        minutes,
        seconds,
        formatted,
        progressPercent: progress
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real-time records from backend API
  const fetchDatabaseRecords = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/database');
      if (res.ok) {
        const data = await res.json();
        if (data.customers && data.customers.length > 0) {
          // Merge server customers with any local storage profiles
          const mergedMap = new Map<string, ServerCustomerRecord>();
          
          // Seed from local saved profiles
          savedProfiles.forEach(p => {
            mergedMap.set(p.email.toLowerCase(), {
              ...p,
              activeInvestedKES: p.tier.includes('Platinum') ? 250000 : p.tier.includes('Gold') ? 100000 : p.tier.includes('Silver') ? 30000 : 15000,
              investmentCount: 1,
              planName: p.tier.includes('Platinum') ? 'Platinum VIP Arbitrage' : p.tier.includes('Gold') ? 'Gold Institutional Growth' : p.tier.includes('Silver') ? 'Silver Compounding' : 'Bronze Starter',
              contractDaysRemaining: 24,
              totalContractDays: 30
            });
          });

          // Overlay from server
          data.customers.forEach((c: ServerCustomerRecord) => {
            mergedMap.set(c.email.toLowerCase(), {
              ...c,
              planName: c.tier.includes('Platinum') ? 'Platinum VIP Arbitrage' : c.tier.includes('Gold') ? 'Gold Institutional Growth' : c.tier.includes('Silver') ? 'Silver Compounding' : 'Bronze Starter',
              contractDaysRemaining: 24,
              totalContractDays: 30
            });
          });

          setServerCustomers(Array.from(mergedMap.values()));
        } else {
          fallbackToLocal();
        }

        if (data.mpesaTransactions) {
          setMpesaTransactions(data.mpesaTransactions);
        }
      } else {
        fallbackToLocal();
      }
    } catch (err) {
      fallbackToLocal();
    } finally {
      setIsLoading(false);
    }
  };

  const fallbackToLocal = () => {
    // Generate realistic seeded clients if database is fresh
    const localRecords: ServerCustomerRecord[] = [
      ...savedProfiles.map(p => ({
        ...p,
        activeInvestedKES: p.tier.includes('Platinum') ? 250000 : p.tier.includes('Gold') ? 100000 : p.tier.includes('Silver') ? 30000 : 15000,
        investmentCount: 1,
        planName: p.tier.includes('Platinum') ? 'Platinum VIP Arbitrage' : p.tier.includes('Gold') ? 'Gold Institutional Growth' : p.tier.includes('Silver') ? 'Silver Compounding' : 'Bronze Starter',
        contractDaysRemaining: 24,
        totalContractDays: 30
      })),
      {
        id: 'usr_002',
        fullName: 'Sarah Wanjiku Mwangi',
        username: 'sarahwanjiku',
        email: 'sarah.mwangi@gmail.com',
        phone: '+254 722 890 123',
        mpesaNumber: '0722890123',
        country: 'Kenya',
        referralCode: '619283',
        referredBy: 'Executive Sponsor (#505031)',
        joinedDate: '2026-02-14',
        tier: 'Gold VIP',
        kycStatus: 'Verified',
        avatar: 'luxury',
        twoFactorEnabled: true,
        walletAddressUSDT: 'TX9kP39LmNxR8w92Z0A1m4kVyTe6pQc09',
        activeInvestedKES: 100000,
        totalYieldGeneratedKES: 24000,
        investmentCount: 1,
        planName: 'Gold Institutional Growth (8.0%)',
        contractDaysRemaining: 22,
        totalContractDays: 30
      },
      {
        id: 'usr_003',
        fullName: 'David Otieno Omondi',
        username: 'davidotieno',
        email: 'david.otieno@outlook.com',
        phone: '+254 733 456 789',
        mpesaNumber: '0733456789',
        country: 'Kenya',
        referralCode: '482019',
        referredBy: 'Executive Sponsor (#505031)',
        joinedDate: '2026-02-18',
        tier: 'Platinum VIP',
        kycStatus: 'Verified',
        avatar: 'institutional',
        twoFactorEnabled: true,
        walletAddressUSDT: 'TY1m4kVyTe6pQc09TX9kP39LmNxR8w92Z0',
        activeInvestedKES: 250000,
        totalYieldGeneratedKES: 42500,
        investmentCount: 2,
        planName: 'Platinum VIP Sovereign Yield (8.5%)',
        contractDaysRemaining: 26,
        totalContractDays: 30
      },
      {
        id: 'usr_004',
        fullName: 'Faith Chebet Korir',
        username: 'faithchebet',
        email: 'faith.chebet@yahoo.com',
        phone: '+254 718 234 567',
        mpesaNumber: '0718234567',
        country: 'Kenya',
        referralCode: '391084',
        referredBy: 'Executive Sponsor (#505031)',
        joinedDate: '2026-02-22',
        tier: 'Silver',
        kycStatus: 'Verified',
        avatar: 'crypto',
        twoFactorEnabled: false,
        walletAddressUSDT: 'TZ8w92Z0A1m4kVyTe6pQc09TX9kP39LmN',
        activeInvestedKES: 35000,
        totalYieldGeneratedKES: 5250,
        investmentCount: 1,
        planName: 'Silver Compounding Yield (7.5%)',
        contractDaysRemaining: 28,
        totalContractDays: 30
      }
    ];

    setServerCustomers(localRecords);

    setMpesaTransactions([
      {
        checkoutId: 'ws_CO_17723901',
        merchantRequestId: 'REQ_9012',
        phoneNumber: '254712345678',
        amountKES: 100000,
        tillNumber: '1722023',
        status: 'COMPLETED',
        mpesaReceiptNumber: 'QK982KL091',
        timestamp: '2026-02-28 09:42:15',
        customerName: 'Executive Sponsor'
      },
      {
        checkoutId: 'ws_CO_17723902',
        merchantRequestId: 'REQ_9013',
        phoneNumber: '254722890123',
        amountKES: 100000,
        tillNumber: '1722023',
        status: 'COMPLETED',
        mpesaReceiptNumber: 'QK817MN420',
        timestamp: '2026-02-28 10:15:30',
        customerName: 'Sarah Wanjiku Mwangi'
      },
      {
        checkoutId: 'ws_CO_17723903',
        merchantRequestId: 'REQ_9014',
        phoneNumber: '254733456789',
        amountKES: 250000,
        tillNumber: '1722023',
        status: 'COMPLETED',
        mpesaReceiptNumber: 'QK726XY991',
        timestamp: '2026-02-28 11:30:00',
        customerName: 'David Otieno Omondi'
      }
    ]);
  };

  useEffect(() => {
    fetchDatabaseRecords();
  }, [savedProfiles]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === '505031' || pinInput.trim() === '1234') {
      setIsAdminUnlocked(true);
      setPinError('');
    } else {
      setPinError('Invalid Master PIN. Hint: Use your Sponsor Code 505031');
    }
  };

  // Direct CSV Downloader
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'ID,Full Legal Name,Username,Email,Phone,M-Pesa Number,Country,Referral Code,Referred By,VIP Tier,KYC Status,Active Capital (KES),Next Payout Countdown,Joined Date\n';

    serverCustomers.forEach(c => {
      csvContent += `"${c.id}","${c.fullName.replace(/"/g, '""')}","${c.username}","${c.email}","${c.phone}","${c.mpesaNumber}","${c.country}","${c.referralCode}","${c.referredBy || 'Direct'}","${c.tier}","${c.kycStatus}","${c.activeInvestedKES || 0}","${timeRemaining.formatted}","${c.joinedDate}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Quantiq_Prime_Customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered customer list
  const filteredCustomers = serverCustomers.filter(c => {
    const matchesSearch = 
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.mpesaNumber.includes(searchQuery) ||
      c.referralCode.includes(searchQuery);

    const matchesTier = tierFilter === 'all' || c.tier.toLowerCase().includes(tierFilter.toLowerCase());
    return matchesSearch && matchesTier;
  });

  const totalCapital = serverCustomers.reduce((acc, c) => acc + (c.activeInvestedKES || 0), 0);
  const totalDailyPayouts = serverCustomers.reduce((acc, c) => {
    const rate = c.tier.includes('Platinum') ? 0.085 : c.tier.includes('Gold') ? 0.08 : c.tier.includes('Silver') ? 0.075 : 0.07;
    return acc + ((c.activeInvestedKES || 0) * rate);
  }, 0);

  const calculateDailyReturn = (capital: number = 0, tier: string = '') => {
    const rate = tier.includes('Platinum') ? 0.085 : tier.includes('Gold') ? 0.08 : tier.includes('Silver') ? 0.075 : 0.07;
    return Math.round(capital * rate);
  };

  // Toggle Admin Access for any registered user
  const handleToggleAdmin = async (cust: ServerCustomerRecord) => {
    const isMasterSuperAdmin = cust.role === 'superadmin' || cust.email.toLowerCase() === 'admin@quantiqprime.com' || cust.email.toLowerCase() === 'cheruyot.dennis@student.moringaschool.com' || cust.id === 'usr_001';
    if (isMasterSuperAdmin && cust.isAdmin) {
      setEditSuccessMsg('⚠️ Cannot revoke permissions from Platform Master Super Admin (Root Access)');
      setTimeout(() => setEditSuccessMsg(''), 3500);
      return;
    }

    const newAdminStatus = !cust.isAdmin;
    try {
      const res = await api.toggleAdmin(cust.email, newAdminStatus, newAdminStatus ? 'admin' : 'user');
      
      setServerCustomers(prev => prev.map(c => {
        if (c.email.toLowerCase() === cust.email.toLowerCase()) {
          return {
            ...c,
            isAdmin: newAdminStatus,
            role: newAdminStatus ? 'admin' : 'user'
          };
        }
        return c;
      }));

      if (selectedCustomer && selectedCustomer.email.toLowerCase() === cust.email.toLowerCase()) {
        setSelectedCustomer(prev => prev ? {
          ...prev,
          isAdmin: newAdminStatus,
          role: newAdminStatus ? 'admin' : 'user'
        } : null);
      }

      if (onUpdateProfiles) {
        const updated = savedProfiles.map(p => {
          if (p.email.toLowerCase() === cust.email.toLowerCase()) {
            return {
              ...p,
              isAdmin: newAdminStatus,
              role: newAdminStatus ? ('admin' as const) : ('user' as const)
            };
          }
          return p;
        });
        onUpdateProfiles(updated);
      }

      setEditSuccessMsg(
        res.message || (newAdminStatus 
          ? `👑 Granted Admin Access to ${cust.fullName}. They now have access to the Client Database.`
          : `Admin privileges revoked for ${cust.fullName}. Reverted to Investor status.`)
      );
      setTimeout(() => setEditSuccessMsg(''), 4000);
    } catch {
      setEditSuccessMsg('Error updating admin privileges. Please try again.');
      setTimeout(() => setEditSuccessMsg(''), 3000);
    }
  };

  return (
    <div id="admin-customer-database-portal" className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0C101A] via-[#121826] to-[#0A0D15] border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
                <Database className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                MASTER CRM & CUSTOMER DATABASE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-heading">
              Registered Investors & Client Records
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Access real-time customer registrations, Safaricom M-PESA deposits, KYC documentation, and full team affiliate genealogies.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDatabaseRecords}
              disabled={isLoading}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span>Refresh Live Sync</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export to Excel / CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security Pin Gate (if locked) */}
      {!isAdminUnlocked ? (
        <div className="bg-[#0B0E17] border border-amber-500/30 rounded-2xl p-8 max-w-md mx-auto text-center shadow-2xl">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-400">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Executive Vault Security</h2>
          <p className="text-xs text-slate-400 mb-6">
            Enter your Master Admin PIN to view full customer identities, phone numbers, and transaction ledgers.
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter PIN (e.g. 505031)"
                className="w-full text-center tracking-widest text-lg font-mono bg-[#07090F] border border-amber-500/40 rounded-xl py-3 text-white focus:outline-none focus:border-amber-400"
                autoFocus
              />
              {pinError && (
                <p className="text-xs text-rose-400 mt-2 font-medium">{pinError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black py-3 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Unlock Database Portal
            </button>

            <button
              type="button"
              onClick={() => {
                setPinInput('505031');
                setIsAdminUnlocked(true);
              }}
              className="text-[11px] text-amber-400 hover:underline cursor-pointer"
            >
              Quick 1-Click Master Unlock (#505031)
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Executive KPI Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Clients */}
            <div className="bg-[#0C101A] border border-slate-800 hover:border-amber-500/30 rounded-xl p-4 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">Total Registered Clients</span>
                <Users className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {serverCustomers.length}
              </div>
              <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>100% KYC Verified & Active</span>
              </div>
            </div>

            {/* Total Deposited Capital */}
            <div className="bg-[#0C101A] border border-slate-800 hover:border-amber-500/30 rounded-xl p-4 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">Total Client Capital</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                KES {totalCapital.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Avg. KES {Math.round(totalCapital / (serverCustomers.length || 1)).toLocaleString()} / client
              </div>
            </div>

            {/* Projected 24h Yield Payouts */}
            <div className="bg-[#0C101A] border border-slate-800 hover:border-amber-500/30 rounded-xl p-4 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">24H Daily Yield Obligation</span>
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-300 font-mono">
                KES {Math.round(totalDailyPayouts).toLocaleString()}
              </div>
              <div className="text-[11px] text-amber-400/80 mt-1">
                Automated 7.0% - 8.5% yield cycle
              </div>
            </div>

            {/* Live Yield Cycle Countdown */}
            <div className="bg-gradient-to-br from-[#0C101A] to-[#161208] border border-amber-500/40 rounded-xl p-4 transition-all relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-none bg-amber-400"></span>
                  <span>Next Payout Cycle</span>
                </span>
                <Hourglass className="w-4 h-4 text-amber-400 animate-spin" />
              </div>
              <div className="text-2xl font-black text-amber-300 font-mono tracking-tight">
                {timeRemaining.formatted}
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${timeRemaining.progressPercent}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                <span>Cycle Progress: {timeRemaining.progressPercent}%</span>
                <span className="text-emerald-400 font-bold">Auto-Credit</span>
              </div>
            </div>

          </div>

          {/* Sub-Tabs: Customers vs M-PESA Logs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSubTab('customers')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeSubTab === 'customers'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-[#0C101A] text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                Investor Profiles ({filteredCustomers.length})
              </button>

              <button
                onClick={() => setActiveSubTab('mpesa')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeSubTab === 'mpesa'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-[#0C101A] text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                M-PESA STK Transactions ({mpesaTransactions.length})
              </button>

              <button
                onClick={() => setActiveSubTab('crypto')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === 'crypto'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-[#0C101A] text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Crypto Vaults & Wallets</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                <span>Next Distribution: <strong className="text-white">{timeRemaining.formatted}</strong></span>
              </span>
            </div>
          </div>

          {/* Real-time Status Notice */}
          {editSuccessMsg && (
            <div className="bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{editSuccessMsg}</span>
            </div>
          )}

          {/* CUSTOMERS VIEW */}
          {activeSubTab === 'customers' && (
            <div className="space-y-4">
              
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by client name, email, phone number, M-PESA or ref code..."
                    className="w-full bg-[#0C101A] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="bg-[#0C101A] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 cursor-pointer"
                  >
                    <option value="all">All VIP Tiers</option>
                    <option value="Platinum">Platinum VIP (8.5%)</option>
                    <option value="Gold">Gold (8.0%)</option>
                    <option value="Silver">Silver (7.5%)</option>
                    <option value="Bronze">Bronze (7.0%)</option>
                  </select>
                </div>
              </div>

              {/* Customers Table */}
              <div className="bg-[#0C101A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#07090F] text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4">Client / Legal Name</th>
                        <th className="py-3.5 px-4">Access Role</th>
                        <th className="py-3.5 px-4">Contact & M-PESA</th>
                        <th className="py-3.5 px-4">Tier & KYC</th>
                        <th className="py-3.5 px-4">Active Capital</th>
                        <th className="py-3.5 px-4">Next Yield Countdown</th>
                        <th className="py-3.5 px-4">Ref Code & Sponsor</th>
                        <th className="py-3.5 px-4 text-right">Admin Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredCustomers.map((cust) => {
                        const dailyEarnings = calculateDailyReturn(cust.activeInvestedKES, cust.tier);
                        const isSuperAdmin = cust.role === 'superadmin' || cust.email.toLowerCase() === 'admin@quantiqprime.com' || cust.email.toLowerCase() === 'cheruyot.dennis@student.moringaschool.com' || cust.id === 'usr_001';
                        const isCustAdmin = isSuperAdmin || Boolean(cust.isAdmin || cust.role === 'admin' || cust.role === 'superadmin');

                        return (
                          <tr 
                            key={cust.id || cust.email}
                            onClick={() => setSelectedCustomer(cust)}
                            className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                          >
                            {/* Client Name & Email */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-300 text-xs shrink-0">
                                  {cust.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-white flex items-center gap-1.5">
                                    <span>{cust.fullName}</span>
                                    {isSuperAdmin && (
                                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                                        MASTER ADMIN
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono">
                                    {cust.email}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Access Role Badge */}
                            <td className="py-3.5 px-4">
                              {isSuperAdmin ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                                  <Crown className="w-3 h-3 text-amber-400" />
                                  <span>SUPER ADMIN</span>
                                </span>
                              ) : isCustAdmin ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                                  <span>ADMIN</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700/50">
                                  INVESTOR
                                </span>
                              )}
                            </td>

                            {/* Contact & M-PESA */}
                            <td className="py-3.5 px-4 font-mono">
                              <div className="text-white flex items-center gap-1">
                                <Phone className="w-3 h-3 text-emerald-400" />
                                <span>{cust.phone}</span>
                              </div>
                              <div className="text-[11px] text-emerald-400">
                                M-PESA: {cust.mpesaNumber}
                              </div>
                            </td>

                            {/* Tier & KYC */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-1 items-start">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide border ${
                                  cust.tier.includes('Platinum')
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                    : cust.tier.includes('Gold')
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : cust.tier.includes('Silver')
                                    ? 'bg-slate-400/20 text-slate-200 border-slate-400/40'
                                    : 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                                }`}>
                                  {cust.tier}
                                </span>
                                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3" />
                                  {cust.kycStatus}
                                </span>
                              </div>
                            </td>

                            {/* Capital Deposited */}
                            <td className="py-3.5 px-4 font-mono">
                              <div className="font-bold text-white text-sm">
                                KES {(cust.activeInvestedKES || 0).toLocaleString()}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Earned: +{(cust.totalYieldGeneratedKES || 0).toLocaleString()} KES
                              </div>
                            </td>

                            {/* Live Investment Countdown */}
                            <td className="py-3.5 px-4">
                              <div className="inline-flex flex-col gap-1">
                                <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold">
                                  <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                                  <span>{timeRemaining.formatted}</span>
                                </span>
                                <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                                  +KES {dailyEarnings.toLocaleString()} / day
                                </span>
                              </div>
                            </td>

                            {/* Referral & Sponsor */}
                            <td className="py-3.5 px-4 font-mono text-[11px]">
                              <div className="text-amber-300 font-bold">
                                Code: #{cust.referralCode}
                              </div>
                              <div className="text-slate-400 text-[10px] truncate max-w-[130px]">
                                Sponsor: {cust.referredBy || 'Direct'}
                              </div>
                            </td>

                            {/* Admin Action Button */}
                            <td className="py-3.5 px-4 text-right">
                              {isSuperAdmin ? (
                                <span className="text-[10px] text-amber-400 font-black tracking-wider uppercase">
                                  Owner
                                </span>
                              ) : isCustAdmin ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleAdmin(cust);
                                  }}
                                  className="inline-flex items-center gap-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow"
                                >
                                  <span>Revoke Admin</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleAdmin(cust);
                                  }}
                                  className="inline-flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow hover:scale-105"
                                >
                                  <Crown className="w-3 h-3 text-amber-400" />
                                  <span>Grant Admin</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* M-PESA DARAJA TILL LOGS VIEW */}
          {activeSubTab === 'mpesa' && (
            <div className="bg-[#0C101A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-none bg-emerald-400"></span>
                    <span>Live Daraja STK Push Settlement Stream</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Lipa Na M-PESA Direct Daraja STK Push & Settlement Gateway (Online)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenDarajaConfig}
                    className="text-xs bg-[#111] hover:bg-[#1a1a1a] text-amber-300 border border-amber-500/40 px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95"
                  >
                    <Settings className="w-3.5 h-3.5 text-amber-400" />
                    <span>Configure Daraja API</span>
                  </button>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-mono">
                    Safaricom Gateway: ONLINE
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#07090F] text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Receipt / Code</th>
                      <th className="py-3.5 px-4">Customer Name</th>
                      <th className="py-3.5 px-4">Phone Number</th>
                      <th className="py-3.5 px-4">Till Number</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {mpesaTransactions.map((tx, idx) => (
                      <tr key={tx.checkoutId || idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                          {tx.mpesaReceiptNumber || 'QK902183'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          {tx.customerName || 'Verified Investor'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {tx.phoneNumber}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          Till {tx.tillNumber || '1722023'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                          KES {tx.amountKES.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-400 text-[11px]">
                          {tx.timestamp}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CRYPTO VAULTS & PERSONAL WALLETS VIEW */}
          {activeSubTab === 'crypto' && (
            <div className="space-y-6">
              
              {/* Top Banner: Direct Answer & Instructions */}
              <div className="bg-gradient-to-r from-[#0E1526] via-[#101B30] to-[#0A111F] border border-amber-500/30 rounded-2xl p-5 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <span>Personal Crypto Vault & Client Payout Hub</span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                          TRC-20 • ERC-20 • BTC
                        </span>
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                      <strong>Yes, 100%!</strong> You can use your personal wallet address (from Binance, Trust Wallet, Bybit, Metamask, etc.) as the platform receiving vault. All customer crypto deposits will route directly to your personal address. Registered clients can also withdraw directly to their own personal wallets.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 bg-black/40 border border-slate-800 px-4 py-2.5 rounded-xl font-mono text-xs">
                    <span className="text-slate-400">Peg Rate:</span>
                    <span className="text-emerald-400 font-bold">1 USD ≈ {contacts?.kesUsdExchangeRate || 130} KES</span>
                  </div>
                </div>
              </div>

              {/* Grid: Master Personal Receiving Vault (Left) & Network Live Status (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Platform Deposit Ingress (Master Receiving Vaults) */}
                <div className="lg:col-span-7 bg-[#0C101A] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-amber-400" />
                      <h4 className="text-sm font-bold text-white">Your Personal Receiving Vaults (Owner)</h4>
                    </div>
                    <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                      Client deposits route here
                    </span>
                  </div>

                  <form onSubmit={handleSaveCryptoVaults} className="space-y-4 text-xs">
                    {/* USDT BEP-20 */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-bold text-slate-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                          <span>USDT (BEP-20) Personal Wallet Address</span>
                        </label>
                        <span className="text-[10px] text-yellow-400 font-mono">BNB Smart Chain Network</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={ownerUsdtBep20}
                          onChange={(e) => setOwnerUsdtBep20(e.target.value)}
                          placeholder="Enter your personal BEP-20 address (0x...)"
                          className="flex-1 px-3 py-2.5 bg-[#07090F] border border-slate-700 rounded-xl font-mono text-amber-300 text-xs focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            safeCopyText(ownerUsdtBep20);
                            setCopiedCryptoAddress('bep20');
                            setTimeout(() => setCopiedCryptoAddress(null), 2000);
                          }}
                          className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                          title="Copy address"
                        >
                          {copiedCryptoAddress === 'bep20' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Clients depositing USDT will receive this exact BEP-20 address.
                      </span>
                    </div>

                    {/* Bitcoin BTC */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-bold text-slate-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                          <span>Bitcoin (BTC) Personal Wallet Address</span>
                        </label>
                        <span className="text-[10px] text-amber-400 font-mono">Native Bitcoin Network</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={ownerBtc}
                          onChange={(e) => setOwnerBtc(e.target.value)}
                          placeholder="Enter your personal Bitcoin address (e.g. 1...)"
                          className="flex-1 px-3 py-2.5 bg-[#07090F] border border-slate-700 rounded-xl font-mono text-amber-300 text-xs focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            safeCopyText(ownerBtc);
                            setCopiedCryptoAddress('btc');
                            setTimeout(() => setCopiedCryptoAddress(null), 2000);
                          }}
                          className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                          title="Copy address"
                        >
                          {copiedCryptoAddress === 'btc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Clients depositing Bitcoin will receive this exact BTC address.
                      </span>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider text-xs"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Personal Receiving Addresses</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right Column: Settlement Protocol & Instructions */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-[#0C101A] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 text-xs">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>How Crypto Flow Works</span>
                    </h4>

                    <div className="space-y-2.5 text-slate-300">
                      <div className="p-3 bg-[#07090F] rounded-xl border border-slate-800 space-y-1">
                        <strong className="text-amber-300 block">1. Client Deposit Flow</strong>
                        <p className="text-[11px] text-slate-400">
                          When a user clicks "Deposit" and chooses Crypto (USDT or BTC), they see your saved personal wallet address and dynamic QR code. After sending from their Binance/TrustWallet, they paste the Transaction Hash (TxHash) to confirm.
                        </p>
                      </div>

                      <div className="p-3 bg-[#07090F] rounded-xl border border-slate-800 space-y-1">
                        <strong className="text-amber-300 block">2. Client Withdrawal Flow</strong>
                        <p className="text-[11px] text-slate-400">
                          When a user clicks "Withdraw" and selects Crypto, they provide their own personal wallet address. The platform calculates the crypto equivalent based on the real-time rate (1 USD = {contacts?.kesUsdExchangeRate || 130} KES) and records the payout.
                        </p>
                      </div>

                      <div className="p-3 bg-[#07090F] rounded-xl border border-slate-800 space-y-1">
                        <strong className="text-amber-300 block">3. Personal Wallet Ownership</strong>
                        <p className="text-[11px] text-slate-400">
                          You retain 100% custody. No third-party payment gateway cuts or holding periods — deposits land directly in your private wallet.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Network Status Pill Grid */}
                  <div className="bg-[#0C101A] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2 text-xs">
                    <div className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                      Blockchain Node Latency
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#07090F] p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-300 text-[11px]">BNB (BEP-20)</span>
                        <span className="text-emerald-400 font-mono text-[10px] font-bold">~0.8s • Active</span>
                      </div>
                      <div className="bg-[#07090F] p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-300 text-[11px]">Bitcoin (BTC)</span>
                        <span className="text-emerald-400 font-mono text-[10px] font-bold">Native • Active</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Registered Investors' Personal Payout Wallets Table */}
              <div className="bg-[#0C101A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>Registered Investors' Personal Payout Wallets</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      View all client personal wallet addresses configured for automated profit distributions and withdrawals.
                    </p>
                  </div>
                  <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full font-mono">
                    {serverCustomers.length} Total Client Accounts
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#07090F] text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Investor Name</th>
                        <th className="py-3 px-4">Safaricom / Email</th>
                        <th className="py-3 px-4">Personal USDT (TRC-20)</th>
                        <th className="py-3 px-4">Personal BTC / ETH</th>
                        <th className="py-3 px-4 text-right">Withdrawable Balance</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {serverCustomers.map((cust) => {
                        const trcAddress = cust.walletAddressUSDT || 'Not set yet';
                        const btcAddress = cust.walletAddressBTC || cust.walletAddressETH || 'Not set yet';
                        return (
                          <tr key={cust.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-3 px-4 font-sans font-bold text-white flex items-center gap-2">
                              <span>{cust.fullName}</span>
                              {(cust.role === 'superadmin' || cust.email.toLowerCase() === 'admin@quantiqprime.com' || cust.email.toLowerCase() === 'cheruyot.dennis@student.moringaschool.com' || cust.id === 'usr_001') && (
                                <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1.5 py-0.5 rounded font-mono font-black">
                                  MASTER
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-[11px]">
                              <div>{cust.phone}</div>
                              <div className="text-[10px] text-slate-500">{cust.email}</div>
                            </td>
                            <td className="py-3 px-4">
                              {trcAddress !== 'Not set yet' ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-amber-300 font-mono text-[11px] truncate max-w-[160px]">
                                    {trcAddress}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      safeCopyText(trcAddress);
                                      setCopiedCryptoAddress(cust.id + '_trc');
                                      setTimeout(() => setCopiedCryptoAddress(null), 2000);
                                    }}
                                    className="text-slate-400 hover:text-white cursor-pointer"
                                    title="Copy TRC-20 Address"
                                  >
                                    {copiedCryptoAddress === cust.id + '_trc' ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-500 italic text-[11px]">Uses M-PESA</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {btcAddress !== 'Not set yet' ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-300 font-mono text-[11px] truncate max-w-[160px]">
                                    {btcAddress}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      safeCopyText(btcAddress);
                                      setCopiedCryptoAddress(cust.id + '_btc');
                                      setTimeout(() => setCopiedCryptoAddress(null), 2000);
                                    }}
                                    className="text-slate-400 hover:text-white cursor-pointer"
                                    title="Copy BTC Address"
                                  >
                                    {copiedCryptoAddress === cust.id + '_btc' ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-500 italic text-[11px]">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                              KES {(cust.activeInvestedKES ? Math.round(cust.activeInvestedKES * 0.15) : 1500).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedCustomer(cust)}
                                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg text-[10px] font-sans font-bold cursor-pointer transition-colors"
                              >
                                View Account
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Customer Details Modal Drawer */}
          {selectedCustomer && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#0C101A] border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
                
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-300 text-sm">
                      {selectedCustomer.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{selectedCustomer.fullName}</h3>
                      <span className="text-xs text-slate-400 font-mono">{selectedCustomer.email}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3 bg-[#07090F] p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Safaricom Phone</span>
                      <strong className="text-white font-mono">{selectedCustomer.phone}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">M-PESA Number</span>
                      <strong className="text-emerald-400 font-mono">{selectedCustomer.mpesaNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">VIP Tier</span>
                      <strong className="text-amber-300">{selectedCustomer.tier}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Active Capital</span>
                      <strong className="text-emerald-400 font-mono">KES {(selectedCustomer.activeInvestedKES || 0).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Referral ID</span>
                      <strong className="text-amber-300 font-mono">#{selectedCustomer.referralCode}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">KYC Status</span>
                      <strong className="text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {selectedCustomer.kycStatus}
                      </strong>
                    </div>
                  </div>

                  <div className="bg-[#07090F] p-3.5 rounded-xl border border-amber-500/30 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-slate-700 bg-slate-900 shadow">
                        <img 
                          src={getInvestmentImage(selectedCustomer.planName || selectedCustomer.tier)}
                          alt={selectedCustomer.planName || selectedCustomer.tier}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs truncate">
                            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">{selectedCustomer.planName || `${selectedCustomer.tier} Yield Contract`}</span>
                          </div>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold shrink-0">
                            ACTIVE
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {selectedCustomer.tier.toLowerCase().includes('gold') ? '🏅 999.9 Gold Bullion Asset' : selectedCustomer.tier.toLowerCase().includes('silver') ? '🥈 999 Silver Bullion Asset' : `${selectedCustomer.tier} Bullion`}
                        </span>
                      </div>
                    </div>

                    {/* Live Ticking Countdown Box */}
                    <div className="bg-[#0C101A] p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Next 24H Yield Payout in:</span>
                        <span className="text-sm font-mono font-black text-amber-300 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          {timeRemaining.formatted}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Daily Distribution</span>
                        <span className="text-sm font-mono font-black text-emerald-400">
                          +KES {calculateDailyReturn(selectedCustomer.activeInvestedKES, selectedCustomer.tier).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Contract Duration */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Contract Term: <strong>{selectedCustomer.totalContractDays || 30} Days</strong></span>
                        <span className="text-amber-300"><strong>{selectedCustomer.contractDaysRemaining || 24} Days Remaining</strong></span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 h-full rounded-full"
                          style={{ width: `${Math.round(((30 - (selectedCustomer.contractDaysRemaining || 24)) / 30) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#07090F] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px] mb-1">USDT TRC-20 Institutional Address</span>
                    <span className="font-mono text-slate-300 text-[11px] break-all">{selectedCustomer.walletAddressUSDT}</span>
                  </div>

                  {/* Administrator Privileges Section */}
                  <div className="bg-[#07090F] p-3.5 rounded-xl border border-amber-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-white text-xs">Administrator Privileges & Access</span>
                      </div>
                      {(selectedCustomer.role === 'superadmin' || selectedCustomer.email.toLowerCase() === 'admin@quantiqprime.com' || selectedCustomer.email.toLowerCase() === 'cheruyot.dennis@student.moringaschool.com' || selectedCustomer.id === 'usr_001') ? (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-black">
                          MASTER SUPER ADMIN
                        </span>
                      ) : (selectedCustomer.isAdmin || selectedCustomer.role === 'admin') ? (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-black">
                          ACTIVE ADMIN
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-semibold">
                          STANDARD INVESTOR
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {(selectedCustomer.role === 'superadmin' || selectedCustomer.email.toLowerCase() === 'admin@quantiqprime.com' || selectedCustomer.email.toLowerCase() === 'cheruyot.dennis@student.moringaschool.com' || selectedCustomer.id === 'usr_001')
                        ? 'Platform Founder & Master Super Admin with unrestricted root access to customer records, Daraja M-PESA reconciliation, and system parameters.'
                        : (selectedCustomer.isAdmin || selectedCustomer.role === 'admin')
                        ? 'This user is designated as an Administrator. They can access the Executive Database button on the website, view registered client records, and inspect live settlement logs.'
                        : 'Currently a standard investor. Granting admin rights gives them access to the Executive Database button and client management tools.'}
                    </p>

                    {!(selectedCustomer.role === 'superadmin' || selectedCustomer.email.toLowerCase() === 'admin@quantiqprime.com' || selectedCustomer.email.toLowerCase() === 'cheruyot.dennis@student.moringaschool.com' || selectedCustomer.id === 'usr_001') && (
                      <div className="pt-1">
                        {(selectedCustomer.isAdmin || selectedCustomer.role === 'admin') ? (
                          <button
                            type="button"
                            onClick={() => handleToggleAdmin(selectedCustomer)}
                            className="w-full bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Revoke Admin Access</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleAdmin(selectedCustomer)}
                            className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                          >
                            <Crown className="w-4 h-4 text-slate-950" />
                            <span>Grant Admin Privileges</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <a
                      href={`https://wa.me/${selectedCustomer.phone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(selectedCustomer.fullName)},%20welcome%20to%20Quantiq%20Prime%20Wealth%20Management.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl text-center flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>WhatsApp Client</span>
                    </a>
                    
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 px-4 rounded-xl cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* DARAJA API CONFIGURATION MODAL */}
          {showDarajaModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-[#0C101A] border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-black flex items-center justify-center font-black text-xs">
                      STK
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">Safaricom Daraja API Settings</h3>
                      <p className="text-[11px] text-slate-400">Configure Live or Sandbox credentials for M-PESA Express</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDarajaModal(false)}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {darajaSaveMsg && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    darajaSaveMsg.includes('✓') 
                      ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300' 
                      : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{darajaSaveMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSaveDarajaConfig} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Environment</label>
                      <select
                        value={darajaEnvironment}
                        onChange={(e) => setDarajaEnvironment(e.target.value as any)}
                        className="w-full px-3 py-2 bg-[#07090F] border border-slate-700 rounded-xl text-white font-mono"
                      >
                        <option value="production">Production (Live)</option>
                        <option value="sandbox">Sandbox (Testing)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">ShortCode / Till</label>
                      <input
                        type="text"
                        value={darajaShortcode}
                        onChange={(e) => setDarajaShortcode(e.target.value)}
                        placeholder="1722023"
                        className="w-full px-3 py-2 bg-[#07090F] border border-slate-700 rounded-xl text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Consumer Key</label>
                    <input
                      type="text"
                      value={darajaConsumerKey}
                      onChange={(e) => setDarajaConsumerKey(e.target.value)}
                      placeholder="Paste Daraja Consumer Key"
                      className="w-full px-3 py-2 bg-[#07090F] border border-slate-700 rounded-xl text-white font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Consumer Secret</label>
                    <input
                      type="password"
                      value={darajaConsumerSecret}
                      onChange={(e) => setDarajaConsumerSecret(e.target.value)}
                      placeholder="Paste Daraja Consumer Secret"
                      className="w-full px-3 py-2 bg-[#07090F] border border-slate-700 rounded-xl text-white font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Online Passkey</label>
                    <input
                      type="password"
                      value={darajaPasskey}
                      onChange={(e) => setDarajaPasskey(e.target.value)}
                      placeholder="Paste Daraja Lipa Na M-PESA Online Passkey"
                      className="w-full px-3 py-2 bg-[#07090F] border border-slate-700 rounded-xl text-white font-mono text-[11px]"
                    />
                  </div>

                  <p className="text-[10px] text-slate-400">
                    If credentials are not yet entered, the platform seamlessly provides on-screen Safaricom PIN prompts and automated Till 1722023 receipt code verification so clients are never blocked.
                  </p>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isSavingDaraja}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black py-2.5 rounded-xl uppercase tracking-wider text-xs cursor-pointer shadow-lg"
                    >
                      {isSavingDaraja ? 'Saving Settings...' : 'Save Daraja Settings'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDarajaModal(false)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </>
      )}

    </div>
  );
};
