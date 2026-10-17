/**
 * Import Module API Client
 * Connects every Import page to the real backend /api/import/* endpoints.
 * Uses the shared apiClient which handles auth, company header, token refresh.
 */
import { apiClient } from '@/lib/api-client';


function buildQuery(params: Record<string, any>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      q.set(k, String(v));
    }
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

/** apiClient returns { success, message, data } and does not throw — unwrap or raise. */
function unwrapImport<T>(res: any, fallbackMsg = 'Request failed'): T {
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
        field: res?.data?.field,
        code: res?.data?.code || res?.data?.data?.code,
      },
      status: res?.statusCode || 400,
    };
    throw err;
  }
  const body = res.data;
  if (body && typeof body === 'object' && 'data' in body) return body.data as T;
  return body as T;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ImportKpis {
  totalImportOrders: number;
  totalImportValueUsd: number;
  activeShipmentsInTransit: number;
  inTransitValueUsd: number;
  customsPendingClearance: number;
  customsDutyPayableUsd: number;
  completedReceivedOrders: number;
  totalLandedCostAllocatedUsd: number;
  averageLandedCostExpensePct: number;
  supplierLiabilitiesUsd: number;
  recentOrders: ImportPurchaseOrder[];
  liveShipments: ImportShipment[];
  pendingDocs: ImportDocument[];
}

export interface ImportPort {
  id: string;
  unLocode: string;
  name: string;
  country: string;
  countryCode?: string | null;
  portType?: string;
  isActive?: boolean;
  aliases?: string[] | null;
}

export interface ImportRfqStatusEvent {
  id: string;
  at: string;
  userId?: string | null;
  userName?: string | null;
  from?: string | null;
  to?: string | null;
  reason?: string | null;
  action?: string;
}

