'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Plus, Search, Edit, Trash2, Eye, Users, ChevronDown,
  X, Save, Building2, Phone, Mail, MapPin, 
  Briefcase, CreditCard, Settings, User,
  Hash, Building, Loader2, ChevronLeft, ChevronRight,
  Info
} from 'lucide-react';
import { getNames } from 'country-list';
import { supplierService, Supplier } from '../../api/supplier/route'; // adjust path if needed

// Get all countries
const countries = getNames().sort();

// ============================================================
// SUPPLIER LIST VIEW
// ============================================================
function SupplierList({ 
  suppliers, 
  loading, 
  pagination,
  kpi,
  searchTerm,
  setSearchTerm,
  onPageChange,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onViewClick,
  statusFilter,
  setStatusFilter
}: { 
  suppliers: Supplier[];
  loading: boolean;
  pagination: any;
  kpi: any;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  onPageChange: (page: number) => void;
  onAddClick: () => void;
  onEditClick: (supplier: Supplier) => void;
  onDeleteClick: (id: string) => void;
  onViewClick: (supplier: Supplier) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
}) {
  const statuses = ['all', 'active', 'inactive'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-[#014582]" />
          Suppliers
          <span className="text-sm font-normal text-gray-400 ml-2">
            ({kpi?.total || 0} suppliers)
          </span>
        </h2>
        <div className="flex items-center gap-3">
          <Link 
            href="/warehouse/product-settings"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-[#014582] transition-all"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <button 
            onClick={onAddClick}
            className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all shadow-lg shadow-[#014582]/25"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpi && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Total Suppliers</p>
            <p className="text-2xl font-bold text-gray-800">{kpi.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{kpi.active}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Inactive</p>
            <p className="text-2xl font-bold text-red-600">{kpi.inactive}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
            />
          </div>
          
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
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
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Supplier Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
                    <p className="mt-2 text-gray-500">Loading suppliers...</p>
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium text-gray-500">No suppliers found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onViewClick(supplier)}>
                    <td className="px-6 py-3 font-mono text-xs text-gray-600 font-semibold">{supplier.code || 'N/A'}</td>
                    <td className="px-6 py-3 font-medium text-gray-800">{supplier.name}</td>
                    <td className="px-6 py-3 text-gray-600">{supplier.companyName || '-'}</td>
                    <td className="px-6 py-3 text-gray-600">{supplier.contactPerson || '-'}</td>
                    <td className="px-6 py-3 text-gray-600">{supplier.email || '-'}</td>
                    <td className="px-6 py-3 text-gray-600">{supplier.phone || '-'}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        supplier.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {supplier.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => onViewClick(supplier)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onEditClick(supplier)}
                          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all" 
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDeleteClick(supplier._id!)}
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
            Showing {(pagination.page - 1) * pagination.limit + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} suppliers
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
// SUPPLIER DETAILS MODAL
// ============================================================
function SupplierDetailsModal({ 
  supplier, 
  onClose 
}: { 
  supplier: Supplier; 
  onClose: () => void;
}) {
  if (!supplier) return null;

  const detailRows = [
    { label: 'Supplier Name', value: supplier.name },
    { label: 'Company Name', value: supplier.companyName || '-' },
    { label: 'Code', value: supplier.code || '-' },
    { label: 'Status', value: supplier.status === 'active' ? 'Active' : 'Inactive' },
    { label: 'Contact Person', value: supplier.contactPerson || '-' },
    { label: 'Department', value: supplier.department || '-' },
    { label: 'Phone', value: supplier.phone || '-' },
    { label: 'Email', value: supplier.email || '-' },
    { label: 'Address', value: supplier.address || '-' },
    { label: 'City', value: supplier.city || '-' },
    { label: 'Country', value: supplier.country || '-' },
    { label: 'Industry', value: supplier.industry || '-' },
    { label: 'Business Type', value: supplier.businessType || '-' },
    { label: 'Payment Terms', value: supplier.paymentTerms || '-' },
    { label: 'Created At', value: supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString() : '-' },
    { label: 'Updated At', value: supplier.updatedAt ? new Date(supplier.updatedAt).toLocaleDateString() : '-' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-[#014582]" />
            <h2 className="text-lg font-bold text-gray-800">Supplier Details</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {detailRows.map((row, index) => (
              <div key={index} className={`${index % 2 === 0 ? 'md:col-span-1' : 'md:col-span-1'}`}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{row.label}</p>
                <p className="text-sm font-medium text-gray-800 mt-1 break-words">{row.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CREATE/EDIT SUPPLIER FORM
// ============================================================
function SupplierForm({ 
  supplier, 
  onCancel, 
  onSuccess 
}: { 
  supplier?: Supplier;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: supplier?.name || '',
    companyName: supplier?.companyName || '',
    code: supplier?.code || '',
    contactPerson: supplier?.contactPerson || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    department: supplier?.department || '',
    address: supplier?.address || '',
    city: supplier?.city || '',
    country: supplier?.country || 'Pakistan',
    industry: supplier?.industry || '',
    businessType: supplier?.businessType || '',
    paymentTerms: supplier?.paymentTerms || 'Net 30',
    status: supplier?.status || 'active',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field: keyof Supplier, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      setError('Supplier name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (supplier?._id) {
        await supplierService.updateSupplier(supplier._id, formData);
      } else {
        await supplierService.createSupplier(formData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save supplier');
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!supplier?._id;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-[#014582]" />
          <h2 className="text-lg font-bold text-gray-800">
            {isEditing ? 'Edit Supplier' : 'Add New Supplier'}
          </h2>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-gray-200 rounded-lg transition-all"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Form Content */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supplier Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Supplier Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g., ABC Textiles"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  required
                />
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Company Name
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g., ABC Textiles Pvt Ltd"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                />
              </div>
            </div>

            {/* Supplier Code */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Supplier Code
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Auto-generated"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Status
              </label>
              <select 
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Contact Person
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Full name"
                  value={formData.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Department
              </label>
              <input
                type="text"
                placeholder="e.g., Sales, Procurement"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              />
            </div>

            {/* Phone */}
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
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="info@company.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  required
                />
              </div>
            </div>

            {/* Address */}
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea
                  placeholder="Street address..."
                  rows={2}
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 resize-none"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                City
              </label>
              <input
                type="text"
                placeholder="City"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Country
              </label>
              <select 
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              >
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Industry
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g., Textile, Electronics"
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                />
              </div>
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Business Type
              </label>
              <select 
                value={formData.businessType}
                onChange={(e) => handleInputChange('businessType', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              >
                <option value="">Select...</option>
                <option>Sole Proprietorship</option>
                <option>Partnership</option>
                <option>Private Limited</option>
                <option>Public Limited</option>
                <option>LLC</option>
              </select>
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Payment Terms
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g., Net 30, Cash on Delivery"
                  value={formData.paymentTerms}
                  onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
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
              disabled={loading}
              className="px-6 py-2.5 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all flex items-center gap-2 shadow-lg shadow-[#014582]/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isEditing ? 'Update Supplier' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MAIN SUPPLIERS PAGE
// ============================================================
export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [kpi, setKpi] = useState({ total: 0, active: 0, inactive: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null); // for details modal

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await supplierService.getSuppliers({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        status: statusFilter,
      });
      setSuppliers(result.data || []);
      setPagination(result.pagination);
      setKpi(result.kpi);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, searchTerm, statusFilter]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleAddClick = () => {
    setEditingSupplier(undefined);
    setShowForm(true);
  };

  const handleEditClick = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowForm(true);
  };

  const handleViewClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    
    try {
      await supplierService.deleteSupplier(id);
      fetchSuppliers();
    } catch (error: any) {
      alert(error.message || 'Failed to delete supplier');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingSupplier(undefined);
    fetchSuppliers();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingSupplier(undefined);
  };

  const closeDetailsModal = () => {
    setSelectedSupplier(null);
  };

  return (
    <div className="space-y-6">
      {showForm ? (
        <SupplierForm 
          supplier={editingSupplier}
          onCancel={handleFormCancel}
          onSuccess={handleFormSuccess}
        />
      ) : (
        <>
          <SupplierList 
            suppliers={suppliers}
            loading={loading}
            pagination={pagination}
            kpi={kpi}
            searchTerm={searchTerm}
            setSearchTerm={handleSearch}
            statusFilter={statusFilter}
            setStatusFilter={handleStatusFilter}
            onPageChange={handlePageChange}
            onAddClick={handleAddClick}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            onViewClick={handleViewClick}
          />
          {/* Details Modal */}
          {selectedSupplier && (
            <SupplierDetailsModal 
              supplier={selectedSupplier} 
              onClose={closeDetailsModal} 
            />
          )}
        </>
      )}
    </div>
  );
}