import React from 'react';
import { ShieldCheck, Sparkles, Crown } from 'lucide-react';
import luxuryAvatarImg from '../assets/images/luxury_profile_avatar_1787995685280.jpg';

export interface ProfileAvatarProps {
  src?: string;
  name?: string;
  tier?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showOnlineStatus?: boolean;
  showKycBadge?: boolean;
  showTierRing?: boolean;
  className?: string;
  onClick?: () => void;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  src,
  name = 'VIP Investor',
  tier = 'Gold',
  size = 'md',
  showOnlineStatus = true,
  showKycBadge = false,
  showTierRing = true,
  className = '',
  onClick
}) => {
  const sizeMap = {
    xs: {
      container: 'w-7 h-7',
      img: 'w-7 h-7',
      text: 'text-[10px]',
      dot: 'w-2 h-2 -bottom-0.5 -right-0.5',
      badge: 'w-3 h-3 -bottom-1 -right-1'
    },
    sm: {
      container: 'w-8 h-8',
      img: 'w-8 h-8',
      text: 'text-xs',
      dot: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
      badge: 'w-3.5 h-3.5 -bottom-1 -right-1'
    },
    md: {
      container: 'w-10 h-10',
      img: 'w-10 h-10',
      text: 'text-sm',
      dot: 'w-3 h-3 -bottom-0.5 -right-0.5',
      badge: 'w-4 h-4 -bottom-1 -right-1'
    },
    lg: {
      container: 'w-14 h-14',
      img: 'w-14 h-14',
      text: 'text-lg',
      dot: 'w-3.5 h-3.5 bottom-0 right-0',
      badge: 'w-5 h-5 bottom-0 right-0'
    },
    xl: {
      container: 'w-20 h-20',
      img: 'w-20 h-20',
      text: 'text-2xl',
      dot: 'w-4 h-4 bottom-0.5 right-0.5',
      badge: 'w-6 h-6 bottom-0.5 right-0.5'
    },
    '2xl': {
      container: 'w-28 h-28',
      img: 'w-28 h-28',
      text: 'text-3xl',
      dot: 'w-5 h-5 bottom-1 right-1',
      badge: 'w-7 h-7 bottom-1 right-1'
    }
  };

  const getTierRingStyle = (tierName: string) => {
    const t = tierName.toLowerCase();
    if (t.includes('platinum') || t.includes('vip')) {
      return 'p-[2px] bg-gradient-to-tr from-cyan-400 via-amber-300 to-yellow-400 shadow-md shadow-amber-500/30';
    }
    if (t.includes('gold')) {
      return 'p-[2px] bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 shadow-md shadow-amber-500/20';
    }
    if (t.includes('silver')) {
      return 'p-[2px] bg-gradient-to-tr from-slate-400 via-slate-200 to-slate-500 shadow-md shadow-slate-400/20';
    }
    return 'p-[2px] bg-gradient-to-tr from-amber-800 via-amber-600 to-yellow-900';
  };

  const getInitials = (str: string) => {
    if (!str) return 'QP';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // Check if avatar is our luxury asset alias or standard URL
  const resolvedSrc = src === 'luxury' || src === 'crest' ? luxuryAvatarImg : src;

  return (
    <div 
      className={`relative inline-block select-none ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Tier Ring Frame */}
      <div className={`rounded-none overflow-hidden ${showTierRing ? getTierRingStyle(tier) : ''} ${sizeMap[size].container}`}>
        <div className="w-full h-full bg-black rounded-none flex items-center justify-center overflow-hidden relative">
          
          {resolvedSrc ? (
            <img
              src={resolvedSrc}
              alt={name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-none"
              onError={(e) => {
                // If image fails, fallback to styled initials
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-black text-amber-300 font-black font-heading tracking-wider border border-neutral-800">
              <span className={sizeMap[size].text}>{getInitials(name)}</span>
            </div>
          )}

          {/* Micro Ambient Shimmer */}
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-white/5 pointer-events-none"></div>
        </div>
      </div>

      {/* Online Status Dot */}
      {showOnlineStatus && !showKycBadge && (
        <span className={`absolute ${sizeMap[size].dot} flex items-center justify-center`}>
          <span className="relative inline-flex rounded-none h-full w-full bg-emerald-500 border border-black"></span>
        </span>
      )}

      {/* KYC Verified / VIP Badge */}
      {showKycBadge && (
        <div className={`absolute ${sizeMap[size].badge} bg-amber-500 text-slate-950 rounded-none flex items-center justify-center border border-black shadow-sm`}>
          <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </div>
      )}
    </div>
  );
};
