'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Plus,
  Eye,
  Users,
  Phone,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  RefreshCw,
} from 'lucide-react';
import { browserCompanyAuthHeaders } from '@/lib/company-api-headers';

interface Salesperson {
  id: string;
  salespersonNumber: string;
  name: string;
  phone?: string;
  email?: string;
  employeeCode?: string;
  status: string;
  territory?: string;
  commissionRate: number;
  monthlyTarget: number;
  customerCount: number;
  totalSales: number;
  totalRecovery: number;
  totalOutstanding: number;
  targetAchievement: number;
  location?: { id: string; name: string };
  user?: { id: string; firstName: string; lastName: string };
}

const PAGE_SIZE = 20;
const statusOptions = ['All', 'Active', 'Inactive'];

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  employeeCode: '',
  territory: '',
  monthlyTarget: '0',
  commissionRate: '0',
  status: 'Active',
  locationId: '',
};

const inputClass =
  'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none';
const labelClass = 'block text-xs font-semibold text-gray-500 mb-1';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-700';
    case 'Inactive':
      return 'bg-gray-100 text-gray-700';
    case 'Blocked':
      return 'bg-red-100 text-red-700';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export default function SalespersonsPage() {
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState(emptyForm);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchSalespersons = useCallback(async () => {
    try {
      setLoading(true);
      const headers = browserCompanyAuthHeaders();
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (statusFilter !== 'All') query.append('status', statusFilter);

      const res = await fetch(`/api/distributor/salespersons?${query.toString()}`, { headers });
      if (res.ok) {
        const json = await res.json();
        setSalespersons(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching salespersons:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchSalespersons();
  }, [fetchSalespersons]);

  // Locations for the modal (sirf ek baar)
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const headers = browserCompanyAuthHeaders();
        const res = await fetch('/api/warehouse/locations', { headers });
        if (res.ok) {
          const data = await res.json();
          setLocations(Array.isArray(data) ? data : data.data || []);
        }
      } catch (e) {
        console.error('Error fetching locations:', e);
      }
    };
    fetchLocations();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const headers = browserCompanyAuthHeaders();
      const res = await fetch('/api/distributor/salespersons', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        setFormData(emptyForm);
        fetchSalespersons();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to create salesperson');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving salesperson');
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  // Client-side pagination (customers page jaisa pager)
  const total = salespersons.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageItems = salespersons.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/sales/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#014582]" />
            Salespersons
            <span className="text-sm font-normal text-gray-400 ml-2">({total} salespersons)</span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSalespersons}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all shadow-lg shadow-[#014582]/25"
          >
            <Plus className="w-4 h-4" />
            Add Salesperson
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
              placeholder="Search by name, code, phone, or territory..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
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
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Salesperson</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Territory &amp; Branch</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customers</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Monthly Target</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Sales</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recovery</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Target %</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
                    <p className="mt-2 text-gray-500">Loading salespersons...</p>
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium text-gray-500">No salespersons found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                pageItems.map((sp) => (
                  <tr key={sp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div>
                        <p className="font-medium text-gray-800">{sp.name}</p>
                        <p className="text-xs text-gray-400">{sp.salespersonNumber}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="space-y-0.5">
                        <p className="text-sm text-gray-700">{sp.territory || 'Unassigned'}</p>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          {sp.location?.name || 'Main Branch'}
                        </p>
                        {sp.phone && (
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {sp.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="text-sm font-semibold text-gray-700">{sp.customerCount || 0}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm font-semibold text-gray-700">
                        Rs. {(sp.monthlyTarget || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm font-semibold text-gray-700">
                        Rs. {(sp.totalSales || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm font-semibold text-gray-700">
                        Rs. {(sp.totalRecovery || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#014582]/10 text-[#014582]">
                        {sp.targetAchievement || 0}%
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(sp.status)}`}>
                        {sp.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/sales/salespersons/${sp.id}`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Salesperson 360"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
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
      {pages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">
            Showing {startIndex + 1} – {Math.min(startIndex + PAGE_SIZE, total)} of {total} salespersons
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 bg-[#014582]/10 text-[#014582] font-semibold rounded-lg">
              {currentPage} / {pages}
            </span>
            <button
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= pages}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add Salesperson Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg my-4 shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-[#014582]/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#014582]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-[#014582]" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Add New Salesperson</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                <div>
                  <label className={labelClass}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Tariq Mehmood"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Phone Number</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0300-1234567"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="tariq@example.com"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Territory / Area</label>
                    <input
                      type="text"
                      value={formData.territory}
                      onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                      placeholder="e.g. Lahore North Zone"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Warehouse / Branch</label>
                    <div className="relative">
                      <select
                        value={formData.locationId}
                        onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                        className={`${inputClass} appearance-none pr-9 bg-gray-50`}
                      >
                        <option value="">Select Branch</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Monthly Sales Target (Rs.)</label>
                    <input
                      type="number"
                      value={formData.monthlyTarget}
                      onChange={(e) => setFormData({ ...formData, monthlyTarget: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Commission Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.commissionRate}
                      onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-white hover:border-[#014582] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all shadow-lg shadow-[#014582]/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Saving...' : 'Create Salesperson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}