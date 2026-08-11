import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface EquityAccount {
  id: string;
  accountName: string;
  accountCode: string;
  accountType: 'Capital' | 'Retained Earnings' | 'Drawings' | 'Reserves';
  currentBalance: number;
  openingBalance: number;
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
  if (n.includes('retained') || n.includes('retention')) return 'Retained Earnings';
  if (n.includes('reserve')) return 'Reserves';
  return 'Capital';
}

export function mapChartAccountToEquity(account: any): EquityAccount {
  return {
    id: account.id,
    accountName: account.name || account.accountName || '',
    accountCode: account.code || account.accountCode || '',
    accountType: deriveAccountType(account.name || '', account.subType || account.accountType),
    currentBalance: Number(account.currentBalance ?? account.balance ?? account.openingBalance ?? 0),
    openingBalance: Number(account.openingBalance ?? 0),
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
  const totalDrawings = accounts
    .filter((a) => a.accountType === 'Drawings')
    .reduce((sum, a) => sum + a.currentBalance, 0);

  return {
    totalCapital,
    totalRetainedEarnings,
    totalReserves,
    totalDrawings,
    totalEquity: totalCapital + totalRetainedEarnings + totalReserves - totalDrawings,
  };
}

// ─── SERVICE ──────────────────────────────────────────────────

export const equityService = {
  // Same source as Flutter: Chart of Accounts filtered to Equity
  getEquityAccounts: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    accountType?: string;
  } = {}): Promise<EquityListResponse> => {
    const query = new URLSearchParams();
    query.set('type', 'Equity');

    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);

    const url = `/api/chart-of-accounts?${query.toString()}`;

    try {
      const response = await apiClient.get(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch equity accounts');
      }

      const payload = response.data || {};
      let accounts = (payload.data || []).map(mapChartAccountToEquity);

      if (params.accountType && params.accountType !== 'All') {
        accounts = accounts.filter((a: EquityAccount) => a.accountType === params.accountType);
      }

      const pagination = payload.pagination || {};
      const summary = buildEquitySummary(accounts);

      return {
        success: true,
        data: accounts,
        summary,
        pagination: {
          page: pagination.page || params.page || 1,
          limit: pagination.limit || params.limit || 20,
          total: pagination.total ?? accounts.length,
          pages: pagination.pages ?? 1,
          hasNext: pagination.hasNext ?? false,
          hasPrev: pagination.hasPrev ?? false,
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
