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
  ShieldAlert,
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
import importApi, { ImportGrn } from '../../../lib/import-api';
import { FormSection, FieldLabel } from '@/components/import/ImportSelectors';
import { apiClient } from '@/lib/api-client';
import { usePermissions } from '@/lib/usePermissions';

type LocationOption = { id: string; name: string; code?: string };

type ReceivableShipment = {
  id: string;
  shipmentNumber: string;
  shipmentStatus: string;
  importPoId?: string | null;
  poRef?: string | null;
  piRef?: string | null;
  lcRef?: string | null;
  blNumber?: string | null;
  blType?: string | null;
  originalBlReceived?: boolean;
  containerNo?: string | null;
  vesselName?: string | null;
  remainingTotal: number;
  label: string;
  canReceive?: boolean;
  customs?: {
    id: string;
    entryNumber: string;
    billOfEntryNo?: string;
    clearanceStatus: string;
    isReleased?: boolean;
  } | null;
};

type ReceivingLine = {
  shipmentItemId: string;
  importPoItemId?: string | null;
  productId: string | null;
  productName: string;
  sku?: string | null;
  uom: string;
  orderedQty: number;
  shippedQty: number;
  previouslyReceivedQty: number;
  remainingQty: number;
  unitPrice: number;
  receivedOfLabel?: string;
};

type LineQty = {
  accepted: string;
  short: string;
  damaged: string;
  rejected: string;
  shortReason: string;
  damagedReason: string;
  rejectedReason: string;
};

