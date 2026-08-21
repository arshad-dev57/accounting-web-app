'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Plus, Eye, Undo2, Users,
  ChevronDown, ChevronLeft, ChevronRight, Loader2,
  X, AlertCircle, CheckCircle, Clock,
  DollarSign, Calendar, FileText,
  RefreshCw, Trash2, Package, ShoppingBag,
  ChevronRight as ChevronRightIcon,
  Check, Clock as ClockIcon, AlertTriangle,
  Ban, Filter, ArrowUpDown, ClipboardList,
  Truck, Home, Store, CreditCard, Banknote,
  CircleCheck, CircleX, CircleAlert,
  Receipt, ShoppingCart, MapPin
} from 'lucide-react';
import { salesReturnService, ReturnModel, ReturnStats, OrderModel, ReturnLineDraft } from '../../api/salesretuns/route';
import { useLocation } from '@/lib/location-context';

// ─── TYPES ─────────────────────────────────────────────────────

interface WizardState {
  step: number;
  selectedOrder: OrderModel | null;
  orderSearchResults: OrderModel[];
  isSearchingOrders: boolean;
  lineDrafts: ReturnLineDraft[];
  returnType: string;
  returnMethod: string;
  reason: string;
  notes: string;
  restockingFee: string;
  shippingCost: string;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export default function SalesReturnsPage() {
  const { selectedLocationId, selectedLocation } = useLocation();
  const [returns, setReturns] = useState<ReturnModel[]>([]);
  const [filteredReturns, setFilteredReturns] = useState<ReturnModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
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
  const [stats, setStats] = useState<ReturnStats>({
    total: 0,
    totalRefund: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0
  });
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [viewingReturn, setViewingReturn] = useState<ReturnModel | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [returnToActOn, setReturnToActOn] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  // ─── Wizard State ─────────────────────────────────────────────
  const [wizardState, setWizardState] = useState<WizardState>({
    step: 0,
    selectedOrder: null,
    orderSearchResults: [],
    isSearchingOrders: false,
    lineDrafts: [],
    returnType: 'Return',
    returnMethod: 'Original Payment',
    reason: '',
    notes: '',
    restockingFee: '0',
    shippingCost: '0'
  });

  const statusOptions = ['all', 'Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled'];
  const typeOptions = ['all', 'Return', 'Exchange', 'Warranty', 'Damaged'];
  const methodOptions = ['Original Payment', 'Bank Transfer', 'Cash', 'Store Credit', 'Cheque'];
  const conditionOptions = ['New', 'Opened', 'Damaged', 'Defective', 'Used'];
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ─── Computed Values ─────────────────────────────────────────

  const selectedSubtotal = wizardState.lineDrafts
    .filter(l => l.selected)
    .reduce((sum, l) => sum + l.refundAmount, 0);

  const restockingFee = parseFloat(wizardState.restockingFee) || 0;
  const shippingCost = parseFloat(wizardState.shippingCost) || 0;
  const totalRefundAmount = Math.max(0, selectedSubtotal - restockingFee - shippingCost);

  const canGoToStep2 = wizardState.selectedOrder !== null;
  const canGoToStep3 = wizardState.lineDrafts.some(l => l.selected && l.returnQuantity > 0);

  // ─── Fetch Returns ────────────────────────────────────────────

  const fetchReturns = useCallback(async (resetPage = true) => {
    setLoading(true);
    try {
      const page = resetPage ? 1 : pagination.page;
      const response = await salesReturnService.getReturns({
        page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        locationId: selectedLocationId || undefined,
      });

      setReturns(response.data || []);
      setFilteredReturns(response.data || []);
      setPagination(response.pagination);
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (error: any) {
      console.error('Failed to fetch returns:', error);
      alert(error.message || 'Failed to load returns');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, typeFilter, fromDate, toDate, pagination.page, pagination.limit, selectedLocationId]);

  // ─── Load More ──────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!pagination.hasNext || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const response = await salesReturnService.getReturns({
        page: nextPage,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        locationId: selectedLocationId || undefined,
      });

      setReturns(prev => [...prev, ...(response.data || [])]);
      setFilteredReturns(prev => [...prev, ...(response.data || [])]);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load more returns:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [pagination.hasNext, pagination.page, pagination.limit, searchTerm, statusFilter, typeFilter, fromDate, toDate, selectedLocationId]);

