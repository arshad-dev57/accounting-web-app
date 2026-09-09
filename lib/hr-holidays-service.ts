// lib/hr-holidays-service.ts
// Client-side service for the HR Holidays module.
// Talks to the local Next.js API (same-origin, cookie auth).

export type HRHolidayType = 'National' | 'Religious' | 'Company';

export interface HRHoliday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  day: string; // derived weekday name
  type: HRHolidayType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHolidayInput {
  name: string;
  date: string;
  type: HRHolidayType;
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

export const hrHolidaysService = {
  list: async (): Promise<HRHoliday[]> => {
    const res = await request<{ data: HRHoliday[] }>('/api/hr/holidays');
    return res.data || [];
  },

  get: async (id: string): Promise<HRHoliday> => {
    const res = await request<{ data: HRHoliday }>(`/api/hr/holidays/${id}`);
    return res.data;
  },

  create: async (input: CreateHolidayInput): Promise<HRHoliday> => {
    const res = await request<{ data: HRHoliday }>('/api/hr/holidays', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  update: async (
    id: string,
    input: Partial<CreateHolidayInput>
  ): Promise<HRHoliday> => {
    const res = await request<{ data: HRHoliday }>(`/api/hr/holidays/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await request(`/api/hr/holidays/${id}`, { method: 'DELETE' });
  },
};