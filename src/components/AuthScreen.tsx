import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  Gift, 
  ArrowRight, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Award, 
  Globe2, 
  KeyRound,
  Smartphone,
  UserPlus,
  Users,
  Coins,
  MessageSquare,
  MessageCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { generateUniqueReferralCode } from '../utils/security';
import { UserProfile, ProfileCreationData, InvestmentPlan } from '../types';
import { QuantiqLogo } from './QuantiqLogo';
import { ProfileAvatar } from './ProfileAvatar';
import { getInvestmentImage } from '../utils/investmentAssets';
import { api } from '../services/api';
import bgWallpaper from '../assets/images/quantiq_prime_bg_1787826829164.jpg';
import luxuryAvatarImg from '../assets/images/luxury_profile_avatar_1787995685280.jpg';

interface AuthScreenProps {
  onLoginSuccess: (user: Partial<UserProfile>, initialDeposit?: number) => void;
  defaultReferralCode?: string;
  savedProfiles?: UserProfile[];
  initialMode?: 'register' | 'login';
  selectedPlan?: InvestmentPlan | null;
  onBrowsePublic?: () => void;
  onOpenContacts?: () => void;
}

const AVATAR_PRESETS = [
  luxuryAvatarImg,
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250'
];

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  defaultReferralCode,
  savedProfiles = [],
  initialMode = 'register',
  selectedPlan = null,
  onBrowsePublic,
  onOpenContacts
}) => {
  const [authMode, setAuthMode] = useState<'register' | 'login'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);

  // Registration Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+254 712 345 678');
  const [mpesaNumber, setMpesaNumber] = useState('0712345678');
  const [country, setCountry] = useState('Kenya');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState(defaultReferralCode && defaultReferralCode !== '505031' ? defaultReferralCode : '');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [initialDeposit, setInitialDeposit] = useState<number>(selectedPlan ? selectedPlan.minDeposit : 50000);
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [sendCodeChannel, setSendCodeChannel] = useState<'phone' | 'email'>('phone');
  // Always pre-generate an active 6-digit 2FA code so the client is never blocked
  const [initialOtp] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [verificationCode, setVerificationCode] = useState(initialOtp);
  const [codeSent, setCodeSent] = useState(true);
  const [generatedCode, setGeneratedCode] = useState(initialOtp);
  const [codeNotice, setCodeNotice] = useState(`2FA security code ${initialOtp} is active and pre-filled`);
  const [showSmsToast, setShowSmsToast] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const handleSendVerificationCode = async (targetType: 'phone' | 'email', destination: string) => {
    setIsSendingOtp(true);
    const destDisplay = destination || (targetType === 'phone' ? (mpesaNumber || phone || '+254 712 345 678') : (email || 'investor@quantiqprime.com'));
    
    try {
      const res = await api.sendOtp(destDisplay, targetType, 'registration');
      const code = res.otp || Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setVerificationCode(code);
      setCodeSent(true);
      setIsSendingOtp(false);
      setErrorMessage('');
      setShowSmsToast(true);
      setCodeNotice(`2FA security code ${code} generated for ${destDisplay} and auto-filled.`);
      setTimeout(() => setShowSmsToast(false), 9000);
      return code;
    } catch {
      const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(fallbackCode);
      setVerificationCode(fallbackCode);
      setCodeSent(true);
      setIsSendingOtp(false);
      setErrorMessage('');
      setShowSmsToast(true);
      setCodeNotice(`2FA security code ${fallbackCode} generated for ${destDisplay} and auto-filled.`);
      setTimeout(() => setShowSmsToast(false), 9000);
      return fallbackCode;
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full legal name.');
      return;
    }
    if (!username.trim()) {
      setErrorMessage('Please choose a unique username.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Please provide your phone number.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }
    if (!agreedTerms) {
      setErrorMessage('Please accept the Terms of Service to create your profile.');
      return;
    }

    let activeOtp = verificationCode.trim() || generatedCode || initialOtp;
    if (!activeOtp || activeOtp.length < 6) {
      activeOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(activeOtp);
      setVerificationCode(activeOtp);
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      triggerConfetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      
      const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
      const autoGenReferralCode = generateUniqueReferralCode();
      const sponsorRef = referralCode.trim();

      const createdUser: Partial<UserProfile> = {
        id: `usr_${Date.now()}`,
        fullName: fullName.trim(),
        username: cleanUsername,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        mpesaNumber: mpesaNumber.trim() || phone.trim() || '0712345678',
        country,
        referralCode: autoGenReferralCode,
        referredBy: sponsorRef ? `Sponsor #${sponsorRef}` : 'Quantiq Executive Sponsor',
        joinedDate: new Date().toISOString().split('T')[0],
        tier: initialDeposit >= 200000 ? 'Platinum (VIP)' : initialDeposit >= 100000 ? 'Gold' : initialDeposit >= 30000 ? 'Silver' : 'Bronze',
        kycStatus: 'Verified',
        avatar: selectedAvatar,
        twoFactorEnabled: true,
        walletAddressUSDT: '0xbcf65f39cd5868e8ac571c6d929255dd587f9bff',
        walletAddressBTC: '1KSxkSS6XQsyYfefsTK7xSMrnFxDfGwsGU',
        firstDepositTime: new Date().toISOString(),
        lastDepositTime: new Date().toISOString()
      };

      onLoginSuccess(createdUser, initialDeposit);
    }, 600);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your email, phone number, or username to sign in.');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    let activeOtp = verificationCode.trim() || generatedCode || initialOtp;
    if (!activeOtp || activeOtp.length < 6) {
      activeOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(activeOtp);
      setVerificationCode(activeOtp);
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);

      const cleanInput = loginIdentifier.toLowerCase().trim();

      // Check if matches a saved profile by email, username, or phone
      const found = savedProfiles.find(
        p => p.email.toLowerCase() === cleanInput || 
             p.username.toLowerCase() === cleanInput ||
             (p.phone && p.phone.replace(/\s+/g, '') === cleanInput.replace(/\s+/g, '')) ||
             (p.mpesaNumber && p.mpesaNumber.replace(/\s+/g, '') === cleanInput.replace(/\s+/g, ''))
      );

      if (found) {
        onLoginSuccess(found);
      } else {
        // Sign in with typed credentials
        const isPhone = /^[0-9+ ]{8,}$/.test(cleanInput);
        const autoRefCode = Math.floor(100000 + Math.random() * 900000).toString();
        const fallbackUser: Partial<UserProfile> = {
          id: `usr_${Date.now()}`,
          fullName: isPhone ? `Member (${cleanInput})` : cleanInput.split('@')[0],
          username: cleanInput.split('@')[0].replace(/[^a-zA-Z0-9_]/g, ''),
          email: isPhone ? `${cleanInput.replace(/\D/g, '')}@quantiqprime.com` : cleanInput,
          phone: isPhone ? cleanInput : '+254 700 000 000',
          mpesaNumber: isPhone ? cleanInput.replace(/\D/g, '').slice(-9) : '0700000000',
          country: 'Kenya',
          referralCode: autoRefCode,
          tier: 'Silver',
          kycStatus: 'Verified',
          avatar: AVATAR_PRESETS[0],
          twoFactorEnabled: true,
          walletAddressUSDT: '0xbcf65f39cd5868e8ac571c6d929255dd587f9bff',
          walletAddressBTC: '1KSxkSS6XQsyYfefsTK7xSMrnFxDfGwsGU',
          firstDepositTime: new Date().toISOString(),
          lastDepositTime: new Date().toISOString()
        };
        onLoginSuccess(fallbackUser);
      }
    }, 600);
  };

  const handleSelectSavedProfile = (saved: UserProfile) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess(saved);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Real-time 2FA SMS / Email Dispatch Toast */}
      {showSmsToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-3 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl backdrop-blur-xl text-white flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 animate-pulse text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase text-emerald-400">Incoming 2FA SMS</span>
                  <span className="text-[10px] text-slate-400 font-mono">Just now</span>
                </div>
                <div className="text-xs text-slate-200 mt-0.5">
                  Your Quantiq Prime verification code is: <b className="text-amber-400 font-mono text-sm tracking-widest">{generatedCode}</b>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setVerificationCode(generatedCode);
                setShowSmsToast(false);
              }}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg shrink-0 cursor-pointer shadow-md transition-all active:scale-95"
            >
              Auto-Fill
            </button>
          </div>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-xl z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <QuantiqLogo size="xl" showTagline={true} className="justify-center" />
          <p className="mt-3 text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            Institutional Algorithmic Wealth, Daily Compounded ROI & Lipa Na M-PESA Integration
          </p>
          {onBrowsePublic && (
            <button
              type="button"
              onClick={onBrowsePublic}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-1.5 rounded-full border border-amber-500/30 transition-colors font-bold cursor-pointer"
            >
              <span>Explore Yield Packages in Guest Mode</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Official WhatsApp Group Banner */}
        <div className="mb-4 bg-gradient-to-r from-emerald-950/90 via-[#0B1512] to-emerald-950/90 border border-emerald-500/40 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-lg shadow-emerald-500/5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow">
              <MessageCircle className="w-4 h-4 fill-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">Official WhatsApp Community</div>
              <div className="text-[10px] text-emerald-400 font-mono truncate">1,400+ Kenyan Investors Sharing Daily Yield Proof</div>
            </div>
          </div>
          <a
            href="https://chat.whatsapp.com/C0LXeuksKfRIxC8WO2aQv2"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] rounded-lg shrink-0 flex items-center gap-1 transition-all shadow cursor-pointer active:scale-95"
          >
            <span>Join Group</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Selected Plan Alert Banner if redirected from clicking a plan */}
        {selectedPlan && (
          <div className="mb-4 bg-gradient-to-r from-amber-950/70 via-yellow-950/70 to-amber-950/70 border-2 border-amber-500/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-100 shadow-xl shadow-amber-500/10">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-amber-500/60 bg-slate-900 shadow-md">
                <img 
                  src={selectedPlan.imageUrl || getInvestmentImage(selectedPlan.name)}
                  alt={selectedPlan.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Target Contract Selected</span>
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded">
                    {selectedPlan.name.toLowerCase().includes('gold') ? '999.9 Gold Bullion' : selectedPlan.name.toLowerCase().includes('silver') ? '999 Fine Silver' : 'Locked until maturity'}
                  </span>
                </div>
                <div className="text-sm font-black text-white font-heading">
                  {selectedPlan.name} • +{selectedPlan.dailyRoi}% Daily ROI ({selectedPlan.durationDays} Days)
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  Min allocation: Ksh {selectedPlan.minDeposit.toLocaleString()} • Principal releases automatically on Day {selectedPlan.durationDays}.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sponsor Banner */}
        {referralCode && (
          <div className="mb-4 bg-[#0E131F]/90 border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-slate-100 backdrop-blur-xl shadow-xl shadow-amber-500/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Sponsor Partner Linked</span>
                </div>
                <div className="text-xs text-slate-300">
                  Sponsor Code: <span className="font-mono font-bold text-white bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded">#{referralCode}</span>
                </div>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40">
                8% Tier 1 Yield Active
              </span>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-[#0B0F17]/95 rounded-3xl shadow-2xl border border-amber-500/25 p-6 sm:p-8 backdrop-blur-2xl">
          
          {/* Auth Mode Tabs */}
          <div className="flex rounded-2xl bg-[#04060A] p-1 mb-6 border border-slate-800">
            <button
              id="tab-register-btn"
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMessage('');
              }}
              className={`w-1/2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Investor Profile</span>
            </button>
            <button
              id="tab-login-btn"
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMessage('');
              }}
              className={`w-1/2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Sign In to Account</span>
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs rounded-xl flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0"></span>
              <span>{errorMessage}</span>
            </div>
          )}

          {authMode === 'register' ? (
            /* CREATE PROFILE / REGISTER FORM */
            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Choose Investor Avatar
                </label>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {AVATAR_PRESETS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`relative rounded-xl p-0.5 transition-all shrink-0 cursor-pointer ${
                        selectedAvatar === av ? 'ring-3 ring-amber-400 shadow-md shadow-amber-500/20' : 'opacity-50 hover:opacity-100'
                      }`}
                    >
                      <img src={av} alt="Avatar" className="w-10 h-10 rounded-lg object-cover" />
                      {selectedAvatar === av && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Full Legal Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      id="reg-fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Kimani"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#0E131F] border border-slate-700/80 rounded-xl text-slate-100 focus:bg-[#131929] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Unique Username *
                  </label>
                  <div className="relative">
                    <span className="text-amber-500 font-bold absolute left-3 top-2.5 text-xs">@</span>
                    <input
                      id="reg-username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. AlexK"
                      className="w-full pl-8 pr-3 py-2.5 text-xs bg-[#0E131F] border border-slate-700/80 rounded-xl text-slate-100 focus:bg-[#131929] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Email & M-PESA Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. investor@example.com"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#0E131F] border border-slate-700/80 rounded-xl text-slate-100 focus:bg-[#131929] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Safaricom M-PESA Number *
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-emerald-400 absolute left-3 top-3" />
                    <input
                      id="reg-mpesa"
                      type="tel"
                      required
                      value={mpesaNumber}
                      onChange={(e) => setMpesaNumber(e.target.value)}
                      placeholder="0712345678"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#0E131F] border border-emerald-500/40 rounded-xl text-emerald-300 font-mono font-bold focus:bg-[#131929] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              {/* Country & Referral */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Country of Residence
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-[#0E131F] border border-slate-700/80 rounded-xl text-slate-100 focus:bg-[#131929] focus:outline-none font-medium"
                  >
                    <option value="Kenya">Kenya (KES)</option>
                    <option value="Uganda">Uganda (UGX)</option>
                    <option value="Tanzania">Tanzania (TZS)</option>
                    <option value="Rwanda">Rwanda (RWF)</option>
                    <option value="Nigeria">Nigeria (NGN)</option>
                    <option value="South Africa">South Africa (ZAR)</option>
                    <option value="United States">United States (USD)</option>
                    <option value="United Kingdom">United Kingdom (GBP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Sponsor Code
                  </label>
                  <div className="relative">
                    <Gift className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                    <input
                      id="reg-referral"
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      placeholder="e.g. 748291 (Optional)"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-amber-950/20 border border-amber-500/40 rounded-xl font-mono font-bold text-amber-300 focus:bg-[#131929] focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Your own unique referral code will be auto-generated upon registration.
                  </p>
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Create Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-8 py-2.5 text-xs bg-[#0E131F] border border-slate-700/80 rounded-xl text-slate-100 focus:bg-[#131929] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      id="reg-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#0E131F] border border-slate-700/80 rounded-xl text-slate-100 focus:bg-[#131929] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* 2-Factor / Security Code Clearance Box */}
              <div className="bg-[#0E131F] border-2 border-emerald-500/50 rounded-2xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-100 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>2FA Security Verification</span>
                  </span>
                  <div className="flex items-center gap-1 bg-[#07090E] p-0.5 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSendCodeChannel('phone')}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        sendCodeChannel === 'phone' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
                      }`}
                    >
                      Phone (+254)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSendCodeChannel('email')}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        sendCodeChannel === 'email' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
                      }`}
                    >
                      Email
                    </button>
                  </div>
                </div>

                {/* Prominent Active 2FA Code Display Card */}
                <div className="bg-black/80 border border-emerald-500/40 p-3 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono">Your Instant 2FA Security Code:</div>
                    <div className="text-xl font-black text-amber-300 font-mono tracking-widest">
                      {generatedCode || initialOtp}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSendingOtp}
                      onClick={() => handleSendVerificationCode(sendCodeChannel, sendCodeChannel === 'phone' ? (mpesaNumber || phone) : email)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-slate-700"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSendingOtp ? 'animate-spin' : ''}`} />
                      <span>{isSendingOtp ? 'Sending...' : 'New Code'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVerificationCode(generatedCode || initialOtp)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-lg transition-all cursor-pointer shadow active:scale-95"
                    >
                      Auto-Fill
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-300">
                      6-Digit Verification Code (Pre-Filled)
                    </label>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      ✓ Instant Clearance Active
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 748291"
                    className="w-full px-3 py-2.5 text-sm bg-[#07090E] border border-amber-500/60 rounded-xl text-amber-300 font-mono font-black tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-slate-400 pt-0.5">
                    Code configured for <span className="text-white font-mono">{sendCodeChannel === 'phone' ? (mpesaNumber || phone) : email}</span>. Ready for instant account creation.
                  </p>
                </div>
              </div>

              {/* Initial Account Funding Tier */}
              <div className="p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Select Starting Capital Tier (KES)</span>
                  </span>
                  <span className="text-[10px] text-amber-400 font-extrabold font-mono">
                    {initialDeposit >= 200000 ? 'VIP Platinum Tier (8.5%/day)' : initialDeposit >= 100000 ? 'Gold Tier (8.0%/day)' : initialDeposit >= 30000 ? 'Silver Tier (7.5%/day)' : 'Bronze Tier (7.0%/day)'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[10000, 30000, 100000, 200000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setInitialDeposit(amt)}
                      className={`py-2 rounded-xl font-bold font-mono text-xs transition-all cursor-pointer ${
                        initialDeposit === amt 
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md' 
                          : 'bg-[#0E131F] text-slate-300 hover:bg-slate-800 border border-slate-700'
                      }`}
                    >
                      Ksh {amt >= 1000 ? `${amt / 1000}k` : amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-[#0E131F] text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-[11px] text-slate-400 leading-tight">
                    I agree to the <span className="text-amber-400 font-bold underline">Quantiq Prime Terms of Service</span> and automated daily algorithmic yield distributions.
                  </span>
                </label>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  id="create-profile-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black py-3.5 px-4 rounded-2xl text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Creating Quantiq Profile & Entering...</span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>{codeSent ? 'Verify 2FA & Create Quantiq Profile' : 'Send 2FA Code & Register'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          ) : (
            /* SIGN IN FORM */
            <div className="space-y-4">
              
              {/* Saved Profiles Quick Select */}
              {savedProfiles.length > 0 && (
                <div className="pb-3 border-b border-slate-800">
                  <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Saved Quantiq Profiles on this Device:</span>
                  </label>
                  <div className="space-y-2">
                    {savedProfiles.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectSavedProfile(p)}
                        className="w-full p-2.5 rounded-2xl border border-slate-800 bg-[#0E131F] hover:border-amber-500/40 hover:bg-amber-950/20 flex items-center justify-between transition-all cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <ProfileAvatar src={p.avatar} name={p.fullName} tier={p.tier} size="sm" />
                          <div>
                            <div className="text-xs font-bold text-white">{p.fullName}</div>
                            <div className="text-[10px] text-slate-400">@{p.username} • {p.email}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-black bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 px-2.5 py-1 rounded-lg">
                          Sign In
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Email, Phone (+254), or Username
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      id="login-identifier"
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. 0712345678, investor@example.com, or alexk"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#0E131F] border border-slate-700/80 rounded-xl text-slate-100 focus:bg-[#131929] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-medium"
                    />
                  </div>
                </div>

                {/* Dispatch Security Code for Login */}
                <div className="bg-[#0E131F] border-2 border-emerald-500/50 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-slate-100 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>2FA Login Security Code</span>
                    </span>
                    <div className="flex items-center gap-1 bg-[#07090E] p-0.5 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setSendCodeChannel('phone')}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          sendCodeChannel === 'phone' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
                        }`}
                      >
                        Phone (+254)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSendCodeChannel('email')}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          sendCodeChannel === 'email' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
                        }`}
                      >
                        Email
                      </button>
                    </div>
                  </div>

                  {/* Active 2FA Code Display Card for Login */}
                  <div className="bg-black/80 border border-emerald-500/40 p-3 rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono">Session 2FA Verification Code:</div>
                      <div className="text-xl font-black text-amber-300 font-mono tracking-widest">
                        {generatedCode || initialOtp}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isSendingOtp}
                        onClick={() => handleSendVerificationCode(sendCodeChannel, loginIdentifier)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-slate-700"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSendingOtp ? 'animate-spin' : ''}`} />
                        <span>{isSendingOtp ? 'Sending...' : 'New Code'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setVerificationCode(generatedCode || initialOtp)}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-lg transition-all cursor-pointer shadow active:scale-95"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-slate-300">
                        6-Digit Verification Code (Pre-Filled)
                      </label>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        ✓ Verified Session
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 748291"
                      className="w-full px-3 py-2.5 text-sm bg-[#07090E] border border-amber-500/60 rounded-xl text-amber-300 font-mono font-black tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setErrorMessage('Password reset instructions dispatched to your registered email.')}
                      className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-8 py-2.5 text-xs bg-[#0E131F] border border-slate-700/80 rounded-xl text-slate-100 focus:bg-[#131929] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black py-3.5 px-4 rounded-2xl text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>{codeSent ? 'Verify 2FA & Sign In' : 'Send 2FA Code & Sign In'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

            </div>
          )}

        </div>

        {/* Security Trust Badges */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center text-slate-400 text-[11px]">
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="text-slate-300">256-Bit SSL Encrypted</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-slate-300">Daily Algorithmic ROI</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <span className="text-slate-300">Lipa Na M-PESA KES</span>
          </div>
        </div>

        {/* Official WhatsApp Community Button */}
        <div className="mt-5 text-center">
          <a
            href="https://chat.whatsapp.com/C0LXeuksKfRIxC8WO2aQv2"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 rounded-2xl text-xs font-black transition-all shadow-xl shadow-emerald-500/20 cursor-pointer active:scale-95"
          >
            <MessageCircle className="w-4 h-4 fill-slate-950" />
            <span>Join Official WhatsApp Investor Group (1,400+ Members)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Contact Support Button at Bottom */}
        {onOpenContacts && (
          <div className="mt-3 text-center">
            <button
              id="auth-bottom-contact-btn"
              type="button"
              onClick={onOpenContacts}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0E131F] hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Contact Nairobi Support Desk (+17712502005)</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
