import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  MessageCircle, 
  Send, 
  Check, 
  Copy, 
  Headphones, 
  Clock,
  ExternalLink,
  Users
} from 'lucide-react';
import { PlatformContacts, UserProfile } from '../types';
import { safeCopyText } from '../utils/storage';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: PlatformContacts;
  user?: UserProfile;
  onUpdateContacts?: (updated: PlatformContacts) => void;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
}

export const ContactSupportModal: React.FC<ContactSupportModalProps> = ({
  isOpen,
  onClose,
  contacts
}) => {
  if (!isOpen) return null;

  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    safeCopyText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0B0F17] border border-amber-500/30 rounded-3xl max-w-lg w-full text-white shadow-2xl my-auto max-h-[92vh] flex flex-col backdrop-blur-2xl overflow-hidden">
        
        {/* Header */}
        <div className="shrink-0 p-5 sm:p-6 flex items-center justify-between border-b border-slate-800 bg-[#0E131F]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white font-heading">Official Support & Liaison</h3>
              <p className="text-xs text-slate-400">Direct VIP Support Channels & Client Assistance</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain text-xs">

          {/* Official WhatsApp Investors Group Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-[#0B1512] to-[#0E1B15] border-2 border-emerald-500/50 shadow-xl shadow-emerald-500/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/90 border border-emerald-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Official Investor Community
              </span>
              <span className="text-[10px] text-slate-300 font-mono font-bold flex items-center gap-1">
                <Users className="w-3 h-3 text-emerald-400" />
                1,400+ Members
              </span>
            </div>
            <div>
              <h4 className="text-sm font-black text-white font-heading">Quantiq Prime WhatsApp Group</h4>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                Join our official community group for live trading updates, daily yield proof, M-PESA settlement notifications, and direct executive interactions.
              </p>
            </div>
            <a
              href={contacts.whatsappGroupLink || 'https://chat.whatsapp.com/C0LXeuksKfRIxC8WO2aQv2'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-98"
            >
              <MessageCircle className="w-4 h-4 fill-slate-950" />
              <span>Join Official WhatsApp Group</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Quick Action Channels */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`https://wa.me/${(contacts.whatsappSupport || '').replace(/[^0-9]/g, '')}?text=Hello%20Quantiq%20Prime%20Support`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 flex items-center gap-2.5 transition-colors group"
            >
              <MessageCircle className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
              <div className="min-w-0">
                <div className="font-bold text-white text-xs truncate">WhatsApp VIP</div>
                <div className="text-[10px] text-emerald-400 font-mono truncate">{contacts.whatsappSupport}</div>
              </div>
            </a>

            <a
              href={`https://t.me/${(contacts.telegramSupport || '').replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-[#0E131F] hover:bg-slate-800 border border-amber-500/30 text-amber-300 flex items-center gap-2.5 transition-colors group"
            >
              <Send className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
              <div className="min-w-0">
                <div className="font-bold text-white text-xs truncate">Telegram Desk</div>
                <div className="text-[10px] text-amber-400 font-mono truncate">{contacts.telegramSupport}</div>
              </div>
            </a>
          </div>

          {/* Official Lipa Na M-PESA Buy Goods Till */}
          <div className="bg-[#07090E] p-4 rounded-2xl border border-emerald-500/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black shrink-0 text-[10px] font-mono">
                TILL
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-300">Lipa Na M-PESA (Smartchoice Ventures)</div>
                <div className="font-mono text-emerald-400 text-xs font-bold truncate">Till Number: 1722023</div>
              </div>
            </div>
            <button 
              onClick={() => handleCopy('1722023', 'till')} 
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer" 
              title="Copy Till"
            >
              {copiedItem === 'till' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedItem === 'till' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Official Support Email */}
          <div className="bg-[#07090E] p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-300">Official Support Email</div>
                <div className="font-mono text-white text-xs truncate">{contacts.supportEmail}</div>
              </div>
            </div>
            <button 
              onClick={() => handleCopy(contacts.supportEmail, 'email')} 
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer" 
              title="Copy Email"
            >
              {copiedItem === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedItem === 'email' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Desk Hours Banner */}
          <div className="p-3.5 bg-[#07090E] rounded-2xl border border-slate-800 flex items-center gap-2.5 text-xs text-slate-400">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Desk Hours: <b className="text-slate-200">24/7 Priority Support</b> (Automated trading 24/7/365)</span>
          </div>

        </div>

      </div>
    </div>
  );
};
