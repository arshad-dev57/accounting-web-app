'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Search, Calendar, Package, Truck, 
  CheckCircle, Loader2, X, ChevronLeft, ChevronRight, AlertCircle, MapPin, Plus
} from 'lucide-react';
import { useLocationOptional } from '@/lib/location-context';
import { SalesNumberInput } from '@/components/sales/sales-number-input';

interface PendingOrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  orderedQuantity: number;
  deliveredQuantity: number;
  remainingQuantity: number;
  unitPrice: number;
  unit?: string;
}

interface PendingOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  orderDate: string;
  orderStatus: string;
  locationId?: string;
  items?: PendingOrderItem[];
  remainingItems?: PendingOrderItem[];
  hasRemainingItems?: boolean;
}

interface LineDraft {
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  sku: string;
  orderQuantity: number;
  deliveredQuantity: number;
  remainingQuantity: number;
  deliveryQuantity: number;
  selected: boolean;
  unit?: string;
}

export default function CreateDeliveryPage() {
  const router = useRouter();
  const { selectedLocationId, selectedLocation } = useLocationOptional();

  // Pending orders list state
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  // Selected Orders & Delivery draft state
  const [selectedOrders, setSelectedOrders] = useState<PendingOrder[]>([]);
  const [lineDrafts, setLineDrafts] = useState<LineDraft[]>([]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryPerson, setDeliveryPerson] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default delivery date to today
  useEffect(() => {
    const today = new Date();
    setDeliveryDate(today.toISOString().split('T')[0]);
  }, []);

  // Fetch pending orders for delivery
  const fetchPendingOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    setFormError('');
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedLocationId) params.append('locationId', selectedLocationId);

      const response = await fetch(`/api/deliveries/available-orders?${params.toString()}`, {
        headers,
      });
      const result = await response.json();

      if (result.success) {
        const rows = Array.isArray(result.data) ? result.data : [];
        setPendingOrders(rows);
        const pag = result.pagination;
        if (pag) {
          setTotalPages(pag.pages || 1);
          setTotalRecords(pag.total || 0);
          setHasNext(Boolean(pag.hasNext));
          setHasPrev(Boolean(pag.hasPrev));
        }
      } else {
        setPendingOrders([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch available orders for delivery:', err);
      setPendingOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [currentPage, searchQuery, selectedLocationId]);

  useEffect(() => {
    fetchPendingOrders();
  }, [fetchPendingOrders]);

  // Reset page when search or location changes
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  // Toggle order selection (select / deselect) with same customer validation
  const handleToggleSelectOrder = (order: PendingOrder) => {
    const isAlreadySelected = selectedOrders.some((o) => o.id === order.id);

    if (isAlreadySelected) {
      // Deselect order
      const updatedOrders = selectedOrders.filter((o) => o.id !== order.id);
      setSelectedOrders(updatedOrders);
      setLineDrafts((prev) => prev.filter((item) => item.orderId !== order.id));
      setFormError('');
      return;
    }

    // Check same customer constraint if there are already selected orders
    if (selectedOrders.length > 0) {
      const primaryCustomer = (selectedOrders[0].customerName || '').toLowerCase().trim();
      const newCustomer = (order.customerName || '').toLowerCase().trim();

      if (primaryCustomer !== newCustomer) {
        setFormError(
          `⚠️ All selected orders must belong to the same customer. Selected order(s) are for "${selectedOrders[0].customerName}", but Order #${order.orderNumber} is for "${order.customerName}".`
        );
        return;
      }
    }

    // Select order
    setSelectedOrders((prev) => [...prev, order]);
    setFormError('');

    const items = order.remainingItems || order.items || [];
    const newDrafts: LineDraft[] = items.map((item) => {
      const remainingQty =
        item.remainingQuantity !== undefined
          ? item.remainingQuantity
          : Math.max(0, item.orderedQuantity - (item.deliveredQuantity || 0));

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        orderQuantity: item.orderedQuantity || item.remainingQuantity || 1,
        deliveredQuantity: item.deliveredQuantity || 0,
        remainingQuantity: remainingQty,
        deliveryQuantity: remainingQty > 0 ? remainingQty : 0,
        selected: remainingQty > 0,
        unit: item.unit || 'Pcs',
      };
    });

    setLineDrafts((prev) => [...prev, ...newDrafts]);
  };

  // Handle line item selection check/uncheck
  const handleItemSelectToggle = (index: number, selected: boolean) => {
    setLineDrafts((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        selected,
        deliveryQuantity: selected ? updated[index].remainingQuantity : 0,
      };
      return updated;
    });
  };

  // Update line draft delivery quantity
  const handleUpdateItemQuantity = (index: number, quantity: number) => {
    setLineDrafts((prev) => {
      const updated = [...prev];
      const maxQty = updated[index].remainingQuantity;
      const cleanQty = Math.max(0, Math.min(maxQty, quantity));
      updated[index] = {
        ...updated[index],
        deliveryQuantity: cleanQty,
        selected: cleanQty > 0,
      };
      return updated;
    });
  };

  // Submit delivery creation
  const handleSubmitDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (selectedOrders.length === 0) {
      setFormError('⚠️ Please select at least one pending order from the list before creating the delivery.');
      return;
    }

    const selectedItems = lineDrafts.filter((l) => l.selected && l.deliveryQuantity > 0);
    if (selectedItems.length === 0) {
      setFormError('⚠️ Please select at least one item with a valid delivery quantity.');
      return;
    }

    if (!deliveryDate) {
      setFormError('⚠️ Delivery date is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const payload = {
        salesOrderIds: selectedOrders.map((o) => o.id),
        deliveryDate,
        deliveryPerson: deliveryPerson.trim() || null,
        trackingNumber: trackingNumber.trim() || null,
        notes: notes.trim() || null,
        locationId: selectedLocationId || selectedOrders[0]?.locationId || undefined,
        items: selectedItems.map((l) => ({
          orderId: l.orderId,
          productId: l.productId,
          deliveredQuantity: l.deliveryQuantity,
          notes: null,
        })),
      };

      const response = await fetch('/api/deliveries', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        router.push('/sales/deliveries');
      } else {
        setFormError(result.message || 'Failed to create delivery');
      }
    } catch (err: any) {
      console.error('Create delivery error:', err);
      setFormError(err.message || 'An error occurred while creating delivery');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalDeliveringItemsCount = lineDrafts
    .filter((l) => l.selected)
    .reduce((sum, l) => sum + (l.deliveryQuantity || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/sales/deliveries')}
            className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-[#014582] transition-colors mb-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Deliveries
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-7 h-7 text-[#014582]" /> Create Delivery Note
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Select one or multiple pending orders for the same customer, verify remaining items, and issue a delivery note.
          </p>
        </div>

        {selectedLocation && (
          <div className="flex items-center gap-2 text-sm text-sky-800 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            Fulfilling from <strong>{selectedLocation.name}</strong>
            <span className="text-sky-600 font-mono text-xs">({selectedLocation.code})</span>
          </div>
        )}
      </div>

      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* ── STEP 1: PENDING ORDERS SELECTION TABLE (ON PAGE) ───────────── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#014582]" /> Pending Sales Orders
            </h2>
            <p className="text-xs text-gray-500">
              Select multiple orders for the same customer to combine them into a single delivery note.
            </p>
          </div>

          {/* Customer & Order Search */}
          <div className="w-full sm:w-80 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by customer name or order #..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#014582] focus:border-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {isLoadingOrders ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#014582]" />
            <span className="ml-3 text-sm text-gray-500 font-medium">Loading pending orders...</span>
          </div>
        ) : pendingOrders.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-center w-16">Select</th>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Order Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Deliverable Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingOrders.map((order) => {
                  const isSelected = selectedOrders.some((o) => o.id === order.id);
                  const itemOptions = order.remainingItems || order.items || [];
                  const isDifferentCustomer =
                    selectedOrders.length > 0 &&
                    selectedOrders[0].customerName.toLowerCase().trim() !==
                      (order.customerName || '').toLowerCase().trim();

                  return (
                    <tr
                      key={order.id}
                      onClick={() => handleToggleSelectOrder(order)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-sky-50/80 font-medium'
                          : isDifferentCustomer
                          ? 'hover:bg-amber-50/40 opacity-75'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOrder(order)}
                          className="w-4 h-4 text-[#014582] rounded border-gray-300 focus:ring-[#014582]"
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#014582]">{order.orderNumber}</td>
                      <td className="px-4 py-3 text-gray-900">
                        {order.customerName}
                        {order.customerPhone && (
                          <span className="block text-xs text-gray-400">{order.customerPhone}</span>
                        )}
                        {isDifferentCustomer && (
                          <span className="text-[10px] text-amber-700 font-semibold block">Different customer</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        {itemOptions.length} item(s)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center space-y-2">
            <Package className="w-8 h-8 text-gray-400 mx-auto opacity-50" />
            <p className="text-sm font-semibold text-gray-700">No pending orders available for delivery</p>
            <p className="text-xs text-gray-400">
              {searchQuery
                ? `No orders match "${searchQuery}"`
                : 'All orders for this warehouse are either fully delivered or completed.'}
            </p>
          </div>
        )}

        {/* Pending Orders Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-500">
              Showing {pendingOrders.length} of {totalRecords} pending orders
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!hasPrev || isLoadingOrders}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <span className="text-xs font-semibold text-gray-700 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={!hasNext || isLoadingOrders}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── STEP 2: SELECTED ORDERS ITEMS & DELIVERY DETAILS FORM ─────────────── */}
      {selectedOrders.length > 0 && (
        <form onSubmit={handleSubmitDelivery} className="space-y-6">
          {/* Selected Orders Summary Banner */}
          <div className="bg-[#014582]/10 border border-[#014582]/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#014582]" />
                <h3 className="font-bold text-gray-900">
                  Selected Orders ({selectedOrders.length}):{' '}
                  <span className="text-[#014582]">
                    {selectedOrders.map((o) => o.orderNumber).join(', ')}
                  </span>
                </h3>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Customer: <strong>{selectedOrders[0].customerName}</strong>
                {selectedOrders[0].customerEmail && ` • Email: ${selectedOrders[0].customerEmail}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedOrders([]);
                setLineDrafts([]);
                setFormError('');
              }}
              className="text-xs text-red-600 hover:text-red-800 font-semibold px-3 py-1.5 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Deselect All Orders
            </button>
          </div>

          {/* Line Items Selection & Quantities Table */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#014582]" /> Select Items & Quantities to Deliver
              </h3>
              <span className="text-xs font-semibold text-sky-800 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                Total Delivering: {totalDeliveringItemsCount} pcs
              </span>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-center w-16">Deliver</th>
                    <th className="px-4 py-3">Order #</th>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3 text-right">Ordered Qty</th>
                    <th className="px-4 py-3 text-right">Already Delivered</th>
                    <th className="px-4 py-3 text-right">Remaining Qty</th>
                    <th className="px-4 py-3 text-right min-w-[140px]">Delivering Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lineDrafts.map((line, index) => (
                    <tr key={`${line.orderId}-${line.productId}-${index}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={line.selected}
                          onChange={(e) => handleItemSelectToggle(index, e.target.checked)}
                          className="w-4 h-4 text-[#014582] rounded border-gray-300 focus:ring-[#014582]"
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#014582] text-xs">
                        {line.orderNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{line.productName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{line.sku}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{line.orderQuantity}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{line.deliveredQuantity}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-sky-900 px-2 py-0.5 bg-sky-50 rounded">
                          {line.remainingQuantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {line.selected ? (
                          <SalesNumberInput
                            min={0}
                            max={line.remainingQuantity}
                            value={line.deliveryQuantity}
                            onChange={(val) => handleUpdateItemQuantity(index, val)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#014582] text-center inline-block"
                          />
                        ) : (
                          <span className="text-xs text-gray-400 italic">Not selected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Delivery Note Header Details */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#014582]" /> Delivery Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Person (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Driver / Person name..."
                  value={deliveryPerson}
                  onChange={(e) => setDeliveryPerson(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Tracking / Courier reference..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Special instructions or notes for this delivery..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#014582] focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/sales/deliveries')}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalDeliveringItemsCount === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#014582] text-white rounded-lg text-sm font-semibold hover:bg-[#01366a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Delivery...
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4" />
                  Create Delivery Note
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
