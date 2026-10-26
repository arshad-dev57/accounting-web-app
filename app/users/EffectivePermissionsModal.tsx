'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  SlidersHorizontal,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { roleService, UserEffectiveResponse } from './role-service';
import {
  moduleLabel,
  permissionDisplayName,
  sourceLabel,
} from '@/lib/permission-labels';

interface Props {
  open: boolean;
  user: { id: string; firstName: string; lastName: string; email: string; role: string } | null;
  onClose: () => void;
  onUpdated?: () => void;
}

type PermRow = {
  key: string;
  module: string;
  resource: string;
  action: string;
  granted: boolean;
  scope: string;
  source: string;
};

export default function EffectivePermissionsModal({ open, user, onClose, onUpdated }: Props) {
  const [data, setData] = useState<UserEffectiveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'granted' | 'denied'>('granted');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2800);
  };

  const applyEffectivePayload = useCallback((payload: UserEffectiveResponse | null) => {
    if (!payload?.effective) return;
    setData(payload);
  }, []);

  const loadData = useCallback(
    async (opts?: { soft?: boolean }) => {
      if (!user?.id) return;
      try {
        if (opts?.soft) setRefreshing(true);
        else setLoading(true);
        setError(null);
        const res = await roleService.getUserEffective(user.id);
        if (res.success && res.data?.effective) {
          applyEffectivePayload(res.data);
        } else if (res.success && (res.data as any)?.data?.effective) {
          applyEffectivePayload((res.data as any).data);
        } else {
          setError(res.message || 'Failed to load permissions');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to inspect user permissions');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id, applyEffectivePayload]
  );

  useEffect(() => {
    if (open && user?.id) {
      setSearchQuery('');
      setFilterModule('all');
      setStatusFilter('granted');
      loadData();
    }
  }, [open, user?.id, loadData]);

  const patchLocalPermission = (
    permissionName: string,
    effect: 'ALLOW' | 'DENY' | 'RESET',
    previous: PermRow | undefined
  ) => {
    setData((prev) => {
      if (!prev?.effective?.permissionMap) return prev;
      const map = { ...prev.effective.permissionMap };
      if (effect === 'RESET') {
        // Soft reset: mark as role-default until refresh; keep previous granted if was role
        map[permissionName] = {
          ...map[permissionName],
          granted: previous?.source?.startsWith('ROLE') ? previous.granted : false,
          source: previous?.source?.startsWith('ROLE')
            ? previous.source
            : 'DEFAULT_DENY',
          scope: previous?.scope || 'ALL',
        };
      } else if (effect === 'ALLOW') {
        map[permissionName] = {
          ...map[permissionName],
          granted: true,
          scope: 'ALL',
          source: 'USER_OVERRIDE_ALLOW',
        };
      } else {
        map[permissionName] = {
          ...map[permissionName],
          granted: false,
          scope: undefined,
          source: 'USER_OVERRIDE_DENY',
        };
      }
      const grantedKeys = Object.keys(map).filter((k) => map[k].granted);
      return {
        ...prev,
        effective: {
          ...prev.effective,
          permissionMap: map,
          permissions: grantedKeys,
        },
      };
    });
  };

  const handleSetOverride = async (row: PermRow, effect: 'ALLOW' | 'DENY' | 'RESET') => {
    if (!user?.id) return;
    try {
      setSavingKey(row.key);
      // Optimistic UI — button state updates immediately
      patchLocalPermission(row.key, effect, row);

      const res = await roleService.setUserOverride(user.id, {
        permissionName: row.key,
        effect,
        scope: 'ALL',
      });

      if (!res.success) {
        throw new Error(res.message || 'Failed to update override');
      }

      showToast(
        'success',
        effect === 'ALLOW'
          ? 'Permission allowed for this user'
          : effect === 'DENY'
            ? 'Permission denied for this user'
            : 'Override reset to role default'
      );

      // Soft refresh to sync exact server sources (no full-table spinner)
      await loadData({ soft: true });
      onUpdated?.();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to set override');
      await loadData({ soft: true });
    } finally {
      setSavingKey(null);
    }
  };

  const permissionList: PermRow[] = useMemo(() => {
    if (!data?.effective?.permissionMap) return [];
    return Object.entries(data.effective.permissionMap).map(([key, info]) => {
      const parts = key.split('.');
      return {
        key,
        module: info.module || parts[0] || 'general',
        resource: info.resource || parts[1] || 'resource',
        action: info.action || parts[2] || 'action',
        granted: Boolean(info.granted),
        scope: info.scope || 'ALL',
        source: info.source || 'DEFAULT_DENY',
      };
    });
  }, [data]);

  const modulesList = useMemo(() => {
    return Array.from(new Set(permissionList.map((p) => p.module))).sort();
  }, [permissionList]);

  const filteredPermissions = useMemo(() => {
    let list = permissionList;
    if (filterModule !== 'all') {
      list = list.filter((p) => p.module === filterModule);
    }
    if (statusFilter === 'granted') list = list.filter((p) => p.granted);
    if (statusFilter === 'denied') list = list.filter((p) => !p.granted);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const display = permissionDisplayName(p);
        return (
          display.title.toLowerCase().includes(q) ||
          display.moduleName.toLowerCase().includes(q) ||
          p.key.toLowerCase().includes(q) ||
          p.resource.toLowerCase().includes(q) ||
          p.action.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [permissionList, filterModule, searchQuery, statusFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, PermRow[]>();
    for (const p of filteredPermissions) {
      const list = map.get(p.module) || [];
      list.push(p);
      map.set(p.module, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) =>
      moduleLabel(a).localeCompare(moduleLabel(b))
    );
  }, [filteredPermissions]);

  useEffect(() => {
    // Expand modules that have results
    setExpandedModules((prev) => {
      const next = { ...prev };
      for (const [mod] of grouped) {
        if (next[mod] === undefined) next[mod] = true;
      }
      return next;
    });
  }, [grouped]);

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#014582]/10 text-[#014582] flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate">
                Permissions:{' '}
                <span className="text-[#014582]">
                  {user.firstName} {user.lastName}
                </span>
              </h2>
              <p className="text-xs text-gray-500 truncate">
                Role:{' '}
                <strong className="text-gray-700">
                  {data?.effective?.roleName || user.role}
                </strong>
                {data?.effective?.isAdmin && (
                  <span className="text-emerald-600 font-semibold ml-1">(Admin Full Access)</span>
                )}
                {' · '}
                Allowed:{' '}
                <strong className="text-emerald-600">
                  {data?.effective?.permissions?.length || 0}
                </strong>
                {refreshing && (
                  <span className="ml-2 inline-flex items-center gap-1 text-gray-400">
                    <Loader2 className="w-3 h-3 animate-spin" /> Syncing…
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search pages (e.g. Journal Entries)…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-[#014582] outline-none"
              />
            </div>

            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 outline-none"
            >
              <option value="all">All modules</option>
              {modulesList.map((m) => (
                <option key={m} value={m}>
                  {moduleLabel(m)}
                </option>
              ))}
            </select>

            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 text-[11px]">
              {(
                [
                  ['granted', 'Allowed'],
                  ['denied', 'Not allowed'],
                  ['all', 'All'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    statusFilter === value
                      ? 'bg-[#014582] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadData({ soft: true })}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-[#014582]" />
              <p className="text-sm">Loading permissions…</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="space-y-4">
              {grouped.length === 0 ? (
                <div className="py-16 text-center text-gray-500 text-sm">
                  No permissions match this filter.
                </div>
              ) : null}

              {grouped.map(([mod, rows]) => {
                const openMod = expandedModules[mod] ?? true;
                return (
                  <div
                    key={mod}
                    className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedModules((prev) => ({ ...prev, [mod]: !openMod }))
                      }
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100/80 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        {openMod ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm font-bold text-gray-800">
                          {moduleLabel(mod)}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {rows.filter((r) => r.granted).length}/{rows.length} allowed
                        </span>
                      </div>
                    </button>

                    {openMod && (
                      <div className="divide-y divide-gray-100">
                        {rows.map((p) => {
                          const display = permissionDisplayName(p);
                          const isSaving = savingKey === p.key;
                          const isOverrideAllow = p.source === 'USER_OVERRIDE_ALLOW';
                          const isOverrideDeny = p.source === 'USER_OVERRIDE_DENY';
                          const isOverridden = isOverrideAllow || isOverrideDeny;

                          return (
                            <div
                              key={p.key}
                              className={`flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 ${
                                isOverridden ? 'bg-amber-50/30' : ''
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">
                                  {display.title}
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                  {display.subtitle}
                                  <span className="text-gray-300 mx-1.5">·</span>
                                  <span className="font-mono text-gray-400">{p.key}</span>
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 flex-wrap sm:justify-end">
                                {p.granted ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" /> Allowed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
                                    <XCircle className="w-3 h-3" /> Not allowed
                                  </span>
                                )}

                                <span className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 rounded px-2 py-0.5">
                                  {sourceLabel(p.source)}
                                  {p.granted ? ` · ${p.scope}` : ''}
                                </span>

                                {isSaving ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-[#014582]" />
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    {/* Allow: hide when already manually allowed */}
                                    {!isOverrideAllow && (
                                      <button
                                        type="button"
                                        onClick={() => handleSetOverride(p, 'ALLOW')}
                                        disabled={isSaving}
                                        className="px-2.5 py-1 rounded-md text-[10px] font-semibold border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                                      >
                                        Allow
                                      </button>
                                    )}

                                    {/* Deny: hide when already manually denied */}
                                    {!isOverrideDeny && (
                                      <button
                                        type="button"
                                        onClick={() => handleSetOverride(p, 'DENY')}
                                        disabled={isSaving}
                                        className="px-2.5 py-1 rounded-md text-[10px] font-semibold border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50"
                                      >
                                        Deny
                                      </button>
                                    )}

                                    {isOverridden && (
                                      <button
                                        type="button"
                                        onClick={() => handleSetOverride(p, 'RESET')}
                                        disabled={isSaving}
                                        className="px-2.5 py-1 rounded-md text-[10px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                      >
                                        Reset
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span>
            Showing {filteredPermissions.length} of {permissionList.length} permissions
            {statusFilter === 'granted' ? ' (allowed only)' : ''}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#014582] text-white rounded-lg text-xs font-semibold hover:bg-[#013565] transition-colors"
          >
            Close
          </button>
        </div>

        {toast && (
          <div
            className={`absolute bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-xs font-medium shadow-lg ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}
