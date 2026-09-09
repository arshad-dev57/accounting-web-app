import { apiClient } from '@/lib/api-client';

export type RequisitionStatus =
  | 'Draft'
  | 'Submitted'
  | 'Approved'
  | 'Rejected'
  | 'Partially Converted'
  | 'Converted'
  | 'Cancelled';

export interface PurchaseRequisitionItem {
  id?: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  estimatedUnitPrice: number;
  notes?: string;
  purpose?: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    costPrice?: number;
    taxRate?: number;
  };
}

export interface PurchaseRequisitionModel {
  id: string;
  requisitionNumber: string;
  title?: string;
  department?: string;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent' | string;
  requiredDate?: string;
  status: RequisitionStatus;
  suggestedSupplierId?: string;
  suggestedSupplierName?: string;
  notes?: string;
  rejectionReason?: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  convertedAt?: string;
  cancelledAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items: PurchaseRequisitionItem[];
  purchaseOrders?: Array<{
    id: string;
    orderNumber: string;
    status: string;
    grandTotal?: number;
    supplierName?: string;
  }>;
  creator?: { id: string; firstName: string; lastName: string; email: string };
  approver?: { id: string; firstName: string; lastName: string; email: string };
  totalItems: number;
  estimatedTotal: number;
  canEdit?: boolean;
  canSubmit?: boolean;
  canApprove?: boolean;
  canReject?: boolean;
  canConvert?: boolean;
  canCancel?: boolean;
}

export interface CreateRequisitionRequest {
  title?: string;
  department?: string;
  priority?: string;
  requiredDate?: string;
  suggestedSupplierId?: string;
  notes?: string;
  status?: string;
  locationId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    estimatedUnitPrice?: number;
    notes?: string;
    purpose?: string;
  }>;
}

export interface ConvertToPORequest {
  supplierId: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  notes?: string;
  termsConditions?: string;
  locationId?: string;
  status?: string;
  items?: Array<{
    productId: string;
    quantity: number;
    unitPrice?: number;
    discount?: number;
    taxRate?: number;
    notes?: string;
  }>;
}

export const purchaseRequisitionService = {
  getRequisitions: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    locationId?: string;
  } = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });
    const response = await apiClient.get(
      `/api/purchase/requisitions${query.toString() ? `?${query}` : ''}`
    );
    if (!response.success) throw new Error(response.message || 'Failed to fetch requisitions');
    const body = response.data || {};
    return {
      data: (body.data || []) as PurchaseRequisitionModel[],
      pagination: body.pagination || { page: 1, limit: 20, total: 0, pages: 0 },
    };
  },

  getStats: async (locationId?: string) => {
    const query = locationId ? `?locationId=${locationId}` : '';
    const response = await apiClient.get(`/api/purchase/requisitions/stats${query}`);
    if (!response.success) throw new Error(response.message || 'Failed to fetch stats');
    return (response.data?.data || response.data || {
      total: 0,
      draft: 0,
      submitted: 0,
      approved: 0,
      converted: 0,
    }) as {
      total: number;
      draft: number;
      submitted: number;
      approved: number;
      converted: number;
    };
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/api/purchase/requisitions/${id}`);
    if (!response.success) throw new Error(response.message || 'Failed to fetch requisition');
    return (response.data?.data || response.data) as PurchaseRequisitionModel;
  },

  create: async (data: CreateRequisitionRequest) => {
    const response = await apiClient.post('/api/purchase/requisitions', data);
    if (!response.success) throw new Error(response.message || 'Failed to create requisition');
    return (response.data?.data || response.data) as PurchaseRequisitionModel;
  },

  update: async (id: string, data: Partial<CreateRequisitionRequest>) => {
    const response = await apiClient.put(`/api/purchase/requisitions/${id}`, data);
    if (!response.success) throw new Error(response.message || 'Failed to update requisition');
    return (response.data?.data || response.data) as PurchaseRequisitionModel;
  },

  submit: async (id: string) => {
    const response = await apiClient.post(`/api/purchase/requisitions/${id}/submit`);
    if (!response.success) throw new Error(response.message || 'Failed to submit');
    return (response.data?.data || response.data) as PurchaseRequisitionModel;
  },

  approve: async (id: string) => {
    const response = await apiClient.post(`/api/purchase/requisitions/${id}/approve`);
    if (!response.success) throw new Error(response.message || 'Failed to approve');
    return (response.data?.data || response.data) as PurchaseRequisitionModel;
  },

  reject: async (id: string, reason?: string) => {
    const response = await apiClient.post(`/api/purchase/requisitions/${id}/reject`, { reason });
    if (!response.success) throw new Error(response.message || 'Failed to reject');
    return (response.data?.data || response.data) as PurchaseRequisitionModel;
  },

  cancel: async (id: string) => {
    const response = await apiClient.post(`/api/purchase/requisitions/${id}/cancel`);
    if (!response.success) throw new Error(response.message || 'Failed to cancel');
    return (response.data?.data || response.data) as PurchaseRequisitionModel;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/api/purchase/requisitions/${id}`);
    if (!response.success) throw new Error(response.message || 'Failed to delete');
  },

  convertToPO: async (id: string, data: ConvertToPORequest) => {
    const response = await apiClient.post(`/api/purchase/requisitions/${id}/convert-to-po`, data);
    if (!response.success) throw new Error(response.message || 'Failed to convert to PO');
    return response.data?.data || response.data;
  },
};
