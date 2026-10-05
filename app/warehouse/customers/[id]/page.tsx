'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Tag,
  DollarSign,
  FileText,
  CreditCard,
  Clock,
  Printer,
  Edit,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function CustomerDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const pathname = usePathname();
  const customersListHref = pathname?.startsWith('/sales')
    ? '/sales/customers'
    : '/warehouse/customers';

  const [customer, setCustomer] = useState<any>(null);
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'invoices' | 'payments'>('ledger');

  const fetchCustomerData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);

      // Fetch customer basic profile & distributor ledger simultaneously
      const [custRes, ledgerRes] = await Promise.all([
        apiClient.get('/api/warehouse/customers/' + id).catch((e) => {
          console.error('Customer fetch error:', e);
          return null;
        }),
        apiClient.get('/api/distributor/customers/' + id + '/ledger').catch((e) => {
          console.error('Customer ledger fetch error:', e);
          return null;
        })
      ]);

      // apiClient returns { success, data: <backend body> }
      // backend body is { success, data: customer }
      let custObj = null;
      if (custRes?.data) {
        const raw = custRes.data;
        if (raw?.success !== false) {
          custObj =
            raw?.data?.customer ||
            raw?.customer ||
            (raw?.data && !Array.isArray(raw.data) && (raw.data.id || raw.data.name) ? raw.data : null) ||
            (raw?.id || raw?.name ? raw : null);
        }
      }

      let ledgerObj = null;
      if (ledgerRes?.data) {
        const rawLedger = ledgerRes.data;
        if (rawLedger?.success !== false) {
          ledgerObj = rawLedger?.data || rawLedger;
        }
      }

      if (!custObj && ledgerObj?.customer) {
        custObj = ledgerObj.customer;
      }

      if (custObj) {
        setCustomer(custObj);
        if (ledgerObj) {
          setLedgerData(ledgerObj);
        }
      } else {
        setError('Customer details could not be found.');
      }
    } catch (err: any) {
      console.error('Error fetching customer detail:', err);
      setError(err.message || 'Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#014582] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-500 font-medium">Loading Customer Ledger & Financials...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="inline-flex p-3 rounded-full bg-red-50 text-red-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-gray-800">{error || 'Customer Not Found'}</h2>
        <div>
          <Link
            href={customersListHref}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#014582] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Customers List
          </Link>
        </div>
      </div>
    );
  }

  const lines = ledgerData?.lines || [];
  const summary = ledgerData?.summary || {
    totalDebit: 0,
    totalCredit: 0,
    closingBalance: customer.outstandingBalance || 0
  };

  const invoices = lines.filter((l: any) => l.documentType === 'Invoice');
  const payments = lines.filter((l: any) => l.documentType === 'Payment' || l.documentType === 'Credit Note');

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
            href={customersListHref}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#014582] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Customers Master List
          </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCustomerData}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-gray-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-gray-200 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Ledger
          </button>
        </div>
      </div>

      {/* Customer Overview Header Card */}
      <div className="bg-gradient-to-r from-[#00274d] via-[#014582] to-blue-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 uppercase tracking-wider">
                {customer.customerType || 'Customer'}
              </span>
              <span className={'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ' + 
                (customer.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300')}>
                {customer.status || 'Active'}
              </span>
              <span className="text-xs text-white/70 font-mono">#{customer.customerNumber}</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">{customer.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-white/80">
              {customer.company && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-white/60" />
                  {customer.company}
                </span>
              )}
              {customer.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-white/60" />
                  {customer.email}
                </span>
              )}
              {customer.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-white/60" />
                  {customer.phone}
                </span>
              )}
              {customer.taxId && (
                <span className="flex items-center gap-1 font-mono text-[11px] bg-white/10 px-2 py-0.5 rounded">
                  NTN/Tax: {customer.taxId}
                </span>
              )}
            </div>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 gap-3 min-w-[280px]">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15">
              <div className="text-[10px] uppercase font-bold text-white/70">Outstanding Receivable</div>
              <div className="text-lg font-black text-amber-300">
                Rs. {(summary.closingBalance || customer.outstandingBalance || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15">
              <div className="text-[10px] uppercase font-bold text-white/70">Credit Limit</div>
              <div className="text-lg font-black text-emerald-300">
                Rs. {(customer.creditLimit || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/15">
          <div>
            <div className="text-[10px] text-white/60 font-semibold uppercase">Total Invoiced (Debit)</div>
            <div className="text-sm font-bold text-white">Rs. {(summary.totalDebit || 0).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/60 font-semibold uppercase">Total Paid (Credit)</div>
            <div className="text-sm font-bold text-emerald-300">Rs. {(summary.totalCredit || 0).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/60 font-semibold uppercase">Total Spent</div>
            <div className="text-sm font-bold text-white">Rs. {(customer.totalSpent || 0).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/60 font-semibold uppercase">Total Orders</div>
            <div className="text-sm font-bold text-white">{customer.totalOrders || 0} Orders</div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 pt-2 rounded-xl border">
        <button
          onClick={() => setActiveTab('ledger')}
          className={'px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ' +
            (activeTab === 'ledger' ? 'border-[#014582] text-[#014582]' : 'border-transparent text-gray-500 hover:text-gray-800')}
        >
          <FileText className="w-4 h-4" />
          Accounts Receivable Ledger ({lines.length})
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={'px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ' +
            (activeTab === 'invoices' ? 'border-[#014582] text-[#014582]' : 'border-transparent text-gray-500 hover:text-gray-800')}
        >
          <ShoppingBag className="w-4 h-4" />
          Sales Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={'px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ' +
            (activeTab === 'payments' ? 'border-[#014582] text-[#014582]' : 'border-transparent text-gray-500 hover:text-gray-800')}
        >
          <CreditCard className="w-4 h-4" />
          Payments ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={'px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ' +
            (activeTab === 'overview' ? 'border-[#014582] text-[#014582]' : 'border-transparent text-gray-500 hover:text-gray-800')}
        >
          <User className="w-4 h-4" />
          Customer Information
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Customer Statement / AR Ledger</h3>
              <p className="text-xs text-gray-500">Chronological transaction log with running balance</p>
            </div>
            <div className="text-xs font-bold text-gray-700">
              Closing Balance:{' '}
              <span className="text-[#014582]">
                Rs. {(summary.closingBalance || customer.outstandingBalance || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {lines.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium">No ledger entries found for this customer.</p>
              <p className="text-xs text-gray-400 mt-1">Invoices and payments will appear here automatically.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200">
                    <th className="p-3">Date</th>
                    <th className="p-3">Doc #</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-right">Debit (Inv)</th>
                    <th className="p-3 text-right">Credit (Paid)</th>
                    <th className="p-3 text-right font-black">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium">
                  {lines.map((line: any, idx: number) => (
                    <tr key={line.id || idx} className="hover:bg-blue-50/50 transition-colors">
                      <td className="p-3 whitespace-nowrap text-gray-600">
                        {line.date ? new Date(line.date).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-3 font-mono font-bold text-[#014582]">{line.documentNumber || '-'}</td>
                      <td className="p-3">
                        <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ' +
                          (line.documentType === 'Invoice' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800')}>
                          {line.documentType}
                        </span>
                      </td>
                      <td className="p-3 text-gray-800">{line.description}</td>
                      <td className="p-3 text-gray-500">
                        {line.dueDate ? new Date(line.dueDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-3 text-right font-bold text-gray-900">
                        {line.debit > 0 ? 'Rs. ' + line.debit.toLocaleString() : '-'}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        {line.credit > 0 ? 'Rs. ' + line.credit.toLocaleString() : '-'}
                      </td>
                      <td className="p-3 text-right font-black text-[#014582] bg-blue-50/30">
                        Rs. {(line.runningBalance || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                    <td colSpan={5} className="p-3 text-right uppercase text-[10px] text-gray-600">Totals:</td>
                    <td className="p-3 text-right font-bold text-gray-900">
                      Rs. {(summary.totalDebit || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-600">
                      Rs. {(summary.totalCredit || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-black text-[#014582]">
                      Rs. {(summary.closingBalance || 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 font-bold text-sm text-gray-800">
            Sales Invoices History ({invoices.length})
          </div>
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs">No sales invoices linked yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider text-[10px] border-b">
                    <th className="p-3">Date</th>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoices.map((inv: any, idx: number) => (
                    <tr key={inv.id || idx} className="hover:bg-gray-50">
                      <td className="p-3 text-gray-600">{inv.date ? new Date(inv.date).toLocaleDateString() : '-'}</td>
                      <td className="p-3 font-mono font-bold text-[#014582]">{inv.documentNumber}</td>
                      <td className="p-3">{inv.description}</td>
                      <td className="p-3 text-gray-500">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td>
                      <td className="p-3 text-right font-bold text-gray-900">Rs. {inv.debit?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 font-bold text-sm text-gray-800">
            Payment Receipts History ({payments.length})
          </div>
          {payments.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs">No payment records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider text-[10px] border-b">
                    <th className="p-3">Date</th>
                    <th className="p-3">Receipt #</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map((p: any, idx: number) => (
                    <tr key={p.id || idx} className="hover:bg-gray-50">
                      <td className="p-3 text-gray-600">{p.date ? new Date(p.date).toLocaleDateString() : '-'}</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">{p.documentNumber}</td>
                      <td className="p-3 font-semibold">{p.documentType}</td>
                      <td className="p-3">{p.description}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">Rs. {p.credit?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* General Information Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-[#014582]" />
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500 block">Customer Name</span>
                <span className="font-bold text-gray-800">{customer.name}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Customer Number</span>
                <span className="font-bold text-gray-800 font-mono">{customer.customerNumber}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Category / Type</span>
                <span className="font-bold text-gray-800">{customer.customerType}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Status</span>
                <span className="font-bold text-emerald-600">{customer.status}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Email Address</span>
                <span className="font-bold text-gray-800">{customer.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Phone Number</span>
                <span className="font-bold text-gray-800">{customer.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Credit & Terms Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#014582]" />
              Credit Terms & Policy
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500 block">Credit Limit</span>
                <span className="font-bold text-gray-800">Rs. {(customer.creditLimit || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Credit Terms</span>
                <span className="font-bold text-gray-800">{customer.creditTerms || 'Net 30'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Loyalty Points</span>
                <span className="font-bold text-amber-600">{customer.loyaltyPoints || 0} pts</span>
              </div>
              <div>
                <span className="text-gray-500 block">Average Order Value</span>
                <span className="font-bold text-gray-800">Rs. {(customer.averageOrderValue || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm md:col-span-2">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#014582]" />
              Addresses
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="bg-gray-50 p-3 rounded-lg border">
                <span className="font-bold text-gray-700 block mb-1">Billing Address</span>
                <p className="text-gray-600">
                  {customer.billingAddress?.street || customer.address?.street || 'No street address specified'}
                </p>
                <p className="text-gray-600">
                  {[
                    customer.billingAddress?.city || customer.address?.city,
                    customer.billingAddress?.state || customer.address?.state,
                    customer.billingAddress?.postalCode || customer.address?.postalCode,
                    customer.billingAddress?.country || customer.address?.country
                  ].filter(Boolean).join(', ') || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border">
                <span className="font-bold text-gray-700 block mb-1">Shipping Address</span>
                <p className="text-gray-600">
                  {customer.shippingAddress?.street || 'Same as billing address'}
                </p>
                <p className="text-gray-600">
                  {[
                    customer.shippingAddress?.city,
                    customer.shippingAddress?.state,
                    customer.shippingAddress?.postalCode,
                    customer.shippingAddress?.country
                  ].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
