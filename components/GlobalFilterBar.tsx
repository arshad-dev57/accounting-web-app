'use client';

import React, { useState, useEffect } from 'react';
import { Filter, Calendar, Building2, User, Users, RefreshCw } from 'lucide-react';
import { browserCompanyAuthHeaders } from '@/lib/company-api-headers';

export interface FilterState {
  startDate?: string;
  endDate?: string;
  locationId?: string;
  customerId?: string;
  salespersonId?: string;
  status?: string;
  search?: string;
}

interface GlobalFilterBarProps {
  onFilterChange: (filters: FilterState) => void;
  showDateRange?: boolean;
  showLocation?: boolean;
  showCustomer?: boolean;
  showSalesperson?: boolean;
  showStatus?: boolean;
  statusOptions?: { label: string; value: string }[];
  className?: string;
}

export default function GlobalFilterBar({
  onFilterChange,
  showDateRange = true,
  showLocation = true,
  showCustomer = false,
  showSalesperson = false,
  showStatus = false,
  statusOptions = [],
  className = '',
}: GlobalFilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({});
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [salespersons, setSalespersons] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    // Fetch master dropdown data if requested
    const fetchMasterData = async () => {
      try {
        const headers = browserCompanyAuthHeaders();

        if (showLocation) {
          const res = await fetch('/api/warehouse/locations', { headers });
          if (res.ok) {
            const data = await res.json();
            setLocations(Array.isArray(data) ? data : data.data || []);
          }
        }

        if (showCustomer) {
          const res = await fetch('/api/warehouse/customers', { headers });
          if (res.ok) {
            const data = await res.json();
            setCustomers(Array.isArray(data) ? data : data.data || []);
          }
        }

        if (showSalesperson) {
          const res = await fetch('/api/distributor/salespersons', { headers });
          if (res.ok) {
            const data = await res.json();
            setSalespersons(data.data || []);
          }
        }
      } catch (err) {
        console.error('Error loading filter options:', err);
      }
    };

    fetchMasterData();
  }, [showLocation, showCustomer, showSalesperson]);

  const handleChange = (key: keyof FilterState, value: string) => {
    const updated = { ...filters, [key]: value || undefined };
    setFilters(updated);
    onFilterChange(updated);
  };

  const handleReset = () => {
    setFilters({});
    onFilterChange({});
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Filter Records</span>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
        {showDateRange && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Start Date
              </label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> End Date
              </label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </>
        )}

        {showLocation && (
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" /> Warehouse / Branch
            </label>
            <select
              value={filters.locationId || ''}
              onChange={(e) => handleChange('locationId', e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">All Warehouses</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {showCustomer && (
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" /> Customer
            </label>
            <select
              value={filters.customerId || ''}
              onChange={(e) => handleChange('customerId', e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {showSalesperson && (
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-400" /> Salesperson
            </label>
            <select
              value={filters.salespersonId || ''}
              onChange={(e) => handleChange('salespersonId', e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">All Salespersons</option>
              {salespersons.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {showStatus && statusOptions.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