  // ─── Apply Local Filters ────────────────────────────────────

  useEffect(() => {
    const filtered = returns.filter(item => {
      if (selectedFilter !== 'all' && item.returnStatus !== selectedFilter) {
        return false;
      }
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matches = item.returnNumber.toLowerCase().includes(query) ||
          item.customerName.toLowerCase().includes(query) ||
          item.orderNumber.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
    setFilteredReturns(filtered);
  }, [returns, selectedFilter, searchTerm]);

  // ─── Initial Fetch ──────────────────────────────────────────

  useEffect(() => {
    fetchReturns(true);
  }, []);

  useEffect(() => {
    fetchReturns(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocationId]);

  // ─── Search ──────────────────────────────────────────────────

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    fetchReturns(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
    fetchReturns(true);
  };

  // ─── Filter Changes ──────────────────────────────────────────

  const handleStatusFilterChange = (filter: string) => {
    setStatusFilter(filter);
    fetchReturns(true);
  };

  const handleTypeFilterChange = (filter: string) => {
    setTypeFilter(filter);
    fetchReturns(true);
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  const handleDateFilter = () => {
    fetchReturns(true);
  };

  const handleRefresh = () => {
    fetchReturns(true);
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchReturns(false);
  };

  // ─── Wizard Functions ────────────────────────────────────────

  const openCreateWizard = () => {
    resetWizard();
    setShowCreateWizard(true);
  };

  const closeCreateWizard = () => {
    setShowCreateWizard(false);
    resetWizard();
  };

  const resetWizard = () => {
    setWizardState({
      step: 0,
      selectedOrder: null,
      orderSearchResults: [],
      isSearchingOrders: false,
      lineDrafts: [],
      returnType: 'Return',
      returnMethod: 'Original Payment',
      reason: '',
      notes: '',
      restockingFee: '0',
      shippingCost: '0'
    });
  };

  const searchOrders = async (query: string) => {
    setWizardState(prev => ({ ...prev, orderSearchQuery: query }));
    if (query.trim().length < 2) {
      setWizardState(prev => ({ ...prev, orderSearchResults: [] }));
      return;
    }
    setWizardState(prev => ({ ...prev, isSearchingOrders: true }));
    try {
      const results = await salesReturnService.searchOrders(query, 10, selectedLocationId || undefined);
      setWizardState(prev => ({ ...prev, orderSearchResults: results }));
    } catch (error) {
      console.error('Failed to search orders:', error);
      setWizardState(prev => ({ ...prev, orderSearchResults: [] }));
    } finally {
      setWizardState(prev => ({ ...prev, isSearchingOrders: false }));
    }
  };

  const selectOrderForReturn = (order: OrderModel) => {
    const lineDrafts = order.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      sku: item.sku || '',
      orderQuantity: item.quantity,
      unitPrice: item.unitPrice,
      selected: false,
      returnQuantity: 0,
      condition: 'New',
      refundAmount: 0
    }));
    setWizardState(prev => ({
      ...prev,
      selectedOrder: order,
      orderSearchResults: [],
      lineDrafts
    }));
  };

  // FIXED: toggleLineSelection with proper state update
  const toggleLineSelection = (index: number) => {
    setWizardState(prev => {
      const newDrafts = prev.lineDrafts.map((line, i) => {
        if (i === index) {
          const newSelected = !line.selected;
          return {
            ...line,
            selected: newSelected,
            returnQuantity: newSelected ? Math.min(1, line.orderQuantity) : 0,
            refundAmount: newSelected ? Math.min(1, line.orderQuantity) * line.unitPrice : 0
          };
        }
        return line;
      });
      return { ...prev, lineDrafts: newDrafts };
    });
  };

  const updateReturnQuantity = (index: number, quantity: number) => {
    setWizardState(prev => {
      const newDrafts = prev.lineDrafts.map((line, i) => {
        if (i === index) {
          const returnQty = Math.max(0, Math.min(quantity, line.orderQuantity));
          return {
            ...line,
            returnQuantity: returnQty,
            refundAmount: returnQty * line.unitPrice
          };
        }
        return line;
      });
      return { ...prev, lineDrafts: newDrafts };
    });
  };

  const updateLineCondition = (index: number, condition: string) => {
    setWizardState(prev => {
      const newDrafts = prev.lineDrafts.map((line, i) => {
        if (i === index) {
          return { ...line, condition };
        }
        return line;
      });
      return { ...prev, lineDrafts: newDrafts };
    });
  };

  const nextStep = () => {
    if (wizardState.step === 0 && !canGoToStep2) {
      alert('Please select an order first');
      return;
    }
    if (wizardState.step === 1 && !canGoToStep3) {
      alert('Please select at least one item to return');
      return;
    }
    if (wizardState.step < 2) {
      setWizardState(prev => ({ ...prev, step: prev.step + 1 }));
    }
  };

  const previousStep = () => {
    if (wizardState.step > 0) {
      setWizardState(prev => ({ ...prev, step: prev.step - 1 }));
    }
  };

  // ─── Create Return ──────────────────────────────────────────

  const handleCreateReturn = async () => {
    if (!wizardState.selectedOrder) {
      alert('Please select an order');
      return;
    }

    const selectedItems = wizardState.lineDrafts.filter(l => l.selected && l.returnQuantity > 0);
    if (selectedItems.length === 0) {
      alert('Please select at least one item');
      return;
    }

    if (!wizardState.reason.trim()) {
      alert('Please provide a return reason');
      return;
    }

    setSubmitting(true);
    try {
      const items = selectedItems.map(l => ({
        productId: l.productId,
        productName: l.productName,
        sku: l.sku,
        orderQuantity: l.orderQuantity,
        returnQuantity: l.returnQuantity,
        unitPrice: l.unitPrice,
        refundAmount: l.refundAmount,
        condition: l.condition
      }));

      await salesReturnService.createReturn({
        orderId: wizardState.selectedOrder.id,
        orderNumber: wizardState.selectedOrder.orderNumber,
        customerName: wizardState.selectedOrder.customerName,
        customerEmail: wizardState.selectedOrder.customerEmail || '',
        customerPhone: wizardState.selectedOrder.customerPhone || '',
        items,
        returnType: wizardState.returnType,
        returnMethod: wizardState.returnMethod,
        reason: wizardState.reason,
        notes: wizardState.notes,
        restockingFee: restockingFee,
        shippingCost: shippingCost
      });

      closeCreateWizard();
      fetchReturns(true);
    } catch (error: any) {
      console.error('Failed to create return:', error);
      alert(error.message || 'Failed to create return');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Return Actions ──────────────────────────────────────────

  const handleApproveReturn = async (id: string) => {
    setSubmitting(true);
    try {
      await salesReturnService.approveReturn(id);
      setViewingReturn(null);
      fetchReturns(true);
    } catch (error: any) {
      console.error('Failed to approve return:', error);
      alert(error.message || 'Failed to approve return');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectReturn = async () => {
    if (!returnToActOn) return;
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    setSubmitting(true);
    try {
      await salesReturnService.rejectReturn(returnToActOn, rejectReason);
      setShowRejectModal(false);
      setReturnToActOn(null);
      setRejectReason('');
      setViewingReturn(null);
      fetchReturns(true);
    } catch (error: any) {
      console.error('Failed to reject return:', error);
      alert(error.message || 'Failed to reject return');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteReturn = async (id: string) => {
    setSubmitting(true);
    try {
      await salesReturnService.completeReturn(id);
      setViewingReturn(null);
      fetchReturns(true);
    } catch (error: any) {
      console.error('Failed to complete return:', error);
      alert(error.message || 'Failed to complete return');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelReturn = async () => {
    if (!returnToActOn) return;
    setSubmitting(true);
    try {
      await salesReturnService.cancelReturn(returnToActOn, cancelReason || 'Cancelled by user');
      setShowCancelConfirm(false);
      setReturnToActOn(null);
      setCancelReason('');
      setViewingReturn(null);
      fetchReturns(true);
    } catch (error: any) {
      console.error('Failed to cancel return:', error);
      alert(error.message || 'Failed to cancel return');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReturn = async () => {
    if (!returnToActOn) return;
    setSubmitting(true);
    try {
      await salesReturnService.deleteReturn(returnToActOn);
      setShowDeleteConfirm(false);
      setReturnToActOn(null);
      setViewingReturn(null);
      fetchReturns(true);
    } catch (error: any) {
      console.error('Failed to delete return:', error);
      alert(error.message || 'Failed to delete return');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── View Return Detail ─────────────────────────────────────

  const viewReturnDetail = (returnItem: ReturnModel) => {
    setViewingReturn(returnItem);
  };

  // ─── Helper Functions ──────────────────────────────────────

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Completed':
        return 'bg-green-100 text-green-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Rejected':
        return <CircleX className="w-4 h-4 text-red-600" />;
      case 'Cancelled':
        return <Ban className="w-4 h-4 text-gray-600" />;
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
      {showCreateWizard ? (
        <CreateReturnWizard
          wizardState={wizardState}
          setWizardState={setWizardState}
          searchOrders={searchOrders}
          selectOrderForReturn={selectOrderForReturn}
          toggleLineSelection={toggleLineSelection}
          updateReturnQuantity={updateReturnQuantity}
          updateLineCondition={updateLineCondition}
          nextStep={nextStep}
          previousStep={previousStep}
          handleCreateReturn={handleCreateReturn}
          closeCreateWizard={closeCreateWizard}
          submitting={submitting}
          canGoToStep2={canGoToStep2}
          canGoToStep3={canGoToStep3}
          selectedSubtotal={selectedSubtotal}
          restockingFee={restockingFee}
          shippingCost={shippingCost}
          totalRefundAmount={totalRefundAmount}
          formatCurrency={formatCurrency}
          conditionOptions={conditionOptions}
          methodOptions={methodOptions}
          typeOptions={typeOptions.filter(t => t !== 'all')}
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
                <Undo2 className="w-6 h-6 text-[#014582]" />
                Sales Returns
                <span className="text-sm font-normal text-gray-400 ml-2">
                  ({pagination.total} returns)
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
                onClick={openCreateWizard}
                className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all shadow-lg shadow-[#014582]/25"
              >
                <Plus className="w-4 h-4" />
                Create Return
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>Flow:</strong> Create return → <strong>Approve</strong> → <strong>Complete</strong> to restock inventory and post GL entries.
            For cash back, create a refund from Sales Refunds and mark it <strong>Complete</strong>.
          </div>

          {selectedLocation && (
            <div className="flex items-center gap-2 text-sm text-sky-800 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              Showing returns for <strong>{selectedLocation.name}</strong>
              <span className="text-sky-600 font-mono text-xs">({selectedLocation.code})</span>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-medium">Total</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{stats.total}</p>
              <p className="text-sm font-semibold text-purple-600">{formatCurrency(stats.totalRefund)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-medium">Pending</p>
              <p className="text-xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-medium">Approved</p>
              <p className="text-xl font-bold text-green-600 mt-1">{stats.approved}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-medium">Completed</p>
              <p className="text-xl font-bold text-blue-600 mt-1">{stats.completed}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-medium">Rejected</p>
              <p className="text-xl font-bold text-red-600 mt-1">{stats.rejected}</p>
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
                  placeholder="Search returns..."
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
                  value={typeFilter}
                  onChange={(e) => handleTypeFilterChange(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                >
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
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
            {['all', 'Pending', 'Approved', 'Completed', 'Rejected'].map((filter) => (
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
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Return</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && returns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12">
                        <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
                        <p className="mt-2 text-gray-500">Loading returns...</p>
                      </td>
                    </tr>
                  ) : filteredReturns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-400">
                        <Undo2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium text-gray-500">No returns found</p>
                        <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredReturns.map((returnItem) => (
                      <tr key={returnItem.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3">
                          <div>
                            <p className="font-medium text-[#014582]">{returnItem.returnNumber}</p>
                            <p className="text-xs text-gray-400">{formatDate(returnItem.returnDate)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <p className="text-gray-800">{returnItem.orderNumber}</p>
                        </td>
                        <td className="px-6 py-3">
                          <p className="text-gray-800">{returnItem.customerName}</p>
                        </td>
                        <td className="px-6 py-3">
                          <p className="font-semibold text-gray-800">{formatCurrency(returnItem.totalRefund)}</p>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-xs bg-purple-50 text-purple-700 font-semibold px-2.5 py-1 rounded-full">
                            {returnItem.returnType}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className="text-sm font-semibold text-gray-700">
                            {returnItem.totalReturnQty || returnItem.items?.reduce((sum: number, item: any) => sum + (item.returnQuantity || 0), 0) || 0}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit ${getStatusColor(returnItem.returnStatus)}`}>
                            {getStatusIcon(returnItem.returnStatus)}
                            {returnItem.returnStatus}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => viewReturnDetail(returnItem)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="View Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {returnItem.returnStatus === 'Pending' && (
                              <>
                                <button
                                  onClick={() => {
                                    setReturnToActOn(returnItem.id);
                                    handleApproveReturn(returnItem.id);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setReturnToActOn(returnItem.id);
                                    setShowRejectModal(true);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Reject"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {returnItem.returnStatus === 'Approved' && (
                              <button
                                onClick={() => handleCompleteReturn(returnItem.id)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Complete"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {(returnItem.returnStatus === 'Pending' || returnItem.returnStatus === 'Approved') && (
                              <button
                                onClick={() => {
                                  setReturnToActOn(returnItem.id);
                                  setShowCancelConfirm(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Cancel"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                            {returnItem.returnStatus === 'Cancelled' && (
                              <button
                                onClick={() => {
                                  setReturnToActOn(returnItem.id);
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
            {pagination.hasNext && filteredReturns.length > 0 && (
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
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} returns
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

      {/* Return Detail Modal */}
      {viewingReturn && (
        <ReturnDetailModal
          returnItem={viewingReturn}
          onClose={() => setViewingReturn(null)}
          onApprove={handleApproveReturn}
          onReject={(id) => {
            setReturnToActOn(id);
            setShowRejectModal(true);
            setViewingReturn(null);
          }}
          onComplete={handleCompleteReturn}
          onCancel={(id: string) => {
            setReturnToActOn(id);
            setShowCancelConfirm(true);
            setViewingReturn(null);
          }}
          onDelete={(id) => {
            setReturnToActOn(id);
            setShowDeleteConfirm(true);
            setViewingReturn(null);
          }}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          submitting={submitting}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <ConfirmationModal
          title="Reject Return"
          message="Please provide a reason for rejecting this return."
          confirmLabel="Reject"
          confirmColor="bg-red-500 hover:bg-red-600"
          onConfirm={handleRejectReturn}
          onCancel={() => {
            setShowRejectModal(false);
            setReturnToActOn(null);
            setRejectReason('');
          }}
          loading={submitting}
          extraContent={
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rejection Reason *</label>
              <textarea
                rows={3}
                placeholder="Enter reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none resize-none"
              />
            </div>
          }
        />
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <ConfirmationModal
          title="Cancel Return"
          message="Are you sure you want to cancel this return? This action cannot be undone."
          confirmLabel="Cancel Return"
          confirmColor="bg-red-500 hover:bg-red-600"
          onConfirm={handleCancelReturn}
          onCancel={() => {
            setShowCancelConfirm(false);
            setReturnToActOn(null);
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
          title="Delete Return"
          message="Are you sure you want to delete this return? This action cannot be undone."
          confirmLabel="Delete"
          confirmColor="bg-red-500 hover:bg-red-600"
          onConfirm={handleDeleteReturn}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setReturnToActOn(null);
          }}
          loading={submitting}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CREATE RETURN WIZARD - FIXED WITH WORKING CHECKBOX
// ═══════════════════════════════════════════════════════════════

function CreateReturnWizard({
  wizardState,
  setWizardState,
  searchOrders,
  selectOrderForReturn,
  toggleLineSelection,
  updateReturnQuantity,
  updateLineCondition,
  nextStep,
  previousStep,
  handleCreateReturn,
  closeCreateWizard,
  submitting,
  canGoToStep2,
  canGoToStep3,
  selectedSubtotal,
  restockingFee,
  shippingCost,
  totalRefundAmount,
  formatCurrency,
  conditionOptions,
  methodOptions,
  typeOptions
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
          <button onClick={closeCreateWizard} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Undo2 className="w-6 h-6 text-[#014582]" />
            Create Return
          </h2>
        </div>
        <button onClick={closeCreateWizard} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-4">
        {[0, 1, 2].map((step) => (
          <div key={step} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 ${wizardState.step >= step ? 'text-[#014582]' : 'text-gray-300'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                wizardState.step >= step ? 'border-[#014582] bg-[#014582]/10' : 'border-gray-300'
              }`}>
                {step + 1}
              </div>
              <span className="text-sm font-medium hidden sm:inline">
                {step === 0 ? 'Find Order' : step === 1 ? 'Select Items' : 'Details'}
              </span>
            </div>
            {step < 2 && (
              <div className={`flex-1 h-0.5 mx-2 ${wizardState.step > step ? 'bg-[#014582]' : 'bg-gray-300'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {wizardState.step === 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3">Step 1: Find Order</h3>
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

              {wizardState.isSearchingOrders && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 p-4">
                  <Loader2 className="w-6 h-6 mx-auto text-[#014582] animate-spin" />
                </div>
              )}

              {wizardState.orderSearchResults.length > 0 && !wizardState.isSearchingOrders && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                  {wizardState.orderSearchResults.map((order: OrderModel) => (
                    <button
                      key={order.id}
                      onClick={() => selectOrderForReturn(order)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-none transition-colors"
                    >
                      <p className="font-medium text-[#014582]">{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">{order.customerName}</p>
                      <p className="text-xs text-gray-400">{order.items.length} items</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {wizardState.selectedOrder && (
              <div className="mt-3 p-3 bg-[#014582]/5 border border-[#014582]/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#014582]">{wizardState.selectedOrder.orderNumber}</p>
                    <p className="text-sm text-gray-600">{wizardState.selectedOrder.customerName}</p>
                    <p className="text-xs text-gray-400">{wizardState.selectedOrder.items.length} line items</p>
                  </div>
                  <button
                    onClick={() => setWizardState(prev => ({ ...prev, selectedOrder: null, lineDrafts: [] }))}
                    className="p-1 hover:bg-gray-200 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {wizardState.step === 1 && (
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3">Step 2: Select Items</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {wizardState.lineDrafts.map((line: ReturnLineDraft, index: number) => (
                <div
                  key={index}
                  className={`p-3 border rounded-lg transition-all cursor-pointer ${
                    line.selected
                      ? 'border-[#014582] bg-[#014582]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleLineSelection(index)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={line.selected}
                        onChange={() => toggleLineSelection(index)}
                        className="w-4 h-4 text-[#014582] rounded border-gray-300 focus:ring-[#014582] cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{line.productName}</p>
                          <p className="text-xs text-gray-400">SKU: {line.sku} • Ordered: {line.orderQuantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800">{formatCurrency(line.unitPrice)}</p>
                          <p className="text-xs text-gray-400">ea</p>
                        </div>
                      </div>
                      {line.selected && (
                        <div className="mt-3 grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
                          <div>
                            <label className="text-xs text-gray-500">Return Quantity</label>
                            <input
                              type="number"
                              min="1"
                              max={line.orderQuantity}
                              value={line.returnQuantity}
                              onChange={(e) => updateReturnQuantity(index, parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Condition</label>
                            <select
                              value={line.condition}
                              onChange={(e) => updateLineCondition(index, e.target.value)}
                              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                            >
                              {conditionOptions.map((condition: string) => (
                                <option key={condition} value={condition}>{condition}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                      {line.selected && line.returnQuantity > 0 && (
                        <p className="text-sm font-semibold text-[#014582] mt-2">
                          Refund: {formatCurrency(line.returnQuantity * line.unitPrice)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {wizardState.lineDrafts.some(l => l.selected) && (
              <div className="mt-4 p-3 bg-[#014582]/5 rounded-lg">
                <p className="text-sm font-semibold text-gray-700">
                  Subtotal: {formatCurrency(selectedSubtotal)}
                </p>
              </div>
            )}
          </div>
        )}

        {wizardState.step === 2 && (
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3">Step 3: Return Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Return Type *</label>
                <select
                  value={wizardState.returnType}
                  onChange={(e) => setWizardState(prev => ({ ...prev, returnType: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                >
                  {typeOptions.map((type: string) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Refund Method *</label>
                <select
                  value={wizardState.returnMethod}
                  onChange={(e) => setWizardState(prev => ({ ...prev, returnMethod: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                >
                  {methodOptions.map((method: string) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason *</label>
              <textarea
                rows={2}
                placeholder="Enter reason for return..."
                value={wizardState.reason}
                onChange={(e) => setWizardState(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none resize-none"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes (Optional)</label>
              <textarea
                rows={2}
                placeholder="Additional notes..."
                value={wizardState.notes}
                onChange={(e) => setWizardState(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Restocking Fee</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">Rs.</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={wizardState.restockingFee}
                    onChange={(e) => setWizardState(prev => ({ ...prev, restockingFee: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Shipping Cost</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">Rs.</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={wizardState.shippingCost}
                    onChange={(e) => setWizardState(prev => ({ ...prev, shippingCost: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 p-4 bg-[#014582]/5 border border-[#014582]/20 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-800">{formatCurrency(selectedSubtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Restocking Fee</span>
                  <span className="font-medium text-gray-800">-{formatCurrency(restockingFee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping Cost</span>
                  <span className="font-medium text-gray-800">-{formatCurrency(shippingCost)}</span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between text-base">
                  <span className="font-bold text-gray-800">Total Refund</span>
                  <span className="font-bold text-[#014582]">{formatCurrency(totalRefundAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={previousStep}
          disabled={wizardState.step === 0}
          className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={closeCreateWizard}
            className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          {wizardState.step < 2 ? (
            <button
              onClick={nextStep}
              disabled={(wizardState.step === 0 && !canGoToStep2) || (wizardState.step === 1 && !canGoToStep3)}
              className="px-6 py-2.5 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#014582]/25"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCreateReturn}
              disabled={submitting}
              className="px-6 py-2.5 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#014582]/25 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Submit Return
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RETURN DETAIL MODAL
// ═══════════════════════════════════════════════════════════════

function ReturnDetailModal({
  returnItem,
  onClose,
  onApprove,
  onReject,
  onComplete,
  onCancel,
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
              <Undo2 className="w-6 h-6 text-[#014582]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{returnItem.returnNumber}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${getStatusColor(returnItem.returnStatus)}`}>
                  {getStatusIcon(returnItem.returnStatus)}
                  {returnItem.returnStatus}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">{formatDate(returnItem.returnDate)}</span>
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
              <p className="text-sm font-semibold text-[#014582] mt-1">{returnItem.orderNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Customer</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{returnItem.customerName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Type</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{returnItem.returnType}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Method</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{returnItem.returnMethod}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Total Refund</p>
              <p className="text-lg font-bold text-[#014582] mt-1">{formatCurrency(returnItem.totalRefund)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Items</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{returnItem.totalReturnQty || returnItem.items?.reduce((sum: number, item: any) => sum + (item.returnQuantity || 0), 0) || 0}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-400 font-medium">Reason</p>
            <p className="text-sm text-gray-600 mt-1">{returnItem.reason}</p>
          </div>

          {returnItem.rejectionReason && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600 font-medium">Rejection Reason</p>
              <p className="text-sm text-red-700 mt-1">{returnItem.rejectionReason}</p>
            </div>
          )}

          {returnItem.notes && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 font-medium">Notes</p>
              <p className="text-sm text-gray-600 mt-1">{returnItem.notes}</p>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-700">Return Items</h4>
              <span className="text-xs text-gray-400">{returnItem.totalReturnQty || returnItem.items?.reduce((sum: number, item: any) => sum + (item.returnQuantity || 0), 0) || 0} items</span>
            </div>
            <div className="space-y-2">
              {returnItem.items?.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.productName}</p>
                    <p className="text-xs text-gray-400">
                      Qty: {item.returnQuantity} • {item.condition}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[#014582]">{formatCurrency(item.refundAmount)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          {returnItem.returnStatus === 'Pending' && (
            <div className="border-t border-gray-100 pt-4 mt-4 flex gap-3">
              <button
                onClick={() => onApprove(returnItem.id)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-all disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => onReject(returnItem.id)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => onCancel(returnItem.id)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 border border-red-500 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}

          {returnItem.returnStatus === 'Approved' && (
            <div className="border-t border-gray-100 pt-4 mt-4 flex gap-3">
              <button
                onClick={() => onComplete(returnItem.id)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-all disabled:opacity-50"
              >
                Complete Return
              </button>
              <button
                onClick={() => onCancel(returnItem.id)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 border border-red-500 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}

          {returnItem.returnStatus === 'Cancelled' && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <button
                onClick={() => onDelete(returnItem.id)}
                disabled={submitting}
                className="w-full px-4 py-2.5 border border-red-500 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 transition-all disabled:opacity-50"
              >
                Delete Return
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