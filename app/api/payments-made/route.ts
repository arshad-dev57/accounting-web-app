import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface PaymentMade {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  supplierId: string;
  supplierName: string;
  billId: string;
  billNumber: string;
  billAmount: number;
  amount: number;
  paymentMethod: string;
  reference: string;
  bankAccountId: string;
  bankAccountName: string;
  notes: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Summary {
  totalPaid: number;
  thisMonth: number;
  thisWeek: number;
  today: number;
  pending: number;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName?: string;
}

export interface BankAccount {
  id: string;
  name: string;
  number: string;
  balance: number;
}

export interface BillForPayment {
  id: string;
  billNumber: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  outstanding: number;
  status: string;
}

export interface PaymentListResponse {
  success: boolean;
  data: PaymentMade[];
  summary: Summary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface RecordPaymentRequest {
  supplierId: string;
  billIds: string[];
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  reference: string;
  bankAccountId: string | null;
  notes?: string;
}

// ─── SERVICE ──────────────────────────────────────────────────

export const paymentsMadeService = {
  // ─── Get summary ──────────────────────────────────────────────
  getSummary: async (): Promise<Summary> => {
    try {
      const response = await apiClient.get('/api/payments-made/summary');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch summary');
      }
      return response.data?.data || {
        totalPaid: 0,
        thisMonth: 0,
        thisWeek: 0,
        today: 0,
        pending: 0
      };
    } catch (error: any) {
      console.error('Get summary error:', error);
      throw new Error(error.message || 'Failed to fetch summary');
    }
  },

  // ─── Get payments with pagination and filters ─────────────────
  getPayments: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    period?: string;
    supplierId?: string;
  } = {}): Promise<PaymentListResponse> => {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/payments-made${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch payments');
      }
      
      const data = response.data || {};
      
      return {
        success: response.success,
        data: data.data || [],
        summary: data.summary || {
          totalPaid: 0,
          thisMonth: 0,
          thisWeek: 0,
          today: 0,
          pending: 0
        },
        pagination: data.pagination || {
          page: params.page || 1,
          limit: params.limit || 10,
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

  // ─── Get suppliers ─────────────────────────────────────────────
  getSuppliers: async (): Promise<Supplier[]> => {
    try {
      const response = await apiClient.get('/api/warehouse/supplier');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch suppliers');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Get suppliers error:', error);
      return [];
    }
  },

  // ─── Get bank accounts ─────────────────────────────────────────
  getBankAccounts: async (): Promise<BankAccount[]> => {
    try {
      const response = await apiClient.get('/api/bank-accounts');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch bank accounts');
      }
      // Map backend field names to frontend interface
      const accounts = response.data?.data || [];
      return accounts.map((acc: any) => ({
        id: acc.id,
        name: acc.accountName,
        number: acc.accountNumber,
        balance: acc.currentBalance || acc.currentBalance
      }));
    } catch (error: any) {
      console.error('Get bank accounts error:', error);
      return [];
    }
  },

  // ─── Get unpaid bills for supplier ────────────────────────────
  getUnpaidBills: async (supplierId: string): Promise<BillForPayment[]> => {
    try {
      const response = await apiClient.get(`/api/payments-made/bills/unpaid/${supplierId}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch unpaid bills');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Get unpaid bills error:', error);
      return [];
    }
  },

  // ─── Record payment ────────────────────────────────────────────
  recordPayment: async (data: RecordPaymentRequest): Promise<any> => {
    try {
      const payload = {
        supplierId: data.supplierId,
        billIds: data.billIds,
        amount: data.amount,
        paymentDate: data.paymentDate.toISOString().split('T')[0],
        paymentMethod: data.paymentMethod,
        reference: data.reference,
        bankAccountId: data.bankAccountId,
        notes: data.notes || ''
      };
      
      const response = await apiClient.post('/api/payments-made', payload);
      if (!response.success) {
        throw new Error(response.message || 'Failed to record payment');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Record payment error:', error);
      throw new Error(error.message || 'Failed to record payment');
    }
  },

  // ─── Clear cheque payment ─────────────────────────────────────
  clearCheque: async (paymentId: string): Promise<any> => {
    try {
      const response = await apiClient.post(`/api/payments-made/${paymentId}/clear`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to clear cheque');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Clear cheque error:', error);
      throw new Error(error.message || 'Failed to clear cheque');
    }
  },

  // ─── Delete payment ────────────────────────────────────────────
  deletePayment: async (paymentId: string): Promise<void> => {
    try {
      const response = await apiClient.delete(`/api/payments-made/${paymentId}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete payment');
      }
    } catch (error: any) {
      console.error('Delete payment error:', error);
      throw new Error(error.message || 'Failed to delete payment');
    }
  },

  // ─── Get payment by ID ────────────────────────────────────────
  getPaymentById: async (id: string): Promise<PaymentMade> => {
    try {
      const response = await apiClient.get(`/api/payments-made/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch payment');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Get payment error:', error);
      throw new Error(error.message || 'Failed to fetch payment');
    }
  }
};