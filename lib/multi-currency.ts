'use client';

import { apiClient } from '../app/lib/api-client';

export type CurrencyMaster = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isActive: boolean;
};

export type ExchangeRateRow = {
  id: string;
  companyId: string;
  fromCurrencyId: string;
  toCurrencyId: string;
  rate: string | number;
  effectiveDate: string;
  isActive: boolean;
  notes?: string | null;
  fromCurrency?: CurrencyMaster | null;
  toCurrency?: CurrencyMaster | null;
};

export type RateLookupResult = {
  rate: string;
  effectiveDate: string;
  fromCurrencyId: string;
  toCurrencyId: string;
  fromCurrency?: CurrencyMaster | null;
  toCurrency?: CurrencyMaster | null;
  isIdentity?: boolean;
};

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as any).data)) {
    return (payload as any).data as T[];
  }
  return [];
}

function unwrapOne<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== 'object') return null;
  const obj = payload as Record<string, unknown>;
  if (obj.data && typeof obj.data === 'object') return obj.data as T;
  return payload as T;
}

export function formatMoney(
  amount: number | string | null | undefined,
  currency?: Pick<CurrencyMaster, 'symbol' | 'code' | 'decimalPlaces'> | null
): string {
  const n = Number(amount);
  const value = Number.isFinite(n) ? n : 0;
  const decimals = currency?.decimalPlaces ?? 2;
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const prefix = currency?.symbol || currency?.code || '';
  return prefix ? `${prefix} ${formatted}` : formatted;
}

export function computeBaseAmount(
  foreignAmount: number | string | null | undefined,
  exchangeRate: number | string | null | undefined
): number {
  const foreign = Number(foreignAmount);
  const rate = Number(exchangeRate);
  if (!Number.isFinite(foreign) || !Number.isFinite(rate)) return 0;
  return Math.round(foreign * rate * 10000) / 10000;
}

function assertOk(response: { success: boolean; message?: string; data?: any }, fallback: string) {
  if (!response.success || response.data?.success === false) {
    throw new Error(response.data?.message || response.message || fallback);
  }
}

export async function fetchCurrencies(activeOnly = true): Promise<CurrencyMaster[]> {
  const qs = activeOnly ? '?activeOnly=true' : '?activeOnly=false';
  const response = await apiClient.get(`/api/currencies${qs}`);
  assertOk(response, 'Failed to fetch currencies');
  return unwrapList<CurrencyMaster>(response.data);
}

export async function fetchBaseCurrency(): Promise<CurrencyMaster | null> {
  const response = await apiClient.get('/api/currencies/base');
  assertOk(response, 'Failed to fetch base currency');
  return unwrapOne<CurrencyMaster>(response.data);
}

export async function createCurrency(payload: {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces?: number;
  isActive?: boolean;
}): Promise<CurrencyMaster> {
  const response = await apiClient.post('/api/currencies', payload);
  assertOk(response, 'Failed to create currency');
  const created = unwrapOne<CurrencyMaster>(response.data);
  if (!created) throw new Error('Invalid create currency response');
  return created;
}

export async function setBaseCurrency(currencyId: string): Promise<CurrencyMaster> {
  const response = await apiClient.put('/api/currencies/base', { currencyId });
  assertOk(response, 'Failed to set base currency');
  const updated = unwrapOne<CurrencyMaster>(response.data);
  if (!updated) throw new Error('Invalid base currency response');
  return updated;
}

export async function fetchExchangeRates(params: {
  fromCurrencyId?: string;
  toCurrencyId?: string;
  activeOnly?: boolean;
} = {}): Promise<ExchangeRateRow[]> {
  const qs = new URLSearchParams();
  if (params.fromCurrencyId) qs.set('fromCurrencyId', params.fromCurrencyId);
  if (params.toCurrencyId) qs.set('toCurrencyId', params.toCurrencyId);
  if (params.activeOnly) qs.set('activeOnly', 'true');
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const response = await apiClient.get(`/api/currencies/rates${suffix}`);
  assertOk(response, 'Failed to fetch exchange rates');
  return unwrapList<ExchangeRateRow>(response.data);
}

export async function createExchangeRate(payload: {
  fromCurrencyId: string;
  toCurrencyId: string;
  rate: number | string;
  effectiveDate: string;
  notes?: string;
  isActive?: boolean;
}): Promise<ExchangeRateRow> {
  const response = await apiClient.post('/api/currencies/rates', payload);
  assertOk(response, 'Failed to create exchange rate');
  const created = unwrapOne<ExchangeRateRow>(response.data);
  if (!created) throw new Error('Invalid create exchange rate response');
  return created;
}

export async function updateExchangeRate(
  id: string,
  payload: {
    rate?: number | string;
    effectiveDate?: string;
    notes?: string | null;
    isActive?: boolean;
  }
): Promise<ExchangeRateRow> {
  const response = await apiClient.put(`/api/currencies/rates/${id}`, payload);
  assertOk(response, 'Failed to update exchange rate');
  const updated = unwrapOne<ExchangeRateRow>(response.data);
  if (!updated) throw new Error('Invalid update exchange rate response');
  return updated;
}

export async function deleteExchangeRate(id: string): Promise<void> {
  const response = await apiClient.delete(`/api/currencies/rates/${id}`);
  assertOk(response, 'Failed to delete exchange rate');
}

export async function lookupRate(params: {
  fromCurrencyId: string;
  toCurrencyId: string;
  date?: string;
}): Promise<RateLookupResult | null> {
  if (!params.fromCurrencyId || !params.toCurrencyId) return null;
  if (params.fromCurrencyId === params.toCurrencyId) {
    return {
      rate: '1',
      effectiveDate: params.date || new Date().toISOString().slice(0, 10),
      fromCurrencyId: params.fromCurrencyId,
      toCurrencyId: params.toCurrencyId,
      isIdentity: true,
    };
  }

  const qs = new URLSearchParams({
    fromCurrencyId: params.fromCurrencyId,
    toCurrencyId: params.toCurrencyId,
  });
  if (params.date) qs.set('date', params.date);

  const response = await apiClient.get(`/api/currencies/rates/lookup?${qs.toString()}`);
  if (!response.success || response.data?.success === false) {
    return null;
  }
  return unwrapOne<RateLookupResult>(response.data);
}
