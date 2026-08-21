'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft, Search, Plus, Edit, Trash2, Eye, Users,
  User, Mail, Phone, Building2, MapPin, Tag,
  ChevronDown, ChevronLeft, ChevronRight, Loader2,
  X, Save, AlertCircle, CheckCircle, Clock,
  Star, DollarSign, ShoppingBag, TrendingUp,
  FileText, RefreshCw, Settings
} from 'lucide-react';
import { customerService, Customer } from '../../api/customer/route';

function CustomerListView({
  customers,
  loading,
  searchTerm,
  setSearchTerm,
  onAdd,
  onEdit,
  onDelete,
  onView,
  pagination,
  onPageChange,
  onRefresh,
  selectedType,
  setSelectedType,
  selectedStatus,
  setSelectedStatus
}: {
  customers: Customer[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  onAdd: () => void;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onView: (customer: Customer) => void;
  pagination: any;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  selectedType: string;
  setSelectedType: (val: string) => void;
  selectedStatus: string;
  setSelectedStatus: (val: string) => void;
}) {
  const pathname = usePathname();
  const backHref = pathname.startsWith('/sales')
    ? '/sales/dashboard'
    : '/warehouse/dashboard';

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Inactive': return 'bg-gray-100 text-gray-700';
      case 'Blocked': return 'bg-red-100 text-red-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Individual': return 'bg-blue-100 text-blue-700';
      case 'Business': return 'bg-purple-100 text-purple-700';
      case 'Wholesale': return 'bg-orange-100 text-orange-700';
      case 'Distributor': return 'bg-indigo-100 text-indigo-700';
      case 'Retailer': return 'bg-pink-100 text-pink-700';
      case 'Manufacturer': return 'bg-teal-100 text-teal-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const typeOptions = ['All', 'Individual', 'Business', 'Wholesale', 'Distributor', 'Retailer', 'Manufacturer'];
  const statusOptions = ['All', 'Active', 'Inactive', 'Blocked', 'Pending'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={backHref} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#014582]" />
            Customers
            <span className="text-sm font-normal text-gray-400 ml-2">
              ({pagination?.total || 0} customers)
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/warehouse/customer-settings"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-[#014582] transition-all"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <button
            onClick={onRefresh}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all shadow-lg shadow-[#014582]/25"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
            />
          </div>
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            >
              {typeOptions.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Spent</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
                    <p className="mt-2 text-gray-500">Loading customers...</p>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium text-gray-500">No customers found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer._id || customer.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div>
                        <p className="font-medium text-gray-800">{customer.name}</p>
                        <p className="text-xs text-gray-400">{customer.customerNumber}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getTypeColor(customer.customerType)}`}>
                        {customer.customerType}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="space-y-0.5">
                        {customer.email && (
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {customer.email}
                          </p>
                        )}
                        {customer.phone && (
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {customer.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="text-sm font-semibold text-gray-700">
                        {customer.totalOrders || 0}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm font-semibold text-gray-700">
                        Rs. {(customer.totalSpent || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(customer.status)}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onView(customer)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(customer)}
                          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(customer._id || customer.id!)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} –{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} customers
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 bg-[#014582]/10 text-[#014582] font-semibold rounded-lg">
              {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// CUSTOMER FORM MODAL (Consistent with other modals)
// ============================================================
function CustomerFormModal({
  initialData,
  onSave,
  onCancel,
  saving
}: {
  initialData?: Partial<Customer>;
  onSave: (data: Partial<Customer>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    company: '',
    customerType: 'Individual',
    taxId: '',
    address: { street: '', city: '', state: '', postalCode: '', country: 'Pakistan' },
    status: 'Active',
    notes: '',
    tags: [],
    ...initialData
  });

  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('Customer name is required');
      return;
    }
    setError('');
    onSave(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const title = initialData?._id || initialData?.id ? 'Edit Customer' : 'Add Customer';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#014582]/10 rounded-lg">
              <User className="w-5 h-5 text-[#014582]" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-gray-200 rounded-lg transition-all">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={formData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="+92-300-1234567"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Company name"
                    value={formData.company || ''}
                    onChange={(e) => handleChange('company', e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Customer Type</label>
                <select
                  value={formData.customerType || 'Individual'}
                  onChange={(e) => handleChange('customerType', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                >
                  <option value="Individual">Individual</option>
                  <option value="Business">Business</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Distributor">Distributor</option>
                  <option value="Retailer">Retailer</option>
                  <option value="Manufacturer">Manufacturer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tax ID</label>
                <input
                  type="text"
                  placeholder="Tax ID / GST Number"
                  value={formData.taxId || ''}
                  onChange={(e) => handleChange('taxId', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                />
              </div>
            </div>

            {/* Address */}
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Street</label>
                  <input
                    type="text"
                    placeholder="Street address"
                    value={formData.address?.street || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...(prev.address || {}), street: e.target.value }
                    }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
                  <input
                    type="text"
                    placeholder="City"
                    value={formData.address?.city || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...(prev.address || {}), city: e.target.value }
                    }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">State</label>
                  <input
                    type="text"
                    placeholder="State"
                    value={formData.address?.state || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...(prev.address || {}), state: e.target.value }
                    }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Postal Code</label>
                  <input
                    type="text"
                    placeholder="Postal code"
                    value={formData.address?.postalCode || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...(prev.address || {}), postalCode: e.target.value }
                    }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Country</label>
                  <input
                    type="text"
                    placeholder="Country"
                    value={formData.address?.country || 'Pakistan'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...(prev.address || {}), country: e.target.value }
                    }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="border-t border-gray-100 pt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
              <select
                value={formData.status || 'Active'}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Blocked">Blocked</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            {/* Notes */}
            <div className="border-t border-gray-100 pt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
              <textarea
                rows={2}
                placeholder="Additional notes..."
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 resize-none"
              />
            </div>

            {/* Tags */}
            <div className="border-t border-gray-100 pt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tags</label>
              <input
                type="text"
                placeholder="e.g., VIP, Wholesale, International"
                value={formData.tags?.join(', ') || ''}
                onChange={(e) => handleChange('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              />
              <p className="text-xs text-gray-400 mt-1">Comma separated values</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all flex items-center gap-2 shadow-lg shadow-[#014582]/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {initialData?._id || initialData?.id ? 'Update Customer' : 'Save Customer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CUSTOMER DETAIL VIEW
// ============================================================
function CustomerDetailView({
  customer,
  onClose,
  onEdit,
  onRefresh
}: {
  customer: Customer;
  onClose: () => void;
  onEdit: () => void;
  onRefresh: () => void;
}) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const response = await customerService.getCustomerOrders(customer._id || customer.id!, { limit: 5 });
        setOrders(response.data || []);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [customer]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Inactive': return 'bg-gray-100 text-gray-700';
      case 'Blocked': return 'bg-red-100 text-red-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl my-4 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-[#014582]/5 to-transparent">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#014582]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-[#014582]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="font-mono text-xs font-bold text-[#014582] bg-[#014582]/10 px-2 py-0.5 rounded">
                  {customer.customerNumber}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getStatusColor(customer.status)}`}>
                  {customer.status}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">{customer.customerType}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#014582] text-white text-sm font-semibold rounded-lg hover:bg-[#01366a] transition-all"
            >
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
          {[
            { label: 'Total Orders', value: customer.totalOrders || 0, icon: ShoppingBag, color: 'text-blue-600' },
            { label: 'Total Spent', value: `Rs. ${(customer.totalSpent || 0).toLocaleString()}`, icon: DollarSign, color: 'text-green-600' },
            { label: 'Avg Order Value', value: `Rs. ${(customer.averageOrderValue || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-purple-600' },
            { label: 'Loyalty Points', value: customer.loyaltyPoints || 0, icon: Star, color: 'text-orange-600' }
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="px-5 py-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span className="text-xs text-gray-400 font-medium">{label}</span>
              </div>
              <p className={`text-base font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Info */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Information</h4>
              {customer.email && (
                <div className="flex items-center gap-2 py-2 border-b border-gray-50">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2 py-2 border-b border-gray-50">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{customer.phone}</span>
                </div>
              )}
              {customer.company && (
                <div className="flex items-center gap-2 py-2 border-b border-gray-50">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{customer.company}</span>
                </div>
              )}
              {customer.taxId && (
                <div className="flex items-center gap-2 py-2 border-b border-gray-50">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Tax ID: {customer.taxId}</span>
                </div>
              )}
            </div>

            {/* Address */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Address</h4>
              {customer.address?.street || customer.address?.city ? (
                <div className="flex items-start gap-2 py-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    {customer.address?.street && <p className="text-sm text-gray-700">{customer.address.street}</p>}
                    {customer.address?.city && (
                      <p className="text-sm text-gray-700">
                        {customer.address.city}
                        {customer.address.state && `, ${customer.address.state}`}
                      </p>
                    )}
                    {(customer.address?.postalCode || customer.address?.country) && (
                      <p className="text-sm text-gray-700">
                        {customer.address?.postalCode} {customer.address?.country}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No address provided</p>
              )}
            </div>

            {/* Tags */}
            {customer.tags && customer.tags.length > 0 && (
              <div className="col-span-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {customer.tags.map((tag, index) => (
                    <span key={index} className="text-xs bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders */}
            <div className="col-span-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Orders</h4>
              {loadingOrders ? (
                <div className="text-center py-4">
                  <Loader2 className="w-6 h-6 mx-auto text-[#014582] animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <p className="text-sm text-gray-400">No orders found</p>
              ) : (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{order.orderNumber}</p>
                        <p className="text-xs text-gray-400">
                          {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-700">Rs. {order.grandTotal?.toLocaleString()}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [pagination, setPagination] = useState({
    page: 1, limit: 20, total: 0, pages: 0, hasNext: false, hasPrev: false
  });
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await customerService.getCustomers({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        type: selectedType !== 'All' ? selectedType : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined
      });
      setCustomers(response.data || []);
      setPagination(response.pagination);
    } catch (error: any) {
      console.error('Failed to fetch customers:', error);
      alert(error.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, searchTerm, selectedType, selectedStatus]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAddClick = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };

  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setViewingCustomer(null);
    setShowForm(true);
  };

  const handleViewClick = (customer: Customer) => {
    setViewingCustomer(customer);
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await customerService.deleteCustomer(id);
      fetchCustomers();
    } catch (error: any) {
      alert(error.message || 'Failed to delete customer');
    }
  };

  const handleSave = async (data: Partial<Customer>) => {
    setSaving(true);
    try {
      if (data._id || data.id) {
        await customerService.updateCustomer(data._id || data.id!, data);
      } else {
        await customerService.createCustomer(data);
      }
      setShowForm(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (error: any) {
      alert(error.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleSearch = (val: string) => {
    setSearchTerm(val);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {viewingCustomer && (
        <CustomerDetailView
          customer={viewingCustomer}
          onClose={() => setViewingCustomer(null)}
          onEdit={() => handleEditClick(viewingCustomer)}
          onRefresh={fetchCustomers}
        />
      )}

      {showForm && (
        <CustomerFormModal
          initialData={editingCustomer || undefined}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingCustomer(null);
          }}
          saving={saving}
        />
      )}

      <CustomerListView
        customers={customers}
        loading={loading}
        searchTerm={searchTerm}
        setSearchTerm={handleSearch}
        onAdd={handleAddClick}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onView={handleViewClick}
        pagination={pagination}
        onPageChange={handlePageChange}
        onRefresh={fetchCustomers}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
      />
    </div>
  );
}