import { useState } from 'react';
import { ArrowsClockwise, ShieldCheck } from '@phosphor-icons/react';
import type { FxMetadata } from '../../types/treasury';
import { formatTimeAgo } from '../../lib/utils';
import { StatusCue } from '../ui/Badge';

interface HeaderTickerProps {
  fxMeta: FxMetadata | null;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  onBackToLanding?: () => void;
}

export function HeaderTicker({ fxMeta, onRefresh, isRefreshing, onBackToLanding }: HeaderTickerProps) {
  const [justRefreshed, setJustRefreshed] = useState(false);

  const handleRefreshClick = async () => {
    if (isRefreshing) return;
    await onRefresh();
    setJustRefreshed(true);
    setTimeout(() => setJustRefreshed(false), 2000);
  };

  const rateDisplay = fxMeta ? fxMeta.rate.toFixed(4) : '94.9595';
  const timeAgoDisplay = fxMeta ? formatTimeAgo(fxMeta.seconds_ago) : 'Live';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E2E8F0] bg-[#FFFFFF] px-4 sm:px-6 py-2.5 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
      <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand & Console Identity */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            title="Return to Landing Page"
          >
            <div className="w-8 h-8 rounded-md bg-[#0F172A] flex items-center justify-center text-white shadow-xs group-hover:bg-[#1E293B] transition-colors">
              <span className="font-sans font-bold text-xs tracking-tight">AP</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-sm tracking-tight text-[#0F172A] group-hover:text-emerald-700 transition-colors">
                  ApexTreasury
                </span>
                <span className="text-[10px] font-sans font-semibold uppercase text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                  Pacific Console
                </span>
              </div>
              <p className="text-[10px] font-sans text-[#64748B] hidden md:block">
                Autonomous Cross-Border FX Liquidity & Ledger Engine
              </p>
            </div>
          </button>

          {/* Mobile Refresh */}
          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            aria-label="Refresh FX rate"
            className="sm:hidden p-1.5 rounded border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            <ArrowsClockwise size={14} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Cashfree Reference DNA: Clean Interbank Rate Ticker Strip with Pulse Ping */}
        <div className={`flex items-center gap-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md px-3.5 py-1.5 transition-all ${justRefreshed ? 'tick-pulse border-[#059669]' : ''}`}>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669] shrink-0" />
            <span className="font-sans font-medium text-[#64748B] text-[11px]">USD / INR</span>
            <span className="font-mono text-[#0F172A] font-semibold text-sm">₹{rateDisplay}</span>
          </div>

          <div className="h-3 w-[1px] bg-[#E2E8F0]" />

          <div className="flex items-center gap-2 text-[11px] text-[#64748B] font-sans">
            <span className="hidden md:inline font-medium">Interbank Mid-Market</span>
            <span className="text-[#CBD5E1]">•</span>
            <span className="font-mono text-[#64748B]">{timeAgoDisplay}</span>
          </div>

          <div className="h-3 w-[1px] bg-[#E2E8F0]" />

          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            title="Sync tick from Twelve Data"
            className="flex items-center gap-1 text-[11px] font-sans font-medium text-[#64748B] hover:text-[#0F172A] transition-colors p-0.5"
          >
            <ArrowsClockwise
              size={13}
              className={`transition-transform duration-500 ${isRefreshing ? 'animate-spin text-[#0F172A]' : ''}`}
            />
            {justRefreshed ? (
              <span className="text-[10px] text-[#059669] font-medium">Synced</span>
            ) : (
              <span className="hidden lg:inline text-[10px]">Sync</span>
            )}
          </button>
        </div>

        {/* Enterprise Regulatory & Live Feed Cues */}
        <div className="hidden lg:flex items-center gap-3 text-xs font-sans">
          <div className="flex items-center gap-1.5 text-[#64748B] text-[11px] font-medium">
            <ShieldCheck size={14} className="text-[#1E40AF]" />
            <span>FEMA P0802 Active</span>
          </div>
          <StatusCue variant="active">
            Twelve Data Live Feed
          </StatusCue>
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="px-2.5 py-1 rounded bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-semibold text-[11px] border border-[#E2E8F0] transition-colors"
            >
              Public Hero
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
