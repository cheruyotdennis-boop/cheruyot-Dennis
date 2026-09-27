import React from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  PhoneCall,
  Zap
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenMpesa: () => void;
  onOpenContacts?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenMpesa,
  onOpenContacts
}) => {
  return (
    <nav 
      id="mobile-bottom-navbar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black border-t border-neutral-800 px-2 py-2 safe-area-pb"
    >
      <div className="flex items-center justify-around">
        {/* Overview Tab */}
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-1" />
          <span className="text-[10px] tracking-tight">Overview</span>
          {activeTab === 'overview' && (
            <span className="w-1.5 h-1.5 bg-amber-400 mt-0.5"></span>
          )}
        </button>

        {/* Investments / Yield Plans */}
        <button
          onClick={() => setActiveTab('investments')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 transition-all cursor-pointer ${
            activeTab === 'investments'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-5 h-5 mb-1" />
          <span className="text-[10px] tracking-tight">Yield Plans</span>
          {activeTab === 'investments' && (
            <span className="w-1.5 h-1.5 bg-amber-400 mt-0.5"></span>
          )}
        </button>

        {/* M-PESA Action Button (integrated square, not floating) */}
        <button
          onClick={onOpenMpesa}
          className="flex flex-col items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-3 py-1.5 border border-emerald-400 font-black active:scale-95 transition-transform cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-slate-950" />
          <span className="text-[8px] font-black uppercase tracking-wider">M-PESA</span>
        </button>

        {/* Team / Referrals */}
        <button
          onClick={() => setActiveTab('referrals')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 transition-all cursor-pointer ${
            activeTab === 'referrals'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5 mb-1" />
          <span className="text-[10px] tracking-tight">Referrals</span>
          {activeTab === 'referrals' && (
            <span className="w-1.5 h-1.5 bg-amber-400 mt-0.5"></span>
          )}
        </button>

        {/* Contact Support */}
        <button
          id="mobile-bottom-contact-btn"
          onClick={onOpenContacts}
          className="flex flex-col items-center justify-center py-1.5 px-2 transition-all cursor-pointer text-slate-400 hover:text-emerald-300 active:scale-95"
        >
          <PhoneCall className="w-5 h-5 mb-1 text-emerald-400" />
          <span className="text-[10px] tracking-tight font-bold text-emerald-400">Contact</span>
        </button>
      </div>
    </nav>
  );
};
