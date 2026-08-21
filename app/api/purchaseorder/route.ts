import { apiClient } from '@/lib/api-client';

export interface PurchaseOrderModel {
  id: string;
  orderNumber: string;
  orderDate: string;
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  status: 'Draft' | 'Sent' | 'Approved' | 'Cancelled';
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  totalItems: number;
  notes?: string;
  termsConditions?: string;
  expectedDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
  items: PurchaseOrderItem[];
  canSend?: boolean;
  canApprove?: boolean;
  canCancel?: boolean;
  canDelete?: boolean;
}

export interface PurchaseOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  lineTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  taxId?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  costPrice?: number;
  sellingPrice?: number;
  taxRate?: number;
  category?: string;
  isActive: boolean;
}

export interface PurchaseOrderStats {
  todayCount: number;
  todayAmount: number;
  monthCount: number;
  monthAmount: number;
}

export interface PurchaseOrderStatusCounts {
  draft: number;
  sent: number;
  approved: number;
  cancelled: number;
  total: number;
}

export interface PurchaseOrderListResponse {
  success: boolean;
  data: PurchaseOrderModel[];
  stats: PurchaseOrderStats;
  statusCounts: PurchaseOrderStatusCounts;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreatePurchaseOrderRequest {
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
  }>;
  notes?: string;
  termsConditions?: string;
  status: string;
  locationId?: string;
}

// ─── SERVICE ──────────────────────────────────────────────────

