 import { apiClient } from '@/lib/api-client';

export interface Customer {
  id?: string;
  _id?: string;
  customerNumber: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  customerType: 'Individual' | 'Business' | 'Wholesale' | 'Distributor' | 'Retailer' | 'Manufacturer';
  taxId?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
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
  status: 'Active' | 'Inactive' | 'Blocked' | 'Pending';
  loyaltyPoints: number;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: string;
  outstandingBalance?: number;
  creditLimit?: number;
  creditTerms?: string;
  notes?: string;
  tags: string[];
  preferences?: {
    language?: string;
    currency?: string;
    marketingEmails?: boolean;
    smsNotifications?: boolean;
  };
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  recentOrders?: any[];
}

export interface CustomerListResponse {
  success: boolean;
  data: Customer[];
  stats: {
    total: number;
    totalSpent: number;
    totalOrders: number;
    active: number;
    inactive: number;
    blocked: number;
    pending: number;
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

export interface CustomerStatsResponse {
  success: boolean;
  data: {
    total: number;
    active: number;
    inactive: number;
    blocked: number;
    pending: number;
    totalSpent: number;
    totalOrders: number;
    avgOrderValue: number;
    typeDistribution: Array<{ type: string; count: number }>;
    topCustomers: Array<{
      id: string;
      name: string;
      customerNumber: string;
      totalSpent: number;
      totalOrders: number;
      email?: string;
      phone?: string;
    }>;
  };
}

export const customerService = {
  // ─── Get all customers with pagination and filters ──────────
  getCustomers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<CustomerListResponse> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });
    const url = `/api/warehouse/customers${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get(url);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch customers');
    }
    return response.data;
  },

  // ─── Get customer by ID ─────────────────────────────────────
  getCustomerById: async (id: string): Promise<Customer> => {
    const response = await apiClient.get(`/api/warehouse/customers/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch customer');
    }
    return response.data.data;
  },

  // ─── Get customer by customer number ──────────────────────
  getCustomerByNumber: async (customerNumber: string): Promise<Customer> => {
    const response = await apiClient.get(`/api/warehouse/customers/number/${customerNumber}`);
    if (!response.success) {
      throw new Error(response.message || 'Customer not found');
    }
    return response.data.data;
  },

  // ─── Search customers ──────────────────────────────────────
  searchCustomers: async (query: string, limit: number = 10): Promise<Customer[]> => {
    const response = await apiClient.get(`/api/warehouse/customers/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to search customers');
    }
    return response.data.data || [];
  },

  // ─── Create customer ──────────────────────────────────────
  createCustomer: async (data: Partial<Customer>): Promise<Customer> => {
    const response = await apiClient.post('/api/warehouse/customers', data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to create customer');
    }
    return response.data.data;
  },

  // ─── Update customer ──────────────────────────────────────
  updateCustomer: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    const response = await apiClient.put(`/api/warehouse/customers/${id}`, data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to update customer');
    }
    return response.data.data;
  },

  // ─── Delete customer ──────────────────────────────────────
  deleteCustomer: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/api/warehouse/customers/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete customer');
    }
  },

  // ─── Update customer status ──────────────────────────────
  updateCustomerStatus: async (id: string, status: string, reason?: string): Promise<Customer> => {
    const response = await apiClient.patch(`/api/warehouse/customers/${id}/status`, { status, reason });
    if (!response.success) {
      throw new Error(response.message || 'Failed to update customer status');
    }
    return response.data.data;
  },

  // ─── Get customer stats ──────────────────────────────────
  getCustomerStats: async (period?: string): Promise<CustomerStatsResponse> => {
    const url = period ? `/api/warehouse/customers/stats?period=${period}` : '/api/warehouse/customers/stats';
    const response = await apiClient.get(url);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch customer stats');
    }
    return response.data;
  },

  // ─── Get customer orders ──────────────────────────────────
  getCustomerOrders: async (id: string, params: { page?: number; limit?: number } = {}): Promise<any> => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    const url = `/api/warehouse/customers/${id}/orders${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get(url);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch customer orders');
    }
    return response.data;
  }
};