'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  PackageCheck,
  Search,
  Eye,
  Plus,
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  TradePage,
  TradePageHeader,
  TradeCard,
  TradeTable,
  TradeTableHeader,
  TradeTableBody,
  TradeTableRow,
  TradeTableCell,
  TradeStatusBadge,
  TradeDetailDrawer,
  TradeModal,
  ErpLinkedBanner,
} from '../../../components/trade/TradeUI';
import importApi, { ImportGrn, ImportPurchaseOrder, ImportShipment } from '../../../lib/import-api';
import { FormSection, FieldLabel } from '@/components/import/ImportSelectors';
import { apiClient } from '@/lib/api-client';

type LocationOption = { id: string; name: string; code?: string };

type ReceivingLine = {
  id: string;
  importPoItemId: string;
  productId: string;
  productName: string;
  sku?: string | null;
  uom: string;
  orderedQty: number;
  previouslyReceivedQty: number;
  remainingQty: number;
  unitPrice: number;
};

export default function ImportGrnPage() {
  const [grns, setGrns] = useState<ImportGrn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedGrn, setSelectedGrn] = useState<ImportGrn | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pos, setPos] = useState<ImportPurchaseOrder[]>([]);
  const [shipments, setShipments] = useState<ImportShipment[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [poId, setPoId] = useState('');
  const [shipmentId, setShipmentId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [containerNo, setContainerNo] = useState('');
  const [sealIntact, setSealIntact] = useState(true);
  const [confirmNow, setConfirmNow] = useState(true);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<ReceivingLine[]>([]);
  const [linesLoading, setLinesLoading] = useState(false);
  const [recvQty, setRecvQty] = useState<
    Record<string, { received: string; accepted: string; rejected: string }>
  >({});
  const idempotencyRef = useRef<string | null>(null);

  const fetchGrns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await importApi.listGrns({ search });
      setGrns(data?.items || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load goods receipts');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchGrns();
  }, [fetchGrns]);

  useEffect(() => {
    importApi.listPurchaseOrders({ limit: 50 }).then((r) => setPos(r.items || [])).catch(() => setPos([]));
    importApi.listShipments({ limit: 50 }).then((r) => setShipments(r)).catch(() => setShipments([]));
    apiClient
      .get('/api/warehouse/locations?limit=100')
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setLocations(Array.isArray(list) ? list : list.items || []);
      })
      .catch(() => setLocations([]));
  }, []);

  const loadReceivingLines = useCallback(async (importPoId: string) => {
    if (!importPoId) {
      setLines([]);
      setRecvQty({});
      return;
    }
    setLinesLoading(true);
    setError(null);
    try {
      const preview = await importApi.getReceivingPreview(importPoId);
      setLines(preview.lines || []);
      const map: Record<string, { received: string; accepted: string; rejected: string }> = {};
      for (const it of preview.lines || []) {
        const rem = Number(it.remainingQty) || 0;
        map[it.importPoItemId] = {
          received: rem > 0 ? String(rem) : '0',
          accepted: rem > 0 ? String(rem) : '0',
          rejected: '0',
        };
      }
      setRecvQty(map);
    } catch (err: any) {
      setLines([]);
      setRecvQty({});
      setError(err?.response?.data?.message || err.message || 'Failed to load PO receiving lines');
    } finally {
      setLinesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (poId) void loadReceivingLines(poId);
    else {
      setLines([]);
      setRecvQty({});
    }
  }, [poId, loadReceivingLines]);

  const openCreate = () => {
    idempotencyRef.current = `igrn-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    setIsCreateOpen(true);
    setError(null);
  };

  const handleCreate = async () => {
    if (saving) return;
    if (!poId) {
      setError('Select an Import PO');
      return;
    }
    if (!lines.length) {
      setError('Selected PO has no receivable lines');
      return;
    }
    if (confirmNow && locations.length > 0 && !locationId) {
      setError('Select a warehouse before posting stock');
      return;
    }

    const items = lines
      .map((it) => {
        const q = recvQty[it.importPoItemId] || { received: '0', accepted: '0', rejected: '0' };
        const receivedQty = Number(q.received) || 0;
        const acceptedQty = Number(q.accepted) || 0;
        const rejectedQty = Number(q.rejected) || 0;
        if (!(receivedQty > 0) && !(acceptedQty > 0)) return null;
        return {
          importPoItemId: it.importPoItemId,
          productId: it.productId,
          productName: it.productName,
          sku: it.sku,
          orderedQty: it.orderedQty,
          alreadyReceivedQty: it.previouslyReceivedQty,
          receivedQty: receivedQty || acceptedQty,
          acceptedQty: acceptedQty || receivedQty,
          rejectedQty,
          uom: it.uom,
        };
      })
      .filter(Boolean);

    if (!items.length) {
      setError('Enter a receiving quantity greater than zero for at least one line');
      return;
    }

    for (const it of items as any[]) {
      if (it.acceptedQty > it.orderedQty - it.alreadyReceivedQty + 1e-9) {
        setError(
          `Receiving qty for ${it.productName} exceeds remaining ${Math.max(0, it.orderedQty - it.alreadyReceivedQty)}`
        );
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const ship = shipments.find((s) => s.id === shipmentId);
      const selectedPo = pos.find((p) => p.id === poId);
      await importApi.createGrn({
        importPoId: poId,
        poRef: selectedPo?.poNumber,
        shipmentId: shipmentId || undefined,
        shipmentRef: ship?.shipmentNumber,
        locationId: locationId || undefined,
        receiptDate,
        containerNo: containerNo || undefined,
        sealIntact,
        confirmNow,
        status: confirmNow ? 'Inspected & Received' : 'Draft',
        notes: notes || undefined,
        idempotencyKey: idempotencyRef.current || undefined,
        items,
      } as any);

      setIsCreateOpen(false);
      setPoId('');
      setShipmentId('');
      setLocationId('');
      setContainerNo('');
      setNotes('');
      setLines([]);
      idempotencyRef.current = null;
      await fetchGrns();
      importApi.listPurchaseOrders({ limit: 50 }).then((r) => setPos(r.items || [])).catch(() => {});
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to create Import GRN');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (val?: string) => {
    if (!val) return '—';
    try {
      return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return val;
    }
  };

  return (
    <TradePage>
      <TradePageHeader
        title="Import GRN / Goods Receiving"
        subtitle="Record accepted/rejected quantities into warehouse — shared inventory posting with Purchase GRN"
        moduleName="Import Operations"
        backHref="/import/dashboard"
        icon={<PackageCheck className="w-5 h-5 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchGrns}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold"
            >
              <Plus className="w-4 h-4" /> Receive Goods
            </button>
            <Link
              href="/purchases/goodsRecieving"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 text-white text-xs font-semibold border border-white/20"
            >
              <ExternalLink className="w-4 h-4" /> Purchase GRN
            </Link>
          </div>
        }
      />

      <ErpLinkedBanner
        moduleLabel="Import GRN"
        erpModuleLabel="Shared inventory posting"
        erpHref="/purchases/goodsRecieving"
        erpHrefLabel="Purchase Goods Receiving"
        description="Import GRN posts stock through the same location stock / stock-movement services as Purchase receiving. Remaining quantities are computed from posted receipts on the server."
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <TradeCard>
        <div className="relative w-full sm:w-80 mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search GRN, PO, container…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200"
          />
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#014582]" />
            <p className="text-xs">Loading Import GRNs…</p>
          </div>
        ) : grns.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            No Import GRNs yet. Use Receive Goods to post warehouse receipts against an Import PO.
          </div>
        ) : (
          <TradeTable>
            <TradeTableHeader
              columns={['GRN No', 'PO', 'Shipment', 'Warehouse', 'Receipt Date', 'Status', 'Actions']}
            />
            <TradeTableBody>
              {grns.map((g) => (
                <TradeTableRow key={g.id}>
                  <TradeTableCell className="font-bold text-[#014582]">{g.grnNumber}</TradeTableCell>
                  <TradeTableCell>{(g as any).poRef || g.importPoId || '—'}</TradeTableCell>
                  <TradeTableCell>{(g as any).shipmentRef || g.shipmentId || '—'}</TradeTableCell>
                  <TradeTableCell>{(g as any).warehouseName || g.warehouseId || '—'}</TradeTableCell>
                  <TradeTableCell>{formatDate(g.receivedDate || (g as any).receiptDate)}</TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={g.status} />
                  </TradeTableCell>
                  <TradeTableCell>
                    <button
                      type="button"
                      onClick={() => setSelectedGrn(g)}
                      className="p-1.5 rounded-lg text-[#014582] hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </TradeTableCell>
                </TradeTableRow>
              ))}
            </TradeTableBody>
          </TradeTable>
        )}
      </TradeCard>

      <TradeDetailDrawer
        isOpen={Boolean(selectedGrn)}
        onClose={() => setSelectedGrn(null)}
        title={selectedGrn?.grnNumber || 'Import GRN'}
        subtitle={`Status: ${selectedGrn?.status || ''}`}
      >
        {selectedGrn && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-gray-50 border">
              <div>
                <span className="text-[10px] uppercase text-gray-400">PO</span>
                <p className="font-semibold">{(selectedGrn as any).poRef || selectedGrn.importPoId || '—'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-gray-400">Warehouse</span>
                <p className="font-semibold">{(selectedGrn as any).warehouseName || '—'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-gray-400">Receipt date</span>
                <p className="font-semibold">{formatDate(selectedGrn.receivedDate || (selectedGrn as any).receiptDate)}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-gray-400">Stock posted</span>
                <p className="font-semibold">
                  {(selectedGrn as any).stockPostedAt
                    ? formatDate((selectedGrn as any).stockPostedAt)
                    : '—'}
                </p>
              </div>
            </div>
            <TradeTable>
              <TradeTableHeader columns={['Product', 'Ordered', 'Received', 'Accepted', 'Rejected']} />
              <TradeTableBody>
                {(selectedGrn.items || []).map((it, idx) => (
                  <TradeTableRow key={it.id || idx}>
                    <TradeTableCell className="font-semibold">{it.productName}</TradeTableCell>
                    <TradeTableCell>{it.orderedQty}</TradeTableCell>
                    <TradeTableCell>{it.receivedQty}</TradeTableCell>
                    <TradeTableCell>{(it as any).acceptedQty ?? it.receivedQty}</TradeTableCell>
                    <TradeTableCell>{it.rejectedQty}</TradeTableCell>
                  </TradeTableRow>
                ))}
              </TradeTableBody>
            </TradeTable>
          </div>
        )}
      </TradeDetailDrawer>

      <TradeModal
        isOpen={isCreateOpen}
        onClose={() => !saving && setIsCreateOpen(false)}
        title="Import Goods Receipt (GRN)"
        maxWidth="max-w-4xl"
        actions={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setIsCreateOpen(false)}
              className="px-3 py-2 rounded-xl border text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || linesLoading}
              onClick={handleCreate}
              className="px-4 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-60"
            >
              {saving ? 'Posting…' : confirmNow ? 'Confirm Receipt & Post Stock' : 'Save Draft GRN'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
          <FormSection title="Receipt context">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <FieldLabel required>Import PO</FieldLabel>
                <select
                  value={poId}
                  onChange={(e) => setPoId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                >
                  <option value="">Select Import PO…</option>
                  {pos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.poNumber} · {p.supplierName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Shipment</FieldLabel>
                <select
                  value={shipmentId}
                  onChange={(e) => {
                    setShipmentId(e.target.value);
                    const s = shipments.find((x) => x.id === e.target.value);
                    if (s?.containerNo) setContainerNo(s.containerNo);
                  }}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                >
                  <option value="">Optional</option>
                  {shipments
                    .filter((s) => !poId || s.importPoId === poId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.shipmentNumber}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <FieldLabel required={locations.length > 0 && confirmNow}>Warehouse / location</FieldLabel>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                >
                  <option value="">
                    {locations.length ? 'Select warehouse…' : 'No warehouses — will use company stock'}
                  </option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.code ? `${l.code} — ` : ''}{l.name}
                    </option>
                  ))}
                </select>
                {!locations.length && (
                  <p className="text-[10px] text-amber-700 mt-1">
                    Create a warehouse under Inventory for location-level stock. Posting will update company on-hand until then.
                  </p>
                )}
              </div>
              <div>
                <FieldLabel>Receipt date</FieldLabel>
                <input type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              </div>
              <div>
                <FieldLabel>Container No</FieldLabel>
                <input value={containerNo} onChange={(e) => setContainerNo(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              </div>
              <div className="flex items-end gap-4 pb-2">
                <label className="inline-flex items-center gap-2 font-semibold">
                  <input type="checkbox" checked={sealIntact} onChange={(e) => setSealIntact(e.target.checked)} />
                  Seal intact
                </label>
                <label className="inline-flex items-center gap-2 font-semibold">
                  <input type="checkbox" checked={confirmNow} onChange={(e) => setConfirmNow(e.target.checked)} />
                  Confirm & post stock
                </label>
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Received quantities"
            subtitle="Ordered / previously received / remaining are loaded from the server for the selected Import PO"
          >
            {linesLoading ? (
              <div className="py-8 text-center text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading PO lines…
              </div>
            ) : !poId ? (
              <p className="text-center py-6 text-gray-400">Select an Import PO to load receivable lines</p>
            ) : lines.length === 0 ? (
              <p className="text-center py-6 text-gray-400">No receivable lines (fully received or missing products)</p>
            ) : (
              <table className="w-full text-xs border border-gray-100 rounded-xl overflow-hidden">
                <thead className="bg-gray-50 text-[10px] uppercase text-gray-400">
                  <tr>
                    <th className="text-left px-3 py-2">Product</th>
                    <th className="text-right px-3 py-2">Ordered</th>
                    <th className="text-right px-3 py-2">Prev. recv</th>
                    <th className="text-right px-3 py-2">Remaining</th>
                    <th className="text-right px-3 py-2">Receive</th>
                    <th className="text-right px-3 py-2">Accept</th>
                    <th className="text-right px-3 py-2">Reject</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((it) => {
                    const q = recvQty[it.importPoItemId] || { received: '0', accepted: '0', rejected: '0' };
                    return (
                      <tr key={it.importPoItemId} className="border-t border-gray-50">
                        <td className="px-3 py-2">
                          <p className="font-semibold">{it.productName}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{it.sku || '—'} · {it.uom}</p>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">{it.orderedQty}</td>
                        <td className="px-3 py-2 text-right">{it.previouslyReceivedQty}</td>
                        <td className="px-3 py-2 text-right font-bold text-[#014582]">{it.remainingQty}</td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            max={it.remainingQty}
                            step="any"
                            disabled={it.remainingQty <= 0}
                            value={q.received}
                            onChange={(e) =>
                              setRecvQty((m) => ({
                                ...m,
                                [it.importPoItemId]: {
                                  ...q,
                                  received: e.target.value,
                                  accepted: e.target.value,
                                },
                              }))
                            }
                            className="w-24 text-right rounded-lg border px-2 py-1 disabled:bg-gray-50"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            disabled={it.remainingQty <= 0}
                            value={q.accepted}
                            onChange={(e) =>
                              setRecvQty((m) => ({
                                ...m,
                                [it.importPoItemId]: { ...q, accepted: e.target.value },
                              }))
                            }
                            className="w-20 text-right rounded-lg border px-2 py-1 disabled:bg-gray-50"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            disabled={it.remainingQty <= 0}
                            value={q.rejected}
                            onChange={(e) =>
                              setRecvQty((m) => ({
                                ...m,
                                [it.importPoItemId]: { ...q, rejected: e.target.value },
                              }))
                            }
                            className="w-20 text-right rounded-lg border px-2 py-1 disabled:bg-gray-50"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </FormSection>

          <FormSection title="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
              placeholder="Discrepancy / QC notes"
            />
          </FormSection>
        </div>
      </TradeModal>
    </TradePage>
  );
}
