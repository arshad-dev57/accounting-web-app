'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Plus, Eye, Receipt, Users,
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
  List, Save, SendHorizontal, CreditCard as CreditCardIcon,
  ReceiptText, ReceiptIndianRupee, Receipt as ReceiptIcon
} from 'lucide-react';
import { purchaseInvoiceService, PurchaseInvoiceModel, PurchaseInvoiceStats, GRNSource, POSource, PurchaseInvoiceLineDraft } from '../../api/purchaseinvoice/route';
import CreateInvoiceWizard from '../../components/purchases-invoices/CreateInvoiceWizard';
import PDFService from '../../../lib/pdf-service';
import EmailService from '../../../lib/email-service';

// ─── TYPES ─────────────────────────────────────────────────────

interface WizardState {
  step: number;
  sourceType: 'grn' | 'po';
  selectedSource: GRNSource | POSource | null;
  sourceSearchResults: (GRNSource | POSource)[];
  isSearchingSource: boolean;
  lineDrafts: PurchaseInvoiceLineDraft[];
  supplierInvoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  notes: string;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export default function PurchaseInvoicesPage() {
  const [invoices, setInvoices] = useState<PurchaseInvoiceModel[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<PurchaseInvoiceModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
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
  const [stats, setStats] = useState<PurchaseInvoiceStats>({
    todayCount: 0,
    todayAmount: 0,
    monthCount: 0,
    monthAmount: 0,
    draft: 0,
    posted: 0,
    partiallyPaid: 0,
    paid: 0,
    cancelled: 0,
    totalOutstanding: 0
  });
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<PurchaseInvoiceModel | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [invoiceToActOn, setInvoiceToActOn] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // ─── Wizard State ─────────────────────────────────────────────
  const [wizardState, setWizardState] = useState<WizardState>({
    step: 0,
    sourceType: 'grn',
    selectedSource: null,
    sourceSearchResults: [],
    isSearchingSource: false,
    lineDrafts: [],
    supplierInvoiceNo: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentTerms: 'Net 30',
    notes: ''
  });

  const statusOptions = ['all', 'Draft', 'Posted', 'Partially Paid', 'Paid', 'Cancelled'];
  const paymentOptions = ['all', 'Unpaid', 'Partial', 'Paid'];
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ─── Computed Values ─────────────────────────────────────────

  const selectedSubtotal = wizardState.lineDrafts.reduce((sum, line) => sum + line.subtotal, 0);
  const selectedTotalDiscount = wizardState.lineDrafts.reduce((sum, line) => sum + line.discountAmount, 0);
  const selectedTotalTax = wizardState.lineDrafts.reduce((sum, line) => sum + line.taxAmount, 0);
  const selectedGrandTotal = selectedSubtotal - selectedTotalDiscount + selectedTotalTax;
  const totalItems = wizardState.lineDrafts.reduce((sum, line) => sum + line.quantity, 0);

  const canGoToStep2 = wizardState.selectedSource !== null && wizardState.lineDrafts.length > 0;
  const canGoToStep3 = wizardState.lineDrafts.length > 0;

  // ─── Fetch Invoices ──────────────────────────────────────────

  const fetchInvoices = useCallback(async (resetPage = true) => {
    setLoading(true);
    try {
      const page = resetPage ? 1 : pagination.page;
      const response = await purchaseInvoiceService.getInvoices({
        page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        paymentStatus: paymentFilter !== 'all' ? paymentFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
      });

      setInvoices(response.data || []);
      setFilteredInvoices(response.data || []);
      setPagination(response.pagination);
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (error: any) {
      console.error('Failed to fetch invoices:', error);
      alert(error.message || 'Failed to load purchase invoices');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, paymentFilter, fromDate, toDate, pagination.page, pagination.limit]);

  // ─── Load More ──────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!pagination.hasNext || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const response = await purchaseInvoiceService.getInvoices({
        page: nextPage,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        paymentStatus: paymentFilter !== 'all' ? paymentFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
      });

      setInvoices(prev => [...prev, ...(response.data || [])]);
      setFilteredInvoices(prev => [...prev, ...(response.data || [])]);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load more invoices:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [pagination.hasNext, pagination.page, pagination.limit, searchTerm, statusFilter, paymentFilter, fromDate, toDate]);

  // ─── Apply Local Filters ────────────────────────────────────

  useEffect(() => {
    const filtered = invoices.filter(item => {
      if (selectedFilter !== 'all' && item.invoiceStatus !== selectedFilter) {
        return false;
      }
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matches = item.invoiceNumber.toLowerCase().includes(query) ||
          item.supplierName.toLowerCase().includes(query) ||
          (item.supplierInvoiceNo?.toLowerCase().includes(query) || false) ||
          (item.purchaseOrderNumber?.toLowerCase().includes(query) || false);
        if (!matches) return false;
      }
      return true;
    });
    setFilteredInvoices(filtered);
  }, [invoices, selectedFilter, searchTerm]);

