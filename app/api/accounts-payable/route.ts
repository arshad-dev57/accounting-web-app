import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface BillItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
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
  taxRate: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  outstanding: number;
  status: 'Unpaid' | 'Paid' | 'Overdue' | 'Partial';
  reference: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Summary {
  totalOutstanding: number;
  overdue: number;
  dueThisWeek: number;
  dueThisMonth: number;
  totalBills: number;
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
  billNumber: string;
  date: string;
  dueDate: string;
  supplierId: string;
  reference?: string;
  description?: string;
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

function num(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return 0;
}

function str(value: unknown): string {
  if (value == null) return '';
  return String(value);
}

function normalizeBill(raw: any): Bill {
  const vendor = raw?.vendor;
  let supplierId = str(raw?.supplierId || raw?.vendorId);
  let supplierName = str(raw?.supplierName || raw?.vendorName);

  if (vendor && typeof vendor === 'object') {
    supplierId = str(vendor.id || vendor._id || supplierId);
    if (!supplierName) supplierName = str(vendor.name);
  }

  const totalAmount = num(raw?.totalAmount);
  const paidAmount = num(raw?.paidAmount);
  const outstanding =
    raw?.outstanding != null ? num(raw.outstanding) : totalAmount - paidAmount;

  return {
    id: str(raw?.id || raw?._id),
    billNumber: str(raw?.billNumber),
    date: raw?.date ? String(raw.date) : new Date().toISOString(),
    dueDate: raw?.dueDate ? String(raw.dueDate) : new Date().toISOString(),
    supplierId,
    supplierName,
    items: Array.isArray(raw?.items)
      ? raw.items.map((item: any) => ({
          description: str(item.description),
          quantity: num(item.quantity),
          unitPrice: num(item.unitPrice),
          amount: num(item.amount ?? item.quantity * item.unitPrice),
        }))
      : [],
    subtotal: num(raw?.subtotal),
    taxRate: num(raw?.taxRate),
    taxAmount: num(raw?.taxAmount ?? raw?.taxTotal),
    discount: num(raw?.discount),
    totalAmount,
    paidAmount,
    outstanding,
    status: (raw?.status || 'Unpaid') as Bill['status'],
    reference: str(raw?.reference),
    description: str(raw?.description || raw?.notes),
    createdAt: str(raw?.createdAt),
    updatedAt: str(raw?.updatedAt),
  };
}

function normalizeBankAccount(raw: any): BankAccount {
  return {
    id: str(raw?.id || raw?._id),
    name: str(raw?.accountName || raw?.name),
    accountNumber: str(raw?.accountNumber),
    bankName: str(raw?.bankName),
  };
}

// ─── SERVICE ──────────────────────────────────────────────────

export const accountsPayableService = {
  // ─── Get summary ──────────────────────────────────────────────
  getSummary: async (params: { locationId?: string; fiscalYearId?: string } = {}): Promise<Summary> => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
      const url = `/api/accounts-payable/summary${query.toString() ? `?${query.toString()}` : ''}`;
      const response = await apiClient.get(url);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch summary');
      }
      return response.data?.data || {
        totalOutstanding: 0,
        overdue: 0,
        dueThisWeek: 0,
        dueThisMonth: 0,
        totalBills: 0
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
    locationId?: string;
    fiscalYearId?: string;
  } = {}): Promise<BillListResponse> => {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/accounts-payable/bills${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch bills');
      }
      
      const data = response.data || {};
      const bills = (data.data || []).map(normalizeBill);

      return {
        success: response.success,
        data: bills,
        summary: data.summary,
        pagination: data.pagination || {
          page: params.page || 1,
          limit: params.limit || 10,
          total: data.count ?? bills.length,
          pages: Math.max(1, Math.ceil((data.count ?? bills.length) / (params.limit || 10))),
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
      return (response.data?.data || []).map(normalizeBankAccount);
    } catch (error: any) {
      console.error('Get bank accounts error:', error);
      return [];
    }
  },

  // ─── Create bill ───────────────────────────────────────────────
  createBill: async (data: CreateBillRequest): Promise<Bill> => {
    try {
      const response = await apiClient.post('/api/accounts-payable/bills', data);
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
      const response = await apiClient.get(`/api/accounts-payable/bills/${id}`);
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
      
      const response = await apiClient.post('/api/accounts-payable/payments', payload);
      if (!response.success) {
        throw new Error(response.message || 'Failed to record payment');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Record payment error:', error);
      throw new Error(error.message || 'Failed to record payment');
    }
  },

  // ─── Get next bill number ──────────────────────────────────────
  getNextBillNumber: async (): Promise<string> => {
    try {
      const response = await apiClient.get('/api/accounts-payable/next-bill-number');
      if (!response.success) {
        throw new Error(response.message || 'Failed to get next bill number');
      }
      return response.data?.data || `BILL-${Date.now()}`;
    } catch (error: any) {
      console.error('Get next bill number error:', error);
      return `BILL-${Date.now()}`;
    }
  },

  // ─── Update bill ───────────────────────────────────────────────
  updateBill: async (id: string, data: Partial<CreateBillRequest>): Promise<Bill> => {
    try {
      const response = await apiClient.put(`/api/accounts-payable/bills/${id}`, data);
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
      const response = await apiClient.delete(`/api/accounts-payable/bills/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete bill');
      }
    } catch (error: any) {
      console.error('Delete bill error:', error);
      throw new Error(error.message || 'Failed to delete bill');
    }
  }
};