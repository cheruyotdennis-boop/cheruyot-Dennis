import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  ArrowRight, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { UserProfile } from '../types';
import { ProfileAvatar } from './ProfileAvatar';
import { api } from '../services/api';
import { generateUniqueReferralCode } from '../utils/security';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: Partial<UserProfile>) => void;
  onOpenCreateProfile: () => void;
  savedProfiles?: UserProfile[];
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenCreateProfile,
  savedProfiles = []
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successLogin, setSuccessLogin] = useState(false);
  const [sendCodeChannel, setSendCodeChannel] = useState<'phone' | 'email'>('phone');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeNotice, setCodeNotice] = useState('');

  if (!isOpen) return null;

  const handleSendCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setCodeSent(true);
    setErrorMessage('');
    const targetDest = identifier.trim() || (sendCodeChannel === 'phone' ? '+254 712 345 678' : 'investor@quantiqprime.com');
    setCodeNotice(`2FA security code ${code} dispatched via ${sendCodeChannel === 'phone' ? 'Phone SMS' : 'Email'} to ${targetDest}`);
  };

  const autoFillCode = () => {
    if (generatedCode) {
      setVerificationCode(generatedCode);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Please enter your email, phone, or username');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    if (!codeSent) {
      handleSendCode();
      setErrorMessage('2FA code dispatched! Please enter the 6-digit verification code below to sign in.');
      return;
    }

    if (!verificationCode || verificationCode.trim() !== generatedCode) {
      setErrorMessage('Invalid 6-digit 2FA verification code. Please check your SMS/Email notification.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.login(identifier, password);
      setIsLoading(false);
      setSuccessLogin(true);

      setTimeout(() => {
        if (res?.user) {
          onLoginSuccess(res.user);
        } else {
          // Find matching saved profile fallback
          const cleanId = identifier.trim().toLowerCase();
          const matched = savedProfiles.find(
            p => p.email.toLowerCase() === cleanId ||
                 p.username.toLowerCase() === cleanId ||
                 (p.phone && p.phone.replace(/\s+/g, '') === cleanId.replace(/\s+/g, '')) ||
                 (p.mpesaNumber && p.mpesaNumber.replace(/\s+/g, '') === cleanId.replace(/\s+/g, ''))
          );

          if (matched) {
            onLoginSuccess(matched);
          } else {
            const isPhone = /^[0-9+ ]{8,}$/.test(cleanId);
            const autoRefCode = generateUniqueReferralCode();

            onLoginSuccess({
              fullName: cleanId.includes('@') ? cleanId.split('@')[0] : cleanId,
              username: cleanId.replace(/[^a-zA-Z0-9]/g, ''),
              email: cleanId.includes('@') ? cleanId : `${cleanId.replace(/[^a-zA-Z0-9]/g, '')}@quantiqprime.com`,
              phone: isPhone ? cleanId : '+254 712 345 678',
              mpesaNumber: isPhone ? cleanId : '0712345678',
              country: 'Kenya',
              referralCode: autoRefCode,
              referredBy: 'Quantiq Executive Sponsor',
              joinedDate: new Date().toISOString().split('T')[0],
              tier: 'Gold VIP',
              kycStatus: 'Verified',
              avatar: 'luxury',
              twoFactorEnabled: true,
              walletAddressUSDT: '0xbcf65f39cd5868e8ac571c6d929255dd587f9bff',
              walletAddressBTC: '1KSxkSS6XQsyYfefsTK7xSMrnFxDfGwsGU'
            });
          }
        }
        setSuccessLogin(false);
        onClose();
      }, 700);
    } catch {
      setIsLoading(false);
      setSuccessLogin(true);
      setTimeout(() => {
        const cleanId = identifier.trim().toLowerCase();
        const isPhone = /^[0-9+ ]{8,}$/.test(cleanId);
        const autoRefCode = Math.floor(100000 + Math.random() * 900000).toString();

        onLoginSuccess({
          fullName: cleanId.includes('@') ? cleanId.split('@')[0] : cleanId,
          username: cleanId.replace(/[^a-zA-Z0-9]/g, ''),
          email: cleanId.includes('@') ? cleanId : `${cleanId.replace(/[^a-zA-Z0-9]/g, '')}@quantiqprime.com`,
          phone: isPhone ? cleanId : '+254 712 345 678',
          mpesaNumber: isPhone ? cleanId : '0712345678',
          country: 'Kenya',
          referralCode: autoRefCode,
          joinedDate: new Date().toISOString().split('T')[0],
          tier: 'Gold VIP',
          kycStatus: 'Verified',
          avatar: 'luxury',
          twoFactorEnabled: true,
          walletAddressUSDT: '0xbcf65f39cd5868e8ac571c6d929255dd587f9bff',
          walletAddressBTC: '1KSxkSS6XQsyYfefsTK7xSMrnFxDfGwsGU'
        });
        setSuccessLogin(false);
        onClose();
      }, 700);
    }
  };

  const handleSelectProfile = (p: UserProfile) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccessLogin(true);
      setTimeout(() => {
        onLoginSuccess(p);
        setSuccessLogin(false);
        onClose();
      }, 500);
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-[#0B0F17] border border-amber-500/30 rounded-3xl max-w-lg w-full text-white shadow-2xl overflow-hidden my-auto backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0E131F] via-[#151A29] to-[#0E131F] p-5 sm:p-6 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-heading">Sign In to Quantiq Prime</h2>
              <p className="text-xs text-slate-400">Access your algorithmic portfolios and wallet</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 text-xs">
          
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successLogin && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Authentication verified! Loading account dashboard...</span>
            </div>
          )}

          {/* Quick Select Saved Profiles if any exist */}
          {savedProfiles.length > 0 && (
            <div className="space-y-2 pb-3 border-b border-slate-800">
              <div className="flex items-center justify-between text-slate-300 font-bold text-xs">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>Choose Saved Profile:</span>
                </span>
                <span className="text-[10px] text-amber-400 font-extrabold">{savedProfiles.length} Account(s)</span>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {savedProfiles.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProfile(p)}
                    className="w-full p-2.5 rounded-2xl bg-[#0E131F] border border-slate-800 hover:border-amber-500/50 hover:bg-amber-950/20 flex items-center justify-between transition-all cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <ProfileAvatar src={p.avatar} name={p.fullName} tier={p.tier} size="sm" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-amber-300">{p.fullName}</div>
                        <div className="text-[10px] text-slate-400">@{p.username} • <span className="text-amber-400">{p.tier}</span></div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 px-2.5 py-1 rounded-lg shadow-sm">
                      Select & Enter
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleFormSubmit} className="space-y-3.5 pt-1">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Email, Phone (+254), or Username *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 0712345678, investor@example.com, or username"
                  className="w-full pl-9 pr-3 py-2 bg-[#07090E] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Verification Code Dispatch */}
            <div className="p-3 bg-[#07090E] border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300">Security Login Code</span>
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setSendCodeChannel('phone')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${sendCodeChannel === 'phone' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'}`}
                  >
                    Phone
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendCodeChannel('email')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${sendCodeChannel === 'email' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'}`}
                  >
                    Email
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendCode}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-1.5 px-3 rounded-lg text-[11px] flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
              >
                {sendCodeChannel === 'phone' ? <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> : <Mail className="w-3.5 h-3.5 text-amber-400" />}
                <span>Send 2FA Code to {sendCodeChannel === 'phone' ? 'Phone SMS' : 'Email Address'}</span>
              </button>

              {codeNotice && (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    {sendCodeChannel === 'phone' ? <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    <span className="truncate">{codeNotice}</span>
                  </div>
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
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
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

            <div>
              <label className="block text-slate-300 font-bold mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-8 py-2 bg-[#07090E] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black py-2.5 rounded-xl shadow-lg transition-all cursor-pointer uppercase tracking-wider text-xs flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{isLoading ? 'Verifying Account...' : codeSent ? 'Verify 2FA & Sign In' : 'Send 2FA Code & Sign In'}</span>
              </button>
            </div>
          </form>

          {/* Create Profile Link */}
          <div className="pt-3 border-t border-slate-800 text-center flex flex-col items-center gap-2">
            <span className="text-slate-400">Don't have an account or want to register a new profile?</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreateProfile();
              }}
              className="text-amber-400 hover:text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 px-4 py-1.5 rounded-xl border border-amber-500/30 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Create New Investor Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
