import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface EquityAccount {
  id: string;
  accountName: string;
  accountCode: string;
  accountType: 'Capital' | 'Retained Earnings' | 'Drawings' | 'Reserves';
  currentBalance: number;
  openingBalance: number;
  additions?: number;
  withdrawals?: number;
  lastUpdated: string;
  description?: string;
}

export interface EquitySummary {
  totalCapital: number;
  totalRetainedEarnings: number;
  totalReserves: number;
  totalDrawings: number;
  totalEquity: number;
}

export interface OwnerTransaction {
  id: string;
  accountId?: string;
  accountName?: string;
  transactionType: string;
  type?: string;
  amount: number;
  description: string;
  reference?: string;
  transactionDate?: string;
  date?: string;
  createdAt?: string;
}

export interface EquityListResponse {
  success: boolean;
  data: EquityAccount[];
  summary: EquitySummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

function deriveAccountType(
  name: string,
  subType?: string
): EquityAccount['accountType'] {
  const fromSub = (subType || '').toLowerCase();
  if (fromSub.includes('drawing')) return 'Drawings';
  if (fromSub.includes('retained') || fromSub.includes('retention')) return 'Retained Earnings';
  if (fromSub.includes('reserve')) return 'Reserves';
  if (fromSub.includes('capital') || fromSub.includes('share')) return 'Capital';

  const n = (name || '').toLowerCase();
  if (n.includes('drawing')) return 'Drawings';
  if (
    n.includes('retained') ||
    n.includes('retention') ||
    n.includes('current year')
  ) {
    return 'Retained Earnings';
  }
  if (n.includes('reserve')) return 'Reserves';
  return 'Capital';
}

export function mapChartAccountToEquity(account: any): EquityAccount {
  const balance = Number(account.currentBalance ?? account.balance ?? account.openingBalance ?? 0);
  const accountType = deriveAccountType(account.name || '', account.subType || account.accountType);
  return {
    id: account.id,
    accountName: account.name || account.accountName || '',
    accountCode: account.code || account.accountCode || '',
    accountType,
    // Drawings: show absolute withdrawal amount for list readability
    currentBalance:
      accountType === 'Drawings' ? Math.abs(balance) : balance,
    openingBalance: Number(account.openingBalance ?? 0),
    additions: Number(account.additions ?? 0),
    withdrawals: Number(account.withdrawals ?? 0),
    lastUpdated: account.updatedAt || new Date().toISOString(),
    description: account.description || account.notes || '',
  };
}

export function buildEquitySummary(accounts: EquityAccount[]): EquitySummary {
  const totalCapital = accounts
    .filter((a) => a.accountType === 'Capital')
    .reduce((sum, a) => sum + a.currentBalance, 0);
  const totalRetainedEarnings = accounts
    .filter((a) => a.accountType === 'Retained Earnings')
    .reduce((sum, a) => sum + a.currentBalance, 0);
  const totalReserves = accounts
    .filter((a) => a.accountType === 'Reserves')
    .reduce((sum, a) => sum + a.currentBalance, 0);
  // Drawings may be stored as negative (credit-normal after debit) — display as absolute
  const totalDrawings = accounts
    .filter((a) => a.accountType === 'Drawings')
    .reduce((sum, a) => sum + Math.abs(a.currentBalance), 0);

  return {
    totalCapital,
    totalRetainedEarnings,
    totalReserves,
    totalDrawings,
    // Signed sum: drawings already reduce equity when negative; otherwise subtract abs
    totalEquity: accounts.reduce((sum, a) => {
      if (a.accountType === 'Drawings') return sum - Math.abs(a.currentBalance);
      return sum + a.currentBalance;
    }, 0),
  };
}

// ─── SERVICE ──────────────────────────────────────────────────

export const equityService = {
  getBankAccounts: async (): Promise<{ id: string; accountName: string }[]> => {
    try {
      const response = await apiClient.get('/api/bank-accounts');
      if (!response.success) return [];
      return response.data?.data || [];
    } catch {
      return [];
    }
  },

  // Equity COA via /api/equity (includes additions/withdrawals + live CYE)
  getEquityAccounts: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    accountType?: string;
  } = {}): Promise<EquityListResponse> => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.accountType && params.accountType !== 'All') {
      query.set('accountType', params.accountType);
    }

    const qs = query.toString();
    const url = qs ? `/api/equity?${qs}` : '/api/equity';

    try {
      const response = await apiClient.get(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch equity accounts');
      }

      const payload = response.data || {};
      let accounts = (payload.data || []).map((row: any) =>
        mapChartAccountToEquity({
          id: row.id,
          name: row.accountName || row.name,
          code: row.accountCode || row.code,
          currentBalance: row.currentBalance,
          openingBalance: row.openingBalance,
          updatedAt: row.lastUpdated,
          description: row.notes || row.description,
          additions: row.additions,
          withdrawals: row.withdrawals,
          accountType: row.accountType,
        })
      );

      if (params.accountType && params.accountType !== 'All') {
        accounts = accounts.filter((a: EquityAccount) => a.accountType === params.accountType);
      }

      const page = params.page || 1;
      const limit = params.limit || 20;
      const total = accounts.length;
      const pages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;
      const paged = accounts.slice(start, start + limit);
      const summary = buildEquitySummary(accounts);

      return {
        success: true,
        data: paged,
        summary,
        pagination: {
          page,
          limit,
          total,
          pages,
          hasNext: page < pages,
          hasPrev: page > 1,
        },
      };
    } catch (error: any) {
      console.error('Get equity accounts error:', error);
      throw new Error(error.message || 'Failed to fetch equity accounts');
    }
  },

  getSummary: async (): Promise<EquitySummary> => {
    try {
      const response = await apiClient.get('/api/equity/summary');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch summary');
      }
      return (
        response.data?.data || {
          totalCapital: 0,
          totalRetainedEarnings: 0,
          totalReserves: 0,
          totalDrawings: 0,
          totalEquity: 0,
        }
      );
    } catch (error: any) {
      console.error('Get summary error:', error);
      throw new Error(error.message || 'Failed to fetch summary');
    }
  },

  getTransactions: async (): Promise<OwnerTransaction[]> => {
    try {
      const response = await apiClient.get('/api/equity/transactions');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch transactions');
      }
      const rows = response.data?.data || [];
      return rows.map((txn: any) => ({
        id: txn.id,
        accountId: txn.accountId,
        accountName: txn.accountName || txn.account?.accountName,
        transactionType: txn.type || txn.transactionType || 'Additional Capital',
        type: txn.type || txn.transactionType,
        amount: Number(txn.amount || 0),
        description: txn.description || '',
        reference: txn.reference || '',
        transactionDate: txn.date || txn.transactionDate,
        date: txn.date || txn.transactionDate,
        createdAt: txn.createdAt,
      }));
    } catch (error: any) {
      console.error('Get transactions error:', error);
      throw new Error(error.message || 'Failed to fetch transactions');
    }
  },

  addCapital: async (data: {
    accountId: string;
    amount: number;
    description: string;
    reference?: string;
    paymentMethod?: string;
    bankAccountId?: string | null;
  }): Promise<any> => {
    try {
      const response = await apiClient.post('/api/equity/add-capital', data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to add capital');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Add capital error:', error);
      throw new Error(error.message || 'Failed to add capital');
    }
  },

  recordDrawings: async (data: {
    accountId: string;
    amount: number;
    description: string;
    reference?: string;
    paymentMethod?: string;
    bankAccountId?: string | null;
  }): Promise<any> => {
    try {
      const response = await apiClient.post('/api/equity/record-drawings', data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to record drawings');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Record drawings error:', error);
      throw new Error(error.message || 'Failed to record drawings');
    }
  },

  transferToRetainedEarnings: async (data: {
    amount: number;
    description: string;
  }): Promise<any> => {
    try {
      const response = await apiClient.post('/api/equity/transfer-retained-earnings', data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to transfer');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Transfer error:', error);
      throw new Error(error.message || 'Failed to transfer');
    }
  },
};
