import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://wqpdbbfowwwhclktewnf.supabase.co';

const supabaseKey =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY)) ||
  'sb_publishable_TNzouzfSY24PVxVM-HFinw_-s1Rjbew';

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