  // ─── Initial Fetch ──────────────────────────────────────────

  useEffect(() => {
    fetchInvoices(true);
  }, []);

  // ─── Search ──────────────────────────────────────────────────

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    fetchInvoices(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
    fetchInvoices(true);
  };

  // ─── Filter Changes ──────────────────────────────────────────

  const handleStatusFilterChange = (filter: string) => {
    setStatusFilter(filter);
    fetchInvoices(true);
  };

  const handlePaymentFilterChange = (filter: string) => {
    setPaymentFilter(filter);
    fetchInvoices(true);
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  const handleDateFilter = () => {
    fetchInvoices(true);
  };

  const handleRefresh = () => {
    fetchInvoices(true);
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchInvoices(false);
  };

  // ─── Wizard Functions ────────────────────────────────────────

  const openCreateWizard = () => {
    resetWizard();
    setShowCreateWizard(true);
    void searchSource('', 'grn');
  };

  const closeCreateWizard = () => {
    setShowCreateWizard(false);
    resetWizard();
  };

  const resetWizard = () => {
    setWizardState({
      step: 0,
      sourceType: 'grn',
      selectedSource: null,
      sourceSearchResults: [],
      isSearchingSource: false,
      lineDrafts: [],
      supplierInvoiceNo: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentTerms: 'Net 30',
      notes: ''
    });
  };

  const setSourceType = (type: 'grn' | 'po') => {
    setWizardState(prev => ({
      ...prev,
      sourceType: type,
      selectedSource: null,
      sourceSearchResults: [],
      lineDrafts: []
    }));
    void searchSource('', type);
  };

  const searchSource = async (query: string, type?: 'grn' | 'po') => {
    if (query.trim().length === 1) {
      return;
    }
    setWizardState(prev => ({ ...prev, isSearchingSource: true }));
    try {
      const results = await purchaseInvoiceService.searchAvailableSource(
        type || wizardState.sourceType,
        query
      );
      setWizardState(prev => ({ ...prev, sourceSearchResults: results }));
    } catch (error) {
      console.error('Failed to search source:', error);
      setWizardState(prev => ({ ...prev, sourceSearchResults: [] }));
    } finally {
      setWizardState(prev => ({ ...prev, isSearchingSource: false }));
    }
  };

  const selectSource = (source: GRNSource | POSource) => {
    const items = source.items || [];
    const lineDrafts = items.map((item: any) => ({
      productId: item.productId || '',
      productName: item.productName || '',
      sku: item.sku || '',
      quantity: item.quantity || item.receivingQuantity || 0,
      unitPrice: item.unitPrice || item.costPrice || 0,
      discount: item.discount || 0,
      taxRate: item.taxRate || 0,
      subtotal: 0,
      discountAmount: 0,
      taxableAmount: 0,
      taxAmount: 0,
      lineTotal: 0,
      notes: item.notes || null
    }));

    // Recalculate line totals
    const updatedDrafts = lineDrafts.map((line: any) => {
      const subtotal = line.quantity * line.unitPrice;
      const discountAmount = subtotal * (line.discount / 100);
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = taxableAmount * (line.taxRate / 100);
      const lineTotal = taxableAmount + taxAmount;
      return { ...line, subtotal, discountAmount, taxableAmount, taxAmount, lineTotal };
    });

    setWizardState(prev => ({
      ...prev,
      selectedSource: source,
      sourceSearchResults: [],
      lineDrafts: updatedDrafts
    }));
  };

  const nextStep = () => {
    if (wizardState.step === 0 && !canGoToStep2) {
      alert('Please select a source first');
      return;
    }
    if (wizardState.step === 1 && !canGoToStep3) {
      alert('No items available for invoicing');
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

  // ─── Create Invoice ──────────────────────────────────────────

  const handleCreateInvoice = async () => {
    if (!wizardState.selectedSource) {
      alert('Please select a source');
      return;
    }

    if (wizardState.lineDrafts.length === 0) {
      alert('No items available for invoicing');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        invoiceDate: wizardState.invoiceDate,
        dueDate: wizardState.dueDate,
        paymentTerms: wizardState.paymentTerms || 'Net 30',
        notes: wizardState.notes || undefined,
        supplierInvoiceNo: wizardState.supplierInvoiceNo || undefined
      };

      if (wizardState.sourceType === 'grn') {
        payload.goodsReceivingId = wizardState.selectedSource.id;
      } else {
        payload.purchaseOrderId = wizardState.selectedSource.id;
      }

      await purchaseInvoiceService.createInvoice(payload);

      closeCreateWizard();
      fetchInvoices(true);
    } catch (error: any) {
      console.error('Failed to create invoice:', error);
      alert(error.message || 'Failed to create purchase invoice');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Invoice Actions ─────────────────────────────────────────

  const handlePostInvoice = async (id: string) => {
    setSubmitting(true);
    try {
      await purchaseInvoiceService.postInvoice(id);
      setViewingInvoice(null);
      fetchInvoices(true);
    } catch (error: any) {
      console.error('Failed to post invoice:', error);
      alert(error.message || 'Failed to post invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (!invoiceToActOn) return;
    setSubmitting(true);
    try {
      await purchaseInvoiceService.cancelInvoice(invoiceToActOn, cancelReason || 'Cancelled by user');
      setShowCancelConfirm(false);
      setInvoiceToActOn(null);
      setCancelReason('');
      setViewingInvoice(null);
      fetchInvoices(true);
    } catch (error: any) {
      console.error('Failed to cancel invoice:', error);
      alert(error.message || 'Failed to cancel invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceToActOn) return;
    setSubmitting(true);
    try {
      await purchaseInvoiceService.deleteInvoice(invoiceToActOn);
      setShowDeleteConfirm(false);
      setInvoiceToActOn(null);
      setViewingInvoice(null);
      fetchInvoices(true);
    } catch (error: any) {
      console.error('Failed to delete invoice:', error);
      alert(error.message || 'Failed to delete invoice');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── View Invoice Detail ─────────────────────────────────────

  const viewInvoiceDetail = (invoice: PurchaseInvoiceModel) => {
    setViewingInvoice(invoice);
  };

  // ─── Download Invoice PDF ──────────────────────────────────────

  const handleDownloadInvoicePDF = async (invoice: PurchaseInvoiceModel) => {
    await PDFService.downloadInvoicePDF(invoice);
  };

  // ─── Send Invoice Email ─────────────────────────────────────────

  const handleSendInvoiceEmail = async (invoice: PurchaseInvoiceModel) => {
    setSubmitting(true);
    try {
      // Invoice might not have supplier email, so we need to check
      if (!invoice.supplierEmail) {
        alert('Supplier email is not available for this invoice. Please add supplier email first.');
        return;
      }

      const pdfBlob = await PDFService.generateInvoicePDFBlob(invoice);
      await EmailService.sendInvoiceEmail(invoice, pdfBlob);
      
      alert('Invoice sent successfully!');
    } catch (error: any) {
      console.error('Failed to send invoice email:', error);
      alert(error.message || 'Failed to send invoice email');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Helper Functions ──────────────────────────────────────

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-orange-100 text-orange-700';
      case 'Posted': return 'bg-blue-100 text-blue-700';
      case 'Partially Paid': return 'bg-purple-100 text-purple-700';
      case 'Paid': return 'bg-green-100 text-green-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft': return <FileText className="w-4 h-4 text-orange-600" />;
      case 'Posted': return <Send className="w-4 h-4 text-blue-600" />;
      case 'Partially Paid': return <Clock className="w-4 h-4 text-purple-600" />;
      case 'Paid': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Cancelled': return <Ban className="w-4 h-4 text-red-600" />;
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
      {showCreateWizard ? (
        <CreateInvoiceWizard
          wizardState={wizardState}
          setWizardState={setWizardState}
          setSourceType={setSourceType}
          searchSource={searchSource}
          selectSource={selectSource}
          nextStep={nextStep}
          previousStep={previousStep}
          handleCreateInvoice={handleCreateInvoice}
          closeCreateWizard={closeCreateWizard}
          submitting={submitting}
          canGoToStep2={canGoToStep2}
          canGoToStep3={canGoToStep3}
          selectedSubtotal={selectedSubtotal}
          selectedTotalDiscount={selectedTotalDiscount}
          selectedTotalTax={selectedTotalTax}
          selectedGrandTotal={selectedGrandTotal}
          totalItems={totalItems}
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
                <Receipt className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
                Purchase Invoices
                <span className="text-xs md:text-sm font-normal text-gray-400 ml-1 md:ml-2">
                  ({pagination.total} invoices)
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
                <span className="hidden sm:inline">Create Invoice</span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Today</p>
              <p className="text-lg md:text-xl font-bold text-gray-800 mt-0.5 md:mt-1">{stats.todayCount}</p>
              <p className="text-xs md:text-sm font-semibold text-purple-600">{formatCurrency(stats.todayAmount)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Month</p>
              <p className="text-lg md:text-xl font-bold text-blue-600 mt-0.5 md:mt-1">{stats.monthCount}</p>
              <p className="text-xs md:text-sm font-semibold text-purple-600">{formatCurrency(stats.monthAmount)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Outstanding</p>
              <p className="text-lg md:text-xl font-bold text-orange-600 mt-0.5 md:mt-1">{formatCurrency(stats.totalOutstanding)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Draft</p>
              <p className="text-lg md:text-xl font-bold text-orange-600 mt-0.5 md:mt-1">{stats.draft}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Posted</p>
              <p className="text-lg md:text-xl font-bold text-blue-600 mt-0.5 md:mt-1">{stats.posted}</p>
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
                  placeholder="Search invoices..."
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

                <div className="relative flex-1 sm:flex-none min-w-[100px]">
                  <select
                    value={paymentFilter}
                    onChange={(e) => handlePaymentFilterChange(e.target.value)}
                    className="appearance-none w-full px-3 md:px-4 py-1.5 md:py-2 pr-8 md:pr-10 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
                  >
                    {paymentOptions.map((status) => (
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
            {['all', 'Draft', 'Posted', 'Partially Paid', 'Paid', 'Cancelled'].map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-semibold transition-all ${
                  selectedFilter === filter
                    ? 'bg-[#014582] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter === 'Partially Paid' ? 'Partial' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Supplier</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Outstanding</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 md:py-12">
                        <Loader2 className="w-6 h-6 md:w-8 md:h-8 mx-auto text-[#014582] animate-spin" />
                        <p className="mt-2 text-xs md:text-sm text-gray-500">Loading purchase invoices...</p>
                      </td>
                    </tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 md:py-12 text-gray-400">
                        <Receipt className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
                        <p className="text-sm md:text-lg font-medium text-gray-500">No purchase invoices found</p>
                        <p className="text-xs md:text-sm text-gray-400">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <div>
                            <p className="font-medium text-[#014582] text-xs md:text-sm">{invoice.invoiceNumber}</p>
                            <p className="text-[10px] md:text-xs text-gray-400 sm:hidden">{invoice.supplierName}</p>
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3 hidden sm:table-cell">
                          <p className="text-gray-800 text-xs md:text-sm truncate max-w-[120px] md:max-w-none">{invoice.supplierName}</p>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <p className="font-semibold text-gray-800 text-xs md:text-sm">{formatCurrency(invoice.grandTotal)}</p>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3 hidden md:table-cell">
                          <p className={`text-xs md:text-sm font-semibold ${invoice.isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                            {formatCurrency(invoice.outstanding)}
                          </p>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3 hidden lg:table-cell">
                          <p className="text-xs md:text-sm text-gray-600">{formatDate(invoice.invoiceDate)}</p>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-[8px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 md:gap-1.5 w-fit ${getStatusColor(invoice.invoiceStatus)}`}>
                              {getStatusIcon(invoice.invoiceStatus)}
                              <span className="hidden xs:inline">{invoice.invoiceStatus === 'Partially Paid' ? 'Partial' : invoice.invoiceStatus}</span>
                            </span>
                            {invoice.isOverdue && (
                              <span className="text-[8px] md:text-[10px] font-bold text-red-600">OVERDUE</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <div className="flex items-center gap-1 md:gap-2">
                            <button
                              onClick={() => handleDownloadInvoicePDF(invoice)}
                              className="p-1 md:p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                            <button
                              onClick={() => handleSendInvoiceEmail(invoice)}
                              disabled={submitting}
                              className="p-1 md:p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50"
                              title="Send Email"
                            >
                              <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                            <button
                              onClick={() => viewInvoiceDetail(invoice)}
                              className="p-1 md:p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="View Detail"
                            >
                              <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                            {invoice.canPost && (
                              <button
                                onClick={() => handlePostInvoice(invoice.id)}
                                className="p-1 md:p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Post"
                              >
                                <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </button>
                            )}
                            {invoice.canCancel && (
                              <button
                                onClick={() => {
                                  setInvoiceToActOn(invoice.id);
                                  setShowCancelConfirm(true);
                                }}
                                className="p-1 md:p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Cancel"
                              >
                                <Ban className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </button>
                            )}
                            {invoice.canDelete && (
                              <button
                                onClick={() => {
                                  setInvoiceToActOn(invoice.id);
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
            {pagination.hasNext && filteredInvoices.length > 0 && (
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

      {/* Invoice Detail Modal */}
      {viewingInvoice && (
        <InvoiceDetailModal
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          onPost={handlePostInvoice}
          onCancel={(id: string) => {
            setInvoiceToActOn(id);
            setShowCancelConfirm(true);
            setViewingInvoice(null);
          }}
          onDelete={(id: string) => {
            setInvoiceToActOn(id);
            setShowDeleteConfirm(true);
            setViewingInvoice(null);
          }}
          onDownloadPDF={handleDownloadInvoicePDF}
          onSendEmail={handleSendInvoiceEmail}
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
          title="Cancel Purchase Invoice"
          message="Are you sure you want to cancel this purchase invoice? This action cannot be undone."
          confirmLabel="Cancel Invoice"
          confirmColor="bg-red-500 hover:bg-red-600"
          onConfirm={handleCancelInvoice}
          onCancel={() => {
            setShowCancelConfirm(false);
            setInvoiceToActOn(null);
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
          title="Delete Purchase Invoice"
          message="Are you sure you want to delete this purchase invoice? This action cannot be undone."
          confirmLabel="Delete"
          confirmColor="bg-red-500 hover:bg-red-600"
          onConfirm={handleDeleteInvoice}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setInvoiceToActOn(null);
          }}
          loading={submitting}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// INVOICE DETAIL MODAL
// ═══════════════════════════════════════════════════════════════

function InvoiceDetailModal({
  invoice,
  onClose,
  onPost,
  onCancel,
  onDelete,
  onDownloadPDF,
  onSendEmail,
  formatCurrency,
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
              <Receipt className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">{invoice.invoiceNumber}</h2>
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                <span className={`text-[10px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 md:gap-1.5 ${getStatusColor(invoice.invoiceStatus)}`}>
                  {getStatusIcon(invoice.invoiceStatus)}
                  {invoice.invoiceStatus === 'Partially Paid' ? 'Partial' : invoice.invoiceStatus}
                </span>
                <span className="text-[10px] md:text-xs text-gray-400">•</span>
                <span className="text-[10px] md:text-xs text-gray-500">{formatDate(invoice.invoiceDate)}</span>
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
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Supplier</p>
              <p className="text-sm md:text-base font-semibold text-gray-800 mt-1">{invoice.supplierName}</p>
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Supplier Invoice No</p>
              <p className="text-sm md:text-base font-semibold text-[#014582] mt-1">{invoice.supplierInvoiceNo || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Invoice Date</p>
              <p className="text-sm md:text-base font-semibold text-gray-800 mt-1">{formatDate(invoice.invoiceDate)}</p>
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Due Date</p>
              <p className="text-sm md:text-base font-semibold text-gray-800 mt-1">{formatDate(invoice.dueDate)}</p>
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Payment Terms</p>
              <p className="text-sm md:text-base font-semibold text-gray-800 mt-1">{invoice.paymentTerms || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Purchase Order</p>
              <p className="text-sm md:text-base font-semibold text-[#014582] mt-1">{invoice.purchaseOrderNumber || '—'}</p>
            </div>
          </div>

          {invoice.notes && (
            <div className="mb-3 md:mb-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Notes</p>
              <p className="text-sm md:text-base text-gray-600 mt-0.5 md:mt-1">{invoice.notes}</p>
            </div>
          )}

          {/* Financial Summary */}
          <div className="border-t border-gray-100 pt-3 md:pt-4 mt-3 md:mt-4">
            <h4 className="text-sm md:text-base font-bold text-gray-700 mb-2 md:mb-3">Financial Summary</h4>
            <div className="space-y-1.5 md:space-y-2">
              <div className="flex justify-between items-center text-xs md:text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold text-gray-800">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-xs md:text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="font-semibold text-green-600">-{formatCurrency(invoice.totalDiscount)}</span>
              </div>
              <div className="flex justify-between items-center text-xs md:text-sm">
                <span className="text-gray-500">Tax</span>
                <span className="font-semibold text-gray-800">{formatCurrency(invoice.totalTax)}</span>
              </div>
              <div className="flex justify-between items-center text-xs md:text-sm pt-2 border-t border-gray-100">
                <span className="font-semibold text-gray-700">Grand Total</span>
                <span className="font-bold text-lg text-[#014582]">{formatCurrency(invoice.grandTotal)}</span>
              </div>
              <div className="flex justify-between items-center text-xs md:text-sm">
                <span className="text-gray-500">Paid</span>
                <span className="font-semibold text-green-600">{formatCurrency(invoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-xs md:text-sm pt-2 border-t border-gray-100">
                <span className="font-semibold text-gray-700">Outstanding</span>
                <span className={`font-bold text-lg ${invoice.isOverdue ? 'text-red-600' : 'text-orange-600'}`}>{formatCurrency(invoice.outstanding)}</span>
              </div>
            </div>
          </div>

          {/* Items */}
          {invoice.items && invoice.items.length > 0 && (
            <div className="border-t border-gray-100 pt-3 md:pt-4 mt-3 md:mt-4">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <h4 className="text-sm md:text-base font-bold text-gray-700">Invoice Items</h4>
                <span className="text-[10px] md:text-xs text-gray-400">{invoice.items.length} items</span>
              </div>
              <div className="space-y-2 max-h-48 md:max-h-64 overflow-y-auto">
                {invoice.items.map((item: any, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-2 md:p-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-semibold text-gray-800 truncate">{item.productName}</p>
                        <p className="text-[10px] md:text-xs text-gray-400">{item.sku}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs md:text-sm font-semibold text-gray-800">{formatCurrency(item.lineTotal)}</p>
                        <p className="text-[10px] md:text-xs text-gray-400">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 px-4 md:px-6 py-3 md:py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 md:px-5 py-2 text-xs md:text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-all"
          >
            Close
          </button>
          <button
            onClick={() => onDownloadPDF && onDownloadPDF(invoice)}
            className="px-4 md:px-5 py-2 text-xs md:text-sm font-semibold border border-purple-500 text-purple-600 hover:bg-purple-50 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>
          <button
            onClick={() => onSendEmail && onSendEmail(invoice)}
            disabled={submitting}
            className="px-4 md:px-5 py-2 text-xs md:text-sm font-semibold border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Send Email
          </button>
          {invoice.canPost && (
            <button
              onClick={() => onPost(invoice.id)}
              disabled={submitting}
              className="px-4 md:px-5 py-2 text-xs md:text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Post Invoice
            </button>
          )}
          {invoice.canCancel && (
            <button
              onClick={() => onCancel(invoice.id)}
              disabled={submitting}
              className="px-4 md:px-5 py-2 text-xs md:text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
              Cancel
            </button>
          )}
          {invoice.canDelete && (
            <button
              onClick={() => onDelete(invoice.id)}
              disabled={submitting}
              className="px-4 md:px-5 py-2 text-xs md:text-sm font-semibold bg-red-500 text-white hover:bg-red-600 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
  confirmColor = 'bg-red-500 hover:bg-red-600',
  onConfirm,
  onCancel,
  loading = false,
  extraContent = null
}: any) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-4 md:p-6">
          <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900">{title}</h3>
              <p className="text-xs md:text-sm text-gray-500 mt-1">{message}</p>
            </div>
          </div>
          {extraContent}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 mt-4 md:mt-6">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-4 md:px-5 py-2 text-xs md:text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 md:px-5 py-2 text-xs md:text-sm font-semibold text-white rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${confirmColor}`}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}