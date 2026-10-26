'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Truck,
  Search,
  Eye,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Boxes,
  ExternalLink,
  Pencil,
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
  ErpLinkedBanner,
} from '../../../components/trade/TradeUI';
import {
  OrderSelect,
  OrderFilterBanner,
  PortSelect,
  FormSection,
  FieldLabel,
} from '../../../components/export/ExportSelectors';
import exportApi, {
  errorMessage,
  formatDate,
  type ExportDispatch,
  type ExportOrder,
  type ExportShipment,
} from '../../../lib/export-api';
import { useExportList } from '../../../lib/use-export-list';
import { usePermissions } from '../../../lib/usePermissions';
import { useLocation } from '../../../lib/location-context';

const DISPATCH_STATUSES = [
  'Staged at Warehouse',
  'En Route to Port',
  'Container Gate-In Complete',
  'Handed Over to Shipping Line',
];

const NEXT_STATUS: Record<string, string[]> = {
  'Staged at Warehouse': ['En Route to Port'],
  'En Route to Port': ['Container Gate-In Complete'],
  'Container Gate-In Complete': ['Handed Over to Shipping Line'],
  'Handed Over to Shipping Line': [],
};

type DispatchForm = {
  orderId: string;
  shipmentId: string;
  dispatchDate: string;
  transporterName: string;
  truckNo: string;
  driverName: string;
  driverPhone: string;
  destinationPort: string;
  sealNo: string;
  gatePassNo: string;
  locationId: string;
  notes: string;
};

const EMPTY_FORM: DispatchForm = {
  orderId: '',
  shipmentId: '',
  dispatchDate: new Date().toISOString().slice(0, 10),
  transporterName: '',
  truckNo: '',
  driverName: '',
  driverPhone: '',
  destinationPort: '',
  sealNo: '',
  gatePassNo: '',
  locationId: '',
  notes: '',
};

export default function ExportDispatchPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-10 text-center text-xs text-gray-400">Loading…</div>
      }
    >
      <ExportDispatchPageContent />
    </React.Suspense>
  );
}

