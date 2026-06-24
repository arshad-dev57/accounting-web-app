'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Search, Edit, Trash2, Eye, Package,
  ChevronDown, X, Save, User, Mail, Phone, MapPin,
  DollarSign, Tag, Truck, Calendar, Loader2,
  CheckCircle, XCircle, Clock, Filter, Download,
  Printer, RefreshCw, Layers, ShoppingCart,
  CreditCard, Receipt, Building2, Hash, Type,
  AlignLeft, Box, Minus, Plus as PlusIcon,
  AlertCircle, Globe, CalendarDays, UserRound,
  FileText, ListChecks, TruckIcon, PackageOpen,
  Shield, BadgePercent, Clock3, UserCheck,
  ClipboardList, Building, Briefcase, PackageCheck,
  Settings, ChevronLeft, ChevronRight, Users,
  UserPlus, UserCheck as UserCheckIcon, UserX,
  Award, Star, StarHalf, ThumbsUp, ThumbsDown,
  HelpCircle, Info, ExternalLink, Upload,
  Image, Paperclip, Send, DownloadCloud,
  Wallet, Banknote, ArrowLeftRight, History,
  TrendingUp, TrendingDown, PieChart, BarChart3,
  Briefcase as BriefcaseIcon, Calendar as CalendarIcon,
  MessageCircle, PhoneCall, Mail as MailIcon,
  Home, Building as BuildingIcon, MapPin as MapPinIcon
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface Customer {
  _id?: string;
  customerNumber: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  customerType: 'Individual' | 'Business' | 'Wholesale' | 'Distributor' | 'Retailer' | 'Manufacturer';
  taxId?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  status: 'Active' | 'Inactive' | 'Blocked' | 'Pending';
  loyaltyPoints?: number;
  totalOrders?: number;
  totalSpent?: number;
  averageOrderValue?: number;
  lastOrderDate?: string;
  notes?: string;
  tags?: string[];
  createdBy?: { _id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}

// ─────────────────────────────────────────────────────────────
// CUSTOMER LIST VIEW
// ─────────────────────────────────────────────────────────────
function CustomerList({ 
  customers, 
  loading, 
  onView, 
  onEdit,
  onAdd,
  pagination,
  onPageChange,
  filters,
  onFilterChange,
  onRefresh,
  stats
}: {
  customers: Customer[];
  loading: boolean;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onAdd: () => void;
  pagination: { page: number; limit: number; total: number; pages: number; hasNext: boolean; hasPrev: boolean };
  onPageChange: (page: number) => void;
  filters: {
    search: string;
    type: string;
    status: string;
    fromDate: string;
    toDate: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onRefresh: () => void;
  stats: {
    total: number;
    active: number;
    inactive: number;
    blocked: number;
    pending: number;
    totalSpent: number;
    totalOrders: number;
  };
}) {
  const typeOptions = ['all', 'Individual', 'Business', 'Wholesale', 'Distributor', 'Retailer', 'Manufacturer'];
  const statusOptions = ['all', 'Active', 'Inactive', 'Blocked', 'Pending'];

  const statusColors: Record<string, string> = {
    Active: 'bg-green-100 text-green-700',
    Inactive: 'bg-gray-100 text-gray-700',
    Blocked: 'bg-red-100 text-red-700',
    Pending: 'bg-yellow-100 text-yellow-700',
  };

  const typeColors: Record<string, string> = {
    Individual: 'bg-purple-100 text-purple-700',
    Business: 'bg-blue-100 text-blue-700',
    Wholesale: 'bg-indigo-100 text-indigo-700',
    Distributor: 'bg-orange-100 text-orange-700',
    Retailer: 'bg-pink-100 text-pink-700',
    Manufacturer: 'bg-cyan-100 text-cyan-700',
  };

  const StatusBadge = ({ status, colors }: { status: string; colors: Record<string, string> }) => (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status || 'N/A'}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#7c4dff]" />
            Customers
            <span className="text-sm font-normal text-gray-400 ml-2">
              ({pagination.total} customers)
            </span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">Manage customer relationships and profiles</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#7c4dff] text-white rounded-lg text-sm font-semibold hover:bg-[#6c3fe0] transition-all shadow-lg shadow-purple-500/25"
          >
            <UserPlus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium">Total Customers</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium">Inactive</p>
          <p className="text-2xl font-bold text-gray-600">{stats.inactive || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium">Blocked</p>
          <p className="text-2xl font-bold text-red-600">{stats.blocked || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium">Total Orders</p>
          <p className="text-2xl font-bold text-[#7c4dff]">{stats.totalOrders || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium">Total Spent</p>
          <p className="text-2xl font-bold text-[#7c4dff]">Rs. {(stats.totalSpent || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium">Avg Order Value</p>
          <p className="text-2xl font-bold text-[#7c4dff]">
            Rs. {stats.totalOrders > 0 ? (stats.totalSpent / stats.totalOrders).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers by name, email, phone..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none"
            />
          </div>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value)}
            className="px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 appearance-none"
          >
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 appearance-none"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Status' : status}
              </option>
            ))}
          </select>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => onFilterChange('fromDate', e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => onFilterChange('toDate', e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto text-[#7c4dff] animate-spin" />
            <p className="mt-2 text-gray-500">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">No customers found</p>
            <p className="text-sm text-gray-400">Click "Add Customer" to create one</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Spent</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#7c4dff]/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-[#7c4dff]" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{customer.name}</p>
                          <p className="text-xs text-gray-400">{customer.customerNumber}</p>
                          {customer.company && (
                            <p className="text-xs text-gray-400">{customer.company}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={customer.customerType} colors={typeColors} />
                    </td>
                    <td className="px-6 py-3">
                      <div className="space-y-0.5">
                        {customer.email && (
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {customer.email}
                          </p>
                        )}
                        {customer.phone && (
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {customer.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {customer.address ? (
                        <div className="text-xs text-gray-600">
                          <p>{customer.address.city || ''}, {customer.address.state || ''}</p>
                          <p>{customer.address.country || ''}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="font-semibold text-gray-700">{customer.totalOrders || 0}</span>
                    </td>
                    <td className="px-6 py-3 font-semibold text-gray-700">
                      Rs. {(customer.totalSpent || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={customer.status} colors={statusColors} />
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onView(customer)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Details"
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {customers.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} customers
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="px-3 py-1 bg-[#7c4dff] text-white rounded-lg">
              {pagination.page}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CREATE/EDIT CUSTOMER MODAL
// ─────────────────────────────────────────────────────────────
function CustomerModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  customer
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void;
  customer?: Customer;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!customer;

  // ─── Customer Data ────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    company: customer?.company || '',
    customerType: customer?.customerType || 'Individual',
    taxId: customer?.taxId || '',
    status: customer?.status || 'Active',
    address: customer?.address || {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Pakistan'
    },
    shippingAddress: customer?.shippingAddress || {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Pakistan'
    },
    billingAddress: customer?.billingAddress || {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Pakistan'
    },
    notes: customer?.notes || '',
    tags: customer?.tags?.join(', ') || '',
    loyaltyPoints: customer?.loyaltyPoints || 0,
  });

  const [sameAsAddress, setSameAsAddress] = useState(true);
  const [sameAsShipping, setSameAsShipping] = useState(true);

  // ─── Handle Submit ────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.name) {
      setError('Customer name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        customerNumber: isEdit ? customer?.customerNumber : `CUST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        billingAddress: sameAsShipping ? formData.shippingAddress : formData.billingAddress,
      };

      console.log('Customer payload:', payload);
      // await customerService.createCustomer(payload);
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#7c4dff]/10 rounded-lg flex items-center justify-center">
              {isEdit ? <Edit className="w-5 h-5 text-[#7c4dff]" /> : <UserPlus className="w-5 h-5 text-[#7c4dff]" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {isEdit ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <p className="text-xs text-gray-400">
                {isEdit ? 'Update customer information' : 'Create a new customer profile'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-all">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-[#7c4dff]" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter customer name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Customer Type
                  </label>
                  <select
                    value={formData.customerType}
                    onChange={(e) => setFormData({ ...formData, customerType: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Business">Business</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Retailer">Retailer</option>
                    <option value="Manufacturer">Manufacturer</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      placeholder="customer@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="+92 300 1234567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Company Name
                  </label>
                  <div className="relative">
                    <BuildingIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Company name"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Tax ID / NTN
                  </label>
                  <input
                    type="text"
                    placeholder="Tax ID"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-[#7c4dff]" />
                Address Information
              </h3>

              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={sameAsAddress}
                  onChange={(e) => setSameAsAddress(e.target.checked)}
                  className="w-4 h-4 text-[#7c4dff] rounded border-gray-300"
                />
                <label className="text-sm text-gray-700">Shipping address same as primary address</label>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={sameAsShipping}
                  onChange={(e) => setSameAsShipping(e.target.checked)}
                  className="w-4 h-4 text-[#7c4dff] rounded border-gray-300"
                />
                <label className="text-sm text-gray-700">Billing address same as shipping address</label>
              </div>

              {/* Primary Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Primary Address</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Street address"
                      value={formData.address.street}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={formData.address.city}
                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={formData.address.state}
                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Postal Code"
                        value={formData.address.postalCode}
                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address, postalCode: e.target.value } })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                      />
                      <select
                        value={formData.address.country}
                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                      >
                        <option>Pakistan</option>
                        <option>China</option>
                        <option>USA</option>
                        <option>UK</option>
                        <option>UAE</option>
                        <option>Turkey</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Shipping Address</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Street address"
                      value={sameAsAddress ? formData.address.street : formData.shippingAddress.street}
                      onChange={(e) => setFormData({ ...formData, shippingAddress: { ...formData.shippingAddress, street: e.target.value } })}
                      disabled={sameAsAddress}
                      className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 ${sameAsAddress ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={sameAsAddress ? formData.address.city : formData.shippingAddress.city}
                        onChange={(e) => setFormData({ ...formData, shippingAddress: { ...formData.shippingAddress, city: e.target.value } })}
                        disabled={sameAsAddress}
                        className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 ${sameAsAddress ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={sameAsAddress ? formData.address.state : formData.shippingAddress.state}
                        onChange={(e) => setFormData({ ...formData, shippingAddress: { ...formData.shippingAddress, state: e.target.value } })}
                        disabled={sameAsAddress}
                        className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 ${sameAsAddress ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Postal Code"
                        value={sameAsAddress ? formData.address.postalCode : formData.shippingAddress.postalCode}
                        onChange={(e) => setFormData({ ...formData, shippingAddress: { ...formData.shippingAddress, postalCode: e.target.value } })}
                        disabled={sameAsAddress}
                        className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 ${sameAsAddress ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      <select
                        value={sameAsAddress ? formData.address.country : formData.shippingAddress.country}
                        onChange={(e) => setFormData({ ...formData, shippingAddress: { ...formData.shippingAddress, country: e.target.value } })}
                        disabled={sameAsAddress}
                        className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 ${sameAsAddress ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <option>Pakistan</option>
                        <option>China</option>
                        <option>USA</option>
                        <option>UK</option>
                        <option>UAE</option>
                        <option>Turkey</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="mt-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Billing Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Street address"
                    value={sameAsShipping ? 
                      (sameAsAddress ? formData.address.street : formData.shippingAddress.street) : 
                      formData.billingAddress.street
                    }
                    onChange={(e) => setFormData({ ...formData, billingAddress: { ...formData.billingAddress, street: e.target.value } })}
                    disabled={sameAsShipping}
                    className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 ${sameAsShipping ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="City"
                      value={sameAsShipping ? 
                        (sameAsAddress ? formData.address.city : formData.shippingAddress.city) : 
                        formData.billingAddress.city
                      }
                      onChange={(e) => setFormData({ ...formData, billingAddress: { ...formData.billingAddress, city: e.target.value } })}
                      disabled={sameAsShipping}
                      className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 ${sameAsShipping ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={sameAsShipping ? 
                        (sameAsAddress ? formData.address.state : formData.shippingAddress.state) : 
                        formData.billingAddress.state
                      }
                      onChange={(e) => setFormData({ ...formData, billingAddress: { ...formData.billingAddress, state: e.target.value } })}
                      disabled={sameAsShipping}
                      className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 ${sameAsShipping ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={sameAsShipping ? 
                        (sameAsAddress ? formData.address.postalCode : formData.shippingAddress.postalCode) : 
                        formData.billingAddress.postalCode
                      }
                      onChange={(e) => setFormData({ ...formData, billingAddress: { ...formData.billingAddress, postalCode: e.target.value } })}
                      disabled={sameAsShipping}
                      className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 ${sameAsShipping ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <select
                      value={sameAsShipping ? 
                        (sameAsAddress ? formData.address.country : formData.shippingAddress.country) : 
                        formData.billingAddress.country
                      }
                      onChange={(e) => setFormData({ ...formData, billingAddress: { ...formData.billingAddress, country: e.target.value } })}
                      disabled={sameAsShipping}
                      className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 ${sameAsShipping ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option>Pakistan</option>
                      <option>China</option>
                      <option>USA</option>
                      <option>UK</option>
                      <option>UAE</option>
                      <option>Turkey</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#7c4dff]" />
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Loyalty Points
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.loyaltyPoints}
                    onChange={(e) => setFormData({ ...formData, loyaltyPoints: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Tags
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., vip, wholesale, premium"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Notes
                </label>
                <textarea
                  placeholder="Additional notes about the customer..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !formData.name}
                className="px-6 py-2.5 bg-[#7c4dff] text-white rounded-lg text-sm font-semibold hover:bg-[#6c3fe0] transition-all flex items-center gap-2 shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isEdit ? 'Update Customer' : 'Create Customer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CUSTOMER DETAILS MODAL
// ─────────────────────────────────────────────────────────────
function CustomerDetailModal({ customer, onClose, onEdit }: { 
  customer: Customer; 
  onClose: () => void;
  onEdit: (customer: Customer) => void;
}) {
  const statusColors: Record<string, string> = {
    Active: 'bg-green-100 text-green-700',
    Inactive: 'bg-gray-100 text-gray-700',
    Blocked: 'bg-red-100 text-red-700',
    Pending: 'bg-yellow-100 text-yellow-700',
  };

  const typeColors: Record<string, string> = {
    Individual: 'bg-purple-100 text-purple-700',
    Business: 'bg-blue-100 text-blue-700',
    Wholesale: 'bg-indigo-100 text-indigo-700',
    Distributor: 'bg-orange-100 text-orange-700',
    Retailer: 'bg-pink-100 text-pink-700',
    Manufacturer: 'bg-cyan-100 text-cyan-700',
  };

  const StatusBadge = ({ status, colors }: { status: string; colors: Record<string, string> }) => (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status || 'N/A'}
    </span>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#7c4dff]/10 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-[#7c4dff]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{customer.name}</h2>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <StatusBadge status={customer.status} colors={statusColors} />
                <StatusBadge status={customer.customerType} colors={typeColors} />
                <span className="text-xs text-gray-400">• {customer.customerNumber}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(customer)}
              className="p-2 hover:bg-yellow-50 hover:text-yellow-600 rounded-lg transition-all"
              title="Edit"
            >
              <Edit className="w-5 h-5 text-gray-400" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-all">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-xs text-gray-400 font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{customer.totalOrders || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-xs text-gray-400 font-medium">Total Spent</p>
              <p className="text-2xl font-bold text-[#7c4dff]">Rs. {(customer.totalSpent || 0).toFixed(2)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-xs text-gray-400 font-medium">Avg Order Value</p>
              <p className="text-2xl font-bold text-[#7c4dff]">
                Rs. {customer.totalOrders > 0 ? (customer.totalSpent / customer.totalOrders).toFixed(2) : '0.00'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-xs text-gray-400 font-medium">Loyalty Points</p>
              <p className="text-2xl font-bold text-yellow-600">{customer.loyaltyPoints || 0}</p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-100 rounded-xl">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MailIcon className="w-4 h-4" /> Contact Information
              </h4>
              <div className="space-y-2">
                {customer.email && (
                  <p className="text-sm text-gray-700 flex items-center gap-2">
                    <MailIcon className="w-4 h-4 text-gray-400" /> {customer.email}
                  </p>
                )}
                {customer.phone && (
                  <p className="text-sm text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" /> {customer.phone}
                  </p>
                )}
                {customer.company && (
                  <p className="text-sm text-gray-700 flex items-center gap-2">
                    <BuildingIcon className="w-4 h-4 text-gray-400" /> {customer.company}
                  </p>
                )}
                {customer.taxId && (
                  <p className="text-sm text-gray-700 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-gray-400" /> Tax ID: {customer.taxId}
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 border border-gray-100 rounded-xl">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {customer.tags && customer.tags.length > 0 ? (
                  customer.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">No tags</span>
                )}
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {customer.address && (
              <div className="p-4 border border-gray-100 rounded-xl">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Home className="w-4 h-4" /> Primary Address
                </h4>
                {customer.address.street && <p className="text-sm text-gray-700">{customer.address.street}</p>}
                {(customer.address.city || customer.address.state) && (
                  <p className="text-sm text-gray-700">
                    {customer.address.city}, {customer.address.state} {customer.address.postalCode}
                  </p>
                )}
                {customer.address.country && (
                  <p className="text-sm text-gray-700">{customer.address.country}</p>
                )}
              </div>
            )}

            {customer.shippingAddress && (
              <div className="p-4 border border-gray-100 rounded-xl">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Shipping Address
                </h4>
                {customer.shippingAddress.street && <p className="text-sm text-gray-700">{customer.shippingAddress.street}</p>}
                {(customer.shippingAddress.city || customer.shippingAddress.state) && (
                  <p className="text-sm text-gray-700">
                    {customer.shippingAddress.city}, {customer.shippingAddress.state} {customer.shippingAddress.postalCode}
                  </p>
                )}
                {customer.shippingAddress.country && (
                  <p className="text-sm text-gray-700">{customer.shippingAddress.country}</p>
                )}
              </div>
            )}

            {customer.billingAddress && (
              <div className="p-4 border border-gray-100 rounded-xl">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Billing Address
                </h4>
                {customer.billingAddress.street && <p className="text-sm text-gray-700">{customer.billingAddress.street}</p>}
                {(customer.billingAddress.city || customer.billingAddress.state) && (
                  <p className="text-sm text-gray-700">
                    {customer.billingAddress.city}, {customer.billingAddress.state} {customer.billingAddress.postalCode}
                  </p>
                )}
                {customer.billingAddress.country && (
                  <p className="text-sm text-gray-700">{customer.billingAddress.country}</p>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          {customer.notes && (
            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Notes
              </h4>
              <p className="text-sm text-gray-700">{customer.notes}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-gray-400 border-t border-gray-100 pt-4 flex justify-between">
            <span>Created: {customer.createdAt ? new Date(customer.createdAt).toLocaleString() : 'N/A'}</span>
            {customer.createdBy && (
              <span>Created By: {typeof customer.createdBy === 'object' ? customer.createdBy.name : customer.createdBy}</span>
            )}
            <span>Updated: {customer.updatedAt ? new Date(customer.updatedAt).toLocaleString() : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ─── Pagination ────────────────────────────────────────────
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
    hasNext: false,
    hasPrev: false
  });

  // ─── Stats ─────────────────────────────────────────────────
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    blocked: 0,
    pending: 0,
    totalSpent: 0,
    totalOrders: 0
  });

  // ─── Filters ──────────────────────────────────────────────
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
    fromDate: '',
    toDate: ''
  });

  // ─── Mock Data ─────────────────────────────────────────────
  useEffect(() => {
    const mockCustomers: Customer[] = [
      {
        _id: '1',
        customerNumber: 'CUST-20260624-0001',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+92 300 1234567',
        company: 'ABC Textiles',
        customerType: 'Business',
        taxId: '1234567-8',
        address: {
          street: '123 Main Street',
          city: 'Lahore',
          state: 'Punjab',
          postalCode: '54000',
          country: 'Pakistan'
        },
        status: 'Active',
        loyaltyPoints: 150,
        totalOrders: 12,
        totalSpent: 45000,
        averageOrderValue: 3750,
        lastOrderDate: new Date().toISOString(),
        tags: ['vip', 'wholesale'],
        createdBy: { _id: '1', name: 'Admin' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '2',
        customerNumber: 'CUST-20260623-0002',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+92 300 7654321',
        customerType: 'Individual',
        address: {
          street: '456 Park Avenue',
          city: 'Karachi',
          state: 'Sindh',
          postalCode: '75500',
          country: 'Pakistan'
        },
        status: 'Active',
        loyaltyPoints: 80,
        totalOrders: 5,
        totalSpent: 12000,
        averageOrderValue: 2400,
        tags: ['premium'],
        createdBy: { _id: '1', name: 'Admin' },
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        _id: '3',
        customerNumber: 'CUST-20260622-0003',
        name: 'Ali Khan',
        email: 'ali@example.com',
        phone: '+92 300 9876543',
        company: 'Khan Enterprises',
        customerType: 'Wholesale',
        taxId: '8765432-1',
        address: {
          street: '789 Business District',
          city: 'Islamabad',
          state: 'Islamabad',
          postalCode: '44000',
          country: 'Pakistan'
        },
        status: 'Active',
        loyaltyPoints: 300,
        totalOrders: 25,
        totalSpent: 150000,
        averageOrderValue: 6000,
        lastOrderDate: new Date(Date.now() - 172800000).toISOString(),
        tags: ['wholesale', 'bulk', 'vip'],
        createdBy: { _id: '1', name: 'Admin' },
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        _id: '4',
        customerNumber: 'CUST-20260621-0004',
        name: 'Maria Khan',
        email: 'maria@example.com',
        phone: '+92 300 5555555',
        customerType: 'Retailer',
        address: {
          street: '321 Retail Street',
          city: 'Rawalpindi',
          state: 'Punjab',
          postalCode: '46000',
          country: 'Pakistan'
        },
        status: 'Inactive',
        loyaltyPoints: 20,
        totalOrders: 2,
        totalSpent: 3500,
        averageOrderValue: 1750,
        notes: 'Customer not active since last 3 months',
        createdBy: { _id: '1', name: 'Admin' },
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString()
      }
    ];

    setCustomers(mockCustomers);
    setStats({
      total: mockCustomers.length,
      active: mockCustomers.filter(c => c.status === 'Active').length,
      inactive: mockCustomers.filter(c => c.status === 'Inactive').length,
      blocked: mockCustomers.filter(c => c.status === 'Blocked').length,
      pending: mockCustomers.filter(c => c.status === 'Pending').length,
      totalSpent: mockCustomers.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
      totalOrders: mockCustomers.reduce((sum, c) => sum + (c.totalOrders || 0), 0)
    });
    setPagination({
      page: 1,
      limit: 10,
      total: mockCustomers.length,
      pages: 1,
      hasNext: false,
      hasPrev: false
    });
    setLoading(false);
  }, []);

  // ─── Handlers ──────────────────────────────────────────────
  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedCustomer(null);
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/sales/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-all">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
      </div>

      <CustomerList
        customers={customers}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onAdd={() => setShowCreateModal(true)}
        pagination={pagination}
        onPageChange={handlePageChange}
        filters={filters}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
        stats={stats}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <CustomerModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCustomer && (
        <CustomerModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCustomer(null);
          }}
          onSuccess={handleEditSuccess}
          customer={selectedCustomer}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCustomer(null);
          }}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}