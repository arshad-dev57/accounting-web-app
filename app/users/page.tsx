'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  Shield,
  Mail,
  Phone,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  LogOut,
  Loader2,
  CreditCard,
  ArrowRight,
} from 'lucide-react';
import { usersService } from './service';
import { User, Role } from './types';
import UserFormModal from './UserFormModal';
import EffectivePermissionsModal from './EffectivePermissionsModal';
import SubscriptionUpgradeModal from '../../components/SubscriptionUpgradeModal';
import { fetchSubscriptionCapacity } from '../../lib/subscription-service';
import type { SubscriptionCapacity, UpgradeQuote } from '../../lib/subscription-pricing';
import { calculatePrice } from '../../lib/subscription-pricing';
import { BrandHeader, TopBarBrand } from '../../components/BrandHeader';
import { CollapsibleSidebar, SidebarMain } from '../../components/CollapsibleSidebar';
import AppBreadcrumbs from '../../components/AppBreadcrumbs';
import GlobalSearch from '../../components/GlobalSearch';
import { performLogout } from '../../lib/auth-logout';
import { useRouter } from 'next/navigation';
import { SUBSCRIPTION_PURCHASE_UI_ENABLED } from '../../lib/subscription-ui';
import { useCompanyOptional } from '../../lib/company-context';
import { loadUserFromLocal } from '../../lib/permission-service';
import CompanySwitcher from '../../components/CompanySwitcher';
import ProfileDropdown from '../../components/ProfileDropdown';
import { useSidebarCollapsed } from '../../lib/sidebar-collapse';

