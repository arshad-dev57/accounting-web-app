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
  Settings, ChevronLeft, ChevronRight, Undo2,
  RotateCcw, Ban, FileCheck, MessageSquare,
  Star, StarHalf, ThumbsUp, ThumbsDown,
  HelpCircle, Info, ExternalLink, Upload,
  Image, Paperclip, Send, DownloadCloud,
  Wallet, Banknote, ArrowLeftRight, History,
  TrendingUp, TrendingDown, PieChart, BarChart3
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface Refund {
  _id?: string;
  refundNumber: string;
  refundDate: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  amount: number;
  refundStatus: 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Cancelled';
  refundMethod: 'Original Payment' | 'Store Credit' | 'Bank Transfer' | 'Cash' | 'Cheque';
  reason: string;
  notes?: string;
  referenceNumber?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  processedBy?: string;
  processedAt?: string;
  completedAt?: string;
  failureReason?: string;
  attachments?: { name: string; url: string; type: string }[];
  createdBy?: { _id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}

// ─────────────────────────────────────────────────────────────
// REFUND LIST VIEW
// ─────────────────────────────────────────────────────────────
function RefundList({ 
  refunds, 
  loading, 
  onView, 
  onProcess, 
  onComplete,
  onAdd,
  pagination,
  onPageChange,
  filters,
  onFilterChange,
  onRefresh,
  stats
}: {
  refunds: Refund[];
  loading: boolean;
  onView: (refund: Refund) => void;
  onProcess: (refund: Refund) => void;
  onComplete: (refund: Refund) => void;
  onAdd: () => void;
  pagination: { page: number; limit: number; total: number; pages: number; hasNext: boolean; hasPrev: boolean };
  onPageChange: (page: number) => void;
  filters: {
    search: string;
    status: string;
    method: string;
    fromDate: string;
    toDate: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onRefresh: () => void;
  stats: {
    total: number;
    totalAmount: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
}) {
  const statusOptions = ['all', 'Pending', 'Processing', 'Completed', 'Failed', 'Cancelled'];
  const methodOptions = ['all', 'Original Payment', 'Store Credit', 'Bank Transfer', 'Cash', 'Cheque'];

  const statusColors: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Processing: 'bg-blue-100 text-blue-700',
    Completed: 'bg-green-100 text-green-700',
    Failed: 'bg-red-100 text-red-700',
    Cancelled: 'bg-gray-100 text-gray-700',
  };

  const methodColors: Record<string, string> = {
    'Original Payment': 'bg-purple-100 text-purple-700',
    'Store Credit': 'bg-indigo-100 text-indigo-700',
    'Bank Transfer': 'bg-blue-100 text-blue-700',
    'Cash': 'bg-green-100 text-green-700',
    'Cheque': 'bg-orange-100 text-orange-700',
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
            <Wallet className="w-6 h-6 text-[#7c4dff]" />
            Refunds
            <span className="text-sm font-normal text-gray-400 ml-2">
              ({pagination.total} refunds)
            </span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">Manage customer refunds and payment reversals</p>
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
            <Plus className="w-4 h-4" />
            New Refund
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium">Total Refunds</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium">Total Amount</p>
          <p className="text-2xl font-bold text-[#7c4dff]">Rs. {(stats.totalAmount || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</p>
          <p className="text-xs text-gray-400">Awaiting processing</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium">Processing</p>
          <p className="text-2xl font-bold text-blue-600">{stats.processing || 0}</p>
          <p className="text-xs text-gray-400">In progress</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed || 0}</p>
          <p className="text-xs text-gray-400">Successfully processed</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium">Failed</p>
          <p className="text-2xl font-bold text-red-600">{stats.failed || 0}</p>
          <p className="text-xs text-gray-400">Need attention</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search refunds by order #, customer..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none"
            />
          </div>
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
          <select
            value={filters.method}
            onChange={(e) => onFilterChange('method', e.target.value)}
            className="px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 appearance-none"
          >
            {methodOptions.map((method) => (
              <option key={method} value={method}>
                {method === 'all' ? 'All Methods' : method}
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
            <p className="mt-2 text-gray-500">Loading refunds...</p>
          </div>
        ) : refunds.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">No refunds found</p>
            <p className="text-sm text-gray-400">Click "New Refund" to create one</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Refund #</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order #</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund) => (
                  <tr key={refund._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs font-semibold text-[#7c4dff]">
                      {refund.refundNumber}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-600">
                      {refund.orderNumber}
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-800">{refund.customerName}</p>
                      <p className="text-xs text-gray-400">{refund.customerEmail || ''}</p>
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={refund.refundMethod} colors={methodColors} />
                    </td>
                    <td className="px-6 py-3 font-semibold text-gray-700">
                      Rs. {refund.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={refund.refundStatus} colors={statusColors} />
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs">
                      {new Date(refund.refundDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onView(refund)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {refund.refundStatus === 'Pending' && (
                          <button
                            onClick={() => onProcess(refund)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Process"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
                        {refund.refundStatus === 'Processing' && (
                          <button
                            onClick={() => onComplete(refund)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                            title="Complete"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
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
      {refunds.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} refunds
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
// CREATE REFUND MODAL
// ─────────────────────────────────────────────────────────────
function CreateRefundModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  // ─── Refund Information ──────────────────────────────────
  const [refundData, setRefundData] = useState({
    orderId: '',
    orderNumber: '',
    customerId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    amount: 0,
    refundMethod: 'Original Payment',
    reason: '',
    notes: '',
    referenceNumber: '',
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
  });

  // ─── Handle Search Order ─────────────────────────────────
  const [searchOrder, setSearchOrder] = useState('');
  const [orderSearchLoading, setOrderSearchLoading] = useState(false);
  const [orderSearchResults, setOrderSearchResults] = useState<any[]>([]);

  const handleSearchOrder = async (value: string) => {
    setSearchOrder(value);
    if (value.length < 2) {
      setOrderSearchResults([]);
      return;
    }
    
    setOrderSearchLoading(true);
    try {
      // Mock API call - replace with actual
      setOrderSearchResults([
        { _id: '1', orderNumber: 'ORD-20260624-0001', customerName: 'John Doe', grandTotal: 1500 },
        { _id: '2', orderNumber: 'ORD-20260624-0002', customerName: 'Jane Smith', grandTotal: 2500 },
      ]);
    } catch (error) {
      console.error('Search order error:', error);
      setOrderSearchResults([]);
    } finally {
      setOrderSearchLoading(false);
    }
  };

  const handleSelectOrder = (order: any) => {
    setRefundData({
      ...refundData,
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerId: order.customerId || order._id,
      customerName: order.customerName,
      customerEmail: order.customerEmail || '',
      customerPhone: order.customerPhone || '',
      amount: order.grandTotal || 0,
    });
    setSearchOrder('');
    setOrderSearchResults([]);
  };

  // ─── Handle Submit ────────────────────────────────────────
  const handleSubmit = async () => {
    if (!refundData.orderId) {
      setError('Please select an order');
      return;
    }

    if (refundData.amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (!refundData.reason) {
      setError('Please provide a refund reason');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        ...refundData,
        refundStatus: 'Pending',
        refundDate: new Date().toISOString(),
        refundNumber: `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      };

      console.log('Refund payload:', payload);
      // await refundService.createRefund(payload);
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create refund');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#7c4dff]/10 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#7c4dff]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">New Refund</h2>
              <p className="text-xs text-gray-400">Process customer refund</p>
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

          <div className="space-y-4">
            {/* Find Order */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Search Order *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order number or customer name..."
                  value={searchOrder}
                  onChange={(e) => handleSearchOrder(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                />
                {orderSearchLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>

              {orderSearchResults.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto">
                  {orderSearchResults.map((order) => (
                    <div
                      key={order._id}
                      onClick={() => handleSelectOrder(order)}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono text-sm text-[#7c4dff]">{order.orderNumber}</p>
                          <p className="text-sm text-gray-600">{order.customerName}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Rs. {order.grandTotal}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Order Preview */}
            {refundData.orderNumber && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Order Selected</p>
                    <p className="font-mono text-sm text-[#7c4dff]">{refundData.orderNumber}</p>
                    <p className="text-sm text-gray-600">{refundData.customerName}</p>
                  </div>
                  <button
                    onClick={() => {
                      setRefundData({ 
                        ...refundData, 
                        orderId: '',
                        orderNumber: '',
                        customerId: '',
                        customerName: '',
                        amount: 0
                      });
                    }}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Refund Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Refund Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">Rs.</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={refundData.amount}
                    onChange={(e) => setRefundData({ ...refundData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Refund Method *
                </label>
                <select
                  value={refundData.refundMethod}
                  onChange={(e) => setRefundData({ ...refundData, refundMethod: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
                >
                  <option value="Original Payment">Original Payment</option>
                  <option value="Store Credit">Store Credit</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            {/* Bank Details - Show only for Bank Transfer */}
            {refundData.refundMethod === 'Bank Transfer' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Bank Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Bank Name</label>
                    <input
                      type="text"
                      placeholder="Enter bank name"
                      value={refundData.bankName}
                      onChange={(e) => setRefundData({ ...refundData, bankName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Account Number</label>
                    <input
                      type="text"
                      placeholder="Enter account number"
                      value={refundData.accountNumber}
                      onChange={(e) => setRefundData({ ...refundData, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      placeholder="Enter account holder name"
                      value={refundData.accountHolderName}
                      onChange={(e) => setRefundData({ ...refundData, accountHolderName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Reference Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Reference Number
              </label>
              <input
                type="text"
                placeholder="Enter reference number (optional)"
                value={refundData.referenceNumber}
                onChange={(e) => setRefundData({ ...refundData, referenceNumber: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Refund Reason *
              </label>
              <textarea
                placeholder="Please describe the reason for refund..."
                value={refundData.reason}
                onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 resize-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Additional Notes
              </label>
              <textarea
                placeholder="Any additional information..."
                value={refundData.notes}
                onChange={(e) => setRefundData({ ...refundData, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 resize-none"
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-bold text-gray-700 mb-3">Refund Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order</span>
                  <span className="font-medium">{refundData.orderNumber || 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer</span>
                  <span className="font-medium">{refundData.customerName || 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Method</span>
                  <span className="font-medium">{refundData.refundMethod}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-lg">
                  <span>Refund Amount</span>
                  <span className="text-[#7c4dff]">Rs. {refundData.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !refundData.orderId || refundData.amount <= 0}
                className="px-6 py-2.5 bg-[#7c4dff] text-white rounded-lg text-sm font-semibold hover:bg-[#6c3fe0] transition-all flex items-center gap-2 shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Process Refund
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// REFUND DETAILS MODAL
// ─────────────────────────────────────────────────────────────
function RefundDetailModal({ refund, onClose, onProcess, onComplete }: { 
  refund: Refund; 
  onClose: () => void;
  onProcess?: (id: string) => void;
  onComplete?: (id: string) => void;
}) {
  const statusColors: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Processing: 'bg-blue-100 text-blue-700',
    Completed: 'bg-green-100 text-green-700',
    Failed: 'bg-red-100 text-red-700',
    Cancelled: 'bg-gray-100 text-gray-700',
  };

  const methodColors: Record<string, string> = {
    'Original Payment': 'bg-purple-100 text-purple-700',
    'Store Credit': 'bg-indigo-100 text-indigo-700',
    'Bank Transfer': 'bg-blue-100 text-blue-700',
    'Cash': 'bg-green-100 text-green-700',
    'Cheque': 'bg-orange-100 text-orange-700',
  };

  const StatusBadge = ({ status, colors }: { status: string; colors: Record<string, string> }) => (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status || 'N/A'}
    </span>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#7c4dff]/10 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#7c4dff]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{refund.refundNumber}</h2>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <StatusBadge status={refund.refundStatus} colors={statusColors} />
                <span className="text-xs text-gray-400">• {new Date(refund.refundDate).toLocaleDateString()}</span>
                <span className="text-xs text-gray-400">• {refund.refundMethod}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-all">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer & Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-xs text-gray-400 font-medium">Customer</p>
              <p className="font-semibold text-gray-800">{refund.customerName}</p>
              <p className="text-sm text-gray-600">{refund.customerEmail || 'N/A'}</p>
              <p className="text-sm text-gray-600">{refund.customerPhone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Order</p>
              <p className="font-mono text-sm text-[#7c4dff]">{refund.orderNumber}</p>
              <p className="text-sm text-gray-600">Method: {refund.refundMethod}</p>
              {refund.referenceNumber && (
                <p className="text-sm text-gray-600">Reference: {refund.referenceNumber}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Refund Reason</p>
              <p className="text-sm text-gray-700">{refund.reason}</p>
              {refund.notes && (
                <p className="text-sm text-gray-500 mt-1">{refund.notes}</p>
              )}
            </div>
          </div>

          {/* Bank Details - if Bank Transfer */}
          {refund.refundMethod === 'Bank Transfer' && (refund.bankName || refund.accountNumber) && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Bank Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {refund.bankName && (
                  <div>
                    <p className="text-xs text-gray-400">Bank Name</p>
                    <p className="font-medium text-gray-700">{refund.bankName}</p>
                  </div>
                )}
                {refund.accountNumber && (
                  <div>
                    <p className="text-xs text-gray-400">Account Number</p>
                    <p className="font-medium text-gray-700">{refund.accountNumber}</p>
                  </div>
                )}
                {refund.accountHolderName && (
                  <div>
                    <p className="text-xs text-gray-400">Account Holder</p>
                    <p className="font-medium text-gray-700">{refund.accountHolderName}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Refund Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Refund Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Refund Amount</span>
                  <span className="font-bold text-[#7c4dff]">Rs. {refund.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Method</span>
                  <span>{refund.refundMethod}</span>
                </div>
                {refund.processedBy && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processed By</span>
                    <span>{refund.processedBy}</span>
                  </div>
                )}
                {refund.processedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processed At</span>
                    <span>{new Date(refund.processedAt).toLocaleString()}</span>
                  </div>
                )}
                {refund.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed At</span>
                    <span>{new Date(refund.completedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Status Timeline</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-yellow-500"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Refund Requested</p>
                    <p className="text-xs text-gray-400">{new Date(refund.refundDate).toLocaleString()}</p>
                  </div>
                </div>
                {refund.processedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Processing Started</p>
                      <p className="text-xs text-gray-400">{new Date(refund.processedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {refund.completedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Refund Completed</p>
                      <p className="text-xs text-gray-400">{new Date(refund.completedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {refund.refundStatus === 'Failed' && refund.failureReason && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Failed</p>
                      <p className="text-xs text-red-500">{refund.failureReason}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {refund.refundStatus === 'Pending' && onProcess && (
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => onProcess(refund._id!)}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" /> Process Refund
              </button>
            </div>
          )}

          {refund.refundStatus === 'Processing' && onComplete && (
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => onComplete(refund._id!)}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Complete Refund
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
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
    totalAmount: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  });

  // ─── Filters ──────────────────────────────────────────────
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    method: 'all',
    fromDate: '',
    toDate: ''
  });

  // ─── Mock Data ─────────────────────────────────────────────
  useEffect(() => {
    const mockRefunds: Refund[] = [
      {
        _id: '1',
        refundNumber: 'REF-20260624-0001',
        refundDate: new Date().toISOString(),
        orderId: '1',
        orderNumber: 'ORD-20260624-0001',
        customerId: '1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+92 300 1234567',
        amount: 1500,
        refundStatus: 'Pending',
        refundMethod: 'Original Payment',
        reason: 'Customer requested refund',
        notes: 'Product was damaged',
        createdBy: { _id: '1', name: 'Admin' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '2',
        refundNumber: 'REF-20260623-0002',
        refundDate: new Date(Date.now() - 86400000).toISOString(),
        orderId: '2',
        orderNumber: 'ORD-20260623-0002',
        customerId: '2',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        customerPhone: '+92 300 7654321',
        amount: 2500,
        refundStatus: 'Processing',
        refundMethod: 'Bank Transfer',
        reason: 'Order cancellation',
        referenceNumber: 'BT-20260623-001',
        bankName: 'HBL',
        accountNumber: '1234-5678-9012',
        accountHolderName: 'Jane Smith',
        processedBy: 'Admin',
        processedAt: new Date(Date.now() - 43200000).toISOString(),
        createdBy: { _id: '1', name: 'Admin' },
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 43200000).toISOString()
      },
      {
        _id: '3',
        refundNumber: 'REF-20260622-0003',
        refundDate: new Date(Date.now() - 172800000).toISOString(),
        orderId: '3',
        orderNumber: 'ORD-20260622-0003',
        customerId: '3',
        customerName: 'Ali Khan',
        customerEmail: 'ali@example.com',
        customerPhone: '+92 300 9876543',
        amount: 750,
        refundStatus: 'Completed',
        refundMethod: 'Store Credit',
        reason: 'Product exchange',
        processedBy: 'Admin',
        processedAt: new Date(Date.now() - 86400000).toISOString(),
        completedAt: new Date(Date.now() - 43200000).toISOString(),
        createdBy: { _id: '1', name: 'Admin' },
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 43200000).toISOString()
      },
      {
        _id: '4',
        refundNumber: 'REF-20260621-0004',
        refundDate: new Date(Date.now() - 259200000).toISOString(),
        orderId: '4',
        orderNumber: 'ORD-20260621-0004',
        customerId: '4',
        customerName: 'Maria Khan',
        customerEmail: 'maria@example.com',
        customerPhone: '+92 300 5555555',
        amount: 3200,
        refundStatus: 'Failed',
        refundMethod: 'Original Payment',
        reason: 'Payment gateway error',
        failureReason: 'Bank declined the transaction',
        createdBy: { _id: '1', name: 'Admin' },
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString()
      }
    ];

    setRefunds(mockRefunds);
    setStats({
      total: mockRefunds.length,
      totalAmount: mockRefunds.reduce((sum, r) => sum + r.amount, 0),
      pending: mockRefunds.filter(r => r.refundStatus === 'Pending').length,
      processing: mockRefunds.filter(r => r.refundStatus === 'Processing').length,
      completed: mockRefunds.filter(r => r.refundStatus === 'Completed').length,
      failed: mockRefunds.filter(r => r.refundStatus === 'Failed').length
    });
    setPagination({
      page: 1,
      limit: 10,
      total: mockRefunds.length,
      pages: 1,
      hasNext: false,
      hasPrev: false
    });
    setLoading(false);
  }, []);

  // ─── Handlers ──────────────────────────────────────────────
  const handleView = (refund: Refund) => {
    setSelectedRefund(refund);
    setShowDetailModal(true);
  };

  const handleProcess = (refund: Refund) => {
    console.log('Process refund:', refund);
  };

  const handleComplete = (refund: Refund) => {
    console.log('Complete refund:', refund);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
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
        <h1 className="text-2xl font-bold text-gray-800">Refunds</h1>
      </div>

      <RefundList
        refunds={refunds}
        loading={loading}
        onView={handleView}
        onProcess={handleProcess}
        onComplete={handleComplete}
        onAdd={() => setShowCreateModal(true)}
        pagination={pagination}
        onPageChange={handlePageChange}
        filters={filters}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
        stats={stats}
      />

      {showCreateModal && (
        <CreateRefundModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {showDetailModal && selectedRefund && (
        <RefundDetailModal
          refund={selectedRefund}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedRefund(null);
          }}
          onProcess={handleProcess}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}