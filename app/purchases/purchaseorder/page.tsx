'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Plus, Eye, Receipt, Users,
  ChevronDown, ChevronLeft, ChevronRight, Loader2,
  X, AlertCircle, CheckCircle, Clock, Info,
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
import { findProductFromScan, useHardwareBarcodeScanner } from '@/lib/use-hardware-scanner';
import { matchScannedProduct } from '@/lib/pos-scanner';
import PDFService from '../../../lib/pdf-service';
import EmailService from '../../../lib/email-service';
import TaxRateSelect from '../../../components/TaxRateSelect';
import { useLocation } from '@/lib/location-context';
import { SupplierDetailCard, ProductDetailCard } from '../../components/purchases/EnterpriseDetailCards';

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
  qtyInput?: string;
  unitPriceInput?: string;
  discountInput?: string;
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function resolveProductUnitPrice(product: Product | Record<string, unknown>): number {
  const p = product as Record<string, unknown>;
  for (const key of ['costPrice', 'landingCost', 'purchasePrice', 'unitPrice', 'sellingPrice']) {
    const n = toNumber(p[key]);
    if (n > 0) return n;
  }
  return 0;
}

function recalcLine(line: PurchaseOrderLineDraft): PurchaseOrderLineDraft {
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
    lineTotal,
  };
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

