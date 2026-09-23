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
  getPayrollRun: async (period?: string) => {
    const qs = period ? `?period=${encodeURIComponent(period)}` : '';
    const body = unwrap(await apiClient.get(`/api/hr/payroll/run${qs}`));
    return body.data || {};
  },
  savePayrollRun: async (input: Record<string, unknown>) =>
    unwrap(await apiClient.put('/api/hr/payroll/run', input)).data,
  getPayslip: async (id: string) =>
    unwrap(await apiClient.get(`/api/hr/payroll/${id}`)).data,
  generatePayroll: async (period?: string, mode?: 'all' | 'sales' | 'office') => {
    const body = unwrap(
      await apiClient.post('/api/hr/payroll/generate', { period, ...(mode ? { mode } : {}) })
    );
    return {
      items: listOf(body.data),
      period: body.period as string,
      periodLabel: body.periodLabel as string,
      summary: body.summary || {},
    };
  },
  updatePayroll: async (id: string, input: Record<string, unknown>) =>
    unwrap(await apiClient.put(`/api/hr/payroll/${id}`, input)).data,
  createPayrollItem: async (input: {
    employeeId: string;
    period: string;
    blank?: boolean;
    basic?: number;
    notes?: string;
  }) => unwrap(await apiClient.post('/api/hr/payroll/item', input)).data,
  bulkPayrollStatus: async (period: string, status: string, payDate?: string, mode?: 'all' | 'office' | 'sales') => {
    const body = unwrap(
      await apiClient.post('/api/hr/payroll/bulk-status', {
        period,
        status,
        ...(payDate ? { payDate } : {}),
        ...(mode && mode !== 'all' ? { mode } : {}),
      })
    );
    return {
      items: listOf(body.data),
      period: body.period as string,
      summary: body.summary || {},
      journal: body.journal,
    };
  },

  listPayPeriods: async () => listOf(unwrap(await apiClient.get('/api/hr/payroll/periods')).data),
  ensurePayPeriod: async (periodKey: string, payDate?: string) =>
    unwrap(await apiClient.post('/api/hr/payroll/periods/ensure', { periodKey, payDate })).data,
  getPayPeriod: async (id: string) => unwrap(await apiClient.get(`/api/hr/payroll/periods/${id}`)).data,
  validatePayPeriod: async (id: string, mode?: 'all' | 'office' | 'sales') =>
    unwrap(await apiClient.post(`/api/hr/payroll/periods/${id}/validate`, { mode: mode || 'office' })),
  getPayPeriodValidation: async (id: string, mode?: 'all' | 'office' | 'sales') => {
    const qs = mode ? `?mode=${mode}` : '';
    return unwrap(await apiClient.get(`/api/hr/payroll/periods/${id}/validation${qs}`));
  },
  calculatePayPeriod: async (id: string, mode?: 'all' | 'office' | 'sales', force?: boolean) => {
    const body = unwrap(
      await apiClient.post(`/api/hr/payroll/periods/${id}/calculate`, {
        mode: mode || 'office',
        ...(force ? { force: true } : {}),
      })
    );
    return {
      items: listOf(body.data),
      period: body.period as string,
      periodLabel: body.periodLabel as string,
      payPeriod: body.payPeriod,
      run: body.run,
      validation: body.validation,
      summary: body.summary || {},
    };
  },
  getPayrollReview: async (id: string) => unwrap(await apiClient.get(`/api/hr/payroll/periods/${id}/review`)),
  getPayRegister: async (id: string) => unwrap(await apiClient.get(`/api/hr/payroll/periods/${id}/register`)),
  transitionPayPeriod: async (id: string, status: string) =>
    unwrap(await apiClient.patch(`/api/hr/payroll/periods/${id}/status`, { status })).data,

  orgChart: async () => unwrap(await apiClient.get('/api/hr/org-chart')).data,
  notifications: async () => listOf(unwrap(await apiClient.get('/api/hr/notifications')).data),
  settings: async () => unwrap(await apiClient.get('/api/hr/settings')).data || {},
  saveSettings: async (payload: Record<string, unknown>) =>
    unwrap(await apiClient.put('/api/hr/settings', payload)).data,
};

export type { HREmployee };
