'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Plus, Eye, DollarSign, Users,
  ChevronDown, ChevronLeft, ChevronRight, Loader2,
  X, AlertCircle, CheckCircle, Clock,
  Calendar, FileText,
  RefreshCw, Trash2, Package, ShoppingBag,
  Check, AlertTriangle,
  Ban, Filter, CircleCheck, CircleX,
  Receipt, ShoppingCart, Banknote, CreditCard,
  Building2, User, Phone, Mail, MapPin
} from 'lucide-react';
import { salesRefundService, RefundModel, RefundStats, OrderModel } from '../../api/salesrefunds/route';
import { useLocation } from '@/lib/location-context';

// ─── TYPES ─────────────────────────────────────────────────────

interface CreateFormState {
  selectedOrder: OrderModel | null;
  orderSearchResults: OrderModel[];
  isSearchingOrders: boolean;
  amount: string;
  reason: string;
  notes: string;
  referenceNumber: string;
  refundMethod: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export default function SalesRefundsPage() {
  const { selectedLocationId, selectedLocation } = useLocation();
  const [refunds, setRefunds] = useState<RefundModel[]>([]);
  const [filteredRefunds, setFilteredRefunds] = useState<RefundModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [stats, setStats] = useState<RefundStats>({
    total: 0,
    totalAmount: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewingRefund, setViewingRefund] = useState<RefundModel | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [refundToActOn, setRefundToActOn] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // ─── Create Form State ──────────────────────────────────────
  const [formState, setFormState] = useState<CreateFormState>({
    selectedOrder: null,
    orderSearchResults: [],
    isSearchingOrders: false,
    amount: '',
    reason: '',
    notes: '',
    referenceNumber: '',
    refundMethod: 'Original Payment',
    bankName: '',
    accountNumber: '',
    accountHolderName: ''
  });

  const statusOptions = ['all', 'Pending', 'Processing', 'Completed', 'Failed', 'Cancelled'];
  const methodOptions = ['all', 'Original Payment', 'Bank Transfer', 'Cash', 'Store Credit', 'Cheque'];
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch Refunds ────────────────────────────────────────────

  const fetchRefunds = useCallback(async (resetPage = true) => {
    setLoading(true);
    try {
      const page = resetPage ? 1 : pagination.page;
      const response = await salesRefundService.getRefunds({
        page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        method: methodFilter !== 'all' ? methodFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        locationId: selectedLocationId || undefined,
      });

      setRefunds(response.data || []);
      setFilteredRefunds(response.data || []);
      setPagination(response.pagination);
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (error: any) {
      console.error('Failed to fetch refunds:', error);
      alert(error.message || 'Failed to load refunds');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, methodFilter, fromDate, toDate, pagination.page, pagination.limit, selectedLocationId]);

  // ─── Load More ──────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!pagination.hasNext || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const response = await salesRefundService.getRefunds({
        page: nextPage,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        method: methodFilter !== 'all' ? methodFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        locationId: selectedLocationId || undefined,
      });

      setRefunds(prev => [...prev, ...(response.data || [])]);
      setFilteredRefunds(prev => [...prev, ...(response.data || [])]);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load more refunds:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [pagination.hasNext, pagination.page, pagination.limit, searchTerm, statusFilter, methodFilter, fromDate, toDate, selectedLocationId]);

  // ─── Apply Local Filters ────────────────────────────────────

  useEffect(() => {
    const filtered = refunds.filter(item => {
      if (selectedFilter !== 'all' && item.refundStatus !== selectedFilter) {
        return false;
      }
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matches = item.refundNumber.toLowerCase().includes(query) ||
          item.customerName.toLowerCase().includes(query) ||
          item.orderNumber.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
    setFilteredRefunds(filtered);
  }, [refunds, selectedFilter, searchTerm]);

  // ─── Initial Fetch ──────────────────────────────────────────

  useEffect(() => {
    fetchRefunds(true);
  }, []);

  useEffect(() => {
    fetchRefunds(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocationId]);

  // ─── Search ──────────────────────────────────────────────────

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    fetchRefunds(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
    fetchRefunds(true);
  };

  // ─── Filter Changes ──────────────────────────────────────────

  const handleStatusFilterChange = (filter: string) => {
    setStatusFilter(filter);
    fetchRefunds(true);
  };

  const handleMethodFilterChange = (filter: string) => {
    setMethodFilter(filter);
    fetchRefunds(true);
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  const handleDateFilter = () => {
    fetchRefunds(true);
  };

  const handleRefresh = () => {
    fetchRefunds(true);
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchRefunds(false);
  };

  // ─── Create Form Functions ───────────────────────────────────

  const openCreateForm = () => {
    resetForm();
    setShowCreateForm(true);
  };

  const closeCreateForm = () => {
    setShowCreateForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormState({
      selectedOrder: null,
      orderSearchResults: [],
      isSearchingOrders: false,
      amount: '',
      reason: '',
      notes: '',
      referenceNumber: '',
      refundMethod: 'Original Payment',
      bankName: '',
      accountNumber: '',
      accountHolderName: ''
    });
  };

  const searchOrders = async (query: string) => {
    if (query.trim().length < 2) {
      setFormState(prev => ({ ...prev, orderSearchResults: [] }));
      return;
    }
    setFormState(prev => ({ ...prev, isSearchingOrders: true }));
    try {
      const results = await salesRefundService.searchOrders(query, 10, selectedLocationId || undefined);
      setFormState(prev => ({ ...prev, orderSearchResults: results }));
    } catch (error) {
      console.error('Failed to search orders:', error);
      setFormState(prev => ({ ...prev, orderSearchResults: [] }));
    } finally {
      setFormState(prev => ({ ...prev, isSearchingOrders: false }));
    }
  };

  const selectOrder = (order: OrderModel) => {
    setFormState(prev => ({
      ...prev,
      selectedOrder: order,
      orderSearchResults: [],
      amount: order.grandTotal.toString()
    }));
  };

  // ─── Create Refund ──────────────────────────────────────────

  const handleCreateRefund = async () => {
    if (!formState.selectedOrder) {
      alert('Please select an order');
      return;
    }

    const amount = parseFloat(formState.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Enter a valid refund amount');
      return;
    }

    if (!formState.reason.trim()) {
      alert('Please provide a refund reason');
      return;
    }

    if (formState.refundMethod === 'Bank Transfer') {
      if (!formState.bankName.trim() || !formState.accountNumber.trim() || !formState.accountHolderName.trim()) {
        alert('Bank details are required for bank transfer');
        return;
      }
    }

    setSubmitting(true);
    try {
      await salesRefundService.createRefund({
        orderId: formState.selectedOrder.id,
        orderNumber: formState.selectedOrder.orderNumber,
        customerName: formState.selectedOrder.customerName,
        customerEmail: formState.selectedOrder.customerEmail || '',
        customerPhone: formState.selectedOrder.customerPhone || '',
        amount: amount,
        refundMethod: formState.refundMethod,
        reason: formState.reason,
        notes: formState.notes || undefined,
        referenceNumber: formState.referenceNumber || undefined,
        bankName: formState.bankName || undefined,
        accountNumber: formState.accountNumber || undefined,
        accountHolderName: formState.accountHolderName || undefined
      });

      closeCreateForm();
      fetchRefunds(true);
    } catch (error: any) {
      console.error('Failed to create refund:', error);
      alert(error.message || 'Failed to create refund');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Refund Actions ──────────────────────────────────────────

  const handleProcessRefund = async (id: string) => {
    setSubmitting(true);
    try {
      await salesRefundService.processRefund(id);
      setViewingRefund(null);
      fetchRefunds(true);
    } catch (error: any) {
      console.error('Failed to process refund:', error);
      alert(error.message || 'Failed to process refund');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteRefund = async (id: string) => {
    setSubmitting(true);
    try {
      await salesRefundService.completeRefund(id);
      setViewingRefund(null);
      fetchRefunds(true);
    } catch (error: any) {
      console.error('Failed to complete refund:', error);
      alert(error.message || 'Failed to complete refund');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRefund = async () => {
    if (!refundToActOn) return;
    setSubmitting(true);
    try {
      await salesRefundService.cancelRefund(refundToActOn, cancelReason || 'Cancelled by user');
      setShowCancelConfirm(false);
      setRefundToActOn(null);
      setCancelReason('');
      setViewingRefund(null);
      fetchRefunds(true);
    } catch (error: any) {
      console.error('Failed to cancel refund:', error);
      alert(error.message || 'Failed to cancel refund');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRefund = async () => {
    if (!refundToActOn) return;
    setSubmitting(true);
    try {
      await salesRefundService.deleteRefund(refundToActOn);
      setShowDeleteConfirm(false);
      setRefundToActOn(null);
      setViewingRefund(null);
      fetchRefunds(true);
    } catch (error: any) {
      console.error('Failed to delete refund:', error);
      alert(error.message || 'Failed to delete refund');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── View Refund Detail ─────────────────────────────────────

  const viewRefundDetail = (refund: RefundModel) => {
    setViewingRefund(refund);
  };

  // ─── Helper Functions ──────────────────────────────────────

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700';
      case 'Processing':
        return 'bg-blue-100 text-blue-700';
      case 'Failed':
      case 'Cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Processing':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'Failed':
        return <CircleX className="w-4 h-4 text-red-600" />;
      case 'Cancelled':
        return <Ban className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ─── RENDER ──────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {showCreateForm ? (
        <CreateRefundForm
          formState={formState}
          setFormState={setFormState}
          searchOrders={searchOrders}
          selectOrder={selectOrder}
          handleCreateRefund={handleCreateRefund}
          closeCreateForm={closeCreateForm}
          submitting={submitting}
          formatCurrency={formatCurrency}
          methodOptions={methodOptions.filter(m => m !== 'all')}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/warehouse/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </Link>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-[#014582]" />
                Sales Refunds
                <span className="text-sm font-normal text-gray-400 ml-2">
                  ({pagination.total} refunds)
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#014582] transition-all"
                title="Refresh"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={openCreateForm}
                className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all shadow-lg shadow-[#014582]/25"
              >
                <Plus className="w-4 h-4" />
                Create Refund
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <strong>Flow:</strong> Create refund as Pending → <strong>Complete</strong> to post cash refund (Dr AR / Cr Bank).
            Stock is restored when the linked return is completed, not here.
          </div>

          {selectedLocation && (
            <div className="flex items-center gap-2 text-sm text-sky-800 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              Showing refunds for <strong>{selectedLocation.name}</strong>
              <span className="text-sky-600 font-mono text-xs">({selectedLocation.code})</span>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-medium">Total</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{stats.total}</p>
              <p className="text-sm font-semibold text-purple-600">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-medium">Pending</p>
              <p className="text-xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-medium">Processing</p>
              <p className="text-xl font-bold text-blue-600 mt-1">{stats.processing}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-medium">Completed</p>
              <p className="text-xl font-bold text-green-600 mt-1">{stats.completed}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-medium">Failed</p>
              <p className="text-xl font-bold text-red-600 mt-1">{stats.failed}</p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search refunds..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                />
                {searchTerm && (
                  <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={methodFilter}
                  onChange={(e) => handleMethodFilterChange(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                >
                  {methodOptions.map((method) => (
                    <option key={method} value={method}>
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                />
                <span className="text-gray-400 text-sm">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                />
                <button
                  onClick={handleDateFilter}
                  className="px-4 py-2 bg-[#014582]/10 text-[#014582] rounded-lg text-sm font-semibold hover:bg-[#014582]/20 transition-all"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Status Quick Filters */}
          <div className="flex flex-wrap gap-2">
            {['all', 'Pending', 'Processing', 'Completed', 'Failed'].map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedFilter === filter
                    ? 'bg-[#014582] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Refund</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && refunds.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
                        <p className="mt-2 text-gray-500">Loading refunds...</p>
                      </td>
                    </tr>
                  ) : filteredRefunds.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium text-gray-500">No refunds found</p>
                        <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRefunds.map((refund) => (
                      <tr key={refund.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3">
                          <div>
                            <p className="font-medium text-[#014582]">{refund.refundNumber}</p>
                            <p className="text-xs text-gray-400">{formatDate(refund.refundDate)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <p className="text-gray-800">{refund.orderNumber}</p>
                        </td>
                        <td className="px-6 py-3">
                          <p className="text-gray-800">{refund.customerName}</p>
                        </td>
                        <td className="px-6 py-3">
                          <p className="font-semibold text-gray-800">{formatCurrency(refund.amount)}</p>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-xs bg-purple-50 text-purple-700 font-semibold px-2.5 py-1 rounded-full">
                            {refund.refundMethod}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit ${getStatusColor(refund.refundStatus)}`}>
                            {getStatusIcon(refund.refundStatus)}
                            {refund.refundStatus}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => viewRefundDetail(refund)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="View Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {refund.refundStatus === 'Pending' && (
                              <button
                                onClick={() => handleProcessRefund(refund.id)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Process"
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                            )}
                            {refund.refundStatus === 'Processing' && (
                              <button
                                onClick={() => handleCompleteRefund(refund.id)}
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                title="Complete"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {(refund.refundStatus === 'Pending' || refund.refundStatus === 'Processing') && (
                              <button
                                onClick={() => {
                                  setRefundToActOn(refund.id);
                                  setShowCancelConfirm(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Cancel"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                            {(refund.refundStatus === 'Failed' || refund.refundStatus === 'Cancelled') && (
                              <button
                                onClick={() => {
                                  setRefundToActOn(refund.id);
                                  setShowDeleteConfirm(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
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

            {/* Load More */}
            {pagination.hasNext && filteredRefunds.length > 0 && (
              <div className="flex justify-center py-4 border-t border-gray-100">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2 text-sm font-semibold text-[#014582] hover:bg-[#014582]/10 rounded-lg transition-all disabled:opacity-50"
                >
                  {loadingMore ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} –{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} refunds
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 bg-[#014582]/10 text-[#014582] font-semibold rounded-lg">
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Refund Detail Modal */}
      {viewingRefund && (
        <RefundDetailModal
          refund={viewingRefund}
          onClose={() => setViewingRefund(null)}
          onProcess={handleProcessRefund}
          onComplete={handleCompleteRefund}
          onCancelRefund={(id: string) => {
            setRefundToActOn(id);
            setShowCancelConfirm(true);
            setViewingRefund(null);
          }}
          onDelete={(id) => {
            setRefundToActOn(id);
            setShowDeleteConfirm(true);
            setViewingRefund(null);
          }}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          submitting={submitting}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <ConfirmationModal
          title="Cancel Refund"
          message="Are you sure you want to cancel this refund? This action cannot be undone."
          confirmLabel="Cancel Refund"
          confirmColor="bg-red-500 hover:bg-red-600"
          onConfirm={handleCancelRefund}
          onCancel={() => {
            setShowCancelConfirm(false);
            setRefundToActOn(null);
            setCancelReason('');
          }}
          loading={submitting}
          extraContent={
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason (Optional)</label>
              <input
                type="text"
                placeholder="Enter reason for cancellation"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
              />
            </div>
          }
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <ConfirmationModal
          title="Delete Refund"
          message="Are you sure you want to delete this refund? This action cannot be undone."
          confirmLabel="Delete"
          confirmColor="bg-red-500 hover:bg-red-600"
          onConfirm={handleDeleteRefund}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setRefundToActOn(null);
          }}
          loading={submitting}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CREATE REFUND FORM
// ═══════════════════════════════════════════════════════════════

function CreateRefundForm({
  formState,
  setFormState,
  searchOrders,
  selectOrder,
  handleCreateRefund,
  closeCreateForm,
  submitting,
  formatCurrency,
  methodOptions
}: any) {
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  const handleSearchOrders = (query: string) => {
    setOrderSearchQuery(query);
    searchOrders(query);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={closeCreateForm} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#014582]" />
            Create Refund
          </h2>
        </div>
        <button onClick={closeCreateForm} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Order Selection */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Find Order</h3>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search order number or customer name..."
                  value={orderSearchQuery}
                  onChange={(e) => handleSearchOrders(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                />
              </div>

              {formState.isSearchingOrders && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 p-4">
                  <Loader2 className="w-6 h-6 mx-auto text-[#014582] animate-spin" />
                </div>
              )}

              {formState.orderSearchResults.length > 0 && !formState.isSearchingOrders && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                  {formState.orderSearchResults.map((order: OrderModel) => (
                    <button
                      key={order.id}
                      onClick={() => selectOrder(order)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-none transition-colors"
                    >
                      <p className="font-medium text-[#014582]">{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">{order.customerName}</p>
                      <p className="text-xs text-gray-400">Total: {formatCurrency(order.grandTotal)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {formState.selectedOrder && (
              <div className="mt-3 p-3 bg-[#014582]/5 border border-[#014582]/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#014582]">{formState.selectedOrder.orderNumber}</p>
                    <p className="text-sm text-gray-600">{formState.selectedOrder.customerName}</p>
                    <p className="text-xs text-gray-400">Total: {formatCurrency(formState.selectedOrder.grandTotal)}</p>
                  </div>
                  <button
                    onClick={() => setFormState(prev => ({ ...prev, selectedOrder: null, amount: '' }))}
                    className="p-1 hover:bg-gray-200 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Refund Details */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Refund Details</h3>

            <div className="space-y-3">
              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Refund Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">Rs.</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formState.amount}
                    onChange={(e) => setFormState(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Refund Method */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Refund Method *</label>
                <select
                  value={formState.refundMethod}
                  onChange={(e) => setFormState(prev => ({ ...prev, refundMethod: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                >
                  {methodOptions.map((method: string) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              {/* Bank Details (for Bank Transfer) */}
              {formState.refundMethod === 'Bank Transfer' && (
                <div className="space-y-3 border-t border-gray-100 pt-3">
                  <p className="text-xs font-semibold text-gray-500">Bank Details</p>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bank Name *</label>
                    <input
                      type="text"
                      placeholder="Enter bank name"
                      value={formState.bankName}
                      onChange={(e) => setFormState(prev => ({ ...prev, bankName: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Account Number *</label>
                    <input
                      type="text"
                      placeholder="Enter account number"
                      value={formState.accountNumber}
                      onChange={(e) => setFormState(prev => ({ ...prev, accountNumber: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Account Holder *</label>
                    <input
                      type="text"
                      placeholder="Enter account holder name"
                      value={formState.accountHolderName}
                      onChange={(e) => setFormState(prev => ({ ...prev, accountHolderName: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason *</label>
                <textarea
                  rows={2}
                  placeholder="Enter reason for refund..."
                  value={formState.reason}
                  onChange={(e) => setFormState(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Additional notes..."
                  value={formState.notes}
                  onChange={(e) => setFormState(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reference Number (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter reference number"
                  value={formState.referenceNumber}
                  onChange={(e) => setFormState(prev => ({ ...prev, referenceNumber: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={closeCreateForm}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateRefund}
              disabled={!formState.selectedOrder || submitting}
              className="flex-1 px-4 py-2.5 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all shadow-lg shadow-[#014582]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <DollarSign className="w-4 h-4" />
              )}
              Create Refund
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// REFUND DETAIL MODAL
// ═══════════════════════════════════════════════════════════════

function RefundDetailModal({
  refund,
  onClose,
  onProcess,
  onComplete,
  onCancelRefund,
  onDelete,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusIcon,
  submitting
}: any) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-[#014582]/5 to-transparent">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#014582]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-6 h-6 text-[#014582]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{refund.refundNumber}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${getStatusColor(refund.refundStatus)}`}>
                  {getStatusIcon(refund.refundStatus)}
                  {refund.refundStatus}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">{formatDate(refund.refundDate)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-400 font-medium">Order</p>
              <p className="text-sm font-semibold text-[#014582] mt-1">{refund.orderNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Customer</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{refund.customerName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Amount</p>
              <p className="text-lg font-bold text-[#014582] mt-1">{formatCurrency(refund.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Method</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{refund.refundMethod}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-400 font-medium">Reason</p>
            <p className="text-sm text-gray-600 mt-1">{refund.reason}</p>
          </div>

          {refund.notes && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 font-medium">Notes</p>
              <p className="text-sm text-gray-600 mt-1">{refund.notes}</p>
            </div>
          )}

          {refund.referenceNumber && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 font-medium">Reference Number</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{refund.referenceNumber}</p>
            </div>
          )}

          {/* Bank Details */}
          {(refund.bankName || refund.accountNumber || refund.accountHolderName) && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <h4 className="text-sm font-bold text-gray-700 mb-3">Bank Details</h4>
              <div className="space-y-2">
                {refund.bankName && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{refund.bankName}</span>
                  </div>
                )}
                {refund.accountNumber && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{refund.accountNumber}</span>
                  </div>
                )}
                {refund.accountHolderName && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{refund.accountHolderName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {refund.refundStatus === 'Pending' && (
            <div className="border-t border-gray-100 pt-4 mt-4 flex gap-3">
              <button
                onClick={() => onProcess(refund.id)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-all disabled:opacity-50"
              >
                Process Refund
              </button>
              <button
                onClick={() => onCancelRefund(refund.id)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 border border-red-500 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}

          {refund.refundStatus === 'Processing' && (
            <div className="border-t border-gray-100 pt-4 mt-4 flex gap-3">
              <button
                onClick={() => onComplete(refund.id)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-all disabled:opacity-50"
              >
                Complete Refund
              </button>
              <button
                onClick={() => onCancelRefund(refund.id)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 border border-red-500 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}

          {(refund.refundStatus === 'Failed' || refund.refundStatus === 'Cancelled') && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <button
                onClick={() => onDelete(refund.id)}
                disabled={submitting}
                className="w-full px-4 py-2.5 border border-red-500 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 transition-all disabled:opacity-50"
              >
                Delete Refund
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONFIRMATION MODAL
// ═══════════════════════════════════════════════════════════════

function ConfirmationModal({
  title,
  message,
  confirmLabel,
  confirmColor,
  onConfirm,
  onCancel,
  loading,
  extraContent
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  extraContent?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-600 text-sm">{message}</p>
          {extraContent}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${confirmColor}`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}