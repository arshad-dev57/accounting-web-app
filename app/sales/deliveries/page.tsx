'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  Plus, Search, RefreshCw, Truck, Clock, 
  CheckCircle, Loader2, X, ChevronDown, Eye, Trash2, MapPin, Edit3, Save
} from 'lucide-react';
import { Delivery, DeliveryStats } from '@/types/delivery';
import CreateDeliveryWizard from '@/components/deliveries/CreateDeliveryWizard';
import { useLocation } from '@/lib/location-context';

const STATUS_COLORS: Record<string, string> = {
  'Pending': 'bg-orange-100 text-orange-700',
  'Partially Delivered': 'bg-blue-100 text-blue-700',
  'Delivered': 'bg-green-100 text-green-700',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  'Unpaid': 'bg-red-100 text-red-700',
  'Partially Paid': 'bg-yellow-100 text-yellow-700',
  'Paid': 'bg-green-100 text-green-700',
  'Overdue': 'bg-red-100 text-red-800',
};

const pill = (map: Record<string, string>, val: string) =>
  `text-xs font-semibold px-2.5 py-1 rounded-full ${map[val] ?? 'bg-gray-100 text-gray-700'}`;

const STATUS_OPTIONS = ['all', 'Pending', 'Partially Delivered', 'Delivered'];

