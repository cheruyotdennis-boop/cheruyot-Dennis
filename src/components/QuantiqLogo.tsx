import React from 'react';
import logoImg from '../assets/images/quantiq_prime_logo_1787995672917.jpg';

interface QuantiqLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  useGraphicEmblem?: boolean;
}

export const QuantiqLogo: React.FC<QuantiqLogoProps> = ({
  size = 'md',
  showTagline = true,
  className = '',
  useGraphicEmblem = true
}) => {
  const iconSizes = {
    sm: 'w-9 h-9',
    md: 'w-13 h-13 sm:w-14 sm:h-14',
    lg: 'w-18 h-18 sm:w-20 sm:h-20',
    xl: 'w-24 h-24 sm:w-28 sm:h-28'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-5xl'
  };

  const primeSizes = {
    sm: 'text-[10px] tracking-[0.28em]',
    md: 'text-xs sm:text-[13px] tracking-[0.38em]',
    lg: 'text-sm sm:text-base tracking-[0.42em]',
    xl: 'text-base sm:text-lg tracking-[0.48em]'
  };

  return (
    <div className={`flex items-center gap-3.5 group select-none ${className}`}>
      {/* 3D High-Definition Metallic Emblem */}
      <div className={`relative ${iconSizes[size]} shrink-0 rounded-2xl p-[1.5px] bg-gradient-to-tr from-amber-500 via-amber-300 to-yellow-100 shadow-xl shadow-amber-500/25 group-hover:shadow-amber-400/40 transition-all duration-300 group-hover:scale-105`}>
        <div className="w-full h-full bg-[#05070B] rounded-[14px] flex items-center justify-center overflow-hidden relative">
          
          {useGraphicEmblem ? (
            <img 
              src={logoImg} 
              alt="Quantiq Prime Emblem" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-[13px] brightness-110 contrast-125"
            />
          ) : (
            <>
              {/* Subtle gold inner glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-transparent to-slate-200/10 pointer-events-none"></div>
              
              <svg viewBox="0 0 100 100" className="w-full h-full p-1 drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="goldGradCrisp" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FEF08A" />
                    <stop offset="25%" stopColor="#FBBF24" />
                    <stop offset="65%" stopColor="#D97706" />
                    <stop offset="100%" stopColor="#78350F" />
                  </linearGradient>
                  <linearGradient id="silverGradCrisp" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="35%" stopColor="#F1F5F9" />
                    <stop offset="70%" stopColor="#94A3B8" />
                    <stop offset="100%" stopColor="#334155" />
                  </linearGradient>
                  <linearGradient id="chartGradCrisp" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#D97706" />
                    <stop offset="50%" stopColor="#FBBF24" />
                    <stop offset="100%" stopColor="#FEF9C3" />
                  </linearGradient>
                </defs>

                {/* Golden 'Q' ring */}
                <circle cx="46" cy="46" r="28" stroke="url(#goldGradCrisp)" strokeWidth="8" fill="none" />
                
                {/* Q tail */}
                <path d="M53 53 L74 74 L62 86 L41 65 Z" fill="url(#goldGradCrisp)" />

                {/* Silver 'P' interlocking curve */}
                <path 
                  d="M48 24 L72 24 C82 24, 88 32, 88 42 C88 52, 80 58, 68 58 L54 58 L72 82 L60 88 L44 64" 
                  stroke="url(#silverGradCrisp)" 
                  strokeWidth="7" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  fill="none" 
                />

                {/* Candlestick Trading Bars */}
                <rect x="31" y="54" width="5" height="11" rx="1" fill="url(#chartGradCrisp)" />
                <rect x="41" y="44" width="5" height="20" rx="1" fill="url(#chartGradCrisp)" />
                <rect x="51" y="34" width="5" height="24" rx="1" fill="url(#chartGradCrisp)" />
              </svg>
            </>
          )}

          {/* Micro Ambient Shimmer */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-amber-400/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </div>
      </div>

      {/* Brand Typography with High-Definition Contrast */}
      <div className="flex flex-col justify-center text-left">
        <div className="flex items-center tracking-wider leading-none">
          <span className={`font-black uppercase tracking-[0.16em] text-white font-heading ${textSizes[size]} drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
            QUANTI
          </span>
          <span className={`font-black uppercase tracking-[0.16em] bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent font-heading ${textSizes[size]} drop-shadow-[0_2px_6px_rgba(245,158,11,0.4)]`}>
            Q
          </span>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <div className="h-[1.5px] w-3 sm:w-5 bg-gradient-to-r from-transparent via-amber-400 to-amber-500"></div>
          <span className={`font-black text-amber-400 uppercase font-heading ${primeSizes[size]} drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]`}>
            PRIME
          </span>
          <div className="h-[1.5px] w-3 sm:w-5 bg-gradient-to-l from-transparent via-amber-400 to-amber-500"></div>
        </div>

        {showTagline && size !== 'sm' && (
          <div className="text-[9px] tracking-[0.16em] text-slate-300 font-semibold uppercase mt-1 hidden xl:block">
            Trade Smart <span className="text-amber-400/80 mx-1">|</span> Invest Wise <span className="text-amber-400/80 mx-1">|</span> Grow Together
          </div>
        )}
      </div>
    </div>
  );
};
