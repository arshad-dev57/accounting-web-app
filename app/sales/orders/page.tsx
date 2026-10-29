'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Plus, Search, RefreshCw, ShoppingCart, Package, User,
  Truck, DollarSign, Clock, X, ChevronDown,
  Eye, Trash2, CheckCircle, Loader2,
  FileText, CreditCard, Tag, Receipt, AlertCircle,
  Mail, Phone, Building, Save, ArrowLeft, Edit3
} from 'lucide-react';
import { customerService } from '../../api/customer/route';
import { productService } from '../../api/product/route';
import { salesOrderService, type Order as SalesOrder } from '@/lib/sales-order-service';
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
import { ProductPicker, type PickedProduct } from '@/manufacturing/_components/ProductPicker';
import { SalesNumberInput } from '@/components/sales/sales-number-input';
import { CustomerFormModal } from '@/components/customers/CustomerFormModal';
import {
  PeriodFilter,
  makePeriodValue,
  resolvePeriod,
  type PeriodValue,
} from '@/components/common/PeriodFilter';
import { CustomerFilter, type CustomerFilterValue } from '@/components/common/CustomerFilter';
import { SalesDocumentModal } from '@/components/sales-documents/SalesDocumentModal';
import { mapOrderToDocument } from '@/lib/sales-document';
import { useLocationOptional } from '@/lib/location-context';
import {
  tradingService,
  type ResolvedSellPrice,
} from '@/lib/trading-service';
import toast from 'react-hot-toast';

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
  /** When true, keep typed price; do not overwrite from customer pricing. */
  manualPriceOverride?: boolean;
  pricingSource?: string;
  listPrice?: number;
  currencyCode?: string;
  minOrderQty?: number;
  pricingWarnings?: string[];
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
  'Partially Returned': 'bg-rose-100 text-rose-700',
  Cancelled: 'bg-red-100 text-red-700',
  Returned: 'bg-pink-100 text-pink-700',
  'On Hold': 'bg-yellow-100 text-yellow-700',
};

