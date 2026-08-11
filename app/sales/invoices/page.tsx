'use client';

import { useState, useEffect } from 'react';
import { Search, RefreshCw, Plus, Eye, MoreVertical, X } from 'lucide-react';
import { SalesInvoice, InvoiceStats } from '@/types/sales-invoice';
import CreateInvoiceWizard from '@/components/sales-invoices/CreateInvoiceWizard';

const STATUS_COLORS: Record<string, string> = {
  'Draft': 'bg-orange-100 text-orange-700',
  'Posted': 'bg-blue-100 text-blue-700',
  'Partially Paid': 'bg-purple-100 text-purple-700',
  'Paid': 'bg-green-100 text-green-700',
  'Cancelled': 'bg-red-100 text-red-700',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  'Unpaid': 'bg-red-100 text-red-700',
  'Partial': 'bg-yellow-100 text-yellow-700',
  'Paid': 'bg-green-100 text-green-700',
  'Overdue': 'bg-red-100 text-red-800',
};

const pill = (map: Record<string, string>, val: string) =>
  `text-xs font-semibold px-2.5 py-1 rounded-full ${map[val] ?? 'bg-gray-100 text-gray-700'}`;

const STATUS_OPTIONS = ['all', 'Draft', 'Posted', 'Partially Paid', 'Paid', 'Cancelled'];

export default function SalesInvoicesPage() {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/sales-invoices?${params.toString()}`, {
        headers,
      });
      const result = await response.json();

      if (result.success && result.data) {
        setInvoices(result.data);
        if (result.kpi) {
          setStats(result.kpi);
        }
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateWizard(false);
    fetchInvoices();
  };

  const handleInvoiceClick = (invoice: SalesInvoice) => {
    setSelectedInvoice(invoice);
  };

  const handlePostInvoice = async (id: string) => {
    try {
      setActionLoading(`post-${id}`);
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/sales-invoices/${id}/post`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (result.success) {
        alert('Invoice posted successfully');
        fetchInvoices();
      } else {
        alert(result.message || 'Failed to post invoice');
      }
    } catch (error) {
      console.error('Failed to post invoice:', error);
      alert('Failed to post invoice');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this invoice?')) return;

    try {
      setActionLoading(`cancel-${id}`);
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/sales-invoices/${id}/cancel`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: 'Cancelled by user' }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Invoice cancelled successfully');
        fetchInvoices();
      } else {
        alert(result.message || 'Failed to cancel invoice');
      }
    } catch (error) {
      console.error('Failed to cancel invoice:', error);
      alert('Failed to cancel invoice');
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sales Invoices</h1>
        <p className="text-gray-600">Manage your sales invoices and track payments</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600">Draft</p>
            <p className="text-2xl font-bold text-orange-600">{stats.draft}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600">Posted</p>
            <p className="text-2xl font-bold text-blue-600">{stats.posted}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600">Outstanding</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.outstanding)}</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582] focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582] focus:border-transparent"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All Status' : option}
              </option>
            ))}
          </select>
          <button
            onClick={fetchInvoices}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} className="text-gray-600" />
          </button>
          <button
            onClick={() => setShowCreateWizard(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg hover:bg-[#6b4dff] transition-colors"
          >
            <Plus size={18} />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Invoice #
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Order #
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Customer
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Date
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Payment Status
              </th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Total
              </th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  Loading invoices...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  No invoices found
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold text-[#014582]">{invoice.invoiceNumber}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {invoice.orderNumber || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {invoice.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Date(invoice.invoiceDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={pill(STATUS_COLORS, invoice.invoiceStatus)}>
                      {invoice.invoiceStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={pill(PAYMENT_STATUS_COLORS, invoice.paymentStatus)}>
                      {invoice.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-semibold">
                    {formatCurrency(invoice.grandTotal)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleInvoiceClick(invoice)}
                        className="p-1.5 text-gray-600 hover:text-[#014582] hover:bg-gray-100 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {invoice.invoiceStatus === 'Draft' && (
                        <button
                          onClick={() => handlePostInvoice(invoice.id)}
                          disabled={actionLoading === `post-${invoice.id}`}
                          className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                          title="Post Invoice"
                        >
                          <RefreshCw size={16} />
                        </button>
                      )}
                      {(invoice.invoiceStatus === 'Draft' || invoice.invoiceStatus === 'Posted') && invoice.paidAmount === 0 && (
                        <button
                          onClick={() => handleCancelInvoice(invoice.id)}
                          disabled={actionLoading === `cancel-${invoice.id}`}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                          title="Cancel Invoice"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Invoice Wizard */}
      {showCreateWizard && (
        <CreateInvoiceWizard onClose={() => setShowCreateWizard(false)} onSuccess={handleCreateSuccess} />
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{selectedInvoice.invoiceNumber}</h2>
              <button onClick={() => setSelectedInvoice(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-semibold">{selectedInvoice.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order #</p>
                  <p className="font-semibold">{selectedInvoice.orderNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Invoice Date</p>
                  <p className="font-semibold">{new Date(selectedInvoice.invoiceDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="font-semibold">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Invoice Status</p>
                  <span className={pill(STATUS_COLORS, selectedInvoice.invoiceStatus)}>
                    {selectedInvoice.invoiceStatus}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <span className={pill(PAYMENT_STATUS_COLORS, selectedInvoice.paymentStatus)}>
                    {selectedInvoice.paymentStatus}
                  </span>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-1">Notes</p>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedInvoice.notes}</p>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Invoice Items</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">Product</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600">Qty</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600">Price</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600">Disc%</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600">Tax%</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedInvoice.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm">
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-xs text-gray-500">{item.sku}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-3 text-sm text-right">{item.discount}%</td>
                          <td className="px-4 py-3 text-sm text-right">{item.taxRate}%</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(item.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(selectedInvoice.discountTotal)}</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>Tax</span>
                  <span>{formatCurrency(selectedInvoice.taxTotal)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Grand Total</span>
                  <span className="text-[#014582]">{formatCurrency(selectedInvoice.grandTotal)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-gray-600">Paid Amount</span>
                  <span className="text-green-600">{formatCurrency(selectedInvoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Outstanding</span>
                  <span className="text-red-600">{formatCurrency(selectedInvoice.outstanding)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
