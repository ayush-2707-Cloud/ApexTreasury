import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface SignupPageProps {
  onNavigate: (route: string) => void;
}

export default function SignupPage({ onNavigate }: SignupPageProps) {
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [jurisdiction, setJurisdiction] = useState('US_DELAWARE');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName,
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create user profile row in Supabase
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: email,
        full_name: fullName,
        company_name: companyName,
        tier: 'ENTERPRISE ROUTER',
        eefc_account_status: 'ACTIVE',
      });
      onNavigate('/console');
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#FAFCFB] text-slate-900 flex flex-col justify-between selection:bg-emerald-100">
      <header className="w-full border-b border-slate-200/80 bg-white/70 backdrop-blur-md px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors group cursor-pointer"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          <span>Back to ApexTreasury</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden sm:inline">Already registered?</span>
          <button
            onClick={() => onNavigate('/login')}
            className="text-xs font-semibold text-slate-800 hover:text-slate-950 border border-slate-200 bg-white px-3 py-1.5 rounded-full cursor-pointer hover:bg-slate-50 transition-colors"
          >
            Sign In
          </button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-[0_20px_45px_-12px_rgba(15,23,42,0.08)]">
          <div className="mb-7">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10px] font-mono font-semibold uppercase mb-3">
              Institutional Onboarding
            </div>
            <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
              Open Corporate Treasury Account
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-sans">
              Automate multi-currency inward receivables directly into zero-spread INR settlements and EEFC reserve buffers.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200/90 text-rose-700 text-xs font-mono leading-relaxed">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Authorized Signatory Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ayush Singh"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Legal Entity / Company
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Pacific Labs Inc."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Primary Jurisdiction
                </label>
                <select
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                >
                  <option value="US_DELAWARE">United States (Delaware)</option>
                  <option value="SG">Singapore (ACRA)</option>
                  <option value="UK">United Kingdom (Companies House)</option>
                  <option value="IN_DOMESTIC">India (MCA / Exporter)</option>
                  <option value="EU_ESTONIA">European Union (Estonia)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Settlement Tier
                </label>
                <div className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 text-xs font-mono flex items-center justify-between">
                  <span>ENTERPRISE T+0</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">0.00% SPREAD</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Master Security Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Create Institutional Entity →'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 font-sans">
            By registering, your organization complies with statutory FEMA P0802 purpose code reporting and DigiLocker verification protocols.
          </div>
        </div>
      </main>

      <footer className="w-full py-4 px-6 border-t border-slate-100 text-center text-[11px] font-mono text-slate-400">
        ApexTreasury Sovereign Ledger Engine // Institutional Compliance
      </footer>
    </div>
  );
}
