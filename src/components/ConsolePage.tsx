import { useState, useEffect, useCallback } from 'react';
import { HeaderTicker } from './layout/HeaderTicker';
import { KPIBar } from './kpi/KPIBar';
import { BurnForecastChart } from './charts/BurnForecastChart';
import { GatewayMatrix } from './gateways/GatewayMatrix';
import { SweepController } from './regulatory/SweepController';
import { ActivityFeed } from './activity/ActivityFeed';
import { OperationsBar } from './layout/OperationsBar';
import { supabase, type LiveSettlementRecord } from '../lib/supabase';
import {
  getTreasuryOverview,
  getBurnForecast,
  getActivityFeed,
  recordInflow,
  executeSweep,
  refreshFxRate,
} from '../services/api';
import type {
  TreasuryOverview,
  BurnForecast,
  ActivityItem,
  InflowPayload,
  SweepResult,
} from '../types/treasury';

interface ConsolePageProps {
  onNavigate: (route: string) => void;
}

export default function ConsolePage({ onNavigate }: ConsolePageProps) {
  // 1. Supabase User Profile & Settlement State
  const [userProfile, setUserProfile] = useState<{
    full_name: string;
    email: string;
    company_name: string;
    tier: string;
  } | null>(null);

  const [, setUserSettlements] = useState<LiveSettlementRecord[]>([]);

  // 2. Existing Console Operational State
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

  // 3. Supabase Auth & Profile Loader
  useEffect(() => {
    const loadUserData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // Default preview profile for instant demonstration
        setUserProfile({
          full_name: 'Ayush Singh Chauhan',
          email: 'ayush@pacificlabs.com',
          company_name: 'Apex Treasury Core HQ',
          tier: 'SOVEREIGN ENTERPRISE ROUTER',
        });
        return;
      }

      // Load profile (Ayush, Hriday, Khush, or Jitesh)
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      } else {
        setUserProfile({
          full_name: session.user.user_metadata?.full_name || 'Ayush Singh Chauhan',
          email: session.user.email || 'ayush@pacificlabs.com',
          company_name: session.user.user_metadata?.company_name || 'Apex Treasury Core HQ',
          tier: 'SOVEREIGN ENTERPRISE ROUTER',
        });
      }

      // Load user-specific settlements
      const { data: settlements } = await supabase
        .from('settlements')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (settlements && settlements.length > 0) {
        setUserSettlements(settlements as LiveSettlementRecord[]);
      }
    };

    loadUserData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onNavigate('/');
  };

  // 4. Central Data Synchronization from Backend Engine
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

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F8FAFC] text-[#0F172A] pb-24 selection:bg-[#059669]/15 selection:text-[#059669]">
      {/* 1. Header with live interbank rate ticker strip and sync controls */}
      <HeaderTicker
        fxMeta={overview?.fx_meta || null}
        onRefresh={handleRefreshFx}
        isRefreshing={isRefreshing}
        onBackToLanding={() => onNavigate('/')}
        userProfile={userProfile}
        onSignOut={handleSignOut}
      />

      {/* Main Console Route */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Dynamic User Profile Identity Banner */}
        <div className="bg-white border border-slate-200/80 rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-950 flex items-center justify-center text-white font-mono font-bold text-xs shadow-xs">
              {userProfile?.full_name ? userProfile.full_name.slice(0, 2).toUpperCase() : 'AP'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-950">
                  {userProfile?.full_name || 'Ayush Singh Chauhan'}
                </span>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded font-semibold">
                  {userProfile?.tier || 'SOVEREIGN ENTERPRISE ROUTER'}
                </span>
              </div>
              <span className="text-xs text-slate-500 font-sans">
                {userProfile?.company_name || 'Apex Treasury Core HQ'} • {userProfile?.email || 'ayush@pacificlabs.com'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-700 font-semibold">T+0 ENGINE ONLINE</span>
          </div>
        </div>

        {/* Connection Notice */}
        {errorMessage && (
          <div className="p-3.5 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-xs font-sans text-[#DC2626] flex items-center justify-between shadow-2xs">
            <div>
              <span className="font-bold">Backend Connection Alert:</span> {errorMessage}
            </div>
            <button
              onClick={() => loadData(true)}
              className="px-2.5 py-1 bg-[#FFFFFF] hover:bg-[#FEE2E2] border border-[#FECACA] rounded text-[#DC2626] font-semibold cursor-pointer"
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
