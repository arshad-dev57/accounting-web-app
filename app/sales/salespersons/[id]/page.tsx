'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Users,
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  TrendingUp,
  DollarSign,
  UserCheck,
  Calendar,
  AlertCircle,
  CheckCircle,
  Plus
} from 'lucide-react';
import { browserCompanyAuthHeaders } from '@/lib/company-api-headers';

export default function Salesperson360Page() {
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'customers' | 'invoices' | 'target'>('customers');
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  const fetch360Data = async () => {
    try {
      setLoading(true);
      const headers = browserCompanyAuthHeaders();
      const res = await fetch(`/api/distributor/salespersons/${id}`, { headers });
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (err) {
      console.error('Error loading salesperson 360:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetch360Data();
  }, [id]);

  const openAssignModal = async () => {
    try {
      const headers = browserCompanyAuthHeaders();
      const res = await fetch('/api/warehouse/customers', { headers });
      if (res.ok) {
        const json = await res.json();
        setAllCustomers(Array.isArray(json) ? json : json.data || []);
      }
      setShowAssignModal(true);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const handleAssign = async () => {
    try {
      setAssigning(true);
      const headers = browserCompanyAuthHeaders();
      const res = await fetch(`/api/distributor/salespersons/${id}/assign-customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ customerIds: selectedCustomerIds }),
      });

      if (res.ok) {
        setShowAssignModal(false);
        setSelectedCustomerIds([]);
        fetch360Data();
      }
    } catch (err) {
      alert('Failed to assign customers');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-500 max-w-7xl mx-auto">
        Loading Salesperson 360 profile...
      </div>
    );
  }

  if (!data || !data.salesperson) {
    return (
      <div className="p-6 text-center text-slate-500 max-w-7xl mx-auto">
        Salesperson profile not found.
      </div>
    );
  }

  const { salesperson, metrics, recentInvoices } = data;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          href="/sales/salespersons"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-600 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Salespersons List
        </Link>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-xl">
            {salesperson.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{salesperson.name}</h1>
              <span className="font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                {salesperson.salespersonNumber}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Territory: {salesperson.territory || 'Unassigned'} ({salesperson.location?.name || 'Main Branch'})
              </span>
              {salesperson.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {salesperson.phone}
                </span>
              )}
              {salesperson.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {salesperson.email}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openAssignModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Assign Customers
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assigned Customers</span>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.totalAssignedCustomers}
          </div>
          <div className="text-xs text-slate-500 mt-1">Active Accounts</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Sales Volume</span>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            PKR {metrics.totalSales.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Invoiced Sales</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Recovery</span>
          <div className="mt-2 text-2xl font-bold text-blue-600">
            PKR {metrics.totalRecovery.toLocaleString()}
          </div>
          <div className="text-xs text-blue-600 font-medium mt-1">Collected Cash</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Outstanding</span>
          <div className="mt-2 text-2xl font-bold text-rose-600">
            PKR {metrics.totalOutstanding.toLocaleString()}
          </div>
          <div className="text-xs text-rose-600 font-medium mt-1">
            Overdue: PKR {metrics.overdueAmount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('customers')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'customers'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Assigned Customers ({salesperson.customers.length})
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'invoices'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Sales Transactions ({recentInvoices.length})
        </button>

        <button
          onClick={() => setActiveTab('target')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'target'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Target & Achievement
        </button>
      </div>

      {/* Tab 1: Assigned Customers */}
      {activeTab === 'customers' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase font-semibold">
                <th className="px-5 py-3.5">Customer Number & Name</th>
                <th className="px-5 py-3.5">Territory</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5 text-right">Credit Limit</th>
                <th className="px-5 py-3.5 text-right">Outstanding</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {salesperson.customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No customers assigned to this salesperson.
                  </td>
                </tr>
              ) : (
                salesperson.customers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                      {c.name}
                      <div className="text-[11px] font-mono text-slate-500">{c.customerNumber}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{c.territory || 'Default'}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{c.phone || c.email || 'N/A'}</td>
                    <td className="px-5 py-4 text-right font-medium text-slate-700 dark:text-slate-300">
                      PKR {(c.creditLimit || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-rose-600">
                      PKR {(c.outstandingBalance || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/sales/customers/${c.id}`}
                        className="text-xs font-medium text-emerald-600 hover:underline"
                      >
                        Customer 360 →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Recent Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 text-slate-500 text-xs uppercase font-semibold">
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5 text-right">Grand Total</th>
                <th className="px-5 py-3.5 text-right">Paid Amount</th>
                <th className="px-5 py-3.5 text-right">Outstanding</th>
                <th className="px-5 py-3.5 text-center">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {recentInvoices.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4 font-mono font-semibold text-slate-900 dark:text-white">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {new Date(inv.invoiceDate).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-800 dark:text-slate-200">
                    {inv.customerName}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-slate-900 dark:text-white">
                    PKR {(inv.grandTotal || 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-right font-medium text-emerald-600">
                    PKR {(inv.paidAmount || 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-rose-600">
                    PKR {(inv.outstanding || 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                        inv.paymentStatus === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700'
                          : inv.paymentStatus === 'Partial'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {inv.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Target & Achievement */}
      {activeTab === 'target' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Monthly Target Breakdown</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">Target Progress</span>
              <span className="text-emerald-600 font-bold">{Math.round(metrics.targetAchievementPct)}% Achieved</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(metrics.targetAchievementPct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 pt-1">
              <span>Current Sales: PKR {metrics.totalSales.toLocaleString()}</span>
              <span>Target: PKR {salesperson.monthlyTarget.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Customer Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl relative max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
              Assign Customers to {salesperson.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Select customers to assign to this salesperson:</p>

            <div className="flex-1 overflow-y-auto space-y-2 divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl p-3">
              {allCustomers.map((c) => {
                const isSelected = selectedCustomerIds.includes(c.id);
                return (
                  <label key={c.id} className="flex items-center gap-3 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCustomerIds([...selectedCustomerIds, c.id]);
                        } else {
                          setSelectedCustomerIds(selectedCustomerIds.filter((id) => id !== c.id));
                        }
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-slate-900 dark:text-white">{c.name}</div>
                      <div className="text-[11px] text-slate-500">{c.customerNumber} - {c.phone}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 rounded-lg border text-xs font-medium text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium"
              >
                {assigning ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
