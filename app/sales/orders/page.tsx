'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Search, RefreshCw, ShoppingCart, Package, User,
  Truck, DollarSign, Clock, X, ChevronDown,
  Eye, Trash2, CheckCircle, Loader2,
  FileText, CreditCard, Tag, Receipt, AlertCircle,
  Mail, Phone, Building, MapPin, Save, ArrowLeft
} from 'lucide-react';
import { customerService } from '../../api/customer/route';
import { productService } from '../../api/product/route';
import { salesOrderService, type Order as SalesOrder } from '@/lib/sales-order-service';
import { useLocation } from '@/lib/location-context';
import { useCurrency } from '../../../lib/currency-context';
import { findProductFromScan, useHardwareBarcodeScanner } from '@/lib/use-hardware-scanner';
import { matchScannedProduct } from '@/lib/pos-scanner';
import TaxRateSelect from '../../../components/TaxRateSelect';
import {
  computeTaxLine,
  resolveProductTaxRate,
  taxService,
  type TaxContext,
  type TaxPricingModel,
} from '../../../lib/tax-service';

type Order = SalesOrder & {
  totalAmount?: number;
};

interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate?: number;
  taxAmount?: number;
}

interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  customerType: string;
  customerNumber?: string;
  company?: string;
  taxId?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  primaryAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  status?: string;
  loyaltyPoints?: number;
  totalOrders?: number;
  totalSpent?: number;
  averageOrderValue?: number;
  lastOrderDate?: string;
  notes?: string;
  tags?: string[];
  preferences?: any;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Product {
  _id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  currentStock: number;
  taxRate?: number;
  taxType?: string;
}

const normalizeId = (item: any) => ({
  ...item,
  _id:
    typeof item._id === 'object'
      ? (item._id?.$oid ?? JSON.stringify(item._id))
      : String(item._id ?? item.id ?? ''),
  id: String(item.id ?? item._id ?? ''),
});

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  Pending: 'bg-orange-100 text-orange-700',
  Processing: 'bg-blue-100 text-blue-700',
  Packed: 'bg-purple-100 text-purple-700',
  Shipped: 'bg-indigo-100 text-indigo-700',
  'In Transit': 'bg-cyan-100 text-cyan-700',
  'Partially Delivered': 'bg-sky-100 text-sky-700',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
  Returned: 'bg-pink-100 text-pink-700',
  'On Hold': 'bg-yellow-100 text-yellow-700',
};

const PAYMENT_COLORS: Record<string, string> = {
  Pending: 'bg-orange-100 text-orange-700',
  Paid: 'bg-green-100 text-green-700',
  Partial: 'bg-blue-100 text-blue-700',
  Refunded: 'bg-red-100 text-red-700',
  Cancelled: 'bg-gray-100 text-gray-700',
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: 'bg-gray-100 text-gray-700',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-orange-100 text-orange-700',
  Urgent: 'bg-red-100 text-red-700',
};

const pill = (map: Record<string, string>, val: string) =>
  `text-xs font-semibold px-2.5 py-1 rounded-full ${map[val] ?? 'bg-gray-100 text-gray-700'}`;

