'use client';

import { apiClient } from '@/lib/api-client';

async function call<T>(
  method: 'get' | 'post' | 'patch',
  path: string,
  body?: unknown
): Promise<T> {
  const res =
    method === 'get'
      ? await apiClient.get(`/api/textile-weaving${path}`)
      : method === 'post'
        ? await apiClient.post(`/api/textile-weaving${path}`, body || {})
        : await apiClient.patch(`/api/textile-weaving${path}`, body || {});
  const payload = (res.data ?? {}) as { data?: T; message?: string; success?: boolean };
  if (!res.success) {
    throw new Error(payload.message || res.message || 'Textile weaving request failed');
  }
  return payload.data as T;
}

export type TextileYarnStock = {
  id: string;
  articleCount: string;
  brand: string;
  lotNumber: string;
  kgPerCarton: number | string;
  balanceCartons: number | string;
  balanceWeightKg: number | string;
  warehouseId?: string | null;
  warehouse?: { id: string; name: string; code: string } | null;
};

export type TextileGodownLedger = {
  id: string;
  entryDate: string;
  challanPrefix: string;
  challanNumber: string;
  partyName?: string | null;
  articleCount: string;
  brand: string;
  lotNumber: string;
  inCartons: number | string;
  inWeightKg: number | string;
  outCartons: number | string;
  outWeightKg: number | string;
  balanceCartons: number | string;
  balanceWeightKg: number | string;
  remarks?: string | null;
  supplier?: { id: string; name: string } | null;
};

export type TextileTwistingReceipt = {
  id: string;
  receiptDate: string;
  outputArticleCount: string;
  outputBrand: string;
  outputLotNumber?: string | null;
  cartons: number | string;
  conesCount: number;
  actualNetWeightKg: number | string;
  twistDirection: string;
  billNumber?: string | null;
  remarks?: string | null;
};

export type TextileTwistingBatch = {
  id: string;
  batchNumber: string;
  issueDate: string;
  machineCode?: string | null;
  vendorName?: string | null;
  inputArticleCount: string;
  inputBrand: string;
  inputLotNumber: string;
  issuedCartons: number | string;
  issuedStandardKg: number | string;
  totalReceivedNetKg: number | string;
  wastageKg: number | string;
  wastagePercent: number | string;
  status: string;
  receipts?: TextileTwistingReceipt[];
  vendor?: { id: string; name: string } | null;
  ledgerIssues?: unknown[];
};

export type TextileWeftIssue = {
  id: string;
  issueDate: string;
  challanNumber: string;
  articleCount: string;
  brand: string;
  lotNumber: string;
  twistDirection?: string | null;
  issuedCartons: number | string;
  issuedCones: number;
  issuedNetWeightKg: number | string;
  section?: string | null;
  remarks?: string | null;
  loom?: { id: string; loomNumber: string } | null;
};

export type TextileBeam = {
  id: string;
  beamCode: string;
  beamNumber?: string | null;
  weavingStatus?: string | null;
  status?: string;
  totalEnds?: number | null;
  yarnLengthM?: number | null;
  weightKg?: number | null;
  currentLoom?: { id: string; loomNumber: string } | null;
  warpingSets?: TextileWarpingSet[];
  loomAllocations?: TextileLoomBeamAllocation[];
};

export type TextileWarpingSet = {
  id: string;
  setNumber: string;
  beamNumber: string;
  machineCode?: string | null;
  warpingDate: string;
  endsCount: number;
  lengthMeters: number | string;
  reedWidth?: number | string | null;
  netBeamWeightKg: number | string;
  conesConsumedSKg: number | string;
  conesConsumedZKg: number | string;
  totalYarnConsumedKg: number | string;
  warpingWastageKg: number | string;
  status: string;
  beam?: TextileBeam | null;
  warpingWastagePercent?: number;
};

export type TextileLoom = {
  id: string;
  loomNumber: string;
  section?: string | null;
  status: string;
  isActive: boolean;
  allocations?: TextileLoomBeamAllocation[];
  currentBeams?: TextileBeam[];
};

export type TextileLoomBeamAllocation = {
  id: string;
  loomId: string;
  beamId: string;
  allocatedAt: string;
  weaverName?: string | null;
  wageRate?: number | string | null;
  bonusAmount?: number | string | null;
  totalBeamLengthMeters: number | string;
  remainingLengthMeters: number | string;
  status: string;
  loom?: TextileLoom | null;
  beam?: TextileBeam | null;
};

export type TextileDailyLoomProduction = {
  id: string;
  loomId: string;
  productionDate: string;
  allocationId?: string | null;
  shiftAMeters: number | string;
  shiftBMeters: number | string;
  dailyTotalMeters: number | string;
  cumulativeBeamMeters: number | string;
  gradeAMeters: number | string;
  gradeBMeters: number | string;
  gradeCMeters: number | string;
  remarks?: string | null;
  loom?: TextileLoom | null;
  allocation?: TextileLoomBeamAllocation | null;
};