export const purchaseOrderService = {
  // ─── Get orders with pagination and filters ──────────────
  getOrders: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    locationId?: string;
  } = {}): Promise<PurchaseOrderListResponse> => {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/purchase/orders${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch purchase orders');
      }
      
      const data = response.data || {};
      
      return {
        success: response.success,
        data: data.data || [],
        stats: data.stats || {
          todayCount: 0,
          todayAmount: 0,
          monthCount: 0,
          monthAmount: 0
        },
        statusCounts: data.statusCounts || {
          draft: 0,
          sent: 0,
          approved: 0,
          cancelled: 0,
          total: 0
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
      console.error('Get orders error:', error);
      throw new Error(error.message || 'Failed to fetch purchase orders');
    }
  },

  // ─── Search suppliers ──────────────────────────────────────
  searchSuppliers: async (query: string, limit: number = 10): Promise<Supplier[]> => {
    try {
      const response = await apiClient.get(
        `/api/warehouse/supplier?search=${encodeURIComponent(query)}&limit=${limit}&status=active`
      );
      if (!response.success) {
        throw new Error(response.message || 'Failed to search suppliers');
      }
      const rows = response.data?.data || [];
      return rows.map((s: any) => ({
        ...s,
        id: String(s.id || s._id || ''),
        isActive: String(s.status || '').toLowerCase() === 'active',
      })).filter((s: Supplier) => !!s.id);
    } catch (error: any) {
      console.error('Search suppliers error:', error);
      return [];
    }
  },

  // ─── Search products ──────────────────────────────────────
  searchProducts: async (
    query: string,
    limit: number = 10,
    locationId?: string
  ): Promise<Product[]> => {
    try {
      const params = new URLSearchParams({
        search: query,
        limit: String(limit),
      });
      // PO can add any company product to a warehouse (scope=company)
      if (locationId) {
        params.set('locationId', locationId);
        params.set('scope', 'company');
      }
      const response = await apiClient.get(
        `/api/warehouse/products?${params.toString()}`
      );
      if (!response.success) {
        throw new Error(response.message || 'Failed to search products');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Search products error:', error);
      return [];
    }
  },

  // ─── Create purchase order ──────────────────────────────
  createOrder: async (data: CreatePurchaseOrderRequest): Promise<PurchaseOrderModel> => {
    try {
      const response = await apiClient.post('/api/purchase/orders', data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create purchase order');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Create order error:', error);
      throw new Error(error.message || 'Failed to create purchase order');
    }
  },

  // ─── Get order by ID ──────────────────────────────────────
  getOrderById: async (id: string): Promise<PurchaseOrderModel> => {
    try {
      const response = await apiClient.get(`/api/purchase/orders/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch purchase order');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Get order error:', error);
      throw new Error(error.message || 'Failed to fetch purchase order');
    }
  },

  // ─── Update order status ──────────────────────────────────
  updateOrderStatus: async (id: string, status: string, notes?: string): Promise<PurchaseOrderModel> => {
    try {
      const response = await apiClient.patch(`/api/purchase/orders/${id}/status`, { status, notes });
      if (!response.success) {
        throw new Error(response.message || 'Failed to update order status');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Update order status error:', error);
      throw new Error(error.message || 'Failed to update order status');
    }
  },

  // ─── Send order ────────────────────────────────────────────
  sendOrder: async (id: string): Promise<PurchaseOrderModel> => {
    try {
      const response = await apiClient.post(`/api/purchase/orders/${id}/send`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to send purchase order');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Send order error:', error);
      throw new Error(error.message || 'Failed to send purchase order');
    }
  },

  // ─── Send order with invoice (email with PDF) ─────────────
  sendOrderWithInvoice: async (id: string): Promise<PurchaseOrderModel> => {
    try {
      const response = await apiClient.post(`/api/purchase/orders/${id}/send-with-invoice`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to send purchase order with invoice');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Send order with invoice error:', error);
      throw new Error(error.message || 'Failed to send purchase order with invoice');
    }
  },

  // ─── Cancel order ──────────────────────────────────────────
  cancelOrder: async (id: string, reason: string): Promise<PurchaseOrderModel> => {
    try {
      const response = await apiClient.post(`/api/purchase/orders/${id}/cancel`, { reason });
      if (!response.success) {
        throw new Error(response.message || 'Failed to cancel purchase order');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Cancel order error:', error);
      throw new Error(error.message || 'Failed to cancel purchase order');
    }
  },

  // ─── Delete order ──────────────────────────────────────────
  deleteOrder: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.delete(`/api/purchase/orders/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete purchase order');
      }
    } catch (error: any) {
      console.error('Delete order error:', error);
      throw new Error(error.message || 'Failed to delete purchase order');
    }
  },

  // ─── Update order ──────────────────────────────────────────
  updateOrder: async (id: string, data: Partial<CreatePurchaseOrderRequest>): Promise<PurchaseOrderModel> => {
    try {
      const response = await apiClient.put(`/api/purchase/orders/${id}`, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update purchase order');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Update order error:', error);
      throw new Error(error.message || 'Failed to update purchase order');
    }
  },

  // ─── Get order stats ──────────────────────────────────────
  getOrderStats: async (params?: { startDate?: string; endDate?: string }): Promise<{ stats: PurchaseOrderStats; statusCounts: PurchaseOrderStatusCounts }> => {
    try {
      const query = new URLSearchParams();
      if (params?.startDate) query.append('startDate', params.startDate);
      if (params?.endDate) query.append('endDate', params.endDate);
      
      const url = `/api/purchase/orders/stats${query.toString() ? `?${query.toString()}` : ''}`;
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch order stats');
      }
      
      return response.data?.data || {
        stats: {
          todayCount: 0,
          todayAmount: 0,
          monthCount: 0,
          monthAmount: 0
        },
        statusCounts: {
          draft: 0,
          sent: 0,
          approved: 0,
          cancelled: 0,
          total: 0
        }
      };
    } catch (error: any) {
      console.error('Get order stats error:', error);
      throw new Error(error.message || 'Failed to fetch order stats');
    }
  },

  // ─── Get orders by supplier ──────────────────────────────
  getOrdersBySupplier: async (supplierId: string): Promise<PurchaseOrderModel[]> => {
    try {
      const response = await apiClient.get(`/api/purchase/orders/supplier/${supplierId}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch orders');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Get orders by supplier error:', error);
      throw new Error(error.message || 'Failed to fetch orders');
    }
  },

  // ─── Export orders ─────────────────────────────────────────
  exportOrders: async (params?: {
    format?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<string> => {
    try {
      const query = new URLSearchParams();
      if (params?.format) query.append('format', params.format);
      if (params?.startDate) query.append('startDate', params.startDate);
      if (params?.endDate) query.append('endDate', params.endDate);
      
      const url = `/api/purchase/orders/export${query.toString() ? `?${query.toString()}` : ''}`;
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to export orders');
      }
      
      return response.data?.data || response.data?.url || '';
    } catch (error: any) {
      console.error('Export orders error:', error);
      throw new Error(error.message || 'Failed to export orders');
    }
  }
};