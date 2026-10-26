'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Users,
  CreditCard,
  LogOut,
  Loader2,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  Info,
  ChevronRight,
  Search,
  X,
  Ship,
  FileCheck2,
  ClipboardCheck,
} from 'lucide-react';
import { BrandHeader, TopBarBrand } from '@/components/BrandHeader';
import { CollapsibleSidebar, SidebarMain } from '@/components/CollapsibleSidebar';
import AppBreadcrumbs from '@/components/AppBreadcrumbs';
import GlobalSearch from '@/components/GlobalSearch';
import NotificationDropdown from '@/components/NotificationDropdown';
import CompanySwitcher from '@/components/CompanySwitcher';
import ProfileDropdown from '@/components/ProfileDropdown';
import { performLogout } from '@/lib/auth-logout';
import { SUBSCRIPTION_PURCHASE_UI_ENABLED } from '@/lib/subscription-ui';
import { useCompanyOptional } from '@/lib/company-context';
import { useSidebarCollapsed } from '@/lib/sidebar-collapse';
import { roleService, type RoleRecord } from '../role-service';
import {
  SHORT_APPROVAL_KEYS,
  SHORT_APPROVAL_PERMISSIONS,
} from '@/lib/short-approval-permissions';

type RolePermState = Record<string, Set<string>>;

const PERM_ICONS: Record<string, React.ElementType> = {
  'import.rfqs.approve': FileCheck2,
  'import.customs.assess': ClipboardCheck,
  'import.customs.record_payment': CreditCard,
  'import.customs.approve': Ship,
};

