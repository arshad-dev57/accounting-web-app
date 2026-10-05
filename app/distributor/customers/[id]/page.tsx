'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Users,
  CreditCard,
  DollarSign,
  Clock,
  ArrowLeft,
  Printer,
  AlertTriangle,
  Package
} from 'lucide-react';
import { fetchCustomer360, fetchCustomerLedger, fetchCustomerStatement } from '@/lib/distributor-service';

export default function Customer360Page() {
  const { id } = useParams() as { id: string };
  const [data, setData] = useState<any>(null);
  const [ledger, setLedger] = useState<any>(null);
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'payments' | 'ledger' | 'statement' | 'products'>('overview');

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        const [c360, cLedger, cStmt] = await Promise.all([
          fetchCustomer360(id),
          fetchCustomerLedger(id),
          fetchCustomerStatement(id)
        ]);
        if (c360.success) setData(c360.data);
        if (cLedger.success) setLedger(cLedger.data);
        if (cStmt.success) setStatement(cStmt.data);
      } catch (err) {
        console.error('Failed to load Customer 360 data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#014582] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-500 font-medium">Building Customer 360 & Financial Ledger...</p>
        </div>
      </div>
    );
  }

  const customer = data?.customer || {};
  const fin = data?.financials || {};
  const invoices = data?.recentInvoices || [];
  const payments = data?.recentPayments || [];
  const topProducts = data?.topProducts || [];

  const tabs = ['overview', 'invoices', 'payments', 'ledger', 'statement', 'products'] as const;
  const tabLabels: Record<string, string> = {
    overview: 'Overview & Financials',
    invoices: 'Invoices (' + invoices.length + ')',
    payments: 'Payments (' + payments.length + ')',
    ledger: 'Customer Ledger (AR)',
    statement: 'Statement Generator',
    products: 'Purchased Products'
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/distributor/customers"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#014582] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customer Master List
        </Link>
        <button
          onClick={() => window.print()}
          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-gray-200"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Statement
        </button>
      </div>

      {/* Customer 360 Header Profile Card */}
      <div className="bg-gradient-to-r from-[#00274d] via-[#014582] to-blue-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 uppercase tracking-wider">
                Customer 360 Profile
              </span>
              <span className="text-xs text-white/70 font-mono">{customer.customerNumber}</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">{customer.name || 'Loading...'}</h1>
            <p className="text-xs text-white/80 mt-1 flex flex-wrap items-center gap-4">
              <span>Territory: {customer.territory || 'Unassigned'}</span>
              <span>Salesperson: {customer.salesperson?.name || 'Unassigned'}</span>
              <span>Phone: {customer.phone || '-'}</span>
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/20 text-right">
            <div className="text-[10px] uppercase font-bold text-white/70">Available Credit</div>
            <div className="text-lg font-extrabold text-emerald-400">
              PKR {(customer.availableCredit || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Financial KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/15">
          <div>
            <div className="text-[10px] text-white/60 font-semibold uppercase">Credit Limit</div>
            <div className="text-sm font-bold text-white">PKR {(fin.creditLimit || 0).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/60 font-semibold uppercase">Outstanding</div>
            <div className="text-sm font-bold text-amber-300">PKR {(fin.currentOutstanding || 0).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/60 font-semibold uppercase">Overdue</div>
            <div className="text-sm font-bold text-rose-300">PKR {(fin.overdueAmount || 0).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/60 font-semibold uppercase">Total Payments</div>
            <div className="text-sm font-bold text-emerald-300">PKR {(fin.totalPaid || 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-gray-200 bg-white px-4 pt-2 rounded-xl border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={
              'px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all ' +
              (activeTab === tab
                ? 'border-[#014582] text-[#014582]'
                : 'border-transparent text-gray-500 hover:text-gray-900')
            }
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#014582]" />
              Credit & Terms Setup
            </h3>
            <div className="divide-y divide-gray-100 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500">Credit Policy</span>
                <span className="font-bold text-amber-700">{fin.creditPolicy || 'WARN'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500">Credit Days</span>
                <span className="font-semibold text-gray-900">{fin.creditDays || 30} Days</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500">Credit Limit</span>
                <span className="font-bold text-gray-900">PKR {(fin.creditLimit || 0).toLocaleString()}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500">Current Outstanding</span>
                <span className="font-bold text-amber-700">PKR {(fin.currentOutstanding || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Sales & Recovery Summary
            </h3>
            <div className="divide-y divide-gray-100 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500">Total Posted Sales</span>
                <span className="font-bold text-gray-900">PKR {(fin.totalSales || 0).toLocaleString()}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500">Total Payments Received</span>
                <span className="font-bold text-emerald-600">PKR {(fin.totalPaid || 0).toLocaleString()}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500">Total Deliveries</span>
                <span className="font-semibold text-gray-900">{fin.totalDeliveries || 0}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500">Total Orders</span>
                <span className="font-semibold text-gray-900">{fin.totalOrders || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Posted Sales Invoices</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-y border-gray-200">
                <tr>
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3 text-right">Total</th>
                  <th className="py-3 px-3 text-right">Paid</th>
                  <th className="py-3 px-3 text-right">Outstanding</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {invoices.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-gray-400">No invoices found</td></tr>
                ) : (
                  invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-blue-50/30">
                      <td className="py-3 px-3 font-mono font-bold text-[#014582]">{inv.invoiceNumber}</td>
                      <td className="py-3 px-3 text-gray-600">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '-'}</td>
                      <td className="py-3 px-3 text-gray-600">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td>
                      <td className="py-3 px-3 text-right font-semibold">PKR {(inv.grandTotal || 0).toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-emerald-600">PKR {(inv.paidAmount || 0).toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-amber-700 font-bold">PKR {(inv.outstanding || 0).toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <span className={
                          'px-2 py-0.5 rounded-full text-[10px] font-bold ' +
                          (inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                           inv.outstanding > 0 && inv.dueDate && new Date(inv.dueDate) < new Date()
                             ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800')
                        }>
                          {inv.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Payment History (Received)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-y border-gray-200">
                <tr>
                  <th className="py-3 px-3">Payment #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {payments.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-400">No payments found</td></tr>
                ) : (
                  payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-emerald-50/30">
                      <td className="py-3 px-3 font-mono font-bold text-[#014582]">{p.paymentNumber || '-'}</td>
                      <td className="py-3 px-3 text-gray-600">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '-'}</td>
                      <td className="py-3 px-3 text-gray-700">{p.paymentMethod || 'Cash'}</td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600">PKR {(p.amount || 0).toLocaleString()}</td>
                      <td className="py-3 px-3 text-gray-500">{p.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: LEDGER */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Accounting-Grade Customer Ledger (AR)</h3>
              <p className="text-xs text-gray-500">Source of Truth: AccountsReceivable + SalesPaymentReceived + CreditNote engines</p>
            </div>
            {ledger?.summary && (
              <div className="text-right text-xs">
                <div className="text-gray-500">Closing Balance:</div>
                <div className="text-base font-extrabold text-amber-700">PKR {(ledger.summary.closingBalance || 0).toLocaleString()}</div>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-y border-gray-200">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Doc #</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3 text-right">Debit (PKR)</th>
                  <th className="py-3 px-3 text-right">Credit (PKR)</th>
                  <th className="py-3 px-3 text-right font-bold">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {!ledger?.lines || ledger.lines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">No ledger transactions found</td>
                  </tr>
                ) : (
                  ledger.lines.map((line: any, idx: number) => (
                    <tr key={idx} className="hover:bg-blue-50/30">
                      <td className="py-3 px-3 text-gray-600">{new Date(line.date).toLocaleDateString()}</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#014582]">{line.documentNumber}</td>
                      <td className="py-3 px-3">{line.documentType}</td>
                      <td className="py-3 px-3 text-gray-700">{line.description}</td>
                      <td className="py-3 px-3 text-right text-gray-900 font-semibold">
                        {line.debit > 0 ? line.debit.toLocaleString() : '-'}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-600 font-semibold">
                        {line.credit > 0 ? line.credit.toLocaleString() : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-amber-700">
                        PKR {line.runningBalance.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: STATEMENT GENERATOR */}
      {activeTab === 'statement' && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Official Customer Account Statement</h3>
              <p className="text-xs text-gray-500">Opening balance, period invoices & payments with closing balance</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-[#014582] text-white rounded-xl text-xs font-bold hover:bg-blue-900 flex items-center gap-2 shadow-md"
            >
              <Printer className="w-4 h-4" /> Print / Export PDF
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl text-xs font-medium">
            <div>
              <span className="text-gray-500">Opening Balance: </span>
              <span className="font-bold text-gray-900">PKR {(statement?.openingBalance || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-500">Total Invoiced: </span>
              <span className="font-bold text-gray-900">PKR {(statement?.totalInvoiced || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-500">Closing Balance: </span>
              <span className="font-bold text-amber-700">PKR {(statement?.closingBalance || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 text-gray-700 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Doc No</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Debit</th>
                  <th className="py-2.5 px-3 text-right">Credit</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {!statement?.lines || statement.lines.length === 0 ? (
                  <tr><td colSpan={6} className="py-6 text-center text-gray-400">No statement lines</td></tr>
                ) : (
                  statement.lines.map((line: any, i: number) => (
                    <tr key={i}>
                      <td className="py-2.5 px-3">{new Date(line.date).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3 font-mono">{line.documentNo}</td>
                      <td className="py-2.5 px-3">{line.type}</td>
                      <td className="py-2.5 px-3 text-right">{line.debit ? 'PKR ' + line.debit.toLocaleString() : '-'}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-600">{line.credit ? 'PKR ' + line.credit.toLocaleString() : '-'}</td>
                      <td className="py-2.5 px-3 text-right font-bold">PKR {line.runningBalance.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#014582]" />
            Top Purchased Products
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-y border-gray-200">
                <tr>
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3 text-right">Total Qty</th>
                  <th className="py-3 px-3 text-right">Total Value</th>
                  <th className="py-3 px-3 text-right">Unit Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {topProducts.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-400">No product data found</td></tr>
                ) : (
                  topProducts.map((p: any) => (
                    <tr key={p.productId} className="hover:bg-blue-50/30">
                      <td className="py-3 px-3 font-bold text-gray-900">{p.name}</td>
                      <td className="py-3 px-3 font-mono text-gray-600">{p.sku || '-'}</td>
                      <td className="py-3 px-3 text-right text-gray-700">{p.totalQuantity}</td>
                      <td className="py-3 px-3 text-right font-bold text-[#014582]">PKR {p.totalValue.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-gray-600">PKR {(p.unitPrice || 0).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
