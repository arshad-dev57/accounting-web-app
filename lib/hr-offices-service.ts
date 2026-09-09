// lib/hr-offices-service.ts
// Client-side service for the HR Offices module.
// Talks to the local Next.js API (same-origin, cookie auth).

export interface HROffice {
  id: string;
  name: string;
  code: string;
  address: string;
  geofenceRadius: number;
  status: 'Active' | 'Inactive';
  employees: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOfficeInput {
  name: string;
  code?: string;
  address: string;
  geofenceRadius: number;
  status: 'Active' | 'Inactive';
}

async function request<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.success === false) {
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
  return body as T;
}

export const hrOfficesService = {
  list: async (): Promise<HROffice[]> => {
    const res = await request<{ data: HROffice[] }>('/api/hr/offices');
    return res.data || [];
  },

  get: async (id: string): Promise<HROffice> => {
    const res = await request<{ data: HROffice }>(`/api/hr/offices/${id}`);
    return res.data;
  },

  create: async (input: CreateOfficeInput): Promise<HROffice> => {
    const res = await request<{ data: HROffice }>('/api/hr/offices', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  update: async (
    id: string,
    input: Partial<CreateOfficeInput>
  ): Promise<HROffice> => {
    const res = await request<{ data: HROffice }>(`/api/hr/offices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await request(`/api/hr/offices/${id}`, { method: 'DELETE' });
  },
};
