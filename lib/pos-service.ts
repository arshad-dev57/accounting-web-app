// lib/pos-service.ts — POS API Service Layer
const BASE = '/api/pos';

function getHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('auth_token') ||
        document.cookie
          .split('; ')
          .find((c) => c.startsWith('auth_token='))
          ?.split('=')[1] ||
        ''
      : '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: getHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
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
