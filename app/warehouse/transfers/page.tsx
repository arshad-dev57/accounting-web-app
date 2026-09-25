'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeftRight, Search, Plus, RefreshCw, Calendar, MapPin,
  CheckCircle, Clock, Truck, PackageCheck, AlertTriangle, XCircle,
  Eye, Edit, Trash2, X, ChevronRight, ChevronLeft, Check, AlertCircle, Loader2,
  FileText, ArrowRight, ArrowDownRight, Layers, Package, ChevronDown
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

// ─── TYPES ───────────────────────────────────────────────────
interface Location {
  id: string;
  name: string;
  code?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  unit?: string;
  availableStock?: number;
}

interface TransferItem {
  id?: string;
  productId: string;
  productName: string;
  productSku?: string;
  requestedQty: number;
  dispatchedQty?: number;
  receivedQty?: number;
  notes?: string;
  product?: Product;
}

interface TransferHistory {
  id: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  note?: string;
  userName: string;
  createdAt: string;
}

interface InternalTransfer {
  id: string;
  transferNumber: string;
  companyId: string;
  fromLocationId: string;
  fromLocation?: Location;
  toLocationId: string;
  toLocation?: Location;
  status: 'Draft' | 'Confirmed' | 'InTransit' | 'Received' | 'Done' | 'Cancelled';
  transferDate: string;
  expectedDate?: string;
  priority?: 'Normal' | 'High' | 'Urgent';
  reference?: string;
  reason?: string;
  notes?: string;
  cancelReason?: string;
  confirmedAt?: string;
  dispatchedAt?: string;
  receivedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  creator?: { id: string; name: string };
  totalItems?: number;
  totalRequestedQty?: number;
  totalDispatchedQty?: number;
  totalReceivedQty?: number;
  items: TransferItem[];
  history?: TransferHistory[];
}

// ─── STATUS BADGE COMPONENT ──────────────────────────────────
function StatusBadge({ status }: { status: InternalTransfer['status'] }) {
  const configs: Record<InternalTransfer['status'], { bg: string; text: string; icon: any }> = {
    Draft:     { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
    Confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
    InTransit: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Truck },
    Received:  { bg: 'bg-purple-100', text: 'text-purple-700', icon: PackageCheck },
    Done:      { bg: 'bg-green-100', text: 'text-green-700', icon: Check },
    Cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  };

  const config = configs[status] || configs.Draft;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  );
}

