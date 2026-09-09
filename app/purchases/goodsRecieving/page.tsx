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
  Layers, PackageCheck, TruckIcon, Boxes, Edit3
} from 'lucide-react';
import { goodsReceivingService, GoodsReceivingModel, GoodsReceivingStats, PurchaseOrderForReceiving, GRNLineDraft } from '../../api/goodsrecieving/route';
import PDFService from '../../../lib/pdf-service';
import EmailService from '../../../lib/email-service';
import { useLocation } from '@/lib/location-context';
import { PurchaseOrderDetailCard, SupplierDetailCard } from '../../components/purchases/EnterpriseDetailCards';


interface WizardState {
  step: number;
  selectedOrders: PurchaseOrderForReceiving[];
  orderSearchResults: PurchaseOrderForReceiving[];
  isSearchingOrders: boolean;
  lineDrafts: GRNLineDraft[];
  receivingDate: string;
  receivedBy: string;
  notes: string;
}


export function GoodsReceivingPage() {
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
  const [detailStartEditing, setDetailStartEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConfirmConfirm, setShowConfirmConfirm] = useState(false);
  const [grnToActOn, setGrnToActOn] = useState<string | null>(null);

  const [wizardState, setWizardState] = useState<WizardState>({
    step: 0,
    selectedOrders: [],
    orderSearchResults: [],
    isSearchingOrders: false,
    lineDrafts: [],
    receivingDate: new Date().toISOString().split('T')[0],
    receivedBy: '',
    notes: ''
  });

  const statusOptions = ['all', 'Draft', 'Partially Received', 'Fully Received'];
  const searchInputRef = useRef<HTMLInputElement>(null);


  const totalReceivingQuantity = wizardState.lineDrafts.reduce((sum, line) => sum + line.receivingQuantity, 0);
  const canGoToStep2 = wizardState.selectedOrders.length > 0;
  const canGoToStep3 = wizardState.lineDrafts.some(line => line.receivingQuantity > 0);


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
          (item.purchaseOrderNumbers || item.purchaseOrderNumber || '').toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
    setFilteredGrns(filtered);
  }, [grns, selectedFilter, searchTerm]);


  useEffect(() => {
    fetchGRNs(true);
  }, []);

  useEffect(() => {
    fetchGRNs(true);
    setWizardState((prev: WizardState) => ({
      ...prev,
      orderSearchResults: [],
      selectedOrders: [],
      lineDrafts: [],
    }));
  }, [selectedLocationId]);


  const handleSearch = (query: string) => {
    setSearchTerm(query);
    fetchGRNs(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
    fetchGRNs(true);
  };


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


  const closeCreateWizard = () => {
    setShowCreateWizard(false);
    resetWizard();
  };

  const resetWizard = () => {
    setWizardState({
      step: 0,
      selectedOrders: [],
      orderSearchResults: [],
      isSearchingOrders: false,
      lineDrafts: [],
      receivingDate: new Date().toISOString().split('T')[0],
      receivedBy: '',
      notes: ''
    });
  };

  const rebuildLineDrafts = (orders: PurchaseOrderForReceiving[]): GRNLineDraft[] => {
    return orders.flatMap((order) =>
      order.remainingItems.map((item) => ({
        purchaseOrderItemId: item.id,
        purchaseOrderId: order.id,
        purchaseOrderNumber: order.orderNumber,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        orderedQuantity: item.quantity,
        remainingQuantity: item.remainingQuantity,
        alreadyReceived: item.alreadyReceived,
        receivingQuantity: 0,
        unitPrice: item.unitPrice,
        unit: item.unit || 'Pcs',
      }))
    );
  };

  const searchOrders = async (query: string = '', supplierId?: string) => {
    setWizardState((prev: WizardState) => ({ ...prev, isSearchingOrders: true }));
    try {
      const results = await goodsReceivingService.searchAvailableOrders(
        query,
        30,
        selectedLocationId || undefined,
        supplierId || undefined
      );
      setWizardState((prev: WizardState) => ({
        ...prev,
        orderSearchResults: results,
        isSearchingOrders: false,
      }));
    } catch (error) {
      console.error('Failed to search orders:', error);
      setWizardState((prev: WizardState) => ({
        ...prev,
        orderSearchResults: [],
        isSearchingOrders: false,
      }));
    }
  };

  const selectOrder = (order: PurchaseOrderForReceiving) => {
    let nextSelectedCount = 0;
    let nextSupplierId: string | undefined;
    setWizardState((prev: WizardState) => {
      const already = prev.selectedOrders.find((o) => o.id === order.id);
      if (already) {
        const selectedOrders = prev.selectedOrders.filter((o) => o.id !== order.id);
        nextSelectedCount = selectedOrders.length;
        nextSupplierId = selectedOrders[0]?.supplierId;
        return {
          ...prev,
          selectedOrders,
          lineDrafts: rebuildLineDrafts(selectedOrders),
        };
      }
      if (prev.selectedOrders.length > 0 && prev.selectedOrders[0].supplierId !== order.supplierId) {
        alert('All purchase orders in one GRN must be from the same supplier');
        nextSelectedCount = prev.selectedOrders.length;
        nextSupplierId = prev.selectedOrders[0]?.supplierId;
        return prev;
      }
      const selectedOrders = [...prev.selectedOrders, order];
      nextSelectedCount = selectedOrders.length;
      nextSupplierId = order.supplierId;
      return {
        ...prev,
        selectedOrders,
        lineDrafts: rebuildLineDrafts(selectedOrders),
      };
    });
    void searchOrders('', nextSelectedCount > 0 ? nextSupplierId : undefined);
  };

  const openCreateWizard = () => {
    resetWizard();
    setShowCreateWizard(true);
    void searchOrders('');
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
      alert('Please select at least one purchase order');
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


  const handleCreateGRN = async () => {
    if (!wizardState.selectedOrders.length) {
      alert('Please select at least one purchase order');
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
        purchaseOrderIds: wizardState.selectedOrders.map((o) => o.id),
        purchaseOrderId: wizardState.selectedOrders[0].id,
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


  const viewGRNDetail = (grn: GoodsReceivingModel, startEditing = false) => {
    setDetailStartEditing(startEditing);
    setViewingGRN(grn);
  };


  const handleDownloadGRNPDF = async (grn: GoodsReceivingModel) => {
    await PDFService.downloadGoodsReceivingPDF(grn);
  };


  const handleSendGRNEmail = async (grn: GoodsReceivingModel) => {
    setSubmitting(true);
    try {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };


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
          formatCurrency={formatCurrency}
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
                          <p className="text-gray-800 text-xs md:text-sm truncate max-w-[100px] md:max-w-none">{grn.purchaseOrderNumbers || grn.purchaseOrderNumber}</p>
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
                            {(grn.canEdit || grn.status === 'Draft') && (
                              <button
                                onClick={() => viewGRNDetail(grn, true)}
                                className="p-1 md:p-1.5 text-gray-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                                title="Edit Draft"
                              >
                                <Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </button>
                            )}
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
          initialEditing={detailStartEditing}
          onClose={() => {
            setViewingGRN(null);
            setDetailStartEditing(false);
          }}
          onConfirm={(id: string) => {
            setGrnToActOn(id);
            setShowConfirmConfirm(true);
            setViewingGRN(null);
            setDetailStartEditing(false);
          }}
          onDelete={(id: string) => {
            setGrnToActOn(id);
            setShowDeleteConfirm(true);
            setViewingGRN(null);
            setDetailStartEditing(false);
          }}
          onSaveEdit={async (id: string, data: any) => {
            setSubmitting(true);
            try {
              const updated = await goodsReceivingService.updateGRN(id, data);
              setViewingGRN(updated);
              setDetailStartEditing(false);
              fetchGRNs(true);
            } catch (error: any) {
              alert(error.message || 'Failed to update goods receiving');
            } finally {
              setSubmitting(false);
            }
          }}
          onDownloadPDF={handleDownloadGRNPDF}
          onSendEmail={handleSendGRNEmail}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
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
  formatDate,
  formatCurrency,
}: any) {
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  const handleSearchOrders = (query: string) => {
    setOrderSearchQuery(query);
    const lockedSupplierId = wizardState.selectedOrders[0]?.supplierId;
    searchOrders(query, lockedSupplierId);
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
            <h3 className="text-sm md:text-base font-bold text-gray-700 mb-1">Select Purchase Orders</h3>
            <p className="text-xs text-slate-500 mb-3">
              One GRN can include <span className="font-semibold text-[#014582]">multiple POs</span> from the same supplier.
              Tap each PO to add/remove it from this receiving.
            </p>
            {wizardState.selectedOrders[0]?.supplierName && (
              <p className="text-xs mb-2 px-2.5 py-1.5 rounded-lg bg-[#014582]/8 text-[#014582] font-medium">
                Locked to supplier: {wizardState.selectedOrders[0].supplierName} — only their open POs are listed
              </p>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search PO number or supplier (optional)..."
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
              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                <p className="text-[11px] text-gray-500 px-0.5">
                  Available POs — click to multi-select ({wizardState.selectedOrders.length} selected)
                </p>
                {wizardState.orderSearchResults.map((order: PurchaseOrderForReceiving) => {
                  const isSelected = wizardState.selectedOrders.some((o) => o.id === order.id);
                  return (
                    <PurchaseOrderDetailCard
                      key={order.id}
                      order={order}
                      selected={isSelected}
                      onClick={() => selectOrder(order)}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                    />
                  );
                })}
              </div>
            )}

            {!wizardState.isSearchingOrders && wizardState.orderSearchResults.length === 0 && (
              <p className="mt-3 text-xs text-gray-400 text-center py-4">
                No open purchase orders with remaining quantity found.
              </p>
            )}

            {wizardState.selectedOrders.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-[#014582]">
                  Selected for this GRN ({wizardState.selectedOrders.length})
                </p>
                {wizardState.selectedOrders.map((order) => (
                  <PurchaseOrderDetailCard
                    key={order.id}
                    order={order}
                    selected
                    onClear={() => selectOrder(order)}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                  />
                ))}
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
                      <p className="text-xs text-gray-400">
                        SKU: {line.sku}
                        {line.purchaseOrderNumber ? ` · PO ${line.purchaseOrderNumber}` : ''}
                      </p>
                      {typeof line.unitPrice === 'number' && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Unit price: {formatCurrency(line.unitPrice)} · Ordered {line.orderedQuantity} · Already {line.alreadyReceived}
                        </p>
                      )}
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

              <div className="p-4 bg-[#014582]/5 border border-[#014582]/20 rounded-lg">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Purchase Orders</span>
                    <span className="font-medium text-right">{wizardState.selectedOrders.map((o) => o.orderNumber).join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Supplier</span>
                    <span className="font-medium">{wizardState.selectedOrders[0]?.supplierName}</span>
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

function GRNDetailModal({
  grn,
  initialEditing = false,
  onClose,
  onConfirm,
  onDelete,
  onSaveEdit,
  onDownloadPDF,
  onSendEmail,
  formatDate,
  formatCurrency,
  getStatusColor,
  getStatusIcon,
  submitting
}: any) {
  const canEdit = grn.status === 'Draft' || grn.canEdit;
  const [editing, setEditing] = useState(Boolean(initialEditing) && canEdit);
  const [form, setForm] = useState({
    receivingDate: grn.receivingDate?.slice?.(0, 10) || '',
    receivedBy: grn.receivedBy || '',
    notes: grn.notes || '',
    items: (grn.items || []).map((item: any) => ({
      purchaseOrderItemId: item.purchaseOrderItemId,
      receivingQuantity: item.receivingQuantity,
      notes: item.notes || '',
      productName: item.productName,
      sku: item.sku,
      orderedQuantity: item.orderedQuantity,
      remainingQuantity: item.remainingQuantity,
      previouslyReceivedQty: item.previouslyReceivedQty,
      purchaseOrderNumber: item.purchaseOrderNumber,
      unitPrice: item.unitPrice,
      unit: item.unit,
    })),
  });

  useEffect(() => {
    setEditing(Boolean(initialEditing) && (grn.status === 'Draft' || grn.canEdit));
    setForm({
      receivingDate: grn.receivingDate?.slice?.(0, 10) || '',
      receivedBy: grn.receivedBy || '',
      notes: grn.notes || '',
      items: (grn.items || []).map((item: any) => ({
        purchaseOrderItemId: item.purchaseOrderItemId,
        receivingQuantity: item.receivingQuantity,
        notes: item.notes || '',
        productName: item.productName,
        sku: item.sku,
        orderedQuantity: item.orderedQuantity,
        remainingQuantity: item.remainingQuantity,
        previouslyReceivedQty: item.previouslyReceivedQty,
        purchaseOrderNumber: item.purchaseOrderNumber,
        unitPrice: item.unitPrice,
        unit: item.unit,
      })),
    });
  }, [grn.id, grn.receivingDate, grn.receivedBy, grn.notes, grn.items, initialEditing, grn.status, grn.canEdit]);

  const supplier = grn.supplier
    ? {
        ...grn.supplier,
        name: grn.supplier.name || grn.supplierName,
      }
    : {
        name: grn.supplierName,
        email: grn.supplierEmail,
        phone: grn.supplierPhone,
        address: grn.supplierAddress,
        city: grn.supplierCity,
        country: grn.supplierCountry,
        contactPerson: grn.supplierContactPerson,
        paymentTerms: grn.supplierPaymentTerms,
        gstNumber: grn.supplierGstNumber,
      };

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

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          <div className="mb-4">
            <SupplierDetailCard supplier={supplier} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
            <div>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Purchase Order(s)</p>
              <p className="text-sm md:text-base font-semibold text-[#014582] mt-1">{grn.purchaseOrderNumbers || grn.purchaseOrderNumber}</p>
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Receiving Date</p>
              {editing ? (
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border px-3 py-1.5 text-sm"
                  value={form.receivingDate}
                  onChange={(e) => setForm((p) => ({ ...p, receivingDate: e.target.value }))}
                />
              ) : (
                <p className="text-sm md:text-base font-semibold text-gray-800 mt-1">{formatDate(grn.receivingDate)}</p>
              )}
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Received By</p>
              {editing ? (
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-1.5 text-sm"
                  value={form.receivedBy}
                  onChange={(e) => setForm((p) => ({ ...p, receivedBy: e.target.value }))}
                />
              ) : (
                <p className="text-sm md:text-base font-semibold text-gray-800 mt-1">{grn.receivedBy || '—'}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Notes</p>
              {editing ? (
                <textarea
                  className="mt-1 w-full rounded-lg border px-3 py-1.5 text-sm"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                />
              ) : (
                <p className="text-sm md:text-base text-gray-600 mt-0.5 md:mt-1">{grn.notes || '—'}</p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3 md:pt-4 mt-3 md:mt-4">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <h4 className="text-sm md:text-base font-bold text-gray-700">Received Items</h4>
              <span className="text-[10px] md:text-xs text-gray-400">{(editing ? form.items : grn.items)?.length || 0} items</span>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {(editing ? form.items : grn.items)?.map((item: any, index: number) => (
                <div key={item.purchaseOrderItemId || index} className="bg-gray-50 rounded-lg p-2.5 md:p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                      <p className="text-[10px] md:text-xs text-gray-400">
                        SKU: {item.sku}
                        {item.purchaseOrderNumber ? ` · PO ${item.purchaseOrderNumber}` : ''}
                        {typeof item.unitPrice === 'number' ? ` · ${formatCurrency(item.unitPrice)}` : ''}
                      </p>
                      <p className="text-[10px] md:text-xs text-gray-400 mt-0.5">
                        Ordered: {item.orderedQuantity}
                        {typeof item.previouslyReceivedQty === 'number'
                          ? ` · Already received elsewhere: ${item.previouslyReceivedQty}`
                          : ''}
                      </p>
                    </div>
                    {editing ? (
                      <div className="w-24 flex-shrink-0">
                        <label className="text-[10px] text-gray-500">Qty</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full rounded border px-2 py-1 text-sm"
                          value={item.receivingQuantity}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value) || 0;
                            setForm((p) => ({
                              ...p,
                              items: p.items.map((row: any, i: number) =>
                                i === index ? { ...row, receivingQuantity: qty } : row
                              ),
                            }));
                          }}
                        />
                      </div>
                    ) : (
                      <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${
                        item.isFullyReceived ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {item.isFullyReceived ? 'Complete' : `${item.receivingQuantity}/${item.orderedQuantity}`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!editing && (
            <div className="border-t border-gray-100 pt-3 md:pt-4 mt-3 md:mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">Receiving Progress</span>
                <span className="text-sm font-bold text-[#014582]">
                  {((grn.receivingProgress || 0) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (grn.receivingProgress || 0) * 100)}%`,
                    backgroundColor: grn.status === 'Fully Received' ? '#22c55e' : grn.status === 'Partially Received' ? '#3b82f6' : '#f59e0b'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 px-4 md:px-6 py-3 md:py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => onDownloadPDF(grn)}
            disabled={submitting}
            className="flex-1 min-w-[100px] px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs md:text-sm font-semibold hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            PDF
          </button>
          <button
            onClick={() => onSendEmail(grn)}
            disabled={submitting}
            className="flex-1 min-w-[100px] px-3 py-2 border border-[#014582] text-[#014582] rounded-lg text-xs md:text-sm font-semibold hover:bg-[#014582]/5 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Email
          </button>
          {canEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex-1 min-w-[100px] px-3 py-2 bg-slate-700 text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Draft
            </button>
          )}
          {canEdit && editing && (
            <button
              onClick={async () => {
                await onSaveEdit(grn.id, {
                  receivingDate: form.receivingDate,
                  receivedBy: form.receivedBy,
                  notes: form.notes,
                  items: form.items.map((item: any) => ({
                    purchaseOrderItemId: item.purchaseOrderItemId,
                    receivingQuantity: item.receivingQuantity,
                    notes: item.notes || undefined,
                  })),
                });
                setEditing(false);
              }}
              disabled={submitting}
              className="flex-1 min-w-[100px] px-3 py-2 bg-[#014582] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#01366a] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
          )}
          {grn.canConfirm && !editing && (
            <button
              onClick={() => onConfirm(grn.id)}
              disabled={submitting}
              className="flex-1 min-w-[100px] px-3 py-2 bg-green-500 text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-green-600 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Confirm
            </button>
          )}
          {grn.canDelete && !editing && (
            <button
              onClick={() => onDelete(grn.id)}
              disabled={submitting}
              className="flex-1 min-w-[100px] px-3 py-2 border border-red-500 text-red-500 rounded-lg text-xs md:text-sm font-semibold hover:bg-red-50 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
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
/** Next.js route shell — real UI mounts via ModuleViewHost. */
export default function ModuleRoutePlaceholder() {
  return null;
}
