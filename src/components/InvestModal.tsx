import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Sparkles, 
  DollarSign, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Coins, 
  Lock, 
  ShieldCheck 
} from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { InvestmentPlan, WalletState } from '../types';
import { getInvestmentImage } from '../utils/investmentAssets';

interface InvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: InvestmentPlan | null;
  wallet: WalletState;
  onConfirmInvest: (plan: InvestmentPlan, amount: number) => void;
  onOpenDeposit: () => void;
}

export const InvestModal: React.FC<InvestModalProps> = ({
  isOpen,
  onClose,
  plan,
  wallet,
  onConfirmInvest,
  onOpenDeposit
}) => {
  if (!isOpen || !plan) return null;

  const [investAmount, setInvestAmount] = useState<number>(plan.minDeposit);
  const [autoReinvest, setAutoReinvest] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successStep, setSuccessStep] = useState(false);

  const dailyYield = (investAmount * (plan.dailyRoi / 100));
  const totalProfit = dailyYield * plan.durationDays;
  const totalReturn = investAmount + totalProfit;

  // Calculate maturity date
  const maturityDateObj = new Date();
  maturityDateObj.setDate(maturityDateObj.getDate() + plan.durationDays);
  const maturityDateStr = maturityDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const hasSufficientBalance = wallet.availableCash >= investAmount;

  const handleExecuteInvest = () => {
    setErrorMessage('');

    if (investAmount < plan.minDeposit) {
      setErrorMessage(`Minimum deposit for ${plan.name} is Ksh ${plan.minDeposit.toLocaleString()}.`);
      return;
    }

    if (investAmount > plan.maxDeposit) {
      setErrorMessage(`Maximum deposit for ${plan.name} is Ksh ${plan.maxDeposit.toLocaleString()}.`);
      return;
    }

    if (!hasSufficientBalance) {
      setErrorMessage(`Insufficient liquid wallet capital (Ksh ${wallet.availableCash.toLocaleString('en-KE', { minimumFractionDigits: 2 })} available). Please deposit funds first via M-PESA.`);
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setSuccessStep(true);
      triggerConfetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

      onConfirmInvest(plan, investAmount);

      setTimeout(() => {
        setSuccessStep(false);
        onClose();
      }, 1400);
    }, 700);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 overflow-y-auto p-3 sm:p-4 md:p-6 flex items-center justify-center">
      <div className="bg-[#0B0F17] border border-amber-500/30 rounded-3xl max-w-lg w-full text-white shadow-2xl overflow-hidden backdrop-blur-2xl my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-[#0E131F] via-[#151A29] to-[#0E131F] p-5 sm:p-6 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading">Activate {plan.name}</h2>
              <p className="text-xs text-amber-400 font-bold">+{plan.dailyRoi}% Daily Yield • 🔒 Locked {plan.durationDays} Days</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 overscroll-contain">
          
          {/* Investment Bullion Asset Picture Card */}
          <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-slate-700/80 shadow-lg group">
            <img 
              src={plan.imageUrl || getInvestmentImage(plan.name)} 
              alt={plan.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17] via-[#0B0F17]/40 to-transparent"></div>
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/20 text-amber-300">
                  {plan.name.toLowerCase().includes('gold') 
                    ? '🏅 999.9 Gold Bullion Contract' 
                    : plan.name.toLowerCase().includes('silver') 
                    ? '🥈 999 Fine Silver Bullion Contract' 
                    : `💎 ${plan.name} Bullion`}
                </span>
                <div className="text-sm font-black text-white font-heading mt-0.5">{plan.name} Yield Package</div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-black text-emerald-400 bg-black/80 px-2 py-1 rounded-md border border-emerald-500/30">
                  +{plan.dailyRoi}% / day
                </span>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-300 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Capital Balance Bar */}
          <div className="flex items-center justify-between p-3.5 bg-[#07090E] border border-slate-800 rounded-2xl">
            <div>
              <span className="text-slate-400 block text-[11px]">Available Liquid Capital:</span>
              <span className="font-mono font-bold text-white text-sm">
                Ksh {wallet.availableCash.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full">
              Ready for Allocation
            </span>
          </div>

          {/* Amount input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-300">Contract Principal Allocation (KES)</label>
              <span className="text-slate-400 font-mono text-[11px]">
                Min: Ksh {plan.minDeposit.toLocaleString()} • Max: Ksh {plan.maxDeposit.toLocaleString()}
              </span>
            </div>
            <div className="relative">
              <span className="text-xs font-bold text-amber-400 absolute left-3 top-3 font-mono">KES</span>
              <input
                type="number"
                min={plan.minDeposit}
                max={plan.maxDeposit}
                value={investAmount}
                onChange={(e) => setInvestAmount(Number(e.target.value))}
                className="w-full pl-12 pr-3 py-2.5 bg-[#07090E] border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* 24-Hour Yield Cycle Terms Card */}
          <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-2.5 text-slate-300">
            <Coins className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="text-amber-300 font-bold block">⚡ 24-Hour Yield & Liquidity Cycle</span>
              Your allocation of <b>Ksh {investAmount.toLocaleString()}</b> generates automated daily earnings (+Ksh {dailyYield.toLocaleString()} / day). Returns are paid into your wallet every 24h, and you are eligible to withdraw earnings and capital after every 24 hours.
            </div>
          </div>

          {/* Projected returns overview */}
          <div className="p-4 rounded-2xl bg-[#07090E] border border-slate-800 space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>Contract Duration:</span>
              <span className="font-bold text-white font-mono">{plan.durationDays} Days (Matures: {maturityDateStr})</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Daily Automated ROI (7.5%):</span>
              <span className="font-bold text-emerald-400 font-mono">+Ksh {dailyYield.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / day</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Total Guaranteed Net Profit:</span>
              <span className="font-bold text-emerald-400 font-mono">+Ksh {totalProfit.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white">
              <span>Total Return (Principal + Profit):</span>
              <span className="text-amber-400 font-mono text-sm">Ksh {totalReturn.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2">
            {!hasSufficientBalance ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDeposit();
                }}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-3 rounded-xl shadow-lg transition-all cursor-pointer uppercase tracking-wider text-xs flex items-center justify-center gap-2"
              >
                <span>Deposit Ksh {(investAmount - wallet.availableCash).toLocaleString('en-KE', { minimumFractionDigits: 2 })} to Complete Package</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecuteInvest}
                className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black py-3 rounded-xl shadow-lg transition-all cursor-pointer uppercase tracking-wider text-xs flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{isProcessing ? 'Locking Capital & Deploying Contract...' : `Lock in Ksh ${investAmount.toLocaleString()} in ${plan.name}`}</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
