'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Plus, Eye, Package, Users,
  ChevronDown, ChevronLeft, ChevronRight, Loader2,
  X, AlertCircle, CheckCircle, Clock,
  Calendar, FileText,
  RefreshCw, Trash2, ShoppingBag,
  Check, AlertTriangle,
  Ban, Filter, PlusCircle, MinusCircle,
  Building2, User, Phone, Mail,
  Truck, CalendarDays, Box, Warehouse,
  ClipboardList, ShoppingCart, Store,
  CircleCheck, CircleX, CircleAlert,
  Receipt, Send, Save, Printer, Download,
  Layers, PackageCheck, TruckIcon, Boxes
} from 'lucide-react';
import { goodsReceivingService, GoodsReceivingModel, GoodsReceivingStats, PurchaseOrderForReceiving, GRNLineDraft } from '../../api/goodsrecieving/route';
import PDFService from '../../../lib/pdf-service';
import EmailService from '../../../lib/email-service';
import { useLocation } from '@/lib/location-context';

// ─── TYPES ─────────────────────────────────────────────────────

interface WizardState {
  step: number;
  selectedOrder: PurchaseOrderForReceiving | null;
  orderSearchResults: PurchaseOrderForReceiving[];
  isSearchingOrders: boolean;
  lineDrafts: GRNLineDraft[];
  receivingDate: string;
  receivedBy: string;
  notes: string;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export default function GoodsReceivingPage() {
  const { selectedLocationId } = useLocation();
  const [grns, setGrns] = useState<GoodsReceivingModel[]>([]);
  const [filteredGrns, setFilteredGrns] = useState<GoodsReceivingModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [stats, setStats] = useState<GoodsReceivingStats>({
    todayCount: 0,
    monthCount: 0,
    draftCount: 0,
    partiallyReceivedCount: 0,
    fullyReceivedCount: 0,
    totalCount: 0
  });
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [viewingGRN, setViewingGRN] = useState<GoodsReceivingModel | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConfirmConfirm, setShowConfirmConfirm] = useState(false);
  const [grnToActOn, setGrnToActOn] = useState<string | null>(null);

  // ─── Wizard State ─────────────────────────────────────────────
  const [wizardState, setWizardState] = useState<WizardState>({
    step: 0,
    selectedOrder: null,
    orderSearchResults: [],
    isSearchingOrders: false,
    lineDrafts: [],
    receivingDate: new Date().toISOString().split('T')[0],
    receivedBy: '',
    notes: ''
  });

  const statusOptions = ['all', 'Draft', 'Partially Received', 'Fully Received'];
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ─── Computed Values ─────────────────────────────────────────

  const totalReceivingQuantity = wizardState.lineDrafts.reduce((sum, line) => sum + line.receivingQuantity, 0);
  const canGoToStep2 = wizardState.selectedOrder !== null;
  const canGoToStep3 = wizardState.lineDrafts.some(line => line.receivingQuantity > 0);

  // ─── Fetch GRNs ──────────────────────────────────────────────

  const fetchGRNs = useCallback(async (resetPage = true) => {
    setLoading(true);
    try {
      const page = resetPage ? 1 : pagination.page;
      const response = await goodsReceivingService.getGRNs({
        page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        locationId: selectedLocationId || undefined,
      });

      setGrns(response.data || []);
      setFilteredGrns(response.data || []);
      setPagination(response.pagination);
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (error: any) {
      console.error('Failed to fetch GRNs:', error);
      alert(error.message || 'Failed to load goods receiving');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, fromDate, toDate, pagination.page, pagination.limit, selectedLocationId]);

  // ─── Load More ──────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!pagination.hasNext || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const response = await goodsReceivingService.getGRNs({
        page: nextPage,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        locationId: selectedLocationId || undefined,
      });

