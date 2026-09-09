// lib/hr-employees-service.ts
// Client-side service for the HR Employees module.
// Talks to the local Next.js API (same-origin, cookie auth) — NOT the
// external backend, since employees are separate from ERP users.

export interface HREmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  office: string;
  shift: string;
  joiningDate: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  linkedUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  office: string;
  shift: string;
  joiningDate: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  linkedUserId?: string | null;
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

export const hrEmployeesService = {
  list: async (params?: {
    q?: string;
    status?: string;
    department?: string;
  }): Promise<HREmployee[]> => {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.status) query.set('status', params.status);
    if (params?.department) query.set('department', params.department);
    const qs = query.toString();
    const res = await request<{ data: HREmployee[] }>(
      `/api/hr/employees${qs ? `?${qs}` : ''}`
    );
    return res.data || [];
  },

  get: async (id: string): Promise<HREmployee> => {
    const res = await request<{ data: HREmployee }>(`/api/hr/employees/${id}`);
    return res.data;
  },

  create: async (input: CreateEmployeeInput): Promise<HREmployee> => {
    const res = await request<{ data: HREmployee }>('/api/hr/employees', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  update: async (
    id: string,
    input: Partial<CreateEmployeeInput>
  ): Promise<HREmployee> => {
    const res = await request<{ data: HREmployee }>(`/api/hr/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await request(`/api/hr/employees/${id}`, { method: 'DELETE' });
  },
};