export default function UsersDashboard() {
  const router = useRouter();
  const companyCtx = useCompanyOptional();
  const { collapsed } = useSidebarCollapsed();

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [effectiveUser, setEffectiveUser] = useState<User | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{
    reason: 'user_seat';
    capacity: SubscriptionCapacity;
    upgrade: UpgradeQuote;
  } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const me = loadUserFromLocal();
      const myId = String(me?.id || '').trim();
      const myEmail = String(me?.email || '').trim().toLowerCase();

      const [usersResponse, rolesResponse] = await Promise.all([
        usersService.getUsers(),
        usersService.getRoles(),
      ]);

      const team = (usersResponse.data || []).filter((u) => {
        if (myId && String(u.id) === myId) return false;
        if (myEmail && String(u.email || '').toLowerCase() === myEmail) return false;
        return true;
      });

      setUsers(team);
      setRoles(rolesResponse.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [companyCtx?.activeCompanyId]);

  useEffect(() => {
    const onCompanyChanged = () => void loadData();
    window.addEventListener('active-company-changed', onCompanyChanged);
    return () => window.removeEventListener('active-company-changed', onCompanyChanged);
  }, []);

  const handleAddUser = async () => {
    try {
      const capRes = await fetchSubscriptionCapacity();
      const capacity = capRes.data;
      if (capacity && !capacity.canAddUser) {
        const upgrade = {
          current: calculatePrice(
            capacity.productTier,
            capacity.billingCycle,
            capacity.licensedUsers,
            capacity.licensedBranches
          ),
          next: calculatePrice(
            capacity.productTier,
            capacity.billingCycle,
            capacity.licensedUsers + 1,
            capacity.licensedBranches
          ),
          delta: 0,
          licensedUsers: capacity.licensedUsers + 1,
          licensedBranches: capacity.licensedBranches,
        };
        upgrade.delta = upgrade.next.amount - upgrade.current.amount;
        setUpgradeModal({ reason: 'user_seat', capacity, upgrade });
        return;
      }
    } catch {
      // proceed if capacity check fails
    }
    setEditingUser(null);
    setFormOpen(true);
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone?.includes(searchQuery) ?? false);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusColor = (isActive: boolean) =>
    isActive ? 'text-green-600 bg-green-100' : 'text-gray-500 bg-gray-100';

  const getStatusIcon = (isActive: boolean) =>
    isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />;

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
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all bg-[#014582] text-white"
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
              <TopBarBrand title="Team Users" />
              <p className="text-sm text-gray-500 mt-1">
                Team members for {companyCtx?.activeCompany?.name || 'this company'} — your own account is hidden
              </p>
            </div>
            <div className="flex items-center gap-3">
              <GlobalSearch />
              <CompanySwitcher />
              <ProfileDropdown />
              <button
                type="button"
                onClick={handleAddUser}
                className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg hover:bg-[#013565] transition-all font-medium text-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            </div>
          </div>
        </header>

        <AppBreadcrumbs extra={[]} />

        <div className="flex-1 p-6 overflow-auto space-y-5">
          {/* Role Assignment hint */}
          <button
            type="button"
            onClick={() => router.push('/users/roles')}
            className="w-full text-left bg-gradient-to-r from-[#014582]/5 to-blue-50 border border-[#014582]/20 rounded-xl px-5 py-3.5 flex items-center justify-between gap-3 hover:border-[#014582]/40 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#014582]/10">
                <Shield className="w-4 h-4 text-[#014582]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#014582]">Manage Roles & Permissions</p>
                <p className="text-xs text-gray-500">Configure what each role can access, then assign roles to users below via Edit</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#014582] group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-[#014582] animate-spin mx-auto" />
                <p className="mt-3 text-sm text-gray-500">Loading users...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-sm text-gray-600">{error}</p>
                <button
                  onClick={loadData}
                  className="mt-4 px-4 py-2 bg-[#014582] text-white rounded-lg hover:bg-[#013565] transition-all text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-xs border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-800">{users.length}</p>
                      <p className="text-xs text-gray-500">Total Users</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-xs border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-800">{users.filter(u => u.isActive).length}</p>
                      <p className="text-xs text-gray-500">Active</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-xs border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-800">{users.filter(u => u.role === 'admin').length}</p>
                      <p className="text-xs text-gray-500">Admins</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-xs border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-800">{roles.length}</p>
                      <p className="text-xs text-gray-500">Roles Available</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-xl p-4 shadow-xs border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none text-sm"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none text-sm"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="user">User</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-[#014582] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {user.firstName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">{user.firstName} {user.lastName}</p>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                  <Mail className="w-3 h-3" />
                                  <span>{user.email}</span>
                                </div>
                                {(user as any).hrEmployee ? (
                                  <div className="text-xs text-[#014582] mt-0.5 font-medium">
                                    {(user as any).hrEmployee.employeeCode}
                                    {(user as any).hrEmployee.designation
                                      ? ` · ${(user as any).hrEmployee.designation}`
                                      : ''}
                                  </div>
                                ) : null}
                                {user.phone && (
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Phone className="w-3 h-3" />
                                    <span>{user.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              <Shield className="w-3 h-3" />
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.isActive)}`}>
                              {getStatusIcon(user.isActive)}
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEffectiveUser(user)}
                                className="p-1.5 hover:bg-blue-50 text-[#014582] rounded-lg transition-colors"
                                title="View Effective Permissions"
                              >
                                <Shield className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUser(user);
                                  setFormOpen(true);
                                }}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                                title="Edit User & Assign Role"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-500"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredUsers.length === 0 && (
                  <div className="text-center py-14">
                    <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      No users found for {companyCtx?.activeCompany?.name || 'this company'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">Click "Add User" to invite someone</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SidebarMain>

      <UserFormModal
        open={formOpen}
        user={editingUser}
        onClose={() => {
          setFormOpen(false);
          setEditingUser(null);
        }}
        onSaved={loadData}
        onUpgradeRequired={(payload) => setUpgradeModal(payload)}
      />
      <EffectivePermissionsModal
        open={!!effectiveUser}
        user={effectiveUser}
        onClose={() => setEffectiveUser(null)}
        onSaved={loadData}
      />
      {upgradeModal && (
        <SubscriptionUpgradeModal
          open
          reason={upgradeModal.reason}
          capacity={upgradeModal.capacity}
          upgrade={upgradeModal.upgrade}
          onClose={() => setUpgradeModal(null)}
          onUpgraded={() => {
            setUpgradeModal(null);
            setEditingUser(null);
            setFormOpen(true);
          }}
        />
      )}
    </>
  );
}
