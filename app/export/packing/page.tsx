'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  PackageCheck,
  Search,
  Eye,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Truck,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
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
  TradePagination,
} from '../../../components/trade/TradeUI';
import {
  OrderSelect,
  OrderFilterBanner,
  FormSection,
  FieldLabel,
} from '../../../components/export/ExportSelectors';
import exportApi, {
  errorMessage,
  formatDate,
  type ExportOrder,
  type ExportPacking,
} from '../../../lib/export-api';
import { useExportList } from '../../../lib/use-export-list';
import { usePermissions } from '../../../lib/usePermissions';

const PACKING_STATUSES = [
  'Inspection Scheduled',
  'Sample Tested',
  'Passed & Certified',
  'Rejection / Re-pack',
];

const NEXT_STATUS: Record<string, string[]> = {
  'Inspection Scheduled': ['Sample Tested', 'Rejection / Re-pack'],
  'Sample Tested': ['Passed & Certified', 'Rejection / Re-pack'],
  'Rejection / Re-pack': ['Inspection Scheduled'],
  'Passed & Certified': [],
};

const CONTAINER_TYPES = ['20ft Standard', '40ft Standard', '40ft High Cube', '20ft Reefer', '40ft Reefer', 'LCL'];

type PackingLine = {
  productId?: string | null;
  productName: string;
  sku?: string | null;
  quantity: number;
  uom: string;
  packages: number;
  grossWeightKg: number;
  netWeightKg: number;
  cbm: number;
};

function linesFromOrder(order: ExportOrder): PackingLine[] {
  return order.items.map((item) => ({
    productId: item.productId || null,
    productName: item.productName,
    sku: item.sku,
    quantity: Number(item.quantity),
    uom: item.uom,
    packages: 1,
    grossWeightKg: 0,
    netWeightKg: 0,
    cbm: 0,
  }));
}

export default function ExportPackingPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-10 text-center text-xs text-gray-400">Loading…</div>
      }
    >
      <ExportPackingPageContent />
    </React.Suspense>
  );
}

