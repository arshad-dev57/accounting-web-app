import { apiClient } from '@/lib/api-client';

export interface FixedAsset {
  id: string;
  name: string;
  assetCode: string;
  category: string;
  purchaseDate: string;
  purchaseCost: number;
  usefulLife: number;
  salvageValue: number;
  depreciationMethod: string;
  currentDepreciation: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  status: string;
  location: string;
  supplier: string;
  warrantyExpiry: string | null;
  notes: string;
  lastDepreciationDate: string | null;
  disposedDate: string | null;
  disposalAmount: number | null;
}

export interface Summary {
  totalAssets: number;
  totalCost: number;
  accumulatedDepreciation: number;
  netBookValue: number;
}

export interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface AssetListResponse {
  success: boolean;
  data: FixedAsset[];
  summary: Summary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateAssetRequest {
  name: string;
  category: string;
  purchaseDate: Date;
  purchaseCost: number;
  usefulLife: number;
  salvageValue: number;
  location: string;
  supplierId?: string;
  warrantyExpiry?: Date;
  notes?: string;
  acquisitionType?: 'purchase' | 'opening_balance';
  paymentMethod?: 'Cash' | 'Bank' | 'Credit' | 'Opening Balance';
  bankAccountId?: string;
  openingAccumulatedDepreciation?: number;
}

export interface BankAccountOption {
  id: string;
  accountName: string;
  accountNumber?: string;
  bankName?: string;
  status?: string;
}

export interface UpdateAssetRequest extends CreateAssetRequest {
  id: string;
}

export interface DisposeAssetRequest {
  assetId: string;
  disposalDate: Date;
  disposalAmount: number;
  disposalReason: string;
}

export const fixedAssetsService = {
  getSummary: async (): Promise<Summary> => {
    const response = await apiClient.get('/api/fixed-assets/summary');
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch summary');
    }
    return (
      response.data?.data || {
        totalAssets: 0,
        totalCost: 0,
        accumulatedDepreciation: 0,
        netBookValue: 0,
      }
    );
  },

  getAssets: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
  } = {}): Promise<AssetListResponse> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `/api/fixed-assets${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get(url);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch assets');
    }

    const data = response.data || {};
    return {
      success: response.success,
      data: data.data || [],
      summary: data.summary || {
        totalAssets: 0,
        totalCost: 0,
        accumulatedDepreciation: 0,
        netBookValue: 0,
      },
      pagination: data.pagination || {
        page: params.page || 1,
        limit: params.limit || 10,
        total: 0,
        pages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  },

  getVendors: async (): Promise<Vendor[]> => {
    try {
      const response = await apiClient.get('/api/warehouse/supplier');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch vendors');
      }
      return response.data?.data || [];
    } catch {
      return [];
    }
  },

  getBankAccounts: async (): Promise<BankAccountOption[]> => {
    try {
      const response = await apiClient.get('/api/bank-accounts');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch bank accounts');
      }
      const list = (response.data?.data as any[]) || [];
      return list
        .filter((a) => (a.status || 'Active') === 'Active')
        .map((a) => ({
          id: String(a.id || a._id),
          accountName: String(a.accountName || a.name || 'Account'),
          accountNumber: a.accountNumber ? String(a.accountNumber) : undefined,
          bankName: a.bankName ? String(a.bankName) : undefined,
          status: a.status ? String(a.status) : undefined,
        }));
    } catch {
      return [];
    }
  },

  createAsset: async (data: CreateAssetRequest): Promise<FixedAsset> => {
    const payload: Record<string, unknown> = {
      name: data.name,
      category: data.category,
      purchaseDate: data.purchaseDate.toISOString().split('T')[0],
      purchaseCost: data.purchaseCost,
      usefulLife: data.usefulLife,
      salvageValue: data.salvageValue,
      location: data.location,
      supplierId: data.supplierId,
      warrantyExpiry: data.warrantyExpiry
        ? data.warrantyExpiry.toISOString().split('T')[0]
        : undefined,
      notes: data.notes || '',
      acquisitionType: data.acquisitionType || 'purchase',
      paymentMethod:
        data.acquisitionType === 'opening_balance'
          ? 'Opening Balance'
          : data.paymentMethod || 'Cash',
      openingAccumulatedDepreciation:
        data.acquisitionType === 'opening_balance'
          ? data.openingAccumulatedDepreciation || 0
          : 0,
    };

    if (data.paymentMethod === 'Bank' && data.bankAccountId) {
      payload.bankAccountId = data.bankAccountId;
    }

    const response = await apiClient.post('/api/fixed-assets', payload);
    if (!response.success) {
      throw new Error(response.message || 'Failed to create asset');
    }
    return response.data?.data;
  },

  updateAsset: async (data: UpdateAssetRequest): Promise<FixedAsset> => {
    const { id, ...rest } = data;
    const payload = {
      name: rest.name,
      category: rest.category,
      purchaseDate: rest.purchaseDate.toISOString().split('T')[0],
      purchaseCost: rest.purchaseCost,
      usefulLife: rest.usefulLife,
      salvageValue: rest.salvageValue,
      location: rest.location,
      supplierId: rest.supplierId,
      warrantyExpiry: rest.warrantyExpiry
        ? rest.warrantyExpiry.toISOString().split('T')[0]
        : undefined,
      notes: rest.notes || '',
    };

    const response = await apiClient.put(`/api/fixed-assets/${id}`, payload);
    if (!response.success) {
      throw new Error(response.message || 'Failed to update asset');
    }
    return response.data?.data;
  },

  depreciateAsset: async (assetId: string): Promise<any> => {
    const payload = {
      assetId,
      depreciationDate: new Date().toISOString().split('T')[0],
    };
    const response = await apiClient.post('/api/fixed-assets/depreciate', payload);
    if (!response.success) {
      throw new Error(response.message || 'Failed to depreciate asset');
    }
    return response.data?.data;
  },

  runMonthlyDepreciation: async (): Promise<{ processed: number }> => {
    const payload = {
      depreciationDate: new Date().toISOString().split('T')[0],
    };
    const response = await apiClient.post('/api/fixed-assets/depreciate-all', payload);
    if (!response.success) {
      throw new Error(response.message || 'Failed to run depreciation');
    }
    return response.data?.data || { processed: 0 };
  },

  disposeAsset: async (data: DisposeAssetRequest): Promise<any> => {
    const payload = {
      assetId: data.assetId,
      disposalDate: data.disposalDate.toISOString().split('T')[0],
      disposalAmount: data.disposalAmount,
      disposalReason: data.disposalReason,
    };
    const response = await apiClient.post('/api/fixed-assets/dispose', payload);
    if (!response.success) {
      throw new Error(response.message || 'Failed to dispose asset');
    }
    return response.data?.data;
  },

  deleteAsset: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/api/fixed-assets/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete asset');
    }
  },

  getAssetById: async (id: string): Promise<FixedAsset> => {
    const response = await apiClient.get(`/api/fixed-assets/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch asset');
    }
    return response.data?.data;
  },
};
