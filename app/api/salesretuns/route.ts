import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface ReturnModel {
  id: string;
  returnNumber: string;
  returnDate: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnType: string;
  returnMethod: string;
  returnStatus: string;
  totalRefund: number;
  reason: string;
  notes: string;
  rejectionReason?: string;
  restockingFee: number;
  shippingCost: number;
  totalReturnQty: number;
  items: ReturnItemModel[];
  createdAt: string;
  updatedAt: string;
}

export interface ReturnItemModel {
  id: string;
  returnId: string;
  productId: string;
  productName: string;
  sku: string;
  orderQuantity: number;
  returnQuantity: number;
  unitPrice: number;
  refundAmount: number;
  condition: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderModel {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
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

export interface ReturnLineDraft {
  productId: string;
  productName: string;
  sku: string;
  orderQuantity: number;
  unitPrice: number;
  selected: boolean;
  returnQuantity: number;
  condition: string;
  refundAmount: number;
}

export interface ReturnStats {
  total: number;
  totalRefund: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
}

export interface ReturnListResponse {
  success: boolean;
  data: ReturnModel[];
  stats: ReturnStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateReturnRequest {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    orderQuantity: number;
    returnQuantity: number;
    unitPrice: number;
    refundAmount: number;
    condition: string;
  }>;
  returnType: string;
  returnMethod: string;
  reason: string;
  notes?: string;
  restockingFee: number;
  shippingCost: number;
}

// ─── SERVICE ──────────────────────────────────────────────────

export const salesReturnService = {
  // ─── Get returns with pagination and filters ──────────────
  getReturns: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ReturnListResponse> => {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/warehouse/returns${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch returns');
      }
      
      const data = response.data || {};
      
      return {
        success: response.success,
        data: data.data || [],
        stats: data.stats || {
          total: 0,
          totalRefund: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          completed: 0
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
      console.error('Get returns error:', error);
      throw new Error(error.message || 'Failed to fetch returns');
    }
  },

  // ─── Search orders for return ──────────────────────────────
  searchOrders: async (query: string, limit: number = 10): Promise<OrderModel[]> => {
    try {
      const response = await apiClient.get(
        `/api/warehouse/order?search=${encodeURIComponent(query)}&limit=${limit}`
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

  // ─── Get order details for return ──────────────────────────
  getOrderById: async (orderId: string): Promise<OrderModel> => {
    try {
      const response = await apiClient.get(`/api/warehouse/order/${orderId}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch order');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Get order error:', error);
      throw new Error(error.message || 'Failed to fetch order');
    }
  },

  // ─── Create return ──────────────────────────────────────────
  createReturn: async (data: CreateReturnRequest): Promise<ReturnModel> => {
    try {
      const response = await apiClient.post('/api/warehouse/returns', data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create return');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Create return error:', error);
      throw new Error(error.message || 'Failed to create return');
    }
  },

  // ─── Get return by ID ──────────────────────────────────────
  getReturnById: async (id: string): Promise<ReturnModel> => {
    try {
      const response = await apiClient.get(`/api/warehouse/returns/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch return');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Get return error:', error);
      throw new Error(error.message || 'Failed to fetch return');
    }
  },

  // ─── Approve return ─────────────────────────────────────────
  approveReturn: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.patch(`/api/warehouse/returns/${id}/approve`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to approve return');
      }
    } catch (error: any) {
      console.error('Approve return error:', error);
      throw new Error(error.message || 'Failed to approve return');
    }
  },

  // ─── Reject return ──────────────────────────────────────────
  rejectReturn: async (id: string, reason: string): Promise<void> => {
    try {
      const response = await apiClient.patch(`/api/warehouse/returns/${id}/reject`, { rejectionReason: reason });
      if (!response.success) {
        throw new Error(response.message || 'Failed to reject return');
      }
    } catch (error: any) {
      console.error('Reject return error:', error);
      throw new Error(error.message || 'Failed to reject return');
    }
  },

  // ─── Complete return ────────────────────────────────────────
  completeReturn: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.patch(`/api/warehouse/returns/${id}/complete`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to complete return');
      }
    } catch (error: any) {
      console.error('Complete return error:', error);
      throw new Error(error.message || 'Failed to complete return');
    }
  },

  // ─── Cancel return ──────────────────────────────────────────
  cancelReturn: async (id: string, reason: string): Promise<void> => {
    try {
      const response = await apiClient.patch(`/api/warehouse/returns/${id}/cancel`, { reason });
      if (!response.success) {
        throw new Error(response.message || 'Failed to cancel return');
      }
    } catch (error: any) {
      console.error('Cancel return error:', error);
      throw new Error(error.message || 'Failed to cancel return');
    }
  },

  // ─── Delete return ──────────────────────────────────────────
  deleteReturn: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.delete(`/api/warehouse/returns/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete return');
      }
    } catch (error: any) {
      console.error('Delete return error:', error);
      throw new Error(error.message || 'Failed to delete return');
    }
  },

  // ─── Update return ──────────────────────────────────────────
  updateReturn: async (id: string, data: Partial<CreateReturnRequest>): Promise<ReturnModel> => {
    try {
      const response = await apiClient.put(`/api/warehouse/returns/${id}`, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update return');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Update return error:', error);
      throw new Error(error.message || 'Failed to update return');
    }
  },

  // ─── Get return stats ──────────────────────────────────────
  getReturnStats: async (params?: { startDate?: string; endDate?: string }): Promise<ReturnStats> => {
    try {
      const query = new URLSearchParams();
      if (params?.startDate) query.append('startDate', params.startDate);
      if (params?.endDate) query.append('endDate', params.endDate);
      
      const url = `/api/warehouse/returns/stats${query.toString() ? `?${query.toString()}` : ''}`;
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch return stats');
      }
      
      return response.data?.data || {
        total: 0,
        totalRefund: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        completed: 0
      };
    } catch (error: any) {
      console.error('Get return stats error:', error);
      throw new Error(error.message || 'Failed to fetch return stats');
    }
  },

  // ─── Get returns by order ──────────────────────────────────
  getReturnsByOrder: async (orderId: string): Promise<ReturnModel[]> => {
    try {
      const response = await apiClient.get(`/api/warehouse/returns/order/${orderId}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch returns');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Get returns by order error:', error);
      throw new Error(error.message || 'Failed to fetch returns');
    }
  },

  // ─── Export returns ─────────────────────────────────────────
  exportReturns: async (params?: {
    format?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<string> => {
    try {
      const query = new URLSearchParams();
      if (params?.format) query.append('format', params.format);
      if (params?.startDate) query.append('startDate', params.startDate);
      if (params?.endDate) query.append('endDate', params.endDate);
      
      const url = `/api/warehouse/returns/export${query.toString() ? `?${query.toString()}` : ''}`;
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to export returns');
      }
      
      return response.data?.data || response.data?.url || '';
    } catch (error: any) {
      console.error('Export returns error:', error);
      throw new Error(error.message || 'Failed to export returns');
    }
  }
};