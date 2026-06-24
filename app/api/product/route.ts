// lib/api/product.ts
import { apiClient } from '../../lib/api-client';

export interface Product {
  _id?: string;
  name: string;
  sku: string;
  barcode?: { number?: string; image?: string };
  description?: string;
  categoryId: string;
  categoryName?: string;
  supplierId: string;
  supplierName?: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  location?: string;
  imageUrls?: string[];
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductListResponse {
  success: boolean;
  count: number;
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const productService = {
  getProducts: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    supplierId?: string;
    stockStatus?: 'low' | 'out' | 'in';
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ProductListResponse> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });
    const url = `/api/warehouse/products${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get(url);
    if (!response.success) throw new Error(response.message || 'Failed to fetch products');
    return response.data;
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/api/warehouse/products/${id}`);
    if (!response.success) throw new Error(response.message || 'Failed to fetch product');
    return response.data.data;
  },

  createProduct: async (formData: FormData): Promise<Product> => {
    const response = await apiClient.post('/api/warehouse/products', formData);
    if (!response.success) throw new Error(response.message || 'Failed to create product');
    return response.data.data;
  },

  updateProduct: async (id: string, formData: FormData): Promise<Product> => {
    const response = await apiClient.put(`/api/warehouse/products/${id}`, formData);
    if (!response.success) throw new Error(response.message || 'Failed to update product');
    return response.data.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/api/warehouse/products/${id}`);
    if (!response.success) throw new Error(response.message || 'Failed to delete product');
  },

  // ✅ Fixed: use .append() to avoid type errors
  searchProducts: async (q: string, params?: { page?: number; limit?: number }): Promise<ProductListResponse> => {
    const query = new URLSearchParams();
    query.append('q', q);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const url = `/api/warehouse/products/search?${query.toString()}`;
    const response = await apiClient.get(url);
    if (!response.success) throw new Error(response.message || 'Failed to search products');
    return response.data;
  },

  getLowStockProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get('/api/warehouse/products/low-stock');
    if (!response.success) throw new Error(response.message || 'Failed to fetch low stock products');
    return response.data.data || [];
  },

  getProductByBarcode: async (barcode: string): Promise<Product> => {
    const response = await apiClient.get(`/api/warehouse/products/barcode/${barcode}`);
    if (!response.success) throw new Error(response.message || 'Product not found');
    return response.data.data;
  },

  checkBarcodeExists: async (barcode: string): Promise<boolean> => {
    const response = await apiClient.get(`/api/warehouse/products/check-barcode/${barcode}`);
    if (!response.success) throw new Error('Failed to check barcode');
    return response.data.exists;
  },
};