'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Plus,
  Search,
  Users,
  Copy,
  Trash2,
  Edit,
  Key,
  CreditCard,
  LogOut,
  Loader2,
  Lock,
  Layers,
  Info,
  X,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { BrandHeader, TopBarBrand } from '@/components/BrandHeader';
import { CollapsibleSidebar, SidebarMain } from '@/components/CollapsibleSidebar';
import AppBreadcrumbs from '@/components/AppBreadcrumbs';
import GlobalSearch from '@/components/GlobalSearch';
import CompanySwitcher from '@/components/CompanySwitcher';
import ProfileDropdown from '@/components/ProfileDropdown';
import { performLogout } from '@/lib/auth-logout';
import { SUBSCRIPTION_PURCHASE_UI_ENABLED } from '@/lib/subscription-ui';
import { useCompanyOptional } from '@/lib/company-context';
import { useSidebarCollapsed } from '@/lib/sidebar-collapse';
import { roleService, RoleRecord } from '../role-service';
import RoleMatrixModal from '../RoleMatrixModal';

export default function RolesManagementPage() {
  const router = useRouter();
  const companyCtx = useCompanyOptional();
  const { collapsed } = useSidebarCollapsed();

  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'system' | 'custom'>('all');

  const [matrixModalOpen, setMatrixModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Inline dialogs — no window.prompt or window.confirm
  const [duplicateDialog, setDuplicateDialog] = useState<{ role: RoleRecord; name: string } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<RoleRecord | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await roleService.getRoles();
      if (res.success && Array.isArray(res.data)) {
        setRoles(res.data);
      } else {
        setRoles([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch roles');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const confirmDuplicate = async () => {
    if (!duplicateDialog || !duplicateDialog.name.trim()) return;
    try {
      setActionLoadingId(duplicateDialog.role.id);
      await roleService.duplicateRole(duplicateDialog.role.id, duplicateDialog.name.trim());
      await loadRoles();
      showToast('success', `Role "${duplicateDialog.name.trim()}" created successfully`);
      setDuplicateDialog(null);
    } catch (err: any) {
      showToast('error', 'Failed to duplicate: ' + (err.message || 'Server error'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog) return;
    try {
      setActionLoadingId(deleteDialog.id);
      await roleService.deleteRole(deleteDialog.id);
      await loadRoles();
      showToast('success', `Role "${deleteDialog.name}" deleted`);
      setDeleteDialog(null);
    } catch (err: any) {
      showToast('error', 'Failed to delete: ' + (err.message || 'Server error'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRoles = useMemo(() => {
    if (!Array.isArray(roles)) return [];
    return roles.filter((r) => {
      if (filterType === 'system' && !r.isSystem) return false;
      if (filterType === 'custom' && r.isSystem) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          r.name?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [roles, filterType, searchQuery]);

  const systemRoles = roles.filter((r) => r.isSystem);
  const customRoles = roles.filter((r) => !r.isSystem);

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
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all bg-[#014582] text-white"
          >
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium sidebar-expanded-only">Roles & Permissions</span>
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
              <TopBarBrand title="Roles & Permissions" />
              <p className="text-sm text-gray-500 mt-1">
                Define access roles for{' '}
                {companyCtx?.activeCompany?.name || 'this company'} — assign them to users via Team Users
              </p>
            </div>

            <div className="flex items-center gap-3">
              <GlobalSearch />
              <CompanySwitcher />
              <ProfileDropdown />

              <button
                type="button"
                onClick={() => {
                  setEditingRole(null);
                  setMatrixModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg hover:bg-[#013565] transition-all font-medium text-sm shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create Role</span>
              </button>
            </div>
          </div>
        </header>

        <AppBreadcrumbs extra={[{ label: 'Roles & Permissions' }]} />

        <div className="p-6 space-y-6">
          {/* How it works */}
          <div className="bg-gradient-to-r from-[#00274d] via-[#014582] to-blue-700 rounded-xl p-5 text-white shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-blue-300 shrink-0" />
              <p className="font-bold text-sm">How Role-Based Access Works</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  step: '1',
                  icon: Shield,
                  title: 'Pick or Create a Role',
                  desc: 'System roles are ready-made. Or click "Create Role" to make a custom one.',
                },
                {
                  step: '2',
                  icon: Key,
                  title: 'Set Permissions',
                  desc: 'Click "Edit Permissions" on any role card to check which actions it can perform.',
                },
                {
                  step: '3',
                  icon: Users,
                  title: 'Assign to a User',
                  desc: 'Go to Team Users, click Edit on a user, and pick this role from the dropdown.',
                },
              ].map(({ step, icon: Icon, title, desc }) => (
                <div key={step} className="flex items-start gap-3 bg-white/10 rounded-lg p-3.5">
                  <div className="w-6 h-6 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {step}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-3.5 h-3.5 text-blue-300" />
                      <p className="text-xs font-semibold">{title}</p>
                    </div>
                    <p className="text-[11px] text-white/65 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{systemRoles.length}</p>
                <p className="text-xs text-gray-500">System Roles</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 text-[#014582] shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{customRoles.length}</p>
                <p className="text-xs text-gray-500">Custom Roles</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {roles.reduce((acc, r) => acc + (r.usersCount || 0), 0)}
                </p>
                <p className="text-xs text-gray-500">Users with Roles</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl p-4 shadow-xs border border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] outline-none"
                />
              </div>

              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium shrink-0">
                {(['all', 'system', 'custom'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilterType(f)}
                    className={`px-3.5 py-2 capitalize transition-colors ${
                      filterType === f
                        ? 'bg-[#014582] text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'system' ? 'System' : 'Custom'}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Showing <strong className="text-gray-900">{filteredRoles.length}</strong> of {roles.length} roles
            </div>
          </div>

          {/* Role Cards */}
          {loading ? (
            <div className="bg-white rounded-xl p-16 text-center border border-gray-100">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#014582]" />
              <p className="text-sm text-gray-500">Loading roles...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 rounded-xl p-6 text-red-700 border border-red-200 text-sm">{error}</div>
          ) : filteredRoles.length === 0 ? (
            <div className="bg-white rounded-xl p-16 text-center border border-gray-100">
              <Shield className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-600 font-semibold">No roles found</p>
              <p className="text-sm text-gray-400 mt-1">Adjust your search or filter, or create a new custom role.</p>
              <button
                type="button"
                onClick={() => { setEditingRole(null); setMatrixModalOpen(true); }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Create Custom Role
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredRoles.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col"
                >
                  {/* Card header */}
                  <div
                    className={`px-5 py-4 flex items-start gap-3 border-b ${
                      r.isSystem ? 'bg-amber-50/60 border-amber-100' : 'bg-blue-50/30 border-blue-100'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-lg shrink-0 ${
                        r.isSystem ? 'bg-amber-100 text-amber-700' : 'bg-[#014582]/10 text-[#014582]'
                      }`}
                    >
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-sm leading-snug">{r.name}</h3>
                        {r.isSystem ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
                            <Lock className="w-2.5 h-2.5" /> System
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#014582] border border-blue-200 shrink-0">
                            <Layers className="w-2.5 h-2.5" /> Custom
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {r.description || 'No description provided'}
                      </p>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="px-5 py-3 flex items-center gap-4 text-xs text-gray-600 border-b border-gray-100">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <strong className="text-gray-800">{r.usersCount}</strong>&nbsp;users
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-gray-400" />
                      <strong className="text-gray-800">{r.permissionsCount}</strong>&nbsp;permissions
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {r.scope || 'ALL'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="px-5 py-3.5 flex items-center gap-2 mt-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRole(r);
                        setMatrixModalOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#014582] text-white rounded-lg text-xs font-semibold hover:bg-[#013565] transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      {r.isSystem ? 'View / Edit Permissions' : 'Edit Permissions'}
                    </button>

                    <button
                      type="button"
                      disabled={actionLoadingId === r.id}
                      onClick={() => setDuplicateDialog({ role: r, name: `Copy of ${r.name}` })}
                      className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-40"
                      title="Duplicate this role"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </button>

                    {!r.isSystem && (
                      <button
                        type="button"
                        disabled={actionLoadingId === r.id || r.usersCount > 0}
                        onClick={() => r.usersCount === 0 && setDeleteDialog(r)}
                        className={`p-2 rounded-lg transition-colors border ${
                          r.usersCount > 0
                            ? 'opacity-30 cursor-not-allowed border-gray-100 text-gray-400'
                            : 'border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200'
                        }`}
                        title={
                          r.usersCount > 0
                            ? `Cannot delete: ${r.usersCount} user(s) still assigned`
                            : 'Delete this role'
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SidebarMain>

      {/* Role Matrix Modal */}
      <RoleMatrixModal
        open={matrixModalOpen}
        role={editingRole}
        onClose={() => {
          setMatrixModalOpen(false);
          setEditingRole(null);
        }}
        onSaved={() => {
          loadRoles();
          showToast('success', editingRole ? 'Role updated successfully' : 'Role created successfully');
        }}
      />

      {/* Duplicate Role Dialog */}
      {duplicateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#014582]/10 flex items-center justify-center">
                  <Copy className="w-4 h-4 text-[#014582]" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Duplicate Role</h3>
                  <p className="text-xs text-gray-500">Copying from: {duplicateDialog.role.name}</p>
                </div>
              </div>
              <button
                onClick={() => setDuplicateDialog(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="block text-xs font-semibold text-gray-700 mb-1.5">New Role Name</label>
            <input
              type="text"
              value={duplicateDialog.name}
              onChange={(e) =>
                setDuplicateDialog((d) => (d ? { ...d, name: e.target.value } : null))
              }
              onKeyDown={(e) => e.key === 'Enter' && confirmDuplicate()}
              autoFocus
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] outline-none mb-5"
              placeholder="Enter a name for the new role..."
            />

            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDuplicateDialog(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!duplicateDialog.name.trim() || actionLoadingId === duplicateDialog.role.id}
                onClick={confirmDuplicate}
                className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#013565] disabled:opacity-50 transition-colors"
              >
                {actionLoadingId === duplicateDialog.role.id && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Create Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Role?</h3>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  You are about to permanently delete{' '}
                  <strong>&quot;{deleteDialog.name}&quot;</strong>. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteDialog(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoadingId === deleteDialog.id}
                onClick={confirmDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {actionLoadingId === deleteDialog.id && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Delete Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-in fade-in slide-in-from-bottom-3 ${
            toast.type === 'success'
              ? 'bg-white border-emerald-200 text-emerald-800'
              : 'bg-white border-red-200 text-red-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
