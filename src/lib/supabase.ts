import { createClient } from '@supabase/supabase-js';

declare const process: any;

const getEnv = (key: string): string | undefined => {
  try {
    if (typeof process !== 'undefined' && process && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch {
    // Ignore process lookup failure in strict browser sandboxes
  }

  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch {
    // Ignore import.meta lookup failure
  }

  return undefined;
};

const supabaseUrl =
  getEnv('NEXT_PUBLIC_SUPABASE_URL') ||
  getEnv('VITE_SUPABASE_URL') ||
  'https://wqpdbbfowwwhclktewnf.supabase.co';

const supabaseKey =
  getEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
  getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  getEnv('VITE_SUPABASE_PUBLISHABLE_KEY') ||
  getEnv('VITE_SUPABASE_ANON_KEY') ||
  'sb_publishable_TNzouzfSY24PVxVM-HFinw_-s1Rjbew';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface LiveSettlementRecord {
  id: string;
  corridor: string;
  inward_usd: number;
  settled_inr: number;
  alpha_retained_inr: number;
  latency_ms: number;
  eefc_buffer_usd: number;
  fira_id: string;
  created_at: string;
}