export interface ImportRfq {
  id: string;
  companyId: string;
  rfqNumber: string;
  supplierId?: string;
  supplierName: string;
  supplierCountry?: string;
  countryOfDispatch?: string | null;
  destinationCountry?: string | null;
  currency: string;
  status: string;
  incoterm?: string;
  portId?: string | null;
  portOfDischarge?: string;
  port?: ImportPort | null;
  expectedDelivery?: string;
  selectedQuotationId?: string;
  singleSourceJustification?: string | null;
  awardedBy?: string | null;
  awardedAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  awardedByUser?: { id: string; name?: string | null; email?: string | null } | null;
  approvedByUser?: { id: string; name?: string | null; email?: string | null } | null;
  statusHistory?: ImportRfqStatusEvent[];
  localPurchaseWarning?: string | null;
  quotationsLocked?: boolean;
  activeQuotationCount?: number;
  distinctActiveSupplierCount?: number;
  /** True when justification text exists but RFQ now has 2+ distinct active suppliers */
  singleSourceJustificationHistorical?: boolean;
  issueDate?: string;
  date?: string;
  validUntil?: string;
  notes?: string;
  specialNotes?: string;
  commercialNotes?: string;
  totalEstimatedUsd?: number;
  targetTotal?: number;
  awardedTotal?: number | null;
  items: ImportRfqItem[];
  quotations?: ImportSupplierQuotation[];
  purchaseOrders?: Array<{ id: string; poNumber: string; status: string }>;
  warnings?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ImportRfqItem {
  id: string;
  rfqId: string;
  productId?: string;
  productName: string;
  sku?: string;
  hsCode?: string;
  /** Current product-master HS (enriched by getRfq) for refresh comparison */
  productHsCode?: string;
  quantity: number;
  uom: string;
  targetPriceUsd?: number;
  quotedPriceUsd?: number;
  estimatedUnitPrice?: number;
}

export interface ImportPurchaseOrder {
  id: string;
  companyId: string;
  poNumber: string;
  rfqId?: string;
  rfqRef?: string;
  piRef?: string;
  orderDate: string;
  supplierId?: string;
  supplierName: string;
  supplierCountry?: string;
  incoterm: string;
  currency: string;
  exchangeRateToUsd: number;
  subtotalForeign: number;
  totalUsd: number;
  paymentTerms?: string;
  portOfLoading?: string;
  portOfEntry?: string;
  estimatedArrival?: string;
  status: string;
  purchaseOrderId?: string;
  notes?: string;
  quotationId?: string;
  namedPlace?: string;
  originCountry?: string;
  shippingMethod?: string;
  buyerName?: string;
  internalRef?: string;
  supplierReference?: string;
  exchangeRateDate?: string;
  estimatedFreightUsd?: number;
  estimatedInsuranceUsd?: number;
  estimatedDutyUsd?: number;
  advanceRequiredPercent?: number;
  lcRequired?: boolean;
  expectedDeliveryDate?: string;
  items: ImportPoItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ImportPoItem {
  id: string;
  importPoId: string;
  productId?: string;
  productName: string;
  sku?: string;
  hsCode?: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  totalAmount: number;
}

export interface ImportProformaInvoiceItem {
  id?: string;
  importPoItemId?: string;
  productId?: string;
  productName: string;
  sku?: string;
  supplierItemCode?: string;
  description?: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  taxAmount?: number;
  lineTotal?: number;
  hsCode?: string;
  countryOfOrigin?: string;
  netWeightKg?: number;
  grossWeightKg?: number;
  notes?: string;
}

export interface ImportFxPreview {
  currencyCode: string;
  baseCurrencyCode: string;
  exchangeRate: number;
  exchangeRateDate: string;
  rateSource?: string;
  foreignAmount: number;
  baseAmount: number;
}

export interface ImportProformaInvoice {
  id: string;
  companyId: string;
  piNumber: string;
  importPoId?: string;
  poRef?: string;
  supplierId?: string;
  supplierName: string;
  supplierReference?: string;
  issueDate: string;
  validUntil?: string;
  expectedPaymentDate?: string;
  currency: string;
  exchangeRateToUsd?: number;
  exchangeRateDate?: string;
  rateSource?: string;
  baseCurrencyCode?: string;
  amountForeign: number;
  amountUsd: number;
  merchandiseSubtotal?: number;
  discountTotal?: number;
  taxTotal?: number;
  freightEstimate?: number;
  insuranceEstimate?: number;
  otherChargesEstimate?: number;
  customsDutyEstimate?: number;
  advanceRequiredPercent: number;
  advanceAmountUsd: number;
  lcRequired: boolean;
  lcNumber?: string;
  bankSwift?: string;
  originCountry?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  portOfEntry?: string;
  incoterm?: string;
  namedPlace?: string;
  shipmentMode?: string;
  paymentTerms?: string;
  balancePaymentTerms?: string;
  paymentSchedule?: string;
  advancePaymentDetails?: Array<{
    amount: number;
    date: string;
    method: string;
    reference?: string | null;
    bank?: string | null;
    paymentMadeId?: string | null;
    recordedAt?: string;
  }> | Record<string, unknown>;
  status: string;
  paymentMadeId?: string | null;
  notes?: string;
  items?: ImportProformaInvoiceItem[];
  importPo?: ImportPurchaseOrder;
  createdAt: string;
  updatedAt?: string;
}

export interface ImportCarrier {
  id: string;
  companyId: string;
  code: string;
  name: string;
  carrierType: string;
  scacCode?: string | null;
  iataCode?: string | null;
  country?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  servicesNotes?: string;
  trackingUrlTemplate?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportShipmentItem {
  id?: string;
  importPoItemId?: string;
  productId?: string;
  productName: string;
  sku?: string;
  quantity: number;
  uom?: string;
  packageCount?: number;
  netWeightKg?: number;
  grossWeightKg?: number;
}

export interface ImportShipmentMilestone {
  key?: string;
  title: string;
  plannedAt?: string | null;
  actualAt?: string | null;
  completed?: boolean;
  dateLabel?: string;
  note?: string | null;
  location?: string | null;
  date?: string;
}

export interface ImportShipment {
  id: string;
  companyId: string;
  shipmentNumber: string;
  importPoId?: string;
  poRef?: string;
  supplierName?: string;
  carrierId?: string;
  carrier?: string;
  carrierManualDesc?: string;
  carrierDisplay?: string | null;
  shipmentMode?: string;
  loadType?: string | null;
  bookingRef?: string;
  trackingRef?: string;
  blNumber?: string;
  blType?: string | null;
  originPort?: string;
  portOfEntry?: string;
  originPortLabel?: string | null;
  destinationPortLabel?: string | null;
  routeLabel?: string | null;
  originUnLocode?: string | null;
  destinationUnLocode?: string | null;
  finalDeliveryLocation?: string;
  shippingInstructions?: string;
  vesselFlight?: string;
  vesselName?: string | null;
  voyageNumber?: string | null;
  consignee?: string | null;
  notifyParty?: string | null;
  proformaId?: string | null;
  piRef?: string | null;
  financeLcId?: string | null;
  lcRef?: string | null;
  incoterm?: string | null;
  currency?: string | null;
  containerNo?: string;
  containerType?: string;
  sealNumber?: string;
  packageCount?: number;
  netWeightKg?: number;
  grossWeightKg?: number;
  cbm?: number;
  estimatedFreightUsd?: number;
  estimatedInsuranceUsd?: number;
  currentMilestone?: string;
  milestones?: ImportShipmentMilestone[];
  etaHistory?: Array<{ from?: string; to?: string; by?: string; at?: string; reason?: string | null }>;
  /** @deprecated FE alias — prefer carrier / carrierDisplay */
  shipmentMethod?: string;
  carrierName?: string;
  containerNumber?: string;
  blAwbNumber?: string;
  destinationPort?: string;
  etd?: string;
  eta?: string;
  actualDeparture?: string;
  actualArrival?: string;
  shipmentStatus: string;
  notes?: string;
  lcWarning?: string;
  items?: ImportShipmentItem[];
  carrierMaster?: ImportCarrier;
  proforma?: { id: string; piNumber: string; status?: string } | null;
  financeLc?: {
    id: string;
    lcNumber: string;
    status?: string;
    latestShipmentDate?: string;
    expiryDate?: string;
  } | null;
  linkedProformas?: Array<{ id: string; piNumber: string; status?: string }>;
  linkedLcs?: Array<{
    id: string;
    lcNumber: string;
    status?: string;
    latestShipmentDate?: string | null;
    expiryDate?: string | null;
  }>;
  deliveredAt?: string | null;
  auditTrail?: Array<{
    id: string;
    action: string;
    label?: string;
    reason?: string | null;
    userLabel?: string;
    details?: { from?: string; to?: string; previousStatus?: string; nextStatus?: string; reason?: string };
    createdAt: string;
    user?: { firstName?: string; lastName?: string; email?: string };
  }>;
  createdAt: string;
}

export interface ImportEligibleShipmentPo {
  id: string;
  poNumber: string;
  status: string;
  supplierId?: string;
  supplierName: string;
  currency?: string;
  incoterm?: string;
  portOfLoading?: string;
  portOfEntry?: string;
  orderDate?: string;
  remainingTotal: number;
  items: Array<{
    id: string;
    productId?: string;
    productName: string;
    sku?: string;
    uom?: string;
    quantity: number;
    shippedQty: number;
    remainingQty: number;
  }>;
  proformas?: Array<{ id: string; piNumber: string; status?: string }>;
  financeLcs?: Array<{
    id: string;
    lcNumber: string;
    latestShipmentDate?: string;
    expiryDate?: string;
    status?: string;
  }>;
}

export interface ImportSupplierQuotation {
  id: string;
  companyId: string;
  rfqId: string;
  quotationNumber: string;
  supplierId?: string;
  supplierName: string;
  supplierCountry?: string;
  currency: string;
  exchangeRateToUsd: number;
  incoterm: string;
  paymentTerms?: string;
  leadTimeDays: number;
  freightEstimateUsd: number;
  totalForeign: number;
  totalUsd: number;
  estimatedLandedUsd: number;
  status: string;
  revision?: number;
  supersedesId?: string | null;
  supersededById?: string | null;
  validUntil?: string;
  notes?: string;
  items: Array<{
    id?: string;
    productId?: string;
    productName: string;
    sku?: string;
    quantity: number;
    uom: string;
    unitPrice: number;
    lineTotal: number;
    moq?: number;
    leadTimeDays?: number;
  }>;
  createdAt?: string;
}

export interface ImportCustomsClearanceLine {
  id?: string;
  productName: string;
  sku?: string | null;
  hsCode: string;
  quantity?: number;
  uom?: string;
  assessableValueBase: number;
  dutyRatePct: number;
  dutyAmountBase: number;
  dutySource?: string;
  rateOverride?: boolean;
  overrideReason?: string | null;
  additionalDutyRatePct?: number;
  additionalDutyBase?: number;
  regulatoryDutyRatePct?: number;
  regulatoryDutyBase?: number;
  vatRatePct: number;
  vatAmountBase: number;
  rateOverride?: boolean;
  overrideReason?: string | null;
}

export interface ImportCustomsClearance {
  id: string;
  companyId: string;
  entryNumber?: string;
  billOfEntryNo?: string;
  declarationNumber?: string | null;
  declarationDisplay?: string;
  internalRef?: string;
  importPoId?: string;
  poRef?: string;
  shipmentId?: string;
  shipmentRef?: string;
  portOfEntry?: string;
  portLabel?: string;
  customsOffice?: string | null;
  declarationDate?: string;
  assessmentDate?: string | null;
  clearanceDate?: string;
  releaseDate?: string | null;
  customsBroker?: string;
  brokerContact?: string;
  cifValueUsd?: number;
  declarationCurrency?: string;
  baseCurrencyCode?: string;
  exchangeRateToUsd?: number;
  exchangeRateDate?: string;
  rateSource?: string | null;
  foreignGoodsValue?: number | null;
  freightForeign?: number | null;
  insuranceForeign?: number | null;
  customsDutyRatePct?: number;
  customsDutyUsd?: number;
  additionalDutyUsd?: number | null;
  regulatoryDutyUsd?: number | null;
  advanceIncomeTaxUsd?: number | null;
  importVatRatePct?: number;
  importVatUsd?: number;
  vatUsd?: number;
  portHandlingChargesUsd?: number;
  portHandlingUsd?: number;
  clearingBrokerFeeUsd?: number | null;
  demurrageDays?: number | null;
  demurrageChargesUsd?: number | null;
  inspectionFeeUsd?: number;
  penaltiesUsd?: number;
  clearingAgencyFeeUsd?: number;
  otherChargesUsd?: number;
  totalCustomsPayableUsd: number;
  hsCodes?: string | string[] | Record<string, unknown> | null;
  hsCodeList?: string[];
  hsTariffDisplay?: string | null;
  tariffSummary?: string | null;
  rateSourceLabel?: string;
  currentPoExchangeRate?: number | null;
  rateStale?: boolean;
  canRecalculateRate?: boolean;
  canRefreshTariff?: boolean;
  payableAmount?: number;
  totalPaid?: number;
  balanceDue?: number;
  lastJournalEntryId?: string | null;
  lastJournalEntryNumber?: string | null;
  payments?: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    reference: string;
    bankAccountId: string;
    bankAccountName?: string | null;
    journalEntryId?: string | null;
    journalEntryNumber?: string | null;
  }>;
  paymentResult?: {
    journalEntryId?: string;
    journalEntryNumber?: string;
    status?: string;
    totalPaid?: number;
    balanceDue?: number;
  };
  recalculation?: {
    oldTotals: Record<string, number>;
    newTotals: Record<string, number>;
    reason?: string;
  };
  tariffRefresh?: {
    oldTotals: Record<string, unknown>;
    newTotals: Record<string, unknown>;
    reason?: string;
  };
  lines?: ImportCustomsClearanceLine[];
  clearanceStatus: string;
  dutyPaymentRef?: string;
  dutyPaymentDate?: string | null;
  dutyPaymentMethod?: string | null;
  dutyPaymentBank?: string | null;
  dutyPaymentAmount?: number | null;
  holdReason?: string;
  discrepancyNotes?: string;
  fxReviewFlag?: boolean;
  fxReviewNote?: string | null;
  portCountryWarning?: string | null;
  linkedProformas?: Array<{ id: string; piNumber: string; status?: string }>;
  linkedLcs?: Array<{ id: string; lcNumber: string; status?: string }>;
  auditTrail?: Array<{
    id: string;
    label?: string;
    reason?: string | null;
    userLabel?: string;
    createdAt: string;
  }>;
  notes?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface ImportCustomsPreview {
  shipmentId: string;
  shipmentNumber?: string;
  importPoId?: string | null;
  poRef?: string;
  currency: string;
  baseCurrencyCode: string;
  exchangeRate: number;
  exchangeRateDate: string;
  rateSource?: string | null;
  foreignGoodsValue: number;
  freightForeign: number;
  insuranceForeign: number;
  includeFreightInsurance: boolean;
  incoterm?: string;
  cifForeign: number;
  cifValueUsd: number;
  portOfEntry?: string | null;
  portCountryWarning?: string | null;
  customsOffice?: string | null;
  customsBroker?: string | null;
  defaultVatRatePct: number;
  importVatRatePct: number;
  dutyMode?: string;
  lines: ImportCustomsClearanceLine[];
  customsDutyUsd: number;
  customsDutyRatePct: number;
  additionalDutyUsd?: number;
  regulatoryDutyUsd?: number;
  advanceIncomeTaxUsd?: number;
  importVatUsd: number;
  totalCustomsPayableUsd: number;
  portHandlingChargesUsd?: number;
  clearingBrokerFeeUsd?: number;
  demurrageChargesUsd?: number;
  calculationNote?: string;
  proformas?: Array<{ id: string; piNumber: string; status?: string }>;
  financeLcs?: Array<{ id: string; lcNumber: string; status?: string }>;
}

export interface ImportDocument {
  id: string;
  companyId: string;
  documentType?: string;
  docType?: string;
  docNumber?: string;
  importPoId?: string;
  poRef?: string;
  shipmentId?: string;
  shipmentRef?: string;
  documentNumber?: string;
  issuer?: string;
  fileName?: string;
  filePlaceholder?: string;
  fileUrl?: string;
  issueDate?: string;
  expiryDate?: string;
  originalReceived?: boolean;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface ImportGrn {
  id: string;
  companyId: string;
  grnNumber: string;
  importPoId?: string;
  shipmentId?: string;
  warehouseId?: string;
  receivedDate: string;
  receivedBy?: string;
  status: string;
  isPosted: boolean;
  journalEntryId?: string;
  goodsReceivingId?: string;
  notes?: string;
  items: ImportGrnItem[];
  createdAt: string;
}

export interface ImportGrnItem {
  id: string;
  grnId: string;
  productId?: string;
  productName: string;
  sku?: string;
  orderedQty: number;
  receivedQty: number;
  rejectedQty: number;
  uom: string;
  unitCostUsd: number;
  totalCostUsd: number;
  locationId?: string;
}

export interface ImportLandedCost {
  id: string;
  companyId: string;
  /** @deprecated FE alias — prefer allocationNumber */
  lcaNumber?: string;
  allocationNumber?: string;
  importPoId?: string;
  poRef?: string;
  /** @deprecated FE alias — prefer grnId */
  importGrnId?: string;
  grnId?: string;
  grnRef?: string;
  allocationMethod: string;
  purchaseFobTotalUsd: number;
  oceanFreightUsd: number;
  marineInsuranceUsd: number;
  customsDutyUsd: number;
  portDemurrageAndHandlingUsd: number;
  clearingAgencyChargesUsd: number;
  inlandTransportationUsd: number;
  otherChargesUsd?: number;
  totalLandedExpensesUsd: number;
  /** @deprecated FE alias — prefer totalFinalLandedCostUsd */
  totalLandedCostUsd?: number;
  totalFinalLandedCostUsd?: number;
  isPosted?: boolean;
  status?: string;
  journalEntryId?: string;
  reversedAt?: string | null;
  notes?: string;
  items: ImportLandedCostItem[];
  createdAt: string;
}

export interface ImportLandedCostItem {
  id: string;
  lcaId?: string;
  landedCostId?: string;
  productId?: string;
  productName: string;
  receivedQty?: number;
  qty?: number;
  unitFobCostUsd?: number;
  unitFobUsd?: number;
  allocatedFreightUsd?: number;
  allocatedDutyUsd?: number;
  allocatedInsuranceUsd?: number;
  allocatedOtherUsd?: number;
  allocatedExpensePerUnitUsd?: number;
  totalLandedUnitCostUsd?: number;
  finalLandedCostPerUnitUsd?: number;
  originalCostVariancePct?: number;
}

export interface ImportFinanceLc {
  id: string;
  companyId: string;
  lcNumber: string;
  importPoId?: string;
  poRef?: string;
  piRef?: string;
  proformaId?: string;
  shipmentId?: string;
  supplierId?: string;
  applicant?: string;
  incoterm?: string;
  issuingBank: string;
  advisingBank?: string;
  /** @deprecated FE alias — API field is beneficiary */
  beneficiaryName?: string;
  beneficiary?: string;
  /** @deprecated FE alias — API field is currency */
  lcCurrency?: string;
  currency?: string;
  lcAmount: number;
  /** @deprecated FE alias — API field is lcAmountBase */
  lcAmountUsd?: number;
  lcAmountBase?: number;
  exchangeRateToUsd?: number;
  amountTolerancePercent?: number;
  amountDrawn?: number;
  balance?: number;
  remainingBalance?: number;
  marginPercent?: number;
  marginDeposit?: number;
  marginDepositForeign?: number;
  cashMarginBlockedUsd?: number;
  paymentTenor?: string;
  usanceDays?: number;
  issuanceDate?: string;
  openDate?: string;
  expiryDate?: string;
  latestShipmentDate?: string;
  presentationPeriodDays?: number;
  confirmed?: boolean;
  partialShipmentAllowed?: boolean;
  transshipmentAllowed?: boolean;
  portOfLoading?: string;
  portOfDischarge?: string;
  lcType: string;
  /** @deprecated FE alias — API field is status */
  lcStatus?: string;
  status?: string;
  bankChargesUsd: number;
  daysToExpiry?: number | null;
  expiringSoon?: boolean;
  amendments?: Array<{
    id?: string;
    at?: string;
    by?: string;
    reason?: string | null;
    changes?: Record<string, { from?: unknown; to?: unknown }>;
  }>;
  auditTrail?: Array<{
    id: string;
    action: string;
    details?: { from?: string; to?: string; previousStatus?: string; nextStatus?: string };
    userId?: string;
    createdAt: string;
    user?: { id: string; firstName?: string; lastName?: string; email?: string };
  }>;
  proforma?: { id: string; piNumber: string; amountForeign?: number; currency?: string; status?: string };
  shipment?: { id: string; shipmentNumber: string; status?: string; eta?: string };
  importPo?: ImportPurchaseOrder;
  notes?: string;
  createdBy?: string;
  issuedBy?: string;
  approvedBy?: string;
  createdAt: string;
}

export interface ImportEligibleFinancePo {
  id: string;
  poNumber: string;
  status: string;
  supplierId?: string;
  supplierName: string;
  supplierCountry?: string;
  currency: string;
  incoterm?: string;
  portOfLoading?: string;
  portOfEntry?: string;
  subtotalForeign: number;
  totalUsd?: number;
  coveredByLc: number;
  outstandingForLc: number;
  fullyCovered: boolean;
  proformas?: Array<{
    id: string;
    piNumber: string;
    amountForeign: number;
    currency: string;
    status: string;
    portOfLoading?: string;
    portOfDischarge?: string;
    portOfEntry?: string;
    incoterm?: string;
    advanceRequiredPercent?: number;
    lcRequired?: boolean;
  }>;
}

export interface ImportSupplierBillItem {
  id?: string;
  importPoItemId?: string;
  productId?: string;
  productName: string;
  sku?: string;
  invoicedQty: number;
  unitPrice: number;
  lineTotal?: number;
  taxAmount?: number;
  discountAmount?: number;
}

export interface ImportSupplierBill {
  id: string;
  companyId: string;
  billNumber: string;
  importPoId?: string;
  poRef?: string;
  importGrnId?: string;
  supplierId?: string;
  supplierName: string;
  supplierInvoiceNumber?: string;
  /** @deprecated FE alias — API field is currency */
  invoiceCurrency?: string;
  currency?: string;
  /** @deprecated FE alias — API field is totalAmountForeign */
  invoiceAmountForeign?: number;
  totalAmountForeign?: number;
  exchangeRate?: number;
  exchangeRateToUsd?: number;
  exchangeRateDate?: string;
  baseCurrencyCode?: string;
  /** @deprecated FE alias — API field is totalAmountUsd */
  invoiceAmountUsd?: number;
  totalAmountUsd?: number;
  paidUsd?: number;
  paidAmountUsd?: number;
  balanceUsd?: number;
  matchStatus?: string;
  variancePercent?: number;
  billDate?: string;
  dueDate?: string;
  status: string;
  journalEntryId?: string | null;
  purchaseInvoiceId?: string;
  items?: ImportSupplierBillItem[];
  notes?: string;
  createdAt: string;
}

export interface ImportSettings {
  id?: string;
  companyId: string;
  defaultIncoterm: string;
  defaultCurrency: string;
  defaultPortOfEntry?: string | null;
  defaultCustomsBroker?: string | null;
  /** When true, creating an Import PO also creates a linked core PurchaseOrder */
  autoCreatePurchaseOrder: boolean;
  /** When true, approver must be a different user from the awarder */
  requireSeparateRfqApprover?: boolean;
  /** When true, LC creator cannot issue/approve the same LC */
  requireSeparateLcApprover?: boolean;
  /** When true, prefer Original B/L for release */
  requirePhysicalOriginalBl?: boolean;
  requireSeparateCustomsAssessor?: boolean;
  defaultCustomsDutyRatePct?: number;
  defaultImportVatRatePct?: number;
  companyCountryCode?: string | null;
  defaultReceivingLocationId?: string | null;
  clearingAccountId?: string | null;
  customsDutyAccountId?: string | null;
  freightAccountId?: string | null;
  insuranceAccountId?: string | null;
  handlingAccountId?: string | null;
  inventoryAssetAccountId?: string | null;
}


export const importApi = {
  getDashboard: async (): Promise<ImportKpis> => {
    const res = await apiClient.get('/api/import/dashboard');
    return res.data.data;
  },

  listPorts: async (params: Record<string, any> = {}): Promise<ImportPort[]> => {
    const res = await apiClient.get(`/api/import/ports${buildQuery(params)}`);
    return res.data.data;
  },

  listRfqs: async (params: Record<string, any> = {}): Promise<PaginatedResponse<ImportRfq>> => {
    const res = await apiClient.get(`/api/import/rfqs${buildQuery(params)}`);
    return res.data.data;
  },

  getRfq: async (id: string): Promise<ImportRfq> => {
    const res = await apiClient.get(`/api/import/rfqs/${id}`);
    return res.data.data;
  },

  createRfq: async (data: Partial<ImportRfq> & { portId?: string; specialNotes?: string }): Promise<ImportRfq> => {
    const res = await apiClient.post('/api/import/rfqs', data);
    return res.data.data;
  },

  updateRfq: async (id: string, data: Partial<ImportRfq>): Promise<ImportRfq> => {
    const res = await apiClient.put(`/api/import/rfqs/${id}`, data);
    return res.data.data;
  },

  deleteRfq: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiClient.delete(`/api/import/rfqs/${id}`);
    return res.data.data;
  },

