import React, { useState } from 'react';
import { 
  ShieldCheck, 
  User, 
  Lock, 
  KeyRound, 
  Smartphone, 
  CheckCircle2, 
  Copy, 
  Check, 
  Wallet, 
  Globe, 
  History,
  AlertTriangle
} from 'lucide-react';
import { UserProfile } from '../types';
import { ProfileAvatar } from './ProfileAvatar';

interface SecurityKycViewProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onOpenCreateProfile?: () => void;
}

export const SecurityKycView: React.FC<SecurityKycViewProps> = ({
  user,
  onUpdateUser,
  onOpenCreateProfile
}) => {
  const [walletAddress, setWalletAddress] = useState(user.walletAddressUSDT);
  const [mpesaNumber, setMpesaNumber] = useState(user.mpesaNumber || user.phone || '0712345678');
  const [userEmail, setUserEmail] = useState(user.email);
  const [userPhone, setUserPhone] = useState(user.phone);
  const [userCountry, setUserCountry] = useState(user.country);
  const [twoFactor, setTwoFactor] = useState(user.twoFactorEnabled);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      walletAddressUSDT: walletAddress,
      mpesaNumber: mpesaNumber,
      email: userEmail,
      phone: userPhone,
      country: userCountry,
      twoFactorEnabled: twoFactor
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white font-heading">
              Security Vault, KYC & Withdrawal Rails
            </h1>
            <span className="text-xs font-bold bg-emerald-950 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
              KYC Level 2 Verified
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your authenticated payout addresses (TRC-20 & M-PESA), 2-Factor Authentication, and personal identification.
          </p>
        </div>

        {onOpenCreateProfile && (
          <button
            onClick={onOpenCreateProfile}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 px-4 py-2.5 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer hover:from-amber-400 hover:to-yellow-400 shrink-0"
          >
            <User className="w-4 h-4" />
            <span>+ Create / Switch Profile</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: KYC Status Card */}
        <div className="space-y-6">
          <div className="bg-[#0B0F17]/90 rounded-3xl p-6 border border-amber-500/20 shadow-2xl backdrop-blur-xl">
            {/* Investor Profile Icon & Status */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
              <ProfileAvatar
                src={user.avatar}
                name={user.fullName}
                tier={user.tier}
                size="lg"
                showKycBadge={true}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>KYC Level 2 Verified</span>
                </div>
                <h2 className="text-base font-bold text-white font-heading truncate">{user.fullName}</h2>
                <div className="text-xs text-slate-400 font-mono">@{user.username}</div>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Account Tier:</span>
                <span className="font-bold text-amber-400">{user.tier} Private</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>KYC Status:</span>
                <span className="font-bold text-emerald-400">{user.kycStatus}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Sponsor ID:</span>
                <span className="font-mono font-bold text-amber-400">#{user.referralCode}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Enrolled Date:</span>
                <span className="font-mono text-slate-400">{user.joinedDate}</span>
              </div>
            </div>

            <div className="mt-5 p-3 rounded-2xl bg-[#07090E] border border-slate-800 text-[11px] text-slate-400">
              Daily withdrawal limit: <b className="text-white font-mono">Ksh 10,000,000</b> with zero holding periods.
            </div>
          </div>

          <div className="bg-[#0B0F17]/90 rounded-3xl p-6 border border-amber-500/20 shadow-2xl backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Lock className="w-4 h-4" />
              <span>Two-Factor Authentication</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Google Authenticator (TOTP)</div>
                <div className="text-[11px] text-slate-400">Required for instant payouts</div>
              </div>
              <input
                type="checkbox"
                checked={twoFactor}
                onChange={(e) => setTwoFactor(e.target.checked)}
                className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Edit Form */}
        <div className="lg:col-span-2 bg-[#0B0F17]/90 rounded-3xl p-6 sm:p-8 border border-amber-500/20 shadow-2xl backdrop-blur-xl">
          <h2 className="text-lg font-bold text-white font-heading pb-4 border-b border-slate-800">
            Payout Gateways & Profile Details
          </h2>

          <form onSubmit={handleSave} className="mt-6 space-y-5">
            {savedSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Security credentials updated successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  readOnly
                  value={user.fullName}
                  className="w-full bg-[#07090E] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Country / Jurisdiction</label>
                <input
                  type="text"
                  value={userCountry}
                  onChange={(e) => setUserCountry(e.target.value)}
                  className="w-full bg-[#07090E] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-[#07090E] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full bg-[#07090E] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Default USDT (TRC-20) Payout Address
                </label>
                <div className="relative">
                  <Wallet className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#07090E] border border-slate-700 rounded-xl text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  M-PESA Payout Phone Number (Kenya Lipa Na M-PESA)
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-emerald-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={mpesaNumber}
                    onChange={(e) => setMpesaNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#07090E] border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black py-3 rounded-xl shadow-lg transition-all cursor-pointer text-xs uppercase tracking-wider"
              >
                Save Updated Security Settings
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
};
