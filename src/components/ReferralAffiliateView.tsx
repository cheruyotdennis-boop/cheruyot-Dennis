import React, { useState } from 'react';
import { 
  Share2, 
  Gift, 
  Users, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowUpRight, 
  Award, 
  QrCode, 
  MessageCircle, 
  Send, 
  Twitter, 
  Mail,
  DollarSign,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';
import { safeCopyText } from '../utils/storage';
import { UserProfile, WalletState, ReferralMember } from '../types';
import { INITIAL_REFERRALS } from '../data/mockData';

interface ReferralAffiliateViewProps {
  user: UserProfile;
  wallet: WalletState;
}

export const ReferralAffiliateView: React.FC<ReferralAffiliateViewProps> = ({
  user,
  wallet
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [referrals, setReferrals] = useState<ReferralMember[]>(INITIAL_REFERRALS);
  const [selectedTierTab, setSelectedTierTab] = useState<1 | 2 | 3>(1);

  const baseUrl = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://quantiqprime.com';
  const referralUrl = `${baseUrl}/?ref=${user.referralCode || ''}`;

  const handleCopyLink = () => {
    safeCopyText(referralUrl);
    setCopiedLink(true);
    triggerConfetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    safeCopyText(user.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const tier1Members = referrals.filter(r => r.tierLevel === 1);
  const tier2Members = referrals.filter(r => r.tierLevel === 2);
  const tier3Members = referrals.filter(r => r.tierLevel === 3);

  const displayedMembers = 
    selectedTierTab === 1 ? tier1Members :
    selectedTierTab === 2 ? tier2Members : tier3Members;

  const totalTeamDeposits = referrals.reduce((sum, r) => sum + r.activeDeposits, 0);

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white font-heading">
              Quantiq Prime Affiliate Syndicate
            </h1>
            <span className="text-xs font-bold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/40">
              VIP Sponsor #{user.referralCode}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Invite colleagues and partner investors to earn instant 3-tier perpetual commissions paid directly to your balance.
          </p>
        </div>

        <div className="bg-[#0B0F17] border border-amber-500/30 rounded-2xl px-4 py-2 text-right">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Total Commissions Earned</div>
          <div className="text-lg font-black text-white font-mono">
            Ksh {wallet.referralEarnings.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Main Referral Invitation Card */}
      <div className="bg-[#0B0F17]/95 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-500/30 relative overflow-hidden backdrop-blur-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Link Controls (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>Your Unique Referral Invitation</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-heading text-white">
              Share Quantiq Prime & Earn <span className="text-amber-400">10% Direct Bonus</span> on Referee Stake
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Every investor who registers using your sponsor code <span className="text-amber-400 font-mono font-bold">#{user.referralCode}</span> yields an instant <b className="text-emerald-400">10% commission on their total invested stake (KES)</b>, credited automatically to your available balance.
            </p>

            {/* Link Box */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Shareable Registration URL (with ref={user.referralCode})
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#07090E] border border-slate-700/80 p-2 rounded-2xl">
                <input
                  type="text"
                  readOnly
                  value={referralUrl}
                  className="w-full bg-transparent px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none select-all truncate"
                />
                <button
                  id="copy-affiliate-link-btn"
                  onClick={handleCopyLink}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Social Share Shortcuts */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold mr-1">Direct Share:</span>
              
              <a
                href={`https://wa.me/?text=Join%20Quantiq%20Prime%20with%20me%20and%20grow%20wealth%20daily%20at%207.5%25%20ROI:%20${encodeURIComponent(referralUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=Join%20Quantiq%20Prime%20for%207.5%25%20daily%20algorithmic%20wealth%20growth`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=Growing%20my%20portfolio%20with%20Quantiq%20Prime%20at%207.5%25%20daily%20yield.%20Check%20it%20out:%20${encodeURIComponent(referralUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl transition-colors"
              >
                <Twitter className="w-3.5 h-3.5" />
                <span>Twitter / X</span>
              </a>
            </div>

          </div>

          {/* QR Code & Code Box (4 cols) */}
          <div className="lg:col-span-4 bg-[#07090E] border border-amber-500/30 rounded-3xl p-5 backdrop-blur-md text-center flex flex-col items-center justify-center space-y-3 shadow-xl">
            <div className="w-32 h-32 bg-white p-2 rounded-2xl shadow-lg flex items-center justify-center">
              <div className="w-full h-full border-4 border-slate-950 rounded-lg p-2 flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-6 h-6 bg-slate-950 rounded-sm"></div>
                  <div className="w-6 h-6 bg-slate-950 rounded-sm"></div>
                </div>
                <div className="text-[10px] font-black text-slate-950 tracking-tighter">
                  REF {user.referralCode}
                </div>
                <div className="flex justify-between">
                  <div className="w-6 h-6 bg-slate-950 rounded-sm"></div>
                  <div className="w-6 h-6 bg-amber-500 rounded-sm"></div>
                </div>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400">Direct Sponsor ID:</span>
              <div className="flex items-center justify-center gap-2 mt-0.5">
                <span className="text-xl font-black font-mono text-amber-400">#{user.referralCode}</span>
                <button
                  onClick={handleCopyCode}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="text-[10px] text-emerald-400 font-bold mt-1">10% Direct Commission</div>
            </div>
          </div>

        </div>
      </div>

      {/* 3 Tier Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0B0F17]/90 rounded-3xl p-5 border border-amber-500/20 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Tier 1 Direct (10% Stake Bonus)</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {tier1Members.length} Members
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            Active Stake: <span className="text-white">Ksh {tier1Members.reduce((s, m) => s + m.activeDeposits, 0).toLocaleString()}</span> • Bonus: <span className="text-emerald-400">+Ksh {tier1Members.reduce((s, m) => s + m.commissionEarned, 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-[#0B0F17]/90 rounded-3xl p-5 border border-amber-500/20 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Tier 2 Network (5%)</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {tier2Members.length} Members
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            Active Stake: <span className="text-white">Ksh {tier2Members.reduce((s, m) => s + m.activeDeposits, 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-[#0B0F17]/90 rounded-3xl p-5 border border-amber-500/20 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tier 3 Extended (2%)</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {tier3Members.length} Members
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            Active Stake: <span className="text-white">Ksh {tier3Members.reduce((s, m) => s + m.activeDeposits, 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Referral Team Table */}
      <div className="bg-[#0B0F17]/90 rounded-3xl p-6 border border-amber-500/20 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white font-heading">Referral Downline Network</h2>
            <span className="text-xs font-mono text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
              {displayedMembers.length} Partners
            </span>
          </div>

          <div className="flex bg-[#07090E] p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setSelectedTierTab(1)}
              className={`px-3 py-1 rounded-lg cursor-pointer ${
                selectedTierTab === 1 ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
              }`}
            >
              Tier 1 (10% Direct)
            </button>
            <button
              onClick={() => setSelectedTierTab(2)}
              className={`px-3 py-1 rounded-lg cursor-pointer ${
                selectedTierTab === 2 ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
              }`}
            >
              Tier 2 (5%)
            </button>
            <button
              onClick={() => setSelectedTierTab(3)}
              className={`px-3 py-1 rounded-lg cursor-pointer ${
                selectedTierTab === 3 ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
              }`}
            >
              Tier 3 (2%)
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <th className="pb-3 font-semibold">Referee Profile</th>
                <th className="pb-3 font-semibold">Join Date</th>
                <th className="pb-3 font-semibold">Referee Stake</th>
                <th className="pb-3 font-semibold">10% Bonus Paid</th>
                <th className="pb-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {displayedMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-8 h-8 text-slate-600 mb-2" />
                      <p className="font-semibold text-white">No Referrals in Tier {selectedTierTab} Yet</p>
                      <p className="text-xs text-slate-400 mt-1">Share your link #{user.referralCode} to earn instant direct commissions on referee deposits.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 font-medium text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-amber-400 font-bold flex items-center justify-center text-xs">
                        {m.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-white">@{m.username}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Referee ID: #{m.id}</div>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-400 font-mono">{m.joinedDate}</td>
                    <td className="py-3.5 font-bold font-mono text-white">Ksh {m.activeDeposits.toLocaleString()}</td>
                    <td className="py-3.5 font-bold font-mono text-emerald-400">+Ksh {m.commissionEarned.toLocaleString()}</td>
                    <td className="py-3.5 text-right">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
