import { useState } from 'react';
import { ShieldCheck, Scales, CheckCircle, Lightning } from '@phosphor-icons/react';
import { Card } from '../ui/Card';
import { StatusCue } from '../ui/Badge';
import { CountdownRing } from './CountdownRing';
import type { TreasuryOverview, SweepResult } from '../../types/treasury';
import { formatUSD, formatINR } from '../../lib/utils';

interface SweepControllerProps {
  overview: TreasuryOverview | null;
  onExecuteSweep: () => Promise<SweepResult | null>;
  isSweeping: boolean;
}

export function SweepController({ overview, onExecuteSweep, isSweeping }: SweepControllerProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lastSweepResult, setLastSweepResult] = useState<SweepResult | null>(null);

  if (!overview) return null;

  const { burn_allocation, compliance, fee_leakage_audit } = overview;
  const sweepable = burn_allocation.sweepable_surplus_usd;
  const midMarket = fee_leakage_audit.mid_market_rate;
  const bankPenalized = fee_leakage_audit.bank_penalized_rate;

  const estimatedInr = sweepable * (midMarket * 0.9985); // 0.15% institutional execution
  const bankInr = sweepable * bankPenalized;
  const estimatedSavingsInr = estimatedInr - bankInr;

  const handleSweepConfirm = async () => {
    setShowConfirmModal(false);
    const result = await onExecuteSweep();
    if (result) {
      setLastSweepResult(result);
      setTimeout(() => setLastSweepResult(null), 8000);
    }
  };

  return (
    <Card className="p-5 sm:p-6 bg-[#FFFFFF] border border-[#E2E8F0] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        {/* Left: RBI FEMA/EEFC Statutory Liquidation Status */}
        <div className="flex items-center gap-4">
          <CountdownRing daysRemaining={compliance.days_remaining_to_sweep} />
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="font-sans font-bold text-sm text-[#0F172A] tracking-tight">
                {compliance.framework}
              </span>
              <StatusCue variant={compliance.status === 'COMPLIANT' ? 'active' : 'warning'}>
                {compliance.status}
              </StatusCue>
            </div>
            <p className="text-xs text-[#64748B] mb-1 font-sans">
              Statutory Purpose Code: <span className="font-mono font-medium text-[#0F172A]">{compliance.statutory_purpose_code}</span>
            </p>
            <p className="text-[11px] font-sans text-[#64748B]">
              Liquidation Deadline: <span className="font-mono text-[#0F172A] font-semibold">{compliance.fema_sweep_deadline}</span> (End of following calendar month)
            </p>
          </div>
        </div>

        {/* Center: Interbank vs Traditional Bank Spread Comparison */}
        <div className="w-full lg:w-auto bg-[#F8FAFC] rounded-md p-3.5 border border-[#E2E8F0] flex flex-col sm:flex-row items-center gap-5">
          <div className="text-xs">
            <span className="font-sans text-[#64748B] block text-[10px] uppercase font-semibold tracking-wider">Apex Interbank Mid-Market</span>
            <span className="font-mono text-sm font-bold text-[#0F172A]">₹{midMarket.toFixed(4)}</span>
            <span className="font-sans text-[10px] text-[#059669] block font-medium"><span className="font-mono">0.15%</span> institutional tick</span>
          </div>

          <div className="text-xs text-[#CBD5E1] font-mono hidden sm:block">/</div>

          <div className="text-xs">
            <span className="font-sans text-[#64748B] block text-[10px] uppercase font-semibold tracking-wider">Traditional Bank Quote</span>
            <span className="font-mono text-sm font-semibold text-[#DC2626]">₹{bankPenalized.toFixed(2)}</span>
            <span className="font-sans text-[10px] text-[#DC2626] block font-medium"><span className="font-mono">3.80%</span> legacy markup</span>
          </div>
        </div>

        {/* Right: Liquidity Conversion Execution */}
        <div className="w-full lg:w-auto flex flex-col items-stretch lg:items-end gap-2">
          <div className="flex items-center justify-between lg:justify-end gap-3 text-xs">
            <span className="text-[#64748B] font-sans font-semibold uppercase tracking-wider text-[10px]">Unreserved Surplus:</span>
            <span className="font-mono font-bold text-sm text-[#0F172A]">
              {formatUSD(sweepable)}
            </span>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isSweeping || sweepable <= 0}
            className={`px-4 py-2 rounded-md font-sans text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              sweepable > 0 && !isSweeping
                ? 'bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] shadow-xs active:scale-[0.98]'
                : 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed border border-[#E2E8F0]'
            }`}
          >
            <Lightning size={14} weight="fill" className={isSweeping ? 'animate-spin' : ''} />
            <span>{isSweeping ? 'Settling Ledger...' : 'Execute Batch Sweep'}</span>
          </button>

          {/* Clean Un-Glowed Slippage Guard Badge */}
          <div className="flex items-center gap-1.5 text-[11px] font-sans text-[#64748B] justify-center lg:justify-end">
            <ShieldCheck size={14} className="text-[#059669]" />
            <span>Slippage Guard Active: Execution locks within <span className="font-mono font-medium text-[#0F172A]">±0.15%</span> of interbank tick rate.</span>
          </div>
        </div>
      </div>

      {/* Settlement Result Alert */}
      {lastSweepResult && (
        <div className="mt-4 p-3.5 rounded-md bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between text-xs font-sans text-[#059669]">
          <div className="flex items-center gap-2">
            <CheckCircle size={15} weight="fill" />
            <span>
              Batch settled: <span className="font-mono font-semibold">${lastSweepResult.swept_usd.toFixed(2)}</span> converted to <span className="font-mono font-semibold">₹{lastSweepResult.credited_inr.toLocaleString()}</span> at <span className="font-mono font-semibold">₹{lastSweepResult.realized_rate.toFixed(4)}</span>. Avoided <span className="font-mono font-semibold">₹{lastSweepResult.traditional_bank_loss_avoided_inr.toLocaleString()}</span> in legacy bank fees.
            </span>
          </div>
          <StatusCue variant="active">Settled</StatusCue>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-[#0F172A]">
              <Scales size={18} className="text-[#059669]" />
              <h4 className="font-sans font-bold text-base tracking-tight">Confirm Institutional Settlement Sweep</h4>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed font-sans">
              ApexTreasury will execute a zero-markup wholesale conversion for unreserved foreign proceeds. Your 30-day cloud opex remains 100% ring-fenced.
            </p>

            <div className="bg-[#F8FAFC] rounded-md p-3.5 border border-[#E2E8F0] space-y-2 text-xs">
              <div className="flex justify-between text-[#64748B]">
                <span className="font-sans">Surplus Amount:</span>
                <span className="font-mono text-[#0F172A] font-semibold">{formatUSD(sweepable)}</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span className="font-sans">Live Interbank Rate:</span>
                <span className="font-mono text-[#0F172A] font-medium">₹{midMarket.toFixed(4)} / USD</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span className="font-sans">Est. Domestic Credit:</span>
                <span className="font-mono text-[#0F172A] font-bold">{formatINR(estimatedInr)}</span>
              </div>
              <div className="flex justify-between text-[#059669] pt-2 border-t border-[#E2E8F0]">
                <span className="font-sans font-medium">Avoided Legacy Fee:</span>
                <span className="font-mono font-bold">+{formatINR(estimatedSavingsInr)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-sans text-[#64748B] bg-[#F1F5F9] p-2.5 rounded border border-[#E2E8F0]">
              <ShieldCheck size={15} className="text-[#059669]" />
              <span>Slippage Guard active: Lock guaranteed within <span className="font-mono font-medium">±0.15%</span> of interbank tick.</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-1.5 rounded text-xs font-sans font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSweepConfirm}
                className="px-4 py-1.5 rounded bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] font-sans text-xs font-semibold shadow-xs active:scale-[0.98] transition-all"
              >
                Authorize Sweep
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