function ExportPackingPageContent() {
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const canCreate = can('export.packing.create');
  const canEdit = can('export.packing.edit');

  const orderIdFilter = searchParams?.get('orderId') || undefined;
  const list = useExportList<ExportPacking>((query) => exportApi.listPackings(query), {
    limit: 20,
    extraQuery: orderIdFilter ? { orderId: orderIdFilter } : undefined,
  });

  const [selectedPacking, setSelectedPacking] = useState<ExportPacking | null>(null);
  const [certificate, setCertificate] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<ExportOrder | null>(null);
  const [packingDate, setPackingDate] = useState(new Date().toISOString().slice(0, 10));
  const [containerNo, setContainerNo] = useState('');
  const [sealNo, setSealNo] = useState('');
  const [containerType, setContainerType] = useState('40ft High Cube');
  const [inspectionAgency, setInspectionAgency] = useState('');
  const [inspectionCertificateNo, setInspectionCertificateNo] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<PackingLine[]>([]);

  const resetForm = useCallback((presetOrderId?: string) => {
    setOrderId(presetOrderId || '');
    setOrder(null);
    setPackingDate(new Date().toISOString().slice(0, 10));
    setContainerNo('');
    setSealNo('');
    setContainerType('40ft High Cube');
    setInspectionAgency('');
    setInspectionCertificateNo('');
    setNotes('');
    setLines([]);
    setFormError(null);
  }, []);

  const openPacking = (packing: ExportPacking) => {
    setSelectedPacking(packing);
    setCertificate(packing.inspectionCertificateNo || '');
  };

  const updateLine = (index: number, patch: Partial<PackingLine>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const totals = lines.reduce(
    (acc, line) => ({
      packages: acc.packages + Number(line.packages || 0),
      gross: acc.gross + Number(line.grossWeightKg || 0),
      net: acc.net + Number(line.netWeightKg || 0),
      cbm: acc.cbm + Number(line.cbm || 0),
    }),
    { packages: 0, gross: 0, net: 0, cbm: 0 }
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!orderId) return setFormError('Select the export order being packed.');
    if (!lines.length) return setFormError('This order has no items to pack.');
    setSaving(true);
    try {
      const created = await exportApi.createPacking({
        orderId,
        packingDate: packingDate || undefined,
        containerNo: containerNo || undefined,
        sealNo: sealNo || undefined,
        containerType: containerType || undefined,
        inspectionAgency: inspectionAgency || undefined,
        inspectionCertificateNo: inspectionCertificateNo || undefined,
        notes: notes || undefined,
        items: lines.map((line) => ({
          productId: line.productId || undefined,
          productName: line.productName,
          sku: line.sku || undefined,
          quantity: Number(line.quantity),
          uom: line.uom,
          packages: Number(line.packages || 0),
          grossWeightKg: Number(line.grossWeightKg || 0),
          netWeightKg: Number(line.netWeightKg || 0),
          cbm: Number(line.cbm || 0),
        })),
      });
      toast.success(`Packing list ${created.packingListNo} created`);
      setIsCreateOpen(false);
      resetForm();
      list.reload();
      openPacking(created);
    } catch (err) {
      setFormError(errorMessage(err, 'Failed to create packing list'));
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (packing: ExportPacking, status: string) => {
    if (status === 'Passed & Certified' && !certificate.trim()) {
      toast.error('Enter the inspection certificate number before certifying');
      return;
    }
    setActionId(packing.id);
    try {
      const updated = await exportApi.updatePackingStatus(packing.id, status, {
        inspectionCertificateNo:
          status === 'Passed & Certified' ? certificate.trim() : undefined,
      });
      setSelectedPacking(updated);
      setCertificate(updated.inspectionCertificateNo || '');
      list.setItems((prev) => prev.map((row) => (row.id === packing.id ? updated : row)));
      toast.success(`Inspection moved to ${status}`);
    } catch (err) {
      toast.error(errorMessage(err, `Failed to move inspection to ${status}`));
    } finally {
      setActionId(null);
    }
  };

  return (
    <TradePage>
      <TradePageHeader
        title="Export Packing & Pre-Shipment Inspection"
        subtitle="Container stuffing, seal numbers, gross/net weights, volumetric CBM and pre-shipment certification"
        moduleName="Export Operations"
        backHref="/export/dashboard"
        icon={<PackageCheck className="w-5 h-5 text-white" />}
        actions={
          canCreate ? (
            <button
              type="button"
              onClick={() => {
                resetForm(orderIdFilter);
                setIsCreateOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Packing List
            </button>
          ) : undefined
        }
      />

      <TradeCard>
        <OrderFilterBanner orderId={orderIdFilter} entityLabel="packing lists" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search packing list, container or seal…"
                value={list.search}
                onChange={(e) => list.setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#014582]"
              />
            </div>
            <select
              value={list.status}
              onChange={(e) => list.setStatus(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white"
            >
              <option value="">All inspection statuses</option>
              {PACKING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={list.reload}
            disabled={list.loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${list.loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {list.error && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {list.error}
            </span>
            <button type="button" onClick={list.reload} className="font-bold underline">
              Retry
            </button>
          </div>
        )}

        <TradeTable>
          <TradeTableHeader
            columns={['Packing List No', 'Order Ref', 'Overseas Customer', 'Container No', 'Seal No', 'Gross Weight', 'CBM Volume', 'Inspection Agency', 'Status', 'Actions']}
          />
          <TradeTableBody>
            {list.loading && list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={10}>
                  <RefreshCw className="w-4 h-4 animate-spin inline mr-2" /> Loading packing lists…
                </TradeTableCell>
              </TradeTableRow>
            ) : list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={10}>
                  No packing lists match the current filters.
                </TradeTableCell>
              </TradeTableRow>
            ) : (
              list.items.map((pk) => (
                <TradeTableRow key={pk.id}>
                  <TradeTableCell className="font-bold text-[#014582]">{pk.packingListNo}</TradeTableCell>
                  <TradeTableCell className="font-semibold text-gray-800">
                    <Link href={`/export/orders?order=${pk.orderId}`} className="hover:underline text-blue-700">
                      {pk.orderNumber || pk.orderId.slice(0, 8)}
                    </Link>
                  </TradeTableCell>
                  <TradeTableCell className="font-semibold text-gray-900">
                    {pk.orderCustomerName || '—'}
                  </TradeTableCell>
                  <TradeTableCell className="font-mono text-xs font-semibold text-gray-800">
                    {pk.containerNo || '—'}
                  </TradeTableCell>
                  <TradeTableCell className="font-mono text-xs text-gray-700">{pk.sealNo || '—'}</TradeTableCell>
                  <TradeTableCell className="font-bold text-gray-900">
                    {Number(pk.totalGrossWeightKg).toLocaleString()} KG
                  </TradeTableCell>
                  <TradeTableCell className="text-gray-800 font-medium">
                    {Number(pk.totalCbm).toLocaleString()} m³
                  </TradeTableCell>
                  <TradeTableCell className="text-xs text-blue-800 font-medium">
                    {pk.inspectionAgency || '—'}
                  </TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={pk.inspectionStatus} />
                  </TradeTableCell>
                  <TradeTableCell>
                    <button
                      type="button"
                      onClick={() => openPacking(pk)}
                      className="p-1.5 rounded-lg text-[#014582] hover:bg-blue-50 transition-colors"
                      title="View packing list"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </TradeTableCell>
                </TradeTableRow>
              ))
            )}
          </TradeTableBody>
        </TradeTable>

        <TradePagination
          currentPage={list.page}
          totalPages={list.pages}
          totalItems={list.total}
          pageSize={list.pageInfo.limit}
          onPageChange={list.changePage}
        />
      </TradeCard>

      <TradeDetailDrawer
        isOpen={Boolean(selectedPacking)}
        onClose={() => setSelectedPacking(null)}
        title={selectedPacking?.packingListNo || 'Packing & Inspection'}
        subtitle={
          selectedPacking
            ? `${selectedPacking.orderNumber || 'Export order'} · ${selectedPacking.orderCustomerName || ''}`
            : undefined
        }
        actions={
          selectedPacking ? (
            <div className="flex flex-wrap items-center gap-2">
              {canEdit &&
                (NEXT_STATUS[selectedPacking.inspectionStatus] || []).map((next) => (
                  <button
                    key={next}
                    type="button"
                    disabled={actionId === selectedPacking.id}
                    onClick={() => handleStatus(selectedPacking, next)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5 ${
                      next === 'Rejection / Re-pack'
                        ? 'border border-red-200 text-red-600'
                        : 'bg-[#014582] text-white'
                    }`}
                  >
                    {next === 'Rejection / Re-pack' ? (
                      <XCircle className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    {next}
                  </button>
                ))}
              {selectedPacking.inspectionStatus === 'Passed & Certified' && (
                <Link
                  href={`/export/dispatch?orderId=${selectedPacking.orderId}`}
                  className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" /> Schedule Dispatch
                </Link>
              )}
            </div>
          ) : undefined
        }
      >
        {selectedPacking && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Packing List No</span>
                <span className="font-bold text-gray-900">{selectedPacking.packingListNo}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Export Order</span>
                <Link
                  href={`/export/orders?order=${selectedPacking.orderId}`}
                  className="font-semibold text-blue-700 hover:underline"
                >
                  {selectedPacking.orderNumber || selectedPacking.orderId.slice(0, 8)}
                </Link>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Packing Date</span>
                <span className="font-semibold text-gray-900">{formatDate(selectedPacking.packingDate)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Container Number</span>
                <span className="font-mono font-bold text-gray-900">{selectedPacking.containerNo || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Seal Number</span>
                <span className="font-mono font-bold text-gray-900">{selectedPacking.sealNo || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Container Spec</span>
                <span className="font-semibold text-gray-900">{selectedPacking.containerType || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Total Gross Weight</span>
                <span className="font-bold text-gray-900">
                  {Number(selectedPacking.totalGrossWeightKg).toLocaleString()} KG
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Total Net Weight</span>
                <span className="font-bold text-gray-900">
                  {Number(selectedPacking.totalNetWeightKg).toLocaleString()} KG
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Total Volume</span>
                <span className="font-bold text-gray-900">{Number(selectedPacking.totalCbm).toLocaleString()} m³</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Packages</span>
                <span className="font-bold text-gray-900">{selectedPacking.packagesCount}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Inspection Agency</span>
                <span className="font-semibold text-gray-900">{selectedPacking.inspectionAgency || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Inspection Status</span>
                <TradeStatusBadge status={selectedPacking.inspectionStatus} />
              </div>
            </div>

            {selectedPacking.inspectionStatus !== 'Passed & Certified' && canEdit && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100 space-y-2">
                <div>
                  <FieldLabel>Inspection certificate number</FieldLabel>
                  <input
                    value={certificate}
                    onChange={(e) => setCertificate(e.target.value)}
                    placeholder="Required before certifying the packing list"
                    className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs"
                  />
                </div>
                <p className="text-[11px] text-amber-800">
                  Certification requires an inspection certificate number. Dispatch handover is blocked until
                  the packing list is certified.
                </p>
              </div>
            )}

            {selectedPacking.inspectionCertificateNo && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900">
                <span className="font-bold block text-[11px] uppercase">Certificate</span>
                <span className="font-mono font-bold">{selectedPacking.inspectionCertificateNo}</span>
              </div>
            )}

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Packed Items</h4>
              <TradeTable>
                <TradeTableHeader
                  columns={['SKU', 'Item', 'Quantity', 'Packages', 'Gross KG', 'Net KG', 'CBM']}
                />
                <TradeTableBody>
                  {selectedPacking.items.map((item) => (
                    <TradeTableRow key={item.id}>
                      <TradeTableCell className="font-mono">{item.sku || '—'}</TradeTableCell>
                      <TradeTableCell className="font-medium text-gray-900">{item.productName}</TradeTableCell>
                      <TradeTableCell className="font-bold">
                        {Number(item.quantity)} {item.uom}
                      </TradeTableCell>
                      <TradeTableCell>{item.packages}</TradeTableCell>
                      <TradeTableCell>{Number(item.grossWeightKg).toLocaleString()}</TradeTableCell>
                      <TradeTableCell>{Number(item.netWeightKg).toLocaleString()}</TradeTableCell>
                      <TradeTableCell>{Number(item.cbm).toLocaleString()}</TradeTableCell>
                    </TradeTableRow>
                  ))}
                </TradeTableBody>
              </TradeTable>
            </div>

            {selectedPacking.notes && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-900">
                <span className="font-bold block text-xs mb-1">Notes</span>
                <p className="text-xs whitespace-pre-wrap">{selectedPacking.notes}</p>
              </div>
            )}
          </div>
        )}
      </TradeDetailDrawer>

      <TradeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Packing & Inspection List"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {formError && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" /> {formError}
            </div>
          )}

          <FormSection title="Order & container">
            <div>
              <FieldLabel required>Export order</FieldLabel>
              <OrderSelect
                value={orderId}
                onChange={(id, selected) => {
                  setOrderId(id);
                  setOrder(selected || null);
                  setLines(selected ? linesFromOrder(selected) : []);
                }}
                required
                disabled={saving}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <FieldLabel>Packing date</FieldLabel>
                <input
                  type="date"
                  value={packingDate}
                  onChange={(e) => setPackingDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <FieldLabel>Container no</FieldLabel>
                <input
                  value={containerNo}
                  onChange={(e) => setContainerNo(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                  placeholder="e.g. MSCU1234567"
                />
              </div>
              <div>
                <FieldLabel>Seal no</FieldLabel>
                <input
                  value={sealNo}
                  onChange={(e) => setSealNo(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <FieldLabel>Container type</FieldLabel>
                <select
                  value={containerType}
                  onChange={(e) => setContainerType(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                >
                  {CONTAINER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Inspection agency</FieldLabel>
                <input
                  value={inspectionAgency}
                  onChange={(e) => setInspectionAgency(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                  placeholder="e.g. SGS, Bureau Veritas"
                />
              </div>
              <div>
                <FieldLabel>Inspection certificate no</FieldLabel>
                <input
                  value={inspectionCertificateNo}
                  onChange={(e) => setInspectionCertificateNo(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Packed items" subtitle="Quantities default from the order; record packages, weights and volume">
            {lines.length === 0 ? (
              <p className="text-center text-gray-400 py-4 text-xs">
                Select an export order to load its items.
              </p>
            ) : (
              <div className="space-y-2">
                {lines.map((line, index) => (
                  <div key={`${line.productId || line.productName}-${index}`} className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{line.productName}</p>
                        <p className="text-[10px] text-gray-400">
                          {line.sku || 'No SKU'} · {Number(line.quantity)} {line.uom}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <FieldLabel>Packages</FieldLabel>
                        <input
                          type="number"
                          min="0"
                          value={line.packages}
                          onChange={(e) => updateLine(index, { packages: Number(e.target.value) })}
                          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <FieldLabel>Gross KG</FieldLabel>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={line.grossWeightKg}
                          onChange={(e) => updateLine(index, { grossWeightKg: Number(e.target.value) })}
                          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <FieldLabel>Net KG</FieldLabel>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={line.netWeightKg}
                          onChange={(e) => updateLine(index, { netWeightKg: Number(e.target.value) })}
                          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <FieldLabel>CBM</FieldLabel>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={line.cbm}
                          onChange={(e) => updateLine(index, { cbm: Number(e.target.value) })}
                          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="p-3 rounded-xl bg-[#014582]/5 border border-[#014582]/15 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-700">
              <p>
                Packages <strong className="block text-gray-900">{totals.packages}</strong>
              </p>
              <p>
                Gross <strong className="block text-gray-900">{totals.gross.toLocaleString()} KG</strong>
              </p>
              <p>
                Net <strong className="block text-gray-900">{totals.net.toLocaleString()} KG</strong>
              </p>
              <p>
                Volume <strong className="block text-gray-900">{totals.cbm.toLocaleString()} m³</strong>
              </p>
            </div>
          </FormSection>

          <div>
            <FieldLabel>Notes</FieldLabel>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !orderId}
              className="px-4 py-2 rounded-lg bg-[#014582] text-white hover:bg-[#01366a] text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Create Packing List'}
            </button>
          </div>
        </form>
      </TradeModal>
    </TradePage>
  );
}
