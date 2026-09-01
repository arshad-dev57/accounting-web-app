import { apiClient } from '@/lib/api-client';

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  weight?: number;
  weightUnit?: string;
  dimensions?: string;
  batchNumber?: string;
  serialNumber?: string;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  notes?: string;
}

export interface Order {
  _id?: string;
  id?: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerType?: string;
  customerCompany?: string;
  customerTaxId?: string;
  orderType: string;
  orderStatus: 'Draft' | 'Pending' | 'Processing' | 'Packed' | 'Shipped' | 'In Transit' | 'Delivered' | 'Cancelled' | 'Returned' | 'On Hold';
  paymentStatus: 'Pending' | 'Paid' | 'Partial' | 'Refunded' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  source?: string;
  salesPerson?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  shippingMethod?: string;
  shippingCarrier?: string;
  shippingCost?: number;
  trackingNumber?: string;
  paymentMethod?: string;
  couponCode?: string;
  discountType?: string;
  discountPercentage?: number;
  discountAmount?: number;
  discountTotal?: number;
  subtotal: number;
  taxTotal?: number;
  shippingTotal?: number;
  grandTotal: number;
  totalWeight?: number;
  totalItems?: number;
  locationId?: string;
  items: OrderItem[];
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  customerNotes?: string;
  internalNotes?: string;
  orderNotes?: string;
  tags?: string[];
  createdBy?: string;
  createdByEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderListResponse {
  success: boolean;
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const salesOrderService = {
  getOrders: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    paymentStatus?: string;
    orderType?: string;
    priority?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    locationId?: string;
  } = {}): Promise<OrderListResponse> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    if (!params.orderType) {
      query.append('orderType', 'Sales Order');
    }

    const url = `/api/orders/sales${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get(url);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch sales orders');
    }
    return response.data;
  },

  getOrderById: async (id: string): Promise<Order> => {
    const response = await apiClient.get(`/api/orders/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch sales order');
    }
    return response.data.data;
  },

  createOrder: async (data: Partial<Order>): Promise<Order> => {
    const response = await apiClient.post('/api/orders/sales', data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to create sales order');
    }
    return response.data.data;
  },

  updateOrder: async (id: string, data: Partial<Order>): Promise<Order> => {
    const response = await apiClient.put(`/api/orders/${id}`, data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to update sales order');
    }
    return response.data.data;
  },

  deleteOrder: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/api/orders/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete sales order');
    }
  },

  updateOrderStatus: async (id: string, status: string, reason?: string): Promise<Order> => {
    const response = await apiClient.patch(`/api/orders/${id}/status`, { status, reason });
    if (!response.success) {
      throw new Error(response.message || 'Failed to update sales order status');
    }
    return response.data.data;
  },

  updatePaymentStatus: async (id: string, paymentStatus: string, paymentReference?: string): Promise<Order> => {
    const response = await apiClient.patch(`/api/orders/${id}/payment`, { paymentStatus, paymentReference });
    if (!response.success) {
      throw new Error(response.message || 'Failed to update payment status');
    }
    return response.data.data;
  },

  cancelOrder: async (id: string, reason?: string): Promise<Order> => {
    const response = await apiClient.post(`/api/orders/${id}/cancel`, { reason });
    if (!response.success) {
      throw new Error(response.message || 'Failed to cancel sales order');
    }
    return response.data.data;
  },

  getStats: async (type?: 'sales' | 'purchase'): Promise<any> => {
    const query = type ? `?type=${type}` : '';
    const response = await apiClient.get(`/api/orders/stats${query}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch sales order stats');
    }
    return response.data.data;
  },

  getKPI: async (type?: 'sales' | 'purchase'): Promise<any> => {
    const query = type ? `?type=${type}` : '';
    const response = await apiClient.get(`/api/orders/kpi${query}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch sales order KPI');
    }
    return response.data.data;
  },

  searchOrders: async (query: string, limit: number = 10): Promise<Order[]> => {
    const encodedQuery = encodeURIComponent(query);
    const response = await apiClient.get(`/api/orders/sales/search?q=${encodedQuery}&limit=${limit}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to search sales orders');
    }
    return response.data.data || [];
  },
};
