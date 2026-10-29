// lib/hr-holidays-service.ts
// Client for the Holiday List documents held by the HR backend
// (/api/hr/docs/holiday-list, Prisma model HrHoliday). Each row is one dated
// holiday of a list, which is the shape the leave balance and calendar screens
// need; the type vocabulary comes from the backend descriptor.

import { apiClient } from '@/lib/api-client';

export type HRHolidayType = 'Public' | 'Private' | 'Optional' | 'Weekly Off';

export interface HRHoliday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  day: string; // derived weekday name
  type: HRHolidayType;
  officeId: string;
  office: string;
  optional: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHolidayInput {
  name: string;
  date: string;
  type?: HRHolidayType;
  officeId?: string;
  optional?: boolean;
}

const RESOURCE = 'holiday-list';

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function unwrap(res: { success: boolean; data: any; message: string; statusCode: number }) {
  const body = res.data ?? {};
  if (!res.success || body.success === false) {
    throw new Error(body.message || res.message || `Holiday request failed (${res.statusCode})`);
  }
  return body;
}

function toHoliday(row: any): HRHoliday {
  const date = String(row.date || '').slice(0, 10);
  const parsed = new Date(`${date}T00:00:00`);
  return {
    id: String(row.id),
    name: String(row.name || ''),
    date,
    day: Number.isNaN(parsed.getTime()) ? '' : WEEKDAY_NAMES[parsed.getDay()],
    type: (row.type || 'Public') as HRHolidayType,
    officeId: String(row.officeId || ''),
    office: String(row.officeIdLabel || ''),
    optional: Boolean(row.optional),
    createdAt: String(row.createdAt || ''),
    updatedAt: String(row.updatedAt || '')
  };
}

export const hrHolidaysService = {
  list: async (): Promise<HRHoliday[]> => {
    const body = unwrap(await apiClient.get(`/api/hr/docs/${RESOURCE}?limit=500&sort=date&dir=asc`));
    return (body.data?.rows || []).map(toHoliday);
  },

  get: async (id: string): Promise<HRHoliday> => {
    const body = unwrap(await apiClient.get(`/api/hr/docs/${RESOURCE}/${id}`));
    return toHoliday(body.data?.row);
  },

  create: async (input: CreateHolidayInput): Promise<HRHoliday> => {
    const body = unwrap(await apiClient.post(`/api/hr/docs/${RESOURCE}`, input));
    return toHoliday(body.data);
  },

  update: async (id: string, input: Partial<CreateHolidayInput>): Promise<HRHoliday> => {
    const body = unwrap(await apiClient.put(`/api/hr/docs/${RESOURCE}/${id}`, input));
    return toHoliday(body.data);
  },

  delete: async (id: string): Promise<void> => {
    unwrap(await apiClient.delete(`/api/hr/docs/${RESOURCE}/${id}`));
  }
};