const PAYMENT_COLORS: Record<string, string> = {
  Pending: 'bg-orange-100 text-orange-700',
  Paid: 'bg-green-100 text-green-700',
  Partial: 'bg-blue-100 text-blue-700',
  'Partial Refund': 'bg-amber-100 text-amber-700',
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

const STATUS_OPTIONS = ['all', 'Draft', 'Pending', 'Processing', 'Packed', 'Shipped', 'In Transit', 'Partially Delivered', 'Delivered', 'Partially Returned', 'Cancelled', 'Returned', 'On Hold'];
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
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${customer.status === 'Active'
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
  const { symbol, formatAmount } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
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
  const [draftPeriod, setDraftPeriod] = useState<PeriodValue>(makePeriodValue);
  const [period, setPeriod] = useState<PeriodValue>(makePeriodValue);
  const [customerFilter, setCustomerFilter] = useState<CustomerFilterValue | null>(null);
  const [reportOrder, setReportOrder] = useState<Order | null>(null);
  const periodRange = useMemo(() => resolvePeriod(period), [period]);

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
        customerId: customerFilter?.id,
        fromDate: periodRange.fromDate || undefined,
        toDate: periodRange.toDate || undefined,
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
  }, [
    currentPage,
    searchTerm,
    statusFilter,
    paymentStatusFilter,
    priorityFilter,
    customerFilter?.id,
    periodRange.fromDate,
    periodRange.toDate,
  ]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const pendingCount = orders.filter((o) => o.orderStatus === 'Pending').length;
  const processingCount = orders.filter((o) => o.orderStatus === 'Processing').length;
  const deliveredCount = orders.filter((o) => o.orderStatus === 'Delivered').length;

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
        orderToEdit={editingOrder}
        onCancel={() => {
          setShowCreateForm(false);
          setEditingOrder(null);
        }}
        onSuccess={() => {
          setShowCreateForm(false);
          setEditingOrder(null);
          fetchOrders();
        }}
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

      <PeriodFilter
        value={draftPeriod}
        onChange={setDraftPeriod}
        onApply={() => {
          setPeriod({ ...draftPeriod });
          setCurrentPage(1);
        }}
        onReset={() => {
          const empty = makePeriodValue();
          setDraftPeriod(empty);
          setPeriod(empty);
          setCustomerFilter(null);
          setCurrentPage(1);
        }}
        appliedLabel={periodRange.label}
      />

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
          <CustomerFilter
            value={customerFilter}
            onChange={(next) => {
              setCustomerFilter(next);
              setCurrentPage(1);
            }}
          />
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
                          onClick={() => setReportOrder(order)}
                          className="p-1.5 text-gray-400 hover:text-[#014582] hover:bg-blue-50 rounded-lg transition-all"
                          title="Order Report"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedOrder(order); setShowDetailModal(true); }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {['Draft', 'Pending', 'On Hold'].includes(order.orderStatus) && (
                          <button
                            onClick={() => {
                              setEditingOrder(order);
                              setShowCreateForm(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-gray-100 rounded-lg transition-all"
                            title="Edit Order"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {['Draft', 'Pending', 'Processing', 'On Hold', 'Packed', 'Shipped', 'In Transit'].includes(
                          order.orderStatus
                        ) && (
                          <button
                            onClick={() => handleCancelOrder(order._id || order.id || '')}
                            disabled={actionLoading?.startsWith('cancel-')}
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all disabled:opacity-50"
                            title="Cancel order"
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
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setShowDetailModal(false)}
          onEdit={
            ['Draft', 'Pending', 'On Hold'].includes(selectedOrder.orderStatus)
              ? () => {
                setEditingOrder(selectedOrder);
                setShowDetailModal(false);
                setShowCreateForm(true);
              }
              : undefined
          }
        />
      )}

      {reportOrder && (
        <SalesDocumentModal
          document={mapOrderToDocument(reportOrder)}
          onClose={() => setReportOrder(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function OrderDetailModal({
  order,
  onClose,
  onEdit,
}: {
  order: Order;
  onClose: () => void;
  onEdit?: () => void;
}) {
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

          {onEdit && (
            <div className="border-t border-gray-100 pt-4 flex justify-end">
              <button
                type="button"
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all"
              >
                <Edit3 className="w-4 h-4" />
                Edit Order
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateOrderForm({
  onCancel,
  onSuccess,
  orderToEdit,
}: {
  onCancel: () => void;
  onSuccess: () => void;
  orderToEdit?: Order | null;
}) {
  const isEditing = Boolean(orderToEdit?.id || orderToEdit?._id);
  const { symbol, formatAmount } = useCurrency();
  const locationCtx = useLocationOptional();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [pricingBanner, setPricingBanner] = useState<string>('');

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

  const populateFromOrder = useCallback((order: Order) => {
    setCustomerName(order.customerName || '');
    setCustomerEmail(order.customerEmail || '');
    setCustomerPhone(order.customerPhone || '');
    setCustomerType(order.customerType || 'Individual');
    setCustomerCompany(order.customerCompany || '');
    setCustomerTaxId(order.customerTaxId || '');
    setShippingStreet(order.shippingAddress?.street || '');
    setShippingCity(order.shippingAddress?.city || '');
    setShippingState(order.shippingAddress?.state || '');
    setShippingPostalCode(order.shippingAddress?.postalCode || '');
    setShippingCountry(order.shippingAddress?.country || 'Pakistan');
    setBillingStreet(order.billingAddress?.street || '');
    setBillingCity(order.billingAddress?.city || '');
    setBillingState(order.billingAddress?.state || '');
    setBillingPostalCode(order.billingAddress?.postalCode || '');
    setBillingCountry(order.billingAddress?.country || 'Pakistan');
    setSameAsShipping(
      JSON.stringify(order.shippingAddress || {}) === JSON.stringify(order.billingAddress || {})
    );
    setOrderItems((order.items || []).map((item) => ({
      productId: String(item.productId || ''),
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      taxRate: item.taxRate,
      taxAmount: item.taxAmount,
    })));
    setPriority(order.priority || 'Medium');
    setSource(order.source || 'Direct');
    setSalesPerson(order.salesPerson || '');
    setExpectedDeliveryDate(order.expectedDeliveryDate?.slice?.(0, 10) || '');
    setShippingMethod(order.shippingMethod || 'Standard');
    setShippingCarrier(order.shippingCarrier || '');
    setShippingCost(Number(order.shippingCost) || 0);
    setPaymentMethod(order.paymentMethod || 'Cash');
    setPaymentStatus(order.paymentStatus || 'Pending');
    setCouponCode(order.couponCode || '');
    setDiscountAmount(Number(order.discountAmount || order.discountTotal) || 0);
    setCustomerNotes(order.customerNotes || '');
    setInternalNotes(order.internalNotes || '');
    setTags((order.tags || []).join(', '));
  }, []);

  useEffect(() => {
    if (!orderToEdit) return;
    const orderId = String(orderToEdit.id || orderToEdit._id || '');
    if (!orderId) {
      populateFromOrder(orderToEdit);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const full = await salesOrderService.getOrderById(orderId);
        if (!cancelled) populateFromOrder(full);
      } catch {
        if (!cancelled) populateFromOrder(orderToEdit);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderToEdit?.id, orderToEdit?._id, orderToEdit, populateFromOrder]);

  const getNormalizedId = (item: any): string => {
    if (!item) return '';
    const raw = item._id ?? item.id;
    if (!raw) return '';
    if (typeof raw === 'object') {
      return (raw as any)?.$oid || JSON.stringify(raw);
    }
    return String(raw);
  };

  // ── fetch customers once; products company-wide (not warehouse-scoped) ──
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
    let cancelled = false;
    (async () => {
      try {
        setLoadingProducts(true);
        const pd = await productService.getProducts({
          limit: 500,
        });
        if (cancelled) return;
        const list = (pd.data || []).map(normalizeId);
        setProducts(list);
        setSelectedProduct(null);
        setProductSearchQuery('');
        if (!isEditing) {
          setOrderItems((prev) =>
            prev.filter((item) =>
              list.some((p) => getNormalizedId(p) === String(item.productId))
            )
          );
        }
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
  }, [isEditing]);

  useEffect(() => {
    taxService
      .context()
      .then((r: any) => {
        const ctx = (r?.data || r) as TaxContext;
        setTaxContext(ctx);
        if (ctx?.pricingModel) setPricingModel(ctx.pricingModel);
      })
      .catch(() => { });
  }, []);

  const lineWithTax = (item: OrderItem): OrderItem => {
    const qty = typeof item.quantity === 'number' ? item.quantity : (parseInt(item.quantity as any, 10) || 0);
    const tax = computeTaxLine(qty, item.unitPrice, 0, item.taxRate || 0, pricingModel);
    return { ...item, taxAmount: tax.taxAmount, totalPrice: item.unitPrice * qty };
  };

  const lineTotal = (item: OrderItem) => {
    const qty = typeof item.quantity === 'number' ? item.quantity : (parseInt(item.quantity as any, 10) || 0);
    return computeTaxLine(qty, item.unitPrice, 0, item.taxRate || 0, pricingModel).lineTotal;
  };

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

  const subtotal = orderItems.reduce((s, i) => {
    const q = typeof i.quantity === 'number' ? i.quantity : (parseInt(i.quantity as any, 10) || 0);
    return s + i.unitPrice * q;
  }, 0);
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
      setPricingBanner('');
      return;
    }

    setSelectedCustomer(customer);
    setCustomerName(customer.name || '');
    setCustomerEmail(customer.email || '');
    setCustomerPhone(customer.phone || '');
    setCustomerType(customer.customerType || 'Individual');
    setCustomerCompany(customer.company || customer.companyName || '');
    setCustomerTaxId(customer.taxId || '');

    // Re-apply active negotiated / price-list prices for existing lines
    const cid = customer.id || customer._id || null;
    if (cid && orderItems.length > 0) {
      void repriceOrderLines(cid, orderItems, true).then((next) => {
        setOrderItems(next);
      });
    } else if (cid) {
      setPricingBanner(
        'Customer selected — negotiated / price-list prices will apply when you add products.'
      );
    }

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

      if (sameAsShipping) {
        setBillingStreet(shippingAddr.street);
        setBillingCity(shippingAddr.city);
        setBillingState(shippingAddr.state);
        setBillingPostalCode(shippingAddr.postalCode);
        setBillingCountry(shippingAddr.country);
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

  const customerIdForPricing = () =>
    selectedCustomer?.id || selectedCustomer?._id || null;

  const applyResolvedToOrderLine = (
    line: OrderItem,
    resolved: ResolvedSellPrice,
    opts?: { force?: boolean }
  ): OrderItem => {
    if (line.manualPriceOverride && !opts?.force) {
      return {
        ...line,
        pricingWarnings: resolved.warnings || line.pricingWarnings,
        minOrderQty: resolved.minOrderQty ?? line.minOrderQty,
      };
    }
    const unitPrice = Number(resolved.unitPrice);
    const qty =
      typeof line.quantity === 'number'
        ? line.quantity
        : parseInt(String(line.quantity), 10) || 1;
    return lineWithTax({
      ...line,
      unitPrice,
      totalPrice: unitPrice * qty,
      listPrice: Number(resolved.listPrice),
      currencyCode: resolved.currencyCode || line.currencyCode,
      minOrderQty: Number(resolved.minOrderQty) || 1,
      pricingSource: resolved.source,
      manualPriceOverride: false,
      pricingWarnings: resolved.warnings || [],
      taxRate:
        line.taxRate != null && line.taxRate > 0
          ? line.taxRate
          : Number(resolved.taxRate) || line.taxRate || 0,
    });
  };

  const resolvePriceForProduct = async (
    productId: string,
    qty: number
  ): Promise<ResolvedSellPrice | null> => {
    try {
      return await tradingService.resolveSellPrice({
        customerId: customerIdForPricing(),
        productId,
        quantity: qty,
      });
    } catch (err) {
      console.error('resolveSellPrice failed:', err);
      return null;
    }
  };

  const repriceOrderLines = useCallback(
    async (customerId: string | null, lines: OrderItem[], force = false) => {
      if (!lines.length) return lines;
      if (!customerId) {
        setPricingBanner(
          'Select a customer to apply negotiated / price-list pricing. Catalog selling prices are shown until then.'
        );
        return lines;
      }
      try {
        const resolved = await tradingService.resolveSellPrices({
          customerId,
          lines: lines.map((l) => ({
            productId: l.productId,
            quantity:
              typeof l.quantity === 'number'
                ? l.quantity
                : parseInt(String(l.quantity), 10) || 1,
          })),
        });
        const byProduct = new Map(resolved.map((r) => [r.productId, r]));
        const next = lines.map((line) => {
          if (line.manualPriceOverride && !force) return line;
          const r = byProduct.get(line.productId);
          return r ? applyResolvedToOrderLine(line, r, { force }) : line;
        });
        const negotiated = resolved.filter((r) => r.source === 'CUSTOMER_NEGOTIATED')
          .length;
        const msgs = resolved.flatMap((r) => [
          ...(r.messages || []),
          ...(r.warnings || []),
        ]);
        if (negotiated > 0) {
          setPricingBanner(
            `Applied customer negotiated pricing on ${negotiated} line(s).` +
              (msgs.length ? ` ${msgs[0]}` : '')
          );
        } else if (msgs.length) {
          setPricingBanner(msgs[0]);
        } else {
          setPricingBanner(
            'Using standard selling prices (no active customer pricing for these products).'
          );
        }
        return next;
      } catch (err) {
        console.error('SO price resolve failed:', err);
        setPricingBanner(
          err instanceof Error
            ? err.message
            : 'Could not resolve customer pricing; showing catalog prices.'
        );
        return lines;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [taxContext, pricingModel]
  );

  const addProductLine = async (product: Product, qty: number) => {
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

    const resolved = await resolvePriceForProduct(selectedProductId, qty);
    const unitPrice = resolved
      ? Number(resolved.unitPrice)
      : Number(product.sellingPrice) || 0;

    if (idx >= 0) {
      const newQty = orderItems[idx].quantity + qty;
      if (newQty > product.currentStock) {
        setFormError(`Insufficient stock. Available: ${product.currentStock}, total requested: ${newQty}`);
        return;
      }
      const refreshed = await resolvePriceForProduct(selectedProductId, newQty);
      const updated = [...orderItems];
      const base = {
        ...updated[idx],
        quantity: newQty,
        taxRate: updated[idx].taxRate || taxRate,
      };
      updated[idx] = refreshed
        ? applyResolvedToOrderLine(base, refreshed, {
            force: !updated[idx].manualPriceOverride,
          })
        : lineWithTax(base);
      setOrderItems(updated);
      if (refreshed?.source === 'CUSTOMER_NEGOTIATED') {
        setPricingBanner(
          `Negotiated price ${unitPrice.toLocaleString()} applied for ${product.name}`
        );
      }
    } else {
      const line = lineWithTax({
        productId: selectedProductId,
        productName: product.name,
        sku: product.sku,
        quantity: qty,
        unitPrice,
        totalPrice: unitPrice * qty,
        taxRate: resolved?.taxRate != null && Number(resolved.taxRate) > 0
          ? Number(resolved.taxRate)
          : taxRate,
        taxAmount: 0,
        pricingSource: resolved?.source,
        listPrice: resolved ? Number(resolved.listPrice) : Number(product.sellingPrice),
        currencyCode: resolved?.currencyCode,
        minOrderQty: resolved?.minOrderQty,
        pricingWarnings: resolved?.warnings,
        manualPriceOverride: false,
      });
      setOrderItems([...orderItems, line]);
      if (resolved?.source === 'CUSTOMER_NEGOTIATED') {
        setPricingBanner(
          `Negotiated price ${unitPrice.toLocaleString()} applied for ${product.name}`
        );
        toast.success(`${product.name}: negotiated price loaded`);
      } else if (!customerIdForPricing()) {
        setPricingBanner(
          'Select a customer to apply negotiated / price-list pricing. Catalog selling prices are shown until then.'
        );
      } else if (resolved?.warnings?.length) {
        setPricingBanner(resolved.warnings[0]);
      }
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
    void addProductLine(selectedProduct, quantity);
  };

  const handleBulkAddProducts = async (picked: PickedProduct[]) => {
    if (!picked.length) return;
    setFormError('');
    const existingIds = new Set(orderItems.map((i) => getNormalizedId({ _id: i.productId })));
    const additions: OrderItem[] = [];
    let negotiatedCount = 0;

    for (const p of picked) {
      if (existingIds.has(p.id)) continue;
      try {
        const fromList = products.find((prod) => getNormalizedId(prod) === p.id);
        const raw = fromList || (await productService.getProductById(p.id));
        const product = normalizeId(raw) as Product;
        if (product.currentStock !== 0 && !product.currentStock) {
          product.currentStock = Number((raw as any).locationStock || (raw as any).currentStock || 0);
        }
        if (1 > product.currentStock) {
          setFormError(`Insufficient stock for ${product.name}. Available: ${product.currentStock}`);
          continue;
        }
        const productRate = Number((product as any).taxRate) || 0;
        const taxRate =
          productRate > 0 ? productRate : resolveProductTaxRate(0, taxContext);
        const productId = getNormalizedId(product);
        const resolved = await resolvePriceForProduct(productId, 1);
        const unitPrice = resolved
          ? Number(resolved.unitPrice)
          : Number(product.sellingPrice) || 0;
        if (resolved?.source === 'CUSTOMER_NEGOTIATED') negotiatedCount += 1;
        additions.push(
          lineWithTax({
            productId,
            productName: product.name,
            sku: product.sku,
            quantity: 1,
            unitPrice,
            totalPrice: unitPrice,
            taxRate:
              resolved?.taxRate != null && Number(resolved.taxRate) > 0
                ? Number(resolved.taxRate)
                : taxRate,
            taxAmount: 0,
            pricingSource: resolved?.source,
            listPrice: resolved
              ? Number(resolved.listPrice)
              : Number(product.sellingPrice),
            currencyCode: resolved?.currencyCode,
            minOrderQty: resolved?.minOrderQty,
            pricingWarnings: resolved?.warnings,
            manualPriceOverride: false,
          })
        );
        existingIds.add(p.id);
      } catch (err) {
        console.error('Failed to add product:', p.id, err);
      }
    }

    if (additions.length) {
      setOrderItems((prev) => [...prev, ...additions]);
      if (negotiatedCount > 0) {
        setPricingBanner(
          `Applied customer negotiated pricing on ${negotiatedCount} line(s).`
        );
        toast.success(`Negotiated pricing applied on ${negotiatedCount} product(s)`);
      } else if (!customerIdForPricing()) {
        setPricingBanner(
          'Select a customer to apply negotiated / price-list pricing. Catalog selling prices are shown until then.'
        );
      }
    }
  };

  useHardwareBarcodeScanner((code) => {
    const local = matchScannedProduct(products, code);
    if (local) {
      addProductLine(local as Product, 1);
      return;
    }
    void findProductFromScan(code).then((found) => {
      if (!found) {
        setFormError(`No product found for barcode ${code}`);
        setProductSearchQuery(code);
        return;
      }
      addProductLine(found as Product, 1);
    });
  });

  const handleRemoveItem = (i: number) => setOrderItems(orderItems.filter((_, idx) => idx !== i));

  const handleUpdateQty = (i: number, rawValue: string) => {
    const updated = [...orderItems];
    if (rawValue === '') {
      updated[i] = { ...updated[i], quantity: '' as any };
      setOrderItems(updated);
      return;
    }
    const parsed = parseInt(rawValue, 10);
    if (isNaN(parsed)) {
      updated[i] = { ...updated[i], quantity: '' as any };
      setOrderItems(updated);
      return;
    }
    const item = updated[i];
    const prod = products.find((p) => getNormalizedId(p) === String(item.productId));
    const stock = prod?.currentStock !== undefined ? prod.currentStock : Infinity;

    let qty = Math.max(0, parsed);
    if (stock !== Infinity && qty > stock) {
      qty = stock;
      setFormError(`Quantity for ${item.productName} cannot exceed available stock (${stock}).`);
    } else {
      setFormError('');
    }

    const withQty = lineWithTax({ ...updated[i], quantity: qty });
    updated[i] = withQty;
    setOrderItems(updated);

    // Qty breaks may change price-list / negotiated applicability
    if (!withQty.manualPriceOverride && customerIdForPricing()) {
      void resolvePriceForProduct(String(withQty.productId), qty).then((resolved) => {
        if (!resolved) return;
        setOrderItems((prev) => {
          const copy = [...prev];
          if (!copy[i] || copy[i].manualPriceOverride) return prev;
          copy[i] = applyResolvedToOrderLine({ ...copy[i], quantity: qty }, resolved);
          return copy;
        });
      });
    }
  };

  const handleBlurQty = (i: number, rawValue: string) => {
    const parsed = parseInt(rawValue, 10);
    const item = orderItems[i];
    const prod = products.find((p) => getNormalizedId(p) === String(item?.productId));
    const stock = prod?.currentStock !== undefined ? prod.currentStock : Infinity;

    let qty = isNaN(parsed) || parsed < 1 ? 1 : parsed;
    if (stock !== Infinity && qty > stock) {
      qty = stock;
      setFormError(`Quantity for ${item?.productName || 'product'} cannot exceed available stock (${stock}).`);
    }

    const updated = [...orderItems];
    updated[i] = lineWithTax({ ...updated[i], quantity: qty });
    setOrderItems(updated);

    if (!updated[i].manualPriceOverride && customerIdForPricing()) {
      void resolvePriceForProduct(String(updated[i].productId), qty).then((resolved) => {
        if (!resolved) return;
        setOrderItems((prev) => {
          const copy = [...prev];
          if (!copy[i] || copy[i].manualPriceOverride) return prev;
          copy[i] = applyResolvedToOrderLine({ ...copy[i], quantity: qty }, resolved);
          return copy;
        });
      });
    }
  };

  const handleUpdateUnitPrice = (i: number, raw: string) => {
    const price = parseFloat(raw);
    const updated = [...orderItems];
    const qty =
      typeof updated[i].quantity === 'number'
        ? updated[i].quantity
        : parseInt(String(updated[i].quantity), 10) || 1;
    updated[i] = lineWithTax({
      ...updated[i],
      unitPrice: Number.isFinite(price) && price >= 0 ? price : 0,
      totalPrice: (Number.isFinite(price) && price >= 0 ? price : 0) * qty,
      manualPriceOverride: true,
      pricingSource: 'MANUAL',
    });
    setOrderItems(updated);
    setPricingBanner('Manual price override — customer pricing will not overwrite this line.');
  };

  const handleUpdateTaxRate = (i: number, rate: number) => {
    const updated = [...orderItems];
    updated[i] = lineWithTax({ ...updated[i], taxRate: rate });
    setOrderItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!selectedCustomer && !customerName.trim()) {
      setFormError('Please select a customer');
      return;
    }
    if (orderItems.length === 0) {
      setFormError('⚠️ Please select at least one product from the catalog before creating the order');
      return;
    }

    const resolvedLocationId =
      !locationCtx.isAllLocations && locationCtx.locationIdForApi
        ? locationCtx.locationIdForApi
        : undefined;

    setIsSubmitting(true);
    try {
      const shippingAddr = { street: shippingStreet, city: shippingCity, state: shippingState, postalCode: shippingPostalCode, country: shippingCountry };
      const billingAddr = sameAsShipping ? shippingAddr : { street: billingStreet, city: billingCity, state: billingState, postalCode: billingPostalCode, country: billingCountry };

      const payload = {
        customerId: selectedCustomer?.id || selectedCustomer?._id || undefined,
        customerName, customerEmail, customerPhone, customerType,
        customerCompany, customerTaxId,
        ...(resolvedLocationId ? { locationId: resolvedLocationId } : {}),
        shippingAddress: shippingAddr,
        billingAddress: billingAddr,
        items: orderItems.map((item) => {
          const parsed = parseInt(item.quantity as any, 10);
          const cleanQty = isNaN(parsed) || parsed < 1 ? 1 : parsed;
          const taxed = lineWithTax({ ...item, quantity: cleanQty });
          return {
            ...taxed,
            quantity: cleanQty,
            productId: String(item.productId || ''),
            taxRate: taxed.taxRate || 0,
            taxAmount: taxed.taxAmount || 0,
            manualPriceOverride: Boolean(item.manualPriceOverride),
            pricingSource: item.pricingSource || undefined,
            priceSource: item.manualPriceOverride ? 'MANUAL' : item.pricingSource,
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
      };

      if (isEditing) {
        const orderId = String(orderToEdit?.id || orderToEdit?._id || '');
        await salesOrderService.updateOrder(orderId, payload);
      } else {
        await salesOrderService.createOrder(payload);
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || `An error occurred while ${isEditing ? 'updating' : 'creating'} the order`);
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
          {isEditing ? <Edit3 className="w-6 h-6 text-[#014582]" /> : <Plus className="w-6 h-6 text-[#014582]" />}
          {isEditing ? 'Edit Sales Order' : 'Create Sales Order'}
        </h1>
        <button type="button" onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>

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
          <label className="block text-sm font-medium text-gray-700 mb-1">Search Customer *</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowCustomerModal(true)}
              className="flex-1 flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 hover:border-[#014582] hover:bg-blue-50 transition-all text-left focus:ring-2 focus:ring-[#014582] focus:outline-none"
            >
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-400 flex-1">
                {selectedCustomer ? 'Change customer…' : 'Search and select customer…'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => setShowAddCustomerModal(true)}
              className="px-3 py-2.5 border border-[#014582]/30 bg-[#014582]/5 text-[#014582] rounded-lg hover:bg-[#014582] hover:text-white transition-all"
              title="Add new customer"
            >
              <Plus className="w-4 h-4" />
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
        </div>

        {selectedCustomer ? (
          <div className="rounded-xl border border-[#014582]/20 bg-gradient-to-br from-[#014582]/5 to-white p-4 flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#014582] flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white text-sm font-bold">
                {selectedCustomer.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900 truncate">{selectedCustomer.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                {selectedCustomer.customerNumber && (
                  <span className="font-mono text-[#014582]/80">#{selectedCustomer.customerNumber}</span>
                )}
                {selectedCustomer.email && <span className="truncate">{selectedCustomer.email}</span>}
                {selectedCustomer.phone && <span>{selectedCustomer.phone}</span>}
                {(selectedCustomer.company || selectedCustomer.companyName || selectedCustomer.customerType) && (
                  <span className="text-gray-400">
                    {[
                      selectedCustomer.customerType,
                      selectedCustomer.company || selectedCustomer.companyName,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                )}
              </div>
            </div>
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              Selected
            </span>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-xs text-gray-400">
            No customer selected yet. Use search above to pick a customer.
          </div>
        )}
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

        {pricingBanner && (
          <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
            {pricingBanner}
          </div>
        )}

        {/* ── CATALOG PRODUCT PICKER ONLY ── */}
        <div className="p-5 bg-sky-50/70 border border-sky-150 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-sky-950">Select Products from Catalog</p>
              <p className="text-xs text-sky-700">
                Click below to open the product catalog modal, browse stock levels, and pick products for this order.
                {selectedCustomer
                  ? ' Active negotiated / price-list prices load for the selected customer.'
                  : ' Select a customer first for negotiated pricing.'}
              </p>
            </div>
          </div>
          <ProductPicker
            selected={[]}
            onChange={handleBulkAddProducts}
            multiple
            placeholder="📦 Browse & Select Products from Catalog Modal…"
          />
        </div>

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
                {orderItems.map((item, i) => {
                  const prod = products.find((p) => getNormalizedId(p) === String(item.productId));
                  const stock = prod?.currentStock !== undefined ? prod.currentStock : 999999;

                  return (
                    <tr key={item.productId || item.sku || `order-item-${i}`} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-800">
                        {item.productName}
                        {stock < 999999 && (
                          <span className="block text-[11px] text-gray-400">Stock: {stock} available</span>
                        )}
                        {item.pricingSource === 'CUSTOMER_NEGOTIATED' && (
                          <span className="block text-[10px] font-semibold text-emerald-700">
                            Negotiated
                            {item.listPrice != null && item.listPrice !== item.unitPrice
                              ? ` · list ${formatAmount(Number(item.listPrice))}`
                              : ''}
                          </span>
                        )}
                        {item.pricingSource === 'PRICE_LIST' && (
                          <span className="block text-[10px] font-semibold text-[#014582]">
                            Price list
                          </span>
                        )}
                        {item.manualPriceOverride && (
                          <span className="block text-[10px] font-semibold text-amber-700">
                            Manual override
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-gray-500">{item.sku}</td>
                      <td className="px-4 py-2 text-right text-gray-600">
                        <SalesNumberInput
                          min={0}
                          step={0.01}
                          value={item.unitPrice}
                          onChange={(val) => handleUpdateUnitPrice(i, String(val))}
                          className="w-24 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-[#014582] outline-none text-right inline-block"
                        />
                      </td>
                      <td className="px-4 py-2 text-right min-w-[100px]">
                        <SalesNumberInput
                          min={1}
                          max={stock}
                          value={typeof item.quantity === 'number' ? item.quantity : 1}
                          onChange={(val) => handleUpdateQty(i, String(val))}
                          className="w-20 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-[#014582] outline-none text-center inline-block"
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
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(i)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Remove product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
          <div className="p-6 border-2 border-dashed border-sky-200 rounded-xl bg-sky-50/40 text-center space-y-2">
            <Package className="w-8 h-8 text-[#014582] mx-auto opacity-60" />
            <p className="text-sm font-semibold text-gray-800">No products added to order yet</p>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Please click <strong>"Browse & Select Products"</strong> above to pick products from the catalog modal before submitting the order.
            </p>
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
            ? <><Loader2 className="w-4 h-4 animate-spin" /> {isEditing ? 'Saving...' : 'Creating...'}</>
            : isEditing
              ? <><Save className="w-4 h-4" /> Save Changes</>
              : <><CheckCircle className="w-4 h-4" /> Create Order</>}
        </button>
      </div>
      <CustomerPickerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelect={handleCustomerSelect}
      />

      {showAddCustomerModal && (
        <CustomerFormModal
          saving={savingCustomer}
          onCancel={() => setShowAddCustomerModal(false)}
          onSave={async (data) => {
            setSavingCustomer(true);
            try {
              const created = await customerService.createCustomer(data);
              setShowAddCustomerModal(false);
              handleCustomerSelect(created);
            } catch (err: any) {
              alert(err?.message || 'Failed to create customer');
            } finally {
              setSavingCustomer(false);
            }
          }}
        />
      )}
    </form>
  );
}

export default function SalesRoutePlaceholder() {
  return null;
}