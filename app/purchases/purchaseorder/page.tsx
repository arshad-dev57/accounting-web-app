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
  Edit3, File, Printer, Download
} from 'lucide-react';
import { purchaseOrderService, PurchaseOrderModel, PurchaseOrderStats, PurchaseOrderStatusCounts, Supplier, Product } from '../../api/purchaseorder/route';
import PDFService from '../../../lib/pdf-service';
import EmailService from '../../../lib/email-service';

// ─── TYPES ─────────────────────────────────────────────────────

interface PurchaseOrderLineDraft {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  lineTotal: number;
}

interface WizardState {
  step: number;
  selectedSupplier: Supplier | null;
  supplierSearchResults: Supplier[];
  isSearchingSuppliers: boolean;
  lineDrafts: PurchaseOrderLineDraft[];
  productSearchResults: Product[];
  isSearchingProducts: boolean;
  orderDate: string;
  expectedDeliveryDate: string;
  notes: string;
  termsConditions: string;
}

// ─── MAIN PAGE ──────────────────────────────────────────────────

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrderModel[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrderModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
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
  const [stats, setStats] = useState<PurchaseOrderStats>({
    todayCount: 0,
    todayAmount: 0,
    monthCount: 0,
    monthAmount: 0
  });
  const [statusCounts, setStatusCounts] = useState<PurchaseOrderStatusCounts>({
    draft: 0,
    sent: 0,
    approved: 0,
    cancelled: 0,
    total: 0
  });
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrderModel | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [orderToActOn, setOrderToActOn] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // ─── Wizard State ─────────────────────────────────────────────
  const [wizardState, setWizardState] = useState<WizardState>({
    step: 0,
    selectedSupplier: null,
    supplierSearchResults: [],
    isSearchingSuppliers: false,
    lineDrafts: [],
    productSearchResults: [],
    isSearchingProducts: false,
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    termsConditions: ''
  });

  const statusOptions = ['all', 'Draft', 'Sent', 'Approved', 'Cancelled'];
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ─── Computed Values ─────────────────────────────────────────

  const selectedSubtotal = wizardState.lineDrafts.reduce((sum, line) => sum + line.subtotal, 0);
  const selectedTotalDiscount = wizardState.lineDrafts.reduce((sum, line) => sum + line.discountAmount, 0);
  const selectedTotalTax = wizardState.lineDrafts.reduce((sum, line) => sum + line.taxAmount, 0);
  const selectedGrandTotal = selectedSubtotal - selectedTotalDiscount + selectedTotalTax;
  const totalItems = wizardState.lineDrafts.reduce((sum, line) => sum + line.quantity, 0);

  const canGoToStep2 = wizardState.selectedSupplier !== null;
  const canGoToStep3 = wizardState.lineDrafts.length > 0;

  // ─── Fetch Orders ────────────────────────────────────────────

  const fetchOrders = useCallback(async (resetPage = true) => {
    setLoading(true);
    try {
      const page = resetPage ? 1 : pagination.page;
      const response = await purchaseOrderService.getOrders({
        page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
      });

      setOrders(response.data || []);
      setFilteredOrders(response.data || []);
      setPagination(response.pagination);
      if (response.stats) {
        setStats(response.stats);
      }
      if (response.statusCounts) {
        setStatusCounts(response.statusCounts);
      }
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      alert(error.message || 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, fromDate, toDate, pagination.page, pagination.limit]);

  // ─── Load More ──────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!pagination.hasNext || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const response = await purchaseOrderService.getOrders({
        page: nextPage,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
      });

      setOrders(prev => [...prev, ...(response.data || [])]);
      setFilteredOrders(prev => [...prev, ...(response.data || [])]);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load more orders:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [pagination.hasNext, pagination.page, pagination.limit, searchTerm, statusFilter, fromDate, toDate]);

  // ─── Apply Local Filters ────────────────────────────────────

  useEffect(() => {
    const filtered = orders.filter(item => {
      if (selectedFilter !== 'all' && item.status !== selectedFilter) {
        return false;
      }
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matches = item.orderNumber.toLowerCase().includes(query) ||
          item.supplierName.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
    setFilteredOrders(filtered);
  }, [orders, selectedFilter, searchTerm]);

  // ─── Initial Fetch ──────────────────────────────────────────

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();
      if (data.success) {
        setUserProfile(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  useEffect(() => {
    fetchOrders(true);
    fetchUserProfile();
  }, []);

  // ─── Search ──────────────────────────────────────────────────

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    fetchOrders(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
    fetchOrders(true);
  };

  // ─── Filter Changes ──────────────────────────────────────────

  const handleStatusFilterChange = (filter: string) => {
    setStatusFilter(filter);
    fetchOrders(true);
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  const handleDateFilter = () => {
    fetchOrders(true);
  };

  const handleRefresh = () => {
    fetchOrders(true);
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchOrders(false);
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
      selectedSupplier: null,
      supplierSearchResults: [],
      isSearchingSuppliers: false,
      lineDrafts: [],
      productSearchResults: [],
      isSearchingProducts: false,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
      termsConditions: ''
    });
  };

  const searchSuppliers = async (query: string) => {
    if (query.trim().length < 2) {
      setWizardState(prev => ({ ...prev, supplierSearchResults: [] }));
      return;
    }
    setWizardState(prev => ({ ...prev, isSearchingSuppliers: true }));
    try {
      const results = await purchaseOrderService.searchSuppliers(query);
      setWizardState(prev => ({ ...prev, supplierSearchResults: results }));
    } catch (error) {
      console.error('Failed to search suppliers:', error);
      setWizardState(prev => ({ ...prev, supplierSearchResults: [] }));
    } finally {
      setWizardState(prev => ({ ...prev, isSearchingSuppliers: false }));
    }
  };

  const selectSupplier = (supplier: Supplier) => {
    setWizardState(prev => ({
      ...prev,
      selectedSupplier: supplier,
      supplierSearchResults: []
    }));
  };

  const searchProducts = async (query: string) => {
    if (query.trim().length < 2) {
      setWizardState(prev => ({ ...prev, productSearchResults: [] }));
      return;
    }
    setWizardState(prev => ({ ...prev, isSearchingProducts: true }));
    try {
      const results = await purchaseOrderService.searchProducts(query);
      setWizardState(prev => ({ ...prev, productSearchResults: results }));
    } catch (error) {
      console.error('Failed to search products:', error);
      setWizardState(prev => ({ ...prev, productSearchResults: [] }));
    } finally {
      setWizardState(prev => ({ ...prev, isSearchingProducts: false }));
    }
  };

  const addProductToOrder = (product: Product) => {
    setWizardState(prev => {
      const existingIndex = prev.lineDrafts.findIndex(line => line.productId === product.id);
      let newDrafts = [...prev.lineDrafts];
      
      if (existingIndex !== -1) {
        const existing = newDrafts[existingIndex];
        newDrafts[existingIndex] = {
          ...existing,
          quantity: existing.quantity + 1
        };
      } else {
        const newLine: PurchaseOrderLineDraft = {
          productId: product.id,
          productName: product.name,
          sku: product.sku || '',
          quantity: 1,
          unitPrice: product.costPrice || 0,
          discount: 0,
          taxRate: product.taxRate || 0,
          subtotal: 0,
          discountAmount: 0,
          taxableAmount: 0,
          taxAmount: 0,
          lineTotal: 0
        };
        newDrafts.push(newLine);
      }
      
      // Recalculate line totals
      newDrafts = newDrafts.map(line => {
        const subtotal = line.quantity * line.unitPrice;
        const discountAmount = subtotal * (line.discount / 100);
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = taxableAmount * (line.taxRate / 100);
        const lineTotal = taxableAmount + taxAmount;
        return {
          ...line,
          subtotal,
          discountAmount,
          taxableAmount,
          taxAmount,
          lineTotal
        };
      });
      
      return { ...prev, lineDrafts: newDrafts, productSearchResults: [] };
    });
  };

  const removeProductFromOrder = (index: number) => {
    setWizardState(prev => {
      const newDrafts = [...prev.lineDrafts];
      newDrafts.splice(index, 1);
      return { ...prev, lineDrafts: newDrafts };
    });
  };

  const updateProductField = (index: number, field: keyof PurchaseOrderLineDraft, value: any) => {
    setWizardState(prev => {
      const newDrafts = [...prev.lineDrafts];
      const line = newDrafts[index];
      
      if (field === 'quantity' && value > 0) line.quantity = value;
      else if (field === 'unitPrice' && value >= 0) line.unitPrice = value;
      else if (field === 'discount' && value >= 0 && value <= 100) line.discount = value;
      else if (field === 'taxRate' && value >= 0) line.taxRate = value;
      
      // Recalculate
      const subtotal = line.quantity * line.unitPrice;
      const discountAmount = subtotal * (line.discount / 100);
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = taxableAmount * (line.taxRate / 100);
      const lineTotal = taxableAmount + taxAmount;
      
      newDrafts[index] = {
        ...line,
        subtotal,
        discountAmount,
        taxableAmount,
        taxAmount,
        lineTotal
      };
      
      return { ...prev, lineDrafts: newDrafts };
    });
  };

  const nextStep = () => {
    if (wizardState.step === 0 && !canGoToStep2) {
      alert('Please select a supplier first');
      return;
    }
    if (wizardState.step === 1 && !canGoToStep3) {
      alert('Please add at least one item to the order');
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

  // ─── Create Order ──────────────────────────────────────────

  const handleCreateOrder = async () => {
    if (!wizardState.selectedSupplier) {
      alert('Please select a supplier');
      return;
    }

    if (wizardState.lineDrafts.length === 0) {
      alert('Please add at least one item');
      return;
    }

    setSubmitting(true);
    try {
      const items = wizardState.lineDrafts.map(line => ({
        productId: line.productId,
        productName: line.productName,
        sku: line.sku,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discount: line.discount,
        taxRate: line.taxRate
      }));

      await purchaseOrderService.createOrder({
        supplierId: wizardState.selectedSupplier.id,
        supplierName: wizardState.selectedSupplier.name,
        supplierEmail: wizardState.selectedSupplier.email || '',
        supplierPhone: wizardState.selectedSupplier.phone || '',
        supplierAddress: wizardState.selectedSupplier.address || '',
        orderDate: wizardState.orderDate,
        expectedDeliveryDate: wizardState.expectedDeliveryDate,
        items,
        notes: wizardState.notes || undefined,
        termsConditions: wizardState.termsConditions || undefined,
        status: 'Draft'
      });

      closeCreateWizard();
      fetchOrders(true);
    } catch (error: any) {
      console.error('Failed to create order:', error);
      alert(error.message || 'Failed to create purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Order Actions ──────────────────────────────────────────

  const handleSendOrder = async (id: string) => {
    setSubmitting(true);
    try {
      const order = orders.find(o => o.id === id);
      if (!order) {
        throw new Error('Order not found');
      }

      const companyInfo = {
        name: userProfile?.organizationName || 'Your Company Name',
        email: userProfile?.email || '',
        phone: userProfile?.contactNo || userProfile?.phone || ''
      };

      // Send email using the new reusable email service
      await EmailService.sendPurchaseOrderEmail(order, undefined, companyInfo);
      
      // Update order status
      await purchaseOrderService.sendOrder(id);
      setViewingOrder(null);
      fetchOrders(true);
    } catch (error: any) {
      console.error('Failed to send order:', error);
      alert(error.message || 'Failed to send order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendOrderWithInvoice = async (order: PurchaseOrderModel) => {
    setSubmitting(true);
    try {
      // Generate PDF blob using the new reusable PDF service
      const companyInfo = {
        name: userProfile?.organizationName || 'Your Company Name',
        address: userProfile?.address || '',
        phone: userProfile?.contactNo || userProfile?.phone || '',
        email: userProfile?.email || ''
      };
      const pdfBlob = PDFService.generatePurchaseOrderPDFBlob(order, companyInfo);

      // Send email with PDF attachment using the new reusable email service
      await EmailService.sendPurchaseOrderEmail(order, pdfBlob, companyInfo);
      
      // Update order status
      await purchaseOrderService.sendOrder(order.id);
      setViewingOrder(null);
      fetchOrders(true);
    } catch (error: any) {
      console.error('Failed to send order with invoice:', error);
      alert(error.message || 'Failed to send order with invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]); // Remove data URL prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleApproveOrder = async (id: string) => {
    setSubmitting(true);
    try {
      await purchaseOrderService.updateOrderStatus(id, 'Approved');
      setViewingOrder(null);
      fetchOrders(true);
    } catch (error: any) {
      console.error('Failed to approve order:', error);
      alert(error.message || 'Failed to approve order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderToActOn) return;
    setSubmitting(true);
    try {
      await purchaseOrderService.cancelOrder(orderToActOn, cancelReason || 'Cancelled by user');
      setShowCancelConfirm(false);
      setOrderToActOn(null);
      setCancelReason('');
      setViewingOrder(null);
      fetchOrders(true);
    } catch (error: any) {
      console.error('Failed to cancel order:', error);
      alert(error.message || 'Failed to cancel order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToActOn) return;
    setSubmitting(true);
    try {
      await purchaseOrderService.deleteOrder(orderToActOn);
      setShowDeleteConfirm(false);
      setOrderToActOn(null);
      setViewingOrder(null);
      fetchOrders(true);
    } catch (error: any) {
      console.error('Failed to delete order:', error);
      alert(error.message || 'Failed to delete order');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── View Order Detail ─────────────────────────────────────

  const viewOrderDetail = (order: PurchaseOrderModel) => {
    setViewingOrder(order);
  };

  const handleGenerateInvoice = (order: PurchaseOrderModel) => {
    const businessDetails = userProfile?.businessDetails || {};
    const companyName = userProfile?.organizationName || 'Your Company Name';
    const companyLogo = businessDetails.logo || '';
    const companyAddress = userProfile?.address || '';
    const companyPhone = userProfile?.contactNo || userProfile?.phone || '';
    const companyEmail = userProfile?.email || '';

    const companyInfo = {
      name: companyName,
      address: companyAddress,
      phone: companyPhone,
      email: companyEmail,
      logo: companyLogo
    };

    PDFService.downloadPurchaseOrderPDF(order, companyInfo);
  };

  // ─── Helper Functions ──────────────────────────────────────

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-orange-100 text-orange-700';
      case 'Sent': return 'bg-blue-100 text-blue-700';
      case 'Approved': return 'bg-green-100 text-green-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft': return <FileText className="w-4 h-4 text-orange-600" />;
      case 'Sent': return <Send className="w-4 h-4 text-blue-600" />;
      case 'Approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
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
        <CreateOrderWizard
          wizardState={wizardState}
          setWizardState={setWizardState}
          searchSuppliers={searchSuppliers}
          selectSupplier={selectSupplier}
          searchProducts={searchProducts}
          addProductToOrder={addProductToOrder}
          removeProductFromOrder={removeProductFromOrder}
          updateProductField={updateProductField}
          nextStep={nextStep}
          previousStep={previousStep}
          handleCreateOrder={handleCreateOrder}
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
                <Receipt className="w-5 h-5 md:w-6 md:h-6 text-[#7c4dff]" />
                Purchase Orders
                <span className="text-xs md:text-sm font-normal text-gray-400 ml-1 md:ml-2">
                  ({pagination.total} orders)
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={handleRefresh}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#7c4dff] transition-all"
                title="Refresh"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={openCreateWizard}
                className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-[#7c4dff] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#6c3fe0] transition-all shadow-lg shadow-purple-500/25"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Order</span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>
          </div>

          {/* Stats - Responsive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Total Orders</p>
              <p className="text-lg md:text-xl font-bold text-gray-800 mt-0.5 md:mt-1">{statusCounts.total}</p>
              <p className="text-xs md:text-sm font-semibold text-purple-600">{formatCurrency(stats.monthAmount)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Draft</p>
              <p className="text-lg md:text-xl font-bold text-orange-600 mt-0.5 md:mt-1">{statusCounts.draft}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Sent</p>
              <p className="text-lg md:text-xl font-bold text-blue-600 mt-0.5 md:mt-1">{statusCounts.sent}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Approved</p>
              <p className="text-lg md:text-xl font-bold text-green-600 mt-0.5 md:mt-1">{statusCounts.approved}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Cancelled</p>
              <p className="text-lg md:text-xl font-bold text-red-600 mt-0.5 md:mt-1">{statusCounts.cancelled}</p>
            </div>
          </div>

          {/* Search & Filters - Responsive */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 md:gap-4">
              <div className="flex-1 min-w-[150px] md:min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-8 md:pl-9 pr-3 md:pr-4 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none"
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
                    className="appearance-none w-full px-3 md:px-4 py-1.5 md:py-2 pr-8 md:pr-10 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50"
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
                    className="px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 w-[120px] md:w-auto"
                  />
                  <span className="text-gray-400 text-xs md:text-sm hidden xs:inline">to</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none bg-gray-50 w-[120px] md:w-auto"
                  />
                  <button
                    onClick={handleDateFilter}
                    className="px-3 md:px-4 py-1.5 md:py-2 bg-[#7c4dff]/10 text-[#7c4dff] rounded-lg text-xs md:text-sm font-semibold hover:bg-[#7c4dff]/20 transition-all"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Status Quick Filters - Responsive */}
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {['all', 'Draft', 'Sent', 'Approved', 'Cancelled'].map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-semibold transition-all ${
                  selectedFilter === filter
                    ? 'bg-[#7c4dff] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Table - Responsive */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Supplier</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Items</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 md:py-12">
                        <Loader2 className="w-6 h-6 md:w-8 md:h-8 mx-auto text-[#7c4dff] animate-spin" />
                        <p className="mt-2 text-xs md:text-sm text-gray-500">Loading purchase orders...</p>
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 md:py-12 text-gray-400">
                        <Receipt className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
                        <p className="text-sm md:text-lg font-medium text-gray-500">No purchase orders found</p>
                        <p className="text-xs md:text-sm text-gray-400">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <div>
                            <p className="font-medium text-[#7c4dff] text-xs md:text-sm">{order.orderNumber}</p>
                            <p className="text-[10px] md:text-xs text-gray-400 sm:hidden">{order.supplierName}</p>
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3 hidden sm:table-cell">
                          <p className="text-gray-800 text-xs md:text-sm truncate max-w-[120px] md:max-w-none">{order.supplierName}</p>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <p className="font-semibold text-gray-800 text-xs md:text-sm">{formatCurrency(order.grandTotal)}</p>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3 text-center hidden md:table-cell">
                          <span className="text-xs md:text-sm font-semibold text-gray-700">
                            {order.totalItems || 0}
                          </span>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3 hidden lg:table-cell">
                          <p className="text-xs md:text-sm text-gray-600">{formatDate(order.orderDate)}</p>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <span className={`text-[8px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 md:gap-1.5 w-fit ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="hidden xs:inline">{order.status}</span>
                          </span>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <div className="flex items-center gap-1 md:gap-2">
                            <button
                              onClick={() => viewOrderDetail(order)}
                              className="p-1 md:p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="View Detail"
                            >
                              <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                            <button
                              onClick={() => handleGenerateInvoice(order)}
                              className="p-1 md:p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                              title="Generate Invoice"
                            >
                              <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                            {order.canSend && (
                              <button
                                onClick={() => handleSendOrder(order.id)}
                                className="p-1 md:p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Send"
                              >
                                <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </button>
                            )}
                            {order.canApprove && (
                              <button
                                onClick={() => handleApproveOrder(order.id)}
                                className="p-1 md:p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                title="Approve"
                              >
                                <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </button>
                            )}
                            {order.canCancel && (
                              <button
                                onClick={() => {
                                  setOrderToActOn(order.id);
                                  setShowCancelConfirm(true);
                                }}
                                className="p-1 md:p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Cancel"
                              >
                                <Ban className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </button>
                            )}
                            {order.canDelete && (
                              <button
                                onClick={() => {
                                  setOrderToActOn(order.id);
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
            {pagination.hasNext && filteredOrders.length > 0 && (
              <div className="flex justify-center py-3 md:py-4 border-t border-gray-100">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-4 md:px-6 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-[#7c4dff] hover:bg-[#7c4dff]/10 rounded-lg transition-all disabled:opacity-50"
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

          {/* Pagination - Responsive */}
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
                <span className="px-2 md:px-4 py-1 md:py-2 bg-[#7c4dff]/10 text-[#7c4dff] font-semibold rounded-lg text-xs md:text-sm">
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

      {/* Modals */}
      {viewingOrder && (
        <OrderDetailModal
          order={viewingOrder}
          onClose={() => setViewingOrder(null)}
          onSend={handleSendOrder}
          onApprove={handleApproveOrder}
          onGenerateInvoice={handleGenerateInvoice}
          onCancel={(id: string) => {
            setOrderToActOn(id);
            setShowCancelConfirm(true);
            setViewingOrder(null);
          }}
          onDelete={(id: string) => {
            setOrderToActOn(id);
            setShowDeleteConfirm(true);
            setViewingOrder(null);
          }}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          submitting={submitting}
        />
      )}

      {showCancelConfirm && (
        <ConfirmationModal
          title="Cancel Purchase Order"
          message="Are you sure you want to cancel this purchase order? This action cannot be undone."
          confirmLabel="Cancel Order"
          confirmColor="bg-red-500 hover:bg-red-600"
          onConfirm={handleCancelOrder}
          onCancel={() => {
            setShowCancelConfirm(false);
            setOrderToActOn(null);
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
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none"
              />
            </div>
          }
        />
      )}

      {showDeleteConfirm && (
        <ConfirmationModal
          title="Delete Purchase Order"
          message="Are you sure you want to delete this purchase order? This action cannot be undone."
          confirmLabel="Delete"
          confirmColor="bg-red-500 hover:bg-red-600"
          onConfirm={handleDeleteOrder}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setOrderToActOn(null);
          }}
          loading={submitting}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CREATE ORDER WIZARD
// ═══════════════════════════════════════════════════════════════

function CreateOrderWizard({
  wizardState,
  setWizardState,
  searchSuppliers,
  selectSupplier,
  searchProducts,
  addProductToOrder,
  removeProductFromOrder,
  updateProductField,
  nextStep,
  previousStep,
  handleCreateOrder,
  closeCreateWizard,
  submitting,
  canGoToStep2,
  canGoToStep3,
  selectedSubtotal,
  selectedTotalDiscount,
  selectedTotalTax,
  selectedGrandTotal,
  totalItems,
  formatCurrency
}: any) {
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={closeCreateWizard} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 md:w-6 md:h-6 text-[#7c4dff]" />
            Create Purchase Order
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
            <div className={`flex items-center gap-1 md:gap-2 ${wizardState.step >= step ? 'text-[#7c4dff]' : 'text-gray-300'}`}>
              <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold border-2 ${
                wizardState.step >= step ? 'border-[#7c4dff] bg-[#7c4dff]/10' : 'border-gray-300'
              }`}>
                {step + 1}
              </div>
              <span className="text-[10px] md:text-sm font-medium hidden sm:inline">
                {step === 0 ? 'Supplier' : step === 1 ? 'Items' : 'Details'}
              </span>
            </div>
            {step < 2 && (
              <div className={`flex-1 h-0.5 mx-1 md:mx-2 ${wizardState.step > step ? 'bg-[#7c4dff]' : 'bg-gray-300'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-6">
        {wizardState.step === 0 && (
          <div>
            <h3 className="text-sm md:text-base font-bold text-gray-700 mb-3">Select Supplier</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search supplier..."
                  value={supplierSearchQuery}
                  onChange={(e) => {
                    setSupplierSearchQuery(e.target.value);
                    searchSuppliers(e.target.value);
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none"
                />
              </div>
              <button className="px-4 py-2 bg-[#7c4dff] text-white rounded-lg text-sm font-semibold hover:bg-[#6c3fe0] transition-all whitespace-nowrap">
                + Add Supplier
              </button>
            </div>

            {wizardState.isSearchingSuppliers && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <Loader2 className="w-6 h-6 mx-auto text-[#7c4dff] animate-spin" />
              </div>
            )}

            {wizardState.supplierSearchResults.length > 0 && !wizardState.isSearchingSuppliers && (
              <div className="mt-3 border border-gray-200 rounded-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
                {wizardState.supplierSearchResults.map((supplier: Supplier) => (
                  <button
                    key={supplier.id}
                    onClick={() => selectSupplier(supplier)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-gray-800 text-sm">{supplier.name}</p>
                    <p className="text-xs text-gray-400">{supplier.email || supplier.phone || 'No contact'}</p>
                  </button>
                ))}
              </div>
            )}

            {wizardState.selectedSupplier && (
              <div className="mt-3 p-3 bg-[#7c4dff]/5 border border-[#7c4dff]/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#7c4dff] text-sm">{wizardState.selectedSupplier.name}</p>
                    <p className="text-xs text-gray-500">{wizardState.selectedSupplier.email}</p>
                    <p className="text-xs text-gray-500">{wizardState.selectedSupplier.phone}</p>
                  </div>
                  <button
                    onClick={() => setWizardState((prev: WizardState) => ({ ...prev, selectedSupplier: null }))}
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
            <h3 className="text-sm md:text-base font-bold text-gray-700 mb-3">Add Items</h3>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearchQuery}
                  onChange={(e) => {
                    setProductSearchQuery(e.target.value);
                    searchProducts(e.target.value);
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none"
                />
              </div>
            </div>

            {wizardState.isSearchingProducts && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <Loader2 className="w-6 h-6 mx-auto text-[#7c4dff] animate-spin" />
              </div>
            )}

            {wizardState.productSearchResults.length > 0 && !wizardState.isSearchingProducts && (
              <div className="mt-3 border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                {wizardState.productSearchResults.map((product: Product) => (
                  <button
                    key={product.id}
                    onClick={() => addProductToOrder(product)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{product.name}</p>
                      <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-700">{formatCurrency(product.costPrice || 0)}</p>
                      <Plus className="w-4 h-4 text-[#7c4dff] ml-auto" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Line Items */}
            {wizardState.lineDrafts.length > 0 ? (
              <div className="mt-4 space-y-3">
                {wizardState.lineDrafts.map((line: PurchaseOrderLineDraft, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">{line.productName}</p>
                        <p className="text-xs text-gray-400">SKU: {line.sku}</p>
                      </div>
                      <button
                        onClick={() => removeProductFromOrder(index)}
                        className="p-1 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                      <div>
                        <label className="text-[10px] text-gray-500">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => updateProductField(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500">Unit Price</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.unitPrice}
                          onChange={(e) => updateProductField(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500">Disc %</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={line.discount}
                          onChange={(e) => updateProductField(index, 'discount', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500">Tax %</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={line.taxRate}
                          onChange={(e) => updateProductField(index, 'taxRate', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none"
                        />
                      </div>
                    </div>
                    <div className="text-right mt-2">
                      <p className="text-sm font-semibold text-[#7c4dff]">Line Total: {formatCurrency(line.lineTotal)}</p>
                    </div>
                  </div>
                ))}

                {/* Summary */}
                <div className="p-3 bg-[#7c4dff]/5 border border-[#7c4dff]/20 rounded-lg">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-medium">{formatCurrency(selectedSubtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Discount</span>
                      <span className="font-medium text-red-600">-{formatCurrency(selectedTotalDiscount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tax</span>
                      <span className="font-medium text-blue-600">{formatCurrency(selectedTotalTax)}</span>
                    </div>
                    <hr className="border-gray-200" />
                    <div className="flex justify-between font-bold">
                      <span>Grand Total</span>
                      <span className="text-[#7c4dff]">{formatCurrency(selectedGrandTotal)}</span>
                    </div>
                    <div className="text-xs text-gray-400 text-center">
                      {totalItems} items
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                <Package className="w-8 h-8 mx-auto text-gray-300" />
                <p className="mt-2 text-sm text-gray-400">No items added yet</p>
                <p className="text-xs text-gray-300">Search and add products above</p>
              </div>
            )}
          </div>
        )}

        {wizardState.step === 2 && (
          <div>
            <h3 className="text-sm md:text-base font-bold text-gray-700 mb-3">Order Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Order Date *</label>
                <input
                  type="date"
                  value={wizardState.orderDate}
                  onChange={(e) => setWizardState((prev: WizardState) => ({ ...prev, orderDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expected Delivery</label>
                <input
                  type="date"
                  value={wizardState.expectedDeliveryDate}
                  onChange={(e) => setWizardState((prev: WizardState) => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
              <textarea
                rows={2}
                placeholder="Additional notes..."
                value={wizardState.notes}
                onChange={(e) => setWizardState((prev: WizardState) => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none resize-none"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Terms & Conditions</label>
              <textarea
                rows={2}
                placeholder="Terms and conditions..."
                value={wizardState.termsConditions}
                onChange={(e) => setWizardState((prev: WizardState) => ({ ...prev, termsConditions: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7c4dff] focus:border-transparent outline-none resize-none"
              />
            </div>

            {/* Summary */}
            <div className="mt-4 p-4 bg-[#7c4dff]/5 border border-[#7c4dff]/20 rounded-lg">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Supplier</span>
                  <span className="font-medium">{wizardState.selectedSupplier?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Items</span>
                  <span className="font-medium">{totalItems} items</span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between font-bold">
                  <span>Grand Total</span>
                  <span className="text-[#7c4dff]">{formatCurrency(selectedGrandTotal)}</span>
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
              className="px-5 md:px-7 py-2 md:py-2.5 bg-[#7c4dff] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#6c3fe0] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleCreateOrder}
              disabled={submitting}
              className="px-5 md:px-7 py-2 md:py-2.5 bg-[#7c4dff] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#6c3fe0] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Create Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ORDER DETAIL MODAL
// ═══════════════════════════════════════════════════════════════

function OrderDetailModal({
  order,
  onClose,
  onSend,
  onApprove,
  onGenerateInvoice,
  onCancel,
  onDelete,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusIcon,
  submitting
}: any) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 bg-gradient-to-r from-[#7c4dff]/5 to-transparent">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#7c4dff]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Receipt className="w-5 h-5 md:w-6 md:h-6 text-[#7c4dff]" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">{order.orderNumber}</h2>
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                <span className={`text-[10px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-1 md:gap-1.5 ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  {order.status}
                </span>
                <span className="text-[10px] md:text-xs text-gray-400">•</span>
                <span className="text-[10px] md:text-xs text-gray-500">{formatDate(order.orderDate)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0">
            <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Supplier & Order Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
            <div>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Supplier</p>
              <p className="text-sm md:text-base font-semibold text-gray-800 mt-1 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                {order.supplierName}
              </p>
              {order.supplierEmail && (
                <p className="text-xs md:text-sm text-gray-600 flex items-center gap-2 mt-0.5">
                  <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                  {order.supplierEmail}
                </p>
              )}
              {order.supplierPhone && (
                <p className="text-xs md:text-sm text-gray-600 flex items-center gap-2 mt-0.5">
                  <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                  {order.supplierPhone}
                </p>
              )}
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Order Details</p>
              <p className="text-sm md:text-base font-semibold text-gray-800 mt-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                {formatDate(order.orderDate)}
              </p>
              {order.expectedDeliveryDate && (
                <p className="text-xs md:text-sm text-gray-600 flex items-center gap-2 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                  Expected: {formatDate(order.expectedDeliveryDate)}
                </p>
              )}
              <p className="text-sm md:text-base font-semibold text-gray-800 mt-1 flex items-center gap-2">
                <Package className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                {order.totalItems || 0} items
              </p>
            </div>
          </div>

          {order.notes && (
            <div className="mb-3 md:mb-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Notes</p>
              <p className="text-sm md:text-base text-gray-600 mt-0.5 md:mt-1">{order.notes}</p>
            </div>
          )}

          {order.termsConditions && (
            <div className="mb-3 md:mb-4">
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Terms & Conditions</p>
              <p className="text-sm md:text-base text-gray-600 mt-0.5 md:mt-1">{order.termsConditions}</p>
            </div>
          )}

          {/* Items */}
          <div className="border-t border-gray-100 pt-3 md:pt-4 mt-3 md:mt-4">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <h4 className="text-sm md:text-base font-bold text-gray-700">Items</h4>
              <span className="text-[10px] md:text-xs text-gray-400">{order.totalItems || 0} items</span>
            </div>
            <div className="space-y-2 max-h-48 md:max-h-64 overflow-y-auto">
              {order.items?.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-1.5 md:py-2 border-b border-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                    <p className="text-[10px] md:text-xs text-gray-400">
                      SKU: {item.sku} • Qty: {item.quantity}
                      {item.discount > 0 && ` • Disc: ${item.discount}%`}
                      {item.taxRate > 0 && ` • Tax: ${item.taxRate}%`}
                    </p>
                  </div>
                  <p className="text-xs md:text-sm font-semibold text-[#7c4dff] ml-2">{formatCurrency(item.lineTotal)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-100 pt-3 md:pt-4 mt-3 md:mt-4">
            <div className="space-y-1 md:space-y-2 text-sm md:text-base">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.totalDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Discount</span>
                  <span className="font-medium text-red-600">-{formatCurrency(order.totalDiscount)}</span>
                </div>
              )}
              {order.totalTax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span className="font-medium text-blue-600">{formatCurrency(order.totalTax)}</span>
                </div>
              )}
              <hr className="border-gray-200" />
              <div className="flex justify-between font-bold text-base md:text-lg">
                <span>Grand Total</span>
                <span className="text-[#7c4dff]">{formatCurrency(order.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-100 pt-3 md:pt-4 mt-3 md:mt-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onGenerateInvoice(order)}
                className="flex-1 min-w-[100px] px-3 md:px-4 py-2 md:py-2.5 bg-purple-500 text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-purple-600 transition-all flex items-center justify-center gap-1.5 md:gap-2"
              >
                <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Download Invoice
              </button>
              <button
                onClick={() => onSend(order.id)}
                disabled={submitting}
                className="flex-1 min-w-[100px] px-3 md:px-4 py-2 md:py-2.5 bg-blue-500 text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 md:gap-2"
              >
                <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Send Email
              </button>
              {order.canApprove && (
                <button
                  onClick={() => onApprove(order.id)}
                  disabled={submitting}
                  className="flex-1 min-w-[100px] px-3 md:px-4 py-2 md:py-2.5 bg-green-500 text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-green-600 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 md:gap-2"
                >
                  <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Approve
                </button>
              )}
              {order.canCancel && (
                <button
                  onClick={() => onCancel(order.id)}
                  disabled={submitting}
                  className="flex-1 min-w-[100px] px-3 md:px-4 py-2 md:py-2.5 bg-red-500 text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 md:gap-2"
                >
                  <Ban className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Cancel
                </button>
              )}
              {order.canDelete && (
                <button
                  onClick={() => onDelete(order.id)}
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