  listQuotations: async (rfqId: string, params: Record<string, any> = {}): Promise<ImportSupplierQuotation[]> => {
    const res = await apiClient.get(`/api/import/rfqs/${rfqId}/quotations${buildQuery(params)}`);
    return res.data.data;
  },

  createQuotation: async (rfqId: string, data: Partial<ImportSupplierQuotation>): Promise<ImportSupplierQuotation> => {
    const res = await apiClient.post(`/api/import/rfqs/${rfqId}/quotations`, data);
    return res.data.data;
  },

  selectQuotation: async (
    quotationId: string,
    body: {
      singleSourceJustification?: string;
      changeReason?: string;
      reason?: string;
    } = {}
  ): Promise<ImportSupplierQuotation> => {
    const res = await apiClient.post(`/api/import/quotations/${quotationId}/select`, body);
    return res.data.data;
  },

  reopenRfq: async (
    rfqId: string,
    body: { reason: string }
  ): Promise<ImportRfq> => {
    const res = await apiClient.post(`/api/import/rfqs/${rfqId}/reopen`, body);
    return res.data.data;
  },

  refreshRfqItemHsCode: async (rfqId: string, itemId: string): Promise<ImportRfq> => {
    const res = await apiClient.post(`/api/import/rfqs/${rfqId}/items/${itemId}/refresh-hs-code`, {});
    return res.data.data;
  },

