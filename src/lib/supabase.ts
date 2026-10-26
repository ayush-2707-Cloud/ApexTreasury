import { createClient } from '@supabase/supabase-js';

declare const process: any;

const getEnv = (key: string, viteKey: string, fallback: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
    return import.meta.env[viteKey];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key]!;
  }
  return fallback;
};

const supabaseUrl = getEnv(
  'NEXT_PUBLIC_SUPABASE_URL',
  'VITE_SUPABASE_URL',
  'https://wqpdbbfowwwhclktewnf.supabase.co'
);

const supabaseKey = getEnv(
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'sb_publishable_TNzouzfSY24PVxVM-HFinw_-s1Rjbew'
);

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface LiveSettlementRecord {
  id: string;
  user_id?: string;
  corridor: string;
  inward_usd: number;
  settled_inr: number;
  alpha_retained_inr: number;
  latency_ms: number;
  eefc_buffer_usd: number;
  fira_id: string;
  status?: string;
  created_at?: string;
}
