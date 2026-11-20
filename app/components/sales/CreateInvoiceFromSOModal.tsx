'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, Loader2, X } from 'lucide-react';
import { browserCompanyAuthHeaders } from '@/lib/company-api-headers';
import type { Order } from '@/lib/sales-order-service';

interface CreateInvoiceFromSOModalProps {
  order: Order;
  onClose: () => void;
  onCreated: () => void;
  formatCurrency: (amount: number) => string;
}

interface InvoiceLineDraft {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  maxQuantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
}

interface OrderSource {
  id: string;
  orderNumber: string;
  customerName?: string;
  locationId?: string;
  items: any[];
}

function recalc(line: InvoiceLineDraft): InvoiceLineDraft {
  const qty = Number(line.quantity) || 0;
  const price = Number(line.unitPrice) || 0;
  const discount = Number(line.discount) || 0;
  const taxRate = Number(line.taxRate) || 0;
  const subtotal = qty * price;
  const discountAmount = subtotal * (discount / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxRate / 100);
  return {
    ...line,
    subtotal,
    discountAmount,
    taxAmount,
    lineTotal: taxableAmount + taxAmount,
  };
}

function buildLines(source: OrderSource): InvoiceLineDraft[] {
  return (source.items || []).map((item: any) => {
    const qty = Number(
      item.remainingQuantity ?? item.maxQuantity ?? item.quantity ?? 0
    );
    return recalc({
      productId: item.productId || '',
      productName: item.productName || '',
      sku: item.sku || '',
      quantity: qty,
      maxQuantity: qty,
      unitPrice: Number(item.unitPrice) || 0,
      discount: Number(item.discount) || 0,
      taxRate: Number(item.taxRate) || 0,
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      lineTotal: 0,
    });
  });
}

export default function CreateInvoiceFromSOModal({
  order,
  onClose,
  onCreated,
  formatCurrency,
}: CreateInvoiceFromSOModalProps) {
  const orderId = order.id || order._id || '';
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<OrderSource | null>(null);
  const [lineDrafts, setLineDrafts] = useState<InvoiceLineDraft[]>([]);
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [notes, setNotes] = useState('');

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
        const response = await fetch(
          `/api/sales-invoices/available-orders?${params.toString()}`,
          { headers: browserCompanyAuthHeaders() }
        );
        const result = await response.json();
        const rows: OrderSource[] = Array.isArray(result.data) ? result.data : [];
        const match =
          rows.find((r) => r.id === orderId) ||
          rows.find((r) => r.orderNumber === order.orderNumber) ||
          rows[0] ||
          null;

        if (!match) {
          if (!cancelled) {
            setError(
              'This sales order is not available for invoicing (already invoiced, cancelled, or no remaining quantity).'
            );
            setSource(null);
            setLineDrafts([]);
          }
          return;
        }
        if (!cancelled) {
          setSource(match);
          setLineDrafts(buildLines(match));
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load sales order for invoicing');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, order.orderNumber]);

  const totals = useMemo(() => {
    const subtotal = lineDrafts.reduce((s, l) => s + l.subtotal, 0);
    const discount = lineDrafts.reduce((s, l) => s + l.discountAmount, 0);
    const tax = lineDrafts.reduce((s, l) => s + l.taxAmount, 0);
    return { subtotal, discount, tax, grand: subtotal - discount + tax };
  }, [lineDrafts]);

  const updateQty = (index: number, value: number) => {
    setLineDrafts((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        const max = line.maxQuantity ?? Number(line.quantity) ?? 0;
        return recalc({ ...line, quantity: Math.max(0, Math.min(max, value || 0)) });
      })
    );
  };

  const handleSubmit = async () => {
    if (!source) return;
    const items = lineDrafts
      .filter((line) => Number(line.quantity) > 0)
      .map((line) => ({
        orderId: source.id,
        productId: line.productId,
        productName: line.productName,
        sku: line.sku,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
        discount: Number(line.discount) || 0,
        taxRate: Number(line.taxRate) || 0,
      }));
    if (!items.length) {
      setError('Enter quantity for at least one item');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        orderIds: [source.id],
        deliveryIds: [],
        dueDate,
        paymentTerms: paymentTerms || 'Net 30',
        notes: notes.trim() || null,
        locationId: source.locationId || order.locationId || undefined,
        items,
      };
      const response = await fetch('/api/sales-invoices/create-multi', {
        method: 'POST',
        headers: browserCompanyAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to create sales invoice');
      }
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create sales invoice');
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
              <FileText className="w-5 h-5 text-[#014582]" />
              Create sales invoice
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
              <p className="text-sm text-gray-500 mt-2">Loading invoiceable items…</p>
            </div>
          ) : error && !source ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-xs font-medium text-gray-600">
                  Payment terms
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-gray-600">
                  Invoice date
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-gray-600 sm:col-span-2">
                  Due date
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <h3 className="text-sm font-semibold text-gray-800">Line items</h3>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {lineDrafts.map((line, index) => (
                  <div
                    key={`${line.productId}-${index}`}
                    className="rounded-xl border border-gray-100 p-3 flex flex-col sm:flex-row sm:items-center gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{line.productName}</p>
                      <p className="text-[11px] text-gray-400">
                        SKU {line.sku} · Max {line.maxQuantity ?? line.quantity} ·{' '}
                        {formatCurrency(line.lineTotal)}
                      </p>
                    </div>
                    <label className="text-[11px] text-gray-500 shrink-0">
                      Qty
                      <input
                        type="number"
                        min={0}
                        max={line.maxQuantity}
                        value={line.quantity}
                        onChange={(e) => updateQty(index, Number(e.target.value))}
                        className="mt-1 w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
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
                />
              </label>

              <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2 text-sm space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(totals.discount)}</span>
                  </div>
                )}
                {totals.tax > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Tax</span>
                    <span>{formatCurrency(totals.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
                  <span>Grand total</span>
                  <span className="text-[#014582]">{formatCurrency(totals.grand)}</span>
                </div>
              </div>

              {error && source && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-gray-100 px-4 md:px-6 py-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || submitting || !source || totals.grand <= 0}
            onClick={() => void handleSubmit()}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#014582] hover:bg-[#01366a] disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Create invoice
          </button>
        </div>
      </div>
    </div>
  );
}