  convertRfqToPo: async (
    rfqId: string,
    body: Record<string, unknown> = {}
  ): Promise<{ purchaseOrder: ImportPurchaseOrder; rfq: ImportRfq }> => {
    const res = await apiClient.post(`/api/import/rfqs/${rfqId}/convert-to-po`, body);
    return res.data.data;
  },

  listPurchaseOrders: async (params: Record<string, any> = {}): Promise<PaginatedResponse<ImportPurchaseOrder>> => {
    const res = await apiClient.get(`/api/import/purchase-orders${buildQuery(params)}`);
    return res.data.data;
  },

  getPurchaseOrder: async (id: string): Promise<ImportPurchaseOrder> => {
    const res = await apiClient.get(`/api/import/purchase-orders/${id}`);
    return res.data.data;
  },

  createPurchaseOrder: async (data: Partial<ImportPurchaseOrder>): Promise<ImportPurchaseOrder> => {
    const res = await apiClient.post('/api/import/purchase-orders', data);
    return res.data.data;
  },

  updatePurchaseOrderStatus: async (id: string, status: string): Promise<ImportPurchaseOrder> => {
    const res = await apiClient.patch(`/api/import/purchase-orders/${id}/status`, { status });
    return res.data.data;
  },

  correctPurchaseOrderFx: async (
    id: string,
    body: {
      exchangeRateToUsd?: number;
      exchangeRate?: number;
      exchangeRateDate?: string;
      currency?: string;
    }
  ): Promise<ImportPurchaseOrder> => {
    const res = await apiClient.post(`/api/import/purchase-orders/${id}/correct-fx`, body);
    return res.data.data;
  },

