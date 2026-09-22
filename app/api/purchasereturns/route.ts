import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface PurchaseReturnModel {
  id: string;
  returnNumber: string;
  returnDate: string;
  supplierId: string;
  supplierName: string;
  goodsReceivingId?: string;
  grnNumber?: string;
  purchaseInvoiceId?: string;
  purchaseInvoiceNumber?: string;
  returnReason: string;
  status: 'Draft' | 'Processed' | 'Cancelled';
  notes?: string;
  totalReturnQty: number;
  returnAmount: number;
  grandTotal: number;
  journalEntryId?: string;
  apRecordId?: string;
  createdBy: string;
  updatedBy?: string;
  processedBy?: string;
  processedAt?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  isActive: boolean;
  isDeleted: boolean;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  items: PurchaseReturnItemModel[];
  journalEntry?: JournalEntry;
  canProcess?: boolean;
  canCancel?: boolean;
  canDelete?: boolean;
  canPrint?: boolean;
  totalItems: number;
}

export interface PurchaseReturnItemModel {
  id: string;
  returnId: string;
  productId: string;
  productName: string;
  sku: string;
  goodsReceivingId?: string;
  goodsReceivingItemId?: string;
  purchaseInvoiceId?: string;
  purchaseInvoiceItemId?: string;
  receivedQuantity?: number;
  purchasedQuantity: number;
  previouslyReturned: number;
  availableQuantity: number;
  returnQuantity: number;
  isBoxBased: boolean;
  boxes?: number;
  quantityPerBox?: number;
  unitPrice: number;
  lineTotal: number;
  returnReason: string;
  condition: string;
  notes?: string;
}

export interface GRNForReturn {
  id: string;
  grnNumber: string;
  receivingDate: string;
  supplierId: string;
  supplierName: string;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  purchaseOrderNumbers?: string;
  status: string;
  notes?: string;
  locationName?: string;
  totalItemsCount?: number;
  totalAmount?: number;
  totalReceivedQty?: number;
  totalReturnedQty?: number;
  totalAvailableReturnQty?: number;
  linkedInvoice?: {
    id: string;
    invoiceNumber: string;
    grandTotal: number;
    invoiceStatus: string;
    paymentStatus: string;
    invoiceDate?: string;
  } | null;
  items: GRNItemForReturn[];
  purchaseInvoices?: InvoiceForReturn[];
}

export interface GRNItemForReturn {
  id: string;
  goodsReceivingItemId?: string;
  productId: string;
  productName: string;
  sku: string;
  receivingQuantity: number;
  unitPrice: number;
  previouslyReturned?: number;
  availableReturnQty?: number;
  unit?: string;
  notes?: string;
}

export interface ReturnItemForForm {
  productId: string;
  productName: string;
  sku: string;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  goodsReceivingItemId?: string;
  purchaseInvoiceItemId?: string;
  receivedQuantity?: number;
  purchasedQuantity: number;
  previouslyReturned: number;
  availableQuantity: number;
  unitPrice: number;
  isBoxBased: boolean;
  boxQuantity: number;
  boxUnitName: string;
  returnReason: string;
  notes?: string;
  isSelected: boolean;
  returnQuantity: number;
  boxes: number;
  quantityPerBox: number;
  lineTotal: number;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  taxId?: string;
  address?: string;
  isActive: boolean;
}

export interface InvoiceForReturn {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  supplierId: string;
  supplierName: string;
  grandTotal: number;
  paidAmount: number;
  outstanding: number;
  invoiceStatus: string;
  paymentStatus: string;
  items: InvoiceItemForReturn[];
  isFullyPaid: boolean;
  isUnpaid: boolean;
}

export interface InvoiceItemForReturn {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  isBoxBased: boolean;
  boxQuantity: number;
  boxUnitName: string;
  availableReturnQty: number;
  previouslyReturned: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  reference: string;
  status: string;
  createdBy: string;
  postedBy?: string;
  postedAt?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  lines: JournalLine[];
}

