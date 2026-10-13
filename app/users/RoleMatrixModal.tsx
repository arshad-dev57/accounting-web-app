'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Shield,
  Search,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  Loader2,
  Sliders,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  roleService,
  RoleRecord,
  PermissionCatalogModule
} from './role-service';

interface Props {
  open: boolean;
  role?: RoleRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

/** Preferred column order — matrix shows every action that exists in the module */
const ACTION_ORDER = [
  'view',
  'create',
  'edit',
  'delete',
  'approve',
  'post',
  'reverse',
  'cancel',
  'void',
  'pay',
  'receive',
  'transfer',
  'close',
  'reopen',
  'import',
  'print',
  'export',
];

function actionColumnsForModule(mod: PermissionCatalogModule): Array<{ key: string; label: string }> {
  const present = new Set<string>();
  for (const r of mod.resources || []) {
    for (const a of r.actions || []) present.add(a);
    for (const p of r.permissions || []) {
      if (p.action) present.add(p.action);
    }
  }
  const ordered = ACTION_ORDER.filter((a) => present.has(a));
  for (const a of present) {
    if (!ordered.includes(a)) ordered.push(a);
  }
  return ordered.map((key) => ({ key, label: key.toUpperCase() }));
}

export default function RoleMatrixModal({ open, role, onClose, onSaved }: Props) {
  const isEditing = Boolean(role?.id);
  const isSystem = Boolean(role?.isSystem);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modules, setModules] = useState<PermissionCatalogModule[]>([]);
  // Set of selected permission names e.g. "sales.orders.view"
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  // Per-permission scope overrides e.g. { "sales.orders.view": "OWN" }
  const [permScopes, setPermScopes] = useState<Record<string, string>>({});

