import { apiClient } from '@/lib/api-client';

export interface Product {
  id?: string;
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
  // Additional fields
  productType?: string;
  stockUnit?: string;
  weight?: number;
  weightUnit?: string;
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: string;
  color?: string;
  size?: string;
  material?: string;
  finish?: string;
  hasExpiry?: boolean;
  isBatchManaged?: boolean;
  isSerialManaged?: boolean;
  isExpiryManaged?: boolean;
  expiryDate?: string;
  manufacturingDate?: string;
  batchNumber?: string;
  shelfLife?: number;
  taxRate?: number;
  taxType?: string;
  currency?: string;
  brand?: string;
  modelNumber?: string;
  tags?: string[];
  colors?: string[];
  sizes?: string[];
  rackLocation?: string;
  zone?: string;
  palletNumber?: string;
  shelfNumber?: string;
  storageCondition?: string;
  tempMin?: number;
  tempMax?: number;
  hsCode?: string;
  countryOfOrigin?: string;
  shippingClass?: string;
  freightClass?: string;
  stackingLimit?: number;
  dangerousGoods?: boolean;
  unNumber?: string;
  handlingInstructions?: string;
  warrantyPeriod?: number;
  warrantyUnit?: string;
  isReturnable?: boolean;
  returnDays?: number;
  isBulkManaged?: boolean;
  hasIndividualTracking?: boolean;
  bulkUnit?: string;
  defaultBatchQuantity?: number;
  videoUrl?: string;
  leadTime?: number;
  reorderPoint?: number;
  supplierSku?: string;
  landingCost?: number;
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
    console.log('🔵 [productService.updateProduct] Starting update for product ID:', id);
    console.log('🔵 [productService.updateProduct] FormData entries:');
    for (const [key, value] of formData.entries()) {
      console.log('  -', key, ':', value);
    }

    const response = await apiClient.put(`/api/warehouse/products/${id}`, formData);

    console.log('🔵 [productService.updateProduct] API response:', JSON.stringify(response, null, 2));

    if (!response.success) {
      console.log('❌ [productService.updateProduct] Update failed:', response.message);
      throw new Error(response.message || 'Failed to update product');
    }

    console.log('✅ [productService.updateProduct] Update successful');
    return response.data.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    console.log('🔵 [productService.deleteProduct] Starting delete for product ID:', id);

    const response = await apiClient.delete(`/api/warehouse/products/${id}`);

    console.log('🔵 [productService.deleteProduct] API response:', JSON.stringify(response, null, 2));

    if (!response.success) {
      console.log('❌ [productService.deleteProduct] Delete failed:', response.message);
      throw new Error(response.message || 'Failed to delete product');
    }

    console.log('✅ [productService.deleteProduct] Delete successful');
  },

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