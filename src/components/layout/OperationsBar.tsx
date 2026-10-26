import { useState } from 'react';
import { PlusCircle, ArrowsClockwise, Lightning, X, ShieldCheck } from '@phosphor-icons/react';
import type { InflowPayload, SweepResult } from '../../types/treasury';

interface OperationsBarProps {
  onRecordInflow: (payload: InflowPayload) => Promise<boolean>;
  onRecompute: () => Promise<void>;
  onExecuteSweep: () => Promise<SweepResult | null>;
  isOperating: boolean;
  sweepableSurplus: number;
}

export function OperationsBar({
  onRecordInflow,
  onRecompute,
  onExecuteSweep,
  isOperating,
  sweepableSurplus,
}: OperationsBarProps) {
  const [inflowModalOpen, setInflowModalOpen] = useState(false);
  const [source, setSource] = useState('Stripe');
  const [amount, setAmount] = useState('2500');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInflowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    setIsSubmitting(true);
    const success = await onRecordInflow({
      source,
      amount: val,
      currency: 'USD',
    });
    setIsSubmitting(false);
    if (success) {
      setInflowModalOpen(false);
      setAmount('');
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#FFFFFF] border-t border-[#E2E8F0] py-2.5 px-4 sm:px-6 shadow-[0_-2px_6px_0_rgba(0,0,0,0.03)]">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#059669]" />
            <span className="font-sans text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Apex Live Ledger Console
            </span>
            <span className="text-[11px] font-sans text-[#64748B] hidden md:inline">
              / Institutional Control
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Record Inflow */}
            <button
              onClick={() => setInflowModalOpen(true)}
              disabled={isOperating}
              className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-md bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] text-xs font-sans font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-[0.98]"
            >
              <PlusCircle size={14} className="text-[#64748B]" />
              <span>Record Inflow</span>
            </button>

            {/* Recompute Allocation */}
            <button
              onClick={onRecompute}
              disabled={isOperating}
              className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-md bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] text-xs font-sans font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-[0.98]"
            >
              <ArrowsClockwise size={14} className={`text-[#059669] ${isOperating ? 'animate-spin' : ''}`} />
              <span>Recompute Allocation</span>
            </button>

            {/* Execute Sweep */}
            <button
              onClick={() => onExecuteSweep()}
              disabled={isOperating || sweepableSurplus <= 0}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-sans font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                sweepableSurplus > 0 && !isOperating
                  ? 'bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] active:scale-[0.98]'
                  : 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed border border-[#E2E8F0]'
              }`}
            >
              <Lightning size={14} weight="fill" />
              <span>Execute Sweep</span>
            </button>
          </div>
        </div>
      </div>

      {/* Record Inflow Modal */}
      {inflowModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg max-w-md w-full p-6 shadow-xl relative">
            <button
              onClick={() => setInflowModalOpen(false)}
              className="absolute top-4 right-4 text-[#64748B] hover:text-[#0F172A]"
            >
              <X size={16} />
            </button>

            <h4 className="font-sans font-bold text-base text-[#0F172A] mb-1 tracking-tight">
              Record Incoming Exporter Payout
            </h4>
            <p className="text-xs font-sans text-[#64748B] mb-4">
              Credits virtual EEFC USD ledger under statutory RBI purpose code P0802 with 100% FX retention.
            </p>

            <form onSubmit={handleInflowSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-sans font-semibold text-[#64748B] mb-1.5 uppercase tracking-wider">
                  Payout Gateway Source
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-sans text-[#0F172A] focus:outline-none focus:border-[#059669]"
                >
                  <option value="Stripe">Stripe Global Payout</option>
                  <option value="Lemon Squeezy">Lemon Squeezy MoR</option>
                  <option value="Apple App Store">Apple App Store Connect</option>
                  <option value="Direct Wire / Overseas Client">Direct Overseas Wire (USD)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-sans font-semibold text-[#64748B] mb-1.5 uppercase tracking-wider">
                  Gross Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[#64748B] font-mono text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="2500.00"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md pl-7 pr-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#059669]"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[11px] font-sans text-[#64748B] flex items-center gap-2">
                <ShieldCheck size={15} className="text-[#059669]" />
                <span>Auto-conduit active: Zero forced conversion into domestic currency.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInflowModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-md text-xs font-sans font-medium text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-md bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] font-sans text-xs font-semibold shadow-xs active:scale-[0.98] transition-all"
                >
                  {isSubmitting ? 'Posting Ledger...' : 'Post to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