  previewFx: async (body: {
    currency?: string;
    currencyCode?: string;
    foreignAmount?: number;
    amountForeign?: number;
    exchangeRateToUsd?: number;
    exchangeRate?: number;
    exchangeRateDate?: string;
    asOfDate?: string;
    allowExplicitRate?: boolean;
  }): Promise<ImportFxPreview> => {
    const res = await apiClient.post('/api/import/fx/preview', body);
    return res.data.data;
  },

  // ─── 4. Proforma Invoices ──────────────────────────────────────────────────

  listProformas: async (params: Record<string, any> = {}): Promise<ImportProformaInvoice[]> => {
    const res = await apiClient.get(`/api/import/proformas${buildQuery(params)}`);
    return res.data.data;
  },

  getProforma: async (id: string): Promise<ImportProformaInvoice> => {
    const res = await apiClient.get(`/api/import/proformas/${id}`);
    return res.data.data;
  },

  createProforma: async (data: Partial<ImportProformaInvoice>): Promise<ImportProformaInvoice> => {
    const res = await apiClient.post('/api/import/proformas', data);
    return res.data.data;
  },

  updateProforma: async (id: string, data: Partial<ImportProformaInvoice>): Promise<ImportProformaInvoice> => {
    const res = await apiClient.put(`/api/import/proformas/${id}`, data);
    return res.data.data;
  },

