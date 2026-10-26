/**
 * Export Management API client.
 * Mirrors the Import module client and talks to /api/export/*.
 */
import { apiClient } from '@/lib/api-client';

function buildQuery(params: Record<string, unknown> = {}): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      q.set(key, String(value));
    }
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

function unwrap<T>(res: any, fallbackMsg = 'Request failed'): T {
  if (!res || res.success === false) {
    const msg =
      res?.message ||
      res?.data?.message ||
      (typeof res?.data === 'string' ? res.data : null) ||
      fallbackMsg;
    const err: any = new Error(msg);
    err.response = {
      data: {
        message: msg,
        field: res?.data?.field || res?.field,
        code: res?.data?.code,
      },
      status: res?.statusCode || 400,
    };
    throw err;
  }
  const body = res.data;
  if (body && typeof body === 'object' && 'data' in body) return body.data as T;
  return body as T;
}

export interface Paginated<T> {
  items: T[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export interface ExportListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  orderId?: string;
  [key: string]: unknown;
}

export interface ExportPort {
  id: string;
  unLocode?: string;
  name: string;
  country?: string;
  countryCode?: string | null;
  portType?: string;
}

export interface ExportItemBase {
  id: string;
  productId?: string | null;
  productName: string;
  sku?: string | null;
  quantity: number;
  uom: string;
  unitPriceForeign: number;
  unitPriceBase: number;
  discountForeign: number;
  lineTotalForeign: number;
  lineTotalBase: number;
  shippedQty?: number;
  invoicedQty?: number;
}

export interface ExportInquiry {
  id: string;
  companyId: string;
  inquiryNumber: string;
  date: string;
  customerId?: string | null;
  customerName: string;
  customerCountry?: string | null;
  destinationPort?: string | null;
  destinationPortCode?: string | null;
  incoterm: string;
  currency: string;
  exchangeRate: number;
  estimatedRevenueForeign: number;
  estimatedRevenueBase: number;
  targetDispatchDate?: string | null;
  leadStage: string;
  status: string;
  convertedQuotationId?: string | null;
  notes?: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    productId?: string | null;
    productName: string;
    sku?: string | null;
    requestedQty: number;
    uom: string;
    targetPriceForeign: number;
    targetPriceBase: number;
  }>;
}

export interface ExportQuotation {
  id: string;
  companyId: string;
  quoteNumber: string;
  inquiryId?: string | null;
  quoteDate: string;
  validUntil?: string | null;
  customerId?: string | null;
  customerName: string;
  customerCountry?: string | null;
  incoterm: string;
  currency: string;
  exchangeRate: number;
  portOfLoading?: string | null;
  portOfDischarge?: string | null;
  subtotalForeign: number;
  subtotalBase: number;
  freightForeign: number;
  freightBase: number;
  insuranceForeign: number;
  insuranceBase: number;
  totalForeign: number;
  totalBase: number;
  paymentTerms?: string | null;
  status: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  convertedOrderId?: string | null;
  notes?: string | null;
  createdAt: string;
  items: ExportItemBase[];
}

export interface ExportOrder {
  id: string;
  companyId: string;
  orderNumber: string;
  quotationId?: string | null;
  inquiryId?: string | null;
  customerId: string;
  customerName: string;
  customerCountry?: string | null;
  destinationPort?: string | null;
  destinationPortCode?: string | null;
  incoterm: string;
  currency: string;
  exchangeRate: number;
  exchangeRateDate?: string | null;
  rateSource?: string | null;
  baseCurrencyCode?: string | null;
  orderDate: string;
  deliveryDeadline?: string | null;
  subtotalForeign: number;
  subtotalBase: number;
  freightForeign: number;
  freightBase: number;
  discountForeign: number;
  discountBase: number;
  totalForeign: number;
  totalBase: number;
  advanceReceivedBase: number;
  advanceAppliedBase: number;
  invoicedBase: number;
  paidBase: number;
  outstandingBase: number;
  paymentTerms?: string | null;
  status: string;
  locationId?: string | null;
  notes?: string | null;
  createdAt: string;
  items: ExportItemBase[];
}

export interface ExportOrderFull {
  order: ExportOrder;
  proformas: ExportProforma[];
  packings: ExportPacking[];
  shipments: ExportShipment[];
  customs: ExportCustoms[];
  dispatches: ExportDispatch[];
  documents: ExportDocument[];
  receipts: ExportReceipt[];
  lcs: ExportFinanceLc[];
  expenses: ExportExpense[];
  invoices: any[];
}

