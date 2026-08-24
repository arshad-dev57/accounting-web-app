'use client';

import { useState, useEffect } from 'react';
import {
  isAdminRole,
  loadUserFromLocal,
  type StoredUser,
  type UserPermission,
} from './permission-service';
import { canViewRegisteredUsers } from './platform-owners';

export type { UserPermission };
export type UserData = StoredUser;

export function usePermissions() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    try {
      const parsedUser = loadUserFromLocal();
      setUser(parsedUser);
    } catch (error) {
      console.error('❌ [usePermissions] Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const admin = isAdminRole(user?.role);

  const hasPermission = (page: string): boolean => {
    if (!user) return false;
    if (admin) return true;
    const permission = user.permissions?.find(
      (p) => p.page.toLowerCase() === page.toLowerCase()
    );
    return permission?.canView || false;
  };

  const hasModuleAccess = (module: string): boolean => {
    if (!user) return false;
    if (admin) return true;
    return (
      user.permissions?.some((p) => {
        const pageLower = p.page.toLowerCase();
        const moduleLower = module.toLowerCase();
        return (pageLower.startsWith(moduleLower) || pageLower === moduleLower) && p.canView;
      }) || false
    );
  };

  const hasSubPageAccess = (module: string, subPage: string): boolean => {
    if (!user) return false;
    if (admin) return true;

    const moduleLower = module.toLowerCase();
    const sub = subPage.toLowerCase().replace(/\s+/g, '-');
    const candidates = new Set([
      `${moduleLower}-${sub}`,
      sub,
      `${moduleLower}-${moduleLower}-${sub}`,
    ]);

    const permission = user.permissions?.find((p) =>
      candidates.has(p.page.toLowerCase())
    );
    return permission?.canView || false;
  };

  const hasAnyModuleAccess = (): boolean => {
    if (!user) return false;
    if (admin) return true;
    return !!(user.permissions && user.permissions.length > 0);
  };

  return {
    user,
    loading,
    hasPermission,
    hasModuleAccess,
    hasSubPageAccess,
    hasAnyModuleAccess,
    isAdmin: admin,
    canViewRegisteredUsers: canViewRegisteredUsers(user?.email),
    reload: loadUserData,
  };
}
