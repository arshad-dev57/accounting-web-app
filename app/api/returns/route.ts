// lib/api/return.ts
import { apiClient } from '../../lib/api-client';

export interface ReturnItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  returnQuantity: number;
  reason: string;
  condition: 'New' | 'Used' | 'Damaged' | 'Open Box';
  refundAmount: number;
  batchNumber?: string;
  serialNumber?: string;
  notes?: string;
}

export interface Return {
  _id?: string;
  returnNumber: string;
  returnDate: string;
  orderId: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: ReturnItem[];
  subtotal: number;
  refundAmount: number;
  restockingFee: number;
  shippingCost: number;
  totalRefund: number;
  returnStatus: 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled';
  returnType: 'Return' | 'Exchange' | 'Warranty';
  reason: string;
  notes?: string;
  returnMethod: 'Store Credit' | 'Original Payment' | 'Bank Transfer' | 'Cash';
  trackingNumber?: string;
  shippingCarrier?: string;
  returnLabel?: string;
  receivedDate?: string;
  approvedBy?: string | { _id: string; name: string };
  approvedAt?: string;
  rejectionReason?: string;
  images?: string[];
  attachments?: { name: string; url: string; type: string }[];
  createdBy?: { _id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface ReturnListResponse {
  success: boolean;
  data: Return[];
  stats: {
    total: number;
    totalRefund: number;
    pending: number;
    approved: number;
    rejected: number;
    completed: number;
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

export interface ReturnStatsResponse {
  success: boolean;
  data: {
    totalReturns: number;
    totalRefund: number;
    pending: number;
    approved: number;
    rejected: number;
    completed: number;
    avgRefund: number;
    dailyTrend: Array<{
      _id: string;
      count: number;
      refund: number;
    }>;
  };
}

export const returnService = {
  // ─── Get all returns with pagination & filters ──────────
  getReturns: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
    customerId?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ReturnListResponse> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.type && params.type !== 'all') query.append('type', params.type);
    if (params?.customerId) query.append('customerId', params.customerId);
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (params?.toDate) query.append('toDate', params.toDate);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    const url = `/api/warehouse/returns${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get(url);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch returns');
    }
    return response.data;
  },

  // ─── Get return by ID ─────────────────────────────────────
  getReturnById: async (id: string): Promise<Return> => {
    const response = await apiClient.get(`/api/warehouse/returns/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch return');
    }
    return response.data.data;
  },

  // ─── Get return stats ────────────────────────────────────
  getReturnStats: async (period?: 'today' | 'week' | 'month'): Promise<ReturnStatsResponse> => {
    const url = period ? `/api/warehouse/returns/stats?period=${period}` : '/api/warehouse/returns/stats';
    const response = await apiClient.get(url);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch return stats');
    }
    return response.data;
  },

  // ─── Create return ────────────────────────────────────────
  createReturn: async (data: Partial<Return>): Promise<Return> => {
    const response = await apiClient.post('/api/warehouse/returns', data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to create return');
    }
    return response.data.data;
  },

  // ─── Update return ────────────────────────────────────────
  updateReturn: async (id: string, data: Partial<Return>): Promise<Return> => {
    const response = await apiClient.put(`/api/warehouse/returns/${id}`, data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to update return');
    }
    return response.data.data;
  },

  // ─── Approve return ──────────────────────────────────────
  approveReturn: async (id: string, notes?: string): Promise<Return> => {
    const response = await apiClient.patch(`/api/warehouse/returns/${id}/approve`, { notes });
    if (!response.success) {
      throw new Error(response.message || 'Failed to approve return');
    }
    return response.data.data;
  },

  // ─── Reject return ────────────────────────────────────────
  rejectReturn: async (id: string, rejectionReason: string): Promise<Return> => {
    const response = await apiClient.patch(`/api/warehouse/returns/${id}/reject`, { rejectionReason });
    if (!response.success) {
      throw new Error(response.message || 'Failed to reject return');
    }
    return response.data.data;
  },

  // ─── Complete return ──────────────────────────────────────
  completeReturn: async (id: string, receivedDate?: string): Promise<Return> => {
    const response = await apiClient.patch(`/api/warehouse/returns/${id}/complete`, { receivedDate });
    if (!response.success) {
      throw new Error(response.message || 'Failed to complete return');
    }
    return response.data.data;
  },

  // ─── Cancel return ────────────────────────────────────────
  cancelReturn: async (id: string, reason?: string): Promise<Return> => {
    const response = await apiClient.patch(`/api/warehouse/returns/${id}/cancel`, { reason });
    if (!response.success) {
      throw new Error(response.message || 'Failed to cancel return');
    }
    return response.data.data;
  },

  // ─── Delete return (soft delete) ──────────────────────────
  deleteReturn: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/api/warehouse/returns/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete return');
    }
  },
};