const STATUS_OPTIONS = ['all', 'Draft', 'Pending', 'Processing', 'Packed', 'Shipped', 'In Transit', 'Partially Delivered', 'Delivered', 'Cancelled', 'Returned', 'On Hold'];
const PAYMENT_OPTIONS = ['all', 'Pending', 'Paid', 'Partial', 'Refunded', 'Cancelled'];
const PRIORITY_OPTIONS = ['all', 'Low', 'Medium', 'High', 'Urgent'];
const CUSTOMER_TYPES = ['Individual', 'Business', 'Wholesale', 'Retail'];
const COUNTRIES = ['Pakistan', 'United States', 'United Kingdom', 'UAE', 'Saudi Arabia', 'India', 'China'];
const ORDER_TYPES = ['Standard', 'Bulk', 'Wholesale', 'Express'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const SOURCES = ['Direct', 'Website', 'Phone', 'Email', 'Referral'];
const SHIPPING_METHODS = ['Standard', 'Express', 'Same Day'];
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Credit Card', 'Online'];

function CustomerPickerModal({
  isOpen,
  onClose,
  onSelect
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: any) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1, limit: 20, total: 0, pages: 1, hasNext: false, hasPrev: false
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLButtonElement | null>(null);

  const loadAllCustomers = useCallback(async (page = 1, append = false) => {
    if (page === 1) setLoading(true); else setLoadingMore(true);
    setError('');
    try {
      const response = await customerService.getCustomers({ page, limit: 20 });
      const list = response.data || response;
      const pag = response.pagination || { page, limit: 20, total: list.length, pages: 1, hasNext: false, hasPrev: false };
      setCustomers(prev => append ? [...prev, ...list] : list);
      setPagination(pag);
    } catch (err: any) {
      setError(err.message || 'Failed to load customers');
      if (!append) setCustomers([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const searchCustomers = useCallback(async (search: string, page = 1, append = false) => {
    if (page === 1) setLoading(true); else setLoadingMore(true);
    setError('');
    try {
      const response = await customerService.searchCustomers(search, 20);
      const list = Array.isArray(response) ? response : [];
      const pag = { page: 1, limit: 20, total: list.length, pages: 1, hasNext: false, hasPrev: false };
      setCustomers(prev => append ? [...prev, ...list] : list);
      setPagination(pag);
    } catch (err: any) {
      setError(err.message || 'Failed to search customers');
      if (!append) setCustomers([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setCustomers([]);
      setError('');
      setPagination({ page: 1, limit: 20, total: 0, pages: 1, hasNext: false, hasPrev: false });
      loadAllCustomers(1, false);
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [isOpen, loadAllCustomers]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (searchTerm.trim().length === 0) {
        loadAllCustomers(1, false);
      } else if (searchTerm.trim().length >= 2) {
        searchCustomers(searchTerm.trim(), 1, false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, isOpen, loadAllCustomers, searchCustomers]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination.hasNext && !loading && !loadingMore) {
          const nextPage = pagination.page + 1;
          if (searchTerm.trim().length >= 2) {
            searchCustomers(searchTerm.trim(), nextPage, true);
          } else {
            loadAllCustomers(nextPage, true);
          }
          setPagination(prev => ({ ...prev, page: nextPage }));
        }
      },
      { threshold: 0.1 }
    );
    if (lastItemRef.current) observerRef.current.observe(lastItemRef.current);
    return () => { if (observerRef.current) observerRef.current.disconnect(); };
  }, [customers, pagination, loading, loadingMore, searchTerm, loadAllCustomers, searchCustomers]);

  const handleSelect = (customer: any) => {
    onSelect(customer);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#014582]" />
            <h3 className="font-bold text-gray-800">Select Customer</h3>
            {pagination.total > 0 && (
              <span className="text-xs text-gray-400 font-normal">({pagination.total} total)</span>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-all">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-4 pt-4 pb-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {loading && !searchTerm && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#014582] animate-spin" />
            )}
          </div>
          {error && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {error}
            </p>
          )}
        </div>

        <div ref={listRef} className="overflow-y-auto flex-1 px-2 pb-4">
          {loading && customers.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
              <p className="text-sm mt-2">Loading customers...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <User className="w-10 h-10 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">No customers found</p>
            </div>
          ) : (
            <div className="space-y-1 mt-1">
              {customers.map((customer, index) => {
                const isLast = index === customers.length - 1;
                return (
                  <button
                    key={customer._id || customer.id || `customer-${index}`}
                    ref={isLast ? lastItemRef : null}
                    onClick={() => handleSelect(customer)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-purple-50 rounded-xl border border-transparent hover:border-purple-100 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                        <span className="text-sm font-bold text-[#014582]">
                          {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{customer.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {customer.email && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {customer.email}
                            </span>
                          )}
                          {customer.phone && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {customer.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-3 text-right">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        customer.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {customer.status || 'Active'}
                      </span>
                      {customer.customerNumber && (
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">{customer.customerNumber}</p>
                      )}
                    </div>
                  </button>
                );
              })}

              {loadingMore && (
                <div className="py-3 text-center">
                  <Loader2 className="w-5 h-5 mx-auto text-[#014582] animate-spin" />
                  <p className="text-xs text-gray-400 mt-1">Loading more...</p>
                </div>
              )}

              {!pagination.hasNext && customers.length > 0 && (
                <p className="text-center text-xs text-gray-400 py-2 border-t border-gray-100 mt-1">
                  {customers.length} customers shown
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export function SalesOrdersPage() {
  const { selectedLocationId, selectedLocation } = useLocation();
  const { symbol, formatAmount } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const pageLimit = 10;
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await salesOrderService.getOrders({
        page: currentPage,
        limit: pageLimit,
        sortBy: 'orderDate',
        sortOrder: 'desc',
        orderType: 'Sales Order',
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        paymentStatus: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        locationId: selectedLocationId || undefined,
      });
      
      setOrders(
        (response.data || []).map((order) => ({
          ...order,
          totalAmount: order.grandTotal,
        }))
      );
      setTotalRecords(response.pagination?.total || 0);
      setTotalPages(response.pagination?.pages || 1);
      setHasNext(response.pagination?.hasNext || false);
      setHasPrev(response.pagination?.hasPrev || false);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, paymentStatusFilter, priorityFilter, selectedLocationId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLocationId]);

  const pendingCount = orders.filter((o) => o.orderStatus === 'Pending').length;
  const processingCount = orders.filter((o) => o.orderStatus === 'Processing').length;
  const deliveredCount = orders.filter((o) => o.orderStatus === 'Delivered').length;

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setActionLoading(`status-${orderId}`);
    try {
      await salesOrderService.updateOrderStatus(orderId, newStatus);
      fetchOrders();
    } catch (error: any) {
      console.error('Failed to update status:', error);
      alert(error.message || 'Failed to update order status');
    } finally {
      setActionLoading(null);
    }
  };

  const getValidTransitions = (currentStatus: string) => {
    const validTransitions: Record<string, string[]> = {
      Draft: ['Pending', 'Cancelled'],
      Pending: ['Processing', 'Cancelled'],
      Processing: ['Packed', 'Cancelled'],
      Packed: ['Shipped', 'Cancelled'],
      Shipped: ['In Transit', 'Delivered', 'Cancelled'],
      'In Transit': ['Delivered', 'Cancelled'],
      Delivered: ['Returned'],
      Cancelled: [],
      Returned: [],
      'On Hold': ['Pending', 'Processing', 'Cancelled'],
    };
    return validTransitions[currentStatus] || [];
  };

  const handleCancelOrder = async (orderId: string, reason?: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setActionLoading(`cancel-${orderId}`);
    try {
      await salesOrderService.cancelOrder(orderId, reason);
      fetchOrders();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('Failed to cancel order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;
    setActionLoading(`delete-${orderId}`);
    try {
      await salesOrderService.deleteOrder(orderId);
      fetchOrders();
    } catch (error) {
      console.error('Failed to delete order:', error);
      alert('Failed to delete order');
    } finally {
      setActionLoading(null);
    }
  };

  if (showCreateForm) {
    return (
      <CreateOrderForm
        onCancel={() => setShowCreateForm(false)}
        onSuccess={() => { setShowCreateForm(false); fetchOrders(); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-[#014582]" />
          Sales Orders
          <span className="text-sm font-normal text-gray-400">({totalRecords} orders)</span>
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setCurrentPage(1); fetchOrders(); }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-[#014582] transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all shadow-lg shadow-[#014582]/25"
          >
            <Plus className="w-4 h-4" /> Create Order
          </button>
        </div>
      </div>

      {selectedLocation && (
        <div className="flex items-center gap-2 text-sm text-sky-800 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          Showing orders for <strong>{selectedLocation.name}</strong>
          <span className="text-sky-600 font-mono text-xs">({selectedLocation.code})</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', count: pendingCount, color: 'orange', Icon: Clock },
          { label: 'Processing', count: processingCount, color: 'blue', Icon: Loader2 },
          { label: 'Delivered', count: deliveredCount, color: 'green', Icon: CheckCircle },
        ].map(({ label, count, color, Icon }) => (
          <div key={`kpi-${label}`} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                <p className={`text-2xl font-bold text-${color}-600 mt-1`}>{count}</p>
              </div>
              <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 text-${color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          {[
            { value: statusFilter, set: setStatusFilter, opts: STATUS_OPTIONS, placeholder: 'All Status' },
            { value: paymentStatusFilter, set: setPaymentStatusFilter, opts: PAYMENT_OPTIONS, placeholder: 'All Payment' },
            { value: priorityFilter, set: setPriorityFilter, opts: PRIORITY_OPTIONS, placeholder: 'All Priority' },
          ].map(({ value, set, opts, placeholder }, fi) => (
            <div key={fi} className="relative">
              <select
                value={value}
                onChange={(e) => set(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50"
              >
                {opts.map((o) => (
                  <option key={o} value={o}>{o === 'all' ? placeholder : o}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 mx-auto text-[#014582] animate-spin" />
            <p className="mt-2 text-gray-500">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-500">No sales orders yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first sales order to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Order #', 'Customer', 'Status', 'Payment', 'Priority', 'Total', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr
                    key={String(order._id || order.id || order.orderNumber || `order-${index}`)}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-3 font-mono text-xs font-semibold text-[#014582]">{order.orderNumber}</td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-800">{order.customerName}</p>
                      {order.customerEmail && <p className="text-xs text-gray-500">{order.customerEmail}</p>}
                    </td>
                    <td className="px-6 py-3"><span className={pill(STATUS_COLORS, order.orderStatus)}>{order.orderStatus}</span></td>
                    <td className="px-6 py-3"><span className={pill(PAYMENT_COLORS, order.paymentStatus)}>{order.paymentStatus}</span></td>
                    <td className="px-6 py-3"><span className={pill(PRIORITY_COLORS, order.priority)}>{order.priority}</span></td>
                    <td className="px-6 py-3 font-semibold text-gray-700">{formatAmount(Number(order.totalAmount ?? order.grandTotal))}</td>
                    <td className="px-6 py-3 text-gray-600">{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setSelectedOrder(order); setShowDetailModal(true); }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <select
                          value={order.orderStatus}
                          onChange={(e) => handleUpdateStatus(order._id || order.id || '', e.target.value)}
                          disabled={actionLoading?.startsWith('status-') || getValidTransitions(order.orderStatus).length === 0}
                          className="text-xs px-2 py-1 border border-gray-200 rounded hover:border-[#014582] focus:ring-2 focus:ring-[#014582] outline-none disabled:opacity-50"
                        >
                          <option value={order.orderStatus}>{order.orderStatus}</option>
                          {getValidTransitions(order.orderStatus).map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        {['Draft', 'Pending', 'Processing'].includes(order.orderStatus) && (
                          <button
                            onClick={() => handleCancelOrder(order._id || order.id || '')}
                            disabled={actionLoading?.startsWith('cancel-')}
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all disabled:opacity-50"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        {['Draft', 'Cancelled'].includes(order.orderStatus) && (
                          <button
                            onClick={() => handleDeleteOrder(order._id || order.id || '')}
                            disabled={actionLoading?.startsWith('delete-')}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * pageLimit + 1}–{Math.min(currentPage * pageLimit, totalRecords)} of {totalRecords} orders
          </p>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={!hasPrev}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronDown className="w-4 h-4 rotate-90" />
            </button>
            <span className="px-4 py-2 bg-[#014582]/10 text-[#014582] font-semibold rounded-lg">{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage((p) => p + 1)} disabled={!hasNext}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </button>
          </div>
        </div>
      )}

      {showDetailModal && selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setShowDetailModal(false)} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { formatAmount } = useCurrency();
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{order.orderNumber}</h2>
            <p className="text-sm text-gray-500">{order.customerName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Status', value: order.orderStatus, map: STATUS_COLORS },
              { label: 'Payment', value: order.paymentStatus, map: PAYMENT_COLORS },
            ].map(({ label, value, map }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                <span className={pill(map, value)}>{value}</span>
              </div>
            ))}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Order Date</p>
              <p className="text-sm text-gray-700">{new Date(order.orderDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Expected Delivery</p>
              <p className="text-sm text-gray-700">
                {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Order Items</p>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Product', 'SKU', 'Qty', 'Price', 'Tax', 'Total'].map((h) => (
                      <th key={h} className={`px-4 py-2 text-xs font-semibold text-gray-500 ${h === 'Product' || h === 'SKU' ? 'text-left' : 'text-right'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => (
                    <tr key={item.productId || item.sku || `item-${i}`} className="border-t border-gray-100">
                      <td className="px-4 py-2">{item.productName}</td>
                      <td className="px-4 py-2 font-mono text-xs">{item.sku}</td>
                      <td className="px-4 py-2 text-right">{item.quantity}</td>
                      <td className="px-4 py-2 text-right">{formatAmount(Number(item.unitPrice))}</td>
                      <td className="px-4 py-2 text-right text-gray-600">
                        {item.taxRate ? `${item.taxRate}%` : '—'}
                        {item.taxAmount ? (
                          <span className="block text-[11px] text-gray-400">
                            {formatAmount(Number(item.taxAmount))}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold">
                        {formatAmount(Number((item.totalPrice || 0) + (item.taxAmount || 0)))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="text-right space-y-1">
              {Number(order.taxTotal) > 0 && (
                <p className="text-sm text-gray-500">
                  GST: {formatAmount(Number(order.taxTotal))}
                </p>
              )}
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatAmount(Number(order.totalAmount ?? order.grandTotal))}
              </p>
            </div>
          </div>

          {order.shippingAddress && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Shipping Address</p>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-0.5">
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateOrderForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const { selectedLocationId, selectedLocation } = useLocation();
  const { symbol, formatAmount } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerType, setCustomerType] = useState('Individual');
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerTaxId, setCustomerTaxId] = useState('');

  const [shippingStreet, setShippingStreet] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [shippingCountry, setShippingCountry] = useState('Pakistan');

  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [billingStreet, setBillingStreet] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingPostalCode, setBillingPostalCode] = useState('');
  const [billingCountry, setBillingCountry] = useState('Pakistan');

  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const [orderType, setOrderType] = useState('Standard');
  const [priority, setPriority] = useState('Medium');
  const [source, setSource] = useState('Direct');
  const [salesPerson, setSalesPerson] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');

  const [shippingMethod, setShippingMethod] = useState('Standard');
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentStatus, setPaymentStatus] = useState('Pending');

  const [couponCode, setCouponCode] = useState('');
  const [discountType, setDiscountType] = useState('Percentage');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);

  const [customerNotes, setCustomerNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [tags, setTags] = useState('');
  const [taxContext, setTaxContext] = useState<TaxContext | null>(null);
  const [pricingModel, setPricingModel] = useState<TaxPricingModel>('exclusive');

  const getNormalizedId = (item: any): string => {
    if (!item) return '';
    const raw = item._id ?? item.id;
    if (!raw) return '';
    if (typeof raw === 'object') {
      return (raw as any)?.$oid || JSON.stringify(raw);
    }
    return String(raw);
  };

  // ── fetch customers once; products by selected warehouse ───────────────
  useEffect(() => {
    (async () => {
      try {
        setLoadingCustomers(true);
        const cd = await customerService.getCustomers({ limit: 100 });
        setCustomers((cd.data || []).map(normalizeId));
      } catch (err) {
        console.error('❌ Fetch customers error:', err);
      } finally {
        setLoadingCustomers(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedLocationId) {
      setProducts([]);
      setLoadingProducts(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingProducts(true);
        const pd = await productService.getProducts({
          limit: 500,
          locationId: selectedLocationId,
        });
        if (cancelled) return;
        const list = (pd.data || []).map(normalizeId);
        setProducts(list);
        // Drop selected product / lines that are not at this warehouse
        setSelectedProduct(null);
        setProductSearchQuery('');
        setOrderItems((prev) =>
          prev.filter((item) =>
            list.some((p) => getNormalizedId(p) === String(item.productId))
          )
        );
      } catch (err) {
        console.error('❌ Fetch products error:', err);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedLocationId]);

  useEffect(() => {
    taxService
      .context()
      .then((r: any) => {
        const ctx = (r?.data || r) as TaxContext;
        setTaxContext(ctx);
        if (ctx?.pricingModel) setPricingModel(ctx.pricingModel);
      })
      .catch(() => {});
  }, []);

  const lineWithTax = (item: OrderItem): OrderItem => {
    const tax = computeTaxLine(item.quantity, item.unitPrice, 0, item.taxRate || 0, pricingModel);
    return { ...item, taxAmount: tax.taxAmount, totalPrice: item.unitPrice * item.quantity };
  };

  const lineTotal = (item: OrderItem) =>
    computeTaxLine(item.quantity, item.unitPrice, 0, item.taxRate || 0, pricingModel).lineTotal;

  // ── computed ────────────────────────────────────────────────────────────
  const filteredProducts = productSearchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
          String((p as any).barcodeNumber || (p as any).barcode?.number || '')
            .toLowerCase()
            .includes(productSearchQuery.toLowerCase())
      )
    : products;

  const subtotal = orderItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const taxTotal = orderItems.reduce((s, i) => s + (i.taxAmount || 0), 0);
  const calculatedDiscount =
    discountType === 'Percentage' ? (subtotal * discountPercentage) / 100 : discountAmount;
  const grandTotal =
    pricingModel === 'inclusive'
      ? subtotal + shippingCost - calculatedDiscount
      : subtotal + taxTotal + shippingCost - calculatedDiscount;
  const previewTaxRate = selectedProduct
    ? resolveProductTaxRate(Number(selectedProduct.taxRate) || 0, taxContext)
    : 0;
  const previewTax = selectedProduct
    ? computeTaxLine(quantity, selectedProduct.sellingPrice, 0, previewTaxRate, pricingModel)
    : null;
  const previewTotal = previewTax
    ? previewTax.lineTotal
    : selectedProduct
      ? selectedProduct.sellingPrice * quantity
      : 0;

  // ── Reset Customer Fields ──────────────────────────────────────────────
  const resetCustomerFields = () => {
    console.log('🔄 Resetting customer fields');
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setCustomerType('Individual');
    setCustomerCompany('');
    setCustomerTaxId('');
    setShippingStreet('');
    setShippingCity('');
    setShippingState('');
    setShippingPostalCode('');
    setShippingCountry('Pakistan');
    setBillingStreet('');
    setBillingCity('');
    setBillingState('');
    setBillingPostalCode('');
    setBillingCountry('Pakistan');
    setSelectedCustomer(null);
  };

  // ── Handle Customer Selection from Modal ──────────────────────────────
  const handleCustomerSelect = (customer: any) => {
    console.log('✅ Customer selected from modal:', customer);
    
    if (!customer) {
      resetCustomerFields();
      return;
    }

    setSelectedCustomer(customer);
    setCustomerName(customer.name || '');
    setCustomerEmail(customer.email || '');
    setCustomerPhone(customer.phone || '');
    setCustomerType(customer.customerType || 'Individual');
    setCustomerCompany(customer.company || '');
    setCustomerTaxId(customer.taxId || '');

    console.log('📝 Customer fields filled:', {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      type: customer.customerType,
      company: customer.company,
      taxId: customer.taxId
    });

    // ── Auto-fill addresses ──
    const address = customer.address || customer.shippingAddress || customer.primaryAddress || null;
    
    if (address) {
      const shippingAddr = {
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || 'Pakistan'
      };
      
      setShippingStreet(shippingAddr.street);
      setShippingCity(shippingAddr.city);
      setShippingState(shippingAddr.state);
      setShippingPostalCode(shippingAddr.postalCode);
      setShippingCountry(shippingAddr.country);

      console.log('✅ Shipping address set:', shippingAddr);

      if (sameAsShipping) {
        setBillingStreet(shippingAddr.street);
        setBillingCity(shippingAddr.city);
        setBillingState(shippingAddr.state);
        setBillingPostalCode(shippingAddr.postalCode);
        setBillingCountry(shippingAddr.country);
        console.log('✅ Billing address set (same as shipping)');
      }
    } else {
      console.warn('⚠️ No address found for customer');
    }

    if (!sameAsShipping && customer.billingAddress) {
      const billingAddr = customer.billingAddress;
      if (billingAddr.street || billingAddr.city) {
        setBillingStreet(billingAddr.street || '');
        setBillingCity(billingAddr.city || '');
        setBillingState(billingAddr.state || '');
        setBillingPostalCode(billingAddr.postalCode || '');
        setBillingCountry(billingAddr.country || 'Pakistan');
        console.log('✅ Billing address set:', billingAddr);
      }
    }
  };

  // ── FIXED: Product selection handler ──────────────────────────────────
  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    console.log('🔍 Product selected with ID:', id);
    
    if (!id || id === '') { 
      setSelectedProduct(null); 
      setProductSearchQuery('');
      return; 
    }
    
    const product = products.find((p) => {
      const productId = getNormalizedId(p);
      return productId === id;
    });
    
    if (product) {
      console.log('✅ Product found:', product.name, product.sku);
      setSelectedProduct(product);
      setProductSearchQuery(product.name);
    } else {
      console.warn('❌ Product not found for ID:', id);
      setSelectedProduct(null);
    }
  };

  const addProductLine = (product: Product, qty: number) => {
    if (qty < 1) {
      setFormError('Quantity must be at least 1');
      return;
    }
    if (qty > product.currentStock) {
      setFormError(`Insufficient stock. Available: ${product.currentStock}`);
      return;
    }

    const selectedProductId = getNormalizedId(product);
    const idx = orderItems.findIndex((i) => {
      const itemProductId = getNormalizedId({ _id: i.productId });
      return itemProductId === selectedProductId;
    });

    const productRate = Number((product as any).taxRate) || 0;
    const taxRate =
      productRate > 0 ? productRate : resolveProductTaxRate(0, taxContext);

    if (idx >= 0) {
      const newQty = orderItems[idx].quantity + qty;
      if (newQty > product.currentStock) {
        setFormError(`Insufficient stock. Available: ${product.currentStock}, total requested: ${newQty}`);
        return;
      }
      const updated = [...orderItems];
      updated[idx] = lineWithTax({
        ...updated[idx],
        quantity: newQty,
        taxRate: updated[idx].taxRate || taxRate,
      });
      setOrderItems(updated);
    } else {
      setOrderItems([
        ...orderItems,
        lineWithTax({
          productId: getNormalizedId(product),
          productName: product.name,
          sku: product.sku,
          quantity: qty,
          unitPrice: product.sellingPrice,
          totalPrice: product.sellingPrice * qty,
          taxRate,
          taxAmount: 0,
        }),
      ]);
    }

    setSelectedProduct(null);
    setQuantity(1);
    setProductSearchQuery('');
    setFormError('');
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      setFormError('Please select a product');
      return;
    }
    addProductLine(selectedProduct, quantity);
  };

  useHardwareBarcodeScanner((code) => {
    const local = matchScannedProduct(products, code);
    if (local) {
      addProductLine(local as Product, 1);
      return;
    }
    void findProductFromScan(code, selectedLocationId || undefined).then((found) => {
      if (!found) {
        setFormError(`No product found for barcode ${code}`);
        setProductSearchQuery(code);
        return;
      }
      addProductLine(found as Product, 1);
    });
  });

  const handleRemoveItem = (i: number) => setOrderItems(orderItems.filter((_, idx) => idx !== i));

  const handleUpdateQty = (i: number, qty: number) => {
    if (qty < 1) return;
    const updated = [...orderItems];
    updated[i] = lineWithTax({ ...updated[i], quantity: qty });
    setOrderItems(updated);
  };

  const handleUpdateTaxRate = (i: number, rate: number) => {
    const updated = [...orderItems];
    updated[i] = lineWithTax({ ...updated[i], taxRate: rate });
    setOrderItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!selectedLocationId) {
      setFormError('Select a warehouse from the top bar before creating the order');
      return;
    }
    if (!customerName.trim()) { setFormError('Customer name is required'); return; }
    if (orderItems.length === 0) { setFormError('Please add at least one item'); return; }

    setIsSubmitting(true);
    try {
      const shippingAddr = { street: shippingStreet, city: shippingCity, state: shippingState, postalCode: shippingPostalCode, country: shippingCountry };
      const billingAddr = sameAsShipping ? shippingAddr : { street: billingStreet, city: billingCity, state: billingState, postalCode: billingPostalCode, country: billingCountry };

      await salesOrderService.createOrder({
        customerName, customerEmail, customerPhone, customerType,
        customerCompany, customerTaxId,
        shippingAddress: shippingAddr,
        billingAddress: billingAddr,
        items: orderItems.map((item) => {
          const taxed = lineWithTax(item);
          return {
            ...taxed,
            productId: String(item.productId || ''),
            taxRate: taxed.taxRate || 0,
            taxAmount: taxed.taxAmount || 0,
          };
        }),
        orderType,
        priority: priority as SalesOrder['priority'],
        source,
        salesPerson,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        shippingMethod, shippingCarrier, shippingCost,
        paymentMethod,
        paymentStatus: paymentStatus as SalesOrder['paymentStatus'],
        couponCode, discountType, discountPercentage, discountAmount,
        customerNotes, internalNotes,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        subtotal, discountTotal: calculatedDiscount, taxTotal, grandTotal,
        locationId: selectedLocationId,
      });
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'An error occurred while creating the order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── reusable input classes ───────────────────────────────────────────────
  const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none';
  const sel = inp;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Plus className="w-6 h-6 text-[#014582]" /> Create Sales Order
        </h1>
        <button type="button" onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>

      {selectedLocation ? (
        <div className="flex items-center gap-2 text-sm text-sky-800 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          Fulfilling from <strong>{selectedLocation.name}</strong>
          <span className="text-sky-600 font-mono text-xs">({selectedLocation.code})</span>
          <span className="text-sky-600/80">— product stock is for this warehouse only</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Select a warehouse from the top bar to load products
        </div>
      )}

      {formError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-800">{formError}</p>
        </div>
      )}

      {/* ── Customer Information ──────────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <User className="w-5 h-5 text-[#014582]" /> Customer Information
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowCustomerModal(true)}
              className="flex-1 flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 hover:border-[#014582] hover:bg-purple-50 transition-all text-left focus:ring-2 focus:ring-[#014582] focus:outline-none"
            >
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {selectedCustomer ? (
                <span className="text-gray-800 font-medium truncate flex-1">
                  {selectedCustomer.name}
                </span>
              ) : (
                <span className="text-gray-400 flex-1">Click to select customer...</span>
              )}
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>
            
            {selectedCustomer && (
              <button
                type="button"
                onClick={() => resetCustomerFields()}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"
                title="Clear customer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {selectedCustomer && (
            <div className="mt-2 px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#014582] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {selectedCustomer.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-purple-700 font-medium">
                {selectedCustomer.name}
                {selectedCustomer.customerNumber && (
                  <span className="text-xs text-purple-400 font-mono ml-2">
                    #{selectedCustomer.customerNumber}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inp} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
            <select value={customerType} onChange={(e) => setCustomerType(e.target.value)} className={sel}>
              {CUSTOMER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input type="text" value={customerCompany} onChange={(e) => setCustomerCompany(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID / NTN</label>
            <input type="text" value={customerTaxId} onChange={(e) => setCustomerTaxId(e.target.value)} className={inp} />
          </div>
        </div>
      </section>

      {/* ── Shipping Address ──────────────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Truck className="w-5 h-5 text-[#014582]" /> Shipping Address
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
            <input type="text" value={shippingStreet} onChange={(e) => setShippingStreet(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input type="text" value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State / Province</label>
            <input type="text" value={shippingState} onChange={(e) => setShippingState(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
            <input type="text" value={shippingPostalCode} onChange={(e) => setShippingPostalCode(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <select value={shippingCountry} onChange={(e) => setShippingCountry(e.target.value)} className={sel}>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* ── Billing Address ───────────────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-[#014582]" /> Billing Address
        </h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={sameAsShipping} onChange={(e) => setSameAsShipping(e.target.checked)}
            className="w-4 h-4 text-[#014582] rounded focus:ring-[#014582]" />
          <span className="text-sm text-gray-700">Same as shipping address</span>
        </label>
        {!sameAsShipping && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
              <input type="text" value={billingStreet} onChange={(e) => setBillingStreet(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" value={billingCity} onChange={(e) => setBillingCity(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State / Province</label>
              <input type="text" value={billingState} onChange={(e) => setBillingState(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input type="text" value={billingPostalCode} onChange={(e) => setBillingPostalCode(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <select value={billingCountry} onChange={(e) => setBillingCountry(e.target.value)} className={sel}>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}
      </section>

      {/* ── Order Items ───────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Package className="w-5 h-5 text-[#014582]" /> Order Items
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Product</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter by name, SKU, or scan barcode..."
                value={productSearchQuery}
                onChange={(e) => { 
                  setProductSearchQuery(e.target.value); 
                  if (e.target.value === '') setSelectedProduct(null);
                }}
                className={`${inp} pl-9 pr-8`}
              />
              {productSearchQuery && (
                <button type="button" onClick={() => { setProductSearchQuery(''); setSelectedProduct(null); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">USB scanner ready — scan a barcode to add the product.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number" min="1" value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className={inp}
            />
          </div>
        </div>

        {/* ── FIXED: Product Dropdown with unique keys ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Product{' '}
            {loadingProducts && <span className="text-gray-400 font-normal text-xs">(loading...)</span>}
          </label>
          <select
            value={selectedProduct ? getNormalizedId(selectedProduct) : ''}
            onChange={handleProductSelect}
            disabled={loadingProducts}
            className={`${sel} disabled:bg-gray-50`}
          >
            <option value="">— Select a product —</option>
            {filteredProducts.map((p, index) => {
              const productId = getNormalizedId(p);
              const uniqueKey = productId || `product-${index}-${Date.now()}`;
              return (
                <option key={uniqueKey} value={productId}>
                  {p.name} ({p.sku}) — {formatAmount(p.sellingPrice)} | Stock: {p.currentStock}
                </option>
              );
            })}
          </select>
          {!loadingProducts && filteredProducts.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {selectedLocationId
                ? productSearchQuery
                  ? 'No products match your search at this warehouse'
                  : 'No products assigned to this warehouse (add stock or assign products first)'
                : 'Select a warehouse to load products'}
            </p>
          )}
          {selectedProduct && (
            <p className="text-xs text-green-600 mt-1">
              ✅ Selected: {selectedProduct.name} (Stock: {selectedProduct.currentStock})
            </p>
          )}
        </div>

        {/* Live preview */}
        {selectedProduct && (
          <div className="flex flex-wrap items-center gap-4 bg-[#014582]/5 border border-[#014582]/20 rounded-lg px-4 py-3 text-sm">
            <span className="text-gray-500">
              Unit price: <strong className="text-gray-800">{formatAmount(selectedProduct.sellingPrice)}</strong>
            </span>
            {previewTaxRate > 0 && (
              <span className="text-gray-500">
                GST {previewTaxRate}%{pricingModel === 'inclusive' ? ' incl.' : ''}
                {previewTax ? (
                  <> · <strong className="text-gray-800">{formatAmount(previewTax.taxAmount)}</strong></>
                ) : null}
              </span>
            )}
            <span className="text-gray-500">
              × {quantity} = <strong className="text-[#014582]">{formatAmount(previewTotal)}</strong>
            </span>
            <span className="ml-auto text-xs">
              Stock:{' '}
              <strong className={quantity > selectedProduct.currentStock ? 'text-red-600' : 'text-green-600'}>
                {selectedProduct.currentStock} available
              </strong>
            </span>
          </div>
        )}

        <button
          type="button" onClick={handleAddItem} disabled={!selectedProduct}
          className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" /> Add to Order
        </button>

        {/* Items table */}
        {orderItems.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Product', 'SKU', 'Unit Price', 'Qty', 'Tax', 'Total', ''].map((h, i) => (
                    <th key={i} className={`px-4 py-2 text-xs font-semibold text-gray-500 ${i === 0 || i === 1 ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item, i) => (
                  <tr key={item.productId || item.sku || `order-item-${i}`} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">{item.productName}</td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-500">{item.sku}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{formatAmount(item.unitPrice)}</td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number" min="1" value={item.quantity}
                        onChange={(e) => handleUpdateQty(i, parseInt(e.target.value) || 1)}
                        className="w-16 text-center px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-[#014582] outline-none"
                      />
                    </td>
                    <td className="px-4 py-2 text-right min-w-[140px]">
                      <TaxRateSelect
                        value={item.taxRate || 0}
                        autoDefault
                        onChange={(rate) => handleUpdateTaxRate(i, rate)}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:ring-2 focus:ring-[#014582] outline-none"
                      />
                      {(item.taxAmount || 0) > 0 && (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {formatAmount(Number(item.taxAmount))}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-gray-800">{formatAmount(lineTotal(item))}</td>
                    <td className="px-4 py-2 text-right">
                      <button type="button" onClick={() => handleRemoveItem(i)}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right text-sm font-semibold text-gray-600">Items Subtotal</td>
                  <td className="px-4 py-2 text-right font-bold text-gray-800">{formatAmount(subtotal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-lg py-10 text-center text-gray-400">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No items added yet. Select a product above and click "Add to Order".</p>
          </div>
        )}
      </section>

      {/* ── Order Details ─────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#014582]" /> Order Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
            <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className={sel}>
              {ORDER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={sel}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select value={source} onChange={(e) => setSource(e.target.value)} className={sel}>
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sales Person</label>
            <input type="text" value={salesPerson} onChange={(e) => setSalesPerson(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</label>
            <input type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} className={inp} />
          </div>
        </div>
      </section>

      {/* ── Shipping & Payment ────────────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#014582]" /> Shipping & Payment
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Method</label>
            <select value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)} className={sel}>
              {SHIPPING_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Carrier</label>
            <input type="text" value={shippingCarrier} onChange={(e) => setShippingCarrier(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Cost ({symbol})</label>
            <input type="number" min="0" step="0.01" value={shippingCost}
              onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)} className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={sel}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
            <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={sel}>
              <option key="payment-pending" value="Pending">Pending</option>
              <option key="payment-paid" value="Paid">Paid</option>
              <option key="payment-partial" value="Partial">Partial</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Discounts ─────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Tag className="w-5 h-5 text-[#014582]" /> Discounts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
            <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
            <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className={sel}>
              <option key="discount-percentage" value="Percentage">Percentage (%)</option>
              <option key="discount-fixed" value="Fixed">Fixed Amount</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {discountType === 'Percentage' ? 'Discount %' : `Discount Amount (${symbol})`}
            </label>
            <input
              type="number" min="0" step={discountType === 'Percentage' ? 0.1 : 1}
              value={discountType === 'Percentage' ? discountPercentage : discountAmount}
              onChange={(e) => {
                const v = parseFloat(e.target.value) || 0;
                discountType === 'Percentage' ? setDiscountPercentage(v) : setDiscountAmount(v);
              }}
              className={inp}
            />
          </div>
        </div>
      </section>

      {/* ── Notes ─────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#014582]" /> Notes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Notes</label>
            <textarea value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} rows={3}
              className={`${inp} resize-none`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
            <textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={3}
              className={`${inp} resize-none`} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags <span className="text-gray-400 font-normal">(comma separated)</span>
            </label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. urgent, bulk, export" className={inp} />
          </div>
        </div>
      </section>

      {/* ── Order Summary ─────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-[#014582]" /> Order Summary
        </h2>
        <div className="max-w-sm ml-auto space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal ({orderItems.length} item{orderItems.length !== 1 ? 's' : ''})</span>
            <span className="font-semibold text-gray-800">{formatAmount(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Shipping ({shippingMethod})</span>
            <span className="font-semibold text-gray-800">{formatAmount(shippingCost)}</span>
          </div>
          {taxTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                GST {pricingModel === 'inclusive' ? '(included)' : ''}
              </span>
              <span className="font-semibold text-gray-800">{formatAmount(taxTotal)}</span>
            </div>
          )}
          {calculatedDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Discount {discountType === 'Percentage' ? `(${discountPercentage}%)` : '(Fixed)'}
              </span>
              <span className="font-semibold text-red-500">− {formatAmount(calculatedDiscount)}</span>
            </div>
          )}
          <div className="border-t-2 border-gray-200 pt-3 flex justify-between items-center">
            <span className="font-bold text-gray-800">Grand Total</span>
            <span className="font-bold text-2xl text-[#014582]">{formatAmount(grandTotal)}</span>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={onCancel}
          className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-all shadow-lg shadow-[#014582]/25 disabled:opacity-50 disabled:cursor-not-allowed">
          {isSubmitting
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
            : <><CheckCircle className="w-4 h-4" /> Create Order</>}
        </button>
      </div>

      {/* ─── Customer Picker Modal ──────────────────────────── */}
      <CustomerPickerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelect={handleCustomerSelect}
      />
    </form>
  );
}

/** Next.js route shell — real UI mounts via SalesViewHost. */
export default function SalesRoutePlaceholder() {
  return null;
}