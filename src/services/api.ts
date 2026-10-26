import type {
  TreasuryOverview,
  BurnForecast,
  InflowPayload,
  InflowResult,
  SweepPayload,
  SweepResult,
  ActivityItem,
} from '../types/treasury';

const BASE_URL = '/api/v1';

async function handleResponse<T>(res: Response, endpoint: string): Promise<T> {
  if (!res.ok) {
    let errMessage = `Error ${res.status}: ${res.statusText}`;
    try {
      const errData = await res.json();
      if (errData && errData.detail) {
        errMessage = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(`Failed to call ${endpoint}: ${errMessage}`);
  }
  return res.json();
}

export async function getTreasuryOverview(): Promise<TreasuryOverview> {
  const res = await fetch(`${BASE_URL}/treasury/overview`, {
    headers: { 'Cache-Control': 'no-cache' },
  });
  return handleResponse<TreasuryOverview>(res, '/treasury/overview');
}

export async function getBurnForecast(): Promise<BurnForecast> {
  const res = await fetch(`${BASE_URL}/treasury/burn-forecast`, {
    headers: { 'Cache-Control': 'no-cache' },
  });
  return handleResponse<BurnForecast>(res, '/treasury/burn-forecast');
}

export async function recordInflow(payload: InflowPayload): Promise<InflowResult> {
  const res = await fetch(`${BASE_URL}/treasury/inflow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<InflowResult>(res, '/treasury/inflow');
}

export async function executeSweep(payload: SweepPayload = {}): Promise<SweepResult> {
  const res = await fetch(`${BASE_URL}/treasury/execute-sweep`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<SweepResult>(res, '/treasury/execute-sweep');
}

export async function refreshFxRate(): Promise<{ status: string; rate: number; source: string; timestamp: number }> {
  const res = await fetch(`${BASE_URL}/treasury/refresh-fx`, {
    method: 'POST',
  });
  return handleResponse(res, '/treasury/refresh-fx');
}

export async function getActivityFeed(): Promise<{ activity: ActivityItem[] }> {
  const res = await fetch(`${BASE_URL}/treasury/activity`, {
    headers: { 'Cache-Control': 'no-cache' },
  });
  return handleResponse<{ activity: ActivityItem[] }>(res, '/treasury/activity');
}
