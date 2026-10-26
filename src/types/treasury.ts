export interface TreasuryBalances {
  eefc_usd: number;
  domestic_inr: number;
  total_usd_equivalent: number;
  total_inr_equivalent: number;
}

export interface BurnAllocation {
  required_30d_usd_burn: number;
  ring_fenced_usd: number;
  sweepable_surplus_usd: number;
  runway_coverage_pct: number;
}

export interface ComplianceStatus {
  framework: string;
  statutory_purpose_code: string;
  fema_sweep_deadline: string;
  days_remaining_to_sweep: number;
  status: 'COMPLIANT' | 'ACTION_REQUIRED';
}

export interface FeeLeakageAudit {
  mid_market_rate: number;
  bank_penalized_rate: number;
  total_historic_fees_saved_usd: number;
  effective_margin_gain_pct: number;
}

export interface FxMetadata {
  rate: number;
  last_fetched: number;
  seconds_ago: number;
  source: string;
  cache_ttl_seconds: number;
}

export interface TreasuryOverview {
  balances: TreasuryBalances;
  burn_allocation: BurnAllocation;
  compliance: ComplianceStatus;
  fee_leakage_audit: FeeLeakageAudit;
  fx_meta: FxMetadata;
}

export interface ForecastPoint {
  day: number;
  date: string;
  projected_burn: number;
  ring_fenced_reserve: number;
  safe_surplus: number;
}

export interface UpcomingBill {
  id: number;
  vendor: string;
  amount: number;
  currency: string;
  due_date: string;
  category: string;
  days_until: number;
}

export interface BurnForecast {
  timeline: ForecastPoint[];
  upcoming_bills: UpcomingBill[];
}

export interface InflowPayload {
  source: string;
  amount: number;
  currency?: string;
}

export interface InflowResult {
  status: string;
  message: string;
  credited_to: string;
  auto_sweep_prevented: boolean;
  fema_retention_deadline: string;
}

export interface SweepPayload {
  sweep_amount_usd?: number;
}

export interface SweepResult {
  status: string;
  swept_usd: number;
  credited_inr: number;
  realized_rate: number;
  mid_market_rate: number;
  traditional_bank_loss_avoided_inr: number;
  fee_saved_usd: number;
  new_usd_balance: number;
  new_inr_balance: number;
}

export interface ActivityItem {
  id: string;
  type: 'RING_FENCED' | 'SETTLED' | 'RECEIVED';
  title: string;
  subtitle: string;
  amount_usd: number;
  amount_formatted: string;
  status: string;
  timestamp: string;
}
