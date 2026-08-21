// app/lib/types/quotation.ts

export interface QuotationItem {
  id: string;
  quotationId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  notes?: string;
}

export interface ConvertedOrder {
  id: string;
  orderNumber: string;
  orderStatus: string;
  createdAt?: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  quotationDate: string;
  validUntil: string;
  salesPerson?: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired' | 'Converted' | 'Cancelled';
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  notes?: string;
  termsConditions?: string;
  sentAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  convertedAt?: string;
  convertedOrderId?: string;
  createdBy: string;
  updatedBy?: string;
  isActive: boolean;
  isDeleted: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  items: QuotationItem[];
  convertedOrder?: ConvertedOrder;
}

export interface QuotationStats {
  total: number;
  draft: number;
  sent: number;
  accepted: number;
  rejected: number;
  expired: number;
  converted: number;
  totalValue: number;
  convertedValue: number;
}

export interface QuotationLineDraft {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  taxRate?: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage?: number;
  prevPage?: number;
  startIndex: number;
  endIndex: number;
  isAllRecords: boolean;
}

export interface QuotationListResponse {
  success: boolean;
  count: number;
  data: Quotation[];
  kpi?: QuotationStats;
  stats?: Record<string, any>;
  pagination?: Pagination;
}

export interface QuotationDetailResponse {
  success: boolean;
  data: Quotation;
}
