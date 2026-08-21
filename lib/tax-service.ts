const BASE = '/api/tax';

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
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

export type TaxPricingModel = 'exclusive' | 'inclusive';

export interface TaxRateOption {
  id: string;
  rate: number;
  isDefault?: boolean;
  taxTypeCode?: string;
  taxTypeName?: string;
  jurisdictionId?: string;
  jurisdictionName?: string;
  pricingModel?: TaxPricingModel;
}

export interface TaxContext {
  configured: boolean;
  enabled: boolean;
  profile: any;
  countryPacks: Array<{
    countryCode: string;
    name: string;
    regime: string;
    pricingModel: TaxPricingModel;
    filingFrequency: string;
  }>;
  defaultRate: any;
  rates: TaxRateOption[];
  pricingModel: TaxPricingModel;
  regime: string | null;
  countryCode: string | null;
}

let contextCache: { data: TaxContext; at: number } | null = null;
let contextInflight: Promise<TaxContext> | null = null;
const CONTEXT_TTL_MS = 20_000;

export async function loadTaxContext(force = false): Promise<TaxContext> {
  if (!force && contextCache && Date.now() - contextCache.at < CONTEXT_TTL_MS) {
    return contextCache.data;
  }
  if (!contextInflight) {
    contextInflight = taxService.context()
      .then((r) => {
        contextCache = { data: r.data, at: Date.now() };
        contextInflight = null;
        return r.data;
      })
      .catch((err) => {
        contextInflight = null;
        throw err;
      });
  }
  return contextInflight;
}

export function clearTaxContextCache() {
  contextCache = null;
  contextInflight = null;
}

export function isTaxEnabled(ctx?: TaxContext | null) {
  return Boolean(ctx?.enabled);
}

export function formatTaxRateLabel(rate: TaxRateOption) {
  return `${rate.taxTypeName || 'Tax'} · ${rate.rate}%`;
}

export function deriveProductTaxType(option?: TaxRateOption | null, pricingModel: TaxPricingModel = 'exclusive') {
  const code = `${option?.taxTypeCode || ''} ${option?.taxTypeName || ''}`.toUpperCase();
  if (code.includes('ZERO')) return 'Zero Rated';
  if (code.includes('EXEMPT')) return 'Exempt';
  return pricingModel === 'inclusive' ? 'Inclusive' : 'Exclusive';
}

export const taxService = {
  context: () => api<{ success: boolean; data: TaxContext }>('GET', '/context'),
  overview: () => api<any>('GET', '/overview'),
  saveProfile: (body: any) => api<any>('PUT', '/profile', body),
  setEnabled: async (enabled: boolean) => {
    const res = await api<any>('PUT', '/enabled', { enabled });
    clearTaxContextCache();
    return res;
  },
  setupCountry: (body: { countryCode: string; taxRegistrationNumber?: string; replaceExisting?: boolean }) =>
    api<any>('POST', '/setup', body),

  jurisdictions: () => api<any>('GET', '/jurisdictions'),
  createJurisdiction: (body: any) => api<any>('POST', '/jurisdictions', body),
  updateJurisdiction: (id: string, body: any) => api<any>('PUT', `/jurisdictions/${id}`, body),

  types: () => api<any>('GET', '/types'),
  createType: (body: any) => api<any>('POST', '/types', body),
  updateType: (id: string, body: any) => api<any>('PUT', `/types/${id}`, body),

  rates: () => api<any>('GET', '/rates'),
  createRate: (body: any) => api<any>('POST', '/rates', body),
  updateRate: (id: string, body: any) => api<any>('PUT', `/rates/${id}`, body),

  rules: () => api<any>('GET', '/rules'),
  createRule: (body: any) => api<any>('POST', '/rules', body),

  exemptionTypes: () => api<any>('GET', '/exemption-types'),
  createExemptionType: (body: any) => api<any>('POST', '/exemption-types', body),
  exemptions: () => api<any>('GET', '/exemptions'),
  createExemption: (body: any) => api<any>('POST', '/exemptions', body),

  calculate: (body: any) => api<any>('POST', '/calculate', body),
  liability: (params?: string) =>
    api<any>('GET', `/reports/liability${params ? '?' + params : ''}`),
  audit: (transactionId: string) => api<any>('GET', `/audit/${encodeURIComponent(transactionId)}`),
};

export function computeTaxLine(
  qty: number,
  price: number,
  discPct: number,
  taxRate: number,
  pricingModel: TaxPricingModel = 'exclusive'
) {
  const base = qty * price;
  const discAmt = base * (discPct || 0) / 100;
  const taxable = base - discAmt;
  const rate = taxRate || 0;
  if (pricingModel === 'inclusive') {
    const divisor = 1 + rate / 100;
    const taxAmt = divisor > 0 ? taxable - taxable / divisor : 0;
    return {
      lineTotal: parseFloat(taxable.toFixed(2)),
      taxAmount: parseFloat(taxAmt.toFixed(2)),
      taxableAmount: parseFloat((taxable - taxAmt).toFixed(2)),
    };
  }
  const taxAmt = taxable * rate / 100;
  return {
    lineTotal: parseFloat((taxable + taxAmt).toFixed(2)),
    taxAmount: parseFloat(taxAmt.toFixed(2)),
    taxableAmount: parseFloat(taxable.toFixed(2)),
  };
}

export function resolveProductTaxRate(productRate: number | undefined, ctx: TaxContext | null) {
  if (!ctx?.enabled) return 0;
  if (productRate && productRate > 0) return productRate;
  return ctx?.defaultRate?.rate || ctx?.rates?.[0]?.rate || 0;
}
