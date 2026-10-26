import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginPageProps {
  onNavigate: (route: string) => void;
}

interface DemoAccount {
  name: string;
  email: string;
  label: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { name: 'Ayush Singh Chauhan', email: 'ayush@pacificlabs.com', label: 'Ayush (Sovereign HQ)' },
  { name: 'Hriday Bardia', email: 'hriday@pacificlabs.com', label: 'Hriday (Global Trading)' },
  { name: 'Khush Salecha', email: 'khush@pacificlabs.com', label: 'Khush (Alpha Arbitrage)' },
  { name: 'Jitesh Reddy', email: 'jitesh@pacificlabs.com', label: 'Jitesh (Reddy Infra)' },
];

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (
    e?: React.FormEvent,
    targetEmail?: string,
    targetPass?: string,
    targetName?: string
  ) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const loginEmail = targetEmail || email;
    const loginPass = targetPass || password;

    // 1. Primary Auth Attempt: signInWithPassword
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPass,
    });

    if (!signInError) {
      onNavigate('/console');
      return;
    }

    // 2. Auto-Fallback / Schema-Safe Provisioning for instant demo verification
    const fallbackName =
      targetName ||
      DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === loginEmail.toLowerCase())?.name ||
      loginEmail.split('@')[0];

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: loginEmail,
      password: loginPass,
      options: {
        data: {
          full_name: fallbackName,
          company_name: 'Pacific Labs Inc.',
        },
      },
    });

    if (!signUpError) {
      if (signUpData?.user) {
        try {
          await supabase.from('profiles').upsert({
            id: signUpData.user.id,
            email: loginEmail,
            full_name: fallbackName,
            company_name: 'Pacific Labs Inc.',
            tier: 'ENTERPRISE ROUTER',
            eefc_account_status: 'ACTIVE',
          });
        } catch {
          // Schema-safe: proceed if profile write succeeds or table differs
        }
      }
      onNavigate('/console');
    } else {
      // Both sign-in and fallback failed
      setErrorMsg(signInError.message || signUpError.message);
      setLoading(false);
    }
  };

  const handleQuickDemo = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword('12345678');
    handleLogin(undefined, account.email, '12345678', account.name);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#FAFCFB] text-slate-900 flex flex-col justify-between selection:bg-emerald-100">
      {/* 1. Header Navigation */}
      <header className="w-full border-b border-slate-200/80 bg-white/70 backdrop-blur-md px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors group cursor-pointer"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          <span>Back to ApexTreasury</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-slate-950 flex items-center justify-center text-white font-mono font-bold text-[10px]">
            AP
          </div>
          <span className="text-xs font-mono text-slate-400">SECURE GATEWAY // PORT 443</span>
        </div>
      </header>

      {/* 2. Main Login Stage */}
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-[0_20px_45px_-12px_rgba(15,23,42,0.08)]">
          <div className="mb-7">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10px] font-mono font-semibold uppercase mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Institutional Authentication
            </div>
            <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
              Sign in to Console
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-sans">
              Enter your corporate credentials to access cross-border FX routing and EEFC sub-ledgers.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200/90 text-rose-700 text-xs font-mono leading-relaxed">
              {errorMsg}
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="treasury@pacificlabs.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <span className="text-[11px] font-mono text-slate-400">Default: 12345678</span>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Access Console →'
              )}
            </button>
          </form>

          {/* 3. One-Click Quick Demo Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
              QUICK TEST ACCOUNTS (CLICK TO AUTO-LOGIN)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickDemo(acc)}
                  className="text-left px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-emerald-50 hover:border-emerald-200 text-[11px] font-medium text-slate-700 hover:text-emerald-900 transition-colors truncate cursor-pointer"
                  title={`${acc.name} (${acc.email})`}
                >
                  ⚡ {acc.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Footer & Account Link */}
          <div className="mt-6 text-center">
            <span className="text-xs text-slate-500 font-sans">Need corporate treasury access? </span>
            <button
              onClick={() => onNavigate('/signup')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline ml-1 cursor-pointer"
            >
              Open an Account →
            </button>
          </div>
        </div>
      </main>

      <footer className="w-full py-4 px-6 border-t border-slate-100 text-center text-[11px] font-mono text-slate-400">
        RBI AP(DIR) Series Circular No. 27 Compliant // Encrypted Session Vault
      </footer>
    </div>
  );
}
