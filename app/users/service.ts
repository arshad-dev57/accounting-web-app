import { apiClient } from '@/lib/api-client';
import {
  User,
  Role,
  UserPermission,
  UsersResponse,
  RolesResponse,
  CreateUserRequest,
  UpdateUserRequest,
} from './types';

export const usersService = {
  // Get all users
  getUsers: async (): Promise<UsersResponse> => {
    try {
      console.log('🔍 [getUsers] Fetching users from API...');
      const response = await apiClient.get('/api/admin/users');
      
      console.log('📊 [getUsers] API Response:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch users');
      }
      
      // Handle different response structures
      let data = response.data;
      if (data && data.data) {
        data = data.data;
      }
      
      const usersArray = Array.isArray(data) ? data : [];
      console.log('📊 [getUsers] Users array length:', usersArray.length);
      
      // Transform data to match our types
      const users: User[] = usersArray.map((item: any) => {
        console.log('📋 [getUsers] Processing user:', item.firstName, item.lastName);
        console.log('📋 [getUsers] User permissions:', item.permissions);
        
        return {
          id: item.id || '',
          firstName: item.firstName || '',
          lastName: item.lastName || '',
          email: item.email || '',
          phone: item.phone,
          role: item.role || 'user',
          roleId: item.roleId,
          isActive: item.isActive ?? true,
          createdAt: item.createdAt || '',
          managerId: item.managerId,
          locationIds: Array.isArray(item.locationIds)
            ? item.locationIds
            : (item.locations || []).map((l: any) => l.id),
          locations: (item.locations || []).map((l: any) => ({
            id: l.id,
            name: l.name,
            code: l.code,
            type: l.type,
          })),
          userRole: item.userRole ? {
            id: item.userRole.id || '',
            name: item.userRole.name || '',
            description: item.userRole.description,
          } : undefined,
          permissions: (item.permissions || []).map((p: any) => ({
            id: p.id || '',
            page: p.page || '',
            canView: p.canView ?? true,
            canCreate: p.canCreate ?? false,
            canEdit: p.canEdit ?? false,
            canDelete: p.canDelete ?? false,
          })),
        };
      });

      console.log('✅ [getUsers] Transformed users:', users);
      
      return {
        success: true,
        data: users,
        message: response.message,
      };
    } catch (error: any) {
      console.error('❌ [getUsers] Error:', error);
      throw new Error(error.message || 'Failed to fetch users');
    }
  },

  getRegisteredUsers: async (): Promise<UsersResponse> => {
    const response = await apiClient.get('/api/admin/users/registered');
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch registered users');
    }
    let data = response.data;
    if (data && data.data) data = data.data;
    const usersArray = Array.isArray(data) ? data : [];
    const users: User[] = usersArray.map((item: any) => ({
      id: item.id || '',
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      email: item.email || '',
      phone: item.phone,
      role: item.role || 'user',
      isActive: item.isActive ?? true,
      createdAt: item.createdAt || '',
      permissions: [],
    }));
    return { success: true, data: users, message: response.message };
  },

  // Get all roles
  getRoles: async (): Promise<RolesResponse> => {
    try {
      const response = await apiClient.get('/api/admin/users/roles');
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch roles');
      }
      
      // Handle different response structures
      let data = response.data;
      if (data && data.data) {
        data = data.data;
      }
      
      const rolesArray = Array.isArray(data) ? data : [];
      
      // Transform data to match our types
      const roles: Role[] = rolesArray.map((item: any) => ({
        id: item.id || '',
        name: item.name || '',
        description: item.description,
      }));

      return {
        success: true,
        data: roles,
        message: response.message,
      };
    } catch (error: any) {
      console.error('Get roles error:', error);
      throw new Error(error.message || 'Failed to fetch roles');
    }
  },

  // Create user
  createUser: async (userData: CreateUserRequest): Promise<boolean> => {
    try {
      const response = await apiClient.post('/api/admin/users', userData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create user');
      }
      
      return true;
    } catch (error: any) {
      console.error('Create user error:', error);
      throw new Error(error.message || 'Failed to create user');
    }
  },

  // Update user
  updateUser: async (userId: string, userData: UpdateUserRequest): Promise<boolean> => {
    try {
      const response = await apiClient.put(`/api/admin/users/${userId}`, userData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update user');
      }
      
      return true;
    } catch (error: any) {
      console.error('Update user error:', error);
      throw new Error(error.message || 'Failed to update user');
    }
  },

  // Delete user
  deleteUser: async (userId: string): Promise<boolean> => {
    try {
      const response = await apiClient.delete(`/api/admin/users/${userId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete user');
      }
      
      return true;
    } catch (error: any) {
      console.error('Delete user error:', error);
      throw new Error(error.message || 'Failed to delete user');
    }
  },

  // Update user permissions
  updateUserPermissions: async (userId: string, permissions: UserPermission[]): Promise<boolean> => {
    try {
      const response = await apiClient.put(`/api/admin/users/${userId}/permissions`, {
        permissions: permissions.map((p) => ({
          page: p.page,
          canView: p.canView,
          canCreate: p.canCreate,
          canEdit: p.canEdit,
          canDelete: p.canDelete,
        })),
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update permissions');
      }
      
      return true;
    } catch (error: any) {
      console.error('Update permissions error:', error);
      throw new Error(error.message || 'Failed to update permissions');
    }
  },
};
