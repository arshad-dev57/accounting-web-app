import { apiClient } from '@/lib/api-client';

interface ApiEnvelope {
  success: boolean;
  data?: any;
  message?: string;
}

function unwrap(res: ApiEnvelope): any {
  const body = res?.data ?? {};
  if (!res?.success || body?.success === false) {
    throw new Error(body?.message || res?.message || 'Manufacturing request failed');
  }
  return body;
}

function listOf(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

function paginationOf(value: any) {
  const body = value?.pagination || value?.data?.pagination;
  return (
    body || { page: 1, limit: 20, total: 0, pages: 0, hasNext: false, hasPrev: false }
  );
}

export interface MfgEntity {
  id?: string;
  _id?: string;
  companyId?: string;
  branchId?: string;
  locationId?: string;
  factoryId?: string;
  warehouseId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  locationId?: string;
  companyId?: string;
  factoryId?: string;
  productId?: string;
  productionOrderId?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ListResult<T> {
  data: T[];
  pagination: any;
}

/** Generic CRUD factory — mirrors how each module defines a thin service object. */
function entityService<T extends MfgEntity>(base: string) {
  const toQuery = (params: ListParams = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
    });
    const s = q.toString();
    return s ? `?${s}` : '';
  };
  return {
    list: async (params: ListParams = {}): Promise<ListResult<T>> => {
      const body = unwrap(await apiClient.get(`${base}${toQuery(params)}`));
      return { data: listOf(body), pagination: paginationOf(body) };
    },
    get: async (id: string): Promise<T> => {
      const body = unwrap(await apiClient.get(`${base}/${id}`));
      return (body.data ?? body) as T;
    },
    create: async (data: Partial<T>): Promise<T> => {
      const body = unwrap(await apiClient.post(base, data));
      return (body.data ?? body) as T;
    },
    update: async (id: string, data: Partial<T>): Promise<T> => {
      const body = unwrap(await apiClient.put(`${base}/${id}`, data));
      return (body.data ?? body) as T;
    },
    remove: async (id: string): Promise<void> => {
      unwrap(await apiClient.delete(`${base}/${id}`));
    },
  };
}

const M = '/api/manufacturing';

function qs(params: Record<string, any>): string {
  const q = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '') as any
  ).toString();
  return q;
}

// ============================================================
// Master data
// ============================================================
export const bomService = entityService<any>(`${M}/boms`);
export const bomVersionService = entityService<any>(`${M}/bom-versions`);
export const routingService = entityService<any>(`${M}/routings`);
export const operationService = entityService<any>(`${M}/operations`);
export const workCenterService = entityService<any>(`${M}/work-centers`);
export const machineService = entityService<any>(`${M}/machines`);

// ============================================================
// Production
// ============================================================
export interface ProductionOrder extends MfgEntity {
  orderNumber?: string;
  productId?: string;
  productName?: string;
  bomId?: string;
  bomName?: string;
  bomVersion?: string;
  plannedQuantity?: number;
  producedQuantity?: number;
  goodQuantity?: number;
  scrappedQuantity?: number;
  reworkQuantity?: number;
  rejectedQuantity?: number;
  remainingQuantity?: number;
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  sourceWarehouseId?: string;
  wipWarehouseId?: string;
  finishedGoodsWarehouseId?: string;
  demandType?: string;
  salesOrderId?: string;
  notes?: string;
}

export interface MaterialLine {
  productId: string;
  productName: string;
  requiredQty: number;
  reservedQty: number;
  issuedQty: number;
  consumedQty: number;
  remainingQty: number;
  availableQty: number;
  shortageQty: number;
  unit?: string;
  scrapPct?: number;
}

export const productionOrderService = {
  ...entityService<ProductionOrder>(`${M}/production-orders`),
  release: async (id: string) =>
    unwrap(await apiClient.post(`${M}/production-orders/${id}/release`)).data as ProductionOrder,
  pause: async (id: string, reason?: string) =>
    unwrap(await apiClient.post(`${M}/production-orders/${id}/pause`, { reason })).data as ProductionOrder,
  resume: async (id: string) =>
    unwrap(await apiClient.post(`${M}/production-orders/${id}/resume`)).data as ProductionOrder,
  complete: async (id: string, payload?: any) =>
    unwrap(await apiClient.post(`${M}/production-orders/${id}/complete`, payload)).data as ProductionOrder,
  close: async (id: string) =>
    unwrap(await apiClient.post(`${M}/production-orders/${id}/close`)).data as ProductionOrder,
  cancel: async (id: string, reason?: string) =>
    unwrap(await apiClient.post(`${M}/production-orders/${id}/cancel`, { reason })).data as ProductionOrder,
  materials: async (id: string): Promise<MaterialLine[]> => {
    const body = unwrap(await apiClient.get(`${M}/production-orders/${id}/materials`));
    return listOf(body);
  },
  operations: async (id: string): Promise<any[]> => {
    const body = unwrap(await apiClient.get(`${M}/production-orders/${id}/operations`));
    return listOf(body);
  },
  costing: async (id: string) => {
    const body = unwrap(await apiClient.get(`${M}/production-orders/${id}/costing`));
    return body;
  },
};

