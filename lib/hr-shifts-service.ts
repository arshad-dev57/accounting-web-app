// lib/hr-shifts-service.ts
// Client-side service for the HR Shifts module.
// Talks to the local Next.js API (same-origin, cookie auth).

export type HRShiftStatus = 'Active' | 'Scheduled' | 'Draft' | 'Inactive';

export interface HRShift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
  employees: number;
  status: HRShiftStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShiftInput {
  name: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
  status: HRShiftStatus;
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

export const hrShiftsService = {
  list: async (): Promise<HRShift[]> => {
    const res = await request<{ data: HRShift[] }>('/api/hr/shifts');
    return res.data || [];
  },

  get: async (id: string): Promise<HRShift> => {
    const res = await request<{ data: HRShift }>(`/api/hr/shifts/${id}`);
    return res.data;
  },

  create: async (input: CreateShiftInput): Promise<HRShift> => {
    const res = await request<{ data: HRShift }>('/api/hr/shifts', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  update: async (
    id: string,
    input: Partial<CreateShiftInput>
  ): Promise<HRShift> => {
    const res = await request<{ data: HRShift }>(`/api/hr/shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await request(`/api/hr/shifts/${id}`, { method: 'DELETE' });
  },
};