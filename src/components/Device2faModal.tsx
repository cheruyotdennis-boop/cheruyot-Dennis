import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Smartphone, 
  Mail, 
  CheckCircle2, 
  Lock, 
  RefreshCw, 
  Laptop, 
  AlertTriangle, 
  Sparkles,
  ShieldCheck,
  X
} from 'lucide-react';
import { UserProfile } from '../types';
import { getCurrentDeviceInfo, maskPhone, maskEmail } from '../utils/deviceSecurity';
import { triggerConfetti } from '../utils/confetti';

export interface Device2faModalProps {
  isOpen: boolean;
  user: Partial<UserProfile>;
  expectedCode: string;
  mode?: 'login' | 'register' | 'device';
  initialChannel?: 'phone' | 'email';
  onSuccess: (trustedDevice: boolean) => void;
  onCancel: () => void;
  onResendCode: (channel: 'phone' | 'email') => string; // returns new code
}

export const Device2faModal: React.FC<Device2faModalProps> = ({
  isOpen,
  user,
  expectedCode,
  mode = 'login',
  initialChannel = 'phone',
  onSuccess,
  onCancel,
  onResendCode
}) => {
  const [deliveryChannel, setDeliveryChannel] = useState<'phone' | 'email'>(initialChannel);
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [currentCode, setCurrentCode] = useState<string>(expectedCode);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [trustDevice, setTrustDevice] = useState<boolean>(true);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300); // 5 minutes
  const [copiedCodeNotice, setCopiedCodeNotice] = useState<boolean>(false);
  const [showNotificationToast, setShowNotificationToast] = useState<boolean>(true);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const deviceInfo = getCurrentDeviceInfo();

  useEffect(() => {
    setCurrentCode(expectedCode);
    setOtpValues(['', '', '', '', '', '']);
    setErrorMessage('');
    setSecondsRemaining(300);
    setShowNotificationToast(true);
    setDeliveryChannel(initialChannel);

    // Auto-focus first digit
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);
  }, [expectedCode, isOpen, initialChannel]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, secondsRemaining]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    const char = value.slice(-1).replace(/\D/g, '');
    const newOtp = [...otpValues];
    newOtp[index] = char;
    setOtpValues(newOtp);
    setErrorMessage('');

    // Auto-advance
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 digits entered
    const entered = newOtp.join('');
    if (entered.length === 6) {
      verifyOtp(entered);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = ['', '', '', '', '', ''];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtpValues(newOtp);

    if (pastedData.length === 6) {
      verifyOtp(pastedData);
    } else if (pastedData.length < 6) {
      inputRefs.current[pastedData.length]?.focus();
    }
  };

  const verifyOtp = (codeToVerify?: string) => {
    const fullCode = codeToVerify || otpValues.join('');
    if (fullCode.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    setTimeout(() => {
      if (fullCode === currentCode) {
        triggerConfetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        onSuccess(trustDevice);
      } else {
        setIsVerifying(false);
        setErrorMessage('Invalid 2FA code. Please check your SMS/Email notification and try again.');
        inputRefs.current[0]?.focus();
      }
    }, 600);
  };

  const handleChangeChannel = (newChannel: 'phone' | 'email') => {
    setDeliveryChannel(newChannel);
    const newCode = onResendCode(newChannel);
    setCurrentCode(newCode);
    setSecondsRemaining(300);
    setOtpValues(['', '', '', '', '', '']);
    setErrorMessage('');
    setShowNotificationToast(true);
    setCopiedCodeNotice(true);
    setTimeout(() => setCopiedCodeNotice(false), 2500);
  };

  const handleResend = () => {
    const newCode = onResendCode(deliveryChannel);
    setCurrentCode(newCode);
    setSecondsRemaining(300);
    setOtpValues(['', '', '', '', '', '']);
    setErrorMessage('');
    setShowNotificationToast(true);
    setCopiedCodeNotice(true);
    setTimeout(() => setCopiedCodeNotice(false), 2500);
  };

  const autoFillOtp = () => {
    const digits = currentCode.split('');
    setOtpValues(digits);
    verifyOtp(currentCode);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const targetPhone = user.phone || user.mpesaNumber || '+254 712 345 678';
  const targetEmail = user.email || 'investor@quantiqprime.com';

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      
      {/* Real-time SMS / Email Security Dispatch */}
      {showNotificationToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-3 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/95 border border-amber-500/50 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl text-white flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
                {deliveryChannel === 'phone' ? (
                  <Smartphone className="w-5 h-5 text-emerald-400 animate-pulse" />
                ) : (
                  <Mail className="w-5 h-5 text-amber-400 animate-pulse" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-400">
                    {deliveryChannel === 'phone' ? 'Safaricom SMS Dispatched' : 'Email Security Code Sent'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Just Now</span>
                </div>
                <p className="text-xs text-slate-200 mt-0.5">
                  {deliveryChannel === 'phone' 
                    ? `Quantiq SMS to ${maskPhone(targetPhone)}: Your 2FA code is `
                    : `Quantiq Email to ${maskEmail(targetEmail)}: Your 2FA code is `}
                  <strong className="font-mono text-amber-300 text-sm tracking-wider">{currentCode}</strong>
                </p>
                <button
                  onClick={autoFillOtp}
                  className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>1-Click Auto-Fill Code</span>
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowNotificationToast(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main 2FA Dialog Card */}
      <div className="bg-[#0B0F17] border border-amber-500/40 rounded-3xl max-w-md w-full text-white shadow-2xl overflow-hidden my-auto backdrop-blur-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0E131F] via-[#161208] to-[#0E131F] p-6 border-b border-amber-500/20 text-center relative">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/40 flex items-center justify-center mx-auto mb-3 text-amber-400 shadow-inner">
            <ShieldAlert className="w-7 h-7 text-amber-400" />
          </div>

          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1">
            <Lock className="w-3 h-3" />
            <span>2-Factor Authentication</span>
          </span>

          <h2 className="text-xl font-black text-white font-heading mt-1">
            {mode === 'register' 
              ? 'Verify Registration (2FA)' 
              : mode === 'device' 
                ? 'Device Authorization (2FA)' 
                : 'Login Verification (2FA)'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'register'
              ? 'Complete your account security setup to activate your portfolio.'
              : 'Enter the 6-digit security code dispatched to your account.'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          
          {/* Channel Selector: Phone SMS vs Email */}
          <div className="bg-[#07090E] p-3 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">Deliver 2FA Code Via:</span>
              <span className="text-[10px] text-amber-400 font-mono">Instant Dispatch</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleChangeChannel('phone')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  deliveryChannel === 'phone'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-[#0E131F] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Phone SMS</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                  {maskPhone(targetPhone)}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleChangeChannel('email')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  deliveryChannel === 'email'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-[#0E131F] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Email Address</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                  {maskEmail(targetEmail)}
                </div>
              </button>
            </div>
          </div>

          {/* 6-Digit OTP Inputs */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 text-center">
              Enter 6-Digit Verification Code
            </label>
            <div className="flex items-center justify-between gap-2 max-w-xs mx-auto">
              {otpValues.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleDigitChange(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  className={`w-11 h-12 text-center text-xl font-mono font-black rounded-xl bg-[#07090E] border transition-all focus:outline-none ${
                    digit 
                      ? 'border-amber-400 text-amber-300 bg-amber-500/10' 
                      : 'border-slate-700 text-white focus:border-amber-500'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs p-2.5 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Trust Device Checkbox */}
          <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none bg-[#07090E] p-3 rounded-xl border border-slate-800">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={e => setTrustDevice(e.target.checked)}
              className="rounded accent-amber-500 w-4 h-4"
            />
            <span>Trust this browser for 30 days (fast login on this device)</span>
          </label>

          {/* Actions */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => verifyOtp()}
              disabled={isVerifying || otpValues.join('').length < 6}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black py-3.5 rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed font-heading"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying 2FA Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{mode === 'register' ? 'Verify & Create Account' : 'Authorize & Enter Account'}</span>
                </>
              )}
            </button>

            {/* Resend & Timer */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>Expires in <strong className="text-white font-mono">{formatTimer(secondsRemaining)}</strong></span>
              
              <button
                onClick={handleResend}
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Resend Code</span>
              </button>
            </div>

            {copiedCodeNotice && (
              <p className="text-center text-[11px] text-emerald-400 font-medium">
                ✓ New 2FA code dispatched via {deliveryChannel === 'phone' ? 'Phone SMS' : 'Email'}
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