      setGrns(prev => [...prev, ...(response.data || [])]);
      setFilteredGrns(prev => [...prev, ...(response.data || [])]);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load more GRNs:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [pagination.hasNext, pagination.page, pagination.limit, searchTerm, statusFilter, fromDate, toDate, selectedLocationId]);

  // ─── Apply Local Filters ────────────────────────────────────

  useEffect(() => {
    const filtered = grns.filter(item => {
      if (selectedFilter !== 'all' && item.status !== selectedFilter) {
        return false;
      }
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matches = item.grnNumber.toLowerCase().includes(query) ||
          item.supplierName.toLowerCase().includes(query) ||
          item.purchaseOrderNumber.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
    setFilteredGrns(filtered);
  }, [grns, selectedFilter, searchTerm]);

  // ─── Initial Fetch ──────────────────────────────────────────

  useEffect(() => {
    fetchGRNs(true);
  }, []);

  useEffect(() => {
    fetchGRNs(true);
    // clear open wizard order search when warehouse changes
    setWizardState((prev: WizardState) => ({
      ...prev,
      orderSearchResults: [],
      selectedOrder: null,
      lineDrafts: [],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocationId]);

  // ─── Search ──────────────────────────────────────────────────

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    fetchGRNs(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
    fetchGRNs(true);
  };

  // ─── Filter Changes ──────────────────────────────────────────

  const handleStatusFilterChange = (filter: string) => {
    setStatusFilter(filter);
    fetchGRNs(true);
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  const handleDateFilter = () => {
    fetchGRNs(true);
  };

  const handleRefresh = () => {
    fetchGRNs(true);
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchGRNs(false);
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
      receivingDate: new Date().toISOString().split('T')[0],
      receivedBy: '',
      notes: ''
    });
  };

  const searchOrders = async (query: string) => {
    if (query.trim().length < 2) {
      setWizardState((prev: WizardState) => ({ ...prev, orderSearchResults: [] }));
      return;
    }
    setWizardState((prev: WizardState) => ({ ...prev, isSearchingOrders: true }));
    try {
      const results = await goodsReceivingService.searchAvailableOrders(
        query,
        10,
        selectedLocationId || undefined
      );
      setWizardState((prev: WizardState) => ({ ...prev, orderSearchResults: results }));
    } catch (error) {
      console.error('Failed to search orders:', error);
      setWizardState((prev: WizardState) => ({ ...prev, orderSearchResults: [] }));
    } finally {
      setWizardState((prev: WizardState) => ({ ...prev, isSearchingOrders: false }));
    }
  };

  const selectOrder = (order: PurchaseOrderForReceiving) => {
    const lineDrafts = order.remainingItems.map(item => ({
      purchaseOrderItemId: item.id,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      orderedQuantity: item.quantity,
      remainingQuantity: item.remainingQuantity,
      alreadyReceived: item.alreadyReceived,
      receivingQuantity: 0,
      unit: item.unit || 'Pcs'
    }));
    setWizardState((prev: WizardState) => ({
      ...prev,
      selectedOrder: order,
      orderSearchResults: [],
      lineDrafts
    }));
  };

  const updateReceivingQuantity = (index: number, quantity: number) => {
    setWizardState((prev: WizardState) => {
      const newDrafts = [...prev.lineDrafts];
      const line = newDrafts[index];
      line.receivingQuantity = Math.max(0, Math.min(quantity, line.remainingQuantity));
      return { ...prev, lineDrafts: newDrafts };
    });
  };

  const setFullQuantity = (index: number) => {
    setWizardState((prev: WizardState) => {
      const newDrafts = [...prev.lineDrafts];
      const line = newDrafts[index];
      line.receivingQuantity = line.remainingQuantity;
      return { ...prev, lineDrafts: newDrafts };
    });
  };

  const nextStep = () => {
    if (wizardState.step === 0 && !canGoToStep2) {
      alert('Please select a purchase order first');
      return;
    }
    if (wizardState.step === 1 && !canGoToStep3) {
      alert('Please enter receiving quantity for at least one item');
      return;
    }
    if (wizardState.step < 2) {
      setWizardState((prev: WizardState) => ({ ...prev, step: prev.step + 1 }));
    }
  };

  const previousStep = () => {
    if (wizardState.step > 0) {
      setWizardState((prev: WizardState) => ({ ...prev, step: prev.step - 1 }));
    }
  };

  // ─── Create GRN ─────────────────────────────────────────────

  const handleCreateGRN = async () => {
    if (!wizardState.selectedOrder) {
      alert('Please select a purchase order');
      return;
    }

    const selectedItems = wizardState.lineDrafts.filter(line => line.receivingQuantity > 0);
    if (selectedItems.length === 0) {
      alert('Please enter receiving quantity for at least one item');
      return;
    }

    setSubmitting(true);
    try {
      const items = selectedItems.map(line => ({
        purchaseOrderItemId: line.purchaseOrderItemId,
        receivingQuantity: line.receivingQuantity
      }));

      await goodsReceivingService.createGRN({
        purchaseOrderId: wizardState.selectedOrder.id,
        receivingDate: wizardState.receivingDate,
        receivedBy: wizardState.receivedBy || undefined,
        notes: wizardState.notes || undefined,
        status: 'Draft',
        items,
        locationId: selectedLocationId || undefined,
      });

      closeCreateWizard();
      fetchGRNs(true);
    } catch (error: any) {
      console.error('Failed to create GRN:', error);
      alert(error.message || 'Failed to create goods receiving');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── GRN Actions ─────────────────────────────────────────────

  const handleConfirmGRN = async () => {
    if (!grnToActOn) return;
    setSubmitting(true);
    try {
      await goodsReceivingService.confirmGRN(grnToActOn);
      setShowConfirmConfirm(false);
      setGrnToActOn(null);
      setViewingGRN(null);
      fetchGRNs(true);
    } catch (error: any) {
      console.error('Failed to confirm GRN:', error);
      alert(error.message || 'Failed to confirm goods receiving');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGRN = async () => {
    if (!grnToActOn) return;
    setSubmitting(true);
    try {
      await goodsReceivingService.deleteGRN(grnToActOn);
      setShowDeleteConfirm(false);
      setGrnToActOn(null);
      setViewingGRN(null);
      fetchGRNs(true);
    } catch (error: any) {
      console.error('Failed to delete GRN:', error);
      alert(error.message || 'Failed to delete goods receiving');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── View GRN Detail ────────────────────────────────────────

  const viewGRNDetail = (grn: GoodsReceivingModel) => {
    setViewingGRN(grn);
  };

  // ─── Download GRN PDF ────────────────────────────────────────

  const handleDownloadGRNPDF = async (grn: GoodsReceivingModel) => {
    await PDFService.downloadGoodsReceivingPDF(grn);
  };

  // ─── Send GRN Email ───────────────────────────────────────────

  const handleSendGRNEmail = async (grn: GoodsReceivingModel) => {
    setSubmitting(true);
    try {
      // GRN might not have supplier email, so we need to check
      if (!grn.supplierEmail) {
        alert('Supplier email is not available for this GRN. Please add supplier email first.');
        return;
      }

      const pdfBlob = await PDFService.generateGoodsReceivingPDFBlob(grn);
      await EmailService.sendPurchaseOrderEmail(grn, pdfBlob);
      
      alert('GRN sent successfully!');
    } catch (error: any) {
      console.error('Failed to send GRN email:', error);
      alert(error.message || 'Failed to send GRN email');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Helper Functions ──────────────────────────────────────

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-orange-100 text-orange-700';
      case 'Partially Received': return 'bg-blue-100 text-blue-700';
      case 'Fully Received': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft': return <FileText className="w-4 h-4 text-orange-600" />;
      case 'Partially Received': return <Package className="w-4 h-4 text-blue-600" />;
      case 'Fully Received': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ─── RENDER ──────────────────────────────────────────────────

  return (
    <div className="space-y-4 md:space-y-6">
      {showCreateWizard ? (
        <CreateGRNWizard
          wizardState={wizardState}
          setWizardState={setWizardState}
          searchOrders={searchOrders}
          selectOrder={selectOrder}
          updateReceivingQuantity={updateReceivingQuantity}
          setFullQuantity={setFullQuantity}
          nextStep={nextStep}
          previousStep={previousStep}
          handleCreateGRN={handleCreateGRN}
          closeCreateWizard={closeCreateWizard}
          submitting={submitting}
          canGoToStep2={canGoToStep2}
          canGoToStep3={canGoToStep3}
          totalReceivingQuantity={totalReceivingQuantity}
          formatDate={formatDate}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/warehouse/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </Link>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Package className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
                Goods Receiving
                <span className="text-xs md:text-sm font-normal text-gray-400 ml-1 md:ml-2">
                  ({pagination.total} GRNs)
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
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
                className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-[#014582] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#01366a] transition-all shadow-lg shadow-[#014582]/25"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Receive Goods</span>
                <span className="sm:hidden">Receive</span>
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
            <strong>Flow:</strong> GRN is saved as <strong>Draft</strong> → <strong>Confirm</strong> to add stock to inventory.
            Post the purchase invoice separately for accounts payable.
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Today</p>
              <p className="text-lg md:text-xl font-bold text-gray-800 mt-0.5 md:mt-1">{stats.todayCount}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Month</p>
              <p className="text-lg md:text-xl font-bold text-purple-600 mt-0.5 md:mt-1">{stats.monthCount}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Draft</p>
              <p className="text-lg md:text-xl font-bold text-orange-600 mt-0.5 md:mt-1">{stats.draftCount}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Partial</p>
              <p className="text-lg md:text-xl font-bold text-blue-600 mt-0.5 md:mt-1">{stats.partiallyReceivedCount}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Received</p>
              <p className="text-lg md:text-xl font-bold text-green-600 mt-0.5 md:mt-1">{stats.fullyReceivedCount}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total</p>
              <p className="text-lg md:text-xl font-bold text-gray-800 mt-0.5 md:mt-1">{stats.totalCount}</p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 md:gap-4">
              <div className="flex-1 min-w-[150px] md:min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search GRNs..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-8 md:pl-9 pr-3 md:pr-4 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                />
                {searchTerm && (
                  <button onClick={clearSearch} className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <div className="relative flex-1 sm:flex-none min-w-[100px]">
                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    className="appearance-none w-full px-3 md:px-4 py-1.5 md:py-2 pr-8 md:pr-10 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 pointer-events-none" />
                </div>

                <div className="flex flex-wrap items-center gap-1 md:gap-2">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 w-[120px] md:w-auto"
                  />
                  <span className="text-gray-400 text-xs md:text-sm hidden xs:inline">to</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 w-[120px] md:w-auto"
                  />
                  <button
                    onClick={handleDateFilter}
                    className="px-3 md:px-4 py-1.5 md:py-2 bg-[#014582]/10 text-[#014582] rounded-lg text-xs md:text-sm font-semibold hover:bg-[#014582]/20 transition-all"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Status Quick Filters */}
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {['all', 'Draft', 'Partially Received', 'Fully Received'].map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-semibold transition-all ${
                  selectedFilter === filter
                    ? 'bg-[#014582] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter === 'Partially Received' ? 'Partial' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">GRN</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">PO</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Supplier</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && grns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 md:py-12">
                        <Loader2 className="w-6 h-6 md:w-8 md:h-8 mx-auto text-[#014582] animate-spin" />
                        <p className="mt-2 text-xs md:text-sm text-gray-500">Loading goods receiving...</p>
                      </td>
                    </tr>
                  ) : filteredGrns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 md:py-12 text-gray-400">
                        <Package className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
                        <p className="text-sm md:text-lg font-medium text-gray-500">No goods receiving found</p>
                        <p className="text-xs md:text-sm text-gray-400">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredGrns.map((grn) => (
                      <tr key={grn.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <div>
                            <p className="font-medium text-[#014582] text-xs md:text-sm">{grn.grnNumber}</p>
                            <p className="text-[10px] md:text-xs text-gray-400 sm:hidden">{grn.supplierName}</p>
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3 hidden sm:table-cell">
                          <p className="text-gray-800 text-xs md:text-sm truncate max-w-[100px] md:max-w-none">{grn.purchaseOrderNumber}</p>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3 hidden md:table-cell">
                          <p className="text-gray-800 text-xs md:text-sm truncate max-w-[120px] md:max-w-none">{grn.supplierName}</p>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <p className="text-xs md:text-sm font-semibold text-gray-700">
                            {grn.totalReceivedQty}/{grn.totalOrderedQty}
                          </p>
                          <div className="w-16 md:w-20 h-1.5 bg-gray-200 rounded-full mt-1">
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${Math.min(100, (grn.totalReceivedQty / grn.totalOrderedQty) * 100)}%`,
                                backgroundColor: grn.status === 'Fully Received' ? '#22c55e' : grn.status === 'Partially Received' ? '#3b82f6' : '#f59e0b'
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3 hidden lg:table-cell">
                          <p className="text-xs md:text-sm text-gray-600">{formatDate(grn.receivingDate)}</p>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <span className={`text-[8px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 md:gap-1.5 w-fit ${getStatusColor(grn.status)}`}>
                            {getStatusIcon(grn.status)}
                            <span className="hidden xs:inline">{grn.status === 'Partially Received' ? 'Partial' : grn.status}</span>
                          </span>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <div className="flex items-center gap-1 md:gap-2">
                            <button
                              onClick={() => handleDownloadGRNPDF(grn)}
                              className="p-1 md:p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                            <button
                              onClick={() => handleSendGRNEmail(grn)}
                              disabled={submitting}
                              className="p-1 md:p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50"
                              title="Send Email"
                            >
                              <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                            <button
                              onClick={() => viewGRNDetail(grn)}
                              className="p-1 md:p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="View Detail"
                            >
                              <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                            {grn.canConfirm && (
                              <button
                                onClick={() => {
                                  setGrnToActOn(grn.id);
                                  setShowConfirmConfirm(true);
                                }}
                                className="p-1 md:p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                title="Confirm Receiving"
                              >
                                <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </button>
                            )}
                            {grn.status !== 'Draft' && grn.confirmedAt && (
                              <button
                                disabled
                                className="p-1 md:p-1.5 text-green-600 bg-green-50 rounded-lg transition-all"
                                title="Confirmed"
                              >
                                <PackageCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </button>
                            )}
                            {grn.canDelete && (
                              <button
                                onClick={() => {
                                  setGrnToActOn(grn.id);
                                  setShowDeleteConfirm(true);
                                }}
                                className="p-1 md:p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
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
            {pagination.hasNext && filteredGrns.length > 0 && (
              <div className="flex justify-center py-3 md:py-4 border-t border-gray-100">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-4 md:px-6 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-[#014582] hover:bg-[#014582]/10 rounded-lg transition-all disabled:opacity-50"
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
            <div className="flex flex-col xs:flex-row items-center justify-between gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-sm text-gray-500 text-center xs:text-left">
                Showing {(pagination.page - 1) * pagination.limit + 1} –{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-1 md:gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="p-1.5 md:p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
                <span className="px-2 md:px-4 py-1 md:py-2 bg-[#014582]/10 text-[#014582] font-semibold rounded-lg text-xs md:text-sm">
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="p-1.5 md:p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* GRN Detail Modal */}
      {viewingGRN && (
        <GRNDetailModal
          grn={viewingGRN}
          onClose={() => setViewingGRN(null)}
          onConfirm={(id: string) => {
            setGrnToActOn(id);
            setShowConfirmConfirm(true);
            setViewingGRN(null);
          }}
          onDelete={(id: string) => {
            setGrnToActOn(id);
            setShowDeleteConfirm(true);
            setViewingGRN(null);
          }}
          onDownloadPDF={handleDownloadGRNPDF}
          onSendEmail={handleSendGRNEmail}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          submitting={submitting}
        />
      )}

      {/* Confirm Receiving Confirmation Modal */}
      {showConfirmConfirm && (
        <ConfirmationModal
          title="Confirm Goods Receiving"
          message="Are you sure you want to confirm this goods receiving? This will update inventory and cannot be undone."
          confirmLabel="Confirm"
          confirmColor="bg-green-500 hover:bg-green-600"
          onConfirm={handleConfirmGRN}
          onCancel={() => {
            setShowConfirmConfirm(false);
            setGrnToActOn(null);
          }}
          loading={submitting}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <ConfirmationModal
          title="Delete Goods Receiving"
          message="Are you sure you want to delete this goods receiving? This action cannot be undone."
          confirmLabel="Delete"
          confirmColor="bg-red-500 hover:bg-red-600"
          onConfirm={handleDeleteGRN}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setGrnToActOn(null);
          }}
          loading={submitting}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CREATE GRN WIZARD
// ═══════════════════════════════════════════════════════════════

function CreateGRNWizard({
  wizardState,
  setWizardState,
  searchOrders,
  selectOrder,
  updateReceivingQuantity,
  setFullQuantity,
  nextStep,
  previousStep,
  handleCreateGRN,
  closeCreateWizard,
  submitting,
  canGoToStep2,
  canGoToStep3,
  totalReceivingQuantity,
  formatDate
}: any) {
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  const handleSearchOrders = (query: string) => {
    setOrderSearchQuery(query);
    searchOrders(query);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={closeCreateWizard} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
            Receive Goods
          </h2>
        </div>
        <button onClick={closeCreateWizard} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 md:gap-4">
        {[0, 1, 2].map((step) => (
          <div key={step} className="flex items-center flex-1">
            <div className={`flex items-center gap-1 md:gap-2 ${wizardState.step >= step ? 'text-[#014582]' : 'text-gray-300'}`}>
              <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold border-2 ${
                wizardState.step >= step ? 'border-[#014582] bg-[#014582]/10' : 'border-gray-300'
              }`}>
                {step + 1}
              </div>
              <span className="text-[10px] md:text-sm font-medium hidden sm:inline">
                {step === 0 ? 'PO' : step === 1 ? 'Items' : 'Details'}
              </span>
            </div>
            {step < 2 && (
              <div className={`flex-1 h-0.5 mx-1 md:mx-2 ${wizardState.step > step ? 'bg-[#014582]' : 'bg-gray-300'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-6">
        {wizardState.step === 0 && (
          <div>
            <h3 className="text-sm md:text-base font-bold text-gray-700 mb-3">Select Purchase Order</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search order number or supplier..."
                value={orderSearchQuery}
                onChange={(e) => handleSearchOrders(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
              />
            </div>

            {wizardState.isSearchingOrders && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <Loader2 className="w-6 h-6 mx-auto text-[#014582] animate-spin" />
              </div>
            )}

            {wizardState.orderSearchResults.length > 0 && !wizardState.isSearchingOrders && (
              <div className="mt-3 border border-gray-200 rounded-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
                {wizardState.orderSearchResults.map((order: PurchaseOrderForReceiving) => (
                  <button
                    key={order.id}
                    onClick={() => selectOrder(order)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-[#014582] text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-gray-600">{order.supplierName}</p>
                    <p className="text-xs text-gray-400">{order.totalRemainingItems} items remaining</p>
                  </button>
                ))}
              </div>
            )}

            {wizardState.selectedOrder && (
              <div className="mt-3 p-3 bg-[#014582]/5 border border-[#014582]/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#014582] text-sm">{wizardState.selectedOrder.orderNumber}</p>
                    <p className="text-xs text-gray-600">{wizardState.selectedOrder.supplierName}</p>
                    <p className="text-xs text-gray-400">{wizardState.selectedOrder.totalRemainingItems} items remaining</p>
                  </div>
                  <button
                    onClick={() => setWizardState((prev: WizardState) => ({ ...prev, selectedOrder: null, lineDrafts: [] }))}
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
            <h3 className="text-sm md:text-base font-bold text-gray-700 mb-3">Enter Receiving Quantities</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {wizardState.lineDrafts.map((line: GRNLineDraft, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{line.productName}</p>
                      <p className="text-xs text-gray-400">SKU: {line.sku}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${line.remainingQuantity === 0 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {line.remainingQuantity === 0 ? 'Complete' : `${line.alreadyReceived}/${line.orderedQuantity}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <div className="flex-1 min-w-[100px]">
                      <label className="text-[10px] text-gray-500">Receiving Qty</label>
                      <input
                        type="number"
                        min="0"
                        max={line.remainingQuantity}
                        value={line.receivingQuantity}
                        onChange={(e) => updateReceivingQuantity(index, parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="flex-1 min-w-[80px]">
                      <label className="text-[10px] text-gray-500">Max: {line.remainingQuantity}</label>
                      <button
                        onClick={() => setFullQuantity(index)}
                        className="w-full px-3 py-1.5 bg-[#014582] text-white rounded text-xs font-semibold hover:bg-[#01366a] transition-all"
                      >
                        Full
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                    <span>Ordered: {line.orderedQuantity}</span>
                    <span>Received: {line.alreadyReceived}</span>
                    <span>Remaining: {line.remainingQuantity}</span>
                    <span>Unit: {line.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {wizardState.lineDrafts.length > 0 && (
              <div className="mt-4 p-3 bg-[#014582]/5 border border-[#014582]/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Total Receiving Quantity</span>
                  <span className="text-sm font-bold text-[#014582]">{totalReceivingQuantity} items</span>
                </div>
              </div>
            )}
          </div>
        )}

        {wizardState.step === 2 && (
          <div>
            <h3 className="text-sm md:text-base font-bold text-gray-700 mb-3">Receiving Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Receiving Date *</label>
                <input
                  type="date"
                  value={wizardState.receivingDate}
                  onChange={(e) => setWizardState((prev: WizardState) => ({ ...prev, receivingDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Received By (Optional)</label>
                <input
                  type="text"
                  placeholder="Name of person receiving goods"
                  value={wizardState.receivedBy}
                  onChange={(e) => setWizardState((prev: WizardState) => ({ ...prev, receivedBy: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Additional notes..."
                  value={wizardState.notes}
                  onChange={(e) => setWizardState((prev: WizardState) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* Summary */}
              <div className="p-4 bg-[#014582]/5 border border-[#014582]/20 rounded-lg">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Purchase Order</span>
                    <span className="font-medium">{wizardState.selectedOrder?.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Supplier</span>
                    <span className="font-medium">{wizardState.selectedOrder?.supplierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Items</span>
                    <span className="font-medium">{wizardState.lineDrafts.length} items</span>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex justify-between font-bold">
                    <span>Total Receiving</span>
                    <span className="text-[#014582]">{totalReceivingQuantity} items</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={previousStep}
          disabled={wizardState.step === 0}
          className="px-4 md:px-6 py-2 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={closeCreateWizard}
            className="px-4 md:px-6 py-2 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          {wizardState.step < 2 ? (
            <button
              onClick={nextStep}
              disabled={(wizardState.step === 0 && !canGoToStep2) || (wizardState.step === 1 && !canGoToStep3)}
              className="px-5 md:px-7 py-2 md:py-2.5 bg-[#014582] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#01366a] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#014582]/25"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleCreateGRN}
              disabled={submitting}
              className="px-5 md:px-7 py-2 md:py-2.5 bg-[#014582] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#01366a] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#014582]/25 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Draft
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GRN DETAIL MODAL
// ═══════════════════════════════════════════════════════════════

function GRNDetailModal({
  grn,
  onClose,
  onConfirm,
  onDelete,
  onDownloadPDF,
  onSendEmail,
  formatDate,
  getStatusColor,
  getStatusIcon,
  submitting
}: any) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 bg-gradient-to-r from-[#014582]/5 to-transparent">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#014582]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">{grn.grnNumber}</h2>
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                <span className={`text-[10px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 md:gap-1.5 ${getStatusColor(grn.status)}`}>
                  {getStatusIcon(grn.status)}
                  {grn.status === 'Partially Received' ? 'Partial' : grn.status}
                </span>
                <span className="text-[10px] md:text-xs text-gray-400">•</span>
                <span className="text-[10px] md:text-xs text-gray-500">{formatDate(grn.receivingDate)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0">
            <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
            <div>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Purchase Order</p>
              <p className="text-sm md:text-base font-semibold text-[#014582] mt-1">{grn.purchaseOrderNumber}</p>
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Supplier</p>
              <p className="text-sm md:text-base font-semibold text-gray-800 mt-1">{grn.supplierName}</p>
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Receiving Date</p>
              <p className="text-sm md:text-base font-semibold text-gray-800 mt-1">{formatDate(grn.receivingDate)}</p>
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Received By</p>
              <p className="text-sm md:text-base font-semibold text-gray-800 mt-1">{grn.receivedBy || '—'}</p>
            </div>
          </div>

          {grn.notes && (
            <div className="mb-3 md:mb-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Notes</p>
              <p className="text-sm md:text-base text-gray-600 mt-0.5 md:mt-1">{grn.notes}</p>
            </div>
          )}

          {/* Items */}
          <div className="border-t border-gray-100 pt-3 md:pt-4 mt-3 md:mt-4">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <h4 className="text-sm md:text-base font-bold text-gray-700">Received Items</h4>
              <span className="text-[10px] md:text-xs text-gray-400">{grn.totalItems} items</span>
            </div>
            <div className="space-y-2 max-h-48 md:max-h-64 overflow-y-auto">
              {grn.items?.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-1.5 md:py-2 border-b border-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                    <p className="text-[10px] md:text-xs text-gray-400">
                      Ordered: {item.orderedQuantity} • Received: {item.receivingQuantity} • Remaining: {item.remainingQuantity}
                    </p>
                  </div>
                  <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${
                    item.isFullyReceived ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {item.isFullyReceived ? 'Complete' : `${item.receivingQuantity}/${item.orderedQuantity}`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="border-t border-gray-100 pt-3 md:pt-4 mt-3 md:mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Receiving Progress</span>
              <span className="text-sm font-bold text-[#014582]">
                {(grn.receivingProgress * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all"
                style={{ 
                  width: `${Math.min(100, grn.receivingProgress * 100)}%`,
                  backgroundColor: grn.status === 'Fully Received' ? '#22c55e' : grn.status === 'Partially Received' ? '#3b82f6' : '#f59e0b'
                }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] md:text-xs text-gray-400">
              <span>Received: {grn.totalReceivedQty}</span>
              <span>Ordered: {grn.totalOrderedQty}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-100 pt-3 md:pt-4 mt-3 md:mt-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onDownloadPDF(grn)}
                disabled={submitting}
                className="flex-1 min-w-[100px] px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 text-gray-700 rounded-lg text-xs md:text-sm font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 md:gap-2"
              >
                <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Download PDF
              </button>
              <button
                onClick={() => onSendEmail(grn)}
                disabled={submitting}
                className="flex-1 min-w-[100px] px-3 md:px-4 py-2 md:py-2.5 border border-[#014582] text-[#014582] rounded-lg text-xs md:text-sm font-semibold hover:bg-[#014582]/5 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 md:gap-2"
              >
                <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Send Email
              </button>
              {grn.canConfirm && (
                <button
                  onClick={() => onConfirm(grn.id)}
                  disabled={submitting}
                  className="flex-1 min-w-[100px] px-3 md:px-4 py-2 md:py-2.5 bg-green-500 text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-green-600 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 md:gap-2"
                >
                  <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Confirm
                </button>
              )}
              {grn.status !== 'Draft' && grn.confirmedAt && (
                <button
                  disabled
                  className="flex-1 min-w-[100px] px-3 md:px-4 py-2 md:py-2.5 bg-green-50 text-green-600 rounded-lg text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 md:gap-2"
                >
                  <PackageCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Confirmed
                </button>
              )}
              {grn.canDelete && (
                <button
                  onClick={() => onDelete(grn.id)}
                  disabled={submitting}
                  className="flex-1 min-w-[100px] px-3 md:px-4 py-2 md:py-2.5 border border-red-500 text-red-500 rounded-lg text-xs md:text-sm font-semibold hover:bg-red-50 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 md:gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl mx-3 md:mx-0">
        <div className="p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <p className="text-sm md:text-base text-gray-600">{message}</p>
          {extraContent}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 md:mt-6">
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