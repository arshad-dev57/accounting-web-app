import { browserCompanyAuthHeaders } from '@/lib/company-api-headers';

export type UnitOfMeasure = {
  id: string;
  companyId?: string;
  code: string;
  name: string;
  symbol?: string | null;
  isBase?: boolean;
  isActive?: boolean;
  decimalPlaces?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type UomConversion = {
  id: string;
  fromUomId: string;
  toUomId: string;
  conversionFactor: number;
  fromUom?: UnitOfMeasure;
  toUom?: UnitOfMeasure;
};

async function parseJson(response: Response) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }
  return result;
}

export const unitsService = {
  list: async (): Promise<{ uoms: UnitOfMeasure[]; conversions: UomConversion[] }> => {
    const response = await fetch('/api/settings/units', {
      headers: browserCompanyAuthHeaders(),
      cache: 'no-store',
    });
    const result = await parseJson(response);
    return {
      uoms: result.data?.uoms || [],
      conversions: result.data?.conversions || [],
    };
  },

  create: async (payload: {
    code: string;
    name: string;
    symbol?: string;
    decimalPlaces?: number;
    isBase?: boolean;
  }): Promise<UnitOfMeasure> => {
    const response = await fetch('/api/settings/units', {
      method: 'POST',
      headers: browserCompanyAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await parseJson(response);
    return result.data as UnitOfMeasure;
  },

  update: async (
    id: string,
    payload: Partial<{
      code: string;
      name: string;
      symbol: string;
      decimalPlaces: number;
      isBase: boolean;
      isActive: boolean;
    }>
  ): Promise<UnitOfMeasure> => {
    const response = await fetch(`/api/settings/units/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: browserCompanyAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await parseJson(response);
    return result.data as UnitOfMeasure;
  },

  deactivate: async (id: string): Promise<void> => {
    const response = await fetch(`/api/settings/units/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: browserCompanyAuthHeaders(),
    });
    await parseJson(response);
  },
};