export interface JournalLine {
  id: string;
  journalId: string;
  accountId: string;
  accountName: string;
  accountCode: string;
  isReconciled: boolean;
  debit: number;
  credit: number;
}

export interface PurchaseReturnStats {
  todayCount: number;
  todayAmount: number;
  monthCount: number;
  monthAmount: number;
  draftCount: number;
}

export interface PurchaseReturnListResponse {
  success: boolean;
  data: PurchaseReturnModel[];
  stats: PurchaseReturnStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateReturnRequest {
  supplierId: string;
  supplierName: string;
  goodsReceivingId?: string;
  grnNumber?: string;
  purchaseInvoiceId?: string;
  purchaseInvoiceNumber?: string;
  returnReason: string;
  notes?: string;
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    goodsReceivingItemId?: string;
    purchaseInvoiceItemId?: string;
    returnQuantity: number;
    isBoxBased: boolean;
    boxes: number;
    quantityPerBox: number;
    unitPrice: number;
    returnReason: string;
    notes?: string;
  }>;
}

export function normalizeReturnItemForForm(raw: Record<string, unknown>): ReturnItemForForm {
  const availableQuantity = Math.max(0, Number(raw.availableQuantity ?? raw.availableReturnQty ?? 0));
  const unitPrice = Number(raw.unitPrice ?? 0);

  return {
    productId: String(raw.productId ?? ''),
    productName: String(raw.productName ?? ''),
    sku: String(raw.sku ?? ''),
    purchaseOrderId: raw.purchaseOrderId ? String(raw.purchaseOrderId) : undefined,
    purchaseOrderNumber: raw.purchaseOrderNumber ? String(raw.purchaseOrderNumber) : undefined,
    goodsReceivingItemId: raw.goodsReceivingItemId ? String(raw.goodsReceivingItemId) : String(raw.id ?? ''),
    purchaseInvoiceItemId: raw.purchaseInvoiceItemId ? String(raw.purchaseInvoiceItemId) : undefined,
    receivedQuantity: Number(raw.receivedQuantity ?? raw.receivingQuantity ?? 0),
    purchasedQuantity: Number(raw.purchasedQuantity ?? raw.quantity ?? raw.receivingQuantity ?? 0),
    previouslyReturned: Number(raw.previouslyReturned ?? 0),
    availableQuantity,
    unitPrice,
    isBoxBased: Boolean(raw.isBoxBased),
    boxQuantity: Number(raw.boxQuantity ?? 0),
    boxUnitName: String(raw.boxUnitName ?? 'Box'),
    returnReason: String(raw.returnReason ?? ''),
    notes: raw.notes ? String(raw.notes) : undefined,
    isSelected: false,
    returnQuantity: 0,
    boxes: 0,
    quantityPerBox: 0,
    lineTotal: 0,
  };
}

// ─── SERVICE ──────────────────────────────────────────────────

