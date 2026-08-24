import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface PurchaseInvoiceModel {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierInvoiceNo?: string;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  goodsReceivingId?: string;
  grnNumber?: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paidAmount: number;
  outstanding: number;
  invoiceStatus: 'Draft' | 'Posted' | 'Partially Paid' | 'Paid' | 'Cancelled';
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
  notes?: string;
  postedAt?: string;
  paidAt?: string;
  cancelledAt?: string;
  accountsPayableId?: string;
  journalEntryId?: string;
  inventoryAccountId?: string;
  apAccountId?: string;
  createdBy: string;
  updatedBy?: string;
  isActive: boolean;
  isDeleted: boolean;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  items: PurchaseInvoiceItemModel[];
  journalEntry?: JournalEntry;
  accountsPayable?: AccountsPayable;
  canPost?: boolean;
  canEdit?: boolean;
  canCancel?: boolean;
  canDelete?: boolean;
  totalItems: number;
  totalQuantity: number;
  isOverdue: boolean;
  paidPercentage: number;
}

export interface PurchaseInvoiceItemModel {
  id: string;
  invoiceId: string;
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

export interface PurchaseInvoiceLineDraft {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  lineTotal: number;
  notes?: string;
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

export interface AccountsPayable {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  paidAmount: number;
  outstanding: number;
  dueDate: string;
  status: string;
  notes?: string;
  accountId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GRNSource {
  id: string;
  grnNumber: string;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  receivingDate: string;
  status: string;
  locationId?: string;
  locationName?: string;
  locationCode?: string;
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity?: number;
    receivingQuantity: number;
    unitPrice: number;
    discount?: number;
    taxRate: number;
    notes?: string;
  }>;
  hasInvoice?: boolean;
  invoiceCount?: number;
  hasReceivedItems?: boolean;
  totalQuantity?: number;
  invoiceSubtotal?: number;
  totalDiscount?: number;
  totalTax?: number;
  grandTotal?: number;
  itemCount?: number;
  itemPreview?: string;
}

export interface POSource {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: string;
  locationId?: string;
  locationName?: string;
  locationCode?: string;
  subtotal?: number;
  totalDiscount?: number;
  totalTax?: number;
  grandTotal?: number;
  notes?: string;
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    taxRate: number;
    notes?: string;
  }>;
  hasInvoice?: boolean;
  invoiceCount?: number;
  hasReceivedItems?: boolean;
  totalQuantity?: number;
  invoiceSubtotal?: number;
  itemCount?: number;
  itemPreview?: string;
}

export interface PurchaseInvoiceStats {
  todayCount: number;
  todayAmount: number;
  monthCount: number;
  monthAmount: number;
  draft: number;
  posted: number;
  partiallyPaid: number;
  paid: number;
  cancelled: number;
  totalOutstanding: number;
}

export interface PurchaseInvoiceListResponse {
  success: boolean;
  data: PurchaseInvoiceModel[];
  stats: PurchaseInvoiceStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateInvoiceRequest {
  goodsReceivingId?: string;
  purchaseOrderId?: string;
  supplierInvoiceNo?: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms?: string;
  notes?: string;
}

// ─── SERVICE ──────────────────────────────────────────────────

export const purchaseInvoiceService = {
  // ─── Get invoices with pagination and filters ──────────────
  getInvoices: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    paymentStatus?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<PurchaseInvoiceListResponse> => {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/purchase/invoices${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch purchase invoices');
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
          draft: 0,
          posted: 0,
          partiallyPaid: 0,
          paid: 0,
          cancelled: 0,
          totalOutstanding: 0
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
      console.error('Get invoices error:', error);
      throw new Error(error.message || 'Failed to fetch purchase invoices');
    }
  },

  // ─── Search available source (GRN or PO) ────────────────────
  searchAvailableSource: async (sourceType: 'grn' | 'po', query: string, limit: number = 10): Promise<(GRNSource | POSource)[]> => {
    try {
      const endpoint = sourceType === 'grn' 
        ? `/api/purchase/invoices/available-grns?search=${encodeURIComponent(query)}&limit=${limit}`
        : `/api/purchase/invoices/available-pos?search=${encodeURIComponent(query)}&limit=${limit}`;
      
      const response = await apiClient.get(endpoint);
      if (!response.success) {
        throw new Error(response.message || 'Failed to search source');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Search source error:', error);
      return [];
    }
  },

  // ─── Create invoice from GRN or PO ──────────────────────────
  createInvoice: async (data: CreateInvoiceRequest): Promise<PurchaseInvoiceModel> => {
    try {
      const endpoint = data.goodsReceivingId 
        ? '/api/purchase/invoices/from-grn'
        : '/api/purchase/invoices/from-po';
      const response = await apiClient.post(endpoint, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create purchase invoice');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Create invoice error:', error);
      throw new Error(error.message || 'Failed to create purchase invoice');
    }
  },

  // ─── Get invoice by ID ──────────────────────────────────────
  getInvoiceById: async (id: string): Promise<PurchaseInvoiceModel> => {
    try {
      const response = await apiClient.get(`/api/purchase/invoices/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch purchase invoice');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Get invoice error:', error);
      throw new Error(error.message || 'Failed to fetch purchase invoice');
    }
  },

  // ─── Post invoice (create accounting entries) ──────────────
  postInvoice: async (id: string): Promise<PurchaseInvoiceModel> => {
    try {
      const response = await apiClient.post(`/api/purchase/invoices/${id}/post`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to post invoice');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Post invoice error:', error);
      throw new Error(error.message || 'Failed to post invoice');
    }
  },

  // ─── Cancel invoice ──────────────────────────────────────────
  cancelInvoice: async (id: string, reason: string): Promise<PurchaseInvoiceModel> => {
    try {
      const response = await apiClient.post(`/api/purchase/invoices/${id}/cancel`, { reason });
      if (!response.success) {
        throw new Error(response.message || 'Failed to cancel invoice');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Cancel invoice error:', error);
      throw new Error(error.message || 'Failed to cancel invoice');
    }
  },

  // ─── Delete invoice ──────────────────────────────────────────
  deleteInvoice: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.delete(`/api/purchase/invoices/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete invoice');
      }
    } catch (error: any) {
      console.error('Delete invoice error:', error);
      throw new Error(error.message || 'Failed to delete invoice');
    }
  },

  // ─── Update invoice ──────────────────────────────────────────
  updateInvoice: async (id: string, data: Partial<CreateInvoiceRequest>): Promise<PurchaseInvoiceModel> => {
    try {
      const response = await apiClient.put(`/api/purchase/invoices/${id}`, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update invoice');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Update invoice error:', error);
      throw new Error(error.message || 'Failed to update invoice');
    }
  },

  // ─── Get invoice stats ──────────────────────────────────────
  getInvoiceStats: async (params?: { startDate?: string; endDate?: string }): Promise<PurchaseInvoiceStats> => {
    try {
      const query = new URLSearchParams();
      if (params?.startDate) query.append('startDate', params.startDate);
      if (params?.endDate) query.append('endDate', params.endDate);
      
      const url = `/api/purchase/invoices/stats${query.toString() ? `?${query.toString()}` : ''}`;
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch invoice stats');
      }
      
      return response.data?.data || {
        todayCount: 0,
        todayAmount: 0,
        monthCount: 0,
        monthAmount: 0,
        draft: 0,
        posted: 0,
        partiallyPaid: 0,
        paid: 0,
        cancelled: 0,
        totalOutstanding: 0
      };
    } catch (error: any) {
      console.error('Get invoice stats error:', error);
      throw new Error(error.message || 'Failed to fetch invoice stats');
    }
  },

  // ─── Get invoices by supplier ──────────────────────────────
  getInvoicesBySupplier: async (supplierId: string): Promise<PurchaseInvoiceModel[]> => {
    try {
      const response = await apiClient.get(`/api/purchase/invoices/supplier/${supplierId}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch invoices');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Get invoices by supplier error:', error);
      throw new Error(error.message || 'Failed to fetch invoices');
    }
  },

  // ─── Export invoices ─────────────────────────────────────────
  exportInvoices: async (params?: {
    format?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<string> => {
    try {
      const query = new URLSearchParams();
      if (params?.format) query.append('format', params.format);
      if (params?.startDate) query.append('startDate', params.startDate);
      if (params?.endDate) query.append('endDate', params.endDate);
      
      const url = `/api/purchase/invoices/export${query.toString() ? `?${query.toString()}` : ''}`;
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to export invoices');
      }
      
      return response.data?.data || response.data?.url || '';
    } catch (error: any) {
      console.error('Export invoices error:', error);
      throw new Error(error.message || 'Failed to export invoices');
    }
  }
};