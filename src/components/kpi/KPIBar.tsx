import { useState } from 'react';
import { motion } from 'motion/react';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { StatusCue } from '../ui/Badge';
import { ShieldCheck, Vault } from '@phosphor-icons/react';
import type { TreasuryOverview } from '../../types/treasury';
import { formatUSD, formatINR } from '../../lib/utils';

interface KPIBarProps {
  overview: TreasuryOverview | null;
  isRecalculating?: boolean;
}

export function KPIBar({ overview, isRecalculating = false }: KPIBarProps) {
  const [hoveredLedgerIndex, setHoveredLedgerIndex] = useState<number | null>(null);

  if (!overview) {
    return (
      <div className="w-full h-80 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl animate-pulse p-6" />
    );
  }

  const { balances, burn_allocation, fee_leakage_audit, compliance } = overview;
  const inrEquivalent = balances.total_inr_equivalent || (balances.domestic_inr + (balances.eefc_usd * fee_leakage_audit.mid_market_rate));

  const ledgerRows = [
    {
      id: 'eefc',
      label: 'EEFC Virtual Reserve',
      sublabel: 'USD Foreign Export Proceeds',
      amount: formatUSD(balances.eefc_usd),
      detail: 'Primary Buffer',
      color: '#059669',
      borderAccent: '#059669',
    },
    {
      id: 'domestic',
      label: 'Domestic Settlement Account',
      sublabel: 'INR Operational Liquidity',
      amount: formatINR(balances.domestic_inr),
      detail: 'Settled Local',
      color: '#64748B',
      borderAccent: '#1E40AF',
    },
    {
      id: 'ring_fenced',
      label: 'Ring-Fenced SaaS Opex',
      sublabel: 'AWS & OpenAI Shielded Liabilities',
      amount: formatUSD(burn_allocation.ring_fenced_usd),
      detail: 'Auto-Shielded',
      color: '#D97706',
      borderAccent: '#D97706',
    },
    {
      id: 'yield_saved',
      label: 'Avoided Bank FX Spread',
      sublabel: 'Direct Wholesale Alpha Retained',
      amount: `+${formatUSD(fee_leakage_audit.total_historic_fees_saved_usd)}`,
      detail: `+${fee_leakage_audit.effective_margin_gain_pct}% Retained`,
      color: '#059669',
      borderAccent: '#059669',
      isPositive: true,
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`w-full bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-300 ${
        isRecalculating ? 'ring-2 ring-[#059669]/20' : ''
      }`}
    >
      {/* Connected Statutory Liquidation Progress Strip & Live Feed Keyline */}
      <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-5 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#1E40AF] font-semibold font-sans">
            <ShieldCheck size={14} weight="fill" />
            <span>FEMA Compliance P0802</span>
          </div>
          <div className="h-3 w-[1px] bg-[#E2E8F0] hidden sm:block" />
          <div className="flex items-center gap-2 text-[#64748B] font-sans">
            <span>Mandatory Sweep Window:</span>
            <span className="font-mono text-[#0F172A] font-semibold">{compliance.days_remaining_to_sweep} Days Remaining</span>
            <span className="text-[#94A3B8]">({compliance.fema_sweep_deadline})</span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto text-[11px] font-sans">
          <span className="text-[#64748B]">Interbank Reference Tick:</span>
          <span className="font-mono font-bold text-[#0F172A] bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#E2E8F0]">
            ₹{fee_leakage_audit.mid_market_rate.toFixed(4)}
          </span>
          <StatusCue variant="active">100% Ring-Fenced</StatusCue>
        </div>
      </div>

      {/* Unified Asymmetric Cockpit Body: 65% Left Balance Stage + 35% Right Inset Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E2E8F0]">
        {/* LEFT BALANCE STAGE (65% width / lg:col-span-8) */}
        <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Vault size={16} className="text-[#059669]" />
                <span className="font-sans text-xs uppercase font-bold text-[#64748B] tracking-wider">
                  Consolidated Sovereign Liquidity
                </span>
              </div>
              <StatusCue variant="active">Mark-to-Market</StatusCue>
            </div>

            {/* Monumental Balance Numeral in Syne Font (text-6xl / text-7xl, tight tracking) */}
            <div className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display tracking-tighter text-[#0F172A] my-3 leading-none select-none">
              <AnimatedCounter value={inrEquivalent} prefix="₹" decimals={0} />
            </div>

            <p className="font-sans text-xs sm:text-sm text-[#64748B] max-w-[62ch] leading-relaxed">
              Consolidated foreign currency reserves and domestic operational liquidity. Foreign export receipts are ring-fenced in EEFC virtual ledgers under RBI Section 5 to eliminate currency conversion slippage.
            </p>
          </div>

          {/* Integrated Reserve Metadata Grid (Keyline Depth) */}
          <div className="pt-6 mt-8 border-t border-[#E2E8F0] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="border-r border-[#E2E8F0] pr-3">
              <span className="block font-sans text-[10px] uppercase font-bold text-[#64748B] mb-1">
                30-Day Opex Runway
              </span>
              <div className="font-mono text-base font-bold text-[#0F172A]">
                {burn_allocation.runway_coverage_pct}%
              </div>
              <span className="font-sans text-[10px] text-[#059669] font-medium">Liabilities Shielded</span>
            </div>

            <div className="border-r border-[#E2E8F0] pr-3">
              <span className="block font-sans text-[10px] uppercase font-bold text-[#64748B] mb-1">
                Unreserved Surplus
              </span>
              <div className="font-mono text-base font-bold text-[#0F172A]">
                {formatUSD(burn_allocation.sweepable_surplus_usd)}
              </div>
              <span className="font-sans text-[10px] text-[#64748B]">Eligible to Sweep</span>
            </div>

            <div className="border-r border-[#E2E8F0] pr-3">
              <span className="block font-sans text-[10px] uppercase font-bold text-[#64748B] mb-1">
                FEMA Retention
              </span>
              <div className="font-mono text-base font-bold text-[#059669]">
                100% Retained
              </div>
              <span className="font-sans text-[10px] text-[#64748B]">Zero Forced Conversion</span>
            </div>

            <div>
              <span className="block font-sans text-[10px] uppercase font-bold text-[#64748B] mb-1">
                Yield Advantage
              </span>
              <div className="font-mono text-base font-bold text-[#059669]">
                +{fee_leakage_audit.effective_margin_gain_pct}%
              </div>
              <span className="font-sans text-[10px] text-[#64748B]">vs Traditional Banks</span>
            </div>
          </div>
        </div>

        {/* RIGHT INSET LEDGER (35% width / lg:col-span-4) */}
        <div className="lg:col-span-4 bg-[#FFFFFF] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0]">
              <span className="font-sans text-xs uppercase font-bold text-[#64748B] tracking-wider">
                Multi-Currency Asset Ledger
              </span>
              <span className="font-sans text-[11px] font-semibold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                4 Active Ledgers
              </span>
            </div>

            {/* High-density Tabular Rows with 4px Horizontal Shift and Hover Accent Reveal */}
            <div className="divide-y divide-[#E2E8F0] text-xs pt-1">
              {ledgerRows.map((row, idx) => (
                <motion.div
                  key={row.id}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  onMouseEnter={() => setHoveredLedgerIndex(idx)}
                  onMouseLeave={() => setHoveredLedgerIndex(null)}
                  className={`py-3 px-3 -mx-2 rounded transition-colors duration-150 border-l-2 cursor-default flex items-center justify-between ${
                    hoveredLedgerIndex === idx
                      ? 'bg-[#F8FAFC]'
                      : 'bg-transparent border-l-transparent'
                  }`}
                  style={{
                    borderLeftColor: hoveredLedgerIndex === idx ? row.borderAccent : 'transparent',
                  }}
                >
                  <div>
                    <div className="flex items-center gap-1.5 text-[#0F172A] font-sans font-semibold">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: row.color }}
                      />
                      <span>{row.label}</span>
                    </div>
                    <span className="font-sans text-[10px] text-[#64748B] pl-3 block">
                      {row.sublabel}
                    </span>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-mono text-sm font-semibold tabular-nums ${
                        row.isPositive ? 'text-[#059669]' : 'text-[#0F172A]'
                      }`}
                    >
                      {row.amount}
                    </div>
                    <span
                      className={`font-sans text-[10px] font-medium ${
                        row.isPositive ? 'text-[#059669]' : 'text-[#64748B]'
                      }`}
                    >
                      {row.detail}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="pt-3.5 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
            <span className="font-sans">
              Apex Wholesale Spread: <span className="font-mono font-semibold text-[#0F172A]">0.15%</span>
            </span>
            <span className="font-sans">
              Bank Margin: <span className="font-mono font-semibold text-[#DC2626]">3.80%</span>
            </span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
