// lib/hr-shifts-service.ts
// Client for the Shift Type documents held by the HR backend
// (/api/hr/docs/shift-type, Prisma model HrShift). The field list, the status
// vocabulary and the validation all come from the backend descriptor, so this
// file only adapts the response to what the employee screens consume.

import { apiClient } from '@/lib/api-client';

export type HRShiftStatus = 'Active' | 'Inactive';

export interface HRShift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  graceMinutes: number;
  workingDays: string[];
  isNight: boolean;
  isFlexible: boolean;
  enableAutoAttendance: boolean;
  firstCheckinThresholdMinutes: number;
  lastCheckoutThresholdMinutes: number;
  employees: number;
  status: HRShiftStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShiftInput {
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  graceMinutes?: number;
  workingDays?: string[];
  isNight?: boolean;
  isFlexible?: boolean;
  enableAutoAttendance?: boolean;
  firstCheckinThresholdMinutes?: number;
  lastCheckoutThresholdMinutes?: number;
  status?: HRShiftStatus;
}

const RESOURCE = 'shift-type';

function unwrap(res: { success: boolean; data: any; message: string; statusCode: number }) {
  const body = res.data ?? {};
  if (!res.success || body.success === false) {
    throw new Error(body.message || res.message || `Shift request failed (${res.statusCode})`);
  }
  return body;
}

function toShift(row: any): HRShift {
  return {
    id: String(row.id),
    name: String(row.name || ''),
    startTime: String(row.startTime || ''),
    endTime: String(row.endTime || ''),
    breakMinutes: Number(row.breakMinutes || 0),
    graceMinutes: Number(row.graceMinutes || 0),
    workingDays: Array.isArray(row.workingDays) ? row.workingDays.map(String) : [],
    isNight: Boolean(row.isNight),
    isFlexible: Boolean(row.isFlexible),
    enableAutoAttendance: Boolean(row.enableAutoAttendance),
    firstCheckinThresholdMinutes: Number(row.firstCheckinThresholdMinutes || 0),
    lastCheckoutThresholdMinutes: Number(row.lastCheckoutThresholdMinutes || 0),
    employees: Number(row.employeeCount || 0),
    status: row.status === 'Inactive' ? 'Inactive' : 'Active',
    createdAt: String(row.createdAt || ''),
    updatedAt: String(row.updatedAt || '')
  };
}

export const hrShiftsService = {
  list: async (): Promise<HRShift[]> => {
    const body = unwrap(await apiClient.get(`/api/hr/docs/${RESOURCE}?limit=500&sort=name&dir=asc`));
    return (body.data?.rows || []).map(toShift);
  },

  get: async (id: string): Promise<HRShift> => {
    const body = unwrap(await apiClient.get(`/api/hr/docs/${RESOURCE}/${id}`));
    return toShift(body.data?.row);
  },

  create: async (input: CreateShiftInput): Promise<HRShift> => {
    const body = unwrap(await apiClient.post(`/api/hr/docs/${RESOURCE}`, input));
    return toShift(body.data);
  },

  update: async (id: string, input: Partial<CreateShiftInput>): Promise<HRShift> => {
    const body = unwrap(await apiClient.put(`/api/hr/docs/${RESOURCE}/${id}`, input));
    return toShift(body.data);
  },

  delete: async (id: string): Promise<void> => {
    unwrap(await apiClient.delete(`/api/hr/docs/${RESOURCE}/${id}`));
  }
};
