'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RotateCcw, Search, QrCode } from 'lucide-react';
import { posSaleService } from '../../../lib/pos-service';
import { loadPosSettings } from '../../../lib/pos-settings';
import {
  attachHidBarcodeScanner,
  beepIfEnabled,
  subscribeBarcodeScans,
} from '../../../lib/pos-scanner';

type RefundChoice = 'Cash' | 'Store Credit';

export default function ReturnsScreen() {
  const scanRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sale, setSale] = useState<any>(null);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [refundChoice, setRefundChoice] = useState<RefundChoice>('Cash');
  const [reason, setReason] = useState('Customer return');
  const [submitting, setSubmitting] = useState(false);
  const [mgrEmail, setMgrEmail] = useState('');
  const [mgrPassword, setMgrPassword] = useState('');
  const [done, setDone] = useState('');

  const lookup = useCallback(async (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    setLoading(true);
    setError('');
    setDone('');
    setSale(null);
    try {
      const res: any = await posSaleService.lookup(q);
      const found = res.data;
      if (!found) throw new Error('Sale not found');
      if (found.status === 'Returned') {
        throw new Error('This sale is already fully returned');
      }
      setSale(found);
      const already: Record<string, number> = {};
      (found.returns || []).forEach((ret: any) => {
        (ret.items || []).forEach((it: any) => {
          already[it.productId] = (already[it.productId] || 0) + Number(it.quantity || 0);
        });
      });
      const next: Record<string, number> = {};
      (found.items || []).forEach((it: any) => {
        const left = Math.max(0, Number(it.quantity || 0) - (already[it.productId] || 0));
        next[it.productId] = left;
      });
      setQtys(next);
      beepIfEnabled();
    } catch (e: any) {
      setError(e.message || 'Could not find this receipt');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const off = subscribeBarcodeScans((code) => {
      setQuery(code);
      void lookup(code);
    });
    const detach = attachHidBarcodeScanner();
    return () => {
      off();
      detach();
    };
  }, [lookup]);

  const remainingOf = (item: any) => {
    const already = (sale?.returns || []).reduce((s: number, ret: any) => {
      return (
        s +
        (ret.items || [])
          .filter((ri: any) => ri.productId === item.productId)
          .reduce((n: number, ri: any) => n + Number(ri.quantity || 0), 0)
      );
    }, 0);
    return Math.max(0, Number(item.quantity || 0) - already);
  };

  const refundTotal = useMemo(() => {
    if (!sale) return 0;
    return (sale.items || []).reduce((s: number, it: any) => {
      const qty = Number(qtys[it.productId] || 0);
      return s + qty * Number(it.unitPrice || 0);
    }, 0);
  }, [sale, qtys]);

  const submit = async () => {
    if (!sale) return;
    if (!reason.trim()) {
      setError('Return reason is required');
      return;
    }
    const returnItems = Object.entries(qtys)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([productId, quantity]) => ({ productId, quantity: Number(quantity) }));
    if (!returnItems.length) {
      setError('Select at least one item to return');
      return;
    }
    if (refundChoice === 'Store Credit' && !sale.customerId) {
      setError('Store credit needs a named customer on the original sale. Use cash/card refund instead.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const settings = loadPosSettings();
      if (settings.requireManagerForReturn) {
        if (!mgrEmail || !mgrPassword) {
          throw new Error('Manager email and password are required for returns');
        }
        await posSaleService.verifyManager({ email: mgrEmail, password: mgrPassword });
      }
      await posSaleService.return({
        originalSaleId: sale.id,
        returnItems,
        refundMethod: refundChoice,
        reason: reason.trim(),
      });
      setDone(
        refundChoice === 'Store Credit'
          ? `Return posted. Store credit ${refundTotal.toFixed(2)} issued. Inventory restored, sales revenue reduced.`
          : `Return posted. ${refundTotal.toFixed(2)} refunded. Inventory restored, sales revenue reduced.`
      );
      setSale(null);
      setQuery('');
    } catch (e: any) {
      setError(e.message || 'Return failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
          <RotateCcw className="w-5 h-5 text-[#014582]" />
          POS Returns
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Scan the receipt QR (or barcode invoice number) to load the original sale, then refund cash/card or issue store credit.
        </p>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Scan receipt QR</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#014582]" />
              <input
                ref={scanRef}
                data-pos-scan="1"
                className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-3 text-gray-900 outline-none focus:border-[#014582]"
                placeholder="Scan QR or type invoice number..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void lookup(query);
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => void lookup(query)}
              disabled={loading}
              className="px-4 rounded-xl bg-[#014582] text-white font-semibold flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Lookup
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3">{error}</div>
        ) : null}
        {done ? (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm p-3">{done}</div>
        ) : null}

        {sale ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Receipt</span>
                <p className="font-bold text-gray-900">{sale.invoiceNumber}</p>
              </div>
              <div>
                <span className="text-gray-500">Date</span>
                <p className="font-bold text-gray-900">{new Date(sale.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-500">Customer</span>
                <p className="font-bold text-gray-900">{sale.customerName || 'Walk-in'}</p>
              </div>
              <div>
                <span className="text-gray-500">Original total</span>
                <p className="font-bold text-[#014582]">${Number(sale.grandTotal || 0).toFixed(2)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">Items to return</p>
              {(sale.items || []).map((it: any) => {
                const max = remainingOf(it);
                return (
                  <div key={it.productId} className="flex items-center justify-between gap-3 py-2 border-b border-gray-100">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{it.productName}</p>
                      <p className="text-xs text-gray-500">
                        Sold {it.quantity} × ${Number(it.unitPrice || 0).toFixed(2)} · remaining {max}
                      </p>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={max}
                      value={qtys[it.productId] ?? 0}
                      onChange={(e) =>
                        setQtys((p) => ({
                          ...p,
                          [it.productId]: Math.min(max, Math.max(0, Number(e.target.value) || 0)),
                        }))
                      }
                      className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-right"
                    />
                  </div>
                );
              })}
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">How to settle (accounting)</p>
              <div className="grid sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRefundChoice('Cash')}
                  className={`rounded-xl border p-3 text-left ${
                    refundChoice === 'Cash'
                      ? 'border-[#014582] bg-[#014582]/10'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <p className="font-bold text-gray-900">Refund money</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Cash/card out of drawer. Sales revenue decreases. Inventory comes back.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setRefundChoice('Store Credit')}
                  className={`rounded-xl border p-3 text-left ${
                    refundChoice === 'Store Credit'
                      ? 'border-[#014582] bg-[#014582]/10'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <p className="font-bold text-gray-900">Store credit</p>
                  <p className="text-xs text-gray-600 mt-1">
                    No cash out. Customer credit liability. Inventory back, revenue still reduced.
                  </p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Reason</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {loadPosSettings().requireManagerForReturn ? (
              <div className="grid sm:grid-cols-2 gap-2">
                <input
                  className="border border-gray-200 rounded-xl px-3 py-2"
                  placeholder="Manager email"
                  value={mgrEmail}
                  onChange={(e) => setMgrEmail(e.target.value)}
                />
                <input
                  type="password"
                  className="border border-gray-200 rounded-xl px-3 py-2"
                  placeholder="Manager password"
                  value={mgrPassword}
                  onChange={(e) => setMgrPassword(e.target.value)}
                />
              </div>
            ) : null}

            <div className="flex items-center justify-between pt-2">
              <p className="text-lg font-bold text-[#014582]">Refund ${refundTotal.toFixed(2)}</p>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submit()}
                className="px-5 py-2.5 rounded-xl bg-[#014582] text-white font-bold disabled:opacity-50"
              >
                {submitting ? 'Posting…' : 'Confirm return'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
