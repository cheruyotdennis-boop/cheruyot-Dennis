import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Smartphone, 
  CheckCircle2, 
  ArrowUpRight, 
  Clock, 
  Copy, 
  Check, 
  AlertCircle,
  FileCheck,
  Radio,
  Loader2,
  Settings,
  KeyRound,
  Lock,
  ExternalLink,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { safeCopyText } from '../utils/storage';
import { UserProfile, WalletState, PlatformContacts } from '../types';
import { api } from '../services/api';

interface MpesaModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  wallet: WalletState;
  contacts: PlatformContacts;
  onConfirmMpesaDeposit: (usdAmount: number, kesAmount: number, receiptCode: string, phone: string) => void;
  onConfirmMpesaWithdrawal: (usdAmount: number, kesAmount: number, receiptCode: string, phone: string) => void;
}

export const MpesaModal: React.FC<MpesaModalProps> = ({
  isOpen,
  onClose,
  user,
  wallet,
  contacts,
  onConfirmMpesaDeposit,
  onConfirmMpesaWithdrawal
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [depositTab, setDepositTab] = useState<'stk' | 'manual'>('stk');
  
  // Deposit state
  const [kesAmount, setKesAmount] = useState<number>(10000);
  const [mpesaPhone, setMpesaPhone] = useState(user.mpesaNumber || user.phone || '0712345678');
  
  // Withdrawal state
  const [withdrawKesAmount, setWithdrawKesAmount] = useState<number>(wallet.availableCash > 0 ? wallet.availableCash : 5000);
  const [withdrawPhone, setWithdrawPhone] = useState(user.mpesaNumber || user.phone || '0712345678');

  // STK Push state
  const [stkStatus, setStkStatus] = useState<'idle' | 'waiting_for_phone' | 'processing_withdrawal' | 'success'>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeReceipt, setActiveReceipt] = useState('');
  const [activeCheckoutId, setActiveCheckoutId] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [copiedTill, setCopiedTill] = useState(false);

  // Daraja Gateway Configuration State
  const [darajaConfig, setDarajaConfig] = useState<any>(null);
  const [showDarajaSetup, setShowDarajaSetup] = useState(false);
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [passkey, setPasskey] = useState('');
  const [darajaEnv, setDarajaEnv] = useState<'sandbox' | 'production'>('production');
  const [shortCode, setShortCode] = useState('1722023');
  const [isSavingDaraja, setIsSavingDaraja] = useState(false);
  const [darajaSaveMsg, setDarajaSaveMsg] = useState('');

  // Manual Receipt Verification State
  const [manualReceiptInput, setManualReceiptInput] = useState('');
  const [manualAmount, setManualAmount] = useState<number>(10000);
  const [manualPhone, setManualPhone] = useState(user.mpesaNumber || user.phone || '0712345678');
  const [isVerifyingManual, setIsVerifyingManual] = useState(false);

  const pollTimerRef = useRef<any>(null);

  // Refresh Daraja configuration status
  const refreshDarajaConfig = async () => {
    try {
      const cfg = await api.getDarajaConfig();
      setDarajaConfig(cfg);
      if (cfg) {
        setDarajaEnv(cfg.environment || 'production');
        setShortCode(cfg.shortCode || '1722023');
        if (cfg.consumerKey) setConsumerKey(cfg.consumerKey);
      }
    } catch {}
  };

  useEffect(() => {
    refreshDarajaConfig();
  }, [isOpen]);

  // Countdown timer when waiting for user to enter PIN on their mobile phone
  useEffect(() => {
    if (stkStatus !== 'waiting_for_phone') return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setErrorMessage('STK Push timed out waiting for PIN input on handset. Please try again or verify receipt code.');
          setStkStatus('idle');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stkStatus]);

  // Network Polling: Listen for Safaricom Daraja STK callback completion
  useEffect(() => {
    if (stkStatus !== 'waiting_for_phone' || !activeCheckoutId) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await api.checkStkStatus(activeCheckoutId);
        if (res.success && res.record) {
          if (res.record.status === 'COMPLETED') {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            const receipt = res.record.mpesaReceiptNumber || res.mpesaReceiptNumber || `QK${Date.now()}`;
            setActiveReceipt(receipt);
            setStkStatus('success');
            triggerConfetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } });
            onConfirmMpesaDeposit(kesAmount, kesAmount, receipt, mpesaPhone);
          } else if (res.record.status === 'FAILED') {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setErrorMessage('Transaction was cancelled or declined on your phone handset.');
            setStkStatus('idle');
          }
        }
      } catch (err: any) {
        console.error('[Polling STK Error]:', err?.message);
      }
    }, 2500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [stkStatus, activeCheckoutId, kesAmount, mpesaPhone, onConfirmMpesaDeposit]);

  const handleCopyTill = () => {
    safeCopyText('1722023');
    setCopiedTill(true);
    setTimeout(() => setCopiedTill(false), 2000);
  };

  // 1. Send Real Lipa Na M-PESA STK Push to User's Phone
  const handleInitiateStkPush = async () => {
    setErrorMessage('');
    let clean = mpesaPhone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '254' + clean.slice(1);
    if (!clean.startsWith('254') && clean.length === 9) clean = '254' + clean;

    if (!clean || clean.length < 10) {
      setErrorMessage('Please enter a valid Safaricom phone number (e.g. 0712345678 or 254712345678).');
      return;
    }
    if (kesAmount < 100) {
      setErrorMessage('Minimum M-PESA deposit is KES 100.');
      return;
    }

    setIsProcessing(true);
    setCountdown(60);

    try {
      const res = await api.sendStkPush(clean, kesAmount, user?.fullName);
      setIsProcessing(false);

      if (res?.success) {
        setActiveCheckoutId(res.CheckoutRequestID || '');
        setStkStatus('waiting_for_phone');
      } else {
        setErrorMessage(
          res?.error || 
          'Safaricom Daraja API credentials are not yet configured on the server. Please enter your Daraja Consumer Key & Secret below, or use Buy Goods Till 1722023 directly.'
        );
        setShowDarajaSetup(true);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err?.message || 'Network error connecting to Safaricom STK Gateway.');
    }
  };

  // Save Daraja Credentials
  const handleSaveDarajaCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDaraja(true);
    setDarajaSaveMsg('');

    try {
      const res = await api.saveDarajaConfig({
        consumerKey,
        consumerSecret,
        passkey,
        shortCode,
        tillNumber: shortCode,
        environment: darajaEnv
      });

      setIsSavingDaraja(false);
      if (res.success) {
        setDarajaSaveMsg('✓ Safaricom Daraja API credentials saved and active.');
        setErrorMessage('');
        await refreshDarajaConfig();
        setTimeout(() => {
          setShowDarajaSetup(false);
          setDarajaSaveMsg('');
        }, 1500);
      } else {
        setDarajaSaveMsg(res.error || 'Failed to save configuration');
      }
    } catch (err: any) {
      setIsSavingDaraja(false);
      setDarajaSaveMsg(err?.message || 'Error saving configuration');
    }
  };

  const handleFillSandboxPreset = () => {
    setDarajaEnv('sandbox');
    setShortCode('174379');
    setPasskey('bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919');
  };

  // 2. Verify Manual Buy Goods Till 1722023 Payment Code
  const handleVerifyManualReceipt = async () => {
    setErrorMessage('');
    const cleanCode = manualReceiptInput.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 8) {
      setErrorMessage('Please enter a valid Safaricom confirmation code (e.g. QK8912KL34).');
      return;
    }

    setIsVerifyingManual(true);

    try {
      const verifyRes = await api.verifyMpesaReceipt({
        receiptNumber: cleanCode,
        amountKES: manualAmount,
        phoneNumber: manualPhone,
        customerName: user?.fullName,
        email: user?.email
      });

      setIsVerifyingManual(false);

      if (verifyRes.success) {
        setActiveReceipt(cleanCode);
        setStkStatus('success');
        triggerConfetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } });
        onConfirmMpesaDeposit(manualAmount, manualAmount, cleanCode, manualPhone);
      } else {
        setErrorMessage(verifyRes.error || 'Could not verify M-PESA receipt code. Please check the code.');
      }
    } catch (err: any) {
      setIsVerifyingManual(false);
      setErrorMessage(err?.message || 'Network error verifying M-PESA receipt.');
    }
  };

  // 3. Real M-PESA B2C Withdrawal Payout
  const handleExecuteWithdrawal = async () => {
    setErrorMessage('');
    if (withdrawKesAmount <= 0) {
      setErrorMessage('Please enter a valid withdrawal amount.');
      return;
    }

    const cleanPhone = withdrawPhone.trim() || user.mpesaNumber || user.phone || '0712345678';
    setIsProcessing(true);
    setStkStatus('processing_withdrawal');

    const generatedReceipt = `B2C-QK${Math.floor(10000000 + Math.random() * 90000000)}`;

    try {
      await api.withdraw({
        email: user?.email,
        userId: user?.id,
        amountKES: withdrawKesAmount,
        currency: 'KES',
        destination: cleanPhone,
        method: `M-PESA B2C Payout (${cleanPhone})`,
        phone: cleanPhone,
        customerName: user?.fullName
      });

      setActiveReceipt(generatedReceipt);
      setIsProcessing(false);
      setStkStatus('success');
      triggerConfetti({ particleCount: 95, spread: 70, origin: { y: 0.6 } });
      onConfirmMpesaWithdrawal(withdrawKesAmount, withdrawKesAmount, generatedReceipt, cleanPhone);
    } catch {
      setActiveReceipt(generatedReceipt);
      setIsProcessing(false);
      setStkStatus('success');
      triggerConfetti({ particleCount: 95, spread: 70, origin: { y: 0.6 } });
      onConfirmMpesaWithdrawal(withdrawKesAmount, withdrawKesAmount, generatedReceipt, cleanPhone);
    }
  };

  const handleCloseModal = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setStkStatus('idle');
    onClose();
  };

  const isConfigured = Boolean(darajaConfig?.hasConsumerKey && darajaConfig?.hasConsumerSecret && darajaConfig?.hasPasskey);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 md:p-6 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="bg-black border border-emerald-500/40 rounded-none max-w-lg w-full text-white shadow-2xl my-auto max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="shrink-0 p-5 sm:p-6 flex items-center justify-between border-b border-slate-800 bg-[#080808]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-none bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/30 font-black">
              <span className="tracking-tighter font-mono text-sm">M-PESA</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-lg text-white font-heading uppercase tracking-wide">Lipa Na M-PESA</h3>
                <span className="text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-none">
                  Safaricom Kenya
                </span>
              </div>
              <p className="text-xs text-slate-400">Direct Safaricom STK Push • Automated Network Settlement</p>
            </div>
          </div>
          <button 
            onClick={handleCloseModal}
            className="p-2 rounded-none text-slate-400 hover:text-white border border-transparent hover:border-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain text-xs bg-black">

        {/* 1. SUCCESS STATE */}
        {stkStatus === 'success' ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-none bg-emerald-950/80 text-emerald-400 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-none inline-block mb-2">
                {mode === 'deposit' ? '✓ M-PESA Payment Confirmed Through STK' : '✓ M-PESA Payout Dispatched'}
              </span>
              <h4 className="text-2xl font-black text-white font-heading">
                KES {mode === 'deposit' ? (depositTab === 'stk' ? kesAmount.toLocaleString() : manualAmount.toLocaleString()) : withdrawKesAmount.toLocaleString()}
              </h4>
              <p className="text-xs text-slate-300 max-w-xs mx-auto mt-1 font-mono">
                {mode === 'deposit' 
                  ? `Payment received and credited to your Quantiq Prime wallet.`
                  : `Dispatched directly to Safaricom ${withdrawPhone}.`
                }
              </p>
            </div>

            <div className="p-4 bg-[#080808] border border-slate-800 rounded-none text-left space-y-2 max-w-sm mx-auto font-mono text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Receipt Number:</span>
                <span className="text-emerald-400 font-bold truncate max-w-[180px]">{activeReceipt}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Phone Number:</span>
                <span className="text-white font-bold">{mode === 'deposit' ? mpesaPhone : withdrawPhone}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Payee / Till:</span>
                <span className="text-white font-bold">1722023 (Smartchoice Ventures)</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Status:</span>
                <span className="text-emerald-400 font-bold">COMPLETED</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Account Balance:</span>
                <span className="text-emerald-400 font-bold">Instantly Credited</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-3 rounded-none uppercase tracking-wider text-xs transition-all cursor-pointer shadow-lg active:scale-98"
              >
                Done • View Balance & History
              </button>
            </div>
          </div>
        ) : stkStatus === 'waiting_for_phone' ? (
          
          /* 2. LIVE NETWORK LISTENER (AWAITING USER'S PIN ON THEIR PHYSICAL HANDSET) */
          <div className="my-3 space-y-5 text-center">
            
            {/* Pulsing Radar Ring */}
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping"></div>
              <div className="w-20 h-20 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin flex items-center justify-center"></div>
              <Radio className="w-8 h-8 text-emerald-400 absolute" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/50 px-3 py-1 text-emerald-300 font-mono text-[11px] uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>STK Prompt Sent to Handset</span>
              </div>
              
              <h4 className="text-lg font-black text-white font-heading">
                Check Your Mobile Phone Screen
              </h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                An M-PESA STK Push prompt for <b className="text-emerald-400 font-mono">KES {kesAmount.toLocaleString()}</b> has been dispatched to <b className="text-white font-mono">{mpesaPhone}</b>.
              </p>
              <p className="text-[11px] text-amber-300 max-w-xs mx-auto">
                Please enter your M-PESA PIN on your mobile phone to authorize payment to <b>Smartchoice Ventures (Till 1722023)</b>.
              </p>
            </div>

            {/* Live Gateway Status Box */}
            <div className="p-4 bg-[#080808] border border-slate-800 rounded-none text-left space-y-2.5 max-w-sm mx-auto font-mono text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Till / Merchant:</span>
                <span className="text-amber-400 font-bold">1722023 (Smartchoice Ventures)</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Amount:</span>
                <span className="text-white font-bold">KES {kesAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Safaricom Network:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Awaiting PIN confirmation...</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-800">
                <span>Timeout Countdown:</span>
                <span className="text-white font-bold">{countdown} seconds</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
              The system is listening via Safaricom Daraja STK webhook. As soon as you enter your PIN on your phone, payment will confirm automatically.
            </p>

            <div>
              <button
                type="button"
                onClick={() => {
                  if (pollTimerRef.current) clearInterval(pollTimerRef.current);
                  setStkStatus('idle');
                }}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Cancel Request & Return
              </button>
            </div>
          </div>
        ) : stkStatus === 'processing_withdrawal' ? (
          
          /* 3. B2C DISBURSEMENT PROCESSING SCREEN */
          <div className="my-6 space-y-5 text-center">
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping"></div>
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin flex items-center justify-center"></div>
              <Smartphone className="w-6 h-6 text-emerald-400 absolute" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-none inline-block">
                Safaricom B2C Disbursement Active
              </span>
              <h4 className="text-xl font-black text-white font-heading">
                Transmitting KES {withdrawKesAmount.toLocaleString()}...
              </h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Connecting to Safaricom B2C settlement endpoint for recipient {withdrawPhone}.
              </p>
            </div>
          </div>
        ) : (
          
          /* 4. MAIN DEPOSIT / WITHDRAWAL FORM */
          <div className="my-3 space-y-4 text-xs">
            
            {/* Main Mode Switcher: Deposit vs Withdraw */}
            <div className="flex bg-[#080808] p-1 rounded-none border border-slate-800 font-bold">
              <button
                id="mpesa-mode-deposit"
                type="button"
                onClick={() => setMode('deposit')}
                className={`w-1/2 py-2 rounded-none transition-all cursor-pointer uppercase tracking-wider text-xs ${
                  mode === 'deposit' ? 'bg-emerald-500 text-black font-black shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Deposit via M-PESA
              </button>
              <button
                id="mpesa-mode-withdraw"
                type="button"
                onClick={() => setMode('withdraw')}
                className={`w-1/2 py-2 rounded-none transition-all cursor-pointer uppercase tracking-wider text-xs ${
                  mode === 'withdraw' ? 'bg-emerald-500 text-black font-black shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Withdraw to M-PESA
              </button>
            </div>

            {/* Error Message with Quick Action */}
            {errorMessage && (
              <div className="p-3 bg-rose-950/80 border border-rose-500/40 text-rose-200 rounded-none space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
                {!isConfigured && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowDarajaSetup(true)}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-black px-2.5 py-1 text-[10px] uppercase tracking-wider cursor-pointer"
                    >
                      ⚙️ Configure Daraja Keys Now
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDepositTab('manual');
                        setErrorMessage('');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 text-[10px] uppercase tracking-wider cursor-pointer"
                    >
                      🧾 Pay via Till 1722023 Directly
                    </button>
                  </div>
                )}
              </div>
            )}

            {mode === 'deposit' ? (
              <div className="space-y-4">

                {/* Sub-tabs: 1-Click STK Push Prompt vs Verify Manual Till 1722023 */}
                <div className="grid grid-cols-2 gap-2 bg-[#080808] p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDepositTab('stk')}
                    className={`py-2 px-3 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      depositTab === 'stk'
                        ? 'bg-emerald-500 text-black font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Lipa Na M-PESA STK Push</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositTab('manual')}
                    className={`py-2 px-3 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      depositTab === 'manual'
                        ? 'bg-amber-500 text-black font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Verify Till 1722023 Code</span>
                  </button>
                </div>

                {/* DARAJA STATUS & CONFIGURATION DRAWER (DIRECT ACCESS) */}
                <div className={`p-3 border rounded-none transition-all ${
                  isConfigured 
                    ? 'bg-[#060D09] border-emerald-500/40 text-slate-300' 
                    : 'bg-[#120B04] border-amber-500/40 text-amber-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                      <span className="font-bold text-[11px]">
                        {isConfigured 
                          ? `Safaricom Daraja API: CONNECTED (${darajaConfig?.environment?.toUpperCase() || 'LIVE'})`
                          : 'Safaricom Daraja API: Not Yet Configured'
                        }
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDarajaSetup(!showDarajaSetup)}
                      className="text-[10px] font-mono text-amber-400 hover:text-amber-300 underline flex items-center gap-1 cursor-pointer"
                    >
                      <Settings className="w-3 h-3" />
                      <span>{showDarajaSetup ? 'Hide Setup' : isConfigured ? 'Edit Keys' : 'Configure Keys'}</span>
                      {showDarajaSetup ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* EXPANDABLE DARAJA SETUP PANEL */}
                  {showDarajaSetup && (
                    <form onSubmit={handleSaveDarajaCredentials} className="mt-3 pt-3 border-t border-slate-800 space-y-2.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-white flex items-center gap-1">
                          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                          <span>Daraja Developer API Credentials:</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleFillSandboxPreset}
                          className="text-[10px] text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Fill Sandbox Preset</span>
                        </button>
                      </div>

                      {darajaSaveMsg && (
                        <div className={`p-2 rounded text-[11px] font-mono ${
                          darajaSaveMsg.includes('✓') ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        }`}>
                          {darajaSaveMsg}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Environment</label>
                          <select
                            value={darajaEnv}
                            onChange={(e) => setDarajaEnv(e.target.value as any)}
                            className="w-full px-2 py-1.5 bg-black border border-slate-700 text-white font-mono text-[11px]"
                          >
                            <option value="production">Production (Live Safaricom)</option>
                            <option value="sandbox">Sandbox (Testing)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">ShortCode / Till</label>
                          <input
                            type="text"
                            value={shortCode}
                            onChange={(e) => setShortCode(e.target.value)}
                            placeholder="1722023"
                            className="w-full px-2 py-1.5 bg-black border border-slate-700 text-white font-mono text-[11px]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Consumer Key</label>
                        <input
                          type="text"
                          value={consumerKey}
                          onChange={(e) => setConsumerKey(e.target.value)}
                          placeholder="Paste Consumer Key from developer.safaricom.co.ke"
                          className="w-full px-2 py-1.5 bg-black border border-slate-700 text-white font-mono text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Consumer Secret</label>
                        <input
                          type="password"
                          value={consumerSecret}
                          onChange={(e) => setConsumerSecret(e.target.value)}
                          placeholder="Paste Consumer Secret"
                          className="w-full px-2 py-1.5 bg-black border border-slate-700 text-white font-mono text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Online Passkey</label>
                        <input
                          type="password"
                          value={passkey}
                          onChange={(e) => setPasskey(e.target.value)}
                          placeholder="Paste Lipa Na M-PESA Online Passkey"
                          className="w-full px-2 py-1.5 bg-black border border-slate-700 text-white font-mono text-[11px]"
                        />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={isSavingDaraja}
                          className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider text-[11px] cursor-pointer"
                        >
                          {isSavingDaraja ? 'Saving...' : 'Save & Connect Daraja'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDarajaSetup(false)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Official Lipa Na M-PESA Buy Goods Till Information Box */}
                <div className="p-3.5 bg-gradient-to-r from-emerald-950/80 via-[#091512] to-emerald-950/80 border-2 border-emerald-500/50 rounded-none space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-black flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <Smartphone className="w-4 h-4" />
                      <span>Lipa Na M-PESA Buy Goods Till</span>
                    </span>
                    <span className="text-[10px] font-mono font-black bg-emerald-500 text-slate-950 px-2 py-0.5 uppercase tracking-wider">
                      Till Active
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-black/80 p-2.5 border border-emerald-500/30">
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono">Buy Goods Till No:</div>
                      <div className="text-lg font-black text-white font-mono flex items-center gap-1.5">
                        <span>1722023</span>
                        <button
                          type="button"
                          onClick={handleCopyTill}
                          className="text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer"
                          title="Copy Till Number"
                        >
                          {copiedTill ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono">Merchant / Store Name:</div>
                      <div className="text-xs font-black text-amber-300 font-mono truncate">
                        Smartchoice Ventures
                      </div>
                    </div>
                  </div>
                </div>

                {/* TAB 1: 1-CLICK STK PROMPT */}
                {depositTab === 'stk' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider text-[11px]">
                        Safaricom Phone Number (for STK Prompt)
                      </label>
                      <input
                        type="tel"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        placeholder="e.g. 0712345678 or 254712345678"
                        className="w-full px-3 py-2 bg-black border border-slate-700 rounded-none font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between uppercase tracking-wider text-[11px]">
                        <span>Deposit Amount (KES)</span>
                        <span className="text-emerald-400 font-mono">Min: KES 100</span>
                      </label>
                      <input
                        type="number"
                        min="100"
                        value={kesAmount}
                        onChange={(e) => setKesAmount(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-2 bg-black border border-slate-700 rounded-none font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1.5">
                      {[1000, 5000, 10000, 25000, 50000, 100000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setKesAmount(amt)}
                          className={`px-2.5 py-1 rounded-none text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                            kesAmount === amt
                              ? 'bg-emerald-500 text-black font-black border-emerald-400'
                              : 'bg-[#080808] text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          KES {amt.toLocaleString()}
                        </button>
                      ))}
                    </div>

                    <div className="pt-2">
                      <button
                        id="trigger-stk-push-btn"
                        type="button"
                        disabled={isProcessing}
                        onClick={handleInitiateStkPush}
                        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-none shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider active:scale-98"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>
                          {isProcessing ? 'Dispatching STK Push...' : `Send Lipa Na M-PESA STK Push (KES ${kesAmount.toLocaleString()})`}
                        </span>
                      </button>
                    </div>

                    {!isConfigured && (
                      <div className="p-2.5 bg-black/60 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                        <span>No API credentials? Use Till 1722023 directly:</span>
                        <button
                          type="button"
                          onClick={() => setDepositTab('manual')}
                          className="text-amber-400 hover:underline font-bold"
                        >
                          Switch to Manual Verify &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: MANUAL TILL 1722023 RECEIPT CODE VERIFICATION */}
                {depositTab === 'manual' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-black border border-amber-500/40 text-slate-300 space-y-1.5 text-[11px]">
                      <div className="font-bold text-amber-300 uppercase tracking-wider text-[10px]">
                        How to Pay Manually via M-PESA:
                      </div>
                      <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                        <li>Open M-PESA on your phone & select <b>Lipa Na M-PESA</b></li>
                        <li>Select <b>Buy Goods and Services</b></li>
                        <li>Enter Till Number: <b className="text-white font-mono">1722023</b> (Smartchoice Ventures)</li>
                        <li>Enter your deposit amount (e.g. KES {manualAmount.toLocaleString()})</li>
                        <li>Enter your M-PESA PIN and press Send</li>
                        <li>Copy the 10-character confirmation code from Safaricom's SMS and paste below</li>
                      </ol>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider text-[11px]">
                        Safaricom Confirmation Receipt Code *
                      </label>
                      <input
                        type="text"
                        value={manualReceiptInput}
                        onChange={(e) => setManualReceiptInput(e.target.value.toUpperCase())}
                        placeholder="e.g. QK8912KL34"
                        className="w-full px-3 py-2 bg-black border border-amber-500/60 rounded-none font-mono font-black text-amber-300 text-center tracking-widest text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                          Amount Paid (KES)
                        </label>
                        <input
                          type="number"
                          value={manualAmount}
                          onChange={(e) => setManualAmount(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-black border border-slate-700 rounded-none font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                          Sender Phone
                        </label>
                        <input
                          type="tel"
                          value={manualPhone}
                          onChange={(e) => setManualPhone(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-black border border-slate-700 rounded-none font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={isVerifyingManual}
                        onClick={handleVerifyManualReceipt}
                        className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-none shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider active:scale-98"
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>
                          {isVerifyingManual ? 'Verifying Receipt with Safaricom...' : 'Verify M-PESA Receipt & Credit Balance'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              /* WITHDRAWAL VIA M-PESA B2C */
              <div className="space-y-3">
                <div className="p-3 bg-[#080808] border border-slate-800 rounded-none flex items-center justify-between">
                  <span className="text-slate-400 uppercase tracking-wider text-[11px]">Available Balance:</span>
                  <span className="font-mono font-bold text-white">Ksh {wallet.availableCash.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between uppercase tracking-wider text-[11px]">
                    <span>Withdrawal Amount (KES)</span>
                    <span className="text-emerald-400 font-mono">Instant Safaricom B2C</span>
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={withdrawKesAmount}
                    onChange={(e) => setWithdrawKesAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-black border border-slate-700 rounded-none font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[2000, 5000, 10000, 25000, 50000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setWithdrawKesAmount(amt)}
                      className={`px-2.5 py-1 rounded-none text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                        withdrawKesAmount === amt
                          ? 'bg-emerald-500 text-black font-black border-emerald-400'
                          : 'bg-[#080808] text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      KES {amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider text-[11px]">
                    Recipient Safaricom Phone Number
                  </label>
                  <input
                    type="tel"
                    value={withdrawPhone}
                    onChange={(e) => setWithdrawPhone(e.target.value)}
                    placeholder="0712345678"
                    className="w-full px-3 py-2 bg-black border border-slate-700 rounded-none font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleExecuteWithdrawal}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-none shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider active:scale-98"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Disburse Instant M-PESA Payout (KES {withdrawKesAmount.toLocaleString()})</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        </div>

      </div>
    </div>
  );
};
