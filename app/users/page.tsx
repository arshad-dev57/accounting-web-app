'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronDown,
  UserPlus,
  Shield,
  Mail,
  Phone,
  Building2,
  Calendar,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Key,
  Lock,
  Unlock,
  Settings,
  LogOut,
  Loader2,
  Eye,
  CreditCard,
  MapPin,
} from 'lucide-react';
import { usersService } from './service';
import { User, Role } from './types';
import UserFormModal from './UserFormModal';
import { BrandHeader, TopBarBrand } from '../../components/BrandHeader';
import AppBreadcrumbs from '../../components/AppBreadcrumbs';
import { performLogout } from '../../lib/auth-logout';
import { useRouter } from 'next/navigation';

export default function UsersDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');
  
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [usersResponse, rolesResponse] = await Promise.all([
        usersService.getUsers(),
        usersService.getRoles(),
      ]);
      
      setUsers(usersResponse.data);
      setRoles(rolesResponse.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (user.phone?.includes(searchQuery) ?? false);
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const [permissions, setPermissions] = useState([
    {
      id: 1,
      module: 'Accounting',
      permissions: ['View', 'Create', 'Edit', 'Delete'],
      roles: ['Admin', 'Manager']
    },
    {
      id: 2,
      module: 'Warehouse',
      permissions: ['View', 'Create', 'Edit', 'Delete'],
      roles: ['Admin', 'Manager']
    },
    {
      id: 3,
      module: 'Sales',
      permissions: ['View', 'Create', 'Edit', 'Delete'],
      roles: ['Admin', 'Manager']
    },
    {
      id: 4,
      module: 'Purchases',
      permissions: ['View', 'Create'],
      roles: ['Admin', 'Manager']
    },
    {
      id: 5,
      module: 'Users',
      permissions: ['View', 'Create', 'Edit', 'Delete'],
      roles: ['Admin']
    },
    {
      id: 6,
      module: 'POS',
      permissions: ['View', 'Create', 'Edit', 'Delete'],
      roles: ['Admin', 'Manager', 'Cashier']
    },
  ]);

  // Module permissions state
  const [modulePermissions, setModulePermissions] = useState({
    accounting: { hasAccess: false, canView: false },
    warehouse: { hasAccess: false, canView: false },
    sales: { hasAccess: false, canView: false },
    purchases: { hasAccess: false, canView: false },
    users: { hasAccess: false, canView: false },
    pos: { hasAccess: false, canView: false },
  });

  // Sub-page permissions state
  const [subPagePermissions, setSubPagePermissions] = useState<Record<string, Record<string, boolean>>>({});

  // Module sub-pages data
  const moduleSubPages: Record<string, string[]> = {
    pos: [
      'Register',
      'Management'
    ],
    sales: [
      'Dashboard',
      'Products',
      'Orders',
      'Quotations',
      'Customers',
      'Deliveries',
      'Invoices',
      'Sales Payments',
      'Sales Returns',
      'Refunds',
    ],
    purchases: [
      'Dashboard',
      'Purchase Orders',
      'Suppliers',
      'Goods Receiving',
      'Purchase Invoices',
      'Purchase Payments',
      'Purchase Returns',
    ],
    warehouse: [
      'Products',
      'Categories',
      'Suppliers',
      'Stock-Movement',
      'Customers',
      'Orders',
      'Returns',
      'Refunds',
    ],
    accounting: [
      'Dashboard',
      'Chart of Accounts',
      'Bank Accounts',
      'Invoices',
      'Payments',
      'Payments Received',
      'Payments Made',
      'Accounts Receivable',
      'Accounts Payable',
      'Credit Notes',
      'Bills',
      'Expenses',
      'Revenue',
      'Income',
      'Journal Entries',
      'General Ledger',
      'Trial Balance',
      'Fixed Assets',
      'Loans & Borrowings',
      'Capital & Equity',
      'Balance Sheet',
      'Profit & Loss',
      'Cash Flow',
      'Aged Receivables',
    ],
  };

  const handleSelectUser = (user: User) => {
    console.log('🔍 [handleSelectUser] User selected:', user);
    console.log('🔍 [handleSelectUser] User permissions:', user.permissions);
    
    setSelectedUser(user);
    setSelectedModule(null);
    
    // Reset permissions
    setModulePermissions({
      accounting: { hasAccess: false, canView: false },
      warehouse: { hasAccess: false, canView: false },
      sales: { hasAccess: false, canView: false },
      purchases: { hasAccess: false, canView: false },
      users: { hasAccess: false, canView: false },
      pos: { hasAccess: false, canView: false },
    });
    
    // Initialize sub-page permissions for all modules
    const newSubPagePerms: Record<string, Record<string, boolean>> = {};
    Object.keys(moduleSubPages).forEach(module => {
      newSubPagePerms[module] = {};
      moduleSubPages[module].forEach(subPage => {
        newSubPagePerms[module][subPage] = false;
      });
    });
    
    // Load user's existing permissions
    if (user.permissions && user.permissions.length > 0) {
      console.log('🔄 [handleSelectUser] Loading existing permissions...');
      const newPermissions = { ...modulePermissions };
      
      user.permissions.forEach((perm) => {
        console.log('📋 [handleSelectUser] Processing permission:', perm);
        
        const page = perm.page.toLowerCase();
        
        // Check if this is a module-level permission
        const moduleKey = page as keyof typeof newPermissions;
        if (newPermissions[moduleKey]) {
          console.log('✅ [handleSelectUser] Module-level permission found:', moduleKey);
          newPermissions[moduleKey] = {
            hasAccess: perm.canView,
            canView: perm.canView,
          };
        }
        
        // Check if this is a sub-page permission (format: module-subpage)
        const subPageMatch = page.match(/^(\w+)-(.+)$/);
        if (subPageMatch) {
          const [, module, subPageSlug] = subPageMatch;
          console.log('🔍 [handleSelectUser] Sub-page permission detected:', { module, subPageSlug });
          
          // Find the matching sub-page name
          if (moduleSubPages[module]) {
            const matchingSubPage = moduleSubPages[module].find(sp => 
              sp.toLowerCase().replace(/\s+/g, '-') === subPageSlug
            );
            
            if (matchingSubPage && newSubPagePerms[module]) {
              console.log('✅ [handleSelectUser] Setting sub-page permission:', { module, subPage: matchingSubPage, canView: perm.canView });
              newSubPagePerms[module][matchingSubPage] = perm.canView;
            }
          }
        }
      });
      
      console.log('📊 [handleSelectUser] Final module permissions:', newPermissions);
      console.log('📊 [handleSelectUser] Final sub-page permissions:', newSubPagePerms);
      
      setModulePermissions(newPermissions);
      setSubPagePermissions(newSubPagePerms);
    } else {
      console.log('📌 [handleSelectUser] No permissions found for user');
      setSubPagePermissions(newSubPagePerms);
    }
  };

  const handleModuleClick = (module: string) => {
    setSelectedModule(module);
    
    // Initialize sub-page permissions for this module if not already set
    if (!subPagePermissions[module]) {
      setSubPagePermissions(prev => ({
        ...prev,
        [module]: moduleSubPages[module].reduce((acc, page) => {
          acc[page] = false;
          return acc;
        }, {} as Record<string, boolean>),
      }));
    }
  };

  const handleSubPagePermissionChange = (module: string, subPage: string, value: boolean) => {
    setSubPagePermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [subPage]: value,
      },
    }));
  };

  const handleBackToModules = () => {
    setSelectedModule(null);
  };

  const handleModuleAccessChange = (module: string, hasAccess: boolean) => {
    setModulePermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module as keyof typeof prev],
        hasAccess,
        canView: hasAccess,
      },
    }));
  };

  const handlePermissionChange = (module: string, permission: string, value: boolean) => {
    setModulePermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module as keyof typeof prev],
        [permission]: value,
        hasAccess: value,
      },
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    
    try {
      // Combine module-level and sub-page permissions
      const permissionsArray: any[] = [];
      
      // Add module-level permissions
      Object.entries(modulePermissions).forEach(([page, perms]) => {
        if (perms.hasAccess) {
          permissionsArray.push({
            id: `${selectedUser.id}-${page}`,
            page,
            canView: perms.canView,
            canCreate: false,
            canEdit: false,
            canDelete: false,
          });
        }
      });
      
      // Add sub-page permissions
      Object.entries(subPagePermissions).forEach(([module, subPages]) => {
        Object.entries(subPages).forEach(([subPage, canView]) => {
          if (canView) {
            permissionsArray.push({
              id: `${selectedUser.id}-${module}-${subPage}`,
              page: `${module}-${subPage.toLowerCase().replace(/\s+/g, '-')}`,
              canView: true,
              canCreate: false,
              canEdit: false,
              canDelete: false,
            });
          }
        });
      });

      await usersService.updateUserPermissions(selectedUser.id, permissionsArray);
      alert('Permissions saved successfully');
      await loadData();
    } catch (error: any) {
      alert('Failed to save permissions: ' + error.message);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />;
  };

  return (
    <>
      {/* Sidebar */}
      <div className="w-64 h-screen bg-[#1a1a2e] text-white flex flex-col shadow-xl flex-shrink-0 fixed left-0 top-0">
        <BrandHeader subtitle="Users Module" />

        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-3">
            MENU
          </p>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              activeTab === 'users'
                ? 'bg-[#ff6b6b]/20 text-[#ff9999]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Users</span>
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              activeTab === 'permissions'
                ? 'bg-[#ff6b6b]/20 text-[#ff9999]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Key className="w-4 h-4" />
            <span className="text-sm font-medium">Permissions</span>
          </button>

          <button
            type="button"
            onClick={() => router.push('/plans')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-white/60 hover:text-white hover:bg-white/5"
          >
            <CreditCard className="w-4 h-4" />
            <span className="text-sm font-medium">Subscription Plans</span>
          </button>
        </div>

        <div className="px-3 pb-6 flex-shrink-0 space-y-1">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-white/40 hover:text-white/60 hover:bg-white/5 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5 rotate-180" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => void performLogout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-white/40 hover:text-red-300 hover:bg-white/5 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <TopBarBrand title={activeTab === 'users' ? 'Users' : 'Permissions'} />
              <p className="text-sm text-gray-500 mt-1">
                {activeTab === 'users' ? 'Manage user accounts and access' : 'Configure module permissions and roles'}
              </p>
            </div>
            {activeTab === 'users' && (
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setFormOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg hover:bg-[#6c3ae8] transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            )}
          </div>
        </header>

        <AppBreadcrumbs extra={activeTab === 'users' ? [] : [{ label: 'Permissions' }]} />

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
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
                  className="mt-4 px-4 py-2 bg-[#014582] text-white rounded-lg hover:bg-[#6c3ae8] transition-all"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : activeTab === 'users' ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{users.length}</p>
                    <p className="text-sm text-gray-500">Total Users</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{users.filter(u => u.isActive).length}</p>
                    <p className="text-sm text-gray-500">Active Users</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{users.filter(u => u.role === 'admin').length}</p>
                    <p className="text-sm text-gray-500">Admins</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{roles.length}</p>
                    <p className="text-sm text-gray-500">Roles</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="user">User</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Locations</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#014582] rounded-full flex items-center justify-center text-white font-bold">
                              {user.firstName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{user.firstName} {user.lastName}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Mail className="w-3 h-3" />
                                <span>{user.email}</span>
                              </div>
                              {user.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
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
                          {user.role === 'admin' || user.role === 'owner' || user.role === 'superadmin' ? (
                            <span className="text-xs text-gray-500">All locations</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {(user.locations || []).length === 0 ? (
                                <span className="text-xs text-amber-600">None assigned</span>
                              ) : (
                                (user.locations || []).map((loc) => (
                                  <span
                                    key={loc.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-sky-50 text-sky-700"
                                  >
                                    <MapPin className="w-3 h-3" />
                                    {loc.name}
                                  </span>
                                ))
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.isActive)}`}>
                            {getStatusIcon(user.isActive)}
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUser(user);
                                setFormOpen(true);
                              }}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-gray-600" />
                            </button>
                            <button className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="More">
                              <MoreVertical className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No users found</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* User Selection */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
                  <select
                    value={selectedUser?.id || ''}
                    onChange={(e) => {
                      const user = users.find(u => u.id === e.target.value);
                      if (user) handleSelectUser(user);
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                  >
                    <option value="">Choose a user...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedUser && (
                  <button
                    onClick={handleSavePermissions}
                    className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg hover:bg-[#6c3ae8] transition-all mt-6"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Save Permissions</span>
                  </button>
                )}
              </div>
            </div>

            {!selectedUser ? (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <Key className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No User Selected</h3>
                <p className="text-gray-500">Please select a user from the dropdown above to manage their permissions</p>
              </div>
            ) : (
              <>
                {/* Selected User Info */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#014582] rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {selectedUser.firstName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{selectedUser.firstName} {selectedUser.lastName}</h3>
                      <p className="text-sm text-gray-500">{selectedUser.email} • Role: {selectedUser.role}</p>
                    </div>
                  </div>
                </div>

                {/* Module Permissions */}
                {!selectedModule ? (
                  <div className="space-y-4">
                    {Object.entries(modulePermissions).map(([module, perms]) => (
                      <div 
                        key={module} 
                        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleModuleClick(module)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={`access-${module}`}
                              checked={perms.hasAccess}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleModuleAccessChange(module, e.target.checked);
                              }}
                              className="w-5 h-5 rounded border-gray-300 text-[#014582] focus:ring-[#014582]"
                            />
                            <label htmlFor={`access-${module}`} className="font-semibold text-gray-800 capitalize">
                              {module}
                            </label>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${perms.hasAccess ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {perms.hasAccess ? 'Access Granted' : 'No Access'}
                            </span>
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Back Button */}
                    <button
                      onClick={handleBackToModules}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <ChevronDown className="w-5 h-5 rotate-90" />
                      <span className="font-medium">Back to Modules</span>
                    </button>

                    {/* Module Header */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <h2 className="text-2xl font-bold text-gray-800 capitalize mb-2">{selectedModule}</h2>
                      <p className="text-gray-500">Configure sub-page permissions for {selectedModule}</p>
                    </div>

                    {/* Sub-page Permissions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="divide-y divide-gray-200">
                        {moduleSubPages[selectedModule]?.map((subPage) => (
                          <div key={subPage} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id={`subpage-${selectedModule}-${subPage}`}
                                checked={subPagePermissions[selectedModule]?.[subPage] || false}
                                onChange={(e) => handleSubPagePermissionChange(selectedModule, subPage, e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-[#014582] focus:ring-[#014582]"
                              />
                              <label htmlFor={`subpage-${selectedModule}-${subPage}`} className="font-medium text-gray-800">
                                {subPage}
                              </label>
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${subPagePermissions[selectedModule]?.[subPage] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {subPagePermissions[selectedModule]?.[subPage] ? 'Allowed' : 'Denied'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
        </div>
      </div>
      <UserFormModal
        open={formOpen}
        user={editingUser}
        onClose={() => {
          setFormOpen(false);
          setEditingUser(null);
        }}
        onSaved={loadData}
      />
    </>
  );
}
