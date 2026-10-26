import { useState, useEffect, useCallback } from 'react';
import { HeaderTicker } from './components/layout/HeaderTicker';
import { KPIBar } from './components/kpi/KPIBar';
import { BurnForecastChart } from './components/charts/BurnForecastChart';
import { GatewayMatrix } from './components/gateways/GatewayMatrix';
import { SweepController } from './components/regulatory/SweepController';
import { ActivityFeed } from './components/activity/ActivityFeed';
import { OperationsBar } from './components/layout/OperationsBar';
import { MarketingHero } from './components/marketing/MarketingHero';
import {
  getTreasuryOverview,
  getBurnForecast,
  getActivityFeed,
  recordInflow,
  executeSweep,
  refreshFxRate,
} from './services/api';
import type {
  TreasuryOverview,
  BurnForecast,
  ActivityItem,
  InflowPayload,
  SweepResult,
} from './types/treasury';

export default function App() {
  const [view, setView] = useState<'hero' | 'console'>('hero');
  const [overview, setOverview] = useState<TreasuryOverview | null>(null);
  const [forecast, setForecast] = useState<BurnForecast | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Central data synchronization
  const loadData = useCallback(async (triggerHighlight: boolean = false) => {
    try {
      setErrorMessage(null);
      const [overviewData, forecastData, activityData] = await Promise.all([
        getTreasuryOverview(),
        getBurnForecast(),
        getActivityFeed(),
      ]);

      setOverview(overviewData);
      setForecast(forecastData);
      setActivity(activityData.activity);

      if (triggerHighlight) {
        setIsRecalculating(true);
        setTimeout(() => setIsRecalculating(false), 800);
      }
    } catch (err: any) {
      console.error('API load error:', err);
      setErrorMessage(err.message || 'Failed to sync with ApexTreasury backend engine.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and 60s background sync
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  // On-demand FX Refresh
  const handleRefreshFx = async () => {
    setIsRefreshing(true);
    try {
      await refreshFxRate();
      await loadData(true);
      showToast('Live FX exchange rate resynced from Twelve Data feed.');
    } catch (err: any) {
      showToast(`FX refresh failed: ${err.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle Inflow
  const handleRecordInflow = async (payload: InflowPayload): Promise<boolean> => {
    try {
      await recordInflow(payload);
      showToast(`Ledger updated: Ingested $${payload.amount.toLocaleString()} from ${payload.source} into EEFC.`);
      await loadData(true);
      return true;
    } catch (err: any) {
      showToast(`Inflow failed: ${err.message}`);
      return false;
    }
  };

  // Handle Sweep
  const handleExecuteSweep = async (): Promise<SweepResult | null> => {
    if (!overview || overview.burn_allocation.sweepable_surplus_usd <= 0) {
      showToast('No sweepable surplus available. All funds are ring-fenced for SaaS opex.');
      return null;
    }

    setIsSweeping(true);
    try {
      const result = await executeSweep();
      showToast(`Settled $${result.swept_usd.toFixed(2)} to ₹${result.credited_inr.toLocaleString()} at live rate ₹${result.realized_rate.toFixed(4)}.`);
      await loadData(true);
      return result;
    } catch (err: any) {
      showToast(`Sweep failed: ${err.message}`);
      return null;
    } finally {
      setIsSweeping(false);
    }
  };

  if (view === 'hero') {
    return (
      <MarketingHero
        onLaunchConsole={() => setView('console')}
        onResetToLanding={() => setView('hero')}
        fxRate={overview?.fx_meta.rate || 94.9062}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F8FAFC] text-[#0F172A] pb-24 selection:bg-[#059669]/15 selection:text-[#059669]">
      {/* 1. Header with live interbank rate ticker strip and sync controls */}
      <HeaderTicker
        fxMeta={overview?.fx_meta || null}
        onRefresh={handleRefreshFx}
        isRefreshing={isRefreshing}
        onBackToLanding={() => setView('hero')}
      />

      {/* Main Console Route */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Connection Notice */}
        {errorMessage && (
          <div className="p-3.5 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-xs font-sans text-[#DC2626] flex items-center justify-between shadow-2xs">
            <div>
              <span className="font-bold">Backend Connection Alert:</span> {errorMessage}
            </div>
            <button
              onClick={() => loadData(true)}
              className="px-2.5 py-1 bg-[#FFFFFF] hover:bg-[#FEE2E2] border border-[#FECACA] rounded text-[#DC2626] font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* 2. Asymmetric Institutional Treasury Ledger (7-col PayPal hero + 5-col Cashfree breakdown) */}
        <KPIBar
          overview={overview}
          isRecalculating={isRecalculating}
        />

        {/* 3. RBI FEMA/EEFC Statutory Liquidation Status Card */}
        <SweepController
          overview={overview}
          onExecuteSweep={handleExecuteSweep}
          isSweeping={isSweeping}
        />

        {/* 4. 30-Day Automated Burn Projection Curve Panel */}
        <BurnForecastChart forecast={forecast} />

        {/* 5. Revenue Conduit & Multi-Currency Gateways */}
        <GatewayMatrix />

        {/* 6. Activity & Ledger Compliance Audit Trail */}
        <ActivityFeed items={activity} isLoading={isLoading} />
      </main>

      {/* 7. Bottom Floating Console Action Dock */}
      <OperationsBar
        onRecordInflow={handleRecordInflow}
        onRecompute={() => loadData(true)}
        onExecuteSweep={handleExecuteSweep}
        isOperating={isLoading || isRefreshing || isSweeping}
        sweepableSurplus={overview?.burn_allocation.sweepable_surplus_usd || 0}
      />

      {/* Clean Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 max-w-sm bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A] text-xs font-sans px-4 py-3 rounded-md shadow-lg flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#059669] shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
