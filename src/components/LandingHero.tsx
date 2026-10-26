import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  FileText,
  ShieldCheck,
  X,
} from '@phosphor-icons/react';
import CurrencyGlobeHero from './CurrencyGlobeHero';
import AuthModal from './AuthModal';
import { supabase } from '../lib/supabase';
import { useTreasuryRealtime } from '../hooks/useTreasuryRealtime';

interface LandingHeroProps {
  onLaunchConsole?: () => void;
  onResetToLanding?: () => void;
  fxRate?: number;
}

export default function LandingHero({
  onLaunchConsole = () => { },
  onResetToLanding,
  fxRate = 94.9062,
}: LandingHeroProps) {
  const [femaModalOpen, setFemaModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const { connectionState } = useTreasuryRealtime();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
  };

  const handleLogoClick = () => {
    if (onResetToLanding) {
      onResetToLanding();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#FAFCFB] text-[#0F172A] selection:bg-[#059669]/15 selection:text-[#059669] flex flex-col justify-between overflow-hidden">
      {/* Subtle ambient mint background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(5,150,105,0.06),transparent_70%)] pointer-events-none" />

      {/* 1. Single-Line Navigation Bar (Height: 64px <= 80px) */}
      <header className="relative z-30 w-full border-b border-[#E2E8F0]/80 bg-[#FFFFFF]/80 backdrop-blur-md px-4 sm:px-8 h-16 flex items-center">
        <div className="max-w-[1400px] w-full mx-auto flex items-center justify-between">
          {/* Brand & Pacific Console Badge with root reset click */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
            title="ApexTreasury Home"
          >
            <div className="w-8 h-8 rounded-md bg-[#0F172A] flex items-center justify-center text-white shadow-xs group-hover:bg-[#1E293B] transition-colors">
              <span className="font-sans font-bold text-xs tracking-tight">AP</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-sans font-bold text-base tracking-tight text-[#0F172A] group-hover:text-emerald-700 transition-colors">
                ApexTreasury
              </span>
              <span className="text-[10px] font-sans font-semibold uppercase text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                Pacific Console
              </span>
            </div>
          </button>

          {/* Center Trust Anchor: Live Rate Indicator & Postgres Stream Indicator */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-[#FFFFFF] border border-[#E2E8F0] px-3.5 py-1.5 rounded-full text-xs shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
              <span className="font-sans text-[#64748B] text-[11px]">Interbank Mid-Market:</span>
              <span className="font-mono font-bold text-[#0F172A]">USD/INR ₹{fxRate.toFixed(4)}</span>
              <span className="text-[10px] font-sans font-semibold text-[#059669] bg-[#D1FAE5] px-1.5 py-0.2 rounded">
                0.15% Tick
              </span>
            </div>

            {/* Supabase Live Realtime Database Indicator */}
            {connectionState === 'connected' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200/90 bg-emerald-50/80 text-[11px] font-mono text-emerald-800 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold">Supabase Live</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-[11px] font-mono text-slate-500 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>Simulated Feed</span>
              </div>
            )}
          </div>

          {/* Header Action Pills: Auth + Console Launch */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setFemaModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 text-xs font-sans font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
              <FileText size={14} />
              <span>RBI Guidelines</span>
            </button>

            {userEmail ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 max-w-[170px] truncate">
                  {userEmail}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-950 px-2 py-1 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => {
                    setAuthModalMode('signin');
                    setAuthModalOpen(true);
                  }}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-950 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthModalMode('signup');
                    setAuthModalOpen(true);
                  }}
                  className="bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-sm transition-all active:scale-[0.98]"
                >
                  Open Account
                </button>
              </div>
            )}

            <button
              onClick={onLaunchConsole}
              className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-sans font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
            >
              <span>Launch Console</span>
              <ArrowRight size={12} weight="bold" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Primary Public Hero Content Stage */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-8 pb-3 flex flex-col items-center text-center">
        {/* Eyebrow Label (Max 1) */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-900/10 bg-emerald-50 text-emerald-800 text-xs font-semibold mb-4 shadow-2xs"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          <span className="font-sans text-[11px] font-bold uppercase tracking-wider">
            AUTONOMOUS CROSS-BORDER FX LIQUIDITY
          </span>
        </motion.div>

        {/* Authoritative 2-Line Headline (H1): Preserving exact font-display extended look */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="w-full max-w-6xl mx-auto font-extrabold font-display tracking-tight text-slate-950 text-3xl sm:text-4xl md:text-5xl lg:text-[54px] xl:text-[58px] leading-[1.12] text-center"
        >
          <span className="block">
            Collect in Foreign Currencies.
          </span>
          <span className="block mt-1 sm:mt-2">
            Settle with Zero Spread.
          </span>
        </motion.h1>

        {/* The 3D Halftone Vector Earth & Dynamic Particle Engine */}
        <CurrencyGlobeHero />

        {/* Dual CTAs: High-contrast dark pill + crisp white doc button */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mt-2 mb-8 pointer-events-auto"
        >
          <button
            onClick={onLaunchConsole}
            className="w-full sm:w-auto bg-slate-950 hover:bg-slate-800 text-white font-medium px-8 py-3.5 rounded-full shadow-sm transition-all pointer-events-auto flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span>Launch Console</span>
            <ArrowRight size={15} weight="bold" />
          </button>

          <button
            onClick={() => setFemaModalOpen(true)}
            className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium px-7 py-3.5 rounded-full shadow-sm transition-all pointer-events-auto flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <FileText size={16} className="text-slate-500" />
            <span>FEMA P0802 Compliance Docs</span>
          </button>
        </motion.div>
      </main>

      {/* 3. Minimal Trust Bar */}
      <footer className="relative z-10 w-full border-t border-[#E2E8F0] bg-[#FFFFFF] py-4 px-4 sm:px-8">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-[#64748B] font-sans">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#059669]" />
            <span>ApexTreasury by Team Pacific</span>
            <span className="text-[#CBD5E1]">•</span>
            <span>Foreign Exchange Management Act Compliant</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Statutory EEFC Scheme</span>
            <span>Sub-Tick FX Routing</span>
            <span>Supabase Connected</span>
          </div>
        </div>
      </footer>

      {/* Supabase Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(email) => {
          setUserEmail(email);
        }}
      />

      {/* FEMA Compliance Documentation Modal */}
      {femaModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl max-w-lg w-full p-6 shadow-xl relative text-left">
            <button
              onClick={() => setFemaModalOpen(false)}
              className="absolute top-4 right-4 text-[#64748B] hover:text-[#0F172A] p-1"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2.5 mb-2 text-[#0F172A]">
              <ShieldCheck size={20} className="text-[#1E40AF]" weight="bold" />
              <h3 className="font-sans font-bold text-base tracking-tight">
                RBI FEMA EEFC Statutory Compliance
              </h3>
            </div>

            <p className="text-xs font-sans text-[#64748B] mb-4 leading-relaxed">
              Under RBI Master Direction No. 5 (Section 5 of Foreign Exchange Management Act 1999), 100% of foreign currency earnings can be retained in Exchange Earner Foreign Currency accounts.
            </p>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 space-y-2 text-xs font-sans mb-4">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Statutory Purpose Code:</span>
                <span className="font-mono font-bold text-[#0F172A]">P0802 (Software & Tech Services)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Permissible EEFC Retention:</span>
                <span className="font-mono font-bold text-[#059669]">100% (Zero Mandatory Conversion)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">SaaS Expense Settlement:</span>
                <span className="font-mono font-bold text-[#0F172A]">Direct USD settlement from EEFC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Double Spread Elimination:</span>
                <span className="font-mono font-bold text-[#059669]">Saved ~3.8% on AWS and OpenAI</span>
              </div>
            </div>

            <button
              onClick={() => {
                setFemaModalOpen(false);
                onLaunchConsole();
              }}
              className="w-full py-2.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-[#FFFFFF] text-xs font-sans font-semibold flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <span>Explore In Treasury Console</span>
              <ArrowRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { LandingHero as MarketingHero };
