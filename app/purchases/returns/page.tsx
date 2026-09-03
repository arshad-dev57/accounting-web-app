'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Plus, Eye, Undo2, Users,
  ChevronDown, ChevronLeft, ChevronRight, Loader2,
  X, AlertCircle, CheckCircle, Clock,
  DollarSign, Calendar, FileText,
  RefreshCw, Trash2, Package, ShoppingBag,
  Check, AlertTriangle,
  Ban, Filter, PlusCircle, MinusCircle,
  Building2, User, Phone, Mail,
  Send, Truck, CalendarDays, IndianRupee,
  Percent, Box, Warehouse, ClipboardList,
  ShoppingCart, Store, CreditCard, Banknote,
  CircleCheck, CircleX, CircleAlert,
  Edit3, File, Printer, Download,
  Receipt, Save, Undo, Boxes, PackageX
} from 'lucide-react';
import { purchaseReturnService, PurchaseReturnModel, PurchaseReturnStats, Supplier, InvoiceForReturn, ReturnItemForForm } from '../../api/purchasereturns/route';

// ─── TYPES ─────────────────────────────────────────────────────

interface CreateFormState {
  selectedSupplier: Supplier | null;
  supplierSearchResults: Supplier[];
  isSearchingSuppliers: boolean;
  availableInvoices: InvoiceForReturn[];
  selectedInvoice: InvoiceForReturn | null;
  isLoadingInvoices: boolean;
  returnItems: ReturnItemForForm[];
  isLoadingProducts: boolean;
  returnReason: string;
  notes: string;
  returnDate: string;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export function PurchaseReturnsPage() {
  const [returns, setReturns] = useState<PurchaseReturnModel[]>([]);
  const [filteredReturns, setFilteredReturns] = useState<PurchaseReturnModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
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
  const [stats, setStats] = useState<PurchaseReturnStats>({
    todayCount: 0,
    todayAmount: 0,
    monthCount: 0,
    monthAmount: 0,
    draftCount: 0
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewingReturn, setViewingReturn] = useState<PurchaseReturnModel | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [returnToActOn, setReturnToActOn] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // ─── Create Form State ──────────────────────────────────────
  const [formState, setFormState] = useState<CreateFormState>({
    selectedSupplier: null,
    supplierSearchResults: [],
    isSearchingSuppliers: false,
    availableInvoices: [],
    selectedInvoice: null,
    isLoadingInvoices: false,
    returnItems: [],
    isLoadingProducts: false,
    returnReason: '',
    notes: '',
    returnDate: new Date().toISOString().split('T')[0]
  });

  const filters = ['all', 'Draft', 'Processed', 'Cancelled'];
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ─── Computed Values ─────────────────────────────────────────

  const totalReturnAmount = formState.returnItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalReturnQty = formState.returnItems.reduce((sum, item) => sum + item.returnQuantity, 0);
  
  const canCreateReturn = formState.selectedSupplier !== null && 
    formState.selectedInvoice !== null && 
    formState.returnItems.some(item => item.isSelected && item.returnQuantity > 0) &&
    totalReturnAmount > 0;

  // ─── Fetch Returns ──────────────────────────────────────────

  const fetchReturns = useCallback(async (resetPage = true) => {
    setLoading(true);
    try {
      const page = resetPage ? 1 : pagination.page;
      const response = await purchaseReturnService.getReturns({
        page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: selectedFilter !== 'all' ? selectedFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
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
  }, [searchTerm, selectedFilter, fromDate, toDate, pagination.page, pagination.limit]);

  // ─── Load More ──────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!pagination.hasNext || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const response = await purchaseReturnService.getReturns({
        page: nextPage,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: selectedFilter !== 'all' ? selectedFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
      });

      setReturns(prev => [...prev, ...(response.data || [])]);
      setFilteredReturns(prev => [...prev, ...(response.data || [])]);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load more returns:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [pagination.hasNext, pagination.page, pagination.limit, searchTerm, selectedFilter, fromDate, toDate]);

  // ─── Apply Local Filters ────────────────────────────────────

  useEffect(() => {
    const filtered = returns.filter(item => {
      if (selectedFilter !== 'all' && item.status !== selectedFilter) {
        return false;
      }
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matches = item.returnNumber.toLowerCase().includes(query) ||
          item.supplierName.toLowerCase().includes(query) ||
          item.purchaseInvoiceNumber.toLowerCase().includes(query);
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

  // ─── Search ──────────────────────────────────────────────────

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    fetchReturns(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
    fetchReturns(true);
  };

  // ─── Filter Change ──────────────────────────────────────────

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    fetchReturns(true);
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
      selectedSupplier: null,
      supplierSearchResults: [],
      isSearchingSuppliers: false,
      availableInvoices: [],
      selectedInvoice: null,
      isLoadingInvoices: false,
      returnItems: [],
      isLoadingProducts: false,
      returnReason: '',
      notes: '',
      returnDate: new Date().toISOString().split('T')[0]
    });
  };

  const searchSuppliers = async (query: string) => {
    if (query.trim().length < 2) {
      setFormState(prev => ({ ...prev, supplierSearchResults: [] }));
      return;
    }
    setFormState(prev => ({ ...prev, isSearchingSuppliers: true }));
    try {
      const results = await purchaseReturnService.searchSuppliers(query);
      setFormState(prev => ({ ...prev, supplierSearchResults: results }));
    } catch (error) {
      console.error('Failed to search suppliers:', error);
      setFormState(prev => ({ ...prev, supplierSearchResults: [] }));
    } finally {
      setFormState(prev => ({ ...prev, isSearchingSuppliers: false }));
    }
  };

  const selectSupplier = async (supplier: Supplier) => {
    setFormState(prev => ({ ...prev, selectedSupplier: supplier, supplierSearchResults: [] }));
    
    setFormState(prev => ({ ...prev, isLoadingInvoices: true }));
    try {
      const invoices = await purchaseReturnService.getSupplierInvoices(supplier.id);
      setFormState(prev => ({ 
        ...prev, 
        availableInvoices: invoices, 
        selectedInvoice: null,
        returnItems: [],
        isLoadingInvoices: false 
      }));
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      setFormState(prev => ({ ...prev, availableInvoices: [], isLoadingInvoices: false }));
    }
  };

  const selectInvoice = async (invoice: InvoiceForReturn) => {
    setFormState(prev => ({ ...prev, selectedInvoice: invoice }));
    
    setFormState(prev => ({ ...prev, isLoadingProducts: true }));
    try {
      const products = await purchaseReturnService.getInvoiceProducts(invoice.id);
      setFormState(prev => ({ ...prev, returnItems: products, isLoadingProducts: false }));
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setFormState(prev => ({ ...prev, returnItems: [], isLoadingProducts: false }));
    }
  };

  const toggleItemSelection = (index: number) => {
    setFormState(prev => {
      const newItems = [...prev.returnItems];
      const item = newItems[index];
      item.isSelected = !item.isSelected;
      if (item.isSelected) {
        item.returnQuantity = item.availableQuantity > 0 ? item.availableQuantity : 0;
        if (item.isBoxBased && item.boxQuantity > 0) {
          item.boxes = Math.floor(item.returnQuantity / item.boxQuantity);
          item.quantityPerBox = item.boxQuantity;
          item.returnQuantity = item.boxes! * item.boxQuantity;
        }
        item.lineTotal = item.returnQuantity * item.unitPrice;
      } else {
        item.returnQuantity = 0;
        item.boxes = 0;
        item.quantityPerBox = 0;
        item.lineTotal = 0;
      }
      return { ...prev, returnItems: newItems };
    });
  };

  const updateReturnQuantity = (index: number, quantity: number) => {
    setFormState(prev => {
      const newItems = [...prev.returnItems];
      const item = newItems[index];
      const maxQty = Math.min(quantity, item.availableQuantity);
      item.returnQuantity = Math.max(0, maxQty);
      item.lineTotal = item.returnQuantity * item.unitPrice;
      return { ...prev, returnItems: newItems };
    });
  };

  const updateBoxes = (index: number, boxes: number) => {
    setFormState(prev => {
      const newItems = [...prev.returnItems];
      const item = newItems[index];
      item.boxes = Math.max(0, boxes);
      if (item.quantityPerBox && item.quantityPerBox > 0) {
        const qty = boxes * item.quantityPerBox;
        if (qty > item.availableQuantity) {
          item.boxes = Math.floor(item.availableQuantity / item.quantityPerBox);
          item.returnQuantity = item.boxes! * item.quantityPerBox;
        } else {
          item.returnQuantity = qty;
        }
        item.lineTotal = item.returnQuantity * item.unitPrice;
      }
      return { ...prev, returnItems: newItems };
    });
  };

  const updateQtyPerBox = (index: number, qtyPerBox: number) => {
    setFormState(prev => {
      const newItems = [...prev.returnItems];
      const item = newItems[index];
      item.quantityPerBox = Math.max(0, qtyPerBox);
      if (item.boxes && item.boxes > 0 && qtyPerBox > 0) {
        const qty = item.boxes * qtyPerBox;
        if (qty > item.availableQuantity) {
          item.boxes = Math.floor(item.availableQuantity / qtyPerBox);
          item.returnQuantity = item.boxes! * qtyPerBox;
        } else {
          item.returnQuantity = qty;
        }
        item.lineTotal = item.returnQuantity * item.unitPrice;
      }
      return { ...prev, returnItems: newItems };
    });
  };

  // ─── Create Return ─────────────────────────────────────────

  const handleCreateReturn = async () => {
    if (!canCreateReturn) {
      alert('Please fill all required fields');
      return;
    }

    const selectedItems = formState.returnItems.filter(item => item.isSelected && item.returnQuantity > 0);
    if (selectedItems.length === 0) {
      alert('Please select at least one item to return');
      return;
    }

    if (!formState.returnReason.trim()) {
      alert('Please provide a return reason');
      return;
    }

    setSubmitting(true);
    try {
      const items = selectedItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        purchaseInvoiceItemId: item.purchaseInvoiceItemId,
        returnQuantity: item.returnQuantity,
        isBoxBased: item.isBoxBased,
        boxes: item.boxes || 0,
        quantityPerBox: item.quantityPerBox || 0,
        unitPrice: item.unitPrice,
        returnReason: item.returnReason || formState.returnReason,
        notes: item.notes || ''
      }));

      await purchaseReturnService.createDraftReturn({
        supplierId: formState.selectedSupplier!.id,
        supplierName: formState.selectedSupplier!.name,
        purchaseInvoiceId: formState.selectedInvoice!.id,
        purchaseInvoiceNumber: formState.selectedInvoice!.invoiceNumber,
        returnReason: formState.returnReason,
        notes: formState.notes || undefined,
        items
      });

      closeCreateForm();
      fetchReturns(true);
    } catch (error: any) {
      console.error('Failed to create return:', error);
      alert(error.message || 'Failed to create return');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Return Actions ─────────────────────────────────────────

  const handleProcessReturn = async (id: string) => {
    setSubmitting(true);
    try {
      await purchaseReturnService.processReturn(id);
      setViewingReturn(null);
      fetchReturns(true);
    } catch (error: any) {
      console.error('Failed to process return:', error);
      alert(error.message || 'Failed to process return');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelReturn = async () => {
    if (!returnToActOn) return;
    setSubmitting(true);
    try {
      await purchaseReturnService.cancelReturn(returnToActOn, cancelReason || 'Cancelled by user');
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
      await purchaseReturnService.deleteReturn(returnToActOn);
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

  const viewReturnDetail = (returnItem: PurchaseReturnModel) => {
    setViewingReturn(returnItem);
  };

  // ─── Helper Functions ──────────────────────────────────────

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Processed': return 'bg-green-100 text-green-700';
      case 'Draft': return 'bg-orange-100 text-orange-700';
      case 'Cancelled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Processed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Draft': return <FileText className="w-4 h-4 text-orange-600" />;
      case 'Cancelled': return <Ban className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return 'Rs. 0.00';
    return `Rs. ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ─── RENDER ──────────────────────────────────────────────────

  return (
    <div className="space-y-4 md:space-y-6">
      {showCreateForm ? (
        <CreateReturnForm
          formState={formState}
          setFormState={setFormState}
          searchSuppliers={searchSuppliers}
          selectSupplier={selectSupplier}
          selectInvoice={selectInvoice}
          toggleItemSelection={toggleItemSelection}
          updateReturnQuantity={updateReturnQuantity}
          updateBoxes={updateBoxes}
          updateQtyPerBox={updateQtyPerBox}
          handleCreateReturn={handleCreateReturn}
          closeCreateForm={closeCreateForm}
          submitting={submitting}
          canCreateReturn={canCreateReturn}
          totalReturnAmount={totalReturnAmount}
          totalReturnQty={totalReturnQty}
          formatCurrency={formatCurrency}
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
                <Undo2 className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
                Purchase Returns
                <span className="text-xs md:text-sm font-normal text-gray-400 ml-1 md:ml-2">
                  ({pagination.total} returns)
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
                onClick={openCreateForm}
                className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-[#014582] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#01366a] transition-all shadow-lg shadow-[#014582]/25"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Return</span>
                <span className="sm:hidden">Return</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Today's Returns</p>
              <p className="text-lg md:text-xl font-bold text-gray-800 mt-0.5 md:mt-1">{stats.todayCount}</p>
              <p className="text-xs md:text-sm font-semibold text-green-600">{formatCurrency(stats.todayAmount)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">This Month</p>
              <p className="text-lg md:text-xl font-bold text-gray-800 mt-0.5 md:mt-1">{stats.monthCount}</p>
              <p className="text-xs md:text-sm font-semibold text-blue-600">{formatCurrency(stats.monthAmount)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Draft</p>
              <p className="text-lg md:text-xl font-bold text-orange-600 mt-0.5 md:mt-1">{stats.draftCount}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Records</p>
              <p className="text-lg md:text-xl font-bold text-gray-800 mt-0.5 md:mt-1">{pagination.total}</p>
              <p className="text-xs md:text-sm font-semibold text-purple-600">{pagination.pages} pages</p>
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
                  placeholder="Search returns..."
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
                    value={selectedFilter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className="appearance-none w-full px-3 md:px-4 py-1.5 md:py-2 pr-8 md:pr-10 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  >
                    {filters.map((filter) => (
                      <option key={filter} value={filter}>
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
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
            {['all', 'Draft', 'Processed', 'Cancelled'].map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-semibold transition-all ${
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
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Return</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Supplier</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Invoice</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && returns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 md:py-12">
                        <Loader2 className="w-6 h-6 md:w-8 md:h-8 mx-auto text-[#014582] animate-spin" />
                        <p className="mt-2 text-xs md:text-sm text-gray-500">Loading returns...</p>
                      </td>
                    </tr>
                  ) : filteredReturns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 md:py-12 text-gray-400">
                        <Undo2 className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
                        <p className="text-sm md:text-lg font-medium text-gray-500">No returns found</p>
                        <p className="text-xs md:text-sm text-gray-400">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredReturns.map((returnItem) => (
                      <tr key={returnItem.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <div>
                            <p className="font-medium text-[#014582] text-xs md:text-sm">{returnItem.returnNumber}</p>
                            <p className="text-[10px] md:text-xs text-gray-400 sm:hidden">{returnItem.supplierName}</p>
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3 hidden sm:table-cell">
                          <p className="text-gray-800 text-xs md:text-sm truncate max-w-[120px] md:max-w-none">{returnItem.supplierName}</p>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <p className="font-semibold text-gray-800 text-xs md:text-sm">{formatCurrency(returnItem.grandTotal)}</p>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3 hidden md:table-cell">
                          <p className="text-xs md:text-sm text-gray-600">{returnItem.purchaseInvoiceNumber}</p>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3 hidden lg:table-cell">
                          <p className="text-xs md:text-sm text-gray-600">{formatDate(returnItem.returnDate)}</p>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <span className={`text-[8px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 md:gap-1.5 w-fit ${getStatusColor(returnItem.status)}`}>
                            {getStatusIcon(returnItem.status)}
                            <span className="hidden xs:inline">{returnItem.status}</span>
                          </span>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <div className="flex items-center gap-1 md:gap-2">
                            <button
                              onClick={() => viewReturnDetail(returnItem)}
                              className="p-1 md:p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="View Detail"
                            >
                              <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                            {returnItem.canProcess && (
                              <button
                                onClick={() => handleProcessReturn(returnItem.id)}
                                className="p-1 md:p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                title="Process"
                              >
                                <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </button>
                            )}
                            {returnItem.canCancel && (
                              <button
                                onClick={() => {
                                  setReturnToActOn(returnItem.id);
                                  setShowCancelConfirm(true);
                                }}
                                className="p-1 md:p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Cancel"
                              >
                                <Ban className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </button>
                            )}
                            {returnItem.canDelete && (
                              <button
                                onClick={() => {
                                  setReturnToActOn(returnItem.id);
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
            {pagination.hasNext && filteredReturns.length > 0 && (
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

      {/* Return Detail Modal */}
      {viewingReturn && (
        <ReturnDetailModal
          returnItem={viewingReturn}
          onClose={() => setViewingReturn(null)}
          onProcess={handleProcessReturn}
          onCancel={(id: string) => {
            setReturnToActOn(id);
            setShowCancelConfirm(true);
            setViewingReturn(null);
          }}
          onDelete={(id: string) => {
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

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <ConfirmationModal
          title="Cancel Purchase Return"
          message="Are you sure you want to cancel this purchase return? This action cannot be undone."
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
          title="Delete Purchase Return"
          message="Are you sure you want to delete this purchase return? This action cannot be undone."
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

// ─── RETURN DETAIL MODAL ───────────────────────────────────────────

function ReturnDetailModal({
  returnItem,
  onClose,
  onProcess,
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
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${getStatusColor(returnItem.status)}`}>
                  {getStatusIcon(returnItem.status)}
                  {returnItem.status}
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
              <p className="text-xs text-gray-400 font-medium">Supplier</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{returnItem.supplierName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Purchase Invoice</p>
              <p className="text-sm font-semibold text-[#014582] mt-1">{returnItem.purchaseInvoiceNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Total Amount</p>
              <p className="text-lg font-bold text-[#014582] mt-1">{formatCurrency(returnItem.grandTotal)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Items</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{returnItem.items?.reduce((sum: number, item: any) => sum + (item.returnQuantity || 0), 0) || 0}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-400 font-medium">Return Reason</p>
            <p className="text-sm text-gray-600 mt-1">{returnItem.returnReason}</p>
          </div>

          {returnItem.notes && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 font-medium">Notes</p>
              <p className="text-sm text-gray-600 mt-1">{returnItem.notes}</p>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-700">Return Items</h4>
              <span className="text-xs text-gray-400">{returnItem.items?.reduce((sum: number, item: any) => sum + (item.returnQuantity || 0), 0) || 0} items</span>
            </div>
            <div className="space-y-2">
              {returnItem.items?.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.productName}</p>
                    <p className="text-xs text-gray-400">
                      Qty: {item.returnQuantity} • {item.sku}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[#014582]">{formatCurrency(item.lineTotal)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          {returnItem.status === 'Draft' && returnItem.canProcess && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <button
                onClick={() => onProcess(returnItem.id)}
                disabled={submitting}
                className="w-full px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-all disabled:opacity-50"
              >
                Process Return
              </button>
            </div>
          )}

          {returnItem.status === 'Draft' && (
            <div className="border-t border-gray-100 pt-4 mt-4 flex gap-3">
              <button
                onClick={() => onCancel(returnItem.id)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => onDelete(returnItem.id)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 border border-red-500 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 transition-all disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          )}

          {returnItem.status === 'Cancelled' && (
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

// ─── CREATE RETURN FORM ───────────────────────────────────────────

function CreateReturnForm({
  formState,
  setFormState,
  searchSuppliers,
  selectSupplier,
  selectInvoice,
  toggleItemSelection,
  updateReturnQuantity,
  updateBoxes,
  updateQtyPerBox,
  handleCreateReturn,
  closeCreateForm,
  submitting,
  canCreateReturn,
  totalReturnAmount,
  totalReturnQty,
  formatCurrency,
  formatDate
}: any) {
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');

  const handleSearchSuppliers = (query: string) => {
    setSupplierSearchQuery(query);
    searchSuppliers(query);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={closeCreateForm} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Undo2 className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
            Create Purchase Return
          </h2>
        </div>
        <button onClick={closeCreateForm} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left Column - Supplier, Invoice & Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Supplier Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
            <h3 className="text-sm md:text-base font-bold text-gray-700 mb-3">Select Supplier</h3>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search supplier by name, email, phone..."
                  value={supplierSearchQuery}
                  onChange={(e) => handleSearchSuppliers(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                />
              </div>

              {formState.isSearchingSuppliers && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 p-4">
                  <Loader2 className="w-6 h-6 mx-auto text-[#014582] animate-spin" />
                </div>
              )}

              {formState.supplierSearchResults.length > 0 && !formState.isSearchingSuppliers && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                  {formState.supplierSearchResults.map((supplier: Supplier) => (
                    <button
                      key={supplier.id}
                      onClick={() => selectSupplier(supplier)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-none transition-colors"
                    >
                      <p className="font-medium text-gray-800 text-sm">{supplier.name}</p>
                      <p className="text-xs text-gray-400">
                        {supplier.email} {supplier.phone && `• ${supplier.phone}`}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {formState.selectedSupplier && (
              <div className="mt-3 p-3 bg-[#014582]/5 border border-[#014582]/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{formState.selectedSupplier.name}</p>
                    <p className="text-xs text-gray-500">
                      {formState.selectedSupplier.email} {formState.selectedSupplier.phone && `• ${formState.selectedSupplier.phone}`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFormState((prev: CreateFormState) => ({ 
                        ...prev, 
                        selectedSupplier: null, 
                        supplierSearchResults: [],
                        availableInvoices: [],
                        selectedInvoice: null,
                        returnItems: []
                      }));
                      setSupplierSearchQuery('');
                    }}
                    className="p-1 hover:bg-gray-200 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Invoice Selection */}
          {formState.selectedSupplier && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
              <h3 className="text-sm md:text-base font-bold text-gray-700 mb-3">Select Purchase Invoice</h3>

              {formState.isLoadingInvoices ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
                  <p className="mt-2 text-xs md:text-sm text-gray-400">Loading invoices...</p>
                </div>
              ) : formState.availableInvoices.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Receipt className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm md:text-base">No invoices found for this supplier</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 md:max-h-80 overflow-y-auto">
                  {formState.availableInvoices.map((invoice: InvoiceForReturn) => {
                    const isSelected = formState.selectedInvoice?.id === invoice.id;
                    return (
                      <div
                        key={invoice.id}
                        className={`p-3 border rounded-lg transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#014582] bg-[#014582]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => selectInvoice(invoice)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-[#014582] text-sm">{invoice.invoiceNumber}</p>
                            <p className="text-[10px] md:text-xs text-gray-400">
                              Date: {formatDate(invoice.invoiceDate)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-800 text-sm">{formatCurrency(invoice.grandTotal)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Return Items */}
          {formState.selectedInvoice && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm md:text-base font-bold text-gray-700">Select Items to Return</h3>
                <span className="text-xs md:text-sm text-gray-400">
                  {formState.returnItems.filter((item: any) => item.isSelected).length} selected
                </span>
              </div>

              {formState.isLoadingProducts ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
                  <p className="mt-2 text-xs md:text-sm text-gray-400">Loading products...</p>
                </div>
              ) : formState.returnItems.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Package className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm md:text-base">No items found in this invoice</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {formState.returnItems.map((item: any, index: number) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg transition-all ${
                        item.isSelected
                          ? 'border-[#014582] bg-[#014582]/5'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <input
                            type="checkbox"
                            checked={item.isSelected}
                            onChange={() => toggleItemSelection(index)}
                            className="w-4 h-4 text-[#014582] rounded border-gray-300 focus:ring-[#014582] cursor-pointer"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-800 text-sm">{item.productName}</p>
                              <p className="text-[10px] md:text-xs text-gray-400">
                                SKU: {item.sku} • Available: {item.availableQuantity}
                              </p>
                              <p className="text-[10px] md:text-xs text-gray-400">
                                Unit Price: {formatCurrency(item.unitPrice)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-[#014582] text-sm">{formatCurrency(item.lineTotal)}</p>
                            </div>
                          </div>

                          {item.isSelected && (
                            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                              <div>
                                <label className="text-[10px] md:text-xs text-gray-500">Return Qty</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={item.availableQuantity}
                                  value={item.returnQuantity}
                                  onChange={(e) => updateReturnQuantity(index, parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                                />
                              </div>

                              {item.isBoxBased && (
                                <>
                                  <div>
                                    <label className="text-[10px] md:text-xs text-gray-500">Boxes</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={item.boxes || 0}
                                      onChange={(e) => updateBoxes(index, parseFloat(e.target.value) || 0)}
                                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] md:text-xs text-gray-500">Qty/Box</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={item.quantityPerBox || 0}
                                      onChange={(e) => updateQtyPerBox(index, parseFloat(e.target.value) || 0)}
                                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                                    />
                                  </div>
                                </>
                              )}

                              <div>
                                <label className="text-[10px] md:text-xs text-gray-500">Line Total</label>
                                <p className="font-semibold text-gray-800 text-xs md:text-sm">{formatCurrency(item.lineTotal)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Return Details */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
            <h3 className="text-sm md:text-base font-bold text-gray-700 mb-3">Return Details</h3>

            <div className="space-y-3">
              {/* Return Date */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Return Date *</label>
                <input
                  type="date"
                  value={formState.returnDate}
                  onChange={(e) => setFormState((prev: CreateFormState) => ({ ...prev, returnDate: e.target.value }))}
                  className="w-full px-3 md:px-4 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                />
              </div>

              {/* Return Reason */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Return Reason *</label>
                <select
                  value={formState.returnReason}
                  onChange={(e) => setFormState((prev: CreateFormState) => ({ ...prev, returnReason: e.target.value }))}
                  className="w-full px-3 md:px-4 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                >
                  <option value="">Select reason</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Defective">Defective</option>
                  <option value="Wrong Item">Wrong Item</option>
                  <option value="Expired">Expired</option>
                  <option value="Quality Issue">Quality Issue</option>
                  <option value="Overstock">Overstock</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Notes (Optional)</label>
                <textarea
                  placeholder="Add any additional notes..."
                  value={formState.notes}
                  onChange={(e) => setFormState((prev: CreateFormState) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 md:px-4 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* Summary */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs md:text-sm text-gray-600">Total Items</span>
                  <span className="font-semibold text-gray-800 text-xs md:text-sm">{totalReturnQty}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm text-gray-600">Total Amount</span>
                  <span className="font-bold text-[#014582] text-sm md:text-base">{formatCurrency(totalReturnAmount)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleCreateReturn}
                disabled={!canCreateReturn || submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 md:py-2.5 bg-[#014582] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#01366a] transition-all shadow-lg shadow-[#014582]/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Return
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
