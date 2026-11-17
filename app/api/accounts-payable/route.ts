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
  invoiceNumber?: string;
  documentLabel?: string;
  date: string;
  dueDate: string;
  supplierId: string;
  supplierName: string;
  vendorId?: string;
  vendorName?: string;
  items: BillItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  amount?: number;
  totalAmount: number;
  paidAmount: number;
  outstanding: number;
  status: 'Unpaid' | 'Paid' | 'Overdue' | 'Partial';
  reference: string;
  description: string;
  source?: 'bill' | 'purchaseInvoice';
  currencyId?: string | null;
  currency?: {
    id: string;
    code: string;
    name: string;
    symbol: string;
  } | null;
  exchangeRate?: number | string;
  foreignAmount?: number | string | null;
  baseAmount?: number | string | null;
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
  companyName?: string;
  outstandingAmount?: number;
  totalAmount?: number;
  paidAmount?: number;
  invoiceCount?: number;
  totalInvoices?: number;
  billCount?: number;
  invoices?: Bill[];
  bills?: Bill[];
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

  const source = (raw?.source === 'purchaseInvoice' ? 'purchaseInvoice' : raw?.source === 'bill' ? 'bill' : undefined) as
    | 'bill'
    | 'purchaseInvoice'
    | undefined;
  const documentLabel =
    str(raw?.documentLabel) ||
    (source === 'purchaseInvoice' ? 'Purchase Invoice' : source === 'bill' ? 'Vendor Bill' : 'Payable');

  return {
    id: str(raw?.id || raw?._id),
    billNumber: str(raw?.billNumber || raw?.invoiceNumber),
    invoiceNumber: str(raw?.invoiceNumber || raw?.billNumber),
    documentLabel,
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
    amount: totalAmount,
    totalAmount,
    paidAmount,
    outstanding,
    status: (raw?.status || 'Unpaid') as Bill['status'],
    reference: str(raw?.reference),
    description: str(raw?.description || raw?.notes),
    source,
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

  // ─── Get suppliers (AP ledger: open purchase invoices nested) ───
  getSuppliers: async (params: {
    search?: string;
    filter?: string;
    status?: string;
  } = {}): Promise<Supplier[]> => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
      const url = `/api/accounts-payable/suppliers${query.toString() ? `?${query}` : ''}`;
      const response = await apiClient.get(url);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch suppliers');
      }
      const rows = response.data?.data || [];
      return rows.map((raw: any) => {
        const invoices = Array.isArray(raw.invoices || raw.bills)
          ? (raw.invoices || raw.bills).map(normalizeBill)
          : [];
        return {
          id: str(raw.id || raw._id),
          name: str(raw.name),
          email: str(raw.email),
          phone: str(raw.phone),
          address: str(raw.address),
          companyName: str(raw.companyName),
          outstandingAmount: num(raw.outstandingAmount),
          totalAmount: num(raw.totalAmount),
          paidAmount: num(raw.paidAmount),
          invoiceCount: num(raw.invoiceCount ?? raw.billCount ?? invoices.length),
          totalInvoices: num(raw.totalInvoices ?? raw.invoiceCount ?? invoices.length),
          billCount: num(raw.billCount ?? invoices.length),
          invoices,
          bills: invoices,
        } as Supplier;
      });
    } catch (error: any) {
      console.error('Get suppliers error:', error);
      return [];
    }
  },

  // ─── Get bank accounts ─────────────────────────────────────────
  getBankAccounts: async (): Promise<BankAccount[]> => {
    try {
      // Match working screens (stock/expenses): load Active banks with a high limit
      const response = await apiClient.get('/api/bank-accounts?limit=100&status=Active');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch bank accounts');
      }

      const payload = response.data;
      const list = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];

      return list.map(normalizeBankAccount).filter((acc) => acc.id);
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