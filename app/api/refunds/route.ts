// lib/api/refund/route.ts
import { apiClient } from '@/lib/api-client';

export interface Refund {
  id?: string;
  _id?: string;
  refundNumber: string;
  refundDate: string;
  orderId: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  amount: number;
  refundStatus: 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Cancelled';
  refundMethod: 'Original Payment' | 'Store Credit' | 'Bank Transfer' | 'Cash' | 'Cheque';
  reason: string;
  notes?: string;
  referenceNumber?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  processedBy?: string;
  processedAt?: string;
  completedAt?: string;
  failureReason?: string;
  attachments?: { name: string; url: string; type: string }[];
  createdBy?: { id: string; name: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface RefundListResponse {
  success: boolean;
  data: Refund[];
  stats: {
    total: number;
    totalAmount: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface RefundStatsResponse {
  success: boolean;
  data: {
    total: number;
    totalAmount: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    dailyTrend: Array<{ date: string; count: number; amount: number }>;
  };
}

export const refundService = {
  // ─── Get all refunds with pagination and filters ──────────
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
    const url = `/api/sales/refunds${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get(url);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch refunds');
    }
    return response.data;
  },

  // ─── Get refund by ID ──────────────────────────────────────
  getRefundById: async (id: string): Promise<Refund> => {
    const response = await apiClient.get(`/api/sales/refunds/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch refund');
    }
    return response.data.data;
  },

  // ─── Get refund by refund number ──────────────────────────
  getRefundByNumber: async (refundNumber: string): Promise<Refund> => {
    const response = await apiClient.get(`/api/sales/refunds/number/${refundNumber}`);
    if (!response.success) {
      throw new Error(response.message || 'Refund not found');
    }
    return response.data.data;
  },

  // ─── Get refunds by order ID ──────────────────────────────
  getRefundsByOrder: async (orderId: string): Promise<Refund[]> => {
    const response = await apiClient.get(`/api/sales/refunds/order/${orderId}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch order refunds');
    }
    return response.data.data || [];
  },

  // ─── Create refund ─────────────────────────────────────────
  createRefund: async (data: Partial<Refund>): Promise<Refund> => {
    const response = await apiClient.post('/api/sales/refunds', data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to create refund');
    }
    return response.data.data;
  },

  // ─── Update refund ─────────────────────────────────────────
  updateRefund: async (id: string, data: Partial<Refund>): Promise<Refund> => {
    const response = await apiClient.put(`/api/sales/refunds/${id}`, data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to update refund');
    }
    return response.data.data;
  },

  // ─── Process refund (change status to Processing) ─────────
  processRefund: async (id: string): Promise<Refund> => {
    const response = await apiClient.patch(`/api/sales/refunds/${id}/process`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to process refund');
    }
    return response.data.data;
  },

  // ─── Complete refund (change status to Completed) ─────────
  completeRefund: async (id: string): Promise<Refund> => {
    const response = await apiClient.patch(`/api/sales/refunds/${id}/complete`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to complete refund');
    }
    return response.data.data;
  },

  // ─── Cancel refund ─────────────────────────────────────────
  cancelRefund: async (id: string, reason?: string): Promise<Refund> => {
    const response = await apiClient.patch(`/api/sales/refunds/${id}/cancel`, { reason });
    if (!response.success) {
      throw new Error(response.message || 'Failed to cancel refund');
    }
    return response.data.data;
  },

  // ─── Delete refund ─────────────────────────────────────────
  deleteRefund: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/api/sales/refunds/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete refund');
    }
  },

  // ─── Get refund stats ──────────────────────────────────────
  getRefundStats: async (period?: string): Promise<RefundStatsResponse> => {
    const url = period ? `/api/sales/refunds/stats?period=${period}` : '/api/sales/refunds/stats';
    const response = await apiClient.get(url);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch refund stats');
    }
    return response.data;
  },

  // ─── Search refunds ────────────────────────────────────────
  searchRefunds: async (query: string, limit: number = 10): Promise<Refund[]> => {
    const response = await apiClient.get(`/api/sales/refunds/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to search refunds');
    }
    return response.data.data || [];
  }
};