import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface EMIPayment {
  date: string;
  amount: number;
  status: string;
  type: string;
  reference: string;
  notes: string;
}

export interface Loan {
  id: string;
  loanNumber: string;
  loanType: string;
  lenderName: string;
  loanAmount: number;
  disbursementDate: string;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  totalPaid: number;
  outstandingBalance: number;
  nextPaymentDate: string | null;
  lastPaymentDate: string | null;
  status: string;
  purpose: string;
  collateral: string;
  accountNumber: string;
  notes: string;
  payments: EMIPayment[];
}

export interface Summary {
  totalLoans: number;
  totalPrincipal: number;
  totalOutstanding: number;
  totalPaid: number;
  totalEMI: number;
}

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  balance: number;
}

export interface LoanListResponse {
  success: boolean;
  data: Loan[];
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

export interface CreateLoanRequest {
  loanType: string;
  lenderName: string;
  loanAmount: number;
  disbursementDate: Date;
  interestRate: number;
  tenureMonths: number;
  purpose: string;
  collateral: string;
  accountNumber: string;
  bankAccountId?: string;
  notes?: string;
}

export interface RecordPaymentRequest {
  loanId: string;
  amount: number;
  paymentDate: Date;
  reference?: string;
  notes?: string;
  type?: string;
}

// ─── SERVICE ──────────────────────────────────────────────────

export const loansService = {
  // ─── Get summary ──────────────────────────────────────────────
  getSummary: async (): Promise<Summary> => {
    try {
      const response = await apiClient.get('/api/loans/summary');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch summary');
      }
      return response.data?.data || {
        totalLoans: 0,
        totalPrincipal: 0,
        totalOutstanding: 0,
        totalPaid: 0,
        totalEMI: 0
      };
    } catch (error: any) {
      console.error('Get summary error:', error);
      throw new Error(error.message || 'Failed to fetch summary');
    }
  },

  // ─── Get loans with pagination and filters ────────────────────
  getLoans: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    loanType?: string;
  } = {}): Promise<LoanListResponse> => {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/loans${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch loans');
      }
      
      const data = response.data || {};
      
      return {
        success: response.success,
        data: data.data || [],
        summary: data.summary || {
          totalLoans: 0,
          totalPrincipal: 0,
          totalOutstanding: 0,
          totalPaid: 0,
          totalEMI: 0
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
      console.error('Get loans error:', error);
      throw new Error(error.message || 'Failed to fetch loans');
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

  // ─── Create loan ──────────────────────────────────────────────
  createLoan: async (data: CreateLoanRequest): Promise<Loan> => {
    try {
      const payload = {
        loanType: data.loanType,
        lenderName: data.lenderName,
        loanAmount: data.loanAmount,
        disbursementDate: data.disbursementDate.toISOString().split('T')[0],
        interestRate: data.interestRate,
        tenureMonths: data.tenureMonths,
        purpose: data.purpose,
        collateral: data.collateral,
        accountNumber: data.accountNumber,
        bankAccountId: data.bankAccountId,
        notes: data.notes || ''
      };
      
      const response = await apiClient.post('/api/loans', payload);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create loan');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Create loan error:', error);
      throw new Error(error.message || 'Failed to create loan');
    }
  },

  // ─── Record payment ────────────────────────────────────────────
  recordPayment: async (data: RecordPaymentRequest): Promise<any> => {
    try {
      const payload = {
        loanId: data.loanId,
        amount: data.amount,
        paymentDate: data.paymentDate.toISOString().split('T')[0],
        reference: data.reference || '',
        notes: data.notes || '',
        type: data.type || 'EMI'
      };
      
      const response = await apiClient.post('/api/loans/payment', payload);
      if (!response.success) {
        throw new Error(response.message || 'Failed to record payment');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Record payment error:', error);
      throw new Error(error.message || 'Failed to record payment');
    }
  },

  // ─── Get payment schedule ──────────────────────────────────────
  getPaymentSchedule: async (loanId: string): Promise<EMIPayment[]> => {
    try {
      const response = await apiClient.get(`/api/loans/${loanId}/schedule`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch payment schedule');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Get payment schedule error:', error);
      throw new Error(error.message || 'Failed to fetch payment schedule');
    }
  },

  // ─── Get loan by ID ────────────────────────────────────────────
  getLoanById: async (id: string): Promise<Loan> => {
    try {
      const response = await apiClient.get(`/api/loans/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch loan');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Get loan error:', error);
      throw new Error(error.message || 'Failed to fetch loan');
    }
  },

  // ─── Calculate EMI ─────────────────────────────────────────────
  calculateEMI: async (params: {
    loanAmount: number;
    interestRate: number;
    tenureMonths: number;
  }): Promise<{ emi: number; totalPayment: number; totalInterest: number }> => {
    try {
      const response = await apiClient.post('/api/loans/calculate-emi', params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to calculate EMI');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Calculate EMI error:', error);
      throw new Error(error.message || 'Failed to calculate EMI');
    }
  },

  // ─── Prepay loan ───────────────────────────────────────────────
  prepayLoan: async (data: {
    loanId: string;
    prepaymentAmount: number;
    paymentDate: Date;
    reference?: string;
  }): Promise<any> => {
    try {
      const payload = {
        loanId: data.loanId,
        prepaymentAmount: data.prepaymentAmount,
        paymentDate: data.paymentDate.toISOString().split('T')[0],
        reference: data.reference || ''
      };
      
      const response = await apiClient.post('/api/loans/prepayment', payload);
      if (!response.success) {
        throw new Error(response.message || 'Failed to process prepayment');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Prepay loan error:', error);
      throw new Error(error.message || 'Failed to process prepayment');
    }
  }
};