export default function ImportGrnPage() {
  const { can, isAdmin, ready } = usePermissions();
  const canCreate = isAdmin || can('import.grn.create');
  const canPost = isAdmin || can('import.grn.post') || can('import.grn.approve');
  const canCancel = isAdmin || can('import.grn.cancel') || can('import.grn.delete');

  const [grns, setGrns] = useState<ImportGrn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [selectedGrn, setSelectedGrn] = useState<ImportGrn | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);

  const [receivable, setReceivable] = useState<ReceivableShipment[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [shipmentId, setShipmentId] = useState('');
  const [preview, setPreview] = useState<Awaited<
    ReturnType<typeof importApi.getShipmentReceivingPreview>
  > | null>(null);
  const [locationId, setLocationId] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [receivedBy, setReceivedBy] = useState('');
  const [containerNo, setContainerNo] = useState('');
  const [sealIntact, setSealIntact] = useState(true);
  const [confirmNow, setConfirmNow] = useState(false);
  const [notes, setNotes] = useState('');
  const [earlyReceiveReason, setEarlyReceiveReason] = useState('');
  const [lines, setLines] = useState<ReceivingLine[]>([]);
  const [linesLoading, setLinesLoading] = useState(false);
  const [recvQty, setRecvQty] = useState<Record<string, LineQty>>({});
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
    importApi
      .listReceivableShipments({ limit: 100 })
      .then((r) => setReceivable(Array.isArray(r) ? r : []))
      .catch((err: any) => {
        setReceivable([]);
        setError(
          err?.response?.data?.message ||
            err.message ||
            'Failed to load receivable shipments'
        );
      });
    apiClient
      .get('/api/warehouse/locations?limit=100')
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setLocations(Array.isArray(list) ? list : list.items || []);
      })
      .catch(() => setLocations([]));
  }, []);

  const loadShipmentPreview = useCallback(async (id: string) => {
    if (!id) {
      setPreview(null);
      setLines([]);
      setRecvQty({});
      return;
    }
    setLinesLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      const data = await importApi.getShipmentReceivingPreview(id);
      setPreview(data);
      setLines(data.lines || []);
      setContainerNo(data.containerNo || '');
      if (data.settings?.defaultReceivingLocationId) {
        setLocationId(data.settings.defaultReceivingLocationId);
      }
      const map: Record<string, LineQty> = {};
      for (const it of data.lines || []) {
        const rem = Number(it.remainingQty) || 0;
        map[it.shipmentItemId] = {
          accepted: rem > 0 ? String(rem) : '0',
          short: '0',
          damaged: '0',
          rejected: '0',
          shortReason: '',
          damagedReason: '',
          rejectedReason: '',
        };
      }
      setRecvQty(map);
    } catch (err: any) {
      setPreview(null);
      setLines([]);
      setRecvQty({});
      setError(err?.response?.data?.message || err.message || 'Failed to load shipment lines');
    } finally {
      setLinesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (shipmentId) void loadShipmentPreview(shipmentId);
    else {
      setPreview(null);
      setLines([]);
      setRecvQty({});
    }
  }, [shipmentId, loadShipmentPreview]);

  const openCreate = () => {
    if (!canCreate) {
      setError('You do not have permission to create Import GRNs (import.grn.create).');
      return;
    }
    idempotencyRef.current = `igrn-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    setIsCreateOpen(true);
    setError(null);
    setFieldErrors({});
    setConfirmNow(false);
    setEarlyReceiveReason('');
    importApi
      .listReceivableShipments({ limit: 100 })
      .then((r) => setReceivable(r || []))
      .catch(() => {});
  };

  const handleCreate = async () => {
    if (saving) return;
    const errs: Record<string, string> = {};
    if (!shipmentId) errs.shipmentId = 'Select a shipment';
    if (!locationId) errs.locationId = 'Warehouse / receiving location is required';
    if (!receiptDate) errs.receiptDate = 'Receiving date is required';
    if (!receivedBy.trim()) errs.receivedBy = 'Received-by is required';
    if (confirmNow && !canPost) {
      errs.confirmNow = 'You do not have permission to post GRNs (import.grn.post)';
    }

    const customsReleased = preview?.customs?.isReleased;
    const allowEarly = preview?.settings?.allowGrnBeforeCustomsRelease;
    if (!customsReleased && allowEarly && !earlyReceiveReason.trim()) {
      errs.earlyReceiveReason =
        'Reason required to receive before customs release (stock will be Bonded / under customs)';
    }
    if (!customsReleased && !allowEarly && preview) {
      errs.customs = preview.customs
        ? `Customs status is "${preview.customs.clearanceStatus}". Wait until Released/Cleared.`
        : 'No customs entry linked to this shipment';
    }

    const items = lines
      .map((it) => {
        const q = recvQty[it.shipmentItemId] || {
          accepted: '0',
          short: '0',
          damaged: '0',
          rejected: '0',
          shortReason: '',
          damagedReason: '',
          rejectedReason: '',
        };
        const acceptedQty = Number(q.accepted) || 0;
        const shortQty = Number(q.short) || 0;
        const damagedQty = Number(q.damaged) || 0;
        const rejectedQty = Number(q.rejected) || 0;
        const processed = acceptedQty + shortQty + damagedQty + rejectedQty;
        if (!(processed > 0)) return null;
        if (shortQty > 0 && !q.shortReason.trim()) {
          errs[`short-${it.shipmentItemId}`] = `Short reason required for ${it.productName}`;
        }
        if (damagedQty > 0 && !q.damagedReason.trim()) {
          errs[`damaged-${it.shipmentItemId}`] = `Damaged reason required for ${it.productName}`;
        }
        if (rejectedQty > 0 && !q.rejectedReason.trim()) {
          errs[`rejected-${it.shipmentItemId}`] = `Rejected reason required for ${it.productName}`;
        }
        if (processed > it.remainingQty + 1e-9) {
          errs[`qty-${it.shipmentItemId}`] = `Remaining shipped quantity: ${it.remainingQty}`;
        }
        return {
          shipmentItemId: it.shipmentItemId,
          importPoItemId: it.importPoItemId,
          productId: it.productId,
          productName: it.productName,
          sku: it.sku,
          shippedQty: it.shippedQty,
          acceptedQty,
          shortQty,
          damagedQty,
          rejectedQty,
          shortReason: q.shortReason || undefined,
          damagedReason: q.damagedReason || undefined,
          rejectedReason: q.rejectedReason || undefined,
          batchQty: processed,
          uom: it.uom,
        };
      })
      .filter(Boolean);

    if (!items.length) errs.items = 'Enter good / short / damaged / rejected qty for at least one line';

    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      setError(Object.values(errs)[0]);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await importApi.createGrn({
        shipmentId,
        locationId,
        receiptDate,
        receivedBy: receivedBy.trim(),
        containerNo: containerNo || undefined,
        sealIntact,
        confirmNow: confirmNow && canPost,
        status: confirmNow && canPost ? 'Posted' : 'Draft',
        notes: notes || undefined,
        earlyReceiveReason: earlyReceiveReason || undefined,
        idempotencyKey: idempotencyRef.current || undefined,
        items,
      } as any);

      setIsCreateOpen(false);
      setShipmentId('');
      setLocationId('');
      setContainerNo('');
      setNotes('');
      setReceivedBy('');
      setLines([]);
      setPreview(null);
      idempotencyRef.current = null;
      await fetchGrns();
      importApi
        .listReceivableShipments({ limit: 100 })
        .then((r) => setReceivable(r || []))
        .catch(() => {});
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to create Import GRN');
    } finally {
      setSaving(false);
    }
  };

  const apiErrMsg = (err: any, fallback: string) =>
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback;

  const openGrnDetail = async (g: ImportGrn) => {
    setDrawerError(null);
    setSelectedGrn(g);
    try {
      const full = await importApi.getGrn(g.id);
      setSelectedGrn(full);
    } catch {
      /* list row is enough */
    }
  };

  const handlePost = async (grn: ImportGrn) => {
    if (!canPost) {
      const msg = 'You do not have permission to post Import GRNs (import.grn.post).';
      setDrawerError(msg);
      setError(msg);
      return;
    }
    setPosting(true);
    setDrawerError(null);
    setError(null);
    try {
      const posted = await importApi.postGrn(grn.id);
      setSelectedGrn(posted);
      await fetchGrns();
    } catch (err: any) {
      const msg = apiErrMsg(err, 'Post failed');
      setDrawerError(msg);
      setError(msg);
    } finally {
      setPosting(false);
    }
  };

  const handleCancel = async (grn: ImportGrn) => {
    if (!canCancel) return;
    const reason = window.prompt('Cancel reason (required):');
    if (!reason?.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await importApi.cancelGrn(grn.id, { reason: reason.trim() });
      await fetchGrns();
      setSelectedGrn(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Cancel failed');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (val?: string | null) => {
    if (!val) return '—';
    try {
      return new Date(val).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return val;
    }
  };

  const gAny = (g: ImportGrn) => g as ImportGrn & Record<string, any>;

  return (
    <TradePage>
      <TradePageHeader
        title="Import GRN / Goods Receiving"
        subtitle="Receive against a shipment only after customs Released/Cleared — then landed cost allocation"
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
            {ready && canCreate ? (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold"
              >
                <Plus className="w-4 h-4" /> Receive Goods
              </button>
            ) : null}
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
        erpModuleLabel="Shipment → Customs → Receive"
        erpHref="/import/shipments"
        erpHrefLabel="Shipments"
        description="Import goods are received against the shipment after customs release. Local purchases still use Purchase GRN against a PO."
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
            placeholder="Search GRN, PO, shipment, container…"
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
            No Import GRNs yet. Receive goods against an arrived / cleared shipment after customs
            release.
          </div>
        ) : (
          <TradeTable>
            <TradeTableHeader
              columns={[
                'GRN No',
                'Shipment',
                'PO',
                'Warehouse',
                'Receipt Date',
                'Cost',
                'Status',
                'Actions',
              ]}
            />
            <TradeTableBody>
              {grns.map((g) => {
                const row = gAny(g);
                return (
                  <TradeTableRow key={g.id}>
                    <TradeTableCell className="font-bold text-[#014582]">
                      {g.grnNumber}
                      {row.isLegacy ? (
                        <span className="ml-1 text-[9px] text-amber-700 bg-amber-50 px-1 rounded">
                          Legacy
                        </span>
                      ) : null}
                    </TradeTableCell>
                    <TradeTableCell>{row.shipmentRef || g.shipmentId || '—'}</TradeTableCell>
                    <TradeTableCell>{row.poRef || g.importPoId || '—'}</TradeTableCell>
                    <TradeTableCell>{row.warehouseName || '—'}</TradeTableCell>
                    <TradeTableCell>
                      {formatDate(g.receivedDate || row.receiptDate)}
                    </TradeTableCell>
                    <TradeTableCell>
                      <span className="text-[10px] font-semibold text-slate-600">
                        {row.costStatus || 'Provisional'}
                      </span>
                    </TradeTableCell>
                    <TradeTableCell>
                      <TradeStatusBadge status={g.status} />
                      {row.isBonded ? (
                        <span className="ml-1 text-[9px] text-amber-800 bg-amber-50 px-1 rounded">
                          Bonded
                        </span>
                      ) : null}
                    </TradeTableCell>
                    <TradeTableCell>
                    <button
                      type="button"
                      onClick={() => void openGrnDetail(g)}
                      className="p-1.5 rounded-lg text-[#014582] hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    </TradeTableCell>
                  </TradeTableRow>
                );
              })}
            </TradeTableBody>
          </TradeTable>
        )}
      </TradeCard>

      <TradeDetailDrawer
        isOpen={Boolean(selectedGrn)}
        onClose={() => {
          setSelectedGrn(null);
          setDrawerError(null);
        }}
        title={selectedGrn?.grnNumber || 'Import GRN'}
        subtitle={`Status: ${selectedGrn?.status || ''}`}
      >
        {selectedGrn && (
          <div className="space-y-4 text-xs">
            {drawerError ? (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Could not post GRN</p>
                  <p className="mt-0.5 whitespace-pre-wrap">{drawerError}</p>
                  {/different from its creator/i.test(drawerError) ? (
                    <p className="mt-2 text-[11px] text-red-700">
                      Segregation of duties is ON. Ask another user with{' '}
                      <strong>import.grn.post</strong> to post, or turn off &quot;GRN must be
                      posted by a user different from its creator&quot; in{' '}
                      <Link href="/import/settings" className="underline font-semibold">
                        Import Settings
                      </Link>
                      .
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {gAny(selectedGrn).isLegacy || gAny(selectedGrn).legacyBanner ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Legacy - no shipment/customs link</p>
                  <p className="mt-0.5">
                    {gAny(selectedGrn).legacyBanner ||
                      'This GRN was created before shipment-gated receiving.'}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-gray-50 border">
              <div>
                <span className="text-[10px] uppercase text-gray-400">Shipment</span>
                <p className="font-semibold">
                  {gAny(selectedGrn).shipmentId ? (
                    <Link
                      href={`/import/shipments?id=${gAny(selectedGrn).shipmentId}`}
                      className="text-[#014582] hover:underline"
                    >
                      {gAny(selectedGrn).shipmentRef || selectedGrn.shipmentId}
                    </Link>
                  ) : (
                    '—'
                  )}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-gray-400">PO</span>
                <p className="font-semibold">
                  {selectedGrn.importPoId ? (
                    <Link
                      href={`/import/purchase-orders?id=${selectedGrn.importPoId}`}
                      className="text-[#014582] hover:underline"
                    >
                      {gAny(selectedGrn).poRef || selectedGrn.importPoId}
                    </Link>
                  ) : (
                    '—'
                  )}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-gray-400">Customs / BOE</span>
                <p className="font-semibold">
                  {gAny(selectedGrn).customsClearanceId ? (
                    <Link
                      href={`/import/customs?id=${gAny(selectedGrn).customsClearanceId}`}
                      className="text-[#014582] hover:underline"
                    >
                      {gAny(selectedGrn).boeNumber ||
                        gAny(selectedGrn).customsRef ||
                        'Open entry'}
                    </Link>
                  ) : (
                    '—'
                  )}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-gray-400">Warehouse</span>
                <p className="font-semibold">{gAny(selectedGrn).warehouseName || '—'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-gray-400">B/L · Container · Vessel</span>
                <p className="font-semibold">
                  {gAny(selectedGrn).shipment?.blNumber || '—'} ·{' '}
                  {gAny(selectedGrn).containerNo || '—'} ·{' '}
                  {gAny(selectedGrn).shipment?.vesselName ||
                    gAny(selectedGrn).shipment?.vesselFlight ||
                    '—'}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-gray-400">Landed cost</span>
                <p className="font-semibold">{gAny(selectedGrn).costStatus || 'Provisional'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-gray-400">Receipt date</span>
                <p className="font-semibold">
                  {formatDate(selectedGrn.receivedDate || gAny(selectedGrn).receiptDate)}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-gray-400">Received by</span>
                <p className="font-semibold">{gAny(selectedGrn).receivedBy || '—'}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedGrn.status === 'Draft' && canPost ? (
                <button
                  type="button"
                  disabled={posting || saving}
                  onClick={() => void handlePost(selectedGrn)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {posting ? 'Posting…' : 'Post GRN'}
                </button>
              ) : null}
              {selectedGrn.status === 'Draft' && !canPost ? (
                <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                  You need import.grn.post permission to post this GRN.
                </span>
              ) : null}
              {selectedGrn.status !== 'Cancelled' && canCancel ? (
                <button
                  type="button"
                  disabled={posting || saving}
                  onClick={() => void handleCancel(selectedGrn)}
                  className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 text-[11px] font-bold disabled:opacity-50"
                >
                  Cancel
                </button>
              ) : null}
            </div>

            <TradeTable>
              <TradeTableHeader
                columns={[
                  'Product',
                  'Shipped',
                  'Good',
                  'Short',
                  'Damaged',
                  'Rejected',
                  'Unit cost',
                ]}
              />
              <TradeTableBody>
                {(selectedGrn.items || []).map((it, idx) => {
                  const row = it as any;
                  return (
                    <TradeTableRow key={it.id || idx}>
                      <TradeTableCell className="font-semibold">{it.productName}</TradeTableCell>
                      <TradeTableCell>{row.shippedQty ?? '—'}</TradeTableCell>
                      <TradeTableCell>{row.acceptedQty ?? it.receivedQty}</TradeTableCell>
                      <TradeTableCell>{row.shortQty ?? 0}</TradeTableCell>
                      <TradeTableCell>{row.damagedQty ?? 0}</TradeTableCell>
                      <TradeTableCell>{it.rejectedQty}</TradeTableCell>
                      <TradeTableCell>
                        {row.unitCostFinal != null
                          ? Number(row.unitCostFinal).toFixed(4)
                          : row.unitCostProvisional != null
                            ? `${Number(row.unitCostProvisional).toFixed(4)} (prov.)`
                            : '—'}
                      </TradeTableCell>
                    </TradeTableRow>
                  );
                })}
              </TradeTableBody>
            </TradeTable>

            {(gAny(selectedGrn).supplierClaims || []).length > 0 ? (
              <div>
                <p className="text-[10px] uppercase text-gray-400 mb-1">Supplier claims</p>
                <ul className="space-y-1">
                  {(gAny(selectedGrn).supplierClaims as any[]).map((c) => (
                    <li key={c.id} className="p-2 rounded-lg border bg-white">
                      <span className="font-bold">{c.claimNumber}</span> · {c.claimType} · qty{' '}
                      {c.quantity} — {c.reason}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </TradeDetailDrawer>

      <TradeModal
        isOpen={isCreateOpen}
        onClose={() => !saving && setIsCreateOpen(false)}
        title="Import Goods Receipt (GRN)"
        maxWidth="max-w-5xl"
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
              onClick={() => void handleCreate()}
              className="px-4 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-60"
            >
              {saving
                ? 'Saving…'
                : confirmNow && canPost
                  ? 'Confirm Receipt & Post Stock'
                  : 'Save Draft GRN'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
          <FormSection title="Shipment (source)">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <FieldLabel required>Shipment</FieldLabel>
                <select
                  value={shipmentId}
                  onChange={(e) => setShipmentId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                >
                  <option value="">Select shipment with remaining qty…</option>
                  {receivable.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                      {s.customs && !s.customs.isReleased
                        ? ` · customs: ${s.customs.clearanceStatus}`
                        : ''}
                    </option>
                  ))}
                </select>
                {fieldErrors.shipmentId ? (
                  <p className="text-[10px] text-red-600 mt-1">{fieldErrors.shipmentId}</p>
                ) : null}
              </div>

              {preview ? (
                <div className="col-span-2 p-3 rounded-xl bg-slate-50 border space-y-1">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      PO:{' '}
                      {preview.importPoId ? (
                        <Link
                          href={`/import/purchase-orders?id=${preview.importPoId}`}
                          className="font-bold text-[#014582] hover:underline"
                        >
                          {preview.poNumber || preview.importPoId}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </span>
                    <span>PI: {preview.piRef || '—'}</span>
                    <span>LC: {preview.lcRef || '—'}</span>
                    <span>
                      Customs:{' '}
                      {preview.customs ? (
                        <Link
                          href={preview.customs.link || `/import/customs?id=${preview.customs.id}`}
                          className="font-bold text-[#014582] hover:underline"
                        >
                          {preview.customs.billOfEntryNo || preview.customs.entryNumber} (
                          {preview.customs.clearanceStatus})
                        </Link>
                      ) : (
                        <span className="text-amber-700 font-semibold">Missing</span>
                      )}
                    </span>
                    <span>
                      B/L: {preview.blNumber || '—'} ({preview.blType || '—'})
                      {preview.originalBlReceived ? ' · verified' : ''}
                    </span>
                    <span>Container: {preview.containerNo || '—'}</span>
                    <span>Vessel: {preview.vesselName || '—'}</span>
                  </div>
                  {fieldErrors.customs ? (
                    <p className="text-[10px] text-red-600">{fieldErrors.customs}</p>
                  ) : null}
                  {preview.settings?.allowGrnBeforeCustomsRelease &&
                  !preview.customs?.isReleased ? (
                    <div className="mt-2">
                      <FieldLabel required>Early receive reason (bonded stock)</FieldLabel>
                      <input
                        value={earlyReceiveReason}
                        onChange={(e) => setEarlyReceiveReason(e.target.value)}
                        className="w-full rounded-xl border px-3 py-2"
                        placeholder="Why receive before customs release?"
                      />
                      {fieldErrors.earlyReceiveReason ? (
                        <p className="text-[10px] text-red-600 mt-1">
                          {fieldErrors.earlyReceiveReason}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div>
                <FieldLabel required>Warehouse / location</FieldLabel>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                >
                  <option value="">Select warehouse…</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.code ? `${l.code} — ` : ''}
                      {l.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.locationId ? (
                  <p className="text-[10px] text-red-600 mt-1">{fieldErrors.locationId}</p>
                ) : null}
              </div>
              <div>
                <FieldLabel required>Receiving date</FieldLabel>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                />
                {fieldErrors.receiptDate ? (
                  <p className="text-[10px] text-red-600 mt-1">{fieldErrors.receiptDate}</p>
                ) : null}
              </div>
              <div>
                <FieldLabel required>Received by</FieldLabel>
                <input
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                  placeholder="Inspector / warehouse user"
                />
                {fieldErrors.receivedBy ? (
                  <p className="text-[10px] text-red-600 mt-1">{fieldErrors.receivedBy}</p>
                ) : null}
              </div>
              <div>
                <FieldLabel>Container No</FieldLabel>
                <input
                  value={containerNo}
                  onChange={(e) => setContainerNo(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                />
              </div>
              <div className="flex items-end gap-4 pb-2 col-span-2">
                <label className="inline-flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={sealIntact}
                    onChange={(e) => setSealIntact(e.target.checked)}
                  />
                  Seal intact
                </label>
                {canPost ? (
                  <label className="inline-flex items-center gap-2 font-semibold">
                    <input
                      type="checkbox"
                      checked={confirmNow}
                      onChange={(e) => setConfirmNow(e.target.checked)}
                    />
                    Confirm & post stock now
                  </label>
                ) : (
                  <span className="text-[10px] text-gray-500">
                    Save as Draft — a user with import.grn.post will post it
                  </span>
                )}
              </div>
              {fieldErrors.confirmNow ? (
                <p className="text-[10px] text-red-600 col-span-2">{fieldErrors.confirmNow}</p>
              ) : null}
            </div>
          </FormSection>

          <FormSection
            title="Shipment lines"
            subtitle="Good + short + damaged + rejected must not exceed remaining shipped qty. Partial receiving allowed."
          >
            {linesLoading ? (
              <div className="py-8 text-center text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading shipment lines…
              </div>
            ) : !shipmentId ? (
              <p className="text-center py-6 text-gray-400">Select a shipment to load lines</p>
            ) : lines.length === 0 ? (
              <p className="text-center py-6 text-gray-400">
                No remaining quantity on this shipment
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-gray-100 rounded-xl overflow-hidden min-w-[720px]">
                  <thead className="bg-gray-50 text-[10px] uppercase text-gray-400">
                    <tr>
                      <th className="text-left px-2 py-2">Product</th>
                      <th className="text-right px-2 py-2">Shipped</th>
                      <th className="text-right px-2 py-2">Progress</th>
                      <th className="text-right px-2 py-2">Good</th>
                      <th className="text-right px-2 py-2">Short</th>
                      <th className="text-right px-2 py-2">Damaged</th>
                      <th className="text-right px-2 py-2">Rejected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((it) => {
                      const q = recvQty[it.shipmentItemId] || {
                        accepted: '0',
                        short: '0',
                        damaged: '0',
                        rejected: '0',
                        shortReason: '',
                        damagedReason: '',
                        rejectedReason: '',
                      };
                      const setQ = (patch: Partial<LineQty>) =>
                        setRecvQty((m) => ({
                          ...m,
                          [it.shipmentItemId]: { ...q, ...patch },
                        }));
                      return (
                        <React.Fragment key={it.shipmentItemId}>
                          <tr className="border-t border-gray-50">
                            <td className="px-2 py-2">
                              <p className="font-semibold">{it.productName}</p>
                              <p className="text-[10px] text-gray-400 font-mono">
                                {it.sku || '—'} · {it.uom}
                              </p>
                            </td>
                            <td className="px-2 py-2 text-right font-semibold">{it.shippedQty}</td>
                            <td className="px-2 py-2 text-right text-[#014582] font-bold">
                              {it.receivedOfLabel ||
                                `Received ${it.previouslyReceivedQty} of ${it.shippedQty}`}
                              <div className="text-[10px] font-normal text-gray-500">
                                rem {it.remainingQty}
                              </div>
                            </td>
                            <td className="px-2 py-2 text-right">
                              <input
                                type="number"
                                min={0}
                                step="any"
                                disabled={it.remainingQty <= 0}
                                value={q.accepted}
                                onChange={(e) => setQ({ accepted: e.target.value })}
                                className="w-16 text-right rounded-lg border px-1 py-1 disabled:bg-gray-50"
                              />
                            </td>
                            <td className="px-2 py-2 text-right">
                              <input
                                type="number"
                                min={0}
                                step="any"
                                value={q.short}
                                onChange={(e) => setQ({ short: e.target.value })}
                                className="w-14 text-right rounded-lg border px-1 py-1"
                              />
                            </td>
                            <td className="px-2 py-2 text-right">
                              <input
                                type="number"
                                min={0}
                                step="any"
                                value={q.damaged}
                                onChange={(e) => setQ({ damaged: e.target.value })}
                                className="w-14 text-right rounded-lg border px-1 py-1"
                              />
                            </td>
                            <td className="px-2 py-2 text-right">
                              <input
                                type="number"
                                min={0}
                                step="any"
                                value={q.rejected}
                                onChange={(e) => setQ({ rejected: e.target.value })}
                                className="w-14 text-right rounded-lg border px-1 py-1"
                              />
                            </td>
                          </tr>
                          {(Number(q.short) > 0 ||
                            Number(q.damaged) > 0 ||
                            Number(q.rejected) > 0 ||
                            fieldErrors[`qty-${it.shipmentItemId}`]) && (
                            <tr className="bg-amber-50/50">
                              <td colSpan={7} className="px-2 py-2 space-y-1">
                                {fieldErrors[`qty-${it.shipmentItemId}`] ? (
                                  <p className="text-[10px] text-red-600">
                                    {fieldErrors[`qty-${it.shipmentItemId}`]}
                                  </p>
                                ) : null}
                                {Number(q.short) > 0 ? (
                                  <div>
                                    <input
                                      value={q.shortReason}
                                      onChange={(e) => setQ({ shortReason: e.target.value })}
                                      placeholder="Short reason *"
                                      className="w-full rounded-lg border px-2 py-1"
                                    />
                                    {fieldErrors[`short-${it.shipmentItemId}`] ? (
                                      <p className="text-[10px] text-red-600">
                                        {fieldErrors[`short-${it.shipmentItemId}`]}
                                      </p>
                                    ) : null}
                                  </div>
                                ) : null}
                                {Number(q.damaged) > 0 ? (
                                  <div>
                                    <input
                                      value={q.damagedReason}
                                      onChange={(e) => setQ({ damagedReason: e.target.value })}
                                      placeholder="Damaged reason * (not sellable)"
                                      className="w-full rounded-lg border px-2 py-1"
                                    />
                                    {fieldErrors[`damaged-${it.shipmentItemId}`] ? (
                                      <p className="text-[10px] text-red-600">
                                        {fieldErrors[`damaged-${it.shipmentItemId}`]}
                                      </p>
                                    ) : null}
                                  </div>
                                ) : null}
                                {Number(q.rejected) > 0 ? (
                                  <div>
                                    <input
                                      value={q.rejectedReason}
                                      onChange={(e) => setQ({ rejectedReason: e.target.value })}
                                      placeholder="Rejected reason *"
                                      className="w-full rounded-lg border px-2 py-1"
                                    />
                                    {fieldErrors[`rejected-${it.shipmentItemId}`] ? (
                                      <p className="text-[10px] text-red-600">
                                        {fieldErrors[`rejected-${it.shipmentItemId}`]}
                                      </p>
                                    ) : null}
                                  </div>
                                ) : null}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {fieldErrors.items ? (
              <p className="text-[10px] text-red-600 mt-2">{fieldErrors.items}</p>
            ) : null}
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
