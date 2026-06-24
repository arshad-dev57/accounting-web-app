// lib/api/supplier.ts
import { apiClient } from '../../lib/api-client';

export interface Supplier {
  _id?: string;
  name: string;
  companyName?: string;
  code?: string;
  contactPerson?: string;
  department?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  industry?: string;
  businessType?: string;
  paymentTerms?: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplierListResponse {
  success: boolean;
  data: Supplier[];
  kpi: {
    total: number;
    active: number;
    inactive: number;
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

export const supplierService = {
  // Get suppliers with pagination, search, status filter
  getSuppliers: async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
    } = {}
  ): Promise<SupplierListResponse> => {
    const { page = 1, limit = 20, search = '', status = 'all' } = params;
    const response = await apiClient.get(
      `/api/warehouse/supplier?page=${page}&limit=${limit}&search=${search}&status=${status}`
    );
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch suppliers');
    }
    return response.data;
  },

  // Get single supplier by ID
  getSupplierById: async (id: string): Promise<Supplier> => {
    const response = await apiClient.get(`/api/warehouse/supplier/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch supplier');
    }
    return response.data;
  },

  // Create new supplier
  createSupplier: async (data: Partial<Supplier>): Promise<Supplier> => {
    const response = await apiClient.post('/api/warehouse/supplier', data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to create supplier');
    }
    return response.data;
  },

  // Update supplier
  updateSupplier: async (id: string, data: Partial<Supplier>): Promise<Supplier> => {
    const response = await apiClient.put(`/api/warehouse/supplier/${id}`, data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to update supplier');
    }
    return response.data;
  },

  // Delete supplier
  deleteSupplier: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/api/warehouse/supplier/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete supplier');
    }
  },
};