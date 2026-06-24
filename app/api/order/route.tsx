import { apiClient } from '../../lib/api-client';

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
  orderNumber: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerType?: string;
  customerCompany?: string;
  customerTaxId?: string;
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
  items: OrderItem[];
  subtotal: number;
  taxTotal: number;
  shippingCost: number;
  discountTotal: number;
  grandTotal: number;
  totalWeight?: number;
  totalItems?: number;
  paymentStatus: 'Pending' | 'Paid' | 'Partial' | 'Refunded' | 'Cancelled';
  paymentMethod: string;
  paymentDate?: string;
  paymentReference?: string;
  orderStatus: 'Draft' | 'Pending' | 'Processing' | 'Packed' | 'Shipped' | 'In Transit' | 'Delivered' | 'Cancelled' | 'Returned' | 'On Hold';
  orderType: string;
  priority: string;
  source: string;
  salesPerson?: string;
  salesPersonId?: string;
  tags?: string[];
  shippingMethod: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingDate?: string;
  deliveryDate?: string;
  fulfillmentStatus?: 'Not Started' | 'Partial' | 'Complete' | 'Overdue';
  pickedBy?: string;
  packedBy?: string;
  shippedBy?: string;
  pickListGenerated?: boolean;
  packingSlipGenerated?: boolean;
  couponCode?: string;
  couponDiscount?: number;
  customerNotes?: string;
  internalNotes?: string;
  orderNotes?: Array<{
    text: string;
    createdBy: string;
    createdAt: string;
  }> | string;
  orderApproval?: {
    required: boolean;
    approvedBy?: string;
    approvedAt?: string;
    status?: 'Pending' | 'Approved' | 'Rejected';
  };
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  isActive?: boolean;
  isDeleted?: boolean;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  } | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderListResponse {
  success: boolean;
  count: number;
  data: Order[];
  kpi: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    revenue: number;
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

export interface OrderStats {
  today: {
    orders: number;
    revenue: number;
  };
  week: {
    orders: number;
  };
  month: {
    orders: number;
    revenue: number;
  };
}

export const orderService = {
  // ─── Get all orders with pagination & filters ────────────
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    paymentStatus?: string;
    orderType?: string;
    priority?: string;
    customerId?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<OrderListResponse> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.paymentStatus && params.paymentStatus !== 'all') query.append('paymentStatus', params.paymentStatus);
    if (params?.orderType && params.orderType !== 'all') query.append('orderType', params.orderType);
    if (params?.priority && params.priority !== 'all') query.append('priority', params.priority);
    if (params?.customerId) query.append('customerId', params.customerId);
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (params?.toDate) query.append('toDate', params.toDate);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    const url = `/api/warehouse/order${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get(url);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch orders');
    }
    return response.data;
  },

  // ─── Get single order by ID ──────────────────────────────
  getOrderById: async (id: string): Promise<Order> => {
    const response = await apiClient.get(`/api/warehouse/order/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch order');
    }
    return response.data.data;
  },

  // ─── Get order statistics ────────────────────────────────
  getOrderStats: async (): Promise<OrderStats> => {
    const response = await apiClient.get('/api/warehouse/order/stats');
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch order stats');
    }
    return response.data.data;
  },

  // ─── Create order ─────────────────────────────────────────
  createOrder: async (data: Partial<Order>): Promise<Order> => {
    const response = await apiClient.post('/api/warehouse/order', data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to create order');
    }
    return response.data.data;
  },

  // ─── Update order ─────────────────────────────────────────
  updateOrder: async (id: string, data: Partial<Order>): Promise<Order> => {
    const response = await apiClient.put(`/api/warehouse/order/${id}`, data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to update order');
    }
    return response.data.data;
  },

  // ─── Update order status ──────────────────────────────────
  updateOrderStatus: async (id: string, status: string, notes?: string): Promise<Order> => {
    const response = await apiClient.patch(`/api/warehouse/order/${id}/status`, { status, notes });
    if (!response.success) {
      throw new Error(response.message || 'Failed to update order status');
    }
    return response.data.data;
  },

  // ─── Update payment status ────────────────────────────────
  updatePaymentStatus: async (id: string, paymentStatus: string, paymentReference?: string): Promise<Order> => {
    const response = await apiClient.patch(`/api/warehouse/order/${id}/payment`, { 
      paymentStatus, 
      paymentReference,
      paymentDate: paymentStatus === 'Paid' ? new Date().toISOString() : undefined
    });
    if (!response.success) {
      throw new Error(response.message || 'Failed to update payment status');
    }
    return response.data.data;
  },

  // ─── Cancel order ──────────────────────────────────────────
  cancelOrder: async (id: string, reason?: string): Promise<Order> => {
    const response = await apiClient.post(`/api/warehouse/order/${id}/cancel`, { reason });
    if (!response.success) {
      throw new Error(response.message || 'Failed to cancel order');
    }
    return response.data.data;
  },

  // ─── Delete order (soft delete) ──────────────────────────
  deleteOrder: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/api/warehouse/order/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete order');
    }
  },
};