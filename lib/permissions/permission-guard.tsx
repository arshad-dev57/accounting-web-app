'use client';

import React, { ReactNode } from 'react';
import { usePermissions } from '../usePermissions';

export interface PermissionGuardProps {
  permission?: string;
  any?: string[];
  all?: string[];
  module?: string;
  subPage?: string;
  widget?: string;
  fallback?: ReactNode;
  mode?: 'hide' | 'disable';
  children: ReactNode;
}

/**
 * Reusable Action-Level & Module-Level UI Permission Guard
 * Wraps buttons, menu items, table actions, and dashboard widgets.
 */
export function PermissionGuard({
  permission,
  any,
  all,
  module,
  subPage,
  widget,
  fallback = null,
  mode = 'hide',
  children
}: PermissionGuardProps) {
  const { can, canWidget, hasSubPageAccess, hasModuleAccess, isAdmin, loading } = usePermissions();

  if (loading) return null;
  if (isAdmin) return <>{children}</>;

  let isAllowed = true;

  if (permission) {
    isAllowed = isAllowed && can(permission);
  }

  if (widget) {
    isAllowed = isAllowed && canWidget(widget);
  }

  if (any && any.length > 0) {
    isAllowed = isAllowed && any.some((p) => can(p));
  }

  if (all && all.length > 0) {
    isAllowed = isAllowed && all.every((p) => can(p));
  }

  if (module && subPage) {
    isAllowed = isAllowed && hasSubPageAccess(module, subPage);
  } else if (module) {
    isAllowed = isAllowed && hasModuleAccess(module);
  }

  if (!isAllowed) {
    if (mode === 'disable') {
      return (
        <span
          className="cursor-not-allowed opacity-50 pointer-events-none inline-flex items-center"
          title="You do not have permission for this action"
        >
          {children}
        </span>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default PermissionGuard;
