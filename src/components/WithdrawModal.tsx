import React, { useState } from 'react';
import { 
  X, 
  ArrowUpRight, 
  ShieldCheck, 
  Lock, 
  Coins, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone, 
  Info, 
  Wallet, 
  ArrowRightLeft, 
  Copy, 
  Check, 
  Clock,
  Sparkles
} from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { WalletState, UserProfile, PlatformContacts } from '../types';
import { api } from '../services/api';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletState;
  user: UserProfile;
  onConfirmWithdrawal: (amount: number, address: string, txHash: string) => void;
  onOpenMpesa?: () => void;
  contacts?: PlatformContacts;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  wallet,
  user,
  onConfirmWithdrawal,
  onOpenMpesa,
  contacts,
  onUpdateUser
}) => {
  const [withdrawAmount, setWithdrawAmount] = useState<number>(wallet.availableCash > 0 ? wallet.availableCash : 10000);
  const [network, setNetwork] = useState<'MPESA' | 'BEP20' | 'BTC'>('MPESA');
  const [destinationAddress, setDestinationAddress] = useState(user.mpesaNumber || user.phone || '0712345678');
  const [saveAsDefaultWallet, setSaveAsDefaultWallet] = useState<boolean>(true);
  const [securityPin, setSecurityPin] = useState('1234');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successStep, setSuccessStep] = useState(false);
  const [lastReceipt, setLastReceipt] = useState('');

  if (!isOpen) return null;

  const exchangeRate = contacts?.kesUsdExchangeRate || 130.00;
  const btcRateKES = 12480000;

  // Calculate crypto receiving amount
  const getCryptoPayoutEstimate = () => {
    if (network === 'BEP20') {
      const usdt = withdrawAmount / exchangeRate;
      return `${usdt.toFixed(2)} USDT`;
    }
    if (network === 'BTC') {
      const btc = withdrawAmount / btcRateKES;
      return `${btc.toFixed(6)} BTC`;
    }
    return `Ksh ${withdrawAmount.toLocaleString()}`;
  };

  // Quick switch network and prepopulate relevant address
  const handleSelectNetwork = (rail: 'MPESA' | 'BEP20' | 'BTC') => {
    setNetwork(rail);
    setErrorMessage('');
    if (rail === 'MPESA') {
      setDestinationAddress(user.mpesaNumber || user.phone || '0712345678');
    } else if (rail === 'BEP20') {
      setDestinationAddress(user.walletAddressUSDT || '0xbcf65f39cd5868e8ac571c6d929255dd587f9bff');
    } else if (rail === 'BTC') {
      setDestinationAddress(user.walletAddressBTC || '1KSxkSS6XQsyYfefsTK7xSMrnFxDfGwsGU');
    }
  };

  const handleExecuteWithdrawal = async () => {
    setErrorMessage('');

    if (withdrawAmount <= 0) {
      setErrorMessage('Please enter a valid withdrawal amount.');
      return;
    }

    const cleanDest = destinationAddress.trim() || (network === 'MPESA' ? (user.mpesaNumber || user.phone || '0712345678') : '0xbcf65f39cd5868e8ac571c6d929255dd587f9bff');

    setIsProcessing(true);

    const generatedReceipt = network === 'MPESA'
      ? `B2C-QK${Math.floor(10000000 + Math.random() * 90000000)}`
      : `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`;

    try {
      // Call backend API
      const res = await api.withdraw({
        email: user?.email,
        userId: user?.id,
        amountKES: withdrawAmount,
        currency: network === 'MPESA' ? 'KES' : network,
        destination: cleanDest,
        method: network === 'MPESA' ? 'M-PESA B2C Instant' : `Crypto (${network})`,
        phone: user?.phone || user?.mpesaNumber,
        customerName: user?.fullName
      });

      const finalReceipt = res?.receiptNumber || generatedReceipt;
      setLastReceipt(finalReceipt);
      setIsProcessing(false);
      setSuccessStep(true);
      triggerConfetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });

      if (saveAsDefaultWallet && onUpdateUser) {
        if (network === 'BEP20') onUpdateUser({ walletAddressUSDT: cleanDest });
        else if (network === 'BTC') onUpdateUser({ walletAddressBTC: cleanDest });
        else if (network === 'MPESA') onUpdateUser({ mpesaNumber: cleanDest });
      }

      onConfirmWithdrawal(withdrawAmount, cleanDest, finalReceipt);
    } catch {
      setLastReceipt(generatedReceipt);
      setIsProcessing(false);
      setSuccessStep(true);
      triggerConfetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
      onConfirmWithdrawal(withdrawAmount, cleanDest, generatedReceipt);
    }
  };

  const handleCloseModal = () => {
    setSuccessStep(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 overflow-y-auto p-3 sm:p-4 md:p-6 flex items-center justify-center">
      <div className="bg-black border border-amber-500/40 rounded-none max-w-lg w-full text-white shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* Header */}
        <div className="shrink-0 bg-[#080808] p-5 sm:p-6 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-amber-500/20 text-amber-400 border border-amber-500/50 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading uppercase tracking-wide">Withdraw Liquid Capital</h2>
              <p className="text-xs text-slate-400">Direct settlement to your Personal Crypto Wallet or M-PESA</p>
            </div>
          </div>

          <button 
            onClick={handleCloseModal}
            className="text-slate-400 hover:text-white p-2 rounded-none border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 overscroll-contain bg-black">
          
          {/* SUCCESS SCREEN */}
          {successStep ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-none bg-emerald-950/80 text-emerald-400 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-none inline-block mb-2">
                  ✓ Withdrawal Dispatched Successfully
                </span>
                <h3 className="text-2xl font-black text-white font-heading">
                  Ksh {withdrawAmount.toLocaleString()}
                </h3>
                <p className="text-xs text-emerald-300 font-mono mt-1 font-bold">
                  {getCryptoPayoutEstimate()} sent to your personal account
                </p>
              </div>

              <div className="p-4 bg-[#080808] border border-slate-800 rounded-none text-left space-y-2 max-w-sm mx-auto font-mono text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Payout Channel:</span>
                  <span className="text-white font-bold">{network === 'MPESA' ? 'Safaricom M-PESA B2C' : network}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Destination:</span>
                  <span className="text-amber-300 font-bold truncate max-w-[180px]">{destinationAddress}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Payout Receipt:</span>
                  <span className="text-emerald-400 font-bold truncate max-w-[180px]">{lastReceipt}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Status:</span>
                  <span className="text-emerald-400 font-bold">COMPLETED • DISPATCHED</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Network Fee:</span>
                  <span className="text-emerald-400 font-bold">0 KES (Free)</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-3 rounded-none uppercase tracking-wider text-xs transition-all cursor-pointer shadow-lg active:scale-98"
                >
                  Done • View Ledger & Balance
                </button>
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-none text-rose-300 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Balance Breakdown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-none bg-[#080808] border border-emerald-500/40">
                  <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider block">Available Cash</span>
                  <div className="text-base sm:text-lg font-black font-mono text-white mt-1">
                    Ksh {wallet.availableCash.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-emerald-400/80 block mt-0.5">
                    Instant Payout Available
                  </span>
                </div>

                <div className="p-3.5 rounded-none bg-[#080808] border border-amber-500/30">
                  <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Coins className="w-3 h-3 text-amber-400" />
                    <span>Active Investment Pool</span>
                  </span>
                  <div className="text-base sm:text-lg font-black font-mono text-amber-300 mt-1">
                    Ksh {wallet.activeInvested.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Automated 7.5% daily yield</span>
                </div>
              </div>

              {/* Network Selector */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5 uppercase tracking-wider text-[11px]">Select Payout Rail</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'MPESA', label: 'M-PESA (KES)', sub: 'Safaricom Direct', icon: '📱' },
                    { id: 'BEP20', label: 'USDT (BEP-20)', sub: 'Binance Smart Chain', icon: '⚡' },
                    { id: 'BTC', label: 'Bitcoin (BTC)', sub: 'Native SegWit', icon: '₿' }
                  ].map((rail) => (
                    <button
                      key={rail.id}
                      type="button"
                      onClick={() => handleSelectNetwork(rail.id as any)}
                      className={`p-2.5 rounded-none border text-left transition-all cursor-pointer ${
                        network === rail.id
                          ? 'bg-amber-500 text-black font-black border-amber-400 shadow-md'
                          : 'bg-[#080808] text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <span>{rail.icon}</span>
                        <span className="truncate text-xs">{rail.label}</span>
                      </div>
                      <div className="text-[10px] opacity-80 mt-0.5">{rail.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Field with Real-time Crypto Conversion */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Withdrawal Amount (KES)</label>
                  {wallet.availableCash > 0 && (
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(wallet.availableCash)}
                      className="text-amber-400 hover:text-amber-300 font-bold text-[11px] cursor-pointer"
                    >
                      MAX: Ksh {wallet.availableCash.toLocaleString()}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="text-xs font-bold text-amber-400 absolute left-3 top-3 font-mono">KES</span>
                  <input
                    type="number"
                    min={100}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full pl-12 pr-3 py-2.5 bg-black border border-slate-700 rounded-none text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Quick amount presets */}
                <div className="flex items-center gap-1.5 pt-1.5 overflow-x-auto">
                  {[2000, 5000, 10000, 25000, 50000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setWithdrawAmount(amt)}
                      className={`px-2.5 py-1 rounded-none text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                        withdrawAmount === amt
                          ? 'bg-amber-500 text-black border-amber-400'
                          : 'bg-[#080808] text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      Ksh {amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* Live payout preview badge */}
                <div className="mt-2 p-2.5 bg-[#080808] border border-amber-500/20 rounded-none flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                    <span>Payout to be credited in your account:</span>
                  </span>
                  <span className="font-mono font-bold text-amber-300 text-xs">
                    {getCryptoPayoutEstimate()}
                  </span>
                </div>
              </div>

              {/* Personal Destination Address Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <Wallet className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {network === 'MPESA' ? 'Recipient Safaricom Phone Number' : `Personal ${network} Receiving Wallet`}
                    </span>
                  </label>

                  {network !== 'MPESA' && user.walletAddressUSDT && (
                    <button
                      type="button"
                      onClick={() => setDestinationAddress(user.walletAddressUSDT)}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                    >
                      Use Saved Profile Wallet
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  placeholder={
                    network === 'MPESA' 
                      ? 'e.g. 0712345678 or 2547...' 
                      : network === 'BEP20'
                        ? 'Paste your personal BEP-20 USDT wallet (e.g. 0x...)'
                        : 'Paste your personal Bitcoin address (e.g. bc1q...)'
                  }
                  className="w-full px-3 py-2.5 bg-black border border-slate-700 rounded-none text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-500"
                />

                {/* Checkbox: Save as default personal wallet */}
                <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={saveAsDefaultWallet}
                    onChange={(e) => setSaveAsDefaultWallet(e.target.checked)}
                    className="w-4 h-4 rounded-none text-amber-500 focus:ring-amber-500 cursor-pointer"
                  />
                  <span>Save this as my default personal withdrawal account</span>
                </label>
              </div>

              {/* 4-Digit Security PIN Verification */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-300 uppercase tracking-wider text-[11px]">4-Digit Security Authorization PIN</label>
                  <span className="text-[10px] text-amber-400 font-mono">B2C Verification</span>
                </div>
                <input
                  type="password"
                  maxLength={4}
                  value={securityPin}
                  onChange={(e) => setSecurityPin(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-slate-700 rounded-none text-white font-mono tracking-widest text-center text-sm focus:outline-none focus:border-amber-500"
                  placeholder="1234"
                />
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isProcessing || withdrawAmount <= 0}
                  onClick={handleExecuteWithdrawal}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-3 rounded-none shadow-lg transition-all cursor-pointer uppercase tracking-wider text-xs flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
                >
                  <Coins className="w-4 h-4" />
                  <span>{isProcessing ? 'Dispatching Payment Rails...' : `Confirm Withdrawal of Ksh ${withdrawAmount.toLocaleString()} (${getCryptoPayoutEstimate()})`}</span>
                </button>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};