export function PurchaseOrdersPage() {
  const { selectedLocationId } = useLocation();
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
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrderModel | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [orderToActOn, setOrderToActOn] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

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
        toDate: toDate || undefined,
        locationId: selectedLocationId || undefined,
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
  }, [searchTerm, statusFilter, fromDate, toDate, pagination.page, pagination.limit, selectedLocationId]);

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
        toDate: toDate || undefined,
        locationId: selectedLocationId || undefined,
      });

      setOrders(prev => [...prev, ...(response.data || [])]);
      setFilteredOrders(prev => [...prev, ...(response.data || [])]);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load more orders:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [pagination.hasNext, pagination.page, pagination.limit, searchTerm, statusFilter, fromDate, toDate, selectedLocationId]);

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

  useEffect(() => {
    fetchOrders(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocationId]);

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

  const openCreateWizard = () => {
    setEditingOrderId(null);
    resetWizard();
    setShowCreateWizard(true);
  };

  const openEditOrder = (order: PurchaseOrderModel) => {
    if (!['Draft', 'Sent'].includes(order.status)) {
      alert('Only Draft or Sent purchase orders can be edited');
      return;
    }
    setEditingOrderId(order.id);
    setViewingOrder(null);
    setWizardState({
      step: 0,
      selectedSupplier: {
        id: order.supplierId,
        name: order.supplierName,
        email: order.supplierEmail,
        phone: order.supplierPhone,
        address: order.supplierAddress,
        isActive: true,
      },
      supplierSearchResults: [],
      isSearchingSuppliers: false,
      lineDrafts: (order.items || []).map((item) => {
        const subtotal = item.quantity * item.unitPrice;
        const discountAmount = subtotal * ((item.discount || 0) / 100);
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = taxableAmount * ((item.taxRate || 0) / 100);
        return {
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          taxRate: item.taxRate || 0,
          subtotal,
          discountAmount,
          taxableAmount,
          taxAmount,
          lineTotal: taxableAmount + taxAmount,
        };
      }),
      productSearchResults: [],
      isSearchingProducts: false,
      orderDate: order.orderDate?.slice(0, 10) || new Date().toISOString().split('T')[0],
      expectedDeliveryDate: order.expectedDeliveryDate?.slice(0, 10) || '',
      notes: order.notes || '',
      termsConditions: order.termsConditions || '',
    });
    setShowCreateWizard(true);
  };

  const closeCreateWizard = () => {
    setShowCreateWizard(false);
    setEditingOrderId(null);
    resetWizard();
  };

  const resetWizard = () => {
    setEditingOrderId(null);
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
    const id = String(supplier.id || (supplier as any)._id || '');
    setWizardState(prev => ({
      ...prev,
      selectedSupplier: { ...supplier, id },
      supplierSearchResults: []
    }));
  };

  const searchProducts = async (query: string) => {
    if (query.trim().length < 2) {
      setWizardState(prev => ({ ...prev, productSearchResults: [] }));
      return [] as Product[];
    }
    setWizardState(prev => ({ ...prev, isSearchingProducts: true }));
    try {
      const results = await purchaseOrderService.searchProducts(
        query,
        10,
        selectedLocationId || undefined
      );
      setWizardState(prev => ({ ...prev, productSearchResults: results }));
      return results;
    } catch (error) {
      console.error('Failed to search products:', error);
      setWizardState(prev => ({ ...prev, productSearchResults: [] }));
      return [] as Product[];
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
        const qty = existing.quantity + 1;
        newDrafts[existingIndex] = recalcLine({
          ...existing,
          quantity: qty,
          qtyInput: existing.qtyInput !== undefined ? existing.qtyInput : String(qty),
        });
      } else {
        const unitPrice = resolveProductUnitPrice(product);
        const newLine: PurchaseOrderLineDraft = {
          productId: product.id,
          productName: product.name,
          sku: product.sku || '',
          quantity: 1,
          unitPrice,
          discount: 0,
          taxRate: product.taxRate || 0,
          subtotal: 0,
          discountAmount: 0,
          taxableAmount: 0,
          taxAmount: 0,
          lineTotal: 0,
          qtyInput: '1',
          unitPriceInput: unitPrice > 0 ? String(unitPrice) : '',
          discountInput: '0',
        };
        newDrafts.push(newLine);
      }

      // Recalculate line totals
      newDrafts = newDrafts.map(recalcLine);

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

  const setLineInput = (
    index: number,
    inputField: 'qtyInput' | 'unitPriceInput' | 'discountInput',
    raw: string,
  ) => {
    setWizardState(prev => {
      const newDrafts = [...prev.lineDrafts];
      const line = { ...newDrafts[index], [inputField]: raw };

      if (raw !== '' && raw !== '.') {
        const num = parseFloat(raw);
        if (Number.isFinite(num)) {
          if (inputField === 'qtyInput' && num > 0) line.quantity = num;
          else if (inputField === 'unitPriceInput' && num >= 0) line.unitPrice = num;
          else if (inputField === 'discountInput' && num >= 0 && num <= 100) line.discount = num;
        }
      }

      newDrafts[index] = recalcLine(line);
      return { ...prev, lineDrafts: newDrafts };
    });
  };

  const commitLineInput = (
    index: number,
    inputField: 'qtyInput' | 'unitPriceInput' | 'discountInput',
  ) => {
    setWizardState(prev => {
      const newDrafts = [...prev.lineDrafts];
      const line = { ...newDrafts[index] };
      const raw = line[inputField];
      let num = parseFloat(raw ?? '');

      if (inputField === 'qtyInput') {
        if (!Number.isFinite(num) || num <= 0) num = 1;
        line.quantity = num;
        line.qtyInput = undefined;
      } else if (inputField === 'unitPriceInput') {
        if (!Number.isFinite(num) || num < 0) num = 0;
        line.unitPrice = num;
        line.unitPriceInput = undefined;
      } else {
        if (!Number.isFinite(num) || num < 0) num = 0;
        if (num > 100) num = 100;
        line.discount = num;
        line.discountInput = undefined;
      }

      newDrafts[index] = recalcLine(line);
      return { ...prev, lineDrafts: newDrafts };
    });
  };

  const updateProductField = (index: number, field: keyof PurchaseOrderLineDraft, value: any) => {
    if (field === 'taxRate') {
      setWizardState(prev => {
        const newDrafts = [...prev.lineDrafts];
        const line = { ...newDrafts[index], taxRate: value };
        newDrafts[index] = recalcLine(line);
        return { ...prev, lineDrafts: newDrafts };
      });
    }
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

      const supplierId =
        wizardState.selectedSupplier.id ||
        (wizardState.selectedSupplier as any)._id;
      if (!supplierId) {
        alert('Invalid supplier selected. Please search and pick again.');
        return;
      }

      const payload = {
        supplierId: String(supplierId),
        supplierName: wizardState.selectedSupplier.name,
        supplierEmail: wizardState.selectedSupplier.email || '',
        supplierPhone: wizardState.selectedSupplier.phone || '',
        supplierAddress: wizardState.selectedSupplier.address || '',
        orderDate: wizardState.orderDate,
        expectedDeliveryDate: wizardState.expectedDeliveryDate,
        items,
        notes: wizardState.notes || undefined,
        termsConditions: wizardState.termsConditions || undefined,
        status: 'Draft' as const,
        locationId: selectedLocationId || undefined,
      };

      if (editingOrderId) {
        await purchaseOrderService.updateOrder(editingOrderId, payload);
      } else {
        await purchaseOrderService.createOrder(payload);
      }

      closeCreateWizard();
      fetchOrders(true);
    } catch (error: any) {
      console.error('Failed to create order:', error);
      alert(error.message || 'Failed to create purchase order');
    } finally {
      setSubmitting(false);
    }
  };


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

      await EmailService.sendPurchaseOrderEmail(order, undefined, companyInfo);
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
      const companyInfo = {
        name: userProfile?.organizationName || 'Your Company Name',
        address: userProfile?.address || '',
        phone: userProfile?.contactNo || userProfile?.phone || '',
        email: userProfile?.email || ''
      };
      const pdfBlob = await PDFService.generatePurchaseOrderPDFBlob(order, companyInfo);

      await EmailService.sendPurchaseOrderEmail(order, pdfBlob, companyInfo);

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
        resolve(base64String.split(',')[1]);
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

  const handleGenerateInvoice = async (order: PurchaseOrderModel) => {
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

    await PDFService.downloadPurchaseOrderPDF(order, companyInfo);
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


  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return 'Rs. 0.00';
    return `Rs. ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

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
          setLineInput={setLineInput}
          commitLineInput={commitLineInput}
          updateProductField={updateProductField}
          nextStep={nextStep}
          previousStep={previousStep}
          handleCreateOrder={handleCreateOrder}
          closeCreateWizard={closeCreateWizard}
          submitting={submitting}
          isEditing={!!editingOrderId}
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
                <Receipt className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
                Purchase Orders
                <span className="text-xs md:text-sm font-normal text-gray-400 ml-1 md:ml-2">
                  ({pagination.total} orders)
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

          {/* Status Quick Filters - Responsive */}
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {['all', 'Draft', 'Sent', 'Approved', 'Cancelled'].map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-semibold transition-all ${selectedFilter === filter
                  ? 'bg-[#014582] text-white'
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
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">GRN</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && orders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 md:py-12">
                        <Loader2 className="w-6 h-6 md:w-8 md:h-8 mx-auto text-[#014582] animate-spin" />
                        <p className="mt-2 text-xs md:text-sm text-gray-500">Loading purchase orders...</p>
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 md:py-12 text-gray-400">
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
                            <p className="font-medium text-[#014582] text-xs md:text-sm">{order.orderNumber}</p>
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
                          <div className="min-w-[88px]">
                            <p className="text-xs md:text-sm font-semibold text-gray-800">
                              {order.totalReceivedQty ?? 0}/{order.totalOrderedQty ?? order.totalItems ?? 0}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {order.totalRemainingQty ?? 0} remaining
                            </p>
                            {(order.receivingProgress ?? 0) > 0 && (
                              <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[#014582]"
                                  style={{ width: `${Math.min(100, (order.receivingProgress || 0) * 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3 hidden lg:table-cell">
                          <p className="text-xs md:text-sm text-gray-600">{formatDate(order.orderDate)}</p>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <span className={`text-[8px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full w-fit ${getStatusColor(order.status)}`}>
                            {order.status}
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

      {/* Modals */}
      {viewingOrder && (
        <OrderDetailModal
          order={viewingOrder}
          onClose={() => setViewingOrder(null)}
          onSend={handleSendOrder}
          onApprove={handleApproveOrder}
          onEdit={openEditOrder}
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
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
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
// SUPPLIER SELECTOR STEP (PAGINATED & SEARCHABLE)
// ═══════════════════════════════════════════════════════════════

function SupplierSelectorStep({
  selectedSupplier,
  onSelectSupplier,
  onClearSupplier,
  onNext,
}: {
  selectedSupplier: Supplier | null;
  onSelectSupplier: (supplier: Supplier) => void;
  onClearSupplier: () => void;
  onNext: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    total: 0,
    pages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);

  const loadSuppliers = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const res = await purchaseOrderService.getSuppliersPaginated({
        page: p,
        limit,
        search: q,
      });
      setSuppliers(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSuppliers(page, searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, page, loadSuppliers]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
        <div>
          <h3 className="text-base md:text-lg font-bold text-gray-800">Select Supplier</h3>
          <p className="text-xs text-gray-500">
            Browse available suppliers or search to select for this Purchase Order.
          </p>
        </div>
        <Link
          href="/purchases/suppliers"
          target="_blank"
          className="px-3.5 py-1.5 bg-[#014582]/10 text-[#014582] hover:bg-[#014582] hover:text-white rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Supplier</span>
        </Link>
      </div>

      {/* Selected Supplier Banner */}
      {selectedSupplier && (
        <div className="p-3.5 bg-blue-50/80 border border-[#014582]/30 rounded-xl flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#014582] text-white flex items-center justify-center font-bold text-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#014582] bg-blue-100 px-2 py-0.5 rounded-md">
                  Selected Supplier
                </span>
                {selectedSupplier.id && (
                  <span className="text-xs text-gray-500 font-medium">#{selectedSupplier.id}</span>
                )}
              </div>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedSupplier.name}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 mt-0.5">
                {selectedSupplier.phone && <span>📞 {selectedSupplier.phone}</span>}
                {selectedSupplier.email && <span>✉️ {selectedSupplier.email}</span>}
                {selectedSupplier.contactPerson && <span>👤 {selectedSupplier.contactPerson}</span>}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearSupplier}
            className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-lg transition-all flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Change</span>
          </button>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search supplier by name, company, email, phone, city..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Suppliers Grid / List */}
      {loading ? (
        <div className="py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-500">
          <Loader2 className="w-7 h-7 text-[#014582] animate-spin mb-2" />
          <p className="text-xs font-medium">Fetching suppliers...</p>
        </div>
      ) : suppliers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
          {suppliers.map((supplier) => {
            const isSelected = selectedSupplier?.id === supplier.id;
            return (
              <div
                key={supplier.id}
                onClick={() => onSelectSupplier(supplier)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${isSelected
                  ? 'border-[#014582] bg-blue-50/60 ring-2 ring-[#014582]/20 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-[#014582]/40 hover:bg-gray-50/80 shadow-xs'
                  }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-[#014582] text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        {supplier.name}
                      </h4>
                      {supplier.companyName && supplier.companyName !== supplier.name && (
                        <p className="text-xs text-gray-500">{supplier.companyName}</p>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#014582] bg-blue-100 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Selected
                    </span>
                  )}
                </div>

                {/* Details chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] text-gray-600">
                  {supplier.contactPerson && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-md">
                      👤 {supplier.contactPerson}
                    </span>
                  )}
                  {supplier.phone && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-md">
                      📞 {supplier.phone}
                    </span>
                  )}
                  {supplier.email && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-md">
                      ✉️ {supplier.email}
                    </span>
                  )}
                  {(supplier.city || supplier.country) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-md">
                      📍 {[supplier.city, supplier.country].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-10 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-500">
          <Building2 className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm font-semibold text-gray-700">No suppliers found</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {searchQuery
              ? `No matching supplier found for "${searchQuery}".`
              : 'There are no active suppliers available.'}
          </p>
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && pagination.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
          <div>
            Showing <span className="font-semibold text-gray-800">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
            <span className="font-semibold text-gray-800">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-semibold text-gray-800">{pagination.total}</span> suppliers
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={!pagination.hasPrev || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg font-medium">
              Page {pagination.page} of {pagination.pages || 1}
            </span>
            <button
              type="button"
              disabled={!pagination.hasNext || loading}
              onClick={() => setPage((p) => p + 1)}
              className="px-2.5 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Action Footer Button */}
      <div className="pt-3 border-t border-gray-100 flex justify-end">
        <button
          type="button"
          disabled={!selectedSupplier}
          onClick={onNext}
          className="px-5 py-2 bg-[#014582] text-white rounded-xl text-xs md:text-sm font-semibold hover:bg-[#01366a] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md shadow-[#014582]/20"
        >
          <span>Continue to Add Items</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PRODUCT SELECTOR STEP (PAGINATED, SEARCHABLE & TABLE LAYOUT)
// ═══════════════════════════════════════════════════════════════

function ProductSelectorStep({
  lineDrafts,
  addProductToOrder,
  removeProductFromOrder,
  searchProducts,
  formatCurrency,
  selectedLocationId,
  previousStep,
  nextStep,
  canGoToStep3,
  totalItems,
}: {
  lineDrafts: PurchaseOrderLineDraft[];
  addProductToOrder: (product: Product) => void;
  removeProductFromOrder: (index: number) => void;
  searchProducts: (query: string) => Promise<Product[]>;
  formatCurrency: (amount: number | null | undefined) => string;
  selectedLocationId?: string;
  previousStep: () => void;
  nextStep: () => void;
  canGoToStep3: boolean;
  totalItems: number;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    total: 0,
    pages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [scanMessage, setScanMessage] = useState('');

  const toggleProductSelection = (product: Product) => {
    const existingIndex = lineDrafts.findIndex((d) => d.productId === product.id);
    if (existingIndex !== -1) {
      removeProductFromOrder(existingIndex);
    } else {
      addProductToOrder(product);
    }
  };

  // Hardware barcode scanner listener
  useHardwareBarcodeScanner((code) => {
    void (async () => {
      const results = await searchProducts(code);
      const match = matchScannedProduct(results || [], code) || results?.[0];
      if (match) {
        addProductToOrder(match);
        setScanMessage(`Added ${match.name}`);
        return;
      }
      const found = await findProductFromScan(code, undefined);
      if (found) {
        addProductToOrder(found as Product);
        setScanMessage(`Added ${found.name}`);
        return;
      }
      setScanMessage(`No product found for barcode: ${code}`);
    })();
  }, true);

  const loadProducts = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const res = await purchaseOrderService.getProductsPaginated({
        page: p,
        limit,
        search: q,
        locationId: selectedLocationId,
      });
      setProducts(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [limit, selectedLocationId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts(page, searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, page, loadProducts]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setPage(1);
  };

  const getProductLineQty = (productId: string) => {
    const line = lineDrafts.find((d) => d.productId === productId);
    return line ? line.quantity : 0;
  };

  return (
    <div className="space-y-5">
      {/* Step Header & Search/Scanner Bar */}
      <div className="space-y-3 pb-3 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base md:text-lg font-bold text-gray-800">Add Order Items</h3>
            <p className="text-xs text-gray-500">
              Browse product catalog below or search by name, SKU, or scan barcode.
            </p>
          </div>
          {lineDrafts.length > 0 && (
            <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold self-start sm:self-auto flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{lineDrafts.length} item(s) selected ({totalItems} pcs)</span>
            </span>
          )}
        </div>

        {/* Search input + scanner status */}
        <div className="flex flex-col gap-1.5">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search product by name, SKU, category, or scan barcode..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {scanMessage ? (
            <p className="text-xs font-semibold text-[#014582] flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> {scanMessage}
            </p>
          ) : (
            <p className="text-[11px] text-gray-400">
              💡 USB barcode scanner active — scan product barcode anytime to auto-add.
            </p>
          )}
        </div>
      </div>

      {/* Available Products Table (Product Page Style with Selection Tick) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-[#014582]" />
            <span>Product Catalog</span>
          </h4>
          {!loading && pagination.total > 0 && (
            <span className="text-xs text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
            </span>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto max-h-[300px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                <tr>
                  <th className="px-3.5 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                    Select
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                    Category
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Cost / Price
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-500">
                      <Loader2 className="w-6 h-6 mx-auto text-[#014582] animate-spin mb-1" />
                      <p className="text-xs font-medium">Fetching products catalog...</p>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm font-semibold text-gray-600">No products found</p>
                      <p className="text-xs text-gray-400">
                        {searchQuery ? `No matching products for "${searchQuery}"` : 'No active products available.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const lineQty = getProductLineQty(product.id);
                    const isSelected = lineQty > 0;
                    return (
                      <tr
                        key={product.id}
                        onClick={() => toggleProductSelection(product)}
                        className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/30' : ''
                          }`}
                      >
                        {/* Select Tick Button */}
                        <td className="px-3.5 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleProductSelection(product)}
                            title={isSelected ? `${lineQty} added. Click to deselect.` : 'Click to select product'}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${isSelected
                                ? 'bg-[#014582] text-white ring-2 ring-[#014582]/30 shadow-xs'
                                : 'border border-gray-300 text-gray-300 hover:border-[#014582] hover:text-[#014582] bg-white'
                              }`}
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </button>
                        </td>

                        {/* SKU */}
                        <td className="px-4 py-2.5 font-mono text-xs font-semibold text-gray-700 whitespace-nowrap">
                          {product.sku || '-'}
                        </td>

                        {/* Name & Category */}
                        <td className="px-4 py-2.5">
                          <div className="font-semibold text-gray-900 text-sm">{product.name}</div>
                          {product.category && (
                            <span className="text-[10px] text-gray-500 md:hidden block">{product.category}</span>
                          )}
                        </td>

                        {/* Category */}
                        <td className="px-4 py-2.5 text-xs text-gray-600 hidden md:table-cell">
                          {product.category || '-'}
                        </td>

                        {/* Cost Price / Selling Price */}
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="font-semibold text-gray-900 text-xs">
                            Cost: {formatCurrency(product.costPrice)}
                          </div>
                          {product.sellingPrice > 0 && (
                            <div className="text-[10px] text-gray-400">
                              Sell: {formatCurrency(product.sellingPrice)}
                            </div>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="px-4 py-2.5 text-center whitespace-nowrap">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${product.currentStock <= 0
                                ? 'bg-red-100 text-red-700'
                                : product.currentStock <= 5
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                          >
                            {product.currentStock} {product.stockUnitName || 'pcs'}
                          </span>
                        </td>

                        {/* Action Add / Deselect Button */}
                        <td className="px-4 py-2.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {isSelected ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => addProductToOrder(product)}
                                className="px-2.5 py-1 text-xs font-semibold bg-[#014582] text-white hover:bg-[#01366a] rounded-lg transition-all inline-flex items-center gap-1"
                                title="Add 1 more unit"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>({lineQty})</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleProductSelection(product)}
                                className="px-2 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all"
                                title="Deselect item"
                              >
                                Deselect
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => addProductToOrder(product)}
                              className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-[#014582] hover:text-white rounded-lg transition-all inline-flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Select</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Product List Pagination */}
          {!loading && pagination.total > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
              <div>
                Page <span className="font-semibold text-gray-800">{pagination.page}</span> of{' '}
                <span className="font-semibold text-gray-800">{pagination.pages || 1}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={!pagination.hasPrev || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 border border-gray-200 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <button
                  type="button"
                  disabled={!pagination.hasNext || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2.5 py-1 border border-gray-200 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Items Hint (line-level editing happens in the Order Details step) */}
      <div className="pt-3 border-t border-gray-200">
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start gap-2 ${lineDrafts.length > 0
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-gray-50/60 border-dashed border-gray-200 text-gray-500'
            }`}
        >
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            {lineDrafts.length > 0 ? (
              <>
                <p className="font-semibold">
                  {lineDrafts.length} item(s) selected ({totalItems} pcs)
                </p>
                <p className="text-[11px] text-green-700">
                  Quantity, unit price, discount and tax rate for each line are edited in the next step
                  (Order Details).
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-gray-600">No items added to order yet.</p>
                <p className="text-[11px] text-gray-400">
                  Click the tick button or select any product above to add it to the order.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Step Navigation Actions */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
        <button
          type="button"
          onClick={previousStep}
          className="px-4 py-2 border border-gray-200 rounded-xl text-xs md:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Supplier</span>
        </button>

        <button
          type="button"
          disabled={!canGoToStep3}
          onClick={nextStep}
          className="px-5 py-2 bg-[#014582] text-white rounded-xl text-xs md:text-sm font-semibold hover:bg-[#01366a] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md shadow-[#014582]/20"
        >
          <span>Continue to Order Details</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SELECTED ORDER LINES SECTION
// Rendered inside the "Order Details" step so quantities, prices,
// discounts and taxes are finalised on the details screen itself.
// ═══════════════════════════════════════════════════════════════

function SelectedOrderLinesSection({
  lineDrafts,
  removeProductFromOrder,
  setLineInput,
  commitLineInput,
  updateProductField,
  formatCurrency,
  selectedSubtotal,
  selectedTotalDiscount,
  selectedTotalTax,
  selectedGrandTotal,
}: {
  lineDrafts: PurchaseOrderLineDraft[];
  removeProductFromOrder: (index: number) => void;
  setLineInput: (index: number, field: string, value: string) => void;
  commitLineInput: (index: number, field: string) => void;
  updateProductField: (index: number, field: string, value: number) => void;
  formatCurrency: (amount: number | null | undefined) => string;
  selectedSubtotal: number;
  selectedTotalDiscount: number;
  selectedTotalTax: number;
  selectedGrandTotal: number;
}) {
  return (
    <>
      {/* Selected Items in Order (Detailed Editor) */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4 text-[#014582]" />
            <span>Selected Items in Order ({lineDrafts.length})</span>
          </h4>
        </div>

        {lineDrafts.length === 0 ? (
          <div className="p-5 bg-gray-50/60 rounded-xl border border-dashed border-gray-200 text-center text-gray-400">
            <p className="text-xs font-medium text-gray-500">No items added to order yet.</p>
            <p className="text-[11px] text-gray-400">Go back to the Items step and select products to add.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {lineDrafts.map((line, index) => (
              <div key={index} className="border border-gray-200 bg-white rounded-xl p-3.5 shadow-xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#014582]/10 text-[#014582] font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{line.productName}</p>
                      {line.sku && <p className="text-xs text-gray-500 font-mono">SKU: {line.sku}</p>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProductFromOrder(index)}
                    className="px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-all flex items-center gap-1 border border-transparent hover:border-red-200"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>

                {/* Line Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1 border-t border-gray-100">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Quantity</label>
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#014582]">
                      <button
                        type="button"
                        onClick={() => {
                          const newQty = Math.max(1, line.quantity - 1);
                          updateProductField(index, 'quantity', newQty);
                          setLineInput(index, 'qtyInput', String(newQty));
                        }}
                        className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold border-r border-gray-200"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={line.qtyInput ?? String(line.quantity)}
                        onChange={(e) => setLineInput(index, 'qtyInput', e.target.value)}
                        onBlur={() => commitLineInput(index, 'qtyInput')}
                        className="w-full text-center py-1 text-sm font-semibold focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newQty = line.quantity + 1;
                          updateProductField(index, 'quantity', newQty);
                          setLineInput(index, 'qtyInput', String(newQty));
                        }}
                        className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold border-l border-gray-200"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Unit Price (Rs)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={line.unitPriceInput ?? String(line.unitPrice)}
                      onChange={(e) => setLineInput(index, 'unitPriceInput', e.target.value)}
                      onBlur={() => commitLineInput(index, 'unitPriceInput')}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={line.discountInput ?? String(line.discount)}
                      onChange={(e) => setLineInput(index, 'discountInput', e.target.value)}
                      onBlur={() => commitLineInput(index, 'discountInput')}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Tax Rate (%)</label>
                    <TaxRateSelect
                      value={line.taxRate}
                      onChange={(rate) => updateProductField(index, 'taxRate', rate)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-white"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Line Total</label>
                    <div className="px-2.5 py-1.5 bg-blue-50/60 rounded-lg text-sm font-bold text-[#014582] border border-blue-100 flex items-center justify-between">
                      <span>{formatCurrency(line.lineTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Order Total Summary Card */}
            <div className="p-3 bg-[#014582]/5 border border-[#014582]/20 rounded-xl">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(selectedSubtotal)}</span>
                </div>
                {selectedTotalDiscount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Discount</span>
                    <span className="font-semibold text-red-600">-{formatCurrency(selectedTotalDiscount)}</span>
                  </div>
                )}
                {selectedTotalTax > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span className="font-semibold text-blue-600">+{formatCurrency(selectedTotalTax)}</span>
                  </div>
                )}
                <div className="pt-1 border-t border-gray-200 flex justify-between text-sm font-bold">
                  <span className="text-gray-900">Grand Total</span>
                  <span className="text-[#014582]">{formatCurrency(selectedGrandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
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
  setLineInput,
  commitLineInput,
  updateProductField,
  nextStep,
  previousStep,
  handleCreateOrder,
  closeCreateWizard,
  submitting,
  isEditing = false,
  canGoToStep2,
  canGoToStep3,
  selectedSubtotal,
  selectedTotalDiscount,
  selectedTotalTax,
  selectedGrandTotal,
  totalItems,
  formatCurrency
}: any) {
  const { selectedLocationId } = useLocation();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={closeCreateWizard} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
            {isEditing ? 'Edit Purchase Order' : 'Create Purchase Order'}
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
              <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold border-2 ${wizardState.step >= step ? 'border-[#014582] bg-[#014582]/10' : 'border-gray-300'
                }`}>
                {step + 1}
              </div>
              <span className="text-[10px] md:text-sm font-medium hidden sm:inline">
                {step === 0 ? 'Supplier' : step === 1 ? 'Items' : 'Details'}
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
          <SupplierSelectorStep
            selectedSupplier={wizardState.selectedSupplier}
            onSelectSupplier={selectSupplier}
            onClearSupplier={() => setWizardState((prev: WizardState) => ({ ...prev, selectedSupplier: null }))}
            onNext={nextStep}
          />
        )}

        {wizardState.step === 1 && (
          <ProductSelectorStep
            lineDrafts={wizardState.lineDrafts}
            addProductToOrder={addProductToOrder}
            removeProductFromOrder={removeProductFromOrder}
            searchProducts={searchProducts}
            formatCurrency={formatCurrency}
            selectedLocationId={selectedLocationId}
            previousStep={previousStep}
            nextStep={nextStep}
            canGoToStep3={canGoToStep3}
            totalItems={totalItems}
          />
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
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expected Delivery</label>
                <input
                  type="date"
                  value={wizardState.expectedDeliveryDate}
                  onChange={(e) => setWizardState((prev: WizardState) => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
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
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none resize-none"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Terms & Conditions</label>
              <textarea
                rows={2}
                placeholder="Terms and conditions..."
                value={wizardState.termsConditions}
                onChange={(e) => setWizardState((prev: WizardState) => ({ ...prev, termsConditions: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none resize-none"
              />
            </div>

            {/* Selected Items in Order (editable quantities, prices, discount & tax) */}
            <div className="mt-5">
              <SelectedOrderLinesSection
                lineDrafts={wizardState.lineDrafts}
                removeProductFromOrder={removeProductFromOrder}
                setLineInput={setLineInput}
                commitLineInput={commitLineInput}
                updateProductField={updateProductField}
                formatCurrency={formatCurrency}
                selectedSubtotal={selectedSubtotal}
                selectedTotalDiscount={selectedTotalDiscount}
                selectedTotalTax={selectedTotalTax}
                selectedGrandTotal={selectedGrandTotal}
              />
            </div>

            {/* Summary */}
            <div className="mt-4 p-4 bg-[#014582]/5 border border-[#014582]/20 rounded-lg">
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
                  <span className="text-[#014582]">{formatCurrency(selectedGrandTotal)}</span>
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
              onClick={handleCreateOrder}
              disabled={submitting}
              className="px-5 md:px-7 py-2 md:py-2.5 bg-[#014582] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#01366a] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#014582]/25 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isEditing ? 'Save Changes' : 'Create Order'}
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
  onEdit,
  onGenerateInvoice,
  onCancel,
  onDelete,
  formatCurrency,
  formatDate,
  getStatusColor,
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
              <h2 className="text-lg md:text-xl font-bold text-gray-900">{order.orderNumber}</h2>
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                <span className={`text-[10px] md:text-xs font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                <span className="text-[10px] md:text-xs text-gray-400">•</span>
                <span className="text-[10px] md:text-xs text-gray-500">{formatDate(order.orderDate)}</span>
                {order.purchaseRequisitionNumber && (
                  <>
                    <span className="text-[10px] md:text-xs text-gray-400">•</span>
                    <span className="text-[10px] md:text-xs text-[#014582]">PR {order.purchaseRequisitionNumber}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0">
            <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="mb-4">
            <SupplierDetailCard
              supplier={{
                name: order.supplierName,
                email: order.supplierEmail,
                phone: order.supplierPhone,
                address: order.supplierAddress,
                ...(order.supplier || {}),
              }}
            />
          </div>

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
              {(order.totalReceivedQty ?? 0) > 0 || (order.receivingStatus && order.receivingStatus !== 'Not Received') ? (
                <p className="text-xs md:text-sm text-[#014582] flex items-center gap-2 mt-0.5">
                  <Truck className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  GRN: {order.totalReceivedQty ?? 0}/{order.totalOrderedQty ?? order.totalItems ?? 0} received
                  · {order.totalRemainingQty ?? 0} remaining
                </p>
              ) : null}
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
                      SKU: {item.sku} · Ordered: {item.quantity}
                      {item.discount > 0 && ` · Disc: ${item.discount}%`}
                      {item.taxRate > 0 && ` · Tax: ${item.taxRate}%`}
                    </p>
                    <p className="text-[10px] md:text-xs mt-0.5">
                      <span className="text-emerald-700 font-medium">
                        Received: {item.receivedQuantity ?? 0}
                      </span>
                      <span className="text-gray-400"> · </span>
                      <span className="text-amber-700 font-medium">
                        Remaining: {item.remainingQuantity ?? Math.max(0, (item.quantity || 0) - (item.receivedQuantity || 0))}
                      </span>
                    </p>
                  </div>
                  <p className="text-xs md:text-sm font-semibold text-[#014582] ml-2">{formatCurrency(item.lineTotal)}</p>
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
                <span className="text-[#014582]">{formatCurrency(order.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-100 pt-3 md:pt-4 mt-3 md:mt-4">
            <div className="flex flex-wrap gap-2">
              {['Draft', 'Sent'].includes(order.status) && onEdit && (
                <button
                  onClick={() => onEdit(order)}
                  className="flex-1 min-w-[100px] px-3 md:px-4 py-2 md:py-2.5 bg-slate-700 text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 md:gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Edit Order
                </button>
              )}
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
export default function ModuleRoutePlaceholder() {
  return null;
}
