// lib/pos-service.ts — POS API Service Layer
import { apiClient } from '@/lib/api-client';

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const endpoint = `/api/pos${path}`;
  const verb = method.toUpperCase();
  let res;
  if (verb === 'GET') res = await apiClient.get(endpoint);
  else if (verb === 'POST') res = await apiClient.post(endpoint, body);
  else if (verb === 'PUT') res = await apiClient.put(endpoint, body);
  else if (verb === 'PATCH') res = await apiClient.patch(endpoint, body);
  else if (verb === 'DELETE') res = await apiClient.delete(endpoint);
  else res = await apiClient.request(verb, endpoint, body);

  if (!res.success) {
    throw new Error(res.message || `Request failed (${res.statusCode})`);
  }
  return (res.data ?? {}) as T;
}

/** Normalize POS list payloads: { data }, { shifts }, or a raw array. */
export function asPosArray(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.shifts)) return payload.shifts;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.shifts)) return payload.data.shifts;
  return [];
}

export function asPosTotal(payload: any, list: any[] = asPosArray(payload)): number {
  const n = Number(payload?.total ?? payload?.data?.total);
  return Number.isFinite(n) && n >= 0 ? n : list.length;
}

// ─── Terminals ───────────────────────────────────────────────────────────────
export const posTerminalService = {
  list: (params?: string) =>
    api<any>('GET', `/terminals${params ? '?' + params : ''}`),
  create: (body: any) => api<any>('POST', '/terminals', body),
  update: (id: string, body: any) => api<any>('PUT', `/terminals/${id}`, body),
  delete: (id: string) => api<any>('DELETE', `/terminals/${id}`),
};

// ─── Shifts ───────────────────────────────────────────────────────────────────
export const posShiftService = {
  getCurrent: () => api<any>('GET', '/shifts/current'),
  getHistory: (params?: string) => api<any>('GET', `/shifts${params ? '?' + params : ''}`),
  open: (body: any) => api<any>('POST', '/shifts/open', body),
  close: (shiftId: string, body: any) => api<any>('POST', `/shifts/${shiftId}/close`, body),
  suspend: (shiftId: string) => api<any>('POST', `/shifts/${shiftId}/suspend`),
  resume: (shiftId: string) => api<any>('POST', `/shifts/${shiftId}/resume`),
  reopen: (shiftId: string) => api<any>('POST', `/shifts/${shiftId}/reopen`),
  recordCash: (body: any) => api<any>('POST', '/cash-flow', body),
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const posProductService = {
  search: (params: string) => api<any>('GET', `/products/search?${params}`),
  byBarcode: (code: string, locationId?: string) => {
    const qs = locationId
      ? `?locationId=${encodeURIComponent(locationId)}`
      : '';
    return api<any>(
      'GET',
      `/products/barcode/${encodeURIComponent(code)}${qs}`
    );
  },
};

// ─── Sales ────────────────────────────────────────────────────────────────────
export const posSaleService = {
  list: (params?: string) => api<any>('GET', `/sales${params ? '?' + params : ''}`),
  get: (id: string) => api<any>('GET', `/sales/${id}`),
  lookup: (q: string) =>
    api<any>('GET', `/sales/lookup?q=${encodeURIComponent(q)}`),
  complete: (body: any) => api<any>('POST', '/sales', body),
  hold: (body: any) => api<any>('POST', '/sales/hold', body),
  getHeld: () => api<any>('GET', '/sales/held'),
  deleteHeld: (id: string) => api<any>('DELETE', `/sales/held/${id}`),
  sync: (body: any) => api<any>('POST', '/sales/sync', body),
  return: (body: any) => api<any>('POST', '/returns', body),
  void: (id: string, body: { reason: string }) => api<any>('POST', `/sales/${id}/void`, body),
  convertToInvoice: (id: string, body?: any) =>
    api<any>('POST', `/sales/${id}/convert-to-invoice`, body || {}),
  dailyReport: (date?: string, locationId?: string) => {
    const qs = new URLSearchParams();
    if (date) qs.set('date', date);
    if (locationId) qs.set('locationId', locationId);
    const q = qs.toString();
    return api<any>('GET', `/reports/daily${q ? '?' + q : ''}`);
  },
  shiftReport: (shiftId: string) => api<any>('GET', `/reports/shift/${shiftId}`),
  verifyManager: (body: { email: string; password: string }) =>
    api<any>('POST', '/auth/verify-manager', body),
  auditLogs: (params?: string) =>
    api<any>('GET', `/audit-logs${params ? '?' + params : ''}`),
};

export const posReceiptService = {
  get: () => api<any>('GET', '/receipt-settings'),
  save: (body: any) => api<any>('PUT', '/receipt-settings', body),
};
