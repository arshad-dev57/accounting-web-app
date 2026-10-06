import type { PosMode } from './pos-roles';
import { browserCompanyAuthHeaders } from './company-api-headers';

export type PosSettings = {
  posMode: PosMode;
  posModeConfigured: boolean;
  companyName: string;
};

export async function fetchPosSettings(): Promise<PosSettings> {
  const res = await fetch('/api/pos/settings', {
    cache: 'no-store',
    headers: browserCompanyAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to load POS settings');
  }
  const data = json.data || {};
  return {
    posMode: data.posMode === 'restaurant' ? 'restaurant' : 'retail',
    posModeConfigured: Boolean(data.posModeConfigured),
    companyName: String(data.companyName || ''),
  };
}

export async function savePosMode(posMode: PosMode): Promise<PosSettings> {
  const res = await fetch('/api/pos/settings', {
    method: 'PATCH',
    headers: browserCompanyAuthHeaders(),
    body: JSON.stringify({ posMode }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to save POS type');
  }
  const data = json.data || {};
  return {
    posMode: data.posMode === 'restaurant' ? 'restaurant' : 'retail',
    posModeConfigured: Boolean(data.posModeConfigured),
    companyName: String(data.companyName || ''),
  };
}
