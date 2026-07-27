import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface RefundModel {
  id: string;
  refundNumber: string;
  refundDate: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  amount: number;
  refundMethod: string;
  refundStatus: string;
  reason: string;
  notes?: string;
  referenceNumber?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderModel {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  orderDate: string;
  orderStatus: string;
  grandTotal: number;
  paidAmount: number;
  outstanding: number;
  items: OrderItemModel[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemModel {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

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

export interface CreateRefundRequest {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
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

export const salesRefundService = {
  // ─── Get refunds with pagination and filters ──────────────
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
          failed: 0
        },
        pagination: data.pagination || {
          page: params.page || 1,
          limit: params.limit || 20,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    } catch (error: any) {
      console.error('Get refunds error:', error);
      throw new Error(error.message || 'Failed to fetch refunds');
    }
  },

  // ─── Search orders for refund ──────────────────────────────
  searchOrders: async (query: string, limit: number = 10): Promise<OrderModel[]> => {
    try {
      const response = await apiClient.get(
        `/api/orders/sales?search=${encodeURIComponent(query)}&limit=${limit}`
      );
      if (!response.success) {
        throw new Error(response.message || 'Failed to search orders');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Search orders error:', error);
      throw new Error(error.message || 'Failed to search orders');
    }
  },

  // ─── Get order details ──────────────────────────────────────
  getOrderById: async (orderId: string): Promise<OrderModel> => {
    try {
      const response = await apiClient.get(`/api/orders/sales/${orderId}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch order');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Get order error:', error);
      throw new Error(error.message || 'Failed to fetch order');
    }
  },

  // ─── Create refund ──────────────────────────────────────────
  createRefund: async (data: CreateRefundRequest): Promise<RefundModel> => {
    try {
      const response = await apiClient.post('/api/sales/refunds', data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create refund');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Create refund error:', error);
      throw new Error(error.message || 'Failed to create refund');
    }
  },

  // ─── Get refund by ID ──────────────────────────────────────
  getRefundById: async (id: string): Promise<RefundModel> => {
    try {
      const response = await apiClient.get(`/api/sales/refunds/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch refund');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Get refund error:', error);
      throw new Error(error.message || 'Failed to fetch refund');
    }
  },

  // ─── Process refund ─────────────────────────────────────────
  processRefund: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.patch(`/api/sales/refunds/${id}/process`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to process refund');
      }
    } catch (error: any) {
      console.error('Process refund error:', error);
      throw new Error(error.message || 'Failed to process refund');
    }
  },

  // ─── Complete refund ────────────────────────────────────────
  completeRefund: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.patch(`/api/sales/refunds/${id}/complete`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to complete refund');
      }
    } catch (error: any) {
      console.error('Complete refund error:', error);
      throw new Error(error.message || 'Failed to complete refund');
    }
  },

  // ─── Cancel refund ──────────────────────────────────────────
  cancelRefund: async (id: string, reason: string): Promise<void> => {
    try {
      const response = await apiClient.patch(`/api/sales/refunds/${id}/cancel`, { reason });
      if (!response.success) {
        throw new Error(response.message || 'Failed to cancel refund');
      }
    } catch (error: any) {
      console.error('Cancel refund error:', error);
      throw new Error(error.message || 'Failed to cancel refund');
    }
  },

  // ─── Delete refund ──────────────────────────────────────────
  deleteRefund: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.delete(`/api/sales/refunds/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete refund');
      }
    } catch (error: any) {
      console.error('Delete refund error:', error);
      throw new Error(error.message || 'Failed to delete refund');
    }
  },

  // ─── Update refund ──────────────────────────────────────────
  updateRefund: async (id: string, data: Partial<CreateRefundRequest>): Promise<RefundModel> => {
    try {
      const response = await apiClient.put(`/api/sales/refunds/${id}`, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update refund');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Update refund error:', error);
      throw new Error(error.message || 'Failed to update refund');
    }
  },

  // ─── Get refund stats ──────────────────────────────────────
  getRefundStats: async (params?: { startDate?: string; endDate?: string }): Promise<RefundStats> => {
    try {
      const query = new URLSearchParams();
      if (params?.startDate) query.append('startDate', params.startDate);
      if (params?.endDate) query.append('endDate', params.endDate);
      
      const url = `/api/sales/refunds/stats${query.toString() ? `?${query.toString()}` : ''}`;
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
        failed: 0
      };
    } catch (error: any) {
      console.error('Get refund stats error:', error);
      throw new Error(error.message || 'Failed to fetch refund stats');
    }
  },

  // ─── Get refunds by order ──────────────────────────────────
  getRefundsByOrder: async (orderId: string): Promise<RefundModel[]> => {
    try {
      const response = await apiClient.get(`/api/sales/refunds/order/${orderId}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch refunds');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Get refunds by order error:', error);
      throw new Error(error.message || 'Failed to fetch refunds');
    }
  },

  // ─── Export refunds ─────────────────────────────────────────
  exportRefunds: async (params?: {
    format?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<string> => {
    try {
      const query = new URLSearchParams();
      if (params?.format) query.append('format', params.format);
      if (params?.startDate) query.append('startDate', params.startDate);
      if (params?.endDate) query.append('endDate', params.endDate);
      
      const url = `/api/sales/refunds/export${query.toString() ? `?${query.toString()}` : ''}`;
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to export refunds');
      }
      
      return response.data?.data || response.data?.url || '';
    } catch (error: any) {
      console.error('Export refunds error:', error);
      throw new Error(error.message || 'Failed to export refunds');
    }
  }
};