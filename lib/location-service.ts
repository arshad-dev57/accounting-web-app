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
export const LOCATIONS_CACHE_KEY = 'cached_locations';
export const LOCATIONS_CACHE_EVENT = 'locations-cache-changed';

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

export function getCachedLocations(): Location[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCATIONS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeLocation).filter((l): l is Location => !!l);
  } catch {
    return [];
  }
}

export function setCachedLocations(list: Location[]) {
  if (typeof window === 'undefined') return;
  try {
    const clean = list.map(normalizeLocation).filter((l): l is Location => !!l);
    localStorage.setItem(LOCATIONS_CACHE_KEY, JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent(LOCATIONS_CACHE_EVENT));
  } catch {
    /* ignore quota */
  }
}

export function upsertCachedLocation(loc: Location | null | undefined): Location[] {
  const next = normalizeLocation(loc);
  if (!next) return getCachedLocations();
  const list = getCachedLocations();
  const idx = list.findIndex((l) => l.id === next.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...next };
  else list.push(next);
  if (next.isDefault) {
    list.forEach((l) => {
      if (l.id !== next.id) l.isDefault = false;
    });
  }
  setCachedLocations(list);
  return list;
}

export function removeCachedLocation(id: string): Location[] {
  const list = getCachedLocations().filter((l) => l.id !== id);
  setCachedLocations(list);
  return list;
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
    const list = unwrapList(response.data ?? response);
    setCachedLocations(list);
    return list;
  },

  listCached: async (): Promise<Location[]> => {
    const cached = getCachedLocations();
    if (cached.length) return cached;
    return locationService.list();
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
    const created = normalizeLocation(response.data?.data || response.data);
    if (created) upsertCachedLocation(created);
    return created || (response.data?.data || response.data);
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
    const updated = normalizeLocation(response.data?.data || response.data) || {
      ...getCachedLocations().find((l) => l.id === id),
      ...body,
      id,
    } as Location;
    upsertCachedLocation(updated);
    return updated;
  },

  remove: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/api/warehouse/locations/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete location');
    }
    removeCachedLocation(id);
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
