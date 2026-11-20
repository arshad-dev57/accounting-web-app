'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Truck, X } from 'lucide-react';
import { browserCompanyAuthHeaders } from '@/lib/company-api-headers';
import type { Order } from '@/lib/sales-order-service';
import type { OrderForDelivery, OrderItemForDelivery } from '@/types/delivery';

interface CreateDeliveryFromSOModalProps {
  order: Order;
  locationId?: string | null;
  onClose: () => void;
  onCreated: () => void;
  formatCurrency: (amount: number) => string;
}

interface DeliveryLineDraft {
  productId: string;
  productName: string;
  sku: string;
  orderedQuantity: number;
  remainingQuantity: number;
  alreadyDelivered: number;
  deliveryQuantity: number;
  unit: string;
  unitPrice: number;
}

function buildLineDrafts(source: OrderForDelivery): DeliveryLineDraft[] {
  const items = (source.remainingItems || source.items || []) as OrderItemForDelivery[];
  return items.map((item: any) => {
    const ordered = Number(item.orderedQuantity ?? item.quantity ?? 0);
    const already = Number(item.deliveredQuantity ?? 0);
    const remaining =
      item.remainingQuantity != null
        ? Number(item.remainingQuantity)
        : Math.max(0, ordered - already);
    return {
      productId: item.productId,
      productName: item.productName || item.name || 'Product',
      sku: item.sku || '',
      orderedQuantity: ordered,
      remainingQuantity: remaining,
      alreadyDelivered: already,
      deliveryQuantity: remaining,
      unit: item.unit || 'Pcs',
      unitPrice: Number(item.unitPrice) || 0,
    };
  });
}

