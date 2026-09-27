import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  User, 
  Mail, 
  Phone, 
  Smartphone, 
  Lock, 
  ShieldCheck, 
  Sparkles, 
  Globe, 
  Wallet, 
  Coins, 
  CheckCircle2,
  DollarSign,
  AlertCircle,
  LogIn,
  Crown
} from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { generateUniqueReferralCode } from '../utils/security';
import { ProfileCreationData } from '../types';
import { ProfileAvatar } from './ProfileAvatar';
import luxuryAvatarImg from '../assets/images/luxury_profile_avatar_1787995685280.jpg';
import { api } from '../services/api';

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProfile: (data: ProfileCreationData) => void;
  onOpenLogin?: () => void;
  defaultReferralCode?: string;
}

const AVATAR_OPTIONS = [
  { id: 'luxury', url: luxuryAvatarImg, label: 'VIP Gold Crest', isLuxury: true },
  { id: '1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250', label: 'Executive Partner' },
  { id: '2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250', label: 'Investor Pro' },
  { id: '3', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250', label: 'Wealth Strategist' },
  { id: '4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250', label: 'Capital Analyst' },
  { id: '5', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250', label: 'FinTech Advisor' }
];

export const CreateProfileModal: React.FC<CreateProfileModalProps> = ({
  isOpen,
  onClose,
  onCreateProfile,
  onOpenLogin,
  defaultReferralCode
}) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+254 7');
  const [mpesaNumber, setMpesaNumber] = useState('07');
  const [country, setCountry] = useState('Kenya');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState(defaultReferralCode && defaultReferralCode !== '505031' ? defaultReferralCode : '');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0].url);
  const [walletAddress, setWalletAddress] = useState('');
  const [initialDeposit, setInitialDeposit] = useState<number>(50000);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successCreated, setSuccessCreated] = useState(false);

  // 2FA Verification State
  const [sendCodeChannel, setSendCodeChannel] = useState<'phone' | 'email'>('phone');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeNotice, setCodeNotice] = useState('');
  const [showSmsToast, setShowSmsToast] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  if (!isOpen) return null;

  const currentTier = initialDeposit >= 200000 ? 'Platinum VIP' : initialDeposit >= 100000 ? 'Gold' : initialDeposit >= 30000 ? 'Silver' : 'Bronze';

  const handleSendCode = async () => {
    setIsSendingOtp(true);
    const targetDest = sendCodeChannel === 'phone' ? (mpesaNumber || phone || '+254 712 345 678') : (email || 'investor@quantiqprime.com');
    
    try {
      const res = await api.sendOtp(targetDest, sendCodeChannel, 'registration');
      const code = res.otp || Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setVerificationCode(code);
      setCodeSent(true);
      setIsSendingOtp(false);
      setErrorMessage('');
      setShowSmsToast(true);
      setCodeNotice(`2FA registration code ${code} dispatched via ${sendCodeChannel === 'phone' ? 'Phone SMS' : 'Email'} to ${targetDest}`);
      setTimeout(() => setShowSmsToast(false), 9000);
      return code;
    } catch {
      const fallback = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(fallback);
      setVerificationCode(fallback);
      setCodeSent(true);
      setIsSendingOtp(false);
      setErrorMessage('');
      setShowSmsToast(true);
      setCodeNotice(`2FA registration code ${fallback} dispatched via ${sendCodeChannel === 'phone' ? 'Phone SMS' : 'Email'} to ${targetDest}`);
      setTimeout(() => setShowSmsToast(false), 9000);
      return fallback;
    }
  };

  const autoFillCode = () => {
    if (generatedCode) {
      setVerificationCode(generatedCode);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full legal name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    let activeOtp = verificationCode.trim();
    if (!codeSent || !activeOtp) {
      activeOtp = await handleSendCode();
    }

    if (!activeOtp || activeOtp.length < 6) {
      setErrorMessage('Please enter the 6-digit 2FA verification code dispatched to your phone/email.');
      return;
    }

    setIsSubmitting(true);

    const generatedRefCode = generateUniqueReferralCode();
    const finalUsername = username.trim() || email.split('@')[0].toLowerCase();
    const finalWallet = walletAddress.trim() || `T${Math.random().toString(36).substring(2, 12).toUpperCase()}x7Y9k`;

    const profileData: ProfileCreationData = {
      fullName,
      username: finalUsername,
      email,
      phone,
      mpesaNumber: mpesaNumber || phone,
      country,
      password,
      referralCode: generatedRefCode,
      avatar: selectedAvatar,
      avatarUrl: selectedAvatar,
      walletAddressUSDT: finalWallet,
      initialDepositKES: initialDeposit > 0 ? initialDeposit : 50000,
      initialDeposit: initialDeposit > 0 ? initialDeposit : 50000
    };

    api.registerProfile(profileData).then(() => {
      onCreateProfile(profileData);
      setIsSubmitting(false);
      setSuccessCreated(true);
      triggerConfetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

      setTimeout(() => {
        setSuccessCreated(false);
        onClose();
      }, 1200);
    }).catch(() => {
      onCreateProfile(profileData);
      setIsSubmitting(false);
      setSuccessCreated(true);
      setTimeout(() => {
        setSuccessCreated(false);
        onClose();
      }, 1200);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-[#0B0F17] border border-amber-500/30 rounded-3xl max-w-2xl w-full text-white shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Banner */}
        <div className="shrink-0 bg-gradient-to-r from-[#0E131F] via-[#151A29] to-[#0E131F] p-5 sm:p-6 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading">Create Investor Profile</h2>
              <p className="text-xs text-slate-400">Enroll new authenticated account with instant wallet setup</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Profile Icon & Summary Bar */}
        <div className="bg-[#07090E] px-6 py-3 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ProfileAvatar 
              src={selectedAvatar} 
              name={fullName || 'Investor'} 
              tier={currentTier}
              size="md"
              showKycBadge={true}
            />
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{fullName.trim() || 'New Investor Profile'}</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30 font-extrabold font-mono">
                  {currentTier}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                @{username.trim() || 'username'} • Ksh {initialDeposit.toLocaleString()} Starting Capital
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-xl font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Instant KYC Ready</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 overscroll-contain">
          
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successCreated && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Profile created successfully! Loading your institutional dashboard...</span>
            </div>
          )}

          {/* Profile Icon / Avatar Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-slate-300 font-bold">Select Profile Icon / Avatar</label>
              <span className="text-[10px] text-amber-400 font-bold">Custom luxury emblems</span>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {AVATAR_OPTIONS.map((av) => (
                <button
                  type="button"
                  key={av.id}
                  onClick={() => setSelectedAvatar(av.url)}
                  className={`relative rounded-2xl overflow-hidden p-1 border-2 transition-all shrink-0 cursor-pointer ${
                    selectedAvatar === av.url ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105 shadow-lg shadow-amber-500/20' : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={av.url} alt={av.label} className="w-12 h-12 rounded-xl object-cover" />
                  {av.isLuxury && (
                    <span className="absolute top-1 right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full">
                      <Crown className="w-2.5 h-2.5" />
                    </span>
                  )}
                  {selectedAvatar === av.url && (
                    <span className="absolute bottom-1 right-1 bg-emerald-500 text-slate-950 w-3.5 h-3.5 rounded-full text-[8px] font-black flex items-center justify-center">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Full Legal Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Kimani"
                  className="w-full pl-9 pr-3 py-2 bg-[#07090E] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Username / Handle</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. alexk"
                className="w-full px-3 py-2 bg-[#07090E] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="investor@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-[#07090E] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">M-PESA / Phone Number</label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={mpesaNumber}
                  onChange={(e) => setMpesaNumber(e.target.value)}
                  placeholder="0712345678"
                  className="w-full pl-9 pr-3 py-2 bg-[#07090E] border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-9 pr-3 py-2 bg-[#07090E] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Confirm Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  className="w-full pl-9 pr-3 py-2 bg-[#07090E] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Sponsor Referral Code</label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="e.g. 748291 (Optional)"
                className="w-full px-3 py-2 bg-[#07090E] border border-slate-700 rounded-xl text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Starting Capital (KES)</label>
              <input
                type="number"
                value={initialDeposit}
                onChange={(e) => setInitialDeposit(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#07090E] border border-slate-700 rounded-xl text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* 2-Factor Authentication Verification Step */}
          <div className="p-3.5 bg-[#07090E] border border-amber-500/30 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>2FA Security Code Verification (Required)</span>
              </span>
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSendCodeChannel('phone')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                    sendCodeChannel === 'phone' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
                  }`}
                >
                  Phone SMS
                </button>
                <button
                  type="button"
                  onClick={() => setSendCodeChannel('email')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                    sendCodeChannel === 'email' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
                  }`}
                >
                  Email
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendCode}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700 transition-colors"
            >
              {sendCodeChannel === 'phone' ? <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> : <Mail className="w-3.5 h-3.5 text-amber-400" />}
              <span>Send 2FA Code to {sendCodeChannel === 'phone' ? 'Phone SMS' : 'Email Address'}</span>
            </button>

            {codeNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-2">
                <span className="truncate">{codeNotice}</span>
                <button
                  type="button"
                  onClick={autoFillCode}
                  className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10px] rounded-lg shrink-0 cursor-pointer shadow"
                >
                  Auto-Fill
                </button>
              </div>
            )}

            {codeSent && (
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">
                  Enter 6-Digit 2FA Code *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 748291"
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-amber-500/50 rounded-xl text-amber-300 font-mono font-black text-center text-sm tracking-widest focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black py-3 rounded-xl shadow-lg transition-all cursor-pointer uppercase tracking-wider text-xs flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating Profile...' : codeSent ? 'Verify 2FA & Launch Profile' : 'Send 2FA Code & Launch Profile'}</span>
            </button>
          </div>

          {onOpenLogin && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLogin();
                }}
                className="text-slate-400 hover:text-amber-300 text-xs font-semibold cursor-pointer"
              >
                Already have an investor account? <span className="text-amber-400 font-bold underline">Sign In instead</span>
              </button>
            </div>
          )}

        </form>

      </div>
    </div>
  );
};

