import { apiClient } from '@/lib/api-client';

function unwrap(res: { success: boolean; data: any; message: string }) {
  const body = res.data ?? {};
  if (!res.success || body.success === false) {
    throw new Error(body.message || res.message || 'HR request failed');
  }
  return body;
}

function listOf(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.live)) return value.live;
  return [];
}

export interface HROffice {
  id: string;
  name: string;
  code: string;
  address: string;
  latitude: number;
  longitude: number;
  geofenceRadius: number;
  status: 'Active' | 'Inactive';
  employees: number;
}

export interface CreateOfficeInput {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  geofenceRadius: number;
  status: 'Active' | 'Inactive';
}

function mapOffice(o: any): HROffice {
  return {
    id: o.id,
    name: o.name || '',
    code: o.code || '',
    address: o.address || '',
    latitude: Number(o.latitude || 0),
    longitude: Number(o.longitude || 0),
    geofenceRadius: Number(o.radiusMeters ?? o.radius ?? o.geofenceRadius ?? 150),
    status: o.status === 'Inactive' || o.isActive === false ? 'Inactive' : 'Active',
    employees: Number(o.employeeCount ?? o.employees ?? 0),
  };
}

export const hrOfficesService = {
  list: async (): Promise<HROffice[]> => {
    const body = unwrap(await apiClient.get('/api/hr/offices'));
    return listOf(body.data).map(mapOffice);
  },

  create: async (input: CreateOfficeInput): Promise<HROffice> => {
    const body = unwrap(
      await apiClient.post('/api/hr/offices', {
        name: input.name,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        radius: input.geofenceRadius,
        isActive: input.status !== 'Inactive',
      })
    );
    return mapOffice(body.data);
  },

  update: async (id: string, input: Partial<CreateOfficeInput>): Promise<HROffice> => {
    const body = unwrap(
      await apiClient.put(`/api/hr/offices/${id}`, {
        name: input.name,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        radius: input.geofenceRadius,
        isActive: input.status !== 'Inactive',
        status: input.status,
      })
    );
    return mapOffice(body.data);
  },
};
