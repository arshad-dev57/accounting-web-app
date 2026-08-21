import { apiClient } from '@/lib/api-client';

// ─── TYPES ─────────────────────────────────────────────────────

export interface GoodsReceivingModel {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  receivingDate: string;
  status: 'Draft' | 'Partially Received' | 'Fully Received';
  receivedBy?: string;
  notes?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  createdBy: string;
  updatedBy?: string;
  isActive: boolean;
  isDeleted: boolean;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  items: GoodsReceivingItemModel[];
  canConfirm?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  totalItems: number;
  totalReceivedQty: number;
  totalOrderedQty: number;
  receivingProgress: number;
}

export interface GoodsReceivingItemModel {
  id: string;
  goodsReceivingId: string;
  purchaseOrderItemId: string;
  productId: string;
  productName: string;
  sku: string;
  orderedQuantity: number;
  previouslyReceivedQty: number;
  remainingQuantity: number;
  receivingQuantity: number;
  unit: string;
  notes?: string;
  isFullyReceived: boolean;
  isPartiallyReceived: boolean;
}

export interface GRNLineDraft {
  purchaseOrderItemId: string;
  productId: string;
  productName: string;
  sku: string;
  orderedQuantity: number;
  remainingQuantity: number;
  alreadyReceived: number;
  receivingQuantity: number;
  unit: string;
}

export interface PurchaseOrderForReceiving {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  status: string;
  remainingItems: PurchaseOrderItemForReceiving[];
  totalRemainingItems: number;
}

export interface PurchaseOrderItemForReceiving {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  alreadyReceived: number;
  remainingQuantity: number;
  unit: string;
}

export interface GoodsReceivingStats {
  todayCount: number;
  monthCount: number;
  draftCount: number;
  partiallyReceivedCount: number;
  fullyReceivedCount: number;
  totalCount: number;
}

export interface GoodsReceivingListResponse {
  success: boolean;
  data: GoodsReceivingModel[];
  stats: GoodsReceivingStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateGRNRequest {
  purchaseOrderId: string;
  receivingDate: string;
  receivedBy?: string;
  notes?: string;
  status?: string;
  locationId?: string;
  items: Array<{
    purchaseOrderItemId: string;
    receivingQuantity: number;
  }>;
}

// ─── SERVICE ──────────────────────────────────────────────────

export const goodsReceivingService = {
  // ─── Get GRNs with pagination and filters ──────────────────
  getGRNs: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    locationId?: string;
  } = {}): Promise<GoodsReceivingListResponse> => {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/purchase/goods-receiving${query.toString() ? `?${query.toString()}` : ''}`;
    
    try {
      const response = await apiClient.get(url);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch goods receiving');
      }
      
      const data = response.data || {};
      
      return {
        success: response.success,
        data: data.data || [],
        stats: data.stats || {
          todayCount: 0,
          monthCount: 0,
          draftCount: 0,
          partiallyReceivedCount: 0,
          fullyReceivedCount: 0,
          totalCount: 0
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
      console.error('Get GRNs error:', error);
      throw new Error(error.message || 'Failed to fetch goods receiving');
    }
  },

  // ─── Search available purchase orders for receiving ────────
  searchAvailableOrders: async (
    query: string,
    limit: number = 10,
    locationId?: string
  ): Promise<PurchaseOrderForReceiving[]> => {
    try {
      const params = new URLSearchParams({
        search: query,
        limit: String(limit),
      });
      if (locationId) params.set('locationId', locationId);
      const response = await apiClient.get(
        `/api/purchase/goods-receiving/available-orders?${params.toString()}`
      );
      if (!response.success) {
        throw new Error(response.message || 'Failed to search available orders');
      }
      return response.data?.data || [];
    } catch (error: any) {
      console.error('Search available orders error:', error);
      return [];
    }
  },

  // ─── Create GRN ─────────────────────────────────────────────
  createGRN: async (data: CreateGRNRequest): Promise<GoodsReceivingModel> => {
    try {
      const response = await apiClient.post('/api/purchase/goods-receiving', data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create goods receiving');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Create GRN error:', error);
      throw new Error(error.message || 'Failed to create goods receiving');
    }
  },

  // ─── Get GRN by ID ──────────────────────────────────────────
  getGRNById: async (id: string): Promise<GoodsReceivingModel> => {
    try {
      const response = await apiClient.get(`/api/purchase/goods-receiving/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch goods receiving');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Get GRN error:', error);
      throw new Error(error.message || 'Failed to fetch goods receiving');
    }
  },

  // ─── Confirm GRN (updates inventory) ────────────────────────
  confirmGRN: async (id: string): Promise<GoodsReceivingModel> => {
    try {
      const response = await apiClient.post(`/api/purchase/goods-receiving/${id}/confirm`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to confirm goods receiving');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Confirm GRN error:', error);
      throw new Error(error.message || 'Failed to confirm goods receiving');
    }
  },

  // ─── Update GRN ─────────────────────────────────────────────
  updateGRN: async (id: string, data: Partial<CreateGRNRequest>): Promise<GoodsReceivingModel> => {
    try {
      const response = await apiClient.put(`/api/purchase/goods-receiving/${id}`, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update goods receiving');
      }
      return response.data?.data;
    } catch (error: any) {
      console.error('Update GRN error:', error);
      throw new Error(error.message || 'Failed to update goods receiving');
    }
  },

  // ─── Delete GRN ─────────────────────────────────────────────
  deleteGRN: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.delete(`/api/purchase/goods-receiving/${id}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete goods receiving');
      }
    } catch (error: any) {
      console.error('Delete GRN error:', error);
      throw new Error(error.message || 'Failed to delete goods receiving');
    }
  }
};