  // app/api/salespayment/route.ts - COMPLETE CORRECTED

  import { apiClient } from '@/lib/api-client';

  export interface SalesPayment {
    id: string;
    paymentNumber: string;
    paymentDate: string;
    customerId: string;
    customerName: string;
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
    invoicePayments: InvoicePayment[];
    journalEntry?: JournalEntry;
    totalInvoices?: number;
    canCancel?: boolean;
    canDelete?: boolean;
  }

  export interface InvoicePayment {
    id: string;
    paymentId: string;
    invoiceId: string;
    invoiceNumber: string;
    amountPaid: number;
    invoice?: SalesInvoiceSummary;
  }

  export interface SalesInvoiceSummary {
    id: string;
    invoiceNumber: string;
    grandTotal: number;
    outstanding: number;
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

  export interface Customer {
    id: string;
    _id?: string;
    customerNumber: string;
    name: string;
    email?: string;
    phone?: string;
    companyName?: string; 
    customerType: string;
    taxId?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    status: string;
    loyaltyPoints: number;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate?: string;
    notes?: string;
    tags: string[];
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
    outstandingBalance?: number; 
  }

  export interface InvoiceForPayment {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    grandTotal: number;
    paidAmount: number;
    outstanding: number;
    invoiceStatus: string;
    paymentStatus: string;
    isSelected: boolean;
    amountToPay: number;
  }

  export interface PaymentStats {
    todayCount: number;
    todayAmount: number;
    monthCount: number;
    monthAmount: number;
  }

  export interface PaymentListResponse {
    success: boolean;
    data: SalesPayment[];
    stats: PaymentStats;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }

  export interface ReceivePaymentRequest {
    customerId: string;
    customerName: string;
    amount: number;
    paymentMethod: string;
    bankAccountId?: string;
    bankAccountName?: string;
    reference?: string;
    notes?: string;
    paymentDate?: string;
    invoicePayments: Array<{
      invoiceId: string;
      invoiceNumber: string;
      amountPaid: number;
    }>;
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

  export const salesPaymentService = {
    getPayments: async (params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      fromDate?: string;
      toDate?: string;
      customerId?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      locationId?: string;
    } = {}): Promise<PaymentListResponse> => {
      const query = new URLSearchParams();
      
      if (params.page !== undefined && params.page !== null) {
        query.append('page', String(params.page));
      }
      if (params.limit !== undefined && params.limit !== null) {
        query.append('limit', String(params.limit));
      }
      if (params.search && params.search.trim()) {
        query.append('search', params.search.trim());
      }
      if (params.status && params.status !== 'all') {
        query.append('status', params.status);
      }
      if (params.fromDate) {
        query.append('fromDate', params.fromDate);
      }
      if (params.toDate) {
        query.append('toDate', params.toDate);
      }
      if (params.customerId) {
        query.append('customerId', params.customerId);
      }
      if (params.sortBy) {
        query.append('sortBy', params.sortBy);
      }
      if (params.sortOrder) {
        query.append('sortOrder', params.sortOrder);
      }
      if (params.locationId) {
        query.append('locationId', params.locationId);
      }

      const url = `/api/sales/payments${query.toString() ? `?${query.toString()}` : ''}`;
      
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

   
    searchCustomers: async (query: string, limit: number = 10): Promise<Customer[]> => {
      try {
        // Use the dedicated search endpoint (now available in backend)
        const response = await apiClient.get(
          `/api/warehouse/customers/search?q=${encodeURIComponent(query)}&limit=${limit}`
        );
        
        if (!response.success) {
          console.error('Search customers failed:', response.message);
          return [];
        }
        
        // Handle response data
        const customers = response.data?.data || response.data || [];
        
        // If response has data array
        if (Array.isArray(customers)) {
          return customers;
        }
        
        // If response has items array
        if (customers.items) {
          return customers.items;
        }
        
        return [];
      } catch (error: any) {
        // Silently fail - return empty array
        console.error('Search customers error:', error?.message || 'Unknown error');
        return [];
      }
    },

    // ─── Get customer invoices for payment ────────────────────
    getCustomerInvoices: async (customerId: string, locationId?: string): Promise<InvoiceForPayment[]> => {
      try {
        const params = new URLSearchParams();
        if (locationId) params.append('locationId', locationId);
        const qs = params.toString();
        const response = await apiClient.get(
          `/api/sales/payments/customer/${customerId}/invoices${qs ? `?${qs}` : ''}`
        );
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch customer invoices');
        }
        return response.data?.data || [];
      } catch (error: any) {
        console.error('Get customer invoices error:', error);
        throw new Error(error.message || 'Failed to fetch customer invoices');
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

    // ─── Receive payment ──────────────────────────────────────
    receivePayment: async (data: ReceivePaymentRequest): Promise<SalesPayment> => {
      try {
        const payload = {
          ...data,
          paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
        };
        const response = await apiClient.post('/api/sales/payments/receive', payload);
        if (!response.success) {
          throw new Error(response.message || 'Failed to receive payment');
        }
        return response.data?.data;
      } catch (error: any) {
        console.error('Receive payment error:', error);
        throw new Error(error.message || 'Failed to receive payment');
      }
    },

    // ─── Cancel payment ──────────────────────────────────────
    cancelPayment: async (id: string, reason: string): Promise<void> => {
      try {
        const response = await apiClient.post(`/api/sales/payments/${id}/cancel`, { reason });
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
        const response = await apiClient.delete(`/api/sales/payments/${id}`);
        if (!response.success) {
          throw new Error(response.message || 'Failed to delete payment');
        }
      } catch (error: any) {
        console.error('Delete payment error:', error);
        throw new Error(error.message || 'Failed to delete payment');
      }
    },

    // ─── Get payment by ID ────────────────────────────────────
    getPaymentById: async (id: string): Promise<SalesPayment> => {
      try {
        const response = await apiClient.get(`/api/sales/payments/${id}`);
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch payment');
        }
        return response.data?.data;
      } catch (error: any) {
        console.error('Get payment by ID error:', error);
        throw new Error(error.message || 'Failed to fetch payment');
      }
    },
  };