function ExportDispatchPageContent() {
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const { locations, locationIdForApi } = useLocation();
  const canCreate = can('export.dispatch.create');
  const canEdit = can('export.dispatch.edit');

  const orderIdFilter = searchParams?.get('orderId') || undefined;
  const list = useExportList<ExportDispatch>((query) => exportApi.listDispatches(query), {
    limit: 20,
    extraQuery: orderIdFilter ? { orderId: orderIdFilter } : undefined,
  });

  const [selected, setSelected] = useState<ExportDispatch | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExportDispatch | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<DispatchForm>(EMPTY_FORM);
  const [shipments, setShipments] = useState<ExportShipment[]>([]);

  const updateForm = (patch: Partial<DispatchForm>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const loadShipments = async (orderId: string) => {
    if (!orderId) {
      setShipments([]);
      return;
    }
    try {
      const res = await exportApi.listShipments({ orderId, limit: 100 });
      setShipments((res.items || []).filter((s) => s.shipmentStatus !== 'Cancelled'));
    } catch {
      setShipments([]);
    }
  };

  const handleOrderChange = async (id: string, selectedOrder?: ExportOrder | null) => {
    updateForm({
      orderId: id,
      shipmentId: '',
      destinationPort: selectedOrder?.destinationPort || form.destinationPort,
      locationId: selectedOrder?.locationId || form.locationId,
    });
    await loadShipments(id);
  };

  const openCreate = async () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      orderId: orderIdFilter || '',
      locationId: locationIdForApi || '',
    });
    setShipments([]);
    setFormError(null);
    setModalOpen(true);
    if (orderIdFilter) {
      try {
        const order = await exportApi.getOrder(orderIdFilter);
        updateForm({
          destinationPort: order.destinationPort || '',
          locationId: order.locationId || locationIdForApi || '',
        });
        await loadShipments(orderIdFilter);
      } catch {
        // order selector surfaces the error if selected manually
      }
    }
  };

  const openEdit = async (dispatch: ExportDispatch) => {
    setEditing(dispatch);
    setForm({
      orderId: dispatch.orderId,
      shipmentId: dispatch.shipmentId,
      dispatchDate: dispatch.dispatchDate ? dispatch.dispatchDate.slice(0, 10) : '',
      transporterName: dispatch.transporterName || '',
      truckNo: dispatch.truckNo || '',
      driverName: dispatch.driverName || '',
      driverPhone: dispatch.driverPhone || '',
      destinationPort: dispatch.destinationPort || '',
      sealNo: dispatch.sealNo || '',
      gatePassNo: dispatch.gatePassNo || '',
      locationId: dispatch.locationId || '',
      notes: dispatch.notes || '',
    });
    setFormError(null);
    setModalOpen(true);
    await loadShipments(dispatch.orderId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!editing && !form.orderId) return setFormError('Select the export order being dispatched.');
    if (!editing && !form.shipmentId) return setFormError('Select the shipment being dispatched.');
    setSaving(true);
    try {
      const payload = {
        dispatchDate: form.dispatchDate || undefined,
        transporterName: form.transporterName || undefined,
        truckNo: form.truckNo || undefined,
        driverName: form.driverName || undefined,
        driverPhone: form.driverPhone || undefined,
        destinationPort: form.destinationPort || undefined,
        sealNo: form.sealNo || undefined,
        gatePassNo: form.gatePassNo || undefined,
        locationId: form.locationId || undefined,
        notes: form.notes || undefined,
      };
      let saved: ExportDispatch;
      if (editing) {
        saved = await exportApi.updateDispatch(editing.id, payload);
        toast.success(`Dispatch ${saved.dispatchNumber} updated`);
      } else {
        saved = await exportApi.createDispatch({
          ...payload,
          orderId: form.orderId,
          shipmentId: form.shipmentId,
        });
        toast.success(`Dispatch ${saved.dispatchNumber} staged at warehouse`);
      }
      setModalOpen(false);
      list.reload();
      setSelected(saved);
    } catch (err) {
      setFormError(errorMessage(err, editing ? 'Failed to update dispatch' : 'Failed to stage dispatch'));
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (dispatch: ExportDispatch, status: string) => {
    if (status === 'Handed Over to Shipping Line') {
      const confirmed = window.confirm(
        'Handing over to the shipping line will post the commercial export invoice, recognise revenue and receivable, deduct inventory and post COGS. This cannot be undone. Continue?'
      );
      if (!confirmed) return;
    }
    setActionId(dispatch.id);
    try {
      const updated = await exportApi.updateDispatchStatus(dispatch.id, status);
      setSelected(updated);
      list.setItems((prev) => prev.map((row) => (row.id === dispatch.id ? updated : row)));
      toast.success(
        status === 'Handed Over to Shipping Line'
          ? `Dispatch handed over — commercial invoice ${updated.salesInvoiceId ? 'posted' : 'created'}`
          : `Dispatch moved to ${status}`
      );
    } catch (err) {
      toast.error(errorMessage(err, `Failed to move dispatch to ${status}`));
    } finally {
      setActionId(null);
    }
  };

  return (
    <TradePage>
      <TradePageHeader
        title="Export Dispatch & Port Gate-In"
        subtitle="Warehouse gate-out, container haulage, port gate pass validation and shipping line handover"
        moduleName="Export Operations"
        backHref="/export/dashboard"
        icon={<Truck className="w-5 h-5 text-white" />}
        actions={
          canCreate ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Stage Dispatch
            </button>
          ) : undefined
        }
      />

      <ErpLinkedBanner
        moduleLabel="Export Dispatch"
        erpModuleLabel="Sales & Inventory"
        erpHref="/sales/invoices"
        description="Handing a dispatch to the shipping line posts the commercial export invoice through the shared Sales ledger, recognises AR/revenue/COGS and deducts stock. The linked records remain visible in Sales and Inventory."
      />

      <TradeCard>
        <OrderFilterBanner orderId={orderIdFilter} entityLabel="dispatches" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search dispatch, truck, gate pass…"
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
              <option value="">All dispatch statuses</option>
              {DISPATCH_STATUSES.map((s) => (
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
            columns={['Dispatch No', 'Order Ref', 'Shipment', 'Transporter', 'Vehicle No', 'Driver', 'Destination Port', 'Seal / Gate Pass', 'Status', 'Actions']}
          />
          <TradeTableBody>
            {list.loading && list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={10}>
                  <RefreshCw className="w-4 h-4 animate-spin inline mr-2" /> Loading dispatches…
                </TradeTableCell>
              </TradeTableRow>
            ) : list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={10}>
                  No dispatches match the current filters.
                </TradeTableCell>
              </TradeTableRow>
            ) : (
              list.items.map((dispatch) => (
                <TradeTableRow key={dispatch.id}>
                  <TradeTableCell className="font-bold text-[#014582]">
                    {dispatch.dispatchNumber}
                  </TradeTableCell>
                  <TradeTableCell className="font-semibold text-gray-800">
                    <Link href={`/export/orders?order=${dispatch.orderId}`} className="hover:underline text-blue-700">
                      {dispatch.orderNumber || dispatch.orderId.slice(0, 8)}
                    </Link>
                  </TradeTableCell>
                  <TradeTableCell className="font-mono text-xs text-gray-700">
                    {dispatch.shipmentNumber || dispatch.shipmentId.slice(0, 8)}
                  </TradeTableCell>
                  <TradeTableCell className="font-medium text-gray-900">
                    {dispatch.transporterName || '—'}
                  </TradeTableCell>
                  <TradeTableCell className="font-mono text-xs font-semibold text-gray-800">
                    {dispatch.truckNo || '—'}
                  </TradeTableCell>
                  <TradeTableCell>
                    <span className="font-medium text-gray-800 block text-xs">{dispatch.driverName || '—'}</span>
                    <span className="text-[10px] text-gray-400">{dispatch.driverPhone || ''}</span>
                  </TradeTableCell>
                  <TradeTableCell className="text-xs text-gray-800">
                    {dispatch.destinationPort || '—'}
                  </TradeTableCell>
                  <TradeTableCell className="text-[11px]">
                    <span className="font-mono block text-gray-700">{dispatch.sealNo || '—'}</span>
                    <span className="font-mono text-blue-700">{dispatch.gatePassNo || '—'}</span>
                  </TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={dispatch.status} />
                  </TradeTableCell>
                  <TradeTableCell>
                    <button
                      type="button"
                      onClick={() => setSelected(dispatch)}
                      className="p-1.5 rounded-lg text-[#014582] hover:bg-blue-50 transition-colors"
                      title="View dispatch"
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
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.dispatchNumber || 'Export Dispatch'}
        subtitle={
          selected
            ? `Order ${selected.orderNumber || selected.orderId.slice(0, 8)} · ${selected.transporterName || 'Transporter TBA'}`
            : undefined
        }
        actions={
          selected ? (
            <div className="flex flex-wrap items-center gap-2">
              {canEdit &&
                !['Handed Over to Shipping Line', 'Cancelled'].includes(selected.status) && (
                  <button
                    type="button"
                    onClick={() => openEdit(selected)}
                    className="px-3.5 py-2 rounded-xl border border-[#014582]/30 text-[#014582] text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
              {canEdit &&
                (NEXT_STATUS[selected.status] || []).map((next) => (
                  <button
                    key={next}
                    type="button"
                    disabled={actionId === selected.id}
                    onClick={() => handleStatus(selected, next)}
                    className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> {next}
                  </button>
                ))}
            </div>
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Dispatch Number</span>
                <span className="font-bold text-gray-900">{selected.dispatchNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Dispatch Date</span>
                <span className="font-semibold text-gray-900">{formatDate(selected.dispatchDate)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Export Order</span>
                <Link
                  href={`/export/orders?order=${selected.orderId}`}
                  className="font-semibold text-blue-700 hover:underline"
                >
                  {selected.orderNumber || selected.orderId.slice(0, 8)}
                </Link>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Shipment</span>
                <span className="font-mono text-gray-700">
                  {selected.shipmentNumber || selected.shipmentId.slice(0, 8)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Transporter</span>
                <span className="font-semibold text-gray-900">{selected.transporterName || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Vehicle</span>
                <span className="font-mono font-bold text-gray-900">{selected.truckNo || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Driver</span>
                <span className="font-semibold text-gray-900">
                  {selected.driverName || '—'} {selected.driverPhone ? `· ${selected.driverPhone}` : ''}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Destination Port</span>
                <span className="font-semibold text-gray-900">{selected.destinationPort || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Seal Number</span>
                <span className="font-mono font-bold text-gray-900">{selected.sealNo || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Gate Pass</span>
                <span className="font-mono font-bold text-[#014582]">{selected.gatePassNo || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Status</span>
                <TradeStatusBadge status={selected.status} />
              </div>
            </div>

            {selected.stockPostedAt ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Boxes className="w-4 h-4" /> Inventory & accounting posted
                </p>
                <p className="text-[11px]">
                  Stock deducted and commercial invoice raised on {formatDate(selected.stockPostedAt)}.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link
                    href="/sales/invoices"
                    className="inline-flex items-center gap-1 text-[11px] font-bold hover:underline"
                  >
                    Sales invoices <ExternalLink className="w-3 h-3" />
                  </Link>
                  <Link
                    href="/inventory/stock-movements"
                    className="inline-flex items-center gap-1 text-[11px] font-bold hover:underline"
                  >
                    Stock movements <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-900">
                <p className="font-bold">Not yet handed over</p>
                <p className="text-[11px]">
                  Inventory and the commercial invoice are posted only when the dispatch is handed over to the
                  shipping line. Certified packing and customs LEO may be required by company settings.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/export/documents?orderId=${selected.orderId}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Documents
              </Link>
              <Link
                href={`/export/receipts?orderId=${selected.orderId}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Receipts
              </Link>
              <Link
                href={`/export/orders?order=${selected.orderId}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Export order
              </Link>
            </div>

            {selected.notes && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-900">
                <span className="font-bold block text-xs mb-1">Notes</span>
                <p className="text-xs whitespace-pre-wrap">{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </TradeDetailDrawer>

      <TradeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit Dispatch ${editing.dispatchNumber}` : 'Stage Export Dispatch'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" /> {formError}
            </div>
          )}

          <FormSection title="Order & shipment">
            {!editing && (
              <div>
                <FieldLabel required>Export order</FieldLabel>
                <OrderSelect value={form.orderId} onChange={handleOrderChange} required disabled={saving} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel required={!editing}>Shipment</FieldLabel>
                <select
                  value={form.shipmentId}
                  onChange={(e) => updateForm({ shipmentId: e.target.value })}
                  disabled={Boolean(editing) || saving}
                  required={!editing}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs disabled:bg-gray-50"
                >
                  <option value="">Select shipment…</option>
                  {shipments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shipmentNumber} — {s.shipmentStatus}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Dispatch date</FieldLabel>
                <input
                  type="date"
                  value={form.dispatchDate}
                  onChange={(e) => updateForm({ dispatchDate: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <FieldLabel>Transporter</FieldLabel>
                <input
                  value={form.transporterName}
                  onChange={(e) => updateForm({ transporterName: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <FieldLabel>Truck / trailer no</FieldLabel>
                <input
                  value={form.truckNo}
                  onChange={(e) => updateForm({ truckNo: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <FieldLabel>Driver name</FieldLabel>
                <input
                  value={form.driverName}
                  onChange={(e) => updateForm({ driverName: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <FieldLabel>Driver phone</FieldLabel>
                <input
                  value={form.driverPhone}
                  onChange={(e) => updateForm({ driverPhone: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Port, seal & gate pass">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Destination port</FieldLabel>
                <PortSelect
                  value={form.destinationPort}
                  onChange={(name) => updateForm({ destinationPort: name })}
                  placeholder="Select destination port…"
                />
              </div>
              <div>
                <FieldLabel>Warehouse / location</FieldLabel>
                <select
                  value={form.locationId}
                  onChange={(e) => updateForm({ locationId: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                >
                  <option value="">Default location</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Container seal no</FieldLabel>
                <input
                  value={form.sealNo}
                  onChange={(e) => updateForm({ sealNo: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <FieldLabel>Gate pass no</FieldLabel>
                <input
                  value={form.gatePassNo}
                  onChange={(e) => updateForm({ gatePassNo: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
            </div>
          </FormSection>

          <div>
            <FieldLabel>Notes</FieldLabel>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => updateForm({ notes: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || (!editing && (!form.orderId || !form.shipmentId))}
              className="px-4 py-2 rounded-lg bg-[#014582] text-white hover:bg-[#01366a] text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'Saving…' : editing ? 'Save Dispatch' : 'Stage Dispatch'}
            </button>
          </div>
        </form>
      </TradeModal>
    </TradePage>
  );
}
