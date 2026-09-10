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
  return [];
}

async function getList(path: string) {
  return listOf(unwrap(await apiClient.get(path)).data);
}

async function postData(path: string, input: Record<string, unknown>) {
  return unwrap(await apiClient.post(path, input)).data;
}

async function putData(path: string, input: Record<string, unknown>) {
  return unwrap(await apiClient.put(path, input)).data;
}

export const hrHcmService = {
  analytics: async () => unwrap(await apiClient.get('/api/hr/hcm/analytics')).data,
  ess: async () => unwrap(await apiClient.get('/api/hr/hcm/ess')).data,
  team: async () => unwrap(await apiClient.get('/api/hr/hcm/team')).data,
  audit: () => getList('/api/hr/hcm/audit'),

  departments: () => getList('/api/hr/org/departments'),
  saveDepartment: (input: Record<string, unknown>) => postData('/api/hr/org/departments', input),
  designations: () => getList('/api/hr/org/designations'),
  saveDesignation: (input: Record<string, unknown>) => postData('/api/hr/org/designations', input),

  shifts: () => getList('/api/hr/shift-plans'),
  saveShift: (input: Record<string, unknown>) => postData('/api/hr/shift-plans', input),
  holidays: (year?: number) => getList(`/api/hr/holiday-calendar${year ? `?year=${year}` : ''}`),
  saveHoliday: (input: Record<string, unknown>) => postData('/api/hr/holiday-calendar', input),

  leaveTypes: () => getList('/api/hr/leave-types'),
  saveLeaveType: (input: Record<string, unknown>) => postData('/api/hr/leave-types', input),
  leaveBalances: (employeeId?: string) =>
    getList(`/api/hr/leave-balances${employeeId ? `?employeeId=${employeeId}` : ''}`),

  attendanceSummary: async (date?: string) => {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    return unwrap(await apiClient.get(`/api/hr/attendance/summary${qs}`));
  },
  corrections: () => getList('/api/hr/attendance/corrections'),
  createCorrection: (input: Record<string, unknown>) => postData('/api/hr/attendance/corrections', input),
  updateCorrection: (id: string, status: string) => putData(`/api/hr/attendance/corrections/${id}`, { status }),

  roster: (from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const q = qs.toString();
    return getList(`/api/hr/roster${q ? `?${q}` : ''}`);
  },
  saveRoster: (input: Record<string, unknown>) => postData('/api/hr/roster', input),

  loans: () => getList('/api/hr/loans'),
  saveLoan: (input: Record<string, unknown>) => postData('/api/hr/loans', input),
  updateLoan: (id: string, status: string) => putData(`/api/hr/loans/${id}`, { status }),
  bonuses: () => getList('/api/hr/bonuses'),
  saveBonus: (input: Record<string, unknown>) => postData('/api/hr/bonuses', input),
  updateBonus: (id: string, status: string) => putData(`/api/hr/bonuses/${id}`, { status }),

  documents: (employeeId?: string) =>
    getList(`/api/hr/documents${employeeId ? `?employeeId=${employeeId}` : ''}`),
  saveDocument: (input: Record<string, unknown>) => postData('/api/hr/documents', input),

  lifecycle: (employeeId?: string) =>
    getList(`/api/hr/lifecycle${employeeId ? `?employeeId=${employeeId}` : ''}`),
  saveLifecycle: (input: Record<string, unknown>) => postData('/api/hr/lifecycle', input),

  dossier: async (id: string) => unwrap(await apiClient.get(`/api/hr/employees/${id}/dossier`)).data,
  updateProfile: (id: string, input: Record<string, unknown>) =>
    putData(`/api/hr/employees/${id}/profile`, input),

  approvals: (status?: string) => getList(`/api/hr/approvals${status ? `?status=${status}` : ''}`),
  updateApproval: (id: string, status: string) => putData(`/api/hr/approvals/${id}`, { status }),

  goals: (employeeId?: string) => getList(`/api/hr/goals${employeeId ? `?employeeId=${employeeId}` : ''}`),
  saveGoal: (input: Record<string, unknown>) => postData('/api/hr/goals', input),
  feedback: (employeeId?: string) => getList(`/api/hr/feedback${employeeId ? `?employeeId=${employeeId}` : ''}`),
  saveFeedback: (input: Record<string, unknown>) => postData('/api/hr/feedback', input),
};
