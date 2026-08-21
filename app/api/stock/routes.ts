// lib/api/stock.ts
import { apiClient } from '../../lib/api-client';

export interface StockMovement {
  _id?: string;
  productId: string;
  productName: string;
  type: 'stock_in' | 'stock_out';
  quantity: number;
  previousStock: number;
  newStock: number;
  stockType?: 'bulk' | 'box';
  stockDetails?: {
    boxCount?: number;
    piecesPerBox?: number;
    totalPieces?: number;
    quantityAdded?: number;
  };
  reason?: string;
  supplierId?: string;
  supplierName?: string;
  customerName?: string;
  reference?: string;
  status: 'Completed' | 'Pending' | 'Cancelled';
  notes?: string;
  createdBy?: {
    name: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface StockMovementResponse {
  success: boolean;
  data: StockMovement[];
  summary?: {
    totalIn: number;
    totalOut: number;
    total: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const stockService = {
  // ─── Get all stock movements ─────────────────────────────────
  getMovements: async (params?: {
    page?: number;
    limit?: number;
    type?: 'all' | 'in' | 'out';
    search?: string;
    locationId?: string;
  }): Promise<StockMovementResponse> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.type && params.type !== 'all') {
      query.append('type', params.type === 'in' ? 'stock_in' : 'stock_out');
    }
    if (params?.search) query.append('search', params.search);
    if (params?.locationId) query.append('locationId', params.locationId);
    
    // ✅ Correct path: /api/warehouse/stock/movements
    const url = `/api/warehouse/stock/movements${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get(url);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch stock movements');
    }
    return response.data;
  },

  // ─── Get today's movements ──────────────────────────────────
  getTodayMovements: async (type?: 'all' | 'in' | 'out'): Promise<StockMovementResponse> => {
    const query = new URLSearchParams();
    if (type && type !== 'all') query.append('type', type);
    // ✅ Correct path: /api/warehouse/stock/movements/today
    const url = `/api/warehouse/stock/movements/today${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get(url);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch today\'s movements');
    }
    return response.data;
  },

  // ─── Get product history ────────────────────────────────────
  getProductHistory: async (productId: string, params?: { page?: number; limit?: number }): Promise<StockMovementResponse> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    // ✅ Correct path: /api/warehouse/stock/history/:productId
    const url = `/api/warehouse/stock/history/${productId}${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get(url);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch product history');
    }
    return response.data;
  },

  // ─── Reason catalog ────────────────────────────────────────
  getReasons: async (): Promise<{
    stockIn: Array<{ value: string; label: string; requiresSupplier?: boolean; requiresBankAccount?: boolean }>;
    stockOut: Array<{ value: string; label: string }>;
  }> => {
    const response = await apiClient.get('/api/warehouse/stock/reasons');
    if (!response.success) {
      throw new Error(response.message || 'Failed to load stock reasons');
    }
    return response.data?.data || response.data;
  },

  // ─── Add Stock (Stock In) ──────────────────────────────────
  addStock: async (data: {
    productId: string;
    stockType: 'bulk' | 'box';
    quantity: number;
    boxCount?: number;
    piecesPerBox?: number;
    supplierId?: string;
    supplierName?: string;
    stockSourceReason: string;
    unitCost?: number;
    bankAccountId?: string;
    reference?: string;
    notes?: string;
    locationId?: string;
  }): Promise<StockMovement> => {
    // ✅ Correct path: /api/warehouse/stock/in
    const response = await apiClient.post('/api/warehouse/stock/in', data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to add stock');
    }
    return response.data;
  },

  // ─── Remove Stock (Stock Out) ──────────────────────────────
  removeStock: async (data: {
    productId: string;
    quantity: number;
    stockOutReason: string;
    customerName?: string;
    reference?: string;
    notes?: string;
    unitCost?: number;
    locationId?: string;
  }): Promise<StockMovement> => {
    // ✅ Correct path: /api/warehouse/stock/out
    const response = await apiClient.post('/api/warehouse/stock/out', data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to remove stock');
    }
    return response.data;
  },

  // ─── Update stock movement ──────────────────────────────────
  updateMovement: async (id: string, data: { status?: string; notes?: string }): Promise<StockMovement> => {
    // ✅ Correct path: /api/warehouse/stock/:id
    const response = await apiClient.put(`/api/warehouse/stock/${id}`, data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to update stock movement');
    }
    return response.data;
  },

  // ─── Delete stock movement ──────────────────────────────────
  deleteMovement: async (id: string): Promise<void> => {
    // ✅ Correct path: /api/warehouse/stock/:id
    const response = await apiClient.delete(`/api/warehouse/stock/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete stock movement');
    }
  },
};