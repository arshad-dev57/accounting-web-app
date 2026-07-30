import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface JournalLine {
  accountId: string;
  accountName: string;
  accountCode: string;
  debit: number;
  credit: number;
  accountType?: string;
  oldBalance?: number;
  newBalance?: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  reference: string;
  status: 'Posted' | 'Draft';
  createdBy: string;
  postedBy?: string;
  postedAt?: string;
  createdAt: string;
  updatedAt: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
}

export interface JournalEntryStats {
  totalDebit: number;
  totalCredit: number;
  difference: number;
  postedCount: number;
  draftCount: number;
}

export interface JournalEntryListResponse {
  success: boolean;
  data: JournalEntry[];
  stats: JournalEntryStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateJournalEntryRequest {
  date: string;
  description: string;
  reference?: string;
  lines: Array<{
    accountId: string;
    debit: number;
    credit: number;
  }>;
}

// ─── SERVICE ──────────────────────────────────────────────────

export const journalEntryService = {
  // ─── Get journal entries with pagination and filters ──────
  getEntries: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<JournalEntryListResponse> => {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/journal-entries${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch journal entries');
      }
      
      const data = response.data || {};
      
      // Map backend summary to frontend stats
      const summary = data.summary || {};
      const stats = data.stats || {
        totalDebit: summary.totalDebit || 0,
        totalCredit: summary.totalCredit || 0,
        difference: summary.difference || Math.abs((summary.totalDebit || 0) - (summary.totalCredit || 0)),
        postedCount: summary.postedCount || 0,
        draftCount: 0
      };
      
      // Calculate totalDebit and totalCredit for each entry from lines
      const entries = (data.data || []).map((entry: any) => ({
        ...entry,
        totalDebit: entry.totalDebit || (entry.lines || []).reduce((sum: number, line: any) => sum + (line.debit || 0), 0),
        totalCredit: entry.totalCredit || (entry.lines || []).reduce((sum: number, line: any) => sum + (line.credit || 0), 0)
      }));
      
      return {
        success: response.success,
        data: entries,
        stats,
        pagination: {
          page: data.page || params.page || 1,
          limit: data.limit || params.limit || 10,
          total: data.total || 0,
          pages: data.pages || 0,
          hasNext: data.hasNext || false,
          hasPrev: data.hasPrev || false
        }
      };
    } catch (error: any) {
      console.error('Get journal entries error:', error);
      throw new Error(error.message || 'Failed to fetch journal entries');
    }
  },

  // ─── Create journal entry ──────────────────────────────────
  createEntry: async (data: CreateJournalEntryRequest): Promise<JournalEntry> => {
    try {
      const response = await apiClient.post('/api/journal-entries', data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create journal entry');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Create journal entry error:', error);
      throw new Error(error.message || 'Failed to create journal entry');
    }
  },

  // ─── Get journal entry by ID ──────────────────────────────
  getEntryById: async (id: string): Promise<JournalEntry> => {
    try {
      const response = await apiClient.get(`/api/journal-entries/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch journal entry');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Get journal entry error:', error);
      throw new Error(error.message || 'Failed to fetch journal entry');
    }
  },

  // ─── Delete journal entry ──────────────────────────────────
  deleteEntry: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.delete(`/api/journal-entries/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete journal entry');
      }
    } catch (error: any) {
      console.error('Delete journal entry error:', error);
      throw new Error(error.message || 'Failed to delete journal entry');
    }
  },

  // ─── Update journal entry ──────────────────────────────────
  updateEntry: async (id: string, data: Partial<CreateJournalEntryRequest>): Promise<JournalEntry> => {
    try {
      const response = await apiClient.put(`/api/journal-entries/${id}`, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update journal entry');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Update journal entry error:', error);
      throw new Error(error.message || 'Failed to update journal entry');
    }
  },

  // ─── Post journal entry ────────────────────────────────────
  postEntry: async (id: string): Promise<JournalEntry> => {
    try {
      const response = await apiClient.post(`/api/journal-entries/${id}/post`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to post journal entry');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Post journal entry error:', error);
      throw new Error(error.message || 'Failed to post journal entry');
    }
  },

  // ─── Get journal entry stats ──────────────────────────────
  getStats: async (params?: { startDate?: string; endDate?: string }): Promise<JournalEntryStats> => {
    try {
      const query = new URLSearchParams();
      if (params?.startDate) query.append('startDate', params.startDate);
      if (params?.endDate) query.append('endDate', params.endDate);
      
      const url = `/api/journal-entries/stats${query.toString() ? `?${query.toString()}` : ''}`;
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch journal entry stats');
      }
      
      return response.data?.data || {
        totalDebit: 0,
        totalCredit: 0,
        difference: 0,
        postedCount: 0,
        draftCount: 0
      };
    } catch (error: any) {
      console.error('Get journal entry stats error:', error);
      throw new Error(error.message || 'Failed to fetch journal entry stats');
    }
  },

  // ─── Export journal entries ────────────────────────────────
  exportEntries: async (params?: {
    format?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<string> => {
    try {
      const query = new URLSearchParams();
      if (params?.format) query.append('format', params.format);
      if (params?.startDate) query.append('startDate', params.startDate);
      if (params?.endDate) query.append('endDate', params.endDate);
      
      const url = `/api/journal-entries/export${query.toString() ? `?${query.toString()}` : ''}`;
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to export journal entries');
      }
      
      return response.data?.data || response.data?.url || '';
    } catch (error: any) {
      console.error('Export journal entries error:', error);
      throw new Error(error.message || 'Failed to export journal entries');
    }
  }
};