export interface ExportProforma {
  id: string;
  companyId: string;
  piNumber: string;
  orderId: string;
  orderNumber?: string | null;
  orderCurrency?: string | null;
  orderCustomerName?: string | null;
  customerName: string;
  customerCountry?: string | null;
  date: string;
  currency: string;
  exchangeRate: number;
  exchangeRateDate?: string | null;
  rateSource?: string | null;
  baseCurrencyCode?: string | null;
  amountForeign: number;
  amountBase: number;
  bankSwiftCode?: string | null;
  beneficiaryAccount?: string | null;
  lcNumber?: string | null;
  status: string;
  advanceReceivedBase: number;
  notes?: string | null;
  createdAt: string;
}

export interface ExportPackingItem {
  id: string;
  productId?: string | null;
  productName: string;
  sku?: string | null;
  quantity: number;
  uom: string;
  packages: number;
  grossWeightKg: number;
  netWeightKg: number;
  cbm: number;
}

export interface ExportPacking {
  id: string;
  companyId: string;
  packingListNo: string;
  orderId: string;
  orderNumber?: string | null;
  orderCustomerName?: string | null;
  shipmentId?: string | null;
  shipmentNumber?: string | null;
  packingDate: string;
  containerNo?: string | null;
  sealNo?: string | null;
  containerType?: string | null;
  totalGrossWeightKg: number;
  totalNetWeightKg: number;
  totalCbm: number;
  packagesCount: number;
  inspectionAgency?: string | null;
  inspectionCertificateNo?: string | null;
  inspectionStatus: string;
  notes?: string | null;
  createdAt: string;
  items: ExportPackingItem[];
}

export interface ExportShipment {
  id: string;
  companyId: string;
  shipmentNumber: string;
  orderId: string;
  orderNumber?: string | null;
  orderCurrency?: string | null;
  customerName: string;
  customerCountry?: string | null;
  shippingLine?: string | null;
  bookingRef?: string | null;
  blNumber?: string | null;
  portOfLoading?: string | null;
  portOfDischarge?: string | null;
  vesselName?: string | null;
  etd?: string | null;
  eta?: string | null;
  shipmentStatus: string;
  currentPosition?: string | null;
  locationId?: string | null;
  notes?: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    orderItemId?: string | null;
    productId: string;
    productName: string;
    sku?: string | null;
    quantity: number;
    uom: string;
    unitPriceForeign: number;
    lineTotalForeign: number;
  }>;
}