export default function CreateDeliveryFromSOModal({
  order,
  locationId,
  onClose,
  onCreated,
  formatCurrency,
}: CreateDeliveryFromSOModalProps) {
  const orderId = order.id || order._id || '';
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceOrder, setSourceOrder] = useState<OrderForDelivery | null>(null);
  const [lineDrafts, setLineDrafts] = useState<DeliveryLineDraft[]>([]);
  const [deliveryDate, setDeliveryDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [deliveryPerson, setDeliveryPerson] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmOnCreate, setConfirmOnCreate] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          search: order.orderNumber,
          limit: '20',
        });
        if (locationId) params.append('locationId', locationId);

        const response = await fetch(
          `/api/deliveries/available-orders?${params.toString()}`,
          { headers: browserCompanyAuthHeaders() }
        );
        const result = await response.json();
        const rows: OrderForDelivery[] = Array.isArray(result.data) ? result.data : [];
        const match =
          rows.find((r) => r.id === orderId) ||
          rows.find((r) => r.orderNumber === order.orderNumber) ||
          rows[0] ||
          null;

        if (!match) {
          if (!cancelled) {
            setError(
              'This sales order has no remaining quantity to deliver, or it is not available for a delivery note.'
            );
            setSourceOrder(null);
            setLineDrafts([]);
          }
          return;
        }
        if (!cancelled) {
          setSourceOrder(match);
          setLineDrafts(buildLineDrafts(match));
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load sales order for delivery');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, order.orderNumber, locationId]);

  const totalDelivering = useMemo(
    () => lineDrafts.reduce((sum, line) => sum + Number(line.deliveryQuantity || 0), 0),
    [lineDrafts]
  );

  const updateQty = (index: number, value: number) => {
    setLineDrafts((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        const next = Math.max(0, Math.min(line.remainingQuantity, value || 0));
        return { ...line, deliveryQuantity: next };
      })
    );
  };

  const setFull = () => {
    setLineDrafts((prev) =>
      prev.map((line) => ({ ...line, deliveryQuantity: line.remainingQuantity }))
    );
  };

  const handleSubmit = async () => {
    if (!sourceOrder) return;
    const items = lineDrafts
      .filter((line) => Number(line.deliveryQuantity) > 0)
      .map((line) => ({
        orderId: sourceOrder.id,
        productId: line.productId,
        deliveredQuantity: Number(line.deliveryQuantity),
        notes: null,
      }));
    if (!items.length) {
      setError('Enter delivery quantity for at least one item');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const headers = browserCompanyAuthHeaders();
      const payload = {
        salesOrderId: sourceOrder.id,
        salesOrderIds: [sourceOrder.id],
        deliveryDate,
        deliveryPerson: deliveryPerson.trim() || null,
        trackingNumber: trackingNumber.trim() || null,
        notes: notes.trim() || null,
        ...(locationId || order.locationId
          ? { locationId: locationId || order.locationId }
          : {}),
        items,
      };

      const response = await fetch('/api/deliveries', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to create delivery');
      }

      const createdId = result.data?.id;
      if (confirmOnCreate && createdId) {
        const confirmRes = await fetch(`/api/deliveries/${createdId}/confirm`, {
          method: 'POST',
          headers,
          body: JSON.stringify({}),
        });
        const confirmResult = await confirmRes.json();
        if (!confirmResult.success) {
          throw new Error(
            confirmResult.message ||
              'Delivery was created but could not be confirmed. Confirm it from the deliveries list.'
          );
        }
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create delivery');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-start justify-between px-4 md:px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#014582]" />
              Create delivery note
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              From {order.orderNumber} · {order.customerName}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-7 h-7 mx-auto animate-spin text-[#014582]" />
              <p className="text-sm text-gray-500 mt-2">Loading remaining items…</p>
            </div>
          ) : error && !sourceOrder ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error}
            </div>
          ) : (
            <>
              {sourceOrder && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  Remaining qty:{' '}
                  <span className="font-semibold text-gray-800">
                    {lineDrafts.reduce((s, l) => s + l.remainingQuantity, 0)}
                  </span>
                  {typeof (order as any).grandTotal === 'number' && (
                    <>
                      {' '}
                      · Order total{' '}
                      <span className="font-semibold">
                        {formatCurrency(Number((order as any).grandTotal))}
                      </span>
                    </>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-xs font-medium text-gray-600">
                  Delivery date
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-gray-600">
                  Delivery person
                  <input
                    type="text"
                    value={deliveryPerson}
                    onChange={(e) => setDeliveryPerson(e.target.value)}
                    placeholder="Optional"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-gray-600 sm:col-span-2">
                  Tracking number
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Optional"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Items to deliver</h3>
                <button
                  type="button"
                  onClick={setFull}
                  className="text-xs font-semibold text-[#014582] hover:underline"
                >
                  Deliver full remaining
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {lineDrafts.map((line, index) => (
                  <div
                    key={`${line.productId}-${index}`}
                    className="rounded-xl border border-gray-100 p-3 flex flex-col sm:flex-row sm:items-center gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{line.productName}</p>
                      <p className="text-[11px] text-gray-400">
                        SKU {line.sku} · Ordered {line.orderedQuantity} · Remaining{' '}
                        {line.remainingQuantity}
                      </p>
                    </div>
                    <label className="text-[11px] text-gray-500 shrink-0">
                      Deliver qty
                      <input
                        type="number"
                        min={0}
                        max={line.remainingQuantity}
                        value={line.deliveryQuantity}
                        onChange={(e) => updateQty(index, Number(e.target.value))}
                        className="mt-1 w-28 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                      />
                    </label>
                  </div>
                ))}
              </div>

              <label className="block text-xs font-medium text-gray-600">
                Notes
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Optional delivery notes"
                />
              </label>

              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={confirmOnCreate}
                  onChange={(e) => setConfirmOnCreate(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Confirm delivery immediately (updates stock)
              </label>

              {error && sourceOrder && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-gray-100 px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Delivery total qty:{' '}
            <span className="font-semibold text-gray-800">{totalDelivering}</span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading || submitting || !sourceOrder || totalDelivering <= 0}
              onClick={() => void handleSubmit()}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#014582] hover:bg-[#01366a] disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create delivery
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