export function DeliveriesPage() {
  const { selectedLocationId, selectedLocation } = useLocation();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deliveryStartEditing, setDeliveryStartEditing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const pageLimit = 10;
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState<DeliveryStats>({
    total: 0,
    pending: 0,
    partiallyDelivered: 0,
    delivered: 0,
  });

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageLimit.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (selectedLocationId) params.append('locationId', selectedLocationId);

      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/deliveries?${params.toString()}`, {
        headers,
      });
      const result = await response.json();

      if (!response.ok || result.success === false) {
        console.error('Failed to fetch deliveries:', result.message || response.status);
        setDeliveries([]);
        return;
      }

      const rows = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.data?.data)
          ? result.data.data
          : [];
      setDeliveries(rows);

      const pagination = result.pagination || result.data?.pagination;
      if (pagination) {
        setTotalRecords(pagination.total || 0);
        setTotalPages(pagination.pages || 1);
        setHasNext(Boolean(pagination.hasNext));
        setHasPrev(Boolean(pagination.hasPrev));
      } else {
        setTotalRecords(rows.length);
      }

      const kpi = result.kpi || result.data?.kpi;
      if (kpi) {
        setStats({
          total: kpi.total || 0,
          pending: kpi.pending || 0,
          partiallyDelivered: kpi.partiallyDelivered || 0,
          delivered: kpi.delivered || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, selectedLocationId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLocationId]);

  const handleDeliveryClick = (delivery: Delivery, startEditing = false) => {
    setDeliveryStartEditing(startEditing);
    setSelectedDelivery(delivery);
    setShowDetailModal(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateWizard(false);
    fetchDeliveries();
  };

  const handleConfirmDelivery = async (deliveryId: string, closeModalOnSuccess = false) => {
    if (!confirm('Are you sure you want to confirm this delivery? This will update stock.')) return;
    setActionLoading(`confirm-${deliveryId}`);
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/deliveries/${deliveryId}/confirm`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
      const result = await response.json();
      if (result.success) {
        fetchDeliveries();
        if (closeModalOnSuccess) {
          setShowDetailModal(false);
          setSelectedDelivery(null);
          setDeliveryStartEditing(false);
        }
      } else {
        alert(result.message || 'Failed to confirm delivery');
      }
    } catch (error) {
      console.error('Failed to confirm delivery:', error);
      alert('Failed to confirm delivery');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveDeliveryEdit = async (
    deliveryId: string,
    data: {
      deliveryDate: string;
      deliveryPerson: string;
      trackingNumber: string;
      notes: string;
      items: Array<{ productId: string; deliveredQuantity: number; orderedQuantity: number }>;
    }
  ) => {
    setActionLoading(`edit-${deliveryId}`);
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        setShowDetailModal(false);
        setSelectedDelivery(null);
        fetchDeliveries();
      } else {
        alert(result.message || 'Failed to update delivery');
      }
    } catch (error) {
      console.error('Failed to update delivery:', error);
      alert('Failed to update delivery');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteDelivery = async (deliveryId: string) => {
    if (!confirm('Are you sure you want to delete this delivery? This action cannot be undone.')) return;
    setActionLoading(`delete-${deliveryId}`);
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'DELETE',
        headers,
      });
      const result = await response.json();
      if (result.success) {
        fetchDeliveries();
      } else {
        alert(result.message || 'Failed to delete delivery');
      }
    } catch (error) {
      console.error('Failed to delete delivery:', error);
      alert('Failed to delete delivery');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
            <p className="text-sm text-gray-500">{totalRecords} deliveries</p>
          </div>
          <button
            onClick={() => setShowCreateWizard(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg hover:bg-[#014582]/90 transition-all font-semibold"
          >
            <Plus size={18} />
            Create Delivery
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <strong>Flow:</strong> Create delivery as Pending → <strong>Confirm</strong> to deduct stock from warehouse.
          Invoice posting records revenue and COGS separately.
        </div>

        {selectedLocation && (
          <div className="mb-4 flex items-center gap-2 text-sm text-sky-800 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            Showing deliveries for <strong>{selectedLocation.name}</strong>
            <span className="text-sky-600 font-mono text-xs">({selectedLocation.code})</span>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Clock className="text-orange-500" size={24} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Partially Delivered</p>
                <p className="text-2xl font-bold text-blue-600">{stats.partiallyDelivered}</p>
              </div>
              <Truck className="text-blue-500" size={24} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Delivered</p>
                <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
              </div>
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search deliveries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582] focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014582] focus:border-transparent"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All Status' : option}
              </option>
            ))}
          </select>
          <button
            onClick={fetchDeliveries}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Delivery #
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Order #
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Customer
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Date
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Payment Status
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Progress
              </th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#014582]" />
                </td>
              </tr>
            ) : deliveries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  No deliveries found
                </td>
              </tr>
            ) : (
              deliveries.map((delivery) => {
                const totalOrdered = delivery.totalOrderedQty ?? 0;
                const totalDelivered = delivery.totalDeliveredQty ?? 0;
                const progress = totalOrdered > 0 
                  ? (totalDelivered / totalOrdered) * 100 
                  : 0;
                return (
                  <tr key={delivery.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-[#014582]">{delivery.deliveryNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {delivery.salesOrderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {delivery.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(delivery.deliveryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={pill(STATUS_COLORS, delivery.deliveryStatus)}>
                        {delivery.deliveryStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {delivery.paymentStatus ? (
                        <span className={pill(PAYMENT_STATUS_COLORS, delivery.paymentStatus)}>
                          {delivery.paymentStatus}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No Invoice</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#014582] transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{Math.round(progress)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDeliveryClick(delivery)}
                          className="p-1.5 text-gray-600 hover:text-[#014582] hover:bg-gray-100 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {!delivery.confirmedAt && (
                          <button
                            onClick={() => handleDeliveryClick(delivery, true)}
                            className="p-1.5 text-gray-600 hover:text-slate-700 hover:bg-gray-100 rounded transition-colors"
                            title="Edit Delivery"
                          >
                            <Edit3 size={16} />
                          </button>
                        )}
                        {!delivery.confirmedAt && delivery.deliveryStatus !== 'Delivered' && (
                          <button
                            onClick={() => handleConfirmDelivery(delivery.id)}
                            disabled={actionLoading === `confirm-${delivery.id}`}
                            className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                            title="Confirm Delivery"
                          >
                            {actionLoading === `confirm-${delivery.id}` ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <CheckCircle size={16} />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDelivery(delivery.id)}
                          disabled={actionLoading === `delete-${delivery.id}`}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {actionLoading === `delete-${delivery.id}` ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageLimit) + 1} to {Math.min(currentPage * pageLimit, totalRecords)} of {totalRecords}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!hasPrev}
                className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={!hasNext}
                className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedDelivery && (
        <DeliveryDetailModal
          delivery={selectedDelivery}
          initialEditing={deliveryStartEditing}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedDelivery(null);
            setDeliveryStartEditing(false);
          }}
          onSave={handleSaveDeliveryEdit}
          onConfirm={(id) => handleConfirmDelivery(id, true)}
          actionLoading={actionLoading}
        />
      )}

      {/* Create Delivery Wizard */}
      {showCreateWizard && (
        <CreateDeliveryWizard
          onSuccess={handleCreateSuccess}
          onClose={() => setShowCreateWizard(false)}
        />
      )}
    </div>
  );
}

function DeliveryDetailModal({
  delivery,
  initialEditing = false,
  onClose,
  onSave,
  onConfirm,
  actionLoading,
}: {
  delivery: Delivery;
  initialEditing?: boolean;
  onClose: () => void;
  onSave: (id: string, data: any) => Promise<void>;
  onConfirm?: (id: string) => void;
  actionLoading: string | null;
}) {
  const canEdit = !delivery.confirmedAt;
  const canConfirm = !delivery.confirmedAt && delivery.deliveryStatus !== 'Delivered';
  const [editing, setEditing] = useState(Boolean(initialEditing) && canEdit);
  const [form, setForm] = useState({
    deliveryDate: delivery.deliveryDate?.slice?.(0, 10) || delivery.deliveryDate,
    deliveryPerson: delivery.deliveryPerson || '',
    trackingNumber: delivery.trackingNumber || '',
    notes: delivery.notes || '',
    items: (delivery.items || []).map((item) => ({
      productId: item.productId,
      orderedQuantity: item.orderedQuantity,
      deliveredQuantity: item.deliveredQuantity,
    })),
  });

  useEffect(() => {
    setForm({
      deliveryDate: delivery.deliveryDate?.slice?.(0, 10) || delivery.deliveryDate,
      deliveryPerson: delivery.deliveryPerson || '',
      trackingNumber: delivery.trackingNumber || '',
      notes: delivery.notes || '',
      items: (delivery.items || []).map((item) => ({
        productId: item.productId,
        orderedQuantity: item.orderedQuantity,
        deliveredQuantity: item.deliveredQuantity,
      })),
    });
    setEditing(Boolean(initialEditing) && !delivery.confirmedAt);
  }, [delivery.id, delivery.confirmedAt, initialEditing]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Delivery Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Delivery Number</p>
              <p className="font-semibold text-[#014582]">{delivery.deliveryNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Number</p>
              <p className="font-semibold">{delivery.salesOrderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-semibold">{delivery.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Delivery Date</p>
              {editing ? (
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border px-3 py-1.5 text-sm"
                  value={form.deliveryDate}
                  onChange={(e) => setForm((p) => ({ ...p, deliveryDate: e.target.value }))}
                />
              ) : (
                <p className="font-semibold">{new Date(delivery.deliveryDate).toLocaleDateString()}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={pill(STATUS_COLORS, delivery.deliveryStatus)}>{delivery.deliveryStatus}</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Delivery Person</p>
              {editing ? (
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-1.5 text-sm"
                  value={form.deliveryPerson}
                  onChange={(e) => setForm((p) => ({ ...p, deliveryPerson: e.target.value }))}
                />
              ) : (
                <p className="font-semibold">{delivery.deliveryPerson || '—'}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Tracking Number</p>
              {editing ? (
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-1.5 text-sm"
                  value={form.trackingNumber}
                  onChange={(e) => setForm((p) => ({ ...p, trackingNumber: e.target.value }))}
                />
              ) : (
                <p className="font-semibold">{delivery.trackingNumber || '—'}</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Notes</p>
            {editing ? (
              <textarea
                className="w-full rounded-lg border px-3 py-2 text-sm"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              />
            ) : (
              <p className="text-sm bg-gray-50 p-3 rounded-lg">{delivery.notes || '—'}</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Delivery Items</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">Product</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600">Ordered</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600">Delivered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {form.items.map((item, index) => {
                    const source = delivery.items.find((d) => d.productId === item.productId);
                    return (
                      <tr key={item.productId || index}>
                        <td className="px-4 py-3 text-sm">
                          <p className="font-medium">{source?.productName}</p>
                          <p className="text-xs text-gray-500">{source?.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">{item.orderedQuantity}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          {editing ? (
                            <input
                              type="number"
                              min="0"
                              max={item.orderedQuantity}
                              className="w-20 rounded border px-2 py-1 text-right"
                              value={item.deliveredQuantity}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                setForm((p) => ({
                                  ...p,
                                  items: p.items.map((row, i) =>
                                    i === index ? { ...row, deliveredQuantity: value } : row
                                  ),
                                }));
                              }}
                            />
                          ) : (
                            item.deliveredQuantity
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {(canEdit || canConfirm) && (
            <div className="border-t border-gray-100 pt-4 flex flex-wrap gap-3 justify-end">
              {canConfirm && onConfirm && (
                <button
                  onClick={() => onConfirm(delivery.id)}
                  disabled={actionLoading === `confirm-${delivery.id}` || editing}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading === `confirm-${delivery.id}` ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Confirm Delivery
                </button>
              )}
              {canEdit && (
                !editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    disabled={actionLoading === `confirm-${delivery.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <button
                    onClick={() => onSave(delivery.id, form)}
                    disabled={actionLoading === `edit-${delivery.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] disabled:opacity-50"
                  >
                    {actionLoading === `edit-${delivery.id}` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Changes
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Next.js route shell — real UI mounts via SalesViewHost. */
export default function SalesRoutePlaceholder() {
  return null;
}