  recordAdvancePayment: async (id: string, paymentData: Record<string, any>): Promise<ImportProformaInvoice> => {
    const res = await apiClient.post(`/api/import/proformas/${id}/advance-payment`, paymentData);
    return res.data.data;
  },

  updateProformaStatus: async (
    id: string,
    status: string,
    extra: Record<string, unknown> = {}
  ): Promise<ImportProformaInvoice> => {
    const res = await apiClient.patch(`/api/import/proformas/${id}/status`, { status, ...extra });
    return res.data.data;
  },

  // ─── 5. Shipments ──────────────────────────────────────────────────────────

  listShipments: async (params: Record<string, any> = {}): Promise<ImportShipment[]> => {
    const res = await apiClient.get(`/api/import/shipments${buildQuery(params)}`);
    const data = res.data?.data ?? res.data;
    const items = Array.isArray(data) ? data : data?.items;
    return (Array.isArray(items) ? items : []).filter((s: ImportShipment) => Boolean(s?.id));
  },

  listEligibleShipmentPos: async (params: Record<string, any> = {}): Promise<ImportEligibleShipmentPo[]> => {
    const res = await apiClient.get(`/api/import/shipments/eligible-pos${buildQuery(params)}`);
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  },

  getShipment: async (id: string): Promise<ImportShipment> => {
    const res = await apiClient.get(`/api/import/shipments/${id}`);
    return unwrapImport<ImportShipment>(res, 'Failed to load shipment');
  },

  createShipment: async (data: Partial<ImportShipment> & { items?: ImportShipmentItem[] }): Promise<ImportShipment> => {
    const res = await apiClient.post('/api/import/shipments', data);
    return unwrapImport<ImportShipment>(res, 'Failed to create shipment');
  },

  updateShipmentStatus: async (
    id: string,
    status: string,
    extra: Record<string, unknown> = {}
  ): Promise<ImportShipment> => {
    const res = await apiClient.patch(`/api/import/shipments/${id}/status`, { status, ...extra });
    return unwrapImport<ImportShipment>(res, 'Failed to update shipment status');
  },

  // ─── 5b. Carriers ──────────────────────────────────────────────────────────

  listCarriers: async (params: Record<string, any> = {}): Promise<PaginatedResponse<ImportCarrier>> => {
    const res = await apiClient.get(`/api/import/carriers${buildQuery(params)}`);
    return unwrapImport<PaginatedResponse<ImportCarrier>>(res, 'Failed to load carriers');
  },

