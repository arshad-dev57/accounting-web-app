import { browserCompanyAuthHeaders } from '@/lib/company-api-headers';

export type CommissionSlab = {
  fromAmount: number;
  commissionPercent: number;
};

export type SalesAgentSettings = {
  id?: string;
  companyId?: string;
  enableSalesAgents: boolean;
  trackCommission: boolean;
  agentRequired: boolean;
  customCommissionSlabs: boolean;
  commissionSlabs: CommissionSlab[];
  updatedAt?: string;
};

export type SlabPreview = {
  monthlySales: number;
  commissionPercent: number;
  matchedSlab: CommissionSlab | null;
  earnsNothing: boolean;
};

async function parseJson(response: Response) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }
  return result;
}

/** Highest slab whose fromAmount <= monthlySales; below smallest slab → 0. */
export function resolveSlabRate(monthlySales: number, slabs: CommissionSlab[]): number {
  const amount = Math.max(0, Number(monthlySales) || 0);
  const sorted = [...(slabs || [])]
    .map((s) => ({
      fromAmount: Math.max(0, Number(s.fromAmount) || 0),
      commissionPercent: Math.max(0, Number(s.commissionPercent) || 0),
    }))
    .sort((a, b) => a.fromAmount - b.fromAmount);

  let rate = 0;
  for (const slab of sorted) {
    if (amount >= slab.fromAmount) rate = slab.commissionPercent;
    else break;
  }
  return rate;
}

export function previewSlabLocal(monthlySales: number, slabs: CommissionSlab[]): SlabPreview {
  const amount = Math.max(0, Number(monthlySales) || 0);
  const sorted = [...(slabs || [])].sort((a, b) => a.fromAmount - b.fromAmount);
  const rate = resolveSlabRate(amount, sorted);
  const matched = [...sorted].reverse().find((s) => amount >= s.fromAmount) || null;
  return {
    monthlySales: amount,
    commissionPercent: rate,
    matchedSlab: matched,
    earnsNothing: sorted.length > 0 && amount < sorted[0].fromAmount,
  };
}

export const salesAgentSettingsService = {
  getSettings: async (): Promise<SalesAgentSettings> => {
    const response = await fetch('/api/settings/sales-agents', {
      headers: browserCompanyAuthHeaders(),
      cache: 'no-store',
    });
    const result = await parseJson(response);
    return result.data as SalesAgentSettings;
  },

  saveSettings: async (payload: Partial<SalesAgentSettings>): Promise<SalesAgentSettings> => {
    const response = await fetch('/api/settings/sales-agents', {
      method: 'PUT',
      headers: browserCompanyAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await parseJson(response);
    return result.data as SalesAgentSettings;
  },

  previewSlab: async (
    monthlySales: number,
    commissionSlabs?: CommissionSlab[]
  ): Promise<SlabPreview> => {
    const response = await fetch('/api/settings/sales-agents/preview-slab', {
      method: 'POST',
      headers: browserCompanyAuthHeaders(),
      body: JSON.stringify({ monthlySales, commissionSlabs }),
    });
    const result = await parseJson(response);
    return result.data as SlabPreview;
  },
};