export const workOrderService = {
  ...entityService<any>(`${M}/work-orders`),
  start: async (id: string) =>
    unwrap(await apiClient.post(`${M}/work-orders/${id}/start`)).data as any,
  pause: async (id: string, reason?: string) =>
    unwrap(await apiClient.post(`${M}/work-orders/${id}/pause`, { reason })).data as any,
  resume: async (id: string) =>
    unwrap(await apiClient.post(`${M}/work-orders/${id}/resume`)).data as any,
  complete: async (id: string, payload: any = {}) =>
    unwrap(await apiClient.post(`${M}/work-orders/${id}/complete`, payload)).data as any,
  report: async (id: string, payload: any) =>
    unwrap(await apiClient.post(`${M}/work-orders/${id}/report`, payload)).data as any,
};
export const shopFloorService = {
  ...entityService<any>(`${M}/shop-floor`),
  start: async (id: string) =>
    unwrap(await apiClient.post(`${M}/shop-floor/${id}/start`)).data as any,
  pause: async (id: string, reason?: string) =>
    unwrap(await apiClient.post(`${M}/shop-floor/${id}/pause`, { reason })).data as any,
  resume: async (id: string) =>
    unwrap(await apiClient.post(`${M}/shop-floor/${id}/resume`)).data as any,
  complete: async (id: string, payload: any) =>
    unwrap(await apiClient.post(`${M}/shop-floor/${id}/complete`, payload)).data as any,
  report: async (id: string, payload: any) =>
    unwrap(await apiClient.post(`${M}/shop-floor/${id}/report`, payload)).data as any,
};
export const productionTrackingService = entityService<any>(`${M}/production-tracking`);

// ============================================================
// Materials
// ============================================================
export const materialReservationService = entityService<any>(`${M}/material-reservations`);
export const materialIssueService = entityService<any>(`${M}/material-issues`);
export const materialConsumptionService = entityService<any>(`${M}/material-consumption`);
export const wipService = entityService<any>(`${M}/wip`);
export const scrapService = entityService<any>(`${M}/scrap`);
export const byProductService = entityService<any>(`${M}/by-products`);

// ============================================================
// Quality
// ============================================================
export const inspectionPlanService = entityService<any>(`${M}/inspection-plans`);
export const inspectionService = entityService<any>(`${M}/inspections`);
export const defectService = entityService<any>(`${M}/defects`);
export const reworkService = entityService<any>(`${M}/rework`);

// ============================================================
// Maintenance
// ============================================================
export const maintenanceRequestService = entityService<any>(`${M}/maintenance-requests`);
export const preventiveMaintenanceService = entityService<any>(`${M}/preventive-maintenance`);
export const breakdownService = entityService<any>(`${M}/breakdowns`);
export const maintenanceOrderService = entityService<any>(`${M}/maintenance-orders`);
export const sparePartService = entityService<any>(`${M}/spare-parts`);

// ============================================================
// Subcontracting
// ============================================================
export const subcontractVendorService = entityService<any>(`${M}/subcontract-vendors`);
export const subcontractOrderService = entityService<any>(`${M}/subcontract-orders`);

// ============================================================
// Planning
// ============================================================
export const demandPlanningService = entityService<any>(`${M}/demand-planning`);
export const mpsService = {
  ...entityService<any>(`${M}/mps`),
  explode: async (params: Record<string, any> = {}) =>
    unwrap(await apiClient.get(`${M}/mps/explode?${qs(params)}`)),
};
export const mrpService = {
  run: async (params: Record<string, any> = {}) =>
    unwrap(await apiClient.get(`${M}/mrp?${qs(params)}`)),
};
export const materialShortageService = {
  check: async (params: Record<string, any> = {}) => {
    const body = unwrap(await apiClient.get(`${M}/material-shortage?${qs(params)}`));
    return { data: listOf(body), summary: body?.summary || {} };
  },
};