  const [searchQuery, setSearchQuery] = useState('');
  // All modules start expanded so the user immediately sees what's available
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Load catalog and role details
  useEffect(() => {
    if (!open) return;

    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const catalogRes = await roleService.getCatalog();
        if (!mounted) return;

        const mods = catalogRes.data?.modules || (catalogRes.data as any)?.data?.modules || [];
        setModules(Array.isArray(mods) ? mods : []);

        if (role?.id) {
          setName(role.name || '');
          setDescription(role.description || '');
          setScope(role.scope || 'ALL');

          // Fetch full role permissions
          const roleDetail = await roleService.getRoleById(role.id);
          const perms = roleDetail.data?.permissions || (roleDetail.data as any)?.data?.permissions;
          if (roleDetail.success && Array.isArray(perms)) {
            const permSet = new Set<string>();
            const scopeMap: Record<string, string> = {};
            for (const p of perms) {
              if (p.name) {
                permSet.add(p.name);
                if (p.scope) scopeMap[p.name] = p.scope;
              }
            }
            setSelectedPerms(permSet);
            setPermScopes(scopeMap);
          }
        } else {
          setName('');
          setDescription('');
          setScope('ALL');
          setSelectedPerms(new Set());
          setPermScopes({});
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load permission catalog');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [open, role]);

  const toggleExpand = (modKey: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modKey]: !prev[modKey]
    }));
  };

  const handleTogglePerm = (permName: string) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(permName)) {
        next.delete(permName);
      } else {
        next.add(permName);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const next = new Set<string>();
    for (const mod of modules) {
      for (const res of mod.resources) {
        for (const p of res.permissions) {
          next.add(p.name);
        }
      }
    }
    setSelectedPerms(next);
  };

  const handleClearAll = () => {
    setSelectedPerms(new Set());
  };

  const handleSelectModule = (modKey: string) => {
    const targetMod = modules.find((m) => m.key === modKey);
    if (!targetMod) return;

    setSelectedPerms((prev) => {
      const next = new Set(prev);
      for (const res of targetMod.resources) {
        for (const p of res.permissions) {
          next.add(p.name);
        }
      }
      return next;
    });
  };

  const handleClearModule = (modKey: string) => {
    const targetMod = modules.find((m) => m.key === modKey);
    if (!targetMod) return;

    setSelectedPerms((prev) => {
      const next = new Set(prev);
      for (const res of targetMod.resources) {
        for (const p of res.permissions) {
          next.delete(p.name);
        }
      }
      return next;
    });
  };

  const handleToggleResource = (modKey: string, resKey: string) => {
    const targetMod = modules.find((m) => m.key === modKey);
    const targetRes = targetMod?.resources.find((r) => r.key === resKey);
    if (!targetRes) return;

    const allSelected = targetRes.permissions.every((p) => selectedPerms.has(p.name));
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      for (const p of targetRes.permissions) {
        if (allSelected) {
          next.delete(p.name);
        } else {
          next.add(p.name);
        }
      }
      return next;
    });
  };

  // Filter modules/resources by search query
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return modules;
    const query = searchQuery.toLowerCase().trim();

    return modules
      .map((mod) => {
        const modMatches = mod.name.toLowerCase().includes(query) || mod.key.toLowerCase().includes(query);
        const matchedResources = mod.resources.filter(
          (res) =>
            modMatches ||
            res.name.toLowerCase().includes(query) ||
            res.key.toLowerCase().includes(query) ||
            res.description?.toLowerCase().includes(query)
        );
        return {
          ...mod,
          resources: matchedResources
        };
      })
      .filter((mod) => mod.resources.length > 0);
  }, [modules, searchQuery]);

  const totalPossiblePerms = useMemo(() => {
    let count = 0;
    for (const mod of modules) {
      for (const res of mod.resources) {
        count += res.permissions.length;
      }
    }
    return count;
  }, [modules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Role name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const permissionsPayload = Array.from(selectedPerms).map((permName) => ({
        name: permName,
        scope: permScopes[permName] || scope || 'ALL'
      }));

      if (isEditing && role) {
        await roleService.updateRole(role.id, {
          name: isSystem ? role.name : name.trim(),
          description: description.trim(),
          scope,
          permissions: permissionsPayload
        });
      } else {
        await roleService.createRole({
          name: name.trim(),
          description: description.trim(),
          scope,
          permissions: permissionsPayload
        });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#014582]/10 text-[#014582] flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isEditing ? `Edit Role: ${role?.name}` : 'Create Custom ERP Role'}
              </h2>
              <p className="text-xs text-gray-500">
                Configure granular module, resource, and action permissions with data scoping
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          {error && (
            <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Role Metadata Header Inputs */}
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Role Name {isSystem && <span className="text-amber-600 font-normal">(System Protected)</span>}
              </label>
              <input
                type="text"
                disabled={isSystem}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sales Supervisor, Accounts Officer"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                  isSystem
                    ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-white border-gray-200 focus:ring-2 focus:ring-[#014582] focus:border-transparent'
                } outline-none`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Default Data Scope
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-[#014582] outline-none"
              >
                <option value="ALL">ALL (Company Wide Access)</option>
                <option value="OWN">OWN (Own Records Only)</option>
                <option value="TEAM">TEAM (Manager & Direct Reports)</option>
                <option value="WAREHOUSE">WAREHOUSE (Assigned Warehouses)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief purpose of this role..."
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-[#014582] outline-none"
              />
            </div>
          </div>

          {/* Permission Matrix Controls Toolbar */}
          <div className="px-6 py-3 border-b border-gray-200 bg-white sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter resources or actions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#014582] outline-none"
                />
              </div>

              <span className="text-xs font-medium text-gray-500 ml-2">
                Selected:{' '}
                <strong className="text-[#014582] font-bold">
                  {selectedPerms.size}
                </strong>{' '}
                / {totalPossiblePerms}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <CheckSquare className="w-3.5 h-3.5 text-[#014582]" />
                <span>Select All</span>
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Square className="w-3.5 h-3.5 text-gray-400" />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Matrix Content */}
          <div className="p-6 space-y-6">
            {/* Guidance tip */}
            {!loading && (
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-800">
                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong>How to configure:</strong> Each row is an ERP page/feature (e.g. Journal Entries, Purchase Orders).
                  Tick the action columns for that page. Columns adapt per module (Pay, Transfer, Close, etc. appear where relevant).
                  Use <strong>Select Module</strong> to grant everything in a module at once.
                  Under <strong>Dashboard & Widgets → Module Tile</strong>, control which icons show on the main dashboard.
                  Scope (right) limits data: ALL = company-wide, OWN = their own records.
                </div>
              </div>
            )}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-[#014582]" />
                <p className="text-sm">Loading permission catalog matrix...</p>
              </div>
            ) : filteredModules.length === 0 ? (
              <div className="py-16 text-center text-gray-500 text-sm">
                No matching modules or resources found for &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredModules.map((mod) => {
                const isExpanded = expandedModules[mod.key] ?? true;
                const totalInMod = mod.resources.reduce((acc, r) => acc + r.permissions.length, 0);
                const selectedInMod = mod.resources.reduce(
                  (acc, r) => acc + r.permissions.filter((p) => selectedPerms.has(p.name)).length,
                  0
                );
                const allModSelected = totalInMod > 0 && selectedInMod === totalInMod;

                return (
                  <div
                    key={mod.key}
                    className="border border-gray-200 rounded-xl overflow-hidden shadow-xs bg-white"
                  >
                    {/* Module Accordion Header */}
                    <div
                      onClick={() => toggleExpand(mod.key)}
                      className="px-5 py-3.5 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100/70 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 hover:text-gray-600">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                          )}
                        </span>
                        <div>
                          <span className="text-sm font-bold text-gray-900 tracking-wide uppercase">
                            {mod.name}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">({mod.description})</span>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-gray-200 text-gray-700">
                          {selectedInMod} / {totalInMod}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            allModSelected
                              ? handleClearModule(mod.key)
                              : handleSelectModule(mod.key)
                          }
                          className="text-xs font-semibold text-[#014582] hover:text-[#013565] px-2 py-1 rounded hover:bg-[#014582]/5"
                        >
                          {allModSelected ? 'Clear Module' : 'Select Module'}
                        </button>
                      </div>
                    </div>

                    {/* Module Matrix Table */}
                    {isExpanded && (() => {
                      const actionCols = actionColumnsForModule(mod);
                      return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-100/60 border-b border-gray-200 text-gray-600 font-semibold uppercase">
                            <tr>
                              <th className="py-2.5 px-4 min-w-[220px]">Page / Feature</th>
                              {actionCols.map((col) => (
                                <th
                                  key={col.key}
                                  className="py-2.5 px-3 text-center min-w-[70px] tracking-wider"
                                >
                                  {col.label}
                                </th>
                              ))}
                              <th className="py-2.5 px-4 min-w-[140px] text-right">Data Scope</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {mod.resources.map((res) => {
                              const permMapByAction = new Map(
                                res.permissions.map((p) => [p.action, p])
                              );
                              const allResSelected = res.permissions.every((p) =>
                                selectedPerms.has(p.name)
                              );

                              return (
                                <tr
                                  key={res.key}
                                  className="hover:bg-blue-50/30 transition-colors"
                                >
                                  {/* Resource Title & Row toggle */}
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleToggleResource(mod.key, res.key)
                                        }
                                        title={allResSelected ? 'Clear row' : 'Select row'}
                                        className="text-gray-400 hover:text-[#014582] p-0.5 rounded"
                                      >
                                        {allResSelected ? (
                                          <CheckSquare className="w-4 h-4 text-[#014582]" />
                                        ) : (
                                          <Square className="w-4 h-4 text-gray-300" />
                                        )}
                                      </button>
                                      <div>
                                        <p className="font-semibold text-gray-800 text-xs">
                                          {res.name}
                                        </p>
                                        {res.description && (
                                          <p className="text-[11px] text-gray-400 line-clamp-1">
                                            {res.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Action Checkboxes */}
                                  {actionCols.map((col) => {
                                    const actionPerm = permMapByAction.get(col.key);
                                    if (!actionPerm) {
                                      return (
                                        <td
                                          key={col.key}
                                          className="py-3 px-3 text-center text-gray-300"
                                        >
                                          <span className="text-gray-200 select-none">—</span>
                                        </td>
                                      );
                                    }

                                    const isChecked = selectedPerms.has(actionPerm.name);

                                    return (
                                      <td
                                        key={col.key}
                                        className="py-3 px-3 text-center"
                                      >
                                        <label className="inline-flex items-center justify-center p-1 rounded hover:bg-gray-100 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() =>
                                              handleTogglePerm(actionPerm.name)
                                            }
                                            className="w-4 h-4 rounded border-gray-300 text-[#014582] focus:ring-[#014582]"
                                          />
                                        </label>
                                      </td>
                                    );
                                  })}

                                  {/* Data Scope Dropdown for resource */}
                                  <td className="py-3 px-4 text-right">
                                    {res.scopes && res.scopes.length > 1 ? (
                                      <select
                                        value={
                                          permScopes[`${mod.key}.${res.key}.view`] ||
                                          scope ||
                                          'ALL'
                                        }
                                        onChange={(e) => {
                                          const newScope = e.target.value;
                                          setPermScopes((prev) => {
                                            const updated = { ...prev };
                                            for (const p of res.permissions) {
                                              updated[p.name] = newScope;
                                            }
                                            return updated;
                                          });
                                        }}
                                        className="text-xs px-2 py-1 rounded border border-gray-200 bg-white text-gray-700 outline-none"
                                      >
                                        {res.scopes.map((s) => (
                                          <option key={s} value={s}>
                                            {s}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <span className="text-[11px] text-gray-400">
                                        Company-wide
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      );
                    })()}
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between sticky bottom-0 z-10">
            <div className="text-xs text-gray-600">
              <span className="font-semibold text-gray-800">
                {selectedPerms.size}
              </span>{' '}
              permissions assigned to this role
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 bg-[#014582] hover:bg-[#013565] text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isEditing ? 'Save Role Changes' : 'Create Role'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
