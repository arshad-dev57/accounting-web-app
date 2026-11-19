'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Package, X } from 'lucide-react';
import {
  goodsReceivingService,
  type GRNLineDraft,
  type PurchaseOrderForReceiving,
} from '../../api/goodsrecieving/route';
import type { PurchaseOrderModel } from '../../api/purchaseorder/route';

interface CreateGRNFromPOModalProps {
  order: PurchaseOrderModel;
  locationId?: string | null;
  onClose: () => void;
  onCreated: () => void;
  formatCurrency: (amount: number) => string;
}

function buildLineDrafts(po: PurchaseOrderForReceiving): GRNLineDraft[] {
  return (po.remainingItems || []).map((item) => ({
    purchaseOrderItemId: item.id,
    purchaseOrderId: po.id,
    purchaseOrderNumber: po.orderNumber,
    productId: item.productId,
    productName: item.productName,
    sku: item.sku,
    orderedQuantity: item.quantity,
    remainingQuantity: item.remainingQuantity,
    alreadyReceived: item.alreadyReceived,
    receivingQuantity: item.remainingQuantity,
    unitPrice: item.unitPrice,
    unit: item.unit || 'Pcs',
  }));
}

export default function CreateGRNFromPOModal({
  order,
  locationId,
  onClose,
  onCreated,
  formatCurrency,
}: CreateGRNFromPOModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourcePo, setSourcePo] = useState<PurchaseOrderForReceiving | null>(null);
  const [lineDrafts, setLineDrafts] = useState<GRNLineDraft[]>([]);
  const [receivingDate, setReceivingDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [receivedBy, setReceivedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmOnCreate, setConfirmOnCreate] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await goodsReceivingService.searchAvailableOrders(
          order.orderNumber,
          20,
          locationId || undefined,
          order.supplierId
        );
        const match =
          results.find((r) => r.id === order.id) ||
          results.find((r) => r.orderNumber === order.orderNumber) ||
          results[0] ||
          null;
        if (!match) {
          if (!cancelled) {
            setError(
              'This purchase order has no remaining quantity to receive, or it is not available for GRN.'
            );
            setSourcePo(null);
            setLineDrafts([]);
          }
          return;
        }
        if (!cancelled) {
          setSourcePo(match);
          setLineDrafts(buildLineDrafts(match));
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load purchase order for receiving');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [order.id, order.orderNumber, order.supplierId, locationId]);

  const totalReceiving = useMemo(
    () => lineDrafts.reduce((sum, line) => sum + Number(line.receivingQuantity || 0), 0),
    [lineDrafts]
  );

  const updateQty = (index: number, value: number) => {
    setLineDrafts((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        const next = Math.max(0, Math.min(line.remainingQuantity, value || 0));
        return { ...line, receivingQuantity: next };
      })
    );
  };

  const setFull = () => {
    setLineDrafts((prev) =>
      prev.map((line) => ({ ...line, receivingQuantity: line.remainingQuantity }))
    );
  };

  const handleSubmit = async () => {
    if (!sourcePo) return;
    const items = lineDrafts
      .filter((line) => Number(line.receivingQuantity) > 0)
      .map((line) => ({
        purchaseOrderItemId: line.purchaseOrderItemId,
        receivingQuantity: Number(line.receivingQuantity),
      }));
    if (!items.length) {
      setError('Enter receiving quantity for at least one item');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await goodsReceivingService.createGRN({
        purchaseOrderId: sourcePo.id,
        purchaseOrderIds: [sourcePo.id],
        receivingDate,
        receivedBy: receivedBy || undefined,
        notes: notes || undefined,
        status: confirmOnCreate ? 'Confirmed' : 'Draft',
        locationId: locationId || undefined,
        items,
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create GRN');
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
              <Package className="w-5 h-5 text-[#014582]" />
              Create GRN
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              From {order.orderNumber} · {order.supplierName}
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
          ) : error && !sourcePo ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error}
            </div>
          ) : (
            <>
              {sourcePo && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  Remaining qty:{' '}
                  <span className="font-semibold text-gray-800">
                    {sourcePo.totalRemainingQty ??
                      sourcePo.remainingItems?.reduce((s, i) => s + i.remainingQuantity, 0) ??
                      0}
                  </span>
                  {typeof sourcePo.grandTotal === 'number' && (
                    <>
                      {' '}
                      · Order total{' '}
                      <span className="font-semibold">{formatCurrency(sourcePo.grandTotal)}</span>
                    </>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-xs font-medium text-gray-600">
                  Receiving date
                  <input
                    type="date"
                    value={receivingDate}
                    onChange={(e) => setReceivingDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-gray-600">
                  Received by
                  <input
                    type="text"
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    placeholder="Optional"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Items to receive</h3>
                <button
                  type="button"
                  onClick={setFull}
                  className="text-xs font-semibold text-[#014582] hover:underline"
                >
                  Receive full remaining
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {lineDrafts.map((line, index) => (
                  <div
                    key={line.purchaseOrderItemId}
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
                      Receive qty
                      <input
                        type="number"
                        min={0}
                        max={line.remainingQuantity}
                        value={line.receivingQuantity}
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
                  placeholder="Optional receiving notes"
                />
              </label>

              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={confirmOnCreate}
                  onChange={(e) => setConfirmOnCreate(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Confirm GRN immediately (updates stock)
              </label>

              {error && sourcePo && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-gray-100 px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Receiving total qty:{' '}
            <span className="font-semibold text-gray-800">{totalReceiving}</span>
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
              disabled={loading || submitting || !sourcePo || totalReceiving <= 0}
              onClick={() => void handleSubmit()}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#014582] hover:bg-[#01366a] disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create GRN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