export const purchaseReturnService = {
  // ─── Get returns with pagination and filters ──────────────
  getReturns: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<PurchaseReturnListResponse> => {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/purchase/returns${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch returns');
      }
      
      const data = response.data || {};
      
      return {
        success: response.success,
        data: data.data || [],
        stats: data.stats || {
          todayCount: 0,
          todayAmount: 0,
          monthCount: 0,
          monthAmount: 0,
          draftCount: 0
        },
        pagination: data.pagination || {
          page: params.page || 1,
          limit: params.limit || 20,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    } catch (error: any) {
      console.error('Get returns error:', error);
      throw new Error(error.message || 'Failed to fetch returns');
    }
  },

  // ─── Search suppliers ──────────────────────────────────────
  searchSuppliers: async (query: string, limit: number = 10): Promise<Supplier[]> => {
    try {
      const response = await apiClient.get(
        `/api/warehouse/supplier?search=${encodeURIComponent(query)}&limit=${limit}`
      );
      if (!response.success) {
        throw new Error(response.message || 'Failed to search suppliers');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Search suppliers error:', error);
      return [];
    }
  },

  // ─── Get supplier GRNs for return (Primary) ──────────────────────
  getSupplierGRNs: async (supplierId: string): Promise<GRNForReturn[]> => {
    try {
      const response = await apiClient.get(
        `/api/purchase/returns/supplier/${supplierId}/grns`
      );
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch supplier GRNs');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Get supplier GRNs error:', error);
      throw new Error(error.message || 'Failed to fetch supplier GRNs');
    }
  },

  // ─── Get GRN products for return (Primary) ──────────────────────
  getGRNProducts: async (grnId: string): Promise<{ grn: GRNForReturn; linkedInvoice: InvoiceForReturn | null; products: ReturnItemForForm[] }> => {
    try {
      const response = await apiClient.get(
        `/api/purchase/returns/grn/${grnId}/products`
      );
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch GRN products');
      }
      const data = response.data?.data || {};
      const products = (data.products || []).map((item: Record<string, unknown>) => normalizeReturnItemForForm(item));
      return {
        grn: data.grn,
        linkedInvoice: data.linkedInvoice || null,
        products
      };
    } catch (error: any) {
      console.error('Get GRN products error:', error);
      throw new Error(error.message || 'Failed to fetch GRN products');
    }
  },

  // ─── Get supplier invoices for return (Legacy) ──────────────────────
  getSupplierInvoices: async (supplierId: string): Promise<InvoiceForReturn[]> => {
    try {
      const response = await apiClient.get(
        `/api/purchase/returns/supplier/${supplierId}/invoices`
      );
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch supplier invoices');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Get supplier invoices error:', error);
      throw new Error(error.message || 'Failed to fetch supplier invoices');
    }
  },

  // ─── Get invoice products for return ──────────────────────
  getInvoiceProducts: async (invoiceId: string): Promise<ReturnItemForForm[]> => {
    try {
      const response = await apiClient.get(
        `/api/purchase/returns/invoice/${invoiceId}/products`
      );
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch invoice products');
      }
      const products = response.data?.data?.products || [];
      return products.map((item: Record<string, unknown>) => normalizeReturnItemForForm(item));
    } catch (error: any) {
      console.error('Get invoice products error:', error);
      throw new Error(error.message || 'Failed to fetch invoice products');
    }
  },

  // ─── Create draft return ──────────────────────────────────
  createDraftReturn: async (data: CreateReturnRequest): Promise<PurchaseReturnModel> => {
    try {
      const response = await apiClient.post('/api/purchase/returns/draft', data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create draft return');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Create draft return error:', error);
      throw new Error(error.message || 'Failed to create draft return');
    }
  },

  // ─── Process return ──────────────────────────────────────
  processReturn: async (id: string): Promise<PurchaseReturnModel> => {
    try {
      const response = await apiClient.post(`/api/purchase/returns/${id}/process`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to process return');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Process return error:', error);
      throw new Error(error.message || 'Failed to process return');
    }
  },

  // ─── Cancel return ──────────────────────────────────────
  cancelReturn: async (id: string, reason: string): Promise<PurchaseReturnModel> => {
    try {
      const response = await apiClient.post(`/api/purchase/returns/${id}/cancel`, { reason });
      if (!response.success) {
        throw new Error(response.message || 'Failed to cancel return');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Cancel return error:', error);
      throw new Error(error.message || 'Failed to cancel return');
    }
  },

  // ─── Delete return ──────────────────────────────────────
  deleteReturn: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.delete(`/api/purchase/returns/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete return');
      }
    } catch (error: any) {
      console.error('Delete return error:', error);
      throw new Error(error.message || 'Failed to delete return');
    }
  },

  // ─── Get return by ID ────────────────────────────────────
  getReturnById: async (id: string): Promise<PurchaseReturnModel> => {
    try {
      const response = await apiClient.get(`/api/purchase/returns/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch return');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Get return error:', error);
      throw new Error(error.message || 'Failed to fetch return');
    }
  }
};