  getCarrier: async (id: string): Promise<ImportCarrier> => {
    const res = await apiClient.get(`/api/import/carriers/${id}`);
    return unwrapImport<ImportCarrier>(res, 'Failed to load carrier');
  },

  createCarrier: async (data: Partial<ImportCarrier>): Promise<ImportCarrier> => {
    const res = await apiClient.post('/api/import/carriers', data);
    return unwrapImport<ImportCarrier>(res, 'Failed to create carrier');
  },

  updateCarrier: async (id: string, data: Partial<ImportCarrier>): Promise<ImportCarrier> => {
    const res = await apiClient.put(`/api/import/carriers/${id}`, data);
    return unwrapImport<ImportCarrier>(res, 'Failed to update carrier');
  },

  toggleCarrierStatus: async (id: string): Promise<ImportCarrier> => {
    const res = await apiClient.patch(`/api/import/carriers/${id}/status`, {});
    return unwrapImport<ImportCarrier>(res, 'Failed to update carrier status');
  },

  // ─── 6. Customs & Clearance ────────────────────────────────────────────────

  listCustoms: async (params: Record<string, any> = {}): Promise<ImportCustomsClearance[]> => {
    const res = await apiClient.get(`/api/import/customs${buildQuery(params)}`);
    return unwrapImport<ImportCustomsClearance[]>(res, 'Failed to load customs clearances');
  },

  getCustoms: async (id: string): Promise<ImportCustomsClearance> => {
    const res = await apiClient.get(`/api/import/customs/${id}`);
    return unwrapImport<ImportCustomsClearance>(res, 'Failed to load customs clearance');
  },

  previewCustoms: async (data: Record<string, any>): Promise<ImportCustomsPreview> => {
    const res = await apiClient.post('/api/import/customs/preview', data);
    return unwrapImport<ImportCustomsPreview>(res, 'Failed to preview customs assessment');
  },

  createCustoms: async (data: Record<string, any>): Promise<ImportCustomsClearance> => {
    const res = await apiClient.post('/api/import/customs', data);
    return unwrapImport<ImportCustomsClearance>(res, 'Failed to create customs entry');
  },

  updateCustomsStatus: async (
    id: string,
    status: string,
    extra: Record<string, unknown> = {}
  ): Promise<ImportCustomsClearance> => {
    const res = await apiClient.patch(`/api/import/customs/${id}/status`, { status, ...extra });
    return unwrapImport<ImportCustomsClearance>(res, 'Failed to update customs status');
  },

  recalculateCustomsRate: async (
    id: string,
    data: { reason: string }
  ): Promise<ImportCustomsClearance> => {
    const res = await apiClient.post(`/api/import/customs/${id}/recalculate-rate`, data);
    return unwrapImport<ImportCustomsClearance>(res, 'Failed to recalculate customs rate');
  },

  refreshCustomsTariff: async (
    id: string,
    data: { reason?: string } = {}
  ): Promise<ImportCustomsClearance> => {
    const res = await apiClient.post(`/api/import/customs/${id}/refresh-tariff`, data);
    return unwrapImport<ImportCustomsClearance>(res, 'Failed to refresh tariff data');
  },

  listCustomsPaymentAccounts: async (
    params: { method?: string } = {}
  ): Promise<
    Array<{
      id: string;
      accountName: string;
      accountNumber: string;
      bankName: string;
      accountType?: string;
      currency?: string;
      currentBalance: number;
      chartOfAccountId?: string;
      isCash?: boolean;
    }>
  > => {
    const res = await apiClient.get(`/api/import/customs/payment-accounts${buildQuery(params)}`);
    return unwrapImport(res, 'Failed to load payment accounts');
  },

  recordCustomsDutyPayment: async (
    id: string,
    data: Record<string, unknown>
  ): Promise<ImportCustomsClearance> => {
    const res = await apiClient.post(`/api/import/customs/${id}/payments`, data);
    return unwrapImport<ImportCustomsClearance>(res, 'Failed to record duty payment');
  },

  // ─── 7. Documents ──────────────────────────────────────────────────────────

  listDocuments: async (params: Record<string, any> = {}): Promise<ImportDocument[]> => {
    const res = await apiClient.get(`/api/import/documents${buildQuery(params)}`);
    const data = res.data.data;
    const items = Array.isArray(data) ? data : data?.items || [];
    return items.map((d: any) => ({
      ...d,
      documentType: d.documentType || d.docType,
      documentNumber: d.documentNumber || d.docNumber,
      fileName: d.fileName || d.filePlaceholder,
    }));
  },

  createDocument: async (data: Partial<ImportDocument>): Promise<ImportDocument> => {
    const payload = {
      ...data,
      docType: data.docType || data.documentType,
      docNumber: data.docNumber || data.documentNumber,
      filePlaceholder: data.filePlaceholder || data.fileName,
    };
    const res = await apiClient.post('/api/import/documents', payload);
    return res.data.data;
  },

  updateDocumentStatus: async (
    id: string,
    status: string,
    extra: Record<string, unknown> = {}
  ): Promise<ImportDocument> => {
    const res = await apiClient.patch(`/api/import/documents/${id}/status`, { status, ...extra });
    return res.data.data;
  },

  // ─── 8. GRN / Receiving ────────────────────────────────────────────────────

  listGrns: async (params: Record<string, any> = {}): Promise<PaginatedResponse<ImportGrn>> => {
    const res = await apiClient.get(`/api/import/grns${buildQuery(params)}`);
    return res.data.data;
  },

  getGrn: async (id: string): Promise<ImportGrn> => {
    const res = await apiClient.get(`/api/import/grns/${id}`);
    return res.data.data;
  },