export default function ApprovalsPermissionsPage() {
  const router = useRouter();
  const companyCtx = useCompanyOptional();
  const { collapsed } = useSidebarCollapsed();

  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [permByRole, setPermByRole] = useState<RolePermState>({});
  const [fullPermNamesByRole, setFullPermNamesByRole] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [selectedPermKey, setSelectedPermKey] = useState<string | null>(null);
  const [roleSearch, setRoleSearch] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3200);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await roleService.getRoles();
      const list = Array.isArray(res.data) ? res.data.filter((r) => r.isActive !== false) : [];
      setRoles(list);

      const shortMap: RolePermState = {};
      const fullMap: Record<string, string[]> = {};

      await Promise.all(
        list.map(async (role) => {
          const detail = await roleService.getRoleById(role.id);
          const perms = detail.data?.permissions || [];
          const names = perms
            .map((p) => p.name)
            .filter((n): n is string => Boolean(n));
          fullMap[role.id] = names;
          shortMap[role.id] = new Set(names.filter((n) => SHORT_APPROVAL_KEYS.includes(n)));
        })
      );

      setFullPermNamesByRole(fullMap);
      setPermByRole(shortMap);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load roles';
      setError(message);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedRoles = useMemo(() => {
    return [...roles].sort((a, b) => {
      if (a.isSystem !== b.isSystem) return a.isSystem ? -1 : 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [roles]);

  const selectedPerm = useMemo(
    () => SHORT_APPROVAL_PERMISSIONS.find((p) => p.key === selectedPermKey) || null,
    [selectedPermKey]
  );

  const rolesForSelected = useMemo(() => {
    if (!selectedPermKey) return [];
    const q = roleSearch.trim().toLowerCase();
    return sortedRoles.filter((r) => {
      if (!q) return true;
      return (
        r.name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        (r.isSystem ? 'system' : 'custom').includes(q)
      );
    });
  }, [sortedRoles, selectedPermKey, roleSearch]);

  const countRolesWithPerm = (permissionKey: string) =>
    sortedRoles.filter((r) => permByRole[r.id]?.has(permissionKey)).length;

  const openPerm = (key: string) => {
    setSelectedPermKey(key);
    setRoleSearch('');
  };

  const closePanel = () => {
    setSelectedPermKey(null);
    setRoleSearch('');
  };

  const togglePermission = async (role: RoleRecord, permissionKey: string, nextGranted: boolean) => {
    const saveId = `${role.id}:${permissionKey}`;
    setSavingKey(saveId);
    try {
      const currentFull = new Set(fullPermNamesByRole[role.id] || []);
      if (nextGranted) currentFull.add(permissionKey);
      else currentFull.delete(permissionKey);

      const permissionsPayload = Array.from(currentFull).map((name) => ({
        name,
        scope: role.scope || 'ALL',
      }));

      const res = await roleService.updateRole(role.id, { permissions: permissionsPayload });
      if (!res.success) {
        throw new Error(res.message || 'Failed to update role');
      }

      setFullPermNamesByRole((prev) => ({
        ...prev,
        [role.id]: Array.from(currentFull),
      }));
      setPermByRole((prev) => {
        const next = new Set(prev[role.id] || []);
        if (nextGranted) next.add(permissionKey);
        else next.delete(permissionKey);
        return { ...prev, [role.id]: next };
      });

      showToast(
        'success',
        nextGranted
          ? `${role.name} can now approve`
          : `${role.name} can no longer approve`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update permission';
      showToast('error', message);
      await load();
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <>
      <CollapsibleSidebar
        expandedClassName="w-64"
        expandedWidth={256}
        bgClassName="bg-[#1a1a2e]"
      >
        <BrandHeader subtitle="Users & Access" />

        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {!collapsed && (
            <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-3 sidebar-expanded-only">
              USERS & ACCESS
            </p>
          )}

          <button
            type="button"
            title="Team Users"
            onClick={() => router.push('/users')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-white/60 hover:text-white hover:bg-white/5"
          >
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium sidebar-expanded-only">Team Users</span>
          </button>

          <button
            type="button"
            title="Roles & Permissions"
            onClick={() => router.push('/users/roles')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-white/60 hover:text-white hover:bg-white/5"
          >
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium sidebar-expanded-only">Roles & Permissions</span>
          </button>

          <button
            type="button"
            title="Approval Permissions"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all bg-[#014582] text-white"
          >
            <KeyRound className="w-4 h-4" />
            <span className="text-sm font-medium sidebar-expanded-only">Approval Permissions</span>
          </button>

          {SUBSCRIPTION_PURCHASE_UI_ENABLED && (
            <button
              type="button"
              title="Subscription Plans"
              onClick={() => router.push('/plans')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-white/60 hover:text-white hover:bg-white/5"
            >
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-medium sidebar-expanded-only">Subscription Plans</span>
            </button>
          )}
        </div>

        <div className="px-3 pb-4 flex-shrink-0 space-y-1">
          <button
            type="button"
            title="Back to Dashboard"
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-white/40 hover:text-white/60 hover:bg-white/5 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5 rotate-180" />
            <span className="text-sm font-medium sidebar-expanded-only">Back to Dashboard</span>
          </button>
          <button
            type="button"
            title="Logout"
            onClick={() => void performLogout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-white/40 hover:text-red-300 hover:bg-white/5 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium sidebar-expanded-only">Logout</span>
          </button>
        </div>
      </CollapsibleSidebar>

      <SidebarMain className="bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <TopBarBrand title="Approval Permissions" />
              <p className="text-sm text-gray-500 mt-1">
                Pick an approval type, then choose which roles can sign it off for{' '}
                {companyCtx?.activeCompany?.name || 'this company'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <GlobalSearch />
              <NotificationDropdown />
              <CompanySwitcher />
              <ProfileDropdown />
              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </header>

        <AppBreadcrumbs extra={[{ label: 'Approval Permissions' }]} />

        <div className="flex-1 p-6 overflow-auto space-y-5">
          <div className="rounded-xl border border-[#014582]/20 bg-[#014582]/5 px-4 py-3 flex items-start gap-3">
            <Info className="w-4 h-4 text-[#014582] mt-0.5 shrink-0" />
            <p className="text-xs text-gray-600">
              Click a permission box to open roles. Allow the roles that should receive approval
              requests and can approve. Full matrix stays under{' '}
              <button
                type="button"
                onClick={() => router.push('/users/roles')}
                className="font-semibold text-[#014582] hover:underline"
              >
                Roles &amp; Permissions
              </button>
              .
            </p>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-[#014582]" />
              <p className="text-sm">Loading…</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {SHORT_APPROVAL_PERMISSIONS.map((perm) => {
                const Icon = PERM_ICONS[perm.key] || KeyRound;
                const count = countRolesWithPerm(perm.key);
                const active = selectedPermKey === perm.key;
                return (
                  <button
                    key={perm.key}
                    type="button"
                    onClick={() => openPerm(perm.key)}
                    className={`text-left rounded-2xl border bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-[#014582]/35 group ${
                      active
                        ? 'border-[#014582] ring-2 ring-[#014582]/20'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          count > 0
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-[#014582]/10 text-[#014582]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 mt-1 text-gray-300 group-hover:text-[#014582] transition-colors ${
                          active ? 'text-[#014582]' : ''
                        }`}
                      />
                    </div>
                    <p className="mt-4 text-sm font-bold text-gray-900 leading-snug">
                      {perm.title}
                    </p>
                    <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{perm.detail}</p>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          count > 0
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {count > 0 ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Users className="w-3.5 h-3.5" />
                        )}
                        {count === 0
                          ? 'No roles yet'
                          : `${count} role${count === 1 ? '' : 's'} allowed`}
                      </span>
                      <span className="text-[11px] font-semibold text-[#014582] opacity-0 group-hover:opacity-100 transition-opacity">
                        Assign roles →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </SidebarMain>

      {/* Role assignment panel */}
      {selectedPerm ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={closePanel}
          />
          <div className="relative h-full w-full max-w-md bg-white shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#014582]">
                  Assign roles
                </p>
                <h2 className="text-base font-bold text-gray-900 mt-0.5 leading-snug">
                  {selectedPerm.title}
                </h2>
                <p className="text-xs text-gray-500 mt-1">{selectedPerm.detail}</p>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-gray-100">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  placeholder="Search roles…"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#014582]/30 focus:border-[#014582]"
                />
              </div>
              <p className="mt-2 text-[11px] text-gray-500">
                {countRolesWithPerm(selectedPerm.key)} of {sortedRoles.length} roles allowed
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
              {rolesForSelected.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500">No roles match.</div>
              ) : (
                rolesForSelected.map((role) => {
                  const on = Boolean(permByRole[role.id]?.has(selectedPerm.key));
                  const busy = savingKey === `${role.id}:${selectedPerm.key}`;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      disabled={busy}
                      onClick={() => void togglePermission(role, selectedPerm.key, !on)}
                      className={`w-full flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all disabled:opacity-60 ${
                        on
                          ? 'border-emerald-200 bg-emerald-50/80 hover:bg-emerald-50'
                          : 'border-gray-200 bg-white hover:border-[#014582]/30 hover:bg-gray-50'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          on ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {busy ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Shield className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{role.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {role.isSystem ? 'System role' : 'Custom role'}
                          {role.usersCount != null ? ` · ${role.usersCount} users` : ''}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold ${
                          on
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {on ? 'Allowed' : 'Allow'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={closePanel}
                className="w-full rounded-xl bg-[#014582] text-white text-sm font-semibold py-2.5 hover:bg-[#013565]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-lg text-xs font-medium shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </>
  );
}
