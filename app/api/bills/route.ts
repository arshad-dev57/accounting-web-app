import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface BillItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  date: string;
  dueDate: string;
  supplierId: string;
  supplierName: string;
  items: BillItem[];
  subtotal: number;
  taxTotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  outstanding: number;
  status: 'Unpaid' | 'Paid' | 'Overdue' | 'Partial';
  reference: string;
  description: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Summary {
  totalBills: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
}

export interface BillListResponse {
  success: boolean;
  data: Bill[];
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

export interface CreateBillRequest {
  supplierId: string;
  date: string;
  dueDate: string;
  billNumber?: string;
  reference?: string;
  description?: string;
  notes?: string;
  items: BillItem[];
  taxRate?: number;
  discount?: number;
  subtotal?: number;
}

export interface RecordPaymentRequest {
  billId: string;
  supplierId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  reference: string;
  bankAccountId: string | null;
  notes?: string;
}

// ─── SERVICE ──────────────────────────────────────────────────

export const billsService = {
  // ─── Get summary ──────────────────────────────────────────────
  getSummary: async (): Promise<Summary> => {
    try {
      const response = await apiClient.get('/api/bills/summary');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch summary');
      }
      return response.data?.data || {
        totalBills: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalOutstanding: 0
      };
    } catch (error: any) {
      console.error('Get summary error:', error);
      throw new Error(error.message || 'Failed to fetch summary');
    }
  },

  // ─── Get bills with pagination and filters ────────────────────
  getBills: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    supplierId?: string;
  } = {}): Promise<BillListResponse> => {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/bills${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch bills');
      }
      
      const data = response.data || {};
      
      return {
        success: response.success,
        data: data.data || [],
        summary: data.summary || {
          totalBills: 0,
          totalAmount: 0,
          totalPaid: 0,
          totalOutstanding: 0
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
      console.error('Get bills error:', error);
      throw new Error(error.message || 'Failed to fetch bills');
    }
  },

  // ─── Get suppliers ─────────────────────────────────────────────
  getSuppliers: async (): Promise<Supplier[]> => {
    try {
      const response = await apiClient.get('/api/accounts-payable/suppliers');
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
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Get bank accounts error:', error);
      return [];
    }
  },

  // ─── Create bill ───────────────────────────────────────────────
  createBill: async (data: CreateBillRequest): Promise<Bill> => {
    try {
      // Generate bill number if not provided
      const billNumber = data.billNumber || `BILL-${Date.now()}`;
      
      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const taxTotal = subtotal * ((data.taxRate || 0) / 100);
      const totalAmount = subtotal + taxTotal - (data.discount || 0);
      
      const payload = {
        ...data,
        billNumber,
        subtotal,
        taxTotal,
        totalAmount,
        items: data.items.map(item => ({
          ...item,
          amount: item.quantity * item.unitPrice,
          taxRate: data.taxRate || 0,
          taxAmount: (item.quantity * item.unitPrice) * ((data.taxRate || 0) / 100)
        }))
      };
      
      const response = await apiClient.post('/api/bills', payload);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create bill');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Create bill error:', error);
      throw new Error(error.message || 'Failed to create bill');
    }
  },

  // ─── Get bill by ID ────────────────────────────────────────────
  getBillById: async (id: string): Promise<Bill> => {
    try {
      const response = await apiClient.get(`/api/bills/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch bill');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Get bill error:', error);
      throw new Error(error.message || 'Failed to fetch bill');
    }
  },

  // ─── Record payment ────────────────────────────────────────────
  recordPayment: async (data: RecordPaymentRequest): Promise<any> => {
    try {
      const payload = {
        billId: data.billId,
        supplierId: data.supplierId,
        amount: data.amount,
        paymentDate: data.paymentDate.toISOString().split('T')[0],
        paymentMethod: data.paymentMethod,
        reference: data.reference,
        bankAccountId: data.bankAccountId,
        notes: data.notes || ''
      };
      
      const response = await apiClient.post('/api/bills/payments', payload);
      if (!response.success) {
        throw new Error(response.message || 'Failed to record payment');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Record payment error:', error);
      throw new Error(error.message || 'Failed to record payment');
    }
  },

  // ─── Update bill ───────────────────────────────────────────────
  updateBill: async (id: string, data: Partial<CreateBillRequest>): Promise<Bill> => {
    try {
      const response = await apiClient.put(`/api/bills/${id}`, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update bill');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Update bill error:', error);
      throw new Error(error.message || 'Failed to update bill');
    }
  },

  // ─── Delete bill ───────────────────────────────────────────────
  deleteBill: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.delete(`/api/bills/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete bill');
      }
    } catch (error: any) {
      console.error('Delete bill error:', error);
      throw new Error(error.message || 'Failed to delete bill');
    }
  }
};