  getReceivingPreview: async (importPoId: string): Promise<{
    importPoId: string;
    poNumber: string;
    supplierName: string;
    status: string;
    purchaseOrderId?: string | null;
    lines: Array<{
      id: string;
      importPoItemId: string;
      productId: string;
      productName: string;
      sku?: string | null;
      uom: string;
      orderedQty: number;
      previouslyReceivedQty: number;
      remainingQty: number;
      unitPrice: number;
    }>;
  }> => {
    const res = await apiClient.get(`/api/import/purchase-orders/${importPoId}/receiving-preview`);
    return res.data.data;
  },

  auditGrns: async (params: Record<string, any> = {}): Promise<any> => {
    const res = await apiClient.get(`/api/import/grns/audit${buildQuery(params)}`);
    return res.data.data;
  },

  createGrn: async (
    data: Partial<ImportGrn> & {
      items?: any[];
      confirmNow?: boolean;
      idempotencyKey?: string;
      locationId?: string;
    }
  ): Promise<ImportGrn> => {
    const res = await apiClient.post('/api/import/grns', data);
    return res.data.data;
  },

  // ─── 9. Landed Cost ────────────────────────────────────────────────────────

  listLandedCosts: async (params: Record<string, any> = {}): Promise<ImportLandedCost[]> => {
    const res = await apiClient.get(`/api/import/landed-costs${buildQuery(params)}`);
    return res.data.data;
  },

  getLandedCost: async (id: string): Promise<ImportLandedCost> => {
    const res = await apiClient.get(`/api/import/landed-costs/${id}`);
    return res.data.data;
  },

  createLandedCost: async (data: Partial<ImportLandedCost>): Promise<ImportLandedCost> => {
    const res = await apiClient.post('/api/import/landed-costs', data);
    return res.data.data;
  },

  postLandedCost: async (id: string): Promise<ImportLandedCost> => {
    const res = await apiClient.post(`/api/import/landed-costs/${id}/post`, {});
    return res.data.data;
  },

  reverseLandedCost: async (id: string): Promise<{ success: boolean; landedCost?: ImportLandedCost }> => {
    const res = await apiClient.post(`/api/import/landed-costs/${id}/reverse`, {});
    return res.data.data; 
  },


  listFinanceLcs: async (params: Record<string, any> = {}): Promise<ImportFinanceLc[]> => {
    const res = await apiClient.get(`/api/import/finance/lcs${buildQuery(params)}`);
    const data = res.data?.data ?? res.data;
    if (Array.isArray(data)) return data.filter(Boolean);
    if (Array.isArray(data?.items)) return data.items.filter(Boolean);
    return [];
  },

  listEligibleFinancePos: async (params: Record<string, any> = {}): Promise<ImportEligibleFinancePo[]> => {
    const res = await apiClient.get(`/api/import/finance/lcs/eligible-pos${buildQuery(params)}`);
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  },

  getFinanceLc: async (id: string): Promise<ImportFinanceLc> => {
    const res = await apiClient.get(`/api/import/finance/lcs/${id}`);
    return res.data?.data ?? res.data;
  },

  createFinanceLc: async (data: Partial<ImportFinanceLc> & Record<string, unknown>): Promise<ImportFinanceLc> => {
    const res = await apiClient.post('/api/import/finance/lcs', data);
    const payload = res.data?.data ?? res.data;
    if (payload && typeof payload === 'object' && payload.id) return payload as ImportFinanceLc;
    if (payload?.data?.id) return payload.data as ImportFinanceLc;
    throw new Error(res.data?.message || 'Create LC returned an unexpected response');
  },

  updateFinanceLcStatus: async (
    id: string,
    status: string,
    extra: Record<string, unknown> = {}
  ): Promise<ImportFinanceLc> => {
    const res = await apiClient.patch(`/api/import/finance/lcs/${id}/status`, { status, ...extra });
    return res.data.data;
  },

  amendFinanceLc: async (
    id: string,
    data: { lcAmount?: number; expiryDate?: string; latestShipmentDate?: string | null; reason?: string }
  ): Promise<ImportFinanceLc> => {
    const res = await apiClient.post(`/api/import/finance/lcs/${id}/amend`, data);
    return res.data?.data ?? res.data;
  },

  // ─── 11. Supplier Bills & Payments ─────────────────────────────────────────

  listBills: async (params: Record<string, any> = {}): Promise<PaginatedResponse<ImportSupplierBill>> => {
    const res = await apiClient.get(`/api/import/bills${buildQuery(params)}`);
    return res.data.data;
  },

  getBill: async (id: string): Promise<ImportSupplierBill> => {
    const res = await apiClient.get(`/api/import/bills/${id}`);
    return res.data.data;
  },

  createBill: async (data: Partial<ImportSupplierBill> & Record<string, unknown>): Promise<ImportSupplierBill> => {
    const res = await apiClient.post('/api/import/bills', data);
    return res.data.data;
  },

  postBill: async (id: string): Promise<ImportSupplierBill> => {
    const res = await apiClient.post(`/api/import/bills/${id}/post`, {});
    const data = res.data.data;
    return data?.bill || data;
  },

  recordBillPayment: async (id: string, paymentData: Record<string, any>): Promise<ImportSupplierBill> => {
    const res = await apiClient.post(`/api/import/bills/${id}/payment`, paymentData);
    return res.data.data;
  },

  // ─── 12. Settings ──────────────────────────────────────────────────────────

  getSettings: async (): Promise<ImportSettings> => {
    const res = await apiClient.get('/api/import/settings');
    return res.data.data;
  },

  updateSettings: async (data: Partial<ImportSettings>): Promise<ImportSettings> => {
    const res = await apiClient.put('/api/import/settings', data);
    return res.data.data;
  },

  getReports: async (params: Record<string, any> = {}): Promise<any> => {
    const res = await apiClient.get(`/api/import/reports${buildQuery(params)}`);
    return res.data.data;
  },
};

export default importApi;
