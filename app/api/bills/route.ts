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
  status: 'Unpaid' | 'Paid' | 'Overdue' | 'Partial' | string;
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

// ─── HELPERS (mirror Flutter Bill.fromJson) ─────────────────────

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
          taxRate: num(item.taxRate),
          taxAmount: num(item.taxAmount),
        }))
      : [],
    subtotal: num(raw?.subtotal),
    taxTotal: num(raw?.taxTotal ?? raw?.taxAmount),
    discount: num(raw?.discount),
    totalAmount,
    paidAmount,
    outstanding,
    status: str(raw?.status || 'Unpaid'),
    reference: str(raw?.reference),
    description: str(raw?.description),
    notes: str(raw?.notes),
    createdAt: str(raw?.createdAt),
    updatedAt: str(raw?.updatedAt),
  };
}

function computeSummary(bills: Bill[]): Summary {
  const totalAmount = bills.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalPaid = bills.reduce((sum, b) => sum + b.paidAmount, 0);
  return {
    totalBills: bills.length,
    totalAmount,
    totalPaid,
    totalOutstanding: totalAmount - totalPaid,
  };
}

function matchesSearch(bill: Bill, search?: string): boolean {
  if (!search?.trim()) return true;
  const q = search.trim().toLowerCase();
  return (
    bill.billNumber.toLowerCase().includes(q) ||
    bill.supplierName.toLowerCase().includes(q) ||
    bill.reference.toLowerCase().includes(q) ||
    bill.notes.toLowerCase().includes(q)
  );
}

function paginate<T>(
  items: T[],
  page = 1,
  limit = 10
): { data: T[]; pagination: BillListResponse['pagination'] } {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / limit) || 1);
  const safePage = Math.min(Math.max(page, 1), pages);
  const start = (safePage - 1) * limit;
  return {
    data: items.slice(start, start + limit),
    pagination: {
      page: safePage,
      limit,
      total,
      pages,
      hasNext: safePage < pages,
      hasPrev: safePage > 1,
    },
  };
}

// ─── SERVICE (same endpoints as Flutter) ────────────────────────

export const billsService = {
  // ─── Get summary (computed like Flutter from bills list) ──────
  getSummary: async (): Promise<Summary> => {
    try {
      const response = await apiClient.get('/api/accounts-payable/bills');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch summary');
      }
      const bills = ((response.data?.data as any[]) || []).map(normalizeBill);
      return computeSummary(bills);
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

    // Backend supports: supplierId, status, startDate, endDate, fiscalYearId
    if (params.status) query.append('status', params.status);
    if (params.supplierId) query.append('supplierId', params.supplierId);

    const url = `/api/accounts-payable/bills${
      query.toString() ? `?${query.toString()}` : ''
    }`;

    try {
      const response = await apiClient.get(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch bills');
      }

      const payload = response.data || {};
      let bills = ((payload.data as any[]) || []).map(normalizeBill);

      // Backend does not search — filter client-side (Flutter also soft-handles this)
      bills = bills.filter((b) => matchesSearch(b, params.search));

      const page = params.page || 1;
      const limit = params.limit || 10;
      const summary = computeSummary(bills);

      // Prefer server pagination if present; otherwise paginate locally
      if (payload.pagination) {
        return {
          success: true,
          data: bills,
          summary,
          pagination: {
            page: payload.pagination.page || page,
            limit: payload.pagination.limit || limit,
            total: payload.pagination.total ?? payload.count ?? bills.length,
            pages: payload.pagination.pages || 1,
            hasNext: Boolean(payload.pagination.hasNext),
            hasPrev: Boolean(payload.pagination.hasPrev),
          },
        };
      }

      const paged = paginate(bills, page, limit);
      return {
        success: true,
        data: paged.data,
        summary,
        pagination: paged.pagination,
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
      const list = (response.data?.data as any[]) || [];
      return list.map((s) => ({
        id: str(s.id || s._id),
        name: str(s.name),
        email: s.email ? str(s.email) : undefined,
        phone: s.phone ? str(s.phone) : undefined,
        address: s.address ? str(s.address) : undefined,
      }));
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
      const list = (response.data?.data as any[]) || [];
      return list.map((a) => ({
        id: str(a.id || a._id),
        name: str(a.name || a.accountName),
        accountNumber: str(a.accountNumber),
        bankName: str(a.bankName),
      }));
    } catch (error: any) {
      console.error('Get bank accounts error:', error);
      return [];
    }
  },

  // ─── Create bill ───────────────────────────────────────────────
  createBill: async (data: CreateBillRequest): Promise<Bill> => {
    try {
      const payload = {
        supplierId: data.supplierId,
        date: data.date,
        dueDate: data.dueDate,
        reference: data.reference || '',
        notes: data.notes || data.description || '',
        discount: data.discount || 0,
        items: data.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate ?? data.taxRate ?? 0,
        })),
      };

      const response = await apiClient.post('/api/accounts-payable/bills', payload);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create bill');
      }
      return normalizeBill(response.data?.data);
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
      return normalizeBill(response.data?.data);
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
        notes: data.notes || '',
      };

      const response = await apiClient.post(
        '/api/accounts-payable/payments',
        payload
      );
      if (!response.success) {
        throw new Error(response.message || 'Failed to record payment');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Record payment error:', error);
      throw new Error(error.message || 'Failed to record payment');
    }
  },

  // ─── Update bill (not exposed by backend currently) ────────────
  updateBill: async (id: string, data: Partial<CreateBillRequest>): Promise<Bill> => {
    try {
      const response = await apiClient.put(
        `/api/accounts-payable/bills/${id}`,
        data
      );
      if (!response.success) {
        throw new Error(response.message || 'Failed to update bill');
      }
      return normalizeBill(response.data?.data);
    } catch (error: any) {
      console.error('Update bill error:', error);
      throw new Error(error.message || 'Failed to update bill');
    }
  },

  // ─── Delete bill (not exposed by backend currently) ────────────
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
  },
};
