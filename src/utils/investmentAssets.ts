import goldBullionImg from '../assets/images/gold_investment_bullion_1790412608821.jpg';
import silverBullionImg from '../assets/images/silver_investment_bullion_1790412619466.jpg';
import bronzeBullionImg from '../assets/images/bronze_investment_bars_1790412630563.jpg';
import platinumBullionImg from '../assets/images/platinum_investment_bars_1790412641839.jpg';

export const INVESTMENT_IMAGES = {
  gold: goldBullionImg,
  silver: silverBullionImg,
  bronze: bronzeBullionImg,
  platinum: platinumBullionImg,
} as const;

/**
 * Returns the matching high-fidelity asset image for an investment tier or plan name.
 * Gold -> Pure 999.9 Gold Bullion
 * Silver -> Pure 999 Fine Silver Bullion
 * Bronze -> Polished Bronze Ingot
 * Platinum -> Ultra-luxury Platinum Bullion
 */
export function getInvestmentImage(planOrTierName?: string): string {
  if (!planOrTierName) return goldBullionImg;
  const lower = planOrTierName.toLowerCase();
  if (lower.includes('silver')) {
    return silverBullionImg;
  }
  if (lower.includes('gold')) {
    return goldBullionImg;
  }
  if (lower.includes('bronze')) {
    return bronzeBullionImg;
  }
  if (lower.includes('platinum')) {
    return platinumBullionImg;
  }
  return goldBullionImg;
}

export function getInvestmentTierBadge(planOrTierName?: string): {
  label: string;
  badgeClass: string;
  accentColor: string;
} {
  const lower = (planOrTierName || '').toLowerCase();
  if (lower.includes('silver')) {
    return {
      label: 'SILVER 999 BULLION',
      badgeClass: 'bg-slate-800/80 text-slate-200 border-slate-400/40',
      accentColor: '#94a3b8'
    };
  }
  if (lower.includes('gold')) {
    return {
      label: 'GOLD 999.9 BULLION',
      badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
      accentColor: '#f59e0b'
    };
  }
  if (lower.includes('bronze')) {
    return {
      label: 'BRONZE ASSET',
      badgeClass: 'bg-amber-950/60 text-amber-500 border-amber-700/40',
      accentColor: '#d97706'
    };
  }
  return {
    label: 'PLATINUM VIP',
    badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
    accentColor: '#06b6d4'
  };
}