export type TextileWagesReport = {
  from: string;
  to: string;
  weavers: Array<{
    weaverName: string;
    wageRate: number;
    totalMeters: number;
    gradeAMeters: number;
    gradeBMeters: number;
    gradeCMeters: number;
    meterWageAmount: number;
    bonusAmount: number;
    totalPayable: number;
    loomCount: number;
    allocationCount: number;
  }>;
  totals: { totalMeters: number; totalPayable: number };
};

export type TextileWeavingSummary = {
  godown: {
    stockLines: number;
    totalCartons: number;
    totalWeightKg: number;
    byArticleLot: Array<{
      id: string;
      articleCount: string;
      brand: string;
      lotNumber: string;
      balanceCartons: number;
      balanceWeightKg: number;
      kgPerCarton: number;
    }>;
  };
  twisting: {
    activeBatches: number;
    totalWastageKg: number;
    totalWastagePercent: number;
    batches: TextileTwistingBatch[];
  };
  warping: {
    availableBeams: number;
    warpingBeams: number;
  };
  weaving: {
    runningLooms: number;
    totalLooms: number;
    todayFabricProduction: {
      shiftA: number;
      shiftB: number;
      total: number;
      gradeA: number;
      gradeB: number;
      gradeC: number;
      entries: number;
    };
  };
};

function qs(params: Record<string, string | undefined | null>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && String(v).trim() !== '') sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const textileWeavingService = {
  summary: () => call<TextileWeavingSummary>('get', '/summary'),

  listStocks: (params: Record<string, string | undefined> = {}) =>
    call<TextileYarnStock[]>('get', `/godown/stocks${qs(params)}`),

  listLedger: (params: Record<string, string | undefined> = {}) =>
    call<TextileGodownLedger[]>('get', `/godown/ledger${qs(params)}`),

  postLedger: (body: Record<string, unknown>) =>
    call<{ ledger: TextileGodownLedger; stock: TextileYarnStock }>('post', '/godown/ledger', body),

  listBatches: (params: Record<string, string | undefined> = {}) =>
    call<TextileTwistingBatch[]>('get', `/twisting/batches${qs(params)}`),

  createBatch: (body: Record<string, unknown>) =>
    call<{ batch: TextileTwistingBatch }>('post', '/twisting/batches', body),

  addReceipt: (batchId: string, body: Record<string, unknown>) =>
    call<{ batch: TextileTwistingBatch; receipt: TextileTwistingReceipt }>(
      'post',
      `/twisting/batches/${batchId}/receipts`,
      body
    ),

  completeBatch: (batchId: string, body: Record<string, unknown> = {}) =>
    call<TextileTwistingBatch>('patch', `/twisting/batches/${batchId}/complete`, body),

  listWeftIssues: (params: Record<string, string | undefined> = {}) =>
    call<TextileWeftIssue[]>('get', `/weft-issues${qs(params)}`),

  createWeftIssue: (body: Record<string, unknown>) =>
    call<{ issue: TextileWeftIssue }>('post', '/weft-issues', body),

  listBeams: (params: Record<string, string | undefined> = {}) =>
    call<TextileBeam[]>('get', `/beams${qs(params)}`),

  createBeam: (body: Record<string, unknown>) =>
    call<TextileBeam>('post', '/beams', body),

  listWarpingSets: (params: Record<string, string | undefined> = {}) =>
    call<TextileWarpingSet[]>('get', `/warping/sets${qs(params)}`),

  createWarpingSet: (body: Record<string, unknown>) =>
    call<{ set: TextileWarpingSet; warpingWastagePercent?: number }>(
      'post',
      '/warping/sets',
      body
    ),

  listLooms: (params: Record<string, string | undefined> = {}) =>
    call<TextileLoom[]>('get', `/looms${qs(params)}`),

  createLoom: (body: Record<string, unknown>) =>
    call<TextileLoom>('post', '/looms', body),

  allocateBeam: (loomId: string, body: Record<string, unknown>) =>
    call<TextileLoomBeamAllocation>('post', `/looms/${loomId}/allocate-beam`, body),

  listDailyProduction: (params: Record<string, string | undefined> = {}) =>
    call<TextileDailyLoomProduction[]>('get', `/weaving/daily-production${qs(params)}`),

  postDailyProduction: (body: Record<string, unknown>) =>
    call<TextileDailyLoomProduction[]>('post', '/weaving/daily-production', body),

  wagesReport: (params: Record<string, string | undefined>) =>
    call<TextileWagesReport>('get', `/weaving/wages-report${qs(params)}`),
};

export async function updateManufacturingWorkflow(
  companyId: string,
  manufacturingWorkflow: 'STANDARD' | 'TEXTILE_WEAVING'
) {
  const res = await apiClient.patch(`/api/companies/${companyId}/manufacturing-workflow`, {
    manufacturingWorkflow,
  });
  const payload = (res.data ?? {}) as {
    data?: Record<string, unknown>;
    message?: string;
    success?: boolean;
  };
  if (!res.success) {
    throw new Error(payload.message || res.message || 'Failed to update manufacturing workflow');
  }
  return payload.data;
}

export function num(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function fmtQty(value: unknown, digits = 2) {
  const n = num(value);
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}
