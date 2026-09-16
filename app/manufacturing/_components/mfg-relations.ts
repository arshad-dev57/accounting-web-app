import { locationService } from '@/lib/location-service';
import {
  bomService,
  machineService,
  productionOrderService,
  subcontractVendorService,
  workCenterService,
} from '@/lib/manufacturing-service';

export type MfgRelationKind =
  | 'workCenter'
  | 'machine'
  | 'productionOrder'
  | 'warehouse'
  | 'vendor'
  | 'bom';

export type PickedRelation = {
  id: string;
  name: string;
  code?: string;
  extra?: string;
};

export function relationKindFromField(name: string): MfgRelationKind | null {
  if (name === 'workCenterId') return 'workCenter';
  if (name === 'machineId') return 'machine';
  if (name === 'productionOrderId') return 'productionOrder';
  if (name === 'vendorId' || name === 'subcontractVendorId') return 'vendor';
  if (name === 'bomId') return 'bom';
  if (name === 'warehouseId' || name.endsWith('WarehouseId')) return 'warehouse';
  return null;
}

export function relationMeta(kind: MfgRelationKind) {
  switch (kind) {
    case 'workCenter':
      return {
        title: 'Select work center',
        titlePlural: 'Select work centers',
        noun: 'work center',
        nounPlural: 'work centers',
        searchPlaceholder: 'Search work center name or code…',
        empty: 'No work centers found. Add them under Master Data first.',
        columns: ['Name', 'Code', 'Department'],
      };
    case 'machine':
      return {
        title: 'Select machine',
        titlePlural: 'Select machines',
        noun: 'machine',
        nounPlural: 'machines',
        searchPlaceholder: 'Search machine name or code…',
        empty: 'No machines found. Add them under Master Data first.',
        columns: ['Machine', 'Code', 'Status'],
      };
    case 'productionOrder':
      return {
        title: 'Select production order',
        titlePlural: 'Select production orders',
        noun: 'production order',
        nounPlural: 'production orders',
        searchPlaceholder: 'Search order number or product…',
        empty: 'No production orders found.',
        columns: ['Order #', 'Product', 'Status'],
      };
    case 'warehouse':
      return {
        title: 'Select warehouse',
        titlePlural: 'Select warehouses',
        noun: 'warehouse',
        nounPlural: 'warehouses',
        searchPlaceholder: 'Search warehouse name or code…',
        empty: 'No warehouses found. Add them in Warehouse → Locations.',
        columns: ['Warehouse', 'Code', 'Type'],
      };
    case 'vendor':
      return {
        title: 'Select vendor',
        titlePlural: 'Select vendors',
        noun: 'vendor',
        nounPlural: 'vendors',
        searchPlaceholder: 'Search vendor name, email or phone…',
        empty: 'No subcontract vendors found.',
        columns: ['Vendor', 'Email', 'Phone'],
      };
    case 'bom':
      return {
        title: 'Select BOM',
        titlePlural: 'Select BOMs',
        noun: 'BOM',
        nounPlural: 'BOMs',
        searchPlaceholder: 'Search BOM number or product…',
        empty: 'No BOMs found. Create a BOM for this product first.',
        columns: ['BOM', 'Product', 'Version'],
      };
  }
}

function rowId(row: any) {
  return String(row?.id || row?._id || '');
}

export function rowToPicked(kind: MfgRelationKind, row: any): PickedRelation | null {
  const id = rowId(row);
  if (!id) return null;
  switch (kind) {
    case 'workCenter':
      return {
        id,
        name: row.name || row.workCenterName || id,
        code: row.workCenterCode || row.code,
        extra: row.department || row.factory || '',
      };
    case 'machine':
      return {
        id,
        name: row.machineName || row.name || id,
        code: row.machineCode || row.code,
        extra: row.status || '',
      };
    case 'productionOrder':
      return {
        id,
        name: row.orderNumber || row.productionOrderNumber || id,
        code: row.productName || row.product?.name,
        extra: row.status || '',
      };
    case 'warehouse':
      return {
        id,
        name: row.name || id,
        code: row.code,
        extra: row.type || '',
      };
    case 'vendor':
      return {
        id,
        name: row.name || row.vendorName || id,
        code: row.email,
        extra: row.phone || '',
      };
    case 'bom':
      return {
        id,
        name: row.bomNumber || row.name || id,
        code: row.productName || row.product?.name,
        extra: row.version || row.status || '',
      };
  }
}

function paginate<T>(rows: T[], page: number, limit: number) {
  const start = (page - 1) * limit;
  return {
    data: rows.slice(start, start + limit),
    pagination: { total: rows.length, page, limit },
  };
}

export async function listRelations(
  kind: MfgRelationKind,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    locationId?: string;
    productId?: string;
  } = {}
): Promise<{ data: any[]; pagination: any }> {
  const page = params.page || 1;
  const limit = params.limit || 15;
  const search = params.search || undefined;
  const locationId = params.locationId || undefined;

  if (kind === 'warehouse') {
    const all = await locationService.listCached();
    const q = (search || '').trim().toLowerCase();
    const filtered = q
      ? all.filter(
          (loc) =>
            loc.name.toLowerCase().includes(q) ||
            String(loc.code || '').toLowerCase().includes(q) ||
            String(loc.type || '').toLowerCase().includes(q)
        )
      : all;
    return paginate(filtered, page, limit);
  }

  const query: Record<string, any> = { page, limit, search, locationId };
  if (kind === 'bom' && params.productId) query.productId = params.productId;

  const service =
    kind === 'workCenter'
      ? workCenterService
      : kind === 'machine'
        ? machineService
        : kind === 'productionOrder'
          ? productionOrderService
          : kind === 'vendor'
            ? subcontractVendorService
            : bomService;

  return service.list(query);
}
