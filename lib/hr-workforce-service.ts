import { apiClient } from '@/lib/api-client';
import { hrEmployeesService, type HREmployee } from '@/lib/hr-employees-service';

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
  return [];
}

export const hrWorkforceService = {
  employees: () => hrEmployeesService.list(),

  leaves: async () => listOf(unwrap(await apiClient.get('/api/hr/leaves')).data),
  createLeave: async (input: Record<string, unknown>) =>
    unwrap(await apiClient.post('/api/hr/leaves', input)).data,
  updateLeave: async (id: string, status: string) =>
    unwrap(await apiClient.put(`/api/hr/leaves/${id}`, { status })).data,

  overtime: async () => listOf(unwrap(await apiClient.get('/api/hr/overtime')).data),
  createOvertime: async (input: Record<string, unknown>) =>
    unwrap(await apiClient.post('/api/hr/overtime', input)).data,
  updateOvertime: async (id: string, status: string) =>
    unwrap(await apiClient.put(`/api/hr/overtime/${id}`, { status })).data,

  tasks: async () => listOf(unwrap(await apiClient.get('/api/hr/tasks')).data),
  createTask: async (input: Record<string, unknown>) =>
    unwrap(await apiClient.post('/api/hr/tasks', input)).data,
  updateTask: async (id: string, input: Record<string, unknown>) =>
    unwrap(await apiClient.put(`/api/hr/tasks/${id}`, input)).data,

  reviews: async () => listOf(unwrap(await apiClient.get('/api/hr/performance')).data),
  createReview: async (input: Record<string, unknown>) =>
    unwrap(await apiClient.post('/api/hr/performance', input)).data,
  updateReview: async (id: string, input: Record<string, unknown>) =>
    unwrap(await apiClient.put(`/api/hr/performance/${id}`, input)).data,

  payroll: async (period?: string) => {
    const qs = period ? `?period=${encodeURIComponent(period)}` : '';
    const body = unwrap(await apiClient.get(`/api/hr/payroll${qs}`));
    return {
      items: listOf(body.data),
      period: body.period as string,
      periodLabel: body.periodLabel as string,
      summary: body.summary || {},
    };
  },
  payrollReport: async (period?: string) => {
    const qs = period ? `?period=${encodeURIComponent(period)}` : '';
    const body = unwrap(await apiClient.get(`/api/hr/payroll/report${qs}`));
    return body;
  },
  getPayslip: async (id: string) =>
    unwrap(await apiClient.get(`/api/hr/payroll/${id}`)).data,
  generatePayroll: async (period?: string) => {
    const body = unwrap(await apiClient.post('/api/hr/payroll/generate', { period }));
    return {
      items: listOf(body.data),
      period: body.period as string,
      periodLabel: body.periodLabel as string,
      summary: body.summary || {},
    };
  },
  updatePayroll: async (id: string, input: Record<string, unknown>) =>
    unwrap(await apiClient.put(`/api/hr/payroll/${id}`, input)).data,
  bulkPayrollStatus: async (period: string, status: string) => {
    const body = unwrap(await apiClient.post('/api/hr/payroll/bulk-status', { period, status }));
    return {
      items: listOf(body.data),
      period: body.period as string,
      summary: body.summary || {},
    };
  },

  orgChart: async () => unwrap(await apiClient.get('/api/hr/org-chart')).data,
  notifications: async () => listOf(unwrap(await apiClient.get('/api/hr/notifications')).data),
  settings: async () => unwrap(await apiClient.get('/api/hr/settings')).data || {},
  saveSettings: async (payload: Record<string, unknown>) =>
    unwrap(await apiClient.put('/api/hr/settings', payload)).data,
};

export type { HREmployee };
