import React, { useState } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  TrendingUp, 
  Sparkles, 
  Layers, 
  Search, 
  Filter, 
  Download, 
  Copy, 
  Check, 
  ExternalLink,
  Calendar,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react';
import { Transaction } from '../types';
import { safeCopyText } from '../utils/storage';
import { sanitizeCsvField } from '../utils/security';

interface TransactionHistoryViewProps {
  transactions: Transaction[];
}

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({
  transactions
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const filteredTransactions = transactions.filter((tx) => {
    let matchesFilter = true;
    if (selectedFilter === 'yield') {
      matchesFilter = tx.type === 'ROI_PAYOUT' || tx.type === 'INVESTMENT';
    } else if (selectedFilter === 'deposit') {
      matchesFilter = tx.type === 'DEPOSIT';
    } else if (selectedFilter === 'withdrawal') {
      matchesFilter = tx.type === 'WITHDRAWAL';
    } else if (selectedFilter === 'referral') {
      matchesFilter = tx.type === 'REFERRAL_BONUS';
    }

    const matchesSearch = 
      (tx.note && tx.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.methodOrAddress && tx.methodOrAddress.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.type && tx.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.id && tx.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.txHash && tx.txHash.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleCopy = (text: string) => {
    safeCopyText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleExportCSV = () => {
    try {
      const headers = ['ID', 'Type', 'Amount', 'Currency', 'Status', 'Date', 'Description', 'Method'];
      const rows = filteredTransactions.map(t => [
        sanitizeCsvField(t.id),
        sanitizeCsvField(t.type),
        sanitizeCsvField(t.amount),
        sanitizeCsvField(t.currency || 'KES'),
        sanitizeCsvField(t.status),
        sanitizeCsvField(t.timestamp),
        sanitizeCsvField(t.note || ''),
        sanitizeCsvField(t.methodOrAddress || '')
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.map(sanitizeCsvField).join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Quantiq_Prime_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // gracefully handle in sandboxed environments
    }
  };

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-heading">
            Financial Ledger & Settlement History (KES)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Auditable, cryptographic ledger of deposits, daily algorithmic ROI settlements, M-PESA paybills, and wallet payouts.
          </p>
        </div>

        <button
          id="export-csv-btn"
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 bg-[#0B0F17] hover:bg-[#151A29] text-amber-300 text-xs font-bold px-4 py-2.5 rounded-xl border border-amber-500/30 shadow-md transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Export CSV Statement</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0B0F17]/90 rounded-3xl p-4 border border-amber-500/20 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 backdrop-blur-xl">
        
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs font-bold">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === 'ALL' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black' : 'bg-[#0E131F] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Entries ({transactions.length})
          </button>
          <button
            onClick={() => setSelectedFilter('yield')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === 'yield' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-[#0E131F] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Yields
          </button>
          <button
            onClick={() => setSelectedFilter('deposit')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === 'deposit' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-[#0E131F] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Deposits
          </button>
          <button
            onClick={() => setSelectedFilter('withdrawal')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === 'withdrawal' ? 'bg-rose-500 text-white font-black' : 'bg-[#0E131F] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Withdrawals
          </button>
          <button
            onClick={() => setSelectedFilter('referral')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === 'referral' ? 'bg-yellow-400 text-slate-950 font-black' : 'bg-[#0E131F] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Affiliate Bonuses
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="tx-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search note, method, amount..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#0E131F] border border-slate-700/80 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
          />
        </div>

      </div>

      {/* Ledger Table Card */}
      <div className="bg-[#0B0F17]/90 rounded-3xl p-6 border border-amber-500/20 shadow-2xl backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <th className="pb-3 font-semibold">Transaction Details</th>
                <th className="pb-3 font-semibold">Amount (KES)</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Method / Rail</th>
                <th className="pb-3 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr 
                    key={tx.id} 
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 font-medium text-white flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.type === 'DEPOSIT' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                        tx.type === 'ROI_PAYOUT' || tx.type === 'INVESTMENT' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' :
                        tx.type === 'REFERRAL_BONUS' ? 'bg-yellow-950 text-yellow-400 border border-yellow-500/30' :
                        tx.type === 'WITHDRAWAL' ? 'bg-rose-950 text-rose-400 border border-rose-500/30' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {tx.type === 'DEPOSIT' ? <ArrowDownLeft className="w-4 h-4" /> :
                         tx.type === 'ROI_PAYOUT' ? <TrendingUp className="w-4 h-4" /> :
                         tx.type === 'REFERRAL_BONUS' ? <Sparkles className="w-4 h-4" /> :
                         tx.type === 'WITHDRAWAL' ? <ArrowUpRight className="w-4 h-4" /> :
                         <Layers className="w-4 h-4" />}
                      </span>
                      <div>
                        <div className="font-bold text-white group-hover:text-amber-400 transition-colors">
                          {tx.note || `${tx.type} Transaction`}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {tx.id}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 font-mono font-bold">
                      <span className={tx.type === 'WITHDRAWAL' ? 'text-rose-400' : 'text-emerald-400'}>
                        {tx.type === 'WITHDRAWAL' ? '-' : '+'}Ksh {tx.amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        {tx.status}
                      </span>
                    </td>

                    <td className="py-3.5 text-slate-300 font-mono text-[11px]">
                      {tx.methodOrAddress}
                    </td>

                    <td className="py-3.5 text-right text-slate-400 font-mono text-[11px]">
                      {tx.timestamp}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto p-3 sm:p-4 flex items-center justify-center">
          <div className="bg-[#0B0F17] border border-amber-500/30 rounded-3xl p-5 sm:p-6 max-w-md w-full text-white shadow-2xl space-y-4 my-auto max-h-[92vh] flex flex-col overflow-hidden">
            <div className="shrink-0 flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold font-heading">Receipt & Audit Proof</h3>
              <button 
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 overflow-y-auto flex-1 overscroll-contain pr-1">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="font-mono text-white">{selectedTx.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Type:</span>
                <span className="font-bold text-amber-400 uppercase">{selectedTx.type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Amount:</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">Ksh {selectedTx.amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Settlement Method:</span>
                <span className="font-mono text-white">{selectedTx.methodOrAddress}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Note:</span>
                <span className="font-mono text-slate-200">{selectedTx.note}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold uppercase">{selectedTx.status}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Time:</span>
                <span className="font-mono text-white">{selectedTx.timestamp}</span>
              </div>
            </div>

            <button
              onClick={() => handleCopy(JSON.stringify(selectedTx, null, 2))}
              className="shrink-0 w-full bg-slate-800 hover:bg-slate-700 text-amber-300 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {copiedHash ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedHash ? 'Copied Details!' : 'Copy Transaction Record'}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
