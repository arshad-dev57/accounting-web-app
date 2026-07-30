'use client';

import { useState, useEffect } from 'react';

export interface UserPermission {
  id: string;
  page: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  permissions?: UserPermission[];
}

export function usePermissions() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log('🔍 [usePermissions] User data loaded:', parsedUser);
        console.log('🔍 [usePermissions] User role:', parsedUser.role);
        console.log('🔍 [usePermissions] User permissions:', parsedUser.permissions);
        console.log('🔍 [usePermissions] Permissions count:', parsedUser.permissions?.length || 0);
        setUser(parsedUser);
      } else {
        console.log('⚠️ [usePermissions] No user data found in localStorage');
      }
    } catch (error) {
      console.error('❌ [usePermissions] Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (page: string): boolean => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    // Check specific permission
    const permission = user.permissions?.find(p => 
      p.page.toLowerCase() === page.toLowerCase()
    );
    
    return permission?.canView || false;
  };

  const hasModuleAccess = (module: string): boolean => {
    if (!user) return false;
    
    // Admin has all module access
    if (user.role === 'admin') return true;
    
    console.log('🔍 [hasModuleAccess] Checking module access for:', module);
    console.log('🔍 [hasModuleAccess] User permissions:', user.permissions);
    
    // Check if user has any permission for this module
    const hasModulePermission = user.permissions?.some(p => {
      const pageLower = p.page.toLowerCase();
      const moduleLower = module.toLowerCase();
      const matches = pageLower.startsWith(moduleLower) || pageLower === moduleLower;
      console.log(`🔍 [hasModuleAccess] Checking permission: ${p.page} against ${module} -> ${matches}`);
      return matches && p.canView;
    });
    
    console.log('🔍 [hasModuleAccess] Has module permission:', hasModulePermission);
    return hasModulePermission || false;
  };

  const hasSubPageAccess = (module: string, subPage: string): boolean => {
    if (!user) return false;
    
    // Admin has all sub-page access
    if (user.role === 'admin') return true;
    
    // Check specific sub-page permission
    const pageIdentifier = `${module}-${subPage.toLowerCase().replace(/\s+/g, '-')}`;
    const permission = user.permissions?.find(p => 
      p.page.toLowerCase() === pageIdentifier
    );
    
    return permission?.canView || false;
  };

  const hasAnyModuleAccess = (): boolean => {
    if (!user) return false;
    
    // Admin has all module access
    if (user.role === 'admin') return true;
    
    // Check if user has any permissions at all
    return !!(user.permissions && user.permissions.length > 0);
  };

  return {
    user,
    loading,
    hasPermission,
    hasModuleAccess,
    hasSubPageAccess,
    hasAnyModuleAccess,
    isAdmin: user?.role === 'admin',
  };
}
