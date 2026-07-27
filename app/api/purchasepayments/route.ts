import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface PurchasePaymentModel {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  bankAccountId?: string;
  bankAccountName: string;
  notes: string;
  status: 'Completed' | 'Pending' | 'Failed' | 'Cancelled';
  createdBy: string;
  updatedBy?: string;
  isActive: boolean;
  isDeleted: boolean;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  invoicePayments: PurchaseInvoicePaymentModel[];
  journalEntry?: JournalEntry;
  totalInvoices?: number;
  canCancel?: boolean;
  canDelete?: boolean;
}

export interface PurchaseInvoicePaymentModel {
  id: string;
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  amountPaid: number;
  invoice?: PurchaseInvoiceSummary;
}

export interface PurchaseInvoiceSummary {
  id: string;
  invoiceNumber: string;
  grandTotal: number;
  outstanding: number;
  supplierInvoiceNo?: string;
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

export interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
  isActive: boolean;
}

export interface PurchaseInvoiceForPayment {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  grandTotal: number;
  paidAmount: number;
  outstanding: number;
  invoiceStatus: string;
  paymentStatus: string;
  supplierInvoiceNo?: string;
  isSelected: boolean;
  amountToPay: number;
}

export interface PurchasePaymentStats {
  todayCount: number;
  todayAmount: number;
  monthCount: number;
  monthAmount: number;
}

export interface PurchasePaymentListResponse {
  success: boolean;
  data: PurchasePaymentModel[];
  stats: PurchasePaymentStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface MakePaymentRequest {
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentMethod: string;
  bankAccountId?: string;
  bankAccountName?: string;
  reference?: string;
  notes?: string;
  invoicePayments: Array<{
    invoiceId: string;
    invoiceNumber: string;
    amountPaid: number;
  }>;
}

// ─── SERVICE ──────────────────────────────────────────────────

export const purchasePaymentService = {
  // ─── Get payments with pagination and filters ──────────────
  getPayments: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<PurchasePaymentListResponse> => {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/purchase/payments${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch payments');
      }
      
      const data = response.data || {};
      
      return {
        success: response.success,
        data: data.data || [],
        stats: data.stats || {
          todayCount: 0,
          todayAmount: 0,
          monthCount: 0,
          monthAmount: 0
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
      console.error('Get payments error:', error);
      throw new Error(error.message || 'Failed to fetch payments');
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

  // ─── Get supplier invoices for payment ────────────────────
  getSupplierInvoices: async (supplierId: string): Promise<PurchaseInvoiceForPayment[]> => {
    try {
      const response = await apiClient.get(
        `/api/purchase/payments/supplier/${supplierId}/invoices`
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

  // ─── Get bank accounts ─────────────────────────────────────
  getBankAccounts: async (): Promise<BankAccount[]> => {
    try {
      const response = await apiClient.get('/api/bank-accounts');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch bank accounts');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Get bank accounts error:', error);
      return [];
    }
  },

  // ─── Make payment ──────────────────────────────────────────
  makePayment: async (data: MakePaymentRequest): Promise<PurchasePaymentModel> => {
    try {
      const payload = {
        ...data,
        paymentDate: new Date().toISOString().split('T')[0],
      };
      const response = await apiClient.post('/api/purchase/payments/make', payload);
      if (!response.success) {
        throw new Error(response.message || 'Failed to make payment');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Make payment error:', error);
      throw new Error(error.message || 'Failed to make payment');
    }
  },

  // ─── Cancel payment ──────────────────────────────────────
  cancelPayment: async (id: string, reason: string): Promise<void> => {
    try {
      const response = await apiClient.post(`/api/purchase/payments/${id}/cancel`, { reason });
      if (!response.success) {
        throw new Error(response.message || 'Failed to cancel payment');
      }
    } catch (error: any) {
      console.error('Cancel payment error:', error);
      throw new Error(error.message || 'Failed to cancel payment');
    }
  },

  // ─── Delete payment ──────────────────────────────────────
  deletePayment: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.delete(`/api/purchase/payments/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete payment');
      }
    } catch (error: any) {
      console.error('Delete payment error:', error);
      throw new Error(error.message || 'Failed to delete payment');
    }
  },

  // ─── Get payment by ID ────────────────────────────────────
  getPaymentById: async (id: string): Promise<PurchasePaymentModel> => {
    try {
      const response = await apiClient.get(`/api/purchase/payments/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch payment');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Get payment by ID error:', error);
      throw new Error(error.message || 'Failed to fetch payment');
    }
  }
};