// ============================================================
// Costing
// ============================================================
export const costingService = {
  productCost: async (productId: string) =>
    unwrap(await apiClient.get(`${M}/costing/product/${productId}`)),
  standard: async (params: Record<string, any> = {}) =>
    unwrap(await apiClient.get(`${M}/costing/standard?${qs(params)}`)),
  actual: async (params: Record<string, any> = {}) =>
    unwrap(await apiClient.get(`${M}/costing/actual?${qs(params)}`)),
  variance: async (params: Record<string, any> = {}) =>
    unwrap(await apiClient.get(`${M}/costing/variance?${qs(params)}`)),
};

// ============================================================
// Reports
// ============================================================
export const manufacturingReportService = {
  production: async (params: Record<string, any> = {}) =>
    unwrap(await apiClient.get(`${M}/reports/production?${qs(params)}`)),
  material: async (params: Record<string, any> = {}) =>
    unwrap(await apiClient.get(`${M}/reports/material?${qs(params)}`)),
  quality: async (params: Record<string, any> = {}) =>
    unwrap(await apiClient.get(`${M}/reports/quality?${qs(params)}`)),
  machine: async (params: Record<string, any> = {}) =>
    unwrap(await apiClient.get(`${M}/reports/machine?${qs(params)}`)),
  efficiency: async (params: Record<string, any> = {}) =>
    unwrap(await apiClient.get(`${M}/reports/efficiency?${qs(params)}`)),
  cost: async (params: Record<string, any> = {}) =>
    unwrap(await apiClient.get(`${M}/reports/cost?${qs(params)}`)),
};

// ============================================================
// Settings / numbering
// ============================================================
export const manufacturingSettingsService = {
  get: async () => unwrap(await apiClient.get(`${M}/settings`)).data,
  update: async (data: any) => unwrap(await apiClient.put(`${M}/settings`, data)).data,
};

// ============================================================
// Dashboard
// ============================================================
export interface MfgDashboardData {
  kpis: Record<string, number>;
  production: {
    plannedVsActual: Array<{ label: string; planned: number; actual: number }>;
    daily: Array<{ label: string; produced: number; planned: number }>;
    monthly: Array<{ label: string; produced: number; planned: number }>;
    byProduct: Array<{ label: string; value: number; color: string }>;
    byBranch: Array<{ label: string; value: number; color: string }>;
  };
  materials: {
    consumption: Array<{ label: string; value: number; color: string }>;
    shortage: Array<{ productName: string; shortageQty: number }>;
    rawAvailability: Array<{ label: string; value: number; color: string }>;
    wip: Array<{ label: string; value: number; color: string }>;
    finishedGoods: Array<{ label: string; value: number; color: string }>;
  };
  quality: {
    passed: number;
    failed: number;
    rework: number;
    scrap: number;
    rejectionRate: number;
    byStatus: Array<{ label: string; value: number; color: string }>;
  };
  machines: {
    utilization: number;
    downtime: number;
    machinesRunning: number;
    machinesIdle: number;
    machinesMaintenance: number;
    statusChart: Array<{ label: string; value: number; color: string }>;
  };
  productionOrders: any[];
}

export function emptyDashboard(): MfgDashboardData {
  return {
    kpis: {},
    production: { plannedVsActual: [], daily: [], monthly: [], byProduct: [], byBranch: [] },
    materials: { consumption: [], shortage: [], rawAvailability: [], wip: [], finishedGoods: [] },
    quality: { passed: 0, failed: 0, rework: 0, scrap: 0, rejectionRate: 0, byStatus: [] },
    machines: {
      utilization: 0, downtime: 0, machinesRunning: 0, machinesIdle: 0,
      machinesMaintenance: 0, statusChart: [],
    },
    productionOrders: [],
  };
}

export const manufacturingDashboardService = {
  get: async (params: Record<string, any> = {}): Promise<MfgDashboardData> => {
    const body = unwrap(await apiClient.get(`${M}/dashboard?${qs(params)}`));
    const d = body?.data ?? body ?? {};
    const norm = emptyDashboard();
    return {
      kpis: d.kpis || {},
      production: { ...norm.production, ...(d.production || {}) },
      materials: { ...norm.materials, ...(d.materials || {}) },
      quality: { ...norm.quality, ...(d.quality || {}) },
      machines: { ...norm.machines, ...(d.machines || {}) },
      productionOrders: listOf(d.productionOrders),
    };
  },
};




