// lib/api/supplier.ts
import { apiClient } from '../../lib/api-client';

export interface Supplier {
  id?: string;
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

function normalizeSupplier(s: any): Supplier {
  if (!s) return s;
  const id = String(s.id || s._id || '');
  return { ...s, id, _id: id };
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
    const payload = response.data || {};
    return {
      ...payload,
      data: (payload.data || []).map(normalizeSupplier),
    };
  },

  getSupplierById: async (id: string): Promise<Supplier> => {
    const response = await apiClient.get(`/api/warehouse/supplier/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch supplier');
    }
    return normalizeSupplier(response.data?.data || response.data);
  },

  createSupplier: async (data: Partial<Supplier>): Promise<Supplier> => {
    const response = await apiClient.post('/api/warehouse/supplier', data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to create supplier');
    }
    return normalizeSupplier(response.data?.data || response.data);
  },

  updateSupplier: async (id: string, data: Partial<Supplier>): Promise<Supplier> => {
    const response = await apiClient.put(`/api/warehouse/supplier/${id}`, data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to update supplier');
    }
    return normalizeSupplier(response.data?.data || response.data);
  },

  deleteSupplier: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!id) throw new Error('Supplier id is required');
    const response = await apiClient.delete(`/api/warehouse/supplier/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete supplier');
    }
    const body = response.data || {};
    return {
      success: true,
      message: body.message || response.message || 'Supplier deleted successfully',
    };
  },
};
