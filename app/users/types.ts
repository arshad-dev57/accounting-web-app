export interface UserPermission {
  id: string;
  page: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface ModulePermission {
  module: string;
  hasAccess: boolean;
  canView: boolean;
}

export interface SubPagePermission {
  page: string;
  canView: boolean;
}

export interface ModuleDetail {
  module: string;
  subPages: string[];
}

export interface UserRole {
  id: string;
  name: string;
  description?: string;
}

export interface AssignedLocation {
  id: string;
  name: string;
  code?: string;
  type?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  roleId?: string;
  isActive: boolean;
  createdAt: string;
  managerId?: string;
  userRole?: UserRole;
  permissions: UserPermission[];
  locationIds?: string[];
  locations?: AssignedLocation[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
  message?: string;
}

export interface RolesResponse {
  success: boolean;
  data: Role[];
  message?: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
  role?: string;
  roleId?: string;
  managerId?: string;
  permissions?: UserPermission[];
  locationIds?: string[];
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  country?: string;
  role?: string;
  roleId?: string;
  managerId?: string;
  isActive?: boolean;
  permissions?: UserPermission[];
  locationIds?: string[];
}
