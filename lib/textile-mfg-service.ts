'use client';

import { apiClient } from '@/lib/api-client';

async function call<T>(method: 'get' | 'post', path: string, body?: unknown): Promise<T> {
  const res =
    method === 'get'
      ? await apiClient.get(`/api/manufacturing${path}`)
      : await apiClient.post(`/api/manufacturing${path}`, body || {});
  const payload = (res.data ?? {}) as { data?: T; message?: string; success?: boolean };
  if (!res.success) {
    throw new Error(payload.message || res.message || 'Textile request failed');
  }
  return payload.data as T;
}

export type TextileSandboxStatus = {
  sandboxCompany: { id: string; name: string; isSandbox: boolean } | null;
  activeCompany: { id: string; name: string; isSandbox?: boolean } | null;
  inSandbox: boolean;
  hasMembership: boolean;
  masters: {
    warehouseId: string | null;
    warehouseName: string | null;
    yarnProductId: string | null;
    yarnProductName: string | null;
    coneProductId: string | null;
    coneProductName: string | null;
    yarnLotNumber: string;
    machineId: string | null;
    machineName: string | null;
    yarnStockKg: number;
    yarnLotKg: number;
    coneStockKg: number;
  } | null;
  constants: Record<string, string>;
};

export type TextileYarnLot = {
  id: string;
  lotNumber: string;
  productId: string;
  productName?: string;
  warehouseId: string;
  warehouseName?: string;
  currentStock: number;
  availableStock: number;
  unitCost?: number | null;
};

export type TextileCone = {
  id: string;
  coneCode: string;
  yarnLotNumber: string;
  weightKg: number;
  status: string;
  warehouse?: { id: string; name: string } | null;
  windingEntry?: { id: string; entryNumber: string; status: string } | null;
  genealogy?: {
    yarnLots: { lotNumber: string | null; quantity?: number | null; metadata?: unknown }[];
    parents: unknown[];
    children: unknown[];
  };
  [key: string]: unknown;
};

export type TextileWindingEntry = {
  id: string;
  entryNumber: string;
  status: string;
  yarnLotNumber: string;
  yarnProductName: string;
  coneProductName: string;
  inputWeightKg: number;
  outputWeightKg: number;
  wastageKg: number;
  rejectedWeightKg: number;
  remainingYarnKg: number;
  coneCount: number;
  operatorName?: string | null;
  shift?: string | null;
  productionDate: string;
  stockPosted: boolean;
  machine?: { id: string; name: string; machineCode?: string } | null;
  cones?: TextileCone[];
  [key: string]: unknown;
};

export const textileMfgService = {
  sandboxStatus: () => call<TextileSandboxStatus>('get', '/textile/sandbox/status'),
  ensureSandbox: (body?: { activate?: boolean }) =>
    call<{ company: { id: string; name: string }; masters: Record<string, unknown>; activated: boolean }>(
      'post',
      '/textile/sandbox/ensure',
      body || { activate: true }
    ),
  inventory: () => call<Record<string, unknown>>('get', '/textile/inventory'),
  yarnLots: (params?: { productId?: string; warehouseId?: string }) => {
    const q = new URLSearchParams();
    if (params?.productId) q.set('productId', params.productId);
    if (params?.warehouseId) q.set('warehouseId', params.warehouseId);
    const suffix = q.toString() ? `?${q}` : '';
    return call<TextileYarnLot[]>('get', `/textile/yarn-lots${suffix}`);
  },
  machines: () => call<any[]>('get', '/textile/machines'),
  warehouses: () => call<any[]>('get', '/textile/warehouses'),
  products: (textileItemClass?: string) => {
    const q = textileItemClass ? `?textileItemClass=${encodeURIComponent(textileItemClass)}` : '';
    return call<any[]>('get', `/textile/products${q}`);
  },
  listWinding: () => call<TextileWindingEntry[]>('get', '/textile/winding'),
  getWinding: (id: string) => call<TextileWindingEntry>('get', `/textile/winding/${id}`),
  createWinding: (body: Record<string, unknown>) =>
    call<TextileWindingEntry>('post', '/textile/winding', body),
  postWinding: (id: string) => call<TextileWindingEntry>('post', `/textile/winding/${id}/post`),
  listCones: (params?: { yarnLotNumber?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.yarnLotNumber) q.set('yarnLotNumber', params.yarnLotNumber);
    if (params?.status) q.set('status', params.status);
    const suffix = q.toString() ? `?${q}` : '';
    return call<TextileCone[]>('get', `/textile/cones${suffix}`);
  },
  getCone: (id: string) => call<TextileCone>('get', `/textile/cones/${id}`),
  genealogy: (entityType: string, entityId: string) =>
    call<any>('get', `/textile/genealogy/${entityType}/${entityId}`),
  listBeams: () => call<any[]>('get', '/textile/beams'),
  createBeam: (body: Record<string, unknown>) => call<any>('post', '/textile/beams', body),
  listRolls: () => call<any[]>('get', '/textile/fabric-rolls'),
  createRoll: (body: Record<string, unknown>) => call<any>('post', '/textile/fabric-rolls', body)
};
