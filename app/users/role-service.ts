import { apiClient } from '@/lib/api-client';

export interface RolePermissionItem {
  permissionId?: string;
  name?: string;
  module?: string;
  resource?: string;
  action?: string;
  scope?: string;
}

export interface RoleRecord {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  companyId?: string | null;
  scope: string;
  isActive: boolean;
  usersCount: number;
  permissionsCount: number;
  permissions?: RolePermissionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PermissionCatalogAction {
  id: string | null;
  name: string;
  action: string;
  description: string;
  supportedScopes: string[];
}

export interface PermissionCatalogResource {
  key: string;
  name: string;
  description: string;
  actions: string[];
  scopes: string[];
  permissions: PermissionCatalogAction[];
}

export interface PermissionCatalogModule {
  key: string;
  name: string;
  description: string;
  resources: PermissionCatalogResource[];
}

export interface EffectivePermissionSource {
  granted: boolean;
  scope?: string;
  source: string;
  module?: string;
  resource?: string;
  action?: string;
}

export interface UserEffectiveResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    userRole?: { id: string; name: string };
  };
  effective: {
    isAdmin: boolean;
    roleName?: string;
    permissions: string[];
    permissionMap: Record<string, EffectivePermissionSource>;
    scopes: Record<string, string>;
  };
  overrides: Array<{
    id: string;
    permissionId: string;
    permissionName: string;
    effect: 'ALLOW' | 'DENY';
    scope?: string;
  }>;
}

function unwrapResponse<T>(res: any): { success: boolean; data: T; message?: string } {
  const success = Boolean(res?.success);
  let payload = res?.data;
  // If backend wrapped in { success, data } and apiClient also wrapped in { success, data }
  if (payload && typeof payload === 'object' && 'data' in payload) {
    payload = payload.data;
  }
  return {
    success,
    data: payload as T,
    message: res?.message || (res?.data as any)?.message || ''
  };
}

export const roleService = {
  // Get all roles
  getRoles: async (): Promise<{ success: boolean; data: RoleRecord[] }> => {
    const res = await apiClient.get('/api/admin/roles');
    const unwrapped = unwrapResponse<RoleRecord[]>(res);
    return {
      ...unwrapped,
      data: Array.isArray(unwrapped.data) ? unwrapped.data : []
    };
  },

  getRoleById: async (id: string): Promise<{ success: boolean; data: RoleRecord }> => {
    const res = await apiClient.get(`/api/admin/roles/${id}`);
    return unwrapResponse<RoleRecord>(res);
  },

  getCatalog: async (): Promise<{
    success: boolean;
    data: { modules: PermissionCatalogModule[]; totalPermissions: number };
  }> => {
    const res = await apiClient.get('/api/admin/roles/catalog');
    return unwrapResponse<{ modules: PermissionCatalogModule[]; totalPermissions: number }>(res);
  },

  createRole: async (payload: {
    name: string;
    description?: string;
    scope?: string;
    permissions: Array<{ permissionId?: string; name?: string; scope?: string }>;
  }): Promise<{ success: boolean; message: string; data?: RoleRecord }> => {
    const res = await apiClient.post('/api/admin/roles', payload);
    return unwrapResponse<RoleRecord>(res);
  },

  updateRole: async (
    id: string,
    payload: {
      name?: string;
      description?: string;
      scope?: string;
      isActive?: boolean;
      permissions?: Array<{ permissionId?: string; name?: string; scope?: string }>;
    }
  ): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.put(`/api/admin/roles/${id}`, payload);
    return unwrapResponse<any>(res);
  },

  duplicateRole: async (
    id: string,
    newName?: string
  ): Promise<{ success: boolean; message: string; data?: RoleRecord }> => {
    const res = await apiClient.post(`/api/admin/roles/${id}/duplicate`, { newName });
    return unwrapResponse<RoleRecord>(res);
  },

  deleteRole: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete(`/api/admin/roles/${id}`);
    return unwrapResponse<any>(res);
  },

  getUserEffective: async (userId: string): Promise<{ success: boolean; data: UserEffectiveResponse }> => {
    const res = await apiClient.get(`/api/admin/roles/user-effective-permissions/${userId}`);
    return unwrapResponse<UserEffectiveResponse>(res);
  },

  // Set user override
  setUserOverride: async (
    userId: string,
    payload: {
      permissionId?: string;
      permissionName?: string;
      effect: 'ALLOW' | 'DENY' | 'RESET';
      scope?: string;
    }
  ): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post(`/api/admin/roles/user-overrides/${userId}`, payload);
    return unwrapResponse<any>(res);
  },

  // Security audit logs
  getAuditLogs: async (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const res = await apiClient.get(`/api/admin/roles/audit/logs?${q.toString()}`);
    return unwrapResponse<any>(res);
  }
};
