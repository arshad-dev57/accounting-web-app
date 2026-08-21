import { apiClient } from '@/lib/api-client';

export interface Location {
  id: string;
  companyId?: string;
  name: string;
  code: string;
  type: string;
  address?: string | null;
  phone?: string | null;
  isDefault: boolean;
  isActive: boolean;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductLocationStock {
  locationId: string;
  locationName: string;
  locationCode: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
}

export const LOCATION_STORAGE_KEY = 'selected_location_id';

/** Sentinel for company-wide / all warehouses (accounting dropdown). */
export const ALL_LOCATIONS_VALUE = 'all';

export function isAllLocationsId(id: string | null | undefined): boolean {
  const s = String(id || '').trim();
  return !s || s === ALL_LOCATIONS_VALUE || s === '__all__';
}

/** Query param value: empty string when All is selected. */
export function effectiveLocationId(id: string | null | undefined): string {
  return isAllLocationsId(id) ? '' : String(id).trim();
}

export function appendLocationQuery(
  qs: URLSearchParams,
  locationId: string | null | undefined
) {
  const id = effectiveLocationId(locationId);
  if (id) qs.set('locationId', id);
  return qs;
}

export function getStoredLocationId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LOCATION_STORAGE_KEY);
}

export function setStoredLocationId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (id) localStorage.setItem(LOCATION_STORAGE_KEY, id);
  else localStorage.removeItem(LOCATION_STORAGE_KEY);
}

function normalizeLocation(raw: any): Location | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || raw._id || '').trim();
  if (!id) return null;
  return {
    id,
    companyId: raw.companyId,
    name: String(raw.name || 'Location'),
    code: String(raw.code || ''),
    type: String(raw.type || 'Shop'),
    address: raw.address ?? null,
    phone: raw.phone ?? null,
    isDefault: !!raw.isDefault,
    isActive: raw.isActive !== false,
    notes: raw.notes ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function unwrapList(payload: any): Location[] {
  const raw = payload?.data ?? payload;
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : [];
  return list
    .map(normalizeLocation)
    .filter((l): l is Location => !!l);
}

export const locationService = {
  list: async (): Promise<Location[]> => {
    const response = await apiClient.get('/api/warehouse/locations');
    if (!response.success) {
      throw new Error(response.message || 'Failed to load locations');
    }
    return unwrapList(response.data ?? response);
  },

  create: async (body: {
    name: string;
    code: string;
    type?: string;
    address?: string;
    phone?: string;
    notes?: string;
    isDefault?: boolean;
  }): Promise<Location> => {
    const response = await apiClient.post('/api/warehouse/locations', body);
    if (!response.success) {
      throw new Error(response.message || 'Failed to create location');
    }
    return response.data?.data || response.data;
  },

  update: async (
    id: string,
    body: Partial<{
      name: string;
      code: string;
      type: string;
      address: string;
      phone: string;
      notes: string;
      isDefault: boolean;
      isActive: boolean;
    }>
  ): Promise<Location> => {
    const response = await apiClient.put(`/api/warehouse/locations/${id}`, body);
    if (!response.success) {
      throw new Error(response.message || 'Failed to update location');
    }
    return response.data?.data || response.data;
  },

  remove: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/api/warehouse/locations/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete location');
    }
  },

  getStock: async (locationId: string) => {
    const response = await apiClient.get(
      `/api/warehouse/locations/${locationId}/stock`
    );
    if (!response.success) {
      throw new Error(response.message || 'Failed to load location stock');
    }
    return response.data?.data || response.data;
  },

  getProductStocks: async (productId: string): Promise<ProductLocationStock[]> => {
    const response = await apiClient.get(
      `/api/warehouse/locations/product/${productId}/stocks`
    );
    if (!response.success) {
      throw new Error(response.message || 'Failed to load product stocks');
    }
    const raw = response.data?.data || response.data;
    return Array.isArray(raw) ? raw : raw?.stocks || [];
  },

  transfer: async (body: {
    productId: string;
    fromLocationId: string;
    toLocationId: string;
    quantity: number;
    notes?: string;
  }) => {
    const response = await apiClient.post(
      '/api/warehouse/locations/transfer',
      body
    );
    if (!response.success) {
      throw new Error(response.message || 'Failed to transfer stock');
    }
    return response.data?.data || response.data;
  },

  migrate: async () => {
    const response = await apiClient.post('/api/warehouse/locations/migrate', {});
    if (!response.success) {
      throw new Error(response.message || 'Failed to migrate stock');
    }
    return response.data?.data || response.data;
  },
};
