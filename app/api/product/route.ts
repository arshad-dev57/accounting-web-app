import { apiClient } from '@/lib/api-client';

export interface Product {
  id?: string;
  _id?: string;
  name: string;
  sku: string;
  barcode?: { number?: string; image?: string };
  barcodeNumber?: string;
  barcodeImage?: string;
  description?: string;
  categoryId: string;
  categoryName?: string;
  supplierId: string;
  supplierName?: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  companyStock?: number;
  locationStock?: number;
  minimumStock: number;
  maximumStock: number;
  location?: string;
  imageUrls?: string[];
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  productType?: string;
  stockUnit?: string;
  stockUnitName?: string;
  weight?: number;
  weightUnit?: string;
  weightUnitName?: string;
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: string;
  dimensionUnitName?: string;
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
  shelfLifeDays?: number;
  taxRate?: number;
  taxType?: string;
  taxTypeName?: string;
  currency?: string;
  currencyCode?: string;
  brand?: string;
  brandName?: string;
  modelNumber?: string;
  tags?: string[] | string;
  colors?: string[];
  sizes?: string[];
  rackLocation?: string;
  zone?: string;
  zoneName?: string;
  palletNumber?: string;
  shelfNumber?: string;
  storageCondition?: string;
  storageConditionName?: string;
  tempMin?: number;
  tempMax?: number;
  temperatureMin?: number;
  temperatureMax?: number;
  hsCode?: string;
  countryOfOrigin?: string;
  countryOfOriginName?: string;
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
  defaultQuantityPerBatch?: number;
  videoUrl?: string;
  leadTime?: number;
  leadTimeDays?: number;
  reorderPoint?: number;
  supplierSku?: string;
  landingCost?: number;
  mainImage?: string;
  images?: string[];
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

/** Normalize Prisma/backend product shape for the UI. */
export function normalizeProduct(raw: any): Product {
  if (!raw) return raw;
  const locationQty =
    raw.locationStock != null
      ? Number(raw.locationStock)
      : Number(raw.currentStock ?? 0);
  return {
    ...raw,
    id: raw.id || raw._id,
    _id: raw._id || raw.id,
    categoryId: raw.categoryId || raw.category?.id || '',
    categoryName: raw.categoryName || raw.category?.name || '',
    barcode: raw.barcode || {
      number: raw.barcodeNumber || '',
      image: raw.barcodeImage || undefined,
    },
    barcodeNumber: raw.barcodeNumber || raw.barcode?.number || '',
    stockUnit: raw.stockUnit || raw.stockUnitName || 'Pcs',
    stockUnitName: raw.stockUnitName || raw.stockUnit || 'Pcs',
    currency: raw.currency || raw.currencyCode || 'PKR',
    currencyCode: raw.currencyCode || raw.currency || 'PKR',
    brand: raw.brand || raw.brandName || '',
    brandName: raw.brandName || raw.brand || '',
    leadTime: raw.leadTime ?? raw.leadTimeDays ?? 0,
    leadTimeDays: raw.leadTimeDays ?? raw.leadTime ?? 0,
    shelfLife: raw.shelfLife ?? raw.shelfLifeDays,
    shelfLifeDays: raw.shelfLifeDays ?? raw.shelfLife,
    defaultBatchQuantity: raw.defaultBatchQuantity ?? raw.defaultQuantityPerBatch,
    defaultQuantityPerBatch: raw.defaultQuantityPerBatch ?? raw.defaultBatchQuantity,
    tempMin: raw.tempMin ?? raw.temperatureMin,
    tempMax: raw.tempMax ?? raw.temperatureMax,
    temperatureMin: raw.temperatureMin ?? raw.tempMin,
    temperatureMax: raw.temperatureMax ?? raw.tempMax,
    zone: raw.zone || raw.zoneName || '',
    zoneName: raw.zoneName || raw.zone || '',
    storageCondition: raw.storageCondition || raw.storageConditionName || '',
    storageConditionName: raw.storageConditionName || raw.storageCondition || '',
    countryOfOrigin: raw.countryOfOrigin || raw.countryOfOriginName || '',
    countryOfOriginName: raw.countryOfOriginName || raw.countryOfOrigin || '',
    taxType: raw.taxType || raw.taxTypeName || '',
    taxTypeName: raw.taxTypeName || raw.taxType || '',
    weightUnit: raw.weightUnit || raw.weightUnitName || '',
    dimensionUnit: raw.dimensionUnit || raw.dimensionUnitName || '',
    rackLocation: raw.rackLocation || raw.location || '',
    location: raw.location || raw.rackLocation || '',
    images: Array.isArray(raw.images) ? raw.images : [],
    mainImage: raw.mainImage || (Array.isArray(raw.images) && raw.images[0]) || undefined,
    barcodeImage: raw.barcodeImage || raw.barcode?.image || undefined,
    currentStock: locationQty,
    minimumStock: Number(raw.minimumStock ?? 0),
  };
}

export function getProductId(product?: Product | null): string | undefined {
  if (!product) return undefined;
  return product.id || product._id;
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
    locationId?: string;
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
    const body = response.data || {};
    return {
      ...body,
      data: (body.data || []).map(normalizeProduct),
      pagination: body.pagination || {
        page: params.page || 1,
        limit: params.limit || 20,
        total: 0,
        pages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/api/warehouse/products/${id}`);
    if (!response.success) throw new Error(response.message || 'Failed to fetch product');
    return normalizeProduct(response.data.data);
  },

  createProduct: async (formData: FormData): Promise<Product> => {
    const response = await apiClient.post('/api/warehouse/products', formData);
    if (!response.success) throw new Error(response.message || 'Failed to create product');
    return normalizeProduct(response.data.data);
  },

  updateProduct: async (id: string, formData: FormData): Promise<Product> => {
    const response = await apiClient.put(`/api/warehouse/products/${id}`, formData);
    if (!response.success) {
      throw new Error(response.message || 'Failed to update product');
    }
    return normalizeProduct(response.data.data);
  },

  deleteProduct: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/api/warehouse/products/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete product');
    }
  },

  searchProducts: async (q: string, params?: { page?: number; limit?: number }): Promise<ProductListResponse> => {
    const query = new URLSearchParams();
    query.append('q', q);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const url = `/api/warehouse/products/search?${query.toString()}`;
    const response = await apiClient.get(url);
    if (!response.success) throw new Error(response.message || 'Failed to search products');
    const body = response.data || {};
    return {
      ...body,
      data: (body.data || []).map(normalizeProduct),
    };
  },

  getLowStockProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get('/api/warehouse/products/low-stock');
    if (!response.success) throw new Error(response.message || 'Failed to fetch low stock products');
    return (response.data.data || []).map(normalizeProduct);
  },

  getProductByBarcode: async (barcode: string): Promise<Product> => {
    const response = await apiClient.get(`/api/warehouse/products/barcode/${barcode}`);
    if (!response.success) throw new Error(response.message || 'Product not found');
    return normalizeProduct(response.data.data);
  },

  checkBarcodeExists: async (barcode: string): Promise<boolean> => {
    const response = await apiClient.get(`/api/warehouse/products/check-barcode/${barcode}`);
    if (!response.success) throw new Error('Failed to check barcode');
    return response.data.exists;
  },

  generateSku: async (productName?: string, categoryId?: string): Promise<string> => {
    const response = await apiClient.post('/api/warehouse/products/generate-sku', {
      productName,
      categoryId,
    });
    if (!response.success) throw new Error(response.message || 'Failed to generate SKU');
    return response.data?.data?.sku || response.data?.sku || '';
  },
};
