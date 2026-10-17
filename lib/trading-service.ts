import { apiClient } from '@/lib/api-client';

export type TradingDocumentType =
  | 'SALES_ORDER'
  | 'PURCHASE_ORDER'
  | 'SALES_INVOICE'
  | 'PURCHASE_INVOICE'
  | 'DELIVERY'
  | 'GRN'
  | 'SALES_PAYMENT'
  | 'PURCHASE_PAYMENT'
  | 'SALES_RETURN'
  | 'PURCHASE_RETURN'
  | 'QUOTATION';

export type TradingDocument = {
  id: string;
  companyId: string;
  documentType: TradingDocumentType | string;
  documentId: string;
  documentNumber?: string | null;
  tradeChannel: string;
  tradeRef?: string | null;
  counterpartyName?: string | null;
  status?: string | null;
  amountBase?: number | string | null;
  currencyCode?: string | null;
  documentDate?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
};

export type TradingDashboardKpis = {
  totalTradingSales: number;
  totalTradingPurchases: number;
  recognizedSalesInvoices: number;
  cogsTotal: number;
  grossTradingProfit: number;
  grossMarginPercentage: number;
  currentTradingStockValue: number;
  openSalesOrders: number;
  pendingPurchaseOrders: number;
  openPurchaseCommitments: number;
  outstandingReceivables: number;
  lowStockItemsCount: number;
  deliveryCount: number;
  grnCount: number;
  linkedDocumentCounts?: {
    salesOrders: number;
    purchaseOrders: number;
    salesInvoices: number;
  };
  notes?: Record<string, string>;
};

export type TradingPriceListItem = {
  id?: string;
  productId: string;
  unitName?: string;
  unitPrice: number | string;
  listPrice?: number | string | null;
  minQty?: number | string;
  maxQty?: number | string | null;
  discountPercentage?: number | string;
  markupPercentage?: number | string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  product?: {
    id: string;
    name: string;
    sku: string;
    costPrice?: number;
    sellingPrice?: number;
    wholesalePrice?: number;
    stockUnitName?: string;
    currencyCode?: string;
  };
};

export type TradingPriceList = {
  id: string;
  companyId: string;
  code: string;
  name: string;
  tier: string;
  currencyCode: string;
  pricingMethod?: string;
  costBasis?: string;
  discountPercentage: number | string;
  markupPercentage?: number | string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  notes?: string | null;
  items?: TradingPriceListItem[];
};

export type TradingCustomerPrice = {
  id: string;
  companyId: string;
  customerId: string;
  productId: string;
  priceListId?: string | null;
  currencyCode?: string;
  unitName?: string;
  listPrice: number | string;
  negotiatedPrice: number | string;
  discountPercentage?: number | string;
  targetMarginPct?: number | string;
  minOrderQty: number | string;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  status: string;
  notes?: string | null;
  customer?: { id: string; name: string; customerNumber?: string };
  product?: {
    id: string;
    name: string;
    sku: string;
    costPrice?: number;
    averageCost?: number;
    lastPurchasePrice?: number;
    standardCost?: number;
    sellingPrice?: number;
    stockUnitName?: string;
    currencyCode?: string;
  };
  priceList?: { id: string; code: string; name: string; tier?: string } | null;
};

export type TradingMarginRow = {
  id?: string;
  productId: string;
  sku?: string;
  name?: string;
  customerId: string;
  customerName?: string;
  currencyCode?: string;
  costBasis?: string;
  avgPurchaseCost: number;
  listPrice?: number;
  avgSellingPrice: number;
  discountPercentage?: number;
  grossMargin: number;
  grossMarginPct: number;
  markupPct?: number;
  targetMarginPct?: number;
  variancePct?: number;
  health?: string;
  priceListCode?: string | null;
};

function unwrap(res: { success: boolean; data: any; message: string }) {
  const body = res.data ?? {};
  if (!res.success || body.success === false) {
    throw new Error(body.message || res.message || 'Trading request failed');
  }
  return body;
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Map backend KPI payload to the shape used by existing Trading dashboard UI. */
export function mapKpisToUi(data: TradingDashboardKpis) {
  return {
    totalTradingSalesUsd: num(data.totalTradingSales),
    totalTradingPurchasesUsd: num(data.totalTradingPurchases),
    grossTradingProfitUsd: num(data.grossTradingProfit),
    grossMarginPercentage: num(data.grossMarginPercentage),
    currentTradingStockValueUsd: num(data.currentTradingStockValue),
    openSalesOrders: num(data.openSalesOrders),
    pendingPurchaseOrders: num(data.pendingPurchaseOrders),
    outstandingReceivablesUsd: num(data.outstandingReceivables),
    outstandingPayablesUsd: num(data.openPurchaseCommitments),
    openPurchaseCommitmentsUsd: num(data.openPurchaseCommitments),
    lowStockItemsCount: num(data.lowStockItemsCount),
    cogsTotal: num(data.cogsTotal),
    deliveryCount: num(data.deliveryCount),
    grnCount: num(data.grnCount),
    notes: data.notes,
  };
}

export type PriceListInput = {
  code: string;
  name: string;
  tier?: string;
  currencyCode?: string;
  pricingMethod?: string;
  costBasis?: string;
  discountPercentage?: number;
  markupPercentage?: number;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  isActive?: boolean;
  notes?: string;
  items?: Array<{
    productId: string;
    unitName?: string;
    unitPrice: number;
    listPrice?: number | null;
    minQty?: number;
    maxQty?: number | null;
    discountPercentage?: number;
    markupPercentage?: number;
    effectiveFrom?: string | null;
    effectiveTo?: string | null;
  }>;
};

export type CustomerPriceInput = {
  customerId: string;
  productId: string;
  priceListId?: string | null;
  currencyCode?: string;
  unitName?: string;
  listPrice: number;
  negotiatedPrice: number;
  discountPercentage?: number;
  targetMarginPct?: number;
  minOrderQty?: number;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  status?: string;
  notes?: string | null;
};

export const tradingService = {
  getDashboard: async (params: { fromDate?: string; toDate?: string } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) qs.set(k, v);
    });
    const q = qs.toString();
    const body = unwrap(await apiClient.get(`/api/trading/dashboard${q ? `?${q}` : ''}`));
    return body.data as TradingDashboardKpis;
  },

  listDocuments: async (
    params: {
      documentType?: TradingDocumentType | string;
      tradeChannel?: string;
      search?: string;
      page?: number;
      pageSize?: number;
      fromDate?: string;
      toDate?: string;
    } = {}
  ) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    const q = qs.toString();
    const body = unwrap(await apiClient.get(`/api/trading/documents${q ? `?${q}` : ''}`));
    return {
      data: (body.data || []) as TradingDocument[],
      pagination: body.pagination as {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      },
    };
  },

  linkDocument: async (input: {
    documentType: TradingDocumentType | string;
    documentId: string;
    tradeChannel?: string;
    tradeRef?: string;
    metadata?: Record<string, unknown>;
  }) => {
    const body = unwrap(await apiClient.post('/api/trading/documents/link', input));
    return body.data as TradingDocument;
  },

  unlinkDocument: async (id: string) => {
    unwrap(await apiClient.delete(`/api/trading/documents/${id}`));
  },

  listPriceLists: async () => {
    const body = unwrap(await apiClient.get('/api/trading/price-lists'));
    return (body.data || []) as TradingPriceList[];
  },

  getPriceList: async (id: string) => {
    const body = unwrap(await apiClient.get(`/api/trading/price-lists/${id}`));
    return body.data as TradingPriceList;
  },

  createPriceList: async (input: PriceListInput) => {
    const body = unwrap(await apiClient.post('/api/trading/price-lists', input));
    return body.data as TradingPriceList;
  },

  updatePriceList: async (id: string, input: Partial<PriceListInput>) => {
    const body = unwrap(await apiClient.put(`/api/trading/price-lists/${id}`, input));
    return body.data as TradingPriceList;
  },

  listCustomerPrices: async () => {
    const body = unwrap(await apiClient.get('/api/trading/customer-prices'));
    return (body.data || []) as TradingCustomerPrice[];
  },

  upsertCustomerPrice: async (input: CustomerPriceInput) => {
    const body = unwrap(await apiClient.post('/api/trading/customer-prices', input));
    return body.data as TradingCustomerPrice;
  },

  getMargins: async (params: { costBasis?: string; targetMarginPct?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.costBasis) qs.set('costBasis', params.costBasis);
    if (params.targetMarginPct != null) qs.set('targetMarginPct', String(params.targetMarginPct));
    const q = qs.toString();
    const body = unwrap(await apiClient.get(`/api/trading/margins${q ? `?${q}` : ''}`));
    return (body.data || []) as TradingMarginRow[];
  },

  resolveSellPrice: async (params: {
    customerId?: string | null;
    productId: string;
    quantity?: number;
    asOfDate?: string;
  }) => {
    const qs = new URLSearchParams();
    qs.set('productId', params.productId);
    if (params.customerId) qs.set('customerId', params.customerId);
    if (params.quantity != null) qs.set('quantity', String(params.quantity));
    if (params.asOfDate) qs.set('asOfDate', params.asOfDate);
    const body = unwrap(await apiClient.get(`/api/trading/resolve-price?${qs.toString()}`));
    return body.data as ResolvedSellPrice;
  },

  resolveSellPrices: async (input: {
    customerId?: string | null;
    asOfDate?: string;
    lines: Array<{ productId: string; quantity?: number; customerId?: string }>;
  }) => {
    const body = unwrap(await apiClient.post('/api/trading/resolve-prices', input));
    return (body.data || []) as ResolvedSellPrice[];
  },
};

export type ResolvedSellPrice = {
  companyId: string;
  customerId: string | null;
  productId: string;
  sku?: string;
  productName?: string;
  unitPrice: number;
  listPrice: number;
  standardSellingPrice: number;
  discountPercentage: number;
  currencyCode: string;
  unitName: string;
  taxRate: number;
  source: 'CUSTOMER_NEGOTIATED' | 'PRICE_LIST' | 'STANDARD_SELLING' | string;
  sourceLabel: string;
  sourceId: string | null;
  priceListId: string | null;
  minOrderQty: number;
  quantity: number;
  messages: string[];
  warnings: string[];
};
