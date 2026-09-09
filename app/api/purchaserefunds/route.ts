import { apiClient } from '@/lib/api-client';
import { purchaseReturnService, PurchaseReturnModel } from '../purchasereturns/route';

// ─── TYPES ─────────────────────────────────────────────────────

export interface RefundModel {
  id: string;
  refundNumber: string;
  refundDate: string;
  purchaseId?: string | null;
  purchaseNumber?: string;
  supplierId?: string | null;
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  returnId?: string | null;
  returnNumber?: string;
  amount: number;
  refundMethod: string;
  refundStatus: string;
  refundType?: string;
  reason: string;
  notes?: string;
  referenceNumber?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReturnModel = PurchaseReturnModel;

export interface RefundStats {
  total: number;
  totalAmount: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export interface RefundListResponse {
  success: boolean;
  data: RefundModel[];
  stats: RefundStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreatePurchaseRefundRequest {
  purchaseId?: string | null;
  purchaseNumber?: string;
  supplierId?: string | null;
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  returnId?: string | null;
  returnNumber?: string;
  amount: number;
  refundMethod: string;
  reason: string;
  notes?: string;
  referenceNumber?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
}

// ─── SERVICE ──────────────────────────────────────────────────

export const purchaseRefundService = {
  getRefunds: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    method?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<RefundListResponse> => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/purchase/refunds${query.toString() ? `?${query.toString()}` : ''}`;

    try {
      const response = await apiClient.get(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch refunds');
      }

      const data = response.data || {};

      return {
        success: response.success,
        data: data.data || [],
        stats: data.stats || {
          total: 0,
          totalAmount: 0,
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0,
        },
        pagination: data.pagination || {
          page: params.page || 1,
          limit: params.limit || 20,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    } catch (error: any) {
      console.error('Get purchase refunds error:', error);
      throw new Error(error.message || 'Failed to fetch refunds');
    }
  },

  searchReturns: async (query: string, limit: number = 10): Promise<ReturnModel[]> => {
    try {
      const response = await purchaseReturnService.getReturns({
        search: query,
        status: 'Processed',
        limit,
        page: 1,
      });
      return response.data || [];
    } catch (error: any) {
      console.error('Search purchase returns error:', error);
      throw new Error(error.message || 'Failed to search returns');
    }
  },

  createRefund: async (data: CreatePurchaseRefundRequest): Promise<RefundModel> => {
    try {
      const response = await apiClient.post('/api/purchase/refunds', data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create refund');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Create purchase refund error:', error);
      throw new Error(error.message || 'Failed to create refund');
    }
  },

  getRefundById: async (id: string): Promise<RefundModel> => {
    try {
      const response = await apiClient.get(`/api/purchase/refunds/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch refund');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Get purchase refund error:', error);
      throw new Error(error.message || 'Failed to fetch refund');
    }
  },

  processRefund: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.patch(`/api/purchase/refunds/${id}/process`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to process refund');
      }
    } catch (error: any) {
      console.error('Process purchase refund error:', error);
      throw new Error(error.message || 'Failed to process refund');
    }
  },

  completeRefund: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.patch(`/api/purchase/refunds/${id}/complete`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to complete refund');
      }
    } catch (error: any) {
      console.error('Complete purchase refund error:', error);
      throw new Error(error.message || 'Failed to complete refund');
    }
  },

  cancelRefund: async (id: string, reason: string): Promise<void> => {
    try {
      const response = await apiClient.patch(`/api/purchase/refunds/${id}/cancel`, { reason });
      if (!response.success) {
        throw new Error(response.message || 'Failed to cancel refund');
      }
    } catch (error: any) {
      console.error('Cancel purchase refund error:', error);
      throw new Error(error.message || 'Failed to cancel refund');
    }
  },

  deleteRefund: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.delete(`/api/purchase/refunds/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete refund');
      }
    } catch (error: any) {
      console.error('Delete purchase refund error:', error);
      throw new Error(error.message || 'Failed to delete refund');
    }
  },

  updateRefund: async (id: string, data: Partial<CreatePurchaseRefundRequest>): Promise<RefundModel> => {
    try {
      const response = await apiClient.put(`/api/purchase/refunds/${id}`, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update refund');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Update purchase refund error:', error);
      throw new Error(error.message || 'Failed to update refund');
    }
  },

  getRefundStats: async (params?: { startDate?: string; endDate?: string }): Promise<RefundStats> => {
    try {
      const query = new URLSearchParams({ type: 'purchase' });
      if (params?.startDate) query.append('startDate', params.startDate);
      if (params?.endDate) query.append('endDate', params.endDate);

      const url = `/api/purchase/refunds/stats?${query.toString()}`;
      const response = await apiClient.get(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch refund stats');
      }

      return response.data?.data || {
        total: 0,
        totalAmount: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      };
    } catch (error: any) {
      console.error('Get purchase refund stats error:', error);
      throw new Error(error.message || 'Failed to fetch refund stats');
    }
  },
};
