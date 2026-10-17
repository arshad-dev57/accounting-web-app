'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isAdminRole,
  loadUserFromLocal,
  type StoredUser,
  type UserPermission,
} from './permission-service';
import { canViewRegisteredUsers } from './platform-owners';
import { apiClient } from './api-client';

// Effective RBAC permission hook
export type { UserPermission };
export type UserData = StoredUser;

export interface EffectivePermissionInfo {
  granted: boolean;
  scope?: string | null;
  source?: string;
  module?: string;
  resource?: string;
  action?: string;
}

const EFFECTIVE_CACHE_KEY = 'user_effective_rbac';

export function usePermissions() {
  const [user, setUser] = useState<UserData | null>(null);
  /** True until first permission resolution finishes (admin: instant; others: after API/cache). */
  const [loading, setLoading] = useState(true);
  const [effectiveMap, setEffectiveMap] = useState<Record<string, EffectivePermissionInfo>>({});
  const [scopesMap, setScopesMap] = useState<Record<string, string>>({});
  /** True once we have a trusted map (or confirmed admin) — prevents dashboard flash. */
  const [ready, setReady] = useState(false);

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      setReady(false);
      const parsedUser = loadUserFromLocal();
      setUser(parsedUser);

      if (!parsedUser?.id) {
        setEffectiveMap({});
        setScopesMap({});
        return;
      }

      // Admins: no RBAC fetch needed
      if (isAdminRole(parsedUser.role)) {
        setEffectiveMap({});
        setScopesMap({});
        if (typeof window !== 'undefined') {
          localStorage.removeItem(EFFECTIVE_CACHE_KEY);
        }
        setReady(true);
        return;
      }

      // Warm from cache only if it belongs to this user AND has at least one entry
      let hadWarmCache = false;
      if (typeof window !== 'undefined') {
        const cachedRaw = localStorage.getItem(EFFECTIVE_CACHE_KEY);
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw);
            if (cached.userId === parsedUser.id && cached.permissionMap) {
              setEffectiveMap(cached.permissionMap || {});
              setScopesMap(cached.scopes || {});
              hadWarmCache = Object.keys(cached.permissionMap || {}).length > 0;
              if (hadWarmCache) setReady(true);
            } else {
              localStorage.removeItem(EFFECTIVE_CACHE_KEY);
            }
          } catch {
            localStorage.removeItem(EFFECTIVE_CACHE_KEY);
          }
        }
      }

      try {
        const res = await apiClient.get<any>(
          `/api/admin/roles/user-effective-permissions/${parsedUser.id}`
        );
        if (res.success) {
          const payload = res.data?.data ?? res.data;
          const effective = payload?.effective;
          if (effective) {
            const pMap = effective.permissionMap || {};
            const sMap = effective.scopes || {};
            setEffectiveMap(pMap);
            setScopesMap(sMap);
            if (typeof window !== 'undefined') {
              localStorage.setItem(
                EFFECTIVE_CACHE_KEY,
                JSON.stringify({
                  userId: parsedUser.id,
                  permissionMap: pMap,
                  scopes: sMap,
                  timestamp: Date.now(),
                })
              );
            }
          }
        }
      } catch {
        // Offline: keep warm cache if any
      }
      setReady(true);
    } catch (error) {
      console.error('❌ [usePermissions] Error loading user data:', error);
      setReady(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const admin = isAdminRole(user?.role);

  /**
   * Universal permission checker
   * Usage:
   *   can('sales.orders', 'create')
   *   can('sales.orders.create')
   *   can('accounting-journal-entries') // legacy fallback
   */
  const can = (resourceOrPerm: string, action?: string, requiredScope?: string): boolean => {
    if (!user) return false;
    if (admin) return true;

    // Normalise permission string
    let fullKey = resourceOrPerm;
    if (action) {
      fullKey = `${resourceOrPerm}.${action}`;
    }

    // 1. Check modern effective permission map
    const modernPerm = effectiveMap[fullKey];
    if (modernPerm !== undefined) {
      if (modernPerm.granted) {
        if (requiredScope && modernPerm.scope && modernPerm.scope !== 'ALL' && modernPerm.scope !== requiredScope) {
          return false;
        }
        return true;
      }
      return false;
    }

    // 2. Legacy UserPermission fallback
    // e.g. "sales.orders.create" -> page candidates: ["sales-orders", "orders"]
    const parts = fullKey.split('.');
    if (parts.length >= 2) {
      const mod = parts[0];
      const res = parts[1].replace(/_/g, '-');
      const act = parts[2] || action || 'view';

      const candidatePages = [
        `${mod}-${res}`,
        res,
        `${mod}-${mod}-${res}`,
      ];

      const perm = user.permissions?.find((p) =>
        candidatePages.includes(p.page.toLowerCase())
      );

      if (perm) {
        if (act === 'view') return perm.canView;
        if (act === 'create') return perm.canCreate || perm.canView;
        if (act === 'edit') return perm.canEdit || perm.canView;
        if (act === 'delete') return perm.canDelete || perm.canView;
        return perm.canView;
      }
    }

    // 3. Fallback direct page check
    const directPerm = user.permissions?.find(
      (p) => p.page.toLowerCase() === resourceOrPerm.toLowerCase()
    );
    if (directPerm) {
      return directPerm.canView;
    }

    return false;
  };

  /**
   * Widget-level dashboard permission checker
   */
  const canWidget = (widgetKey: string): boolean => {
    if (!user) return false;
    if (admin) return true;

    // Normalise widget key e.g. "widgets_sales" or "sales_summary"
    const key = widgetKey.startsWith('widgets_') ? widgetKey : `widgets_${widgetKey}`;
    const permKey = `dashboard.${key}.view`;

    if (effectiveMap[permKey] !== undefined) {
      return effectiveMap[permKey].granted;
    }

    // Fallback: if user can access the parent module, show widget
    if (widgetKey.includes('sales') && hasModuleAccess('sales')) return true;
    if (widgetKey.includes('purchase') && hasModuleAccess('purchases')) return true;
    if (widgetKey.includes('inventory') && hasModuleAccess('warehouse')) return true;
    if ((widgetKey.includes('financial') || widgetKey.includes('cash') || widgetKey.includes('bank')) && hasModuleAccess('accounting')) return true;

    return false;
  };

  /** Legacy helper for backward compatibility */
  const hasPermission = (page: string): boolean => {
    if (!user) return false;
    if (admin) return true;
    const permission = user.permissions?.find(
      (p) => p.page.toLowerCase() === page.toLowerCase()
    );
    return permission?.canView || false;
  };

  /** Legacy helper for backward compatibility */
  const hasModuleAccess = useCallback(
    (module: string): boolean => {
      if (!user) return false;
      if (admin) return true;

      const moduleLower = module.toLowerCase();

      const hasModern = Object.keys(effectiveMap).some(
        (k) => k.startsWith(`${moduleLower}.`) && effectiveMap[k].granted
      );
      if (hasModern) return true;

      if (moduleLower === 'warehouse' || moduleLower === 'inventory') {
        const alt = moduleLower === 'warehouse' ? 'inventory' : 'warehouse';
        const hasAlt = Object.keys(effectiveMap).some(
          (k) => k.startsWith(`${alt}.`) && effectiveMap[k].granted
        );
        if (hasAlt) return true;
      }

      return (
        user.permissions?.some((p) => {
          const pageLower = p.page.toLowerCase();
          return (pageLower.startsWith(moduleLower) || pageLower === moduleLower) && p.canView;
        }) || false
      );
    },
    [user, admin, effectiveMap]
  );

  /**
   * Main /dashboard module-tile visibility.
   * 1) Explicit dashboard.module_<key>.view
   * 2) Fallback: any permission in that business module (e.g. accounting.*)
   */
  const canAccessDashboardModule = useCallback(
    (moduleKey: string): boolean => {
      if (!user) return false;
      if (admin) return true;

      const key = moduleKey.toLowerCase();
      const tileKey = `dashboard.module_${key}.view`;

      if (effectiveMap[tileKey]?.granted) return true;

      if (key === 'tax') {
        return (
          hasModuleAccess('accounting') ||
          hasModuleAccess('tax') ||
          Object.keys(effectiveMap).some(
            (k) => k.startsWith('reports.tax.') && effectiveMap[k].granted
          )
        );
      }

      if (key === 'users') {
        return (
          hasModuleAccess('settings') ||
          effectiveMap['settings.users.view']?.granted === true ||
          effectiveMap['settings.roles.view']?.granted === true
        );
      }

      if (key === 'import') {
        return (
          hasModuleAccess('import') ||
          hasModuleAccess('purchases') ||
          hasModuleAccess('warehouse')
        );
      }

      if (key === 'export') {
        return (
          hasModuleAccess('export') ||
          hasModuleAccess('sales') ||
          hasModuleAccess('warehouse')
        );
      }

      if (key === 'trading') {
        return (
          hasModuleAccess('trading') ||
          hasModuleAccess('sales') ||
          hasModuleAccess('purchases') ||
          hasModuleAccess('warehouse')
        );
      }

      return hasModuleAccess(key);
    },
    [user, admin, effectiveMap, hasModuleAccess]
  );

  /** Legacy helper for backward compatibility */
  const hasSubPageAccess = (module: string, subPage: string): boolean => {
    if (!user) return false;
    if (admin) return true;

    const modernKey = `${module.toLowerCase()}.${subPage.toLowerCase().replace(/-/g, '_')}.view`;
    if (effectiveMap[modernKey] !== undefined) {
      return effectiveMap[modernKey].granted;
    }

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
    return !!(user.permissions && user.permissions.length > 0) || Object.values(effectiveMap).some((v) => v.granted);
  };

  const getScope = (permKey: string): string => {
    return scopesMap[permKey] || (admin ? 'ALL' : 'ALL');
  };

  return {
    user,
    loading,
    /** False until permissions are resolved — use this to avoid UI flash */
    ready,
    can,
    canWidget,
    getScope,
    hasPermission,
    hasModuleAccess,
    canAccessDashboardModule,
    hasSubPageAccess,
    hasAnyModuleAccess,
    isAdmin: admin,
    canViewRegisteredUsers: canViewRegisteredUsers(user?.email),
    reload: loadUserData,
  };
}
