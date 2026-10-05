'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
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
  ShoppingBag,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function SupplierDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [supplier, setSupplier] = useState<any>(null);
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'invoices' | 'payments' | 'returns'>('ledger');

  const fetchSupplierData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);

      // Fetch supplier profile & supplier ledger simultaneously
      const [supRes, ledgerRes] = await Promise.all([
        apiClient.get('/api/warehouse/suppliers/' + id).catch((e) => {
          console.error('Supplier fetch error:', e);
          return null;
        }),
        apiClient.get('/api/warehouse/suppliers/' + id + '/ledger').catch((e) => {
          console.error('Supplier ledger fetch error:', e);
          return null;
        })
      ]);

      let supObj = null;
      if (supRes && supRes.success && supRes.data) {
        const raw = supRes.data;
        supObj = raw.data?.supplier || raw.data || raw.supplier || raw;
      }

      let ledgerObj = null;
      if (ledgerRes && ledgerRes.success && ledgerRes.data) {
        const rawLedger = ledgerRes.data;
        ledgerObj = rawLedger.data || rawLedger;
      }

      if (!supObj && ledgerObj?.supplier) {
        supObj = ledgerObj.supplier;
      }

      if (supObj) {
        setSupplier(supObj);
        if (ledgerObj) {
          setLedgerData(ledgerObj);
        }
      } else {
        setError('Supplier details could not be found.');
      }
    } catch (err: any) {
      console.error('Error fetching supplier detail:', err);
      setError(err.message || 'Failed to load supplier details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplierData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#014582] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-500 font-medium">Loading Supplier Ledger & Financial Accounts...</p>
        </div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="inline-flex p-3 rounded-full bg-red-50 text-red-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-gray-800">{error || 'Supplier Not Found'}</h2>
        <div>
          <Link
            href="/warehouse/suppliers"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#014582] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Suppliers List
          </Link>
        </div>
      </div>
    );
  }

  const ledger = ledgerData?.ledger || [];
  const totals = ledgerData?.totals || { localBalance: supplier.balance || supplier.currentBalance || 0 };

  const invoices = ledger.filter((l: any) => l.documentType === 'Purchase Invoice');
  const payments = ledger.filter((l: any) => l.documentType === 'Payment');
  const returns = ledger.filter((l: any) => l.documentType === 'Purchase Return');

  const totalInvoiced = invoices.reduce((acc: number, curr: any) => acc + (curr.localAmount || 0), 0);
  const totalPaid = payments.reduce((acc: number, curr: any) => acc + (curr.localAmount || 0), 0);
  const totalReturned = returns.reduce((acc: number, curr: any) => acc + (curr.localAmount || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/warehouse/suppliers"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#014582] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Suppliers Master List
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSupplierData}
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
            Print AP Ledger
          </button>
        </div>
      </div>

      {/* Supplier Profile Header Card */}
      <div className="bg-gradient-to-r from-[#00274d] via-[#014582] to-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 uppercase tracking-wider">
                Supplier Profile
              </span>
              <span className={'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ' + 
                (supplier.status === 'Active' || supplier.isActive !== false ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300')}>
                {supplier.status || 'Active'}
              </span>
              {supplier.code && (
                <span className="text-xs text-white/70 font-mono">Code: {supplier.code}</span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">{supplier.name || supplier.companyName}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-white/80">
              {supplier.contactPerson && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-white/60" />
                  Contact: {supplier.contactPerson}
                </span>
              )}
              {supplier.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-white/60" />
                  {supplier.email}
                </span>
              )}
              {supplier.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-white/60" />
                  {supplier.phone}
                </span>
              )}
              {supplier.taxNumber && (
                <span className="flex items-center gap-1 font-mono text-[11px] bg-white/10 px-2 py-0.5 rounded">
                  NTN: {supplier.taxNumber}
                </span>
              )}
            </div>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 gap-3 min-w-[280px]">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15">
              <div className="text-[10px] uppercase font-bold text-white/70">Net Accounts Payable</div>
              <div className="text-lg font-black text-rose-300">
                Rs. {(totals.localBalance || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15">
              <div className="text-[10px] uppercase font-bold text-white/70">Payment Terms</div>
              <div className="text-sm font-bold text-white mt-1">
                {supplier.paymentTerms || 'Net 30'}
              </div>
            </div>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/15">
          <div>
            <div className="text-[10px] text-white/60 font-semibold uppercase">Total Purchases (Debit)</div>
            <div className="text-sm font-bold text-white">Rs. {totalInvoiced.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/60 font-semibold uppercase">Total Payments Made (Credit)</div>
            <div className="text-sm font-bold text-emerald-300">Rs. {totalPaid.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/60 font-semibold uppercase">Purchase Returns</div>
            <div className="text-sm font-bold text-amber-300">Rs. {totalReturned.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/60 font-semibold uppercase">Ledger Records</div>
            <div className="text-sm font-bold text-white">{ledger.length} Entries</div>
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
          Payables Ledger ({ledger.length})
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={'px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ' +
            (activeTab === 'invoices' ? 'border-[#014582] text-[#014582]' : 'border-transparent text-gray-500 hover:text-gray-800')}
        >
          <ShoppingBag className="w-4 h-4" />
          Purchase Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={'px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ' +
            (activeTab === 'payments' ? 'border-[#014582] text-[#014582]' : 'border-transparent text-gray-500 hover:text-gray-800')}
        >
          <CreditCard className="w-4 h-4" />
          Payments Made ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={'px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ' +
            (activeTab === 'returns' ? 'border-[#014582] text-[#014582]' : 'border-transparent text-gray-500 hover:text-gray-800')}
        >
          <RotateCcw className="w-4 h-4" />
          Returns ({returns.length})
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={'px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ' +
            (activeTab === 'overview' ? 'border-[#014582] text-[#014582]' : 'border-transparent text-gray-500 hover:text-gray-800')}
        >
          <Building2 className="w-4 h-4" />
          Supplier Info
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Supplier Statement / AP Ledger</h3>
              <p className="text-xs text-gray-500">Chronological transaction history with running balance</p>
            </div>
            <div className="text-xs font-bold text-gray-700">
              Net Payable:{' '}
              <span className="text-[#014582]">
                Rs. {(totals.localBalance || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {ledger.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium">No ledger records found for this supplier.</p>
              <p className="text-xs text-gray-400 mt-1">Purchase invoices and payment vouchers will be listed here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200">
                    <th className="p-3">Date</th>
                    <th className="p-3">Doc #</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Direction</th>
                    <th className="p-3 text-right">Debit (Purchase)</th>
                    <th className="p-3 text-right">Credit (Paid/Return)</th>
                    <th className="p-3 text-right font-black">Running Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium">
                  {ledger.map((row: any, idx: number) => {
                    const isDebit = row.direction === 'debit';
                    return (
                      <tr key={row.documentId || idx} className="hover:bg-blue-50/50 transition-colors">
                        <td className="p-3 whitespace-nowrap text-gray-600">
                          {row.date ? new Date(row.date).toLocaleDateString() : '-'}
                        </td>
                        <td className="p-3 font-mono font-bold text-[#014582]">{row.documentNumber || '-'}</td>
                        <td className="p-3 font-semibold text-gray-800">{row.documentType}</td>
                        <td className="p-3">
                          <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ' +
                            (isDebit ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800')}>
                            {row.direction}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-gray-900">
                          {isDebit ? 'Rs. ' + row.localAmount.toLocaleString() : '-'}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-600">
                          {!isDebit ? 'Rs. ' + row.localAmount.toLocaleString() : '-'}
                        </td>
                        <td className="p-3 text-right font-black text-[#014582] bg-blue-50/30">
                          Rs. {(row.localBalance || 0).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                    <td colSpan={4} className="p-3 text-right uppercase text-[10px] text-gray-600">Totals:</td>
                    <td className="p-3 text-right font-bold text-gray-900">
                      Rs. {totalInvoiced.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-600">
                      Rs. {(totalPaid + totalReturned).toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-black text-[#014582]">
                      Rs. {(totals.localBalance || 0).toLocaleString()}
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
            Purchase Invoices ({invoices.length})
          </div>
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs">No purchase invoices found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider text-[10px] border-b">
                    <th className="p-3">Date</th>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Direction</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoices.map((inv: any, idx: number) => (
                    <tr key={inv.documentId || idx} className="hover:bg-gray-50">
                      <td className="p-3 text-gray-600">{inv.date ? new Date(inv.date).toLocaleDateString() : '-'}</td>
                      <td className="p-3 font-mono font-bold text-[#014582]">{inv.documentNumber}</td>
                      <td className="p-3 capitalize">{inv.direction}</td>
                      <td className="p-3 text-right font-bold text-gray-900">Rs. {inv.localAmount?.toLocaleString()}</td>
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
            Payments Made ({payments.length})
          </div>
          {payments.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs">No payment records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider text-[10px] border-b">
                    <th className="p-3">Date</th>
                    <th className="p-3">Payment #</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map((p: any, idx: number) => (
                    <tr key={p.documentId || idx} className="hover:bg-gray-50">
                      <td className="p-3 text-gray-600">{p.date ? new Date(p.date).toLocaleDateString() : '-'}</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">{p.documentNumber}</td>
                      <td className="p-3">{p.documentType}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">Rs. {p.localAmount?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'returns' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 font-bold text-sm text-gray-800">
            Purchase Returns ({returns.length})
          </div>
          {returns.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs">No purchase returns recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider text-[10px] border-b">
                    <th className="p-3">Date</th>
                    <th className="p-3">Return #</th>
                    <th className="p-3 text-right">Return Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {returns.map((ret: any, idx: number) => (
                    <tr key={ret.documentId || idx} className="hover:bg-gray-50">
                      <td className="p-3 text-gray-600">{ret.date ? new Date(ret.date).toLocaleDateString() : '-'}</td>
                      <td className="p-3 font-mono font-bold text-amber-700">{ret.documentNumber}</td>
                      <td className="p-3 text-right font-bold text-amber-600">Rs. {ret.localAmount?.toLocaleString()}</td>
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
          {/* Company Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#014582]" />
              Supplier & Company Profile
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500 block">Supplier Name</span>
                <span className="font-bold text-gray-800">{supplier.name}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Company Name</span>
                <span className="font-bold text-gray-800">{supplier.companyName || supplier.name}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Supplier Code</span>
                <span className="font-bold text-gray-800 font-mono">{supplier.code || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Contact Person</span>
                <span className="font-bold text-gray-800">{supplier.contactPerson || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Email Address</span>
                <span className="font-bold text-gray-800">{supplier.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Phone Number</span>
                <span className="font-bold text-gray-800">{supplier.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Tax & Payment Policy */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#014582]" />
              Tax & Financial Terms
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500 block">NTN / Tax ID</span>
                <span className="font-bold text-gray-800">{supplier.taxNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Payment Terms</span>
                <span className="font-bold text-gray-800">{supplier.paymentTerms || 'Net 30'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Currency</span>
                <span className="font-bold text-gray-800">{supplier.currency?.code || 'PKR'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Category</span>
                <span className="font-bold text-gray-800">{supplier.category || 'Standard'}</span>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm md:col-span-2">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#014582]" />
              Physical Address
            </h3>
            <div className="bg-gray-50 p-3 rounded-lg border text-xs">
              <p className="text-gray-700 font-medium">
                {supplier.address || supplier.street || 'No street address specified'}
              </p>
              <p className="text-gray-600 mt-1">
                {[supplier.city, supplier.state, supplier.postalCode, supplier.country].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