export interface ExportCustoms {
  id: string;
  companyId: string;
  shippingBillNo: string;
  orderId: string;
  orderNumber?: string | null;
  orderCurrency?: string | null;
  orderCustomerName?: string | null;
  shipmentId?: string | null;
  shipmentNumber?: string | null;
  exportPort?: string | null;
  declarationDate: string;
  fobValueForeign: number;
  fobValueBase: number;
  customsAgent?: string | null;
  dutyDrawbackEligible: boolean;
  dutyDrawbackEstimatedForeign: number;
  dutyDrawbackEstimatedBase: number;
  status: string;
  leoDate?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface ExportDocument {
  id: string;
  companyId: string;
  docNumber: string;
  docType: string;
  orderId?: string | null;
  orderNumber?: string | null;
  shipmentId?: string | null;
  shipmentNumber?: string | null;
  invoiceId?: string | null;
  customerName?: string | null;
  issueDate: string;
  status: string;
  courierTrackingNo?: string | null;
  filePlaceholder?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface ExportDispatch {
  id: string;
  companyId: string;
  dispatchNumber: string;
  orderId: string;
  orderNumber?: string | null;
  orderCurrency?: string | null;
  orderCustomerName?: string | null;
  shipmentId: string;
  shipmentNumber?: string | null;
  dispatchDate: string;
  transporterName?: string | null;
  truckNo?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  destinationPort?: string | null;
  sealNo?: string | null;
  gatePassNo?: string | null;
  locationId?: string | null;
  status: string;
  salesInvoiceId?: string | null;
  stockPostedAt?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface ExportFinanceLc {
  id: string;
  companyId: string;
  lcAdviceNumber: string;
  orderId: string;
  orderNumber?: string | null;
  orderCurrency?: string | null;
  orderCustomerName?: string | null;
  issuingBank: string;
  advisingBank?: string | null;
  applicant: string;
  lcValueForeign: number;
  lcValueBase: number;
  currency: string;
  exchangeRate: number;
  exchangeRateDate?: string | null;
  rateSource?: string | null;
  baseCurrencyCode?: string | null;
  expiryDate?: string | null;
  latestShipmentDate?: string | null;
  presentationDays: number;
  discrepancyStatus: string;
  status: string;
  notes?: string | null;
  createdAt: string;
}

export interface ExportReceipt {
  id: string;
  companyId: string;
  receiptNumber: string;
  orderId: string;
  orderNumber?: string | null;
  orderCurrency?: string | null;
  proformaId?: string | null;
  invoiceId?: string | null;
  customerId: string;
  customerName: string;
  receiptDate: string;
  receiptType: 'Advance' | 'Settlement' | string;
  currency: string;
  exchangeRate: number;
  exchangeRateDate?: string | null;
  rateSource?: string | null;
  baseCurrencyCode?: string | null;
  foreignAmount: number;
  grossBase: number;
  bankChargesBase: number;
  netBase: number;
  fxGainLossBase: number;
  appliedBase: number;
  bankAccountId?: string | null;
  nostroAccountRef?: string | null;
  status: string;
  salesPaymentId?: string | null;
  journalEntryId?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface ExportExpense {
  id: string;
  companyId: string;
  expenseNumber: string;
  orderId?: string | null;
  orderNumber?: string | null;
  orderCurrency?: string | null;
  orderCustomerName?: string | null;
  shipmentId?: string | null;
  expenseType: string;
  date: string;
  description?: string | null;
  currency: string;
  exchangeRate: number;
  exchangeRateDate?: string | null;
  rateSource?: string | null;
  baseCurrencyCode?: string | null;
  amountForeign: number;
  amountBase: number;
  accountId?: string | null;
  bankAccountId?: string | null;
  journalEntryId?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
}

export interface ExportSettings {
  id: string;
  companyId: string;
  defaultIncoterm: string;
  defaultPortOfLoading?: string | null;
  defaultPortOfDischarge?: string | null;
  defaultPaymentTerms?: string | null;
  defaultCurrency?: string | null;
  defaultLocationId?: string | null;
  autoPostInvoice: boolean;
  requireCustomsBeforeDispatch: boolean;
  requireInspectionBeforeDispatch: boolean;
  allowNegativeStock: boolean;
  defaultFreightAccountId?: string | null;
  defaultDutyAccountId?: string | null;
  defaultBankChargesAccountId?: string | null;
  defaultFxGainAccountId?: string | null;
  defaultFxLossAccountId?: string | null;
  defaultAdvanceAccountId?: string | null;
}

export interface ExportDashboard {
  reportingCurrency: string;
  range: { start: string; end: string; fiscalYearId?: string | null };
  kpis: {
    openInquiries: number;
    openQuotations: number;
    openOrders: number;
    pendingApprovals: number;
    contractedValue: number;
    invoicedValue: number;
    receiptsValue: number;
    advanceValue: number;
    receivableValue: number;
    invoiceCount: number;
    shipmentsInTransit: number;
    documentsCount: number;
  };
  conversionWarnings: string[];
  byCountry: Array<{ country: string; value: number; orders: number }>;
  monthly: Array<{ month: string; contracted: number; invoiced: number }>;
  shipmentStatus: Record<string, number>;
  recentOrders: ExportOrder[];
  liveShipments: ExportShipment[];
  recentReceipts: ExportReceipt[];
}

export interface ExportReports {
  reportingCurrency: string;
  range: { start: string; end: string; fiscalYearId?: string | null };
  filters: { currency?: string | null; customerId?: string | null };
  summary: {
    inquiryCount: number;
    quotationCount: number;
    orderCount: number;
    contractedValue: number;
    invoicedValue: number;
    paidValue: number;
    outstandingValue: number;
    advanceValue: number;
    settlementValue: number;
    expenseValue: number;
    grossMarginValue: number;
  };
  conversionWarnings: string[];
  byCountry: Array<{ country: string; orders: number; contracted: number; invoiced: number }>;
  statusBreakdown: Record<string, number>;
  aging: Array<{ bucket: string; amount: number; count: number }>;
}

const BASE = '/api/export';

async function list<T>(path: string, query: ExportListQuery = {}): Promise<Paginated<T>> {
  return unwrap<Paginated<T>>(await apiClient.get(`${BASE}${path}${buildQuery(query)}`));
}

async function get<T>(path: string): Promise<T> {
  return unwrap<T>(await apiClient.get(`${BASE}${path}`));
}

async function post<T>(path: string, body: any = {}): Promise<T> {
  return unwrap<T>(await apiClient.post(`${BASE}${path}`, body));
}

async function put<T>(path: string, body: any = {}): Promise<T> {
  return unwrap<T>(await apiClient.put(`${BASE}${path}`, body));
}

async function patch<T>(path: string, body: any = {}): Promise<T> {
  return unwrap<T>(await apiClient.patch(`${BASE}${path}`, body));
}

export const exportApi = {
  // Dashboard / reports / settings
  getDashboard: async (query: ExportListQuery = {}) =>
    unwrap<ExportDashboard>(await apiClient.get(`${BASE}/dashboard${buildQuery(query)}`)),
  getReports: async (query: ExportListQuery = {}) =>
    unwrap<ExportReports>(await apiClient.get(`${BASE}/reports${buildQuery(query)}`)),
  listPorts: async (search = ''): Promise<ExportPort[]> => {
    const data = unwrap<ExportPort[] | { items: ExportPort[] }>(
      await apiClient.get(`${BASE}/ports${buildQuery({ search })}`)
    );
    return Array.isArray(data) ? data : data?.items || [];
  },
  getSettings: () => get<ExportSettings>('/settings'),
  updateSettings: (body: Partial<ExportSettings>) => put<ExportSettings>('/settings', body),

  // Inquiries
  listInquiries: (query?: ExportListQuery) => list<ExportInquiry>('/inquiries', query),
  getInquiry: (id: string) => get<ExportInquiry>(`/inquiries/${id}`),
  createInquiry: (body: any) => post<ExportInquiry>('/inquiries', body),
  updateInquiry: (id: string, body: any) => put<ExportInquiry>(`/inquiries/${id}`, body),
  updateInquiryStatus: (id: string, status: string, extra: Record<string, unknown> = {}) =>
    patch<ExportInquiry>(`/inquiries/${id}/status`, { status, ...extra }),
  convertInquiry: (id: string, body: any = {}) =>
    post<ExportQuotation>(`/inquiries/${id}/convert-to-quotation`, body),

  // Quotations
  listQuotations: (query?: ExportListQuery) => list<ExportQuotation>('/quotations', query),
  getQuotation: (id: string) => get<ExportQuotation>(`/quotations/${id}`),
  createQuotation: (body: any) => post<ExportQuotation>('/quotations', body),
  updateQuotation: (id: string, body: any) => put<ExportQuotation>(`/quotations/${id}`, body),
  updateQuotationStatus: (id: string, status: string) =>
    patch<ExportQuotation>(`/quotations/${id}/status`, { status }),
  approveQuotation: (id: string) => post<ExportQuotation>(`/quotations/${id}/approve`),
  convertQuotation: (id: string, body: any = {}) =>
    post<ExportOrder>(`/quotations/${id}/convert-to-order`, body),

  // Orders
  listOrders: (query?: ExportListQuery) => list<ExportOrder>('/orders', query),
  getOrder: (id: string) => get<ExportOrder>(`/orders/${id}`),
  getOrderFull: (id: string) => get<ExportOrderFull>(`/orders/${id}/full`),
  createOrder: (body: any) => post<ExportOrder>('/orders', body),
  updateOrder: (id: string, body: any) => put<ExportOrder>(`/orders/${id}`, body),
  approveOrder: (id: string) => post<ExportOrder>(`/orders/${id}/approve`),
  updateOrderStatus: (id: string, status: string) =>
    patch<ExportOrder>(`/orders/${id}/status`, { status }),

  // Proformas
  listProformas: (query?: ExportListQuery) => list<ExportProforma>('/proformas', query),
  getProforma: (id: string) => get<ExportProforma>(`/proformas/${id}`),
  createProforma: (body: any) => post<ExportProforma>('/proformas', body),
  updateProforma: (id: string, body: any) => put<ExportProforma>(`/proformas/${id}`, body),
  updateProformaStatus: (id: string, status: string) =>
    patch<ExportProforma>(`/proformas/${id}/status`, { status }),

  // Packing
  listPackings: (query?: ExportListQuery) => list<ExportPacking>('/packing', query),
  getPacking: (id: string) => get<ExportPacking>(`/packing/${id}`),
  createPacking: (body: any) => post<ExportPacking>('/packing', body),
  updatePacking: (id: string, body: any) => put<ExportPacking>(`/packing/${id}`, body),
  updatePackingStatus: (id: string, status: string, extra: any = {}) =>
    patch<ExportPacking>(`/packing/${id}/status`, { status, ...extra }),

  // Shipments
  listShipments: (query?: ExportListQuery) => list<ExportShipment>('/shipments', query),
  getShipment: (id: string) => get<ExportShipment>(`/shipments/${id}`),
  createShipment: (body: any) => post<ExportShipment>('/shipments', body),
  updateShipment: (id: string, body: any) => put<ExportShipment>(`/shipments/${id}`, body),
  updateShipmentStatus: (id: string, status: string, extra: any = {}) =>
    patch<ExportShipment>(`/shipments/${id}/status`, { status, ...extra }),

  // Customs
  listCustoms: (query?: ExportListQuery) => list<ExportCustoms>('/customs', query),
  getCustoms: (id: string) => get<ExportCustoms>(`/customs/${id}`),
  createCustoms: (body: any) => post<ExportCustoms>('/customs', body),
  updateCustoms: (id: string, body: any) => put<ExportCustoms>(`/customs/${id}`, body),
  updateCustomsStatus: (id: string, status: string, extra: any = {}) =>
    patch<ExportCustoms>(`/customs/${id}/status`, { status, ...extra }),

  // Documents
  listDocuments: (query?: ExportListQuery) => list<ExportDocument>('/documents', query),
  getDocument: (id: string) => get<ExportDocument>(`/documents/${id}`),
  createDocument: (body: any) => post<ExportDocument>('/documents', body),
  updateDocument: (id: string, body: any) => put<ExportDocument>(`/documents/${id}`, body),
  updateDocumentStatus: (id: string, status: string, extra: any = {}) =>
    patch<ExportDocument>(`/documents/${id}/status`, { status, ...extra }),

  // Dispatch
  listDispatches: (query?: ExportListQuery) => list<ExportDispatch>('/dispatch', query),
  getDispatch: (id: string) => get<ExportDispatch>(`/dispatch/${id}`),
  createDispatch: (body: any) => post<ExportDispatch>('/dispatch', body),
  updateDispatch: (id: string, body: any) => put<ExportDispatch>(`/dispatch/${id}`, body),
  updateDispatchStatus: (id: string, status: string) =>
    patch<ExportDispatch>(`/dispatch/${id}/status`, { status }),

  // Finance LC
  listLcs: (query?: ExportListQuery) => list<ExportFinanceLc>('/finance/lcs', query),
  getLc: (id: string) => get<ExportFinanceLc>(`/finance/lcs/${id}`),
  createLc: (body: any) => post<ExportFinanceLc>('/finance/lcs', body),
  updateLc: (id: string, body: any) => put<ExportFinanceLc>(`/finance/lcs/${id}`, body),
  updateLcStatus: (id: string, status: string, extra: any = {}) =>
    patch<ExportFinanceLc>(`/finance/lcs/${id}/status`, { status, ...extra }),

  // Receipts
  listReceipts: (query?: ExportListQuery) => list<ExportReceipt>('/receipts', query),
  getReceipt: (id: string) => get<ExportReceipt>(`/receipts/${id}`),
  createReceipt: (body: any) => post<ExportReceipt>('/receipts', body),
  updateReceipt: (id: string, body: any) => put<ExportReceipt>(`/receipts/${id}`, body),
  updateReceiptStatus: (id: string, status: string, extra: any = {}) =>
    patch<ExportReceipt>(`/receipts/${id}/status`, { status, ...extra }),
  postReceipt: (id: string, body: any = {}) => post<ExportReceipt>(`/receipts/${id}/post`, body),

  // Expenses
  listExpenses: (query?: ExportListQuery) => list<ExportExpense>('/expenses', query),
  getExpense: (id: string) => get<ExportExpense>(`/expenses/${id}`),
  createExpense: (body: any) => post<ExportExpense>('/expenses', body),
  updateExpense: (id: string, body: any) => put<ExportExpense>(`/expenses/${id}`, body),
  postExpense: (id: string) => post<ExportExpense>(`/expenses/${id}/post`),
  reverseExpense: (id: string) => post<ExportExpense>(`/expenses/${id}/reverse`),
};

export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (!error) return fallback;
  const anyErr = error as any;
  return (
    anyErr?.response?.data?.message ||
    anyErr?.response?.data?.error ||
    anyErr?.message ||
    fallback
  );
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatMoney(value: number | string | null | undefined, currency = 'USD'): string {
  const amount = Number(value ?? 0);
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export default exportApi;