// ─── PRIORITY BADGE ──────────────────────────────────────────
function PriorityBadge({ priority = 'Normal' }: { priority?: string }) {
  const colors: Record<string, string> = {
    Normal: 'bg-gray-100 text-gray-600',
    High: 'bg-orange-100 text-orange-700',
    Urgent: 'bg-red-100 text-red-700 font-bold',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${colors[priority] || colors.Normal}`}>
      {priority}
    </span>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────
export function WarehouseTransfersPage() {
  const [transfers, setTransfers] = useState<InternalTransfer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1, hasNext: false, hasPrev: false });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromLocFilter, setFromLocFilter] = useState('');
  const [toLocFilter, setToLocFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<InternalTransfer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'dispatch' | 'receive' | 'cancel' | null;
    transfer: InternalTransfer | null;
  }>({ isOpen: false, type: null, transfer: null });

  // Form State
  const [formData, setFormData] = useState<{
    fromLocationId: string;
    toLocationId: string;
    transferDate: string;
    expectedDate: string;
    priority: 'Normal' | 'High' | 'Urgent';
    reference: string;
    reason: string;
    notes: string;
    items: { productId: string; productName: string; productSku: string; requestedQty: number; availableStock: number; notes: string }[];
  }>({
    fromLocationId: '',
    toLocationId: '',
    transferDate: new Date().toISOString().split('T')[0],
    expectedDate: '',
    priority: 'Normal',
    reference: '',
    reason: '',
    notes: '',
    items: [],
  });

  // Action input state
  const [receiveQtyMap, setReceiveQtyMap] = useState<Record<string, number>>({});
  const [cancelReasonText, setCancelReasonText] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Product picker state
  const [productList, setProductList] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ─── FETCH LOCATIONS ──────────────────────────────────────
  const fetchLocations = async () => {
    try {
      const res = await apiClient.get('/api/warehouse/locations');
      if (res.data?.success) {
        setLocations(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load locations', err);
    }
  };

  // ─── FETCH PRODUCTS ───────────────────────────────────────
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await apiClient.get('/api/warehouse/products?limit=200');
      if (res.data?.success) {
        setProductList(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // ─── FETCH TRANSFERS ──────────────────────────────────────
  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (fromLocFilter) params.append('fromLocationId', fromLocFilter);
      if (toLocFilter) params.append('toLocationId', toLocFilter);

      const res = await apiClient.get(`/api/warehouse/transfers?${params.toString()}`);
      if (res.data?.success) {
        setTransfers(res.data.data || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch transfers', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, fromLocFilter, toLocFilter]);

  useEffect(() => {
    fetchLocations();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  // ─── CHECK PRODUCT STOCK AT SOURCE ────────────────────────
  const fetchStockForProduct = async (productId: string, locationId: string) => {
    if (!productId) return 0;
    try {
      if (locationId) {
        const res = await apiClient.get(`/api/warehouse/transfers/product-stock?productId=${productId}&locationId=${locationId}`);
        if (res.data?.success && res.data.data) {
          const avail = res.data.data.availableStock ?? res.data.data.currentStock ?? 0;
          if (avail > 0) return avail;
        }
      }
    } catch (e) {
      console.error('Failed to fetch stock', e);
    }
    const prod = productList.find(p => p.id === productId);
    return (prod as any)?.availableStock ?? (prod as any)?.currentStock ?? (prod as any)?.locationStock ?? 0;
  };

  // Re-check stock for all items when source location is selected/changed
  useEffect(() => {
    if (!formData.items.some(i => i.productId)) return;
    const updateItemsStock = async () => {
      const updated = await Promise.all(
        formData.items.map(async (item) => {
          if (!item.productId) return item;
          const avail = await fetchStockForProduct(item.productId, formData.fromLocationId);
          return { ...item, availableStock: avail };
        })
      );
      setFormData(prev => ({ ...prev, items: updated }));
    };
    updateItemsStock();
  }, [formData.fromLocationId]);

  // ─── FORM HANDLERS ────────────────────────────────────────
  const handleAddItemRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { productId: '', productName: '', productSku: '', requestedQty: 1, availableStock: 0, notes: '' }
      ]
    }));
  };

  const handleRemoveItemRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleProductSelect = async (index: number, productId: string) => {
    const prod = productList.find(p => p.id === productId);
    if (!prod) return;

    const avail = await fetchStockForProduct(productId, formData.fromLocationId);

    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku || '',
        availableStock: avail,
      };
      return { ...prev, items: newItems };
    });
  };

  const handleItemQtyChange = (index: number, qty: number) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], requestedQty: Math.max(1, qty) };
      return { ...prev, items: newItems };
    });
  };

  const handleCreateTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fromLocationId || !formData.toLocationId) {
      showToast('Please select both Source and Destination locations', 'error');
      return;
    }
    if (formData.fromLocationId === formData.toLocationId) {
      showToast('Source and Destination locations cannot be the same', 'error');
      return;
    }
    if (formData.items.length === 0) {
      showToast('Please add at least one product item', 'error');
      return;
    }

    for (const item of formData.items) {
      if (!item.productId) {
        showToast('Please select a product for all rows', 'error');
        return;
      }
      if (!item.requestedQty || item.requestedQty <= 0) {
        showToast(`Quantity must be > 0 for ${item.productName}`, 'error');
        return;
      }
    }

    try {
      setSubmittingAction(true);
      const payload = {
        fromLocationId: formData.fromLocationId,
        toLocationId: formData.toLocationId,
        transferDate: formData.transferDate,
        expectedDate: formData.expectedDate || null,
        priority: formData.priority,
        reference: formData.reference,
        reason: formData.reason,
        notes: formData.notes,
        items: formData.items.map(i => ({
          productId: i.productId,
          requestedQty: i.requestedQty,
          notes: i.notes,
        })),
      };

      const res = await apiClient.post('/api/warehouse/transfers', payload);
      if (res.data?.success) {
        showToast('Internal transfer created successfully!');
        setIsCreateOpen(false);
        // Reset form
        setFormData({
          fromLocationId: '',
          toLocationId: '',
          transferDate: new Date().toISOString().split('T')[0],
          expectedDate: '',
          priority: 'Normal',
          reference: '',
          reason: '',
          notes: '',
          items: [],
        });
        fetchTransfers();
      } else {
        showToast(res.data?.message || 'Failed to create transfer', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Error creating transfer', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  // ─── ACTION EXECUTION ─────────────────────────────────────
  const executeTransferAction = async (id: string, action: 'confirm' | 'dispatch' | 'receive' | 'complete' | 'cancel', payload: any = {}) => {
    try {
      setSubmittingAction(true);
      const res = await apiClient.post(`/api/warehouse/transfers/${id}/${action}`, payload);
      if (res.data?.success) {
        showToast(`Transfer ${action}ed successfully!`);
        setActionModal({ isOpen: false, type: null, transfer: null });
        if (isDetailOpen && selectedTransfer?.id === id) {
          setSelectedTransfer(res.data.data);
        }
        fetchTransfers();
      } else {
        showToast(res.data?.message || `Failed to ${action} transfer`, 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || `Error during ${action}`, 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Fetch full details of transfer
  const openTransferDetails = async (id: string) => {
    try {
      const res = await apiClient.get(`/api/warehouse/transfers/${id}`);
      if (res.data?.success) {
        setSelectedTransfer(res.data.data);
        setIsDetailOpen(true);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch details', 'error');
    }
  };

  // Open action modal
  const openActionModal = (transfer: InternalTransfer, type: 'dispatch' | 'receive' | 'cancel') => {
    if (type === 'receive') {
      const initialMap: Record<string, number> = {};
      transfer.items.forEach(item => {
        if (item.id) {
          initialMap[item.id] = item.dispatchedQty ?? item.requestedQty;
        }
      });
      setReceiveQtyMap(initialMap);
    }
    if (type === 'cancel') {
      setCancelReasonText('');
    }
    setActionModal({ isOpen: true, type, transfer });
  };

  // Calculate summary counts
  const totalCount = pagination.total || transfers.length;
  const draftCount = transfers.filter(t => t.status === 'Draft').length;
  const inTransitCount = transfers.filter(t => t.status === 'InTransit').length;
  const doneCount = transfers.filter(t => t.status === 'Done').length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs md:text-sm font-medium border transition-all animate-bounce ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 md:w-6 md:h-6 text-[#014582]" />
          Internal Warehouse Transfers
          <span className="text-xs md:text-sm font-normal text-gray-400 ml-1 md:ml-2">({totalCount} transfers)</span>
        </h2>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button
            onClick={() => fetchTransfers()}
            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-[#014582] transition-all"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => {
              handleAddItemRow();
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-[#014582] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[#01366a] transition-all shadow-lg shadow-[#014582]/25"
          >
            <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> New Transfer
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Transfers</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{totalCount}</p>
          </div>
          <div className="p-3 bg-[#014582]/10 rounded-xl text-[#014582]">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Draft / Pending</p>
            <p className="text-xl md:text-2xl font-bold text-gray-700 mt-1">{draftCount}</p>
          </div>
          <div className="p-3 bg-gray-100 rounded-xl text-gray-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">In Transit</p>
            <p className="text-xl md:text-2xl font-bold text-amber-700 mt-1">{inTransitCount}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Completed</p>
            <p className="text-xl md:text-2xl font-bold text-emerald-700 mt-1">{doneCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[160px] md:min-w-[220px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transfer #, ref, reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 md:pl-9 pr-3 md:pr-4 py-1.5 md:py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="relative min-w-[130px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none w-full px-3 md:px-4 py-1.5 md:py-2 pr-8 md:pr-10 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 text-gray-700 font-medium"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Confirmed">Confirmed</option>
              <option value="InTransit">In Transit</option>
              <option value="Received">Received</option>
              <option value="Done">Done</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Source Location */}
          <div className="relative min-w-[140px]">
            <select
              value={fromLocFilter}
              onChange={(e) => setFromLocFilter(e.target.value)}
              className="appearance-none w-full px-3 md:px-4 py-1.5 md:py-2 pr-8 md:pr-10 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 text-gray-700 font-medium"
            >
              <option value="">From: All Locations</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Destination Location */}
          <div className="relative min-w-[140px]">
            <select
              value={toLocFilter}
              onChange={(e) => setToLocFilter(e.target.value)}
              className="appearance-none w-full px-3 md:px-4 py-1.5 md:py-2 pr-8 md:pr-10 border border-gray-200 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none bg-gray-50 text-gray-700 font-medium"
            >
              <option value="">To: All Locations</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Transfers Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Transfer No</th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">From Location</th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">To Location</th>
                <th className="text-center px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                <th className="text-center px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Qty</th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="text-left px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-3 md:px-6 py-2 md:py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 md:py-12">
                    <Loader2 className="w-6 h-6 md:w-8 md:h-8 mx-auto text-[#014582] animate-spin" />
                    <p className="mt-2 text-xs md:text-sm text-gray-500">Loading transfers...</p>
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 md:py-12 text-gray-400">
                    <ArrowLeftRight className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 text-gray-300" />
                    <p className="text-sm md:text-lg font-medium text-gray-500">No internal transfers found</p>
                    <p className="text-xs md:text-sm text-gray-400">Try adjusting search query or filters</p>
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-3 md:px-6 py-2 md:py-3 font-mono text-xs md:text-sm font-semibold text-[#014582]">
                      <button
                        onClick={() => openTransferDetails(t.id)}
                        className="hover:underline flex items-center gap-1.5"
                      >
                        {t.transferNumber}
                      </button>
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-3 text-gray-600 text-xs md:text-sm">
                      {new Date(t.transferDate).toLocaleDateString()}
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-3 font-medium text-gray-800 text-xs md:text-sm">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {t.fromLocation?.name || '—'}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-3 font-medium text-gray-800 text-xs md:text-sm">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#014582]" />
                        {t.toLocation?.name || '—'}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-3 text-center text-gray-700 text-xs md:text-sm">
                      {t.totalItems ?? t.items?.length ?? 0}
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-3 text-center font-semibold text-gray-800 text-xs md:text-sm">
                      {t.totalRequestedQty ?? 0}
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-3">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openTransferDetails(t.id)}
                          className="p-1 md:p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>

                        {/* Status actions */}
                        {t.status === 'Draft' && (
                          <>
                            <button
                              onClick={() => executeTransferAction(t.id, 'confirm')}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors border border-blue-200"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => openActionModal(t, 'cancel')}
                              className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {t.status === 'Confirmed' && (
                          <>
                            <button
                              onClick={() => openActionModal(t, 'dispatch')}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg transition-colors border border-amber-200 flex items-center gap-1"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              Dispatch
                            </button>
                            <button
                              onClick={() => openActionModal(t, 'cancel')}
                              className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {t.status === 'InTransit' && (
                          <button
                            onClick={() => openActionModal(t, 'receive')}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg transition-colors border border-purple-200 flex items-center gap-1"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            Receive
                          </button>
                        )}

                        {t.status === 'Received' && (
                          <button
                            onClick={() => executeTransferAction(t.id, 'complete')}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg transition-colors border border-emerald-200 flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Complete
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
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.pages > 1 && (
        <div className="flex flex-col xs:flex-row items-center justify-between gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
          <p className="text-[10px] md:text-sm text-gray-500 text-center xs:text-left">
            Showing {(pagination.page - 1) * pagination.limit + 1} –{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} transfers
          </p>
          <div className="flex gap-1 md:gap-2">
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page <= 1}
              className="p-1.5 md:p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
            <span className="px-2 md:px-4 py-1 md:py-2 bg-[#014582]/10 text-[#014582] font-semibold rounded-lg text-xs md:text-sm">
              {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= pagination.pages}
              className="p-1.5 md:p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── CREATE TRANSFER MODAL ──────────────────────────────── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl my-4 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-[#014582]/5 to-transparent">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-[#014582]" />
                <h2 className="text-xl font-bold text-gray-900">Create Internal Warehouse Transfer</h2>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateTransferSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Header Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Source Location (From) *
                  </label>
                  <select
                    required
                    value={formData.fromLocationId}
                    onChange={(e) => setFormData(p => ({ ...p, fromLocationId: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                  >
                    <option value="">Select Source Location</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Destination Location (To) *
                  </label>
                  <select
                    required
                    value={formData.toLocationId}
                    onChange={(e) => setFormData(p => ({ ...p, toLocationId: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                  >
                    <option value="">Select Destination Location</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Transfer Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.transferDate}
                    onChange={(e) => setFormData(p => ({ ...p, transferDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Expected Date</label>
                  <input
                    type="date"
                    value={formData.expectedDate}
                    onChange={(e) => setFormData(p => ({ ...p, expectedDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(p => ({ ...p, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Reference / PO #</label>
                  <input
                    type="text"
                    placeholder="e.g. TRF-REQ-2026-001"
                    value={formData.reference}
                    onChange={(e) => setFormData(p => ({ ...p, reference: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-[#014582] focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Transfer Line Items</h3>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#014582] text-[#014582] bg-[#014582]/5 hover:bg-[#014582]/10 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Product
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-3 py-2.5">Product</th>
                        <th className="px-3 py-2.5 text-center">Available Stock</th>
                        <th className="px-3 py-2.5 text-center">Requested Qty</th>
                        <th className="px-3 py-2.5">Notes</th>
                        <th className="px-3 py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {formData.items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-gray-400">
                            No products added yet. Click &quot;Add Product&quot; above.
                          </td>
                        </tr>
                      ) : (
                        formData.items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <select
                                required
                                value={item.productId}
                                onChange={(e) => handleProductSelect(index, e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded text-gray-800 focus:ring-2 focus:ring-[#014582] outline-none"
                              >
                                <option value="">Select Product...</option>
                                {productList.map(p => (
                                  <option key={p.id} value={p.id}>{p.name} ({p.sku || 'No SKU'})</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2 text-center font-mono">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                item.availableStock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {item.availableStock}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="number"
                                min={1}
                                value={item.requestedQty}
                                onChange={(e) => handleItemQtyChange(index, parseInt(e.target.value) || 1)}
                                className="w-20 text-center px-2 py-1 bg-white border border-gray-200 rounded font-bold text-gray-900 focus:ring-2 focus:ring-[#014582] outline-none"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                placeholder="Optional line note"
                                value={item.notes}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormData(p => {
                                    const next = [...p.items];
                                    next[index].notes = val;
                                    return { ...p, items: next };
                                  });
                                }}
                                className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-gray-700 focus:ring-2 focus:ring-[#014582] outline-none"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveItemRow(index)}
                                className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes / Reason */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Transfer Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. Stock balancing across stores"
                    value={formData.reason}
                    onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-[#014582] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Additional Notes</label>
                  <input
                    type="text"
                    placeholder="Special instructions or batch details..."
                    value={formData.notes}
                    onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-[#014582] outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="flex items-center gap-2 px-5 py-2 bg-[#014582] hover:bg-[#01366a] disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#014582]/25 transition-all"
                >
                  {submittingAction && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── TRANSFER DETAILS & WORKFLOW MODAL ─────────────────── */}
      {isDetailOpen && selectedTransfer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl my-4 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-[#014582]/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-[#014582]/10 text-[#014582] font-mono font-bold rounded-lg text-sm">
                  {selectedTransfer.transferNumber}
                </div>
                <StatusBadge status={selectedTransfer.status} />
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Stepper Timeline */}
              <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  {['Draft', 'Confirmed', 'InTransit', 'Received', 'Done'].map((st, idx, arr) => {
                    const statusOrder = ['Draft', 'Confirmed', 'InTransit', 'Received', 'Done'];
                    const currentIdx = statusOrder.indexOf(selectedTransfer.status);
                    const isPassed = currentIdx >= idx;
                    const isCurrent = selectedTransfer.status === st;

                    return (
                      <div key={st} className="flex-1 flex items-center">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${
                            isCurrent ? 'bg-[#014582] text-white ring-4 ring-[#014582]/20' :
                            isPassed ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {isPassed && !isCurrent ? <Check className="w-4 h-4" /> : idx + 1}
                          </div>
                          <span className={`mt-1 font-semibold text-[11px] ${isCurrent ? 'text-[#014582]' : isPassed ? 'text-gray-800' : 'text-gray-400'}`}>
                            {st}
                          </span>
                        </div>
                        {idx < arr.length - 1 && (
                          <div className={`flex-1 h-1 mx-2 rounded ${isPassed && currentIdx > idx ? 'bg-emerald-600' : 'bg-gray-200'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Information Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Source Location</span>
                  <p className="font-bold text-gray-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {selectedTransfer.fromLocation?.name}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Destination Location</span>
                  <p className="font-bold text-gray-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#014582]" />
                    {selectedTransfer.toLocation?.name}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Transfer Date & Priority</span>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">{new Date(selectedTransfer.transferDate).toLocaleDateString()}</span>
                    <PriorityBadge priority={selectedTransfer.priority} />
                  </div>
                </div>
              </div>

              {/* Transfer Line Items Table */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Line Items</h3>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3 text-center">Requested Qty</th>
                        <th className="px-4 py-3 text-center">Dispatched Qty</th>
                        <th className="px-4 py-3 text-center">Received Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedTransfer.items?.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-800">{item.product?.name || item.productName}</td>
                          <td className="px-4 py-3 font-mono text-gray-500">{item.product?.sku || item.productSku || '—'}</td>
                          <td className="px-4 py-3 text-center font-bold text-gray-900">{item.requestedQty}</td>
                          <td className="px-4 py-3 text-center text-amber-700 font-bold">{item.dispatchedQty ?? '—'}</td>
                          <td className="px-4 py-3 text-center text-emerald-700 font-bold">{item.receivedQty ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit / History Trail */}
              {selectedTransfer.history && selectedTransfer.history.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Workflow Audit Trail</h3>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                    {selectedTransfer.history.map(h => (
                      <div key={h.id} className="flex items-start gap-3 text-xs border-l-2 border-[#014582] pl-3 py-0.5">
                        <div className="flex-1">
                          <span className="font-bold text-gray-800">{h.action}</span>
                          {h.note && <span className="text-gray-500 ml-2">— {h.note}</span>}
                        </div>
                        <div className="text-gray-400">
                          <span>{h.userName}</span> • <span>{new Date(h.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with Actions */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="text-xs text-gray-500">
                Created by <span className="text-gray-800 font-semibold">{selectedTransfer.creator?.name || 'User'}</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedTransfer.status === 'Draft' && (
                  <button
                    onClick={() => executeTransferAction(selectedTransfer.id, 'confirm')}
                    className="px-4 py-2 bg-[#014582] hover:bg-[#01366a] text-white text-xs font-semibold rounded-lg shadow-md shadow-[#014582]/20"
                  >
                    Confirm Transfer
                  </button>
                )}
                {selectedTransfer.status === 'Confirmed' && (
                  <button
                    onClick={() => openActionModal(selectedTransfer, 'dispatch')}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-amber-600/20"
                  >
                    Dispatch Stock
                  </button>
                )}
                {selectedTransfer.status === 'InTransit' && (
                  <button
                    onClick={() => openActionModal(selectedTransfer, 'receive')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-purple-600/20"
                  >
                    Receive Stock
                  </button>
                )}
                {selectedTransfer.status === 'Received' && (
                  <button
                    onClick={() => executeTransferAction(selectedTransfer.id, 'complete')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-emerald-600/20"
                  >
                    Complete Transfer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ACTION DIALOG MODALS (DISPATCH / RECEIVE / CANCEL) ───── */}
      {actionModal.isOpen && actionModal.transfer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            {/* Title */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-lg capitalize">
                {actionModal.type === 'dispatch' && 'Dispatch Transfer Stock'}
                {actionModal.type === 'receive' && 'Receive Transfer Stock'}
                {actionModal.type === 'cancel' && 'Cancel Transfer'}
              </h3>
              <button
                onClick={() => setActionModal({ isOpen: false, type: null, transfer: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body per type */}
            {actionModal.type === 'dispatch' && (
              <p className="text-sm text-gray-600">
                Dispatching will deduct stock from <span className="text-amber-700 font-semibold">{actionModal.transfer.fromLocation?.name}</span> and update status to <span className="text-amber-700 font-semibold">InTransit</span>.
              </p>
            )}

            {actionModal.type === 'receive' && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-500">Specify received quantity for each item:</p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {actionModal.transfer.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                      <div>
                        <p className="font-bold text-gray-800">{item.product?.name || item.productName}</p>
                        <p className="text-gray-500">Dispatched: {item.dispatchedQty ?? item.requestedQty}</p>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={item.dispatchedQty ?? item.requestedQty}
                        value={item.id ? (receiveQtyMap[item.id] ?? (item.dispatchedQty ?? item.requestedQty)) : 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          if (item.id) {
                            setReceiveQtyMap(p => ({ ...p, [item.id!]: val }));
                          }
                        }}
                        className="w-20 text-center py-1 bg-white border border-gray-300 rounded font-bold text-emerald-700 focus:ring-2 focus:ring-[#014582] outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {actionModal.type === 'cancel' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Reason for Cancellation</label>
                <textarea
                  rows={3}
                  placeholder="Enter reason..."
                  value={cancelReasonText}
                  onChange={(e) => setCancelReasonText(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-[#014582] outline-none"
                />
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setActionModal({ isOpen: false, type: null, transfer: null })}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={submittingAction}
                onClick={() => {
                  if (actionModal.type === 'dispatch') {
                    executeTransferAction(actionModal.transfer!.id, 'dispatch');
                  } else if (actionModal.type === 'receive') {
                    const receivedItems = Object.entries(receiveQtyMap).map(([id, receivedQty]) => ({
                      id,
                      receivedQty,
                    }));
                    executeTransferAction(actionModal.transfer!.id, 'receive', { items: receivedItems });
                  } else if (actionModal.type === 'cancel') {
                    executeTransferAction(actionModal.transfer!.id, 'cancel', { cancelReason: cancelReasonText });
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#014582] hover:bg-[#01366a] text-white text-xs font-semibold rounded-lg shadow-md shadow-[#014582]/20"
              >
                {submittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Next.js route shell default export
export default function WarehouseTransfersRoutePlaceholder() {
  return null;
}
