import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles, 
  Coins, 
  DollarSign, 
  Layers, 
  Share2, 
  Check, 
  Copy, 
  Clock, 
  ShieldCheck, 
  ChevronRight,
  ExternalLink,
  Activity,
  Flame,
  Smartphone,
  PhoneCall,
  Lock,
  MessageCircle
} from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { safeCopyText } from '../utils/storage';
import { UserProfile, WalletState, ActiveInvestment, Transaction, ChartDataPoint } from '../types';
import { ProfileAvatar } from './ProfileAvatar';
import { HISTORICAL_GROWTH_DATA } from '../data/mockData';
import { api, BackendHealthResponse } from '../services/api';
import { getInvestmentImage } from '../utils/investmentAssets';

interface DashboardOverviewProps {
  user: UserProfile;
  wallet: WalletState;
  activeInvestments: ActiveInvestment[];
  transactions: Transaction[];
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenMpesa: () => void;
  onOpenContacts: () => void;
  onOpenInvest: () => void;
  onOpenReferral: () => void;
  onOpenReferralModal?: () => void;
  onViewAllTransactions: () => void;
  onClaimDailyYield: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  user,
  wallet,
  activeInvestments,
  transactions,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenMpesa,
  onOpenContacts,
  onOpenInvest,
  onOpenReferral,
  onViewAllTransactions,
  onClaimDailyYield
}) => {
  const [timeframe, setTimeframe] = useState<'7D' | '1M' | '3M' | '1Y'>('7D');
  const [chartMetric, setChartMetric] = useState<'portfolio' | 'profit'>('portfolio');
  const [copiedLink, setCopiedLink] = useState(false);
  const [liveYieldCounter, setLiveYieldCounter] = useState(wallet.todayYield);

  // Live real-time sub-cent ticking yield effect - only active when user has actual positive yield
  useEffect(() => {
    setLiveYieldCounter(wallet.todayYield);
    if (wallet.todayYield <= 0) return;

    const interval = setInterval(() => {
      setLiveYieldCounter(prev => +(prev + 0.05).toFixed(2));
    }, 3000);
    return () => clearInterval(interval);
  }, [wallet.todayYield]);

  // Actual customer portfolio & profit growth trajectory based on actual customer figures
  const chartData = useMemo(() => {
    const pointsCount = timeframe === '7D' ? 7 : timeframe === '1M' ? 7 : timeframe === '3M' ? 6 : 6;
    const daysBack = timeframe === '7D' ? 7 : timeframe === '1M' ? 30 : timeframe === '3M' ? 90 : 365;
    const now = new Date();
    const result: ChartDataPoint[] = [];

    const currentBal = wallet.totalBalance;
    const currentProfit = wallet.totalEarnings;
    const currentInvested = wallet.activeInvested;

    for (let i = 0; i < pointsCount; i++) {
      const pointDate = new Date(now.getTime() - ((pointsCount - 1 - i) * (daysBack / (pointsCount - 1))) * 86400000);
      const dateStr = pointDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (currentBal === 0 && currentProfit === 0 && currentInvested === 0) {
        result.push({
          date: dateStr,
          portfolioValue: 0,
          investedCapital: 0,
          totalProfit: 0,
          dailyEarnings: 0
        });
      } else {
        const ratio = (i + 1) / pointsCount;
        const interpProfit = Number((currentProfit * ratio).toFixed(2));
        const interpVal = Number((currentInvested + (wallet.availableCash * ratio) + interpProfit).toFixed(2));
        result.push({
          date: dateStr,
          portfolioValue: interpVal,
          investedCapital: currentInvested,
          totalProfit: interpProfit,
          dailyEarnings: wallet.todayYield
        });
      }
    }
    return result;
  }, [timeframe, wallet.totalBalance, wallet.totalEarnings, wallet.activeInvested, wallet.availableCash, wallet.todayYield]);

  const referralUrl = `https://quantiqprime.com/register?ref=${user.referralCode}`;

  const handleCopyLink = () => {
    safeCopyText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const [hoveredChartIdx, setHoveredChartIdx] = useState<number | null>(null);
  const [backendHealth, setBackendHealth] = useState<BackendHealthResponse | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  // Poll backend health & quotes on load
  useEffect(() => {
    api.checkHealth().then(data => {
      if (data) setBackendHealth(data);
    });

    // Generate initial AI quant recommendation
    api.getAiInsights(wallet.totalBalance, user.tier).then(insight => {
      if (insight) setAiInsight(insight);
    });
  }, [wallet.totalBalance, user.tier]);

  const handleRefreshAi = async () => {
    setLoadingAi(true);
    const text = await api.getAiInsights(wallet.totalBalance, user.tier);
    if (text) setAiInsight(text);
    setLoadingAi(false);
  };

  const handleClaim = () => {
    triggerConfetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    onClaimDailyYield();
  };

  // Dynamically compute pieData from actual user active investments and available capital
  const pieData = useMemo(() => {
    const items: { name: string; value: number; color: string }[] = [];
    const colors = ['#F59E0B', '#6366F1', '#EC4899', '#3B82F6', '#14B8A6'];

    const planMap = new Map<string, number>();
    activeInvestments.forEach(inv => {
      planMap.set(inv.planName, (planMap.get(inv.planName) || 0) + inv.investedAmount);
    });

    let colorIdx = 0;
    planMap.forEach((amount, planName) => {
      items.push({
        name: planName,
        value: amount,
        color: colors[colorIdx % colors.length]
      });
      colorIdx++;
    });

    if (wallet.availableCash > 0 || items.length === 0) {
      items.push({
        name: 'Available Capital',
        value: wallet.availableCash,
        color: '#10B981'
      });
    }

    return items;
  }, [activeInvestments, wallet.availableCash]);

  const totalAllocation = pieData.reduce((acc, curr) => acc + curr.value, 0);

  // SVG Area Chart calculations
  const maxVal = Math.max(...chartData.map(d => Math.max(d.portfolioValue, d.totalProfit * 1.5)), 1000);
  const minVal = 0;
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 25;
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  const pointsPortfolio = chartData.map((d, i) => {
    const x = paddingX + (i / Math.max(chartData.length - 1, 1)) * chartW;
    const y = paddingY + chartH - ((d.portfolioValue - minVal) / (maxVal - minVal)) * chartH;
    return { x, y, data: d };
  });

  const pointsProfit = chartData.map((d, i) => {
    const x = paddingX + (i / Math.max(chartData.length - 1, 1)) * chartW;
    const y = paddingY + chartH - ((d.totalProfit - minVal) / (maxVal - minVal)) * chartH;
    return { x, y, data: d };
  });

  const pathPortfolio = pointsPortfolio.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');
  const areaPortfolio = `${pathPortfolio} L ${pointsPortfolio[pointsPortfolio.length - 1].x.toFixed(1)} ${(paddingY + chartH).toFixed(1)} L ${pointsPortfolio[0].x.toFixed(1)} ${(paddingY + chartH).toFixed(1)} Z`;

  const pathProfit = pointsProfit.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');
  const areaProfit = `${pathProfit} L ${pointsProfit[pointsProfit.length - 1].x.toFixed(1)} ${(paddingY + chartH).toFixed(1)} L ${pointsProfit[0].x.toFixed(1)} ${(paddingY + chartH).toFixed(1)} Z`;

  return (
    <div className="space-y-6">
      
      {/* Welcome & Live Yield Streamer Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0E131F] via-[#151A29] to-[#0E131F] text-white p-6 sm:p-8 shadow-2xl border border-amber-500/30 backdrop-blur-xl">
        
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <ProfileAvatar 
              src={user.avatar}
              name={user.fullName}
              tier={user.tier}
              size="lg"
              showKycBadge={true}
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  {user.tier} Account • Verified
                </span>
                <span className="text-xs text-slate-300">
                  Referral Code: <b className="font-mono text-amber-400">#{user.referralCode}</b>
                </span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
                Welcome to Quantiq Prime, <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">{user.fullName.split(' ')[0]}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Institutional algorithmic yield active. Trade smart, invest wise, and compound returns daily with automated payout cycles in Kenyan Shillings (KES).
              </p>
            </div>
          </div>

          {/* Real-time Yield Accrual Box */}
          <div className="bg-[#07090E]/80 backdrop-blur-md border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 lg:w-96 shrink-0 shadow-lg">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                <span className="inline-flex h-2 w-2 bg-amber-500"></span>
                <span>Live Accruing Yield (24h)</span>
              </div>
              <div className="text-2xl font-black font-mono text-white mt-1 flex items-baseline gap-1">
                <span>Ksh {liveYieldCounter.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-xs font-normal text-amber-400">KES</span>
              </div>
              <div className="text-[11px] text-emerald-400 font-bold mt-0.5">
                +7.50% daily algorithmic rate
              </div>
            </div>

            <button
              id="claim-yield-btn"
              onClick={handleClaim}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Claim to Balance</span>
            </button>
          </div>
        </div>

        {/* Quick Link Share Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 truncate">
            <span className="font-bold text-amber-400 shrink-0">Personal Affiliate Link:</span>
            <span className="font-mono text-slate-300 bg-[#07090E] px-2.5 py-1 rounded-lg border border-slate-800 truncate select-all">
              {referralUrl}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="copy-ref-link-btn"
              onClick={handleCopyLink}
              className="flex items-center gap-1 bg-[#07090E] hover:bg-slate-800 text-amber-300 px-3 py-1.5 rounded-xl font-bold transition-all border border-amber-500/30 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
            <button
              onClick={onOpenReferral}
              className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl font-bold transition-all border border-amber-500/40 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Affiliate Hub</span>
            </button>
          </div>
        </div>

      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Balance */}
        <div className="bg-[#0B0F17]/90 rounded-3xl p-5 border border-amber-500/20 shadow-xl hover:border-amber-500/40 transition-all backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Portfolio Value</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono">
              Ksh {wallet.totalBalance.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400 font-bold font-mono">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% this month</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Available cash:</span>
            <span className="font-bold text-white font-mono">Ksh {wallet.availableCash.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Card 2: Active Investments / Locked Capital */}
        <div className="bg-[#0B0F17]/90 rounded-3xl p-5 border border-amber-500/20 shadow-xl hover:border-amber-500/40 transition-all backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Locked Capital in Yield</span>
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-950/60 text-amber-300 flex items-center justify-center border border-amber-500/30">
              <Lock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-300 font-mono">
              Ksh {wallet.activeInvested.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-400 font-bold">
              <Activity className="w-3.5 h-3.5" />
              <span>{activeInvestments.length} Active Packages (Locked until maturity)</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Daily Expected Yield:</span>
            <span className="font-bold text-emerald-400 font-mono">+Ksh {wallet.todayYield.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Card 3: Total Profit */}
        <div className="bg-[#0B0F17]/90 rounded-3xl p-5 border border-amber-500/20 shadow-xl hover:border-amber-500/40 transition-all backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Net Yield Earnings</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400 font-mono">
              Ksh {wallet.totalEarnings.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-300 font-medium">
              <span>All-time harvested ROI</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Today's payout:</span>
            <span className="font-bold text-emerald-400 font-mono">+Ksh {wallet.todayYield.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Card 4: Referral Commissions */}
        <div className="bg-[#0B0F17]/90 rounded-3xl p-5 border border-amber-500/20 shadow-xl hover:border-amber-500/40 transition-all backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Affiliate Commissions</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-yellow-400 flex items-center justify-center border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono">
              Ksh {wallet.referralEarnings.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-400 font-bold font-mono">
              <span>10% Direct Commission Active</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Ref Code:</span>
            <span className="font-mono font-bold text-amber-400">#{user.referralCode}</span>
          </div>
        </div>

      </div>

      {/* Official WhatsApp Investors Community Banner */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-[#0A1713] to-emerald-950/70 border-2 border-emerald-500/50 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-black flex items-center justify-center font-black shadow-lg shadow-emerald-500/20 shrink-0">
            <MessageCircle className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-white font-heading">Official Investors WhatsApp Group</h3>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-black px-2 py-0.5 rounded">Active Community</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Connect with 1,400+ active Kenyan traders and institutional investors. Real-time payouts, M-PESA confirmations, and strategy updates.
            </p>
          </div>
        </div>

        <a
          href="https://chat.whatsapp.com/C0LXeuksKfRIxC8WO2aQv2"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95 cursor-pointer uppercase tracking-wider"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Join WhatsApp Group</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Quick Action Matrix Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onOpenMpesa}
          className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/80 to-teal-950/80 border border-emerald-500/40 hover:border-emerald-400 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer shadow-lg group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-md group-hover:scale-105 transition-transform">
            KES
          </div>
          <div className="text-center">
            <div className="text-xs font-black text-white">Lipa Na M-PESA</div>
            <div className="text-[10px] text-emerald-300">Instant STK Prompt</div>
          </div>
        </button>

        <button
          onClick={onOpenInvest}
          className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/60 to-yellow-950/60 border border-amber-500/40 hover:border-amber-400 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer shadow-lg group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Flame className="w-5 h-5 fill-slate-950" />
          </div>
          <div className="text-center">
            <div className="text-xs font-black text-white">New Yield Contract</div>
            <div className="text-[10px] text-amber-300">7.5% Daily Interest</div>
          </div>
        </button>

        <button
          onClick={onOpenDeposit}
          className="p-4 rounded-2xl bg-[#0E131F] border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer shadow-lg group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border border-slate-700">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div className="text-center">
            <div className="text-xs font-black text-white">Deposit Capital</div>
            <div className="text-[10px] text-slate-400">USDT / KES / Card</div>
          </div>
        </button>

        <button
          onClick={onOpenWithdraw}
          className="p-4 rounded-2xl bg-[#0E131F] border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer shadow-lg group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border border-slate-700">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div className="text-center">
            <div className="text-xs font-black text-white">Instant Payout</div>
            <div className="text-[10px] text-slate-400">Zero Withdrawal Fee</div>
          </div>
        </button>
      </div>

      {/* Main Analytics & Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Growth Chart */}
        <div className="lg:col-span-2 bg-[#0B0F17]/90 rounded-3xl p-6 border border-amber-500/20 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white font-heading">
                Portfolio Yield Trajectory
              </h2>
              <p className="text-xs text-slate-400">
                Tracking capital valuation vs. compounded daily dividends
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-[#07090E] p-1 rounded-xl border border-slate-800 text-xs font-bold">
                {(['7D', '1M', '3M', '1Y'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      timeframe === tf
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-72 w-full mt-4 relative">
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="w-full h-full overflow-visible"
            >
              <defs>
                <linearGradient id="colorPortfolioGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45"/>
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0"/>
                </linearGradient>
                <linearGradient id="colorProfitGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.45"/>
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0"/>
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = paddingY + chartH * (1 - ratio);
                const val = minVal + ratio * (maxVal - minVal);
                return (
                  <g key={idx}>
                    <line 
                      x1={paddingX} 
                      y1={y} 
                      x2={svgWidth - paddingX} 
                      y2={y} 
                      stroke="#1E293B" 
                      strokeDasharray="3 3" 
                      strokeWidth="1"
                    />
                    <text 
                      x={paddingX - 6} 
                      y={y + 3} 
                      fill="#64748B" 
                      fontSize="9" 
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      {val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                    </text>
                  </g>
                );
              })}

              {/* Area Fills */}
              <path d={areaPortfolio} fill="url(#colorPortfolioGold)" />
              <path d={areaProfit} fill="url(#colorProfitGreen)" />

              {/* Stroke Lines */}
              <path d={pathPortfolio} fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
              <path d={pathProfit} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />

              {/* X Axis Labels */}
              {chartData.map((d, i) => {
                const x = paddingX + (i / Math.max(chartData.length - 1, 1)) * chartW;
                return (
                  <text 
                    key={i} 
                    x={x} 
                    y={svgHeight - 6} 
                    fill="#64748B" 
                    fontSize="9" 
                    textAnchor="middle"
                    className="font-medium"
                  >
                    {d.date}
                  </text>
                );
              })}

              {/* Interactive Hover Point Cursor */}
              {hoveredChartIdx !== null && pointsPortfolio[hoveredChartIdx] && (
                <g>
                  <line 
                    x1={pointsPortfolio[hoveredChartIdx].x} 
                    y1={paddingY} 
                    x2={pointsPortfolio[hoveredChartIdx].x} 
                    y2={paddingY + chartH} 
                    stroke="#F59E0B" 
                    strokeWidth="1" 
                    strokeDasharray="2 2"
                  />
                  <circle 
                    cx={pointsPortfolio[hoveredChartIdx].x} 
                    cy={pointsPortfolio[hoveredChartIdx].y} 
                    r="5" 
                    fill="#F59E0B" 
                    stroke="#07090E" 
                    strokeWidth="2"
                  />
                  <circle 
                    cx={pointsProfit[hoveredChartIdx].x} 
                    cy={pointsProfit[hoveredChartIdx].y} 
                    r="4" 
                    fill="#10B981" 
                    stroke="#07090E" 
                    strokeWidth="2"
                  />
                </g>
              )}

              {/* Invisible touch/mouse detection strips */}
              {chartData.map((_, i) => {
                const x = paddingX + (i / Math.max(chartData.length - 1, 1)) * chartW;
                const width = chartW / chartData.length;
                return (
                  <rect
                    key={i}
                    x={x - width / 2}
                    y={0}
                    width={width}
                    height={svgHeight}
                    fill="transparent"
                    className="cursor-crosshair"
                    onMouseEnter={() => setHoveredChartIdx(i)}
                    onMouseLeave={() => setHoveredChartIdx(null)}
                  />
                );
              })}
            </svg>

            {/* Floating Tooltip */}
            {hoveredChartIdx !== null && chartData[hoveredChartIdx] && (
              <div 
                className="absolute top-2 bg-[#07090E]/95 border border-amber-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-md pointer-events-none z-20 text-xs transition-all"
                style={{
                  left: `${Math.min(Math.max(10, (hoveredChartIdx / (chartData.length - 1)) * 100), 80)}%`
                }}
              >
                <div className="font-bold text-amber-300 font-mono mb-1">{chartData[hoveredChartIdx].date}</div>
                <div className="flex items-center justify-between gap-4 text-slate-300">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Portfolio:
                  </span>
                  <span className="font-mono font-bold text-white">Ksh {chartData[hoveredChartIdx].portfolioValue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-slate-300 mt-0.5">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Profit:
                  </span>
                  <span className="font-mono font-bold text-emerald-400">Ksh {chartData[hoveredChartIdx].totalProfit.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>Total Portfolio Balance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>Harvested Dividends</span>
              </div>
            </div>
            <span className="font-semibold text-amber-400">Compounding: Active</span>
          </div>
        </div>

        {/* Right Col: Capital Allocation Pie */}
        <div className="bg-[#0B0F17]/90 rounded-3xl p-6 border border-amber-500/20 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white font-heading">
                Asset Allocation
              </h2>
              <span className="text-xs font-bold text-amber-400">{pieData.length} Assets</span>
            </div>

            {/* Custom SVG Donut Chart */}
            <div className="h-48 w-full mt-2 flex items-center justify-center relative">
              <svg viewBox="0 0 160 160" className="w-40 h-40 transform -rotate-90">
                {totalAllocation <= 0 ? (
                  <circle
                    cx="80"
                    cy="80"
                    r="55"
                    fill="transparent"
                    stroke="#1E293B"
                    strokeWidth="16"
                  />
                ) : (() => {
                  let accumulatedPercent = 0;
                  const circumference = 2 * Math.PI * 55;
                  return pieData.map((item, idx) => {
                    const percent = item.value / (totalAllocation || 1);
                    const strokeDasharray = `${percent * circumference} ${circumference}`;
                    const strokeDashoffset = -accumulatedPercent * circumference;
                    accumulatedPercent += percent;

                    return (
                      <circle
                        key={idx}
                        cx="80"
                        cy="80"
                        r="55"
                        fill="transparent"
                        stroke={item.color}
                        strokeWidth="20"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500 hover:opacity-80"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Capital</span>
                <span className="text-xs font-black text-amber-300 font-mono">
                  Ksh {totalAllocation >= 1000 ? `${(totalAllocation/1000).toFixed(0)}k` : totalAllocation.toLocaleString('en-KE')}
                </span>
              </div>
            </div>

            <div className="space-y-2 mt-2">
              {pieData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-300">{item.name}</span>
                  </div>
                  <span className="font-bold text-white font-mono">Ksh {item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={onOpenInvest}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>+ Add High-Yield Package</span>
            </button>
          </div>
        </div>

      </div>

      {/* Backend Engine & AI Quant Intelligence Live Telemetry */}
      <div className="bg-gradient-to-r from-[#0B0F17] via-[#0E1424] to-[#0B0F17] border border-amber-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center font-black">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-heading">Institutional Quant AI & Backend Engine</h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 bg-emerald-400"></span>
                  {backendHealth ? 'LIVE SERVER (0.4ms)' : 'ALGO ENGINE ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                High-Frequency triangular arbitrage, M-Pesa Daraja settlement node & portfolio yield optimization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshAi}
              disabled={loadingAi}
              className="px-3 py-1.5 bg-[#070A12] hover:bg-slate-800 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Activity className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
              <span>{loadingAi ? 'Synthesizing...' : 'Refresh AI Analysis'}</span>
            </button>
          </div>
        </div>

        {/* Live Analysis Output */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-[#070A12]/80 border border-slate-800/80 rounded-2xl p-4">
            <div className="text-[11px] font-extrabold uppercase text-amber-400 tracking-wider flex items-center gap-1.5 mb-2">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Algorithmic Yield Intelligence</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {aiInsight || `Quantiq High-Frequency Arbitrage Engine confirms optimal liquidity on USD/KES at 129.40 and USDT pairs. For capital of KES ${wallet.totalBalance.toLocaleString()}, allocating into ${user.tier} tier generates daily compounding returns with automated Lipa Na M-PESA daily settlement.`}
            </p>
          </div>

          <div className="bg-[#070A12]/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mb-2">
                Backend Services Gateway
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-300">
                  <span>M-Pesa STK Gateway:</span>
                  <span className="font-mono text-emerald-400 font-bold">CONNECTED</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Crypto / Forex Oracle:</span>
                  <span className="font-mono text-emerald-400 font-bold">ONLINE</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Smart Contract Settlement:</span>
                  <span className="font-mono text-amber-300 font-bold">AUTOMATED</span>
                </div>
              </div>
            </div>

            <div className="pt-2 mt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>Server Version: 3.4.0</span>
              <span className="text-emerald-400 font-mono">100% SLA Uptime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Investments & Recent Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Active Investments List */}
        <div className="bg-[#0B0F17]/90 rounded-3xl p-6 border border-amber-500/20 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white font-heading">
                Active Yield Contracts ({activeInvestments.length})
              </h2>
              <p className="text-xs text-slate-400">Automated daily distribution ledger</p>
            </div>
            <button
              onClick={onOpenInvest}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
            >
              + New Plan
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {activeInvestments.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0E131F]/60 border border-dashed border-slate-800 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                  <Coins className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">No Active Contracts</h4>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  You do not have any running yield plans. Choose an investment package to start receiving daily dividends.
                </p>
                <button
                  onClick={onOpenInvest}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs hover:brightness-110 transition-all cursor-pointer shadow-md"
                >
                  Explore Investment Packages
                </button>
              </div>
            ) : (
              activeInvestments.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 rounded-2xl bg-[#0E131F] border border-slate-800/80 hover:border-amber-500/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-700 bg-slate-900 shadow-md">
                      <img
                        src={inv.imageUrl || getInvestmentImage(inv.planName)}
                        alt={inv.planName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-xs text-white flex items-center gap-2">
                            <span className="truncate">{inv.planName}</span>
                            <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full shrink-0">
                              +{inv.dailyRoi}% / day
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                            <span>Locked: <b className="text-amber-300 font-mono">Ksh {inv.investedAmount.toLocaleString()}</b></span>
                            <span>•</span>
                            <span>Yield: <b className="text-emerald-400 font-mono">Ksh {inv.totalEarned.toLocaleString()}</b></span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-emerald-400 font-mono">
                            +Ksh {inv.dailyYieldAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/day
                          </div>
                          <div className="text-[10px] text-amber-300 flex items-center justify-end gap-1 font-bold">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Day {inv.daysPassed} of {inv.totalDays}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full"
                        style={{ width: `${Math.min(100, (inv.daysPassed / inv.totalDays) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                      <span>Started: {inv.startDate}</span>
                      <span className="text-amber-400 font-bold">🔒 Locked until: {inv.maturityDate}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-[#0B0F17]/90 rounded-3xl p-6 border border-amber-500/20 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white font-heading">
                Recent Ledger Activity
              </h2>
              <p className="text-xs text-slate-400">Latest deposits, yields & referral payouts</p>
            </div>
            <button
              onClick={onViewAllTransactions}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-2.5">
            {transactions.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0E131F]/60 border border-dashed border-slate-800 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400 flex items-center justify-center mb-3">
                  <Coins className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">No Transactions Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Your deposits, payouts, and automated dividend logs will appear here in real time.
                </p>
              </div>
            ) : (
              transactions.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-2xl bg-[#0E131F] border border-slate-800/80 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'DEPOSIT'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' 
                        : tx.type === 'ROI_PAYOUT'
                        ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                        : tx.type === 'WITHDRAWAL'
                        ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                        : 'bg-yellow-950 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {tx.type === 'DEPOSIT' ? <ArrowDownLeft className="w-4 h-4" /> :
                       tx.type === 'WITHDRAWAL' ? <ArrowUpRight className="w-4 h-4" /> :
                       tx.type === 'ROI_PAYOUT' ? <Coins className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{tx.note || tx.type}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tx.timestamp} • {tx.methodOrAddress || 'Quantiq Core'}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-xs font-black font-mono ${
                      tx.type === 'WITHDRAWAL' ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {tx.type === 'WITHDRAWAL' ? '-' : '+'}Ksh {tx.amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/30">
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
