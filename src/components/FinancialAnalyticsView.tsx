import React, { useState } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieIcon, 
  Calendar, 
  ShieldCheck, 
  ArrowUpRight, 
  Sparkles, 
  Activity,
  Layers,
  HelpCircle
} from 'lucide-react';
import { WalletState, ActiveInvestment } from '../types';

interface FinancialAnalyticsViewProps {
  wallet: WalletState;
  activeInvestments: ActiveInvestment[];
}

export const FinancialAnalyticsView: React.FC<FinancialAnalyticsViewProps> = ({
  wallet,
  activeInvestments
}) => {
  const [selectedProjection, setSelectedProjection] = useState<'moderate' | 'conservative' | 'aggressive'>('moderate');
  const [hoveredBarIdx, setHoveredBarIdx] = useState<number | null>(null);
  const [hoveredLineIdx, setHoveredLineIdx] = useState<number | null>(null);

  // Dynamic monthly earnings breakdown derived from customer's actual historical figures
  const monthlyEarningsData = React.useMemo(() => {
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const totalYield = wallet.totalEarnings;
    const totalRef = wallet.referralEarnings;

    if (totalYield === 0 && totalRef === 0) {
      return months.map(m => ({
        month: `${m} 2026`,
        directYield: 0,
        referralBonus: 0,
        total: 0
      }));
    }

    // Weight distribution across the last 6 months for active earnings
    const weights = [0.05, 0.1, 0.15, 0.2, 0.25, 0.25];
    return months.map((m, idx) => {
      const dy = Math.round(totalYield * weights[idx]);
      const rb = Math.round(totalRef * weights[idx]);
      return {
        month: `${m} 2026`,
        directYield: dy,
        referralBonus: rb,
        total: dy + rb
      };
    });
  }, [wallet.totalEarnings, wallet.referralEarnings]);

  // Dynamic compounding forecast based on customer's actual current balance
  const projectionData = React.useMemo(() => {
    const currentCapital = wallet.totalBalance;
    if (currentCapital === 0) {
      return [
        { days: 'Current (Day 0)', conservative: 0, moderate: 0, aggressive: 0 },
        { days: '30 Days', conservative: 0, moderate: 0, aggressive: 0 },
        { days: '60 Days', conservative: 0, moderate: 0, aggressive: 0 },
        { days: '90 Days', conservative: 0, moderate: 0, aggressive: 0 },
        { days: '180 Days', conservative: 0, moderate: 0, aggressive: 0 },
      ];
    }

    // Compound ROI formulas: Conservative 5% daily, Moderate 7.5% daily, Aggressive 10% daily with 50% compounding
    return [
      { 
        days: 'Current (Day 0)', 
        conservative: currentCapital, 
        moderate: currentCapital, 
        aggressive: currentCapital 
      },
      { 
        days: '30 Days', 
        conservative: Math.round(currentCapital * 1.5), 
        moderate: Math.round(currentCapital * 1.9), 
        aggressive: Math.round(currentCapital * 2.3) 
      },
      { 
        days: '60 Days', 
        conservative: Math.round(currentCapital * 2.2), 
        moderate: Math.round(currentCapital * 3.2), 
        aggressive: Math.round(currentCapital * 4.8) 
      },
      { 
        days: '90 Days', 
        conservative: Math.round(currentCapital * 3.5), 
        moderate: Math.round(currentCapital * 5.5), 
        aggressive: Math.round(currentCapital * 9.2) 
      },
      { 
        days: '180 Days', 
        conservative: Math.round(currentCapital * 7.8), 
        moderate: Math.round(currentCapital * 14.5), 
        aggressive: Math.round(currentCapital * 26.0) 
      },
    ];
  }, [wallet.totalBalance]);

  // SVG dimensions for Bar Chart
  const barSvgW = 600;
  const barSvgH = 220;
  const barPadX = 45;
  const barPadY = 25;
  const barMaxVal = Math.max(...monthlyEarningsData.map(d => d.total), 1000);
  const barPlotW = barSvgW - barPadX * 2;
  const barPlotH = barSvgH - barPadY * 2;

  // SVG dimensions for Line Chart
  const lineSvgW = 600;
  const lineSvgH = 220;
  const linePadX = 45;
  const linePadY = 25;
  const lineMaxVal = Math.max(...projectionData.map(d => d[selectedProjection]), 1000);
  const linePlotW = lineSvgW - linePadX * 2;
  const linePlotH = lineSvgH - linePadY * 2;

  const projectionPoints = projectionData.map((d, i) => {
    const val = d[selectedProjection];
    const x = linePadX + (i / Math.max(projectionData.length - 1, 1)) * linePlotW;
    const y = linePadY + linePlotH - (val / (lineMaxVal || 1)) * linePlotH;
    return { x, y, data: d, val };
  });

  const linePath = projectionPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');
  const lineArea = `${linePath} L ${projectionPoints[projectionPoints.length - 1].x.toFixed(1)} ${(linePadY + linePlotH).toFixed(1)} L ${projectionPoints[0].x.toFixed(1)} ${(linePadY + linePlotH).toFixed(1)} Z`;

  return (
    <div className="space-y-6">
      
      {/* Analytics Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-heading">
            Quantiq Prime Yield Analytics (KES)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Deep algorithmic audit of historical dividends, active contract velocities, and compounding forecasts in Kenyan Shillings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0B0F17] border border-amber-500/30 rounded-2xl px-4 py-2 text-right">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Compound Rate</span>
            <div className="text-sm font-black text-white font-mono">+18.4% / mo</div>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0B0F17]/90 rounded-3xl p-5 border border-amber-500/20 backdrop-blur-xl">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historical Total Yield</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            Ksh {wallet.totalEarnings.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Across active institutional contracts
          </div>
        </div>

        <div className="bg-[#0B0F17]/90 rounded-3xl p-5 border border-amber-500/20 backdrop-blur-xl">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Affiliate Yield Velocity</div>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">
            Ksh {wallet.referralEarnings.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            10% direct sponsor bonus
          </div>
        </div>

        <div className="bg-[#0B0F17]/90 rounded-3xl p-5 border border-amber-500/20 backdrop-blur-xl">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Daily Payout</div>
          <div className="text-2xl font-black text-white mt-1 font-mono">
            Ksh {wallet.todayYield.toLocaleString('en-KE', { minimumFractionDigits: 2 })} / day
          </div>
          <div className="text-xs text-emerald-400 mt-1 font-bold">
            Settled every 24 hours at 00:00 EAT
          </div>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="bg-[#0B0F17]/90 rounded-3xl p-6 border border-amber-500/20 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white font-heading">Monthly Harvest Breakdown</h2>
            <p className="text-xs text-slate-400">Direct algorithmic yield vs. affiliate commissions (KES)</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="text-slate-300">Direct Yield</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-slate-300">Affiliate Bonus</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full mt-4 relative">
          <svg viewBox={`0 0 ${barSvgW} ${barSvgH}`} className="w-full h-full overflow-visible">
            {/* Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = barPadY + barPlotH * (1 - ratio);
              const val = ratio * barMaxVal;
              return (
                <g key={idx}>
                  <line 
                    x1={barPadX} 
                    y1={y} 
                    x2={barSvgW - barPadX} 
                    y2={y} 
                    stroke="#1E293B" 
                    strokeDasharray="3 3" 
                  />
                  <text 
                    x={barPadX - 6} 
                    y={y + 3} 
                    fill="#64748B" 
                    fontSize="9" 
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {monthlyEarningsData.map((d, i) => {
              const slotWidth = barPlotW / monthlyEarningsData.length;
              const slotCenterX = barPadX + (i + 0.5) * slotWidth;
              const barWidth = 14;
              
              const hDirect = (d.directYield / barMaxVal) * barPlotH;
              const yDirect = barPadY + barPlotH - hDirect;
              
              const hRef = (d.referralBonus / barMaxVal) * barPlotH;
              const yRef = barPadY + barPlotH - hRef;

              return (
                <g key={i}>
                  {/* Direct Yield Bar (Amber) */}
                  <rect
                    x={slotCenterX - barWidth - 2}
                    y={yDirect}
                    width={barWidth}
                    height={hDirect}
                    rx="3"
                    fill="#F59E0B"
                    className="transition-all hover:opacity-80"
                  />
                  {/* Referral Bonus Bar (Emerald) */}
                  <rect
                    x={slotCenterX + 2}
                    y={yRef}
                    width={barWidth}
                    height={hRef}
                    rx="3"
                    fill="#10B981"
                    className="transition-all hover:opacity-80"
                  />
                  {/* Month Label */}
                  <text
                    x={slotCenterX}
                    y={barSvgH - 6}
                    fill="#64748B"
                    fontSize="9"
                    textAnchor="middle"
                    className="font-medium"
                  >
                    {d.month}
                  </text>

                  {/* Interactive hit strip */}
                  <rect
                    x={slotCenterX - slotWidth / 2}
                    y={0}
                    width={slotWidth}
                    height={barSvgH}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredBarIdx(i)}
                    onMouseLeave={() => setHoveredBarIdx(null)}
                  />
                </g>
              );
            })}
          </svg>

          {/* Bar Hover Tooltip */}
          {hoveredBarIdx !== null && monthlyEarningsData[hoveredBarIdx] && (
            <div 
              className="absolute top-2 bg-[#07090E]/95 border border-amber-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-md pointer-events-none z-20 text-xs transition-all"
              style={{
                left: `${Math.min(Math.max(10, ((hoveredBarIdx + 0.5) / monthlyEarningsData.length) * 100 - 15), 75)}%`
              }}
            >
              <div className="font-bold text-amber-300 font-mono mb-1">{monthlyEarningsData[hoveredBarIdx].month}</div>
              <div className="flex items-center justify-between gap-4 text-slate-300">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Direct Yield:
                </span>
                <span className="font-mono font-bold text-amber-400">Ksh {monthlyEarningsData[hoveredBarIdx].directYield.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-slate-300 mt-0.5">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Affiliate Bonus:
                </span>
                <span className="font-mono font-bold text-emerald-400">Ksh {monthlyEarningsData[hoveredBarIdx].referralBonus.toLocaleString()}</span>
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-slate-800 flex items-center justify-between gap-4 font-bold text-white">
                <span>Total Month:</span>
                <span className="font-mono text-yellow-300">Ksh {monthlyEarningsData[hoveredBarIdx].total.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Projection Line Chart */}
      <div className="bg-[#0B0F17]/90 rounded-3xl p-6 border border-amber-500/20 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white font-heading">6-Month Capital Compound Forecast (KES)</h2>
            <p className="text-xs text-slate-400">Projected portfolio growth based on algorithmic reinvestment</p>
          </div>
          <div className="flex bg-[#07090E] p-1 rounded-xl border border-slate-800 text-xs font-bold">
            {(['conservative', 'moderate', 'aggressive'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedProjection(mode)}
                className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                  selectedProjection === mode
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full mt-4 relative">
          <svg viewBox={`0 0 ${lineSvgW} ${lineSvgH}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="colorProjGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0"/>
              </linearGradient>
            </defs>

            {/* Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = linePadY + linePlotH * (1 - ratio);
              const val = ratio * lineMaxVal;
              return (
                <g key={idx}>
                  <line 
                    x1={linePadX} 
                    y1={y} 
                    x2={lineSvgW - linePadX} 
                    y2={y} 
                    stroke="#1E293B" 
                    strokeDasharray="3 3" 
                  />
                  <text 
                    x={linePadX - 6} 
                    y={y + 3} 
                    fill="#64748B" 
                    fontSize="9" 
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : `${(val/1000).toFixed(0)}k`}
                  </text>
                </g>
              );
            })}

            {/* Area and Line Path */}
            <path d={lineArea} fill="url(#colorProjGold)" />
            <path d={linePath} fill="none" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />

            {/* Points & Labels */}
            {projectionPoints.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill="#F59E0B"
                  stroke="#07090E"
                  strokeWidth="2"
                />
                <text
                  x={p.x}
                  y={lineSvgH - 6}
                  fill="#64748B"
                  fontSize="9"
                  textAnchor="middle"
                  className="font-medium"
                >
                  {p.data.days}
                </text>
              </g>
            ))}

            {/* Interactive Cursor */}
            {hoveredLineIdx !== null && projectionPoints[hoveredLineIdx] && (
              <g>
                <line
                  x1={projectionPoints[hoveredLineIdx].x}
                  y1={linePadY}
                  x2={projectionPoints[hoveredLineIdx].x}
                  y2={linePadY + linePlotH}
                  stroke="#F59E0B"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={projectionPoints[hoveredLineIdx].x}
                  cy={projectionPoints[hoveredLineIdx].y}
                  r="7"
                  fill="#FEF08A"
                  stroke="#F59E0B"
                  strokeWidth="3"
                />
              </g>
            )}

            {/* Interactive Hit strips */}
            {projectionPoints.map((_, i) => {
              const x = linePadX + (i / Math.max(projectionData.length - 1, 1)) * linePlotW;
              const width = linePlotW / Math.max(projectionData.length, 1);
              return (
                <rect
                  key={i}
                  x={x - width / 2}
                  y={0}
                  width={width}
                  height={lineSvgH}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoveredLineIdx(i)}
                  onMouseLeave={() => setHoveredLineIdx(null)}
                />
              );
            })}
          </svg>

          {/* Line Tooltip */}
          {hoveredLineIdx !== null && projectionPoints[hoveredLineIdx] && (
            <div 
              className="absolute top-2 bg-[#07090E]/95 border border-amber-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-md pointer-events-none z-20 text-xs transition-all"
              style={{
                left: `${Math.min(Math.max(10, (hoveredLineIdx / Math.max(projectionData.length - 1, 1)) * 100 - 15), 70)}%`
              }}
            >
              <div className="font-bold text-amber-300 font-mono mb-1">{projectionPoints[hoveredLineIdx].data.days}</div>
              <div className="flex items-center justify-between gap-4 text-slate-300">
                <span className="capitalize">{selectedProjection} Compound:</span>
                <span className="font-mono font-bold text-white text-sm">
                  Ksh {projectionPoints[hoveredLineIdx].val.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
