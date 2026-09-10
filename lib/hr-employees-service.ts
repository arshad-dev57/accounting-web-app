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

export interface HREmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  office: string;
  officeId: string | null;
  shift: string;
  joiningDate: string;
  status: 'Active' | 'Inactive' | 'On Leave' | 'Terminated';
  employmentType: string;
  employeeType: string;
  salary: number;
  userId: string | null;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  officeId?: string | null;
  shift: string;
  joiningDate: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  employmentType?: string;
  employeeType?: string;
  salary?: number;
  password?: string;
}

function mapEmployee(e: any): HREmployee {
  const firstName = e.firstName || String(e.name || '').split(' ')[0] || '';
  const lastName =
    e.lastName || String(e.name || '').split(' ').slice(1).join(' ') || firstName;
  return {
    id: e.id,
    employeeCode: e.employeeCode || e.employeeId || '',
    firstName,
    lastName,
    name: e.name || `${firstName} ${lastName}`.trim(),
    email: e.email || '',
    phone: e.phone || '',
    designation: e.designation || '',
    department: e.department || '',
    office: e.office || '',
    officeId: e.officeId || null,
    shift: e.shift || '',
    joiningDate: e.joiningDate || '',
    status: e.status || 'Active',
    employmentType: e.employmentType || 'Full Time',
    employeeType: e.employeeType || 'Office Employee',
    salary: Number(e.salary || 0),
    userId: e.userId || null,
  };
}

export const hrEmployeesService = {
  list: async (): Promise<HREmployee[]> => {
    const body = unwrap(await apiClient.get('/api/hr/employees'));
    return listOf(body.data).map(mapEmployee);
  },

  get: async (id: string): Promise<HREmployee> => {
    const body = unwrap(await apiClient.get(`/api/hr/employees/${id}`));
    return mapEmployee(body.data);
  },

  create: async (input: CreateEmployeeInput) => {
    const body = unwrap(
      await apiClient.post('/api/hr/employees', {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        designation: input.designation,
        department: input.department,
        officeId: input.officeId || null,
        shift: input.shift,
        joiningDate: input.joiningDate,
        status: input.status,
        employmentType: input.employmentType || 'Full Time',
        employeeType: input.employeeType || 'Office Employee',
        salary: input.salary || 0,
        password: input.password || undefined,
      })
    );
    return {
      employee: mapEmployee(body.data),
      emailSent: body.emailSent === true,
      temporaryPassword: body.temporaryPassword as string | undefined,
      message: body.message as string | undefined,
    };
  },

  update: async (id: string, input: Partial<CreateEmployeeInput>): Promise<HREmployee> => {
    const body = unwrap(await apiClient.put(`/api/hr/employees/${id}`, input));
    return mapEmployee(body.data);
  },
};

export const hrDashboardService = {
  overview: async (date?: string) => {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    const body = unwrap(await apiClient.get(`/api/hr/dashboard${qs}`));
    return body.data || {};
  },

  stats: async (date?: string) => {
    const data = await hrDashboardService.overview(date);
    return {
      totalEmployees: Number(data.totalEmployees || 0),
      present: Number(data.present || 0),
      late: Number(data.late || 0),
      absent: Number(data.absent || 0),
      onLeave: Number(data.onLeave || 0),
      fieldStaff: Number(data.fieldStaff || 0),
      working: Number(data.working || 0),
      liveCount: Number(data.liveCount || 0),
      officeStaff: Number(data.officeStaff || 0),
      departments: Array.isArray(data.departments) ? data.departments : [],
      weekly: Array.isArray(data.weekly) ? data.weekly : [],
      attendance: listOf(data.attendance),
    };
  },

  attendance: async (date?: string) => {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    const body = unwrap(await apiClient.get(`/api/hr/attendance${qs}`));
    return listOf(body.data);
  },

  liveTracking: async () => {
    const body = unwrap(await apiClient.get('/api/hr/tracking'));
    const live = body.data?.live ?? body.live ?? [];
    return listOf(live);
  },
};
