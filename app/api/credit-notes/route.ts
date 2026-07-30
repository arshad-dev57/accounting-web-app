import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface CreditNoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  originalInvoiceAmount: number;
  amount: number;
  reason: string;
  reasonType: string;
  items: CreditNoteItem[];
  status: string;
  appliedAmount: number;
  remainingAmount: number;
  expiryDate: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Summary {
  totalCount: number;
  totalAmount: number;
  appliedAmount: number;
  remainingAmount: number;
  expiredAmount: number;
  thisMonth: number;
  thisWeek: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface InvoiceForCreditNote {
  id: string;
  invoiceNumber: string;
  amount: number;
  outstanding: number;
  date: string;
  status: string;
}

export interface CreditNoteListResponse {
  success: boolean;
  data: CreditNote[];
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

export interface CreateCreditNoteRequest {
  customerId: string;
  originalInvoiceId: string;
  amount: number;
  reason: string;
  reasonType: string;
  items: CreditNoteItem[];
  notes?: string;
  expiryDays?: number;
}

export interface ApplyCreditNoteRequest {
  creditNoteId: string;
  invoiceId: string;
  amount: number;
}

// ─── SERVICE ──────────────────────────────────────────────────

export const creditNotesService = {
  // ─── Get summary ──────────────────────────────────────────────
  getSummary: async (): Promise<Summary> => {
    try {
      const response = await apiClient.get('/api/credit-notes/summary');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch summary');
      }
      return response.data?.data || {
        totalCount: 0,
        totalAmount: 0,
        appliedAmount: 0,
        remainingAmount: 0,
        expiredAmount: 0,
        thisMonth: 0,
        thisWeek: 0
      };
    } catch (error: any) {
      console.error('Get summary error:', error);
      throw new Error(error.message || 'Failed to fetch summary');
    }
  },

  // ─── Get credit notes with pagination and filters ────────────
  getCreditNotes: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {}): Promise<CreditNoteListResponse> => {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/credit-notes${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch credit notes');
      }
      
      const data = response.data || {};
      
      return {
        success: response.success,
        data: data.data || [],
        summary: data.summary || {
          totalCount: 0,
          totalAmount: 0,
          appliedAmount: 0,
          remainingAmount: 0,
          expiredAmount: 0,
          thisMonth: 0,
          thisWeek: 0
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
      console.error('Get credit notes error:', error);
      throw new Error(error.message || 'Failed to fetch credit notes');
    }
  },

  // ─── Get customers ─────────────────────────────────────────────
  getCustomers: async (): Promise<Customer[]> => {
    try {
      const response = await apiClient.get('/api/accounts-receivable/customers');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch customers');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Get customers error:', error);
      return [];
    }
  },

  // ─── Get unpaid invoices for customer ─────────────────────────
  getUnpaidInvoices: async (customerId: string): Promise<InvoiceForCreditNote[]> => {
    try {
      const response = await apiClient.get(`/api/credit-notes/unpaid-invoices/${customerId}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch unpaid invoices');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Get unpaid invoices error:', error);
      return [];
    }
  },

  // ─── Create credit note ────────────────────────────────────────
  createCreditNote: async (data: CreateCreditNoteRequest): Promise<CreditNote> => {
    try {
      const response = await apiClient.post('/api/credit-notes', data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create credit note');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Create credit note error:', error);
      throw new Error(error.message || 'Failed to create credit note');
    }
  },

  // ─── Apply credit note ─────────────────────────────────────────
  applyCreditNote: async (data: ApplyCreditNoteRequest): Promise<any> => {
    try {
      const response = await apiClient.post('/api/credit-notes/apply', data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to apply credit note');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Apply credit note error:', error);
      throw new Error(error.message || 'Failed to apply credit note');
    }
  },

  // ─── Get credit note by ID ─────────────────────────────────────
  getCreditNoteById: async (id: string): Promise<CreditNote> => {
    try {
      const response = await apiClient.get(`/api/credit-notes/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch credit note');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Get credit note error:', error);
      throw new Error(error.message || 'Failed to fetch credit note');
    }
  },

  // ─── Delete credit note ────────────────────────────────────────
  deleteCreditNote: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.delete(`/api/credit-notes/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete credit note');
      }
    } catch (error: any) {
      console.error('Delete credit note error:', error);
      throw new Error(error.message || 'Failed to delete credit note');
    }
  }
};