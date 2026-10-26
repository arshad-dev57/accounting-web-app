'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Ship,
  Search,
  Eye,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MapPin,
  ArrowRight,
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
  type ExportOrder,
  type ExportShipment,
} from '../../../lib/export-api';
import { useExportList } from '../../../lib/use-export-list';
import { usePermissions } from '../../../lib/usePermissions';
import { useLocation } from '../../../lib/location-context';

const SHIPMENT_STATUSES = [
  'Booking Confirmed',
  'Container Gate-In',
  'Loaded on Vessel',
  'In Transit',
  'Arrived at Destination',
  'Customs Cleared Buyer',
  'Cancelled',
];

const NEXT_STATUS: Record<string, string[]> = {
  'Booking Confirmed': ['Container Gate-In', 'Cancelled'],
  'Container Gate-In': ['Loaded on Vessel', 'Cancelled'],
  'Loaded on Vessel': ['In Transit'],
  'In Transit': ['Arrived at Destination'],
  'Arrived at Destination': ['Customs Cleared Buyer'],
  'Customs Cleared Buyer': [],
  Cancelled: [],
};

type ShipmentLine = {
  productId: string;
  productName: string;
  sku?: string | null;
  quantity: number;
  uom: string;
};

type BookingForm = {
  orderId: string;
  shippingLine: string;
  bookingRef: string;
  blNumber: string;
  portOfLoading: string;
  portOfDischarge: string;
  vesselName: string;
  etd: string;
  eta: string;
  currentPosition: string;
  locationId: string;
  notes: string;
};

const EMPTY_BOOKING: BookingForm = {
  orderId: '',
  shippingLine: '',
  bookingRef: '',
  blNumber: '',
  portOfLoading: '',
  portOfDischarge: '',
  vesselName: '',
  etd: '',
  eta: '',
  currentPosition: '',
  locationId: '',
  notes: '',
};

export default function ExportShipmentsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-10 text-center text-xs text-gray-400">Loading…</div>
      }
    >
      <ExportShipmentsPageContent />
    </React.Suspense>
  );
}

function ExportShipmentsPageContent() {
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const { locations, locationIdForApi } = useLocation();
  const canCreate = can('export.shipments.create');
  const canEdit = can('export.shipments.edit');

  const orderIdFilter = searchParams?.get('orderId') || undefined;
  const list = useExportList<ExportShipment>((query) => exportApi.listShipments(query), {
    limit: 20,
    extraQuery: orderIdFilter ? { orderId: orderIdFilter } : undefined,
  });

  const [selected, setSelected] = useState<ExportShipment | null>(null);
  const [position, setPosition] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExportShipment | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<BookingForm>(EMPTY_BOOKING);
  const [order, setOrder] = useState<ExportOrder | null>(null);
  const [lines, setLines] = useState<ShipmentLine[]>([]);

  const openShipment = (shipment: ExportShipment) => {
    setSelected(shipment);
    setPosition(shipment.currentPosition || '');
  };

  const updateForm = (patch: Partial<BookingForm>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_BOOKING, orderId: orderIdFilter || '', locationId: locationIdForApi || '' });
    setOrder(null);
    setLines([]);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (shipment: ExportShipment) => {
    setEditing(shipment);
    setForm({
      orderId: shipment.orderId,
      shippingLine: shipment.shippingLine || '',
      bookingRef: shipment.bookingRef || '',
      blNumber: shipment.blNumber || '',
      portOfLoading: shipment.portOfLoading || '',
      portOfDischarge: shipment.portOfDischarge || '',
      vesselName: shipment.vesselName || '',
      etd: shipment.etd ? shipment.etd.slice(0, 10) : '',
      eta: shipment.eta ? shipment.eta.slice(0, 10) : '',
      currentPosition: shipment.currentPosition || '',
      locationId: shipment.locationId || '',
      notes: shipment.notes || '',
    });
    setOrder(null);
    setLines(
      shipment.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: Number(item.quantity),
        uom: item.uom,
      }))
    );
    setFormError(null);
    setModalOpen(true);
  };

  const handleOrderChange = (id: string, selectedOrder?: ExportOrder | null) => {
    updateForm({
      orderId: id,
      portOfDischarge: form.portOfDischarge || selectedOrder?.destinationPort || '',
    });
    setOrder(selectedOrder || null);
    setLines(
      selectedOrder
        ? selectedOrder.items.map((item) => ({
            productId: item.productId || '',
            productName: item.productName,
            sku: item.sku,
            quantity: Number(item.quantity),
            uom: item.uom,
          }))
        : []
    );
  };

  const updateLine = (index: number, quantity: number) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, quantity } : line)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!editing && !form.orderId) return setFormError('Select the export order for this shipment.');
    if (!editing && !lines.length) return setFormError('There are no remaining items to ship.');
    if (!editing && lines.some((line) => !line.quantity || line.quantity <= 0)) {
      return setFormError('Every shipment line needs a quantity greater than zero.');
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        shippingLine: form.shippingLine || undefined,
        bookingRef: form.bookingRef || undefined,
        blNumber: form.blNumber || undefined,
        portOfLoading: form.portOfLoading || undefined,
        portOfDischarge: form.portOfDischarge || undefined,
        vesselName: form.vesselName || undefined,
        etd: form.etd || undefined,
        eta: form.eta || undefined,
        currentPosition: form.currentPosition || undefined,
        locationId: form.locationId || undefined,
        notes: form.notes || undefined,
      };
      let saved: ExportShipment;
      if (editing) {
        saved = await exportApi.updateShipment(editing.id, payload);
        toast.success(`Booking ${saved.shipmentNumber} updated`);
      } else {
        saved = await exportApi.createShipment({
          ...payload,
          orderId: form.orderId,
          items: lines.map((line) => ({
            productId: line.productId,
            quantity: Number(line.quantity),
            uom: line.uom,
          })),
        });
        toast.success(`Shipment ${saved.shipmentNumber} booked`);
      }
      setModalOpen(false);
      list.reload();
      setSelected(saved);
      setPosition(saved.currentPosition || '');
    } catch (err) {
      setFormError(errorMessage(err, editing ? 'Failed to update shipment' : 'Failed to create shipment'));
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (shipment: ExportShipment, status: string) => {
    setActionId(shipment.id);
    try {
      const updated = await exportApi.updateShipmentStatus(shipment.id, status, {
        currentPosition: position || undefined,
      });
      setSelected(updated);
      setPosition(updated.currentPosition || '');
      list.setItems((prev) => prev.map((row) => (row.id === shipment.id ? updated : row)));
      toast.success(`Shipment moved to ${status}`);
    } catch (err) {
      toast.error(errorMessage(err, `Failed to move shipment to ${status}`));
    } finally {
      setActionId(null);
    }
  };

  return (
    <TradePage>
      <TradePageHeader
        title="Export Shipments & Vessel Tracking"
        subtitle="Ocean bookings, container gate-in, bills of lading, vessel voyages and destination clearance"
        moduleName="Export Operations"
        backHref="/export/dashboard"
        icon={<Ship className="w-5 h-5 text-white" />}
        actions={
          canCreate ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Shipment
            </button>
          ) : undefined
        }
      />

      <TradeCard>
        <OrderFilterBanner orderId={orderIdFilter} entityLabel="shipments" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search shipment, B/L, vessel or port…"
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
              <option value="">All shipment statuses</option>
              {SHIPMENT_STATUSES.map((s) => (
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
            columns={['Shipment No', 'Order Ref', 'Customer', 'Shipping Line / Vessel', 'B/L Number', 'Route', 'ETD / ETA', 'Status', 'Actions']}
          />
          <TradeTableBody>
            {list.loading && list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={9}>
                  <RefreshCw className="w-4 h-4 animate-spin inline mr-2" /> Loading shipments…
                </TradeTableCell>
              </TradeTableRow>
            ) : list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={9}>
                  No shipments match the current filters.
                </TradeTableCell>
              </TradeTableRow>
            ) : (
              list.items.map((shp) => (
                <TradeTableRow key={shp.id}>
                  <TradeTableCell className="font-bold text-[#014582]">{shp.shipmentNumber}</TradeTableCell>
                  <TradeTableCell className="font-semibold text-gray-800">
                    <Link href={`/export/orders?order=${shp.orderId}`} className="hover:underline text-blue-700">
                      {shp.orderNumber || shp.orderId.slice(0, 8)}
                    </Link>
                  </TradeTableCell>
                  <TradeTableCell>
                    <span className="font-semibold text-gray-900 block">{shp.customerName}</span>
                    <span className="text-[10px] text-gray-400">{shp.customerCountry || '—'}</span>
                  </TradeTableCell>
                  <TradeTableCell className="text-xs text-gray-700">
                    <span className="block font-semibold">{shp.shippingLine || '—'}</span>
                    <span className="text-[10px] text-gray-400">{shp.vesselName || 'Vessel TBA'}</span>
                  </TradeTableCell>
                  <TradeTableCell className="font-mono text-xs text-gray-800">{shp.blNumber || '—'}</TradeTableCell>
                  <TradeTableCell className="text-[11px] text-gray-700">
                    <span className="block">{shp.portOfLoading || '—'}</span>
                    <span className="text-gray-400">→ {shp.portOfDischarge || '—'}</span>
                  </TradeTableCell>
                  <TradeTableCell className="text-[11px] text-gray-700">
                    <span className="block">ETD {formatDate(shp.etd)}</span>
                    <span className="text-gray-400">ETA {formatDate(shp.eta)}</span>
                  </TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={shp.shipmentStatus} />
                  </TradeTableCell>
                  <TradeTableCell>
                    <button
                      type="button"
                      onClick={() => openShipment(shp)}
                      className="p-1.5 rounded-lg text-[#014582] hover:bg-blue-50 transition-colors"
                      title="View shipment"
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
        title={selected?.shipmentNumber || 'Export Shipment'}
        subtitle={selected ? `${selected.customerName} · ${selected.shippingLine || 'Carrier TBA'}` : undefined}
        actions={
          selected ? (
            <div className="flex flex-wrap items-center gap-2">
              {canEdit && selected.shipmentStatus === 'Booking Confirmed' && (
                <button
                  type="button"
                  onClick={() => openEdit(selected)}
                  className="px-3.5 py-2 rounded-xl border border-[#014582]/30 text-[#014582] text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit Booking
                </button>
              )}
              {canEdit &&
                (NEXT_STATUS[selected.shipmentStatus] || [])
                  .filter((s) => s !== 'Cancelled')
                  .map((next) => (
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
              {canEdit && (NEXT_STATUS[selected.shipmentStatus] || []).includes('Cancelled') && (
                <button
                  type="button"
                  disabled={actionId === selected.id}
                  onClick={() => handleStatus(selected, 'Cancelled')}
                  className="px-3.5 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
            </div>
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Shipment Number</span>
                <span className="font-bold text-gray-900">{selected.shipmentNumber}</span>
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
                <span className="text-gray-400 block text-[10px] uppercase">Booking Reference</span>
                <span className="font-mono font-bold text-gray-900">{selected.bookingRef || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Bill of Lading</span>
                <span className="font-mono font-bold text-gray-900">{selected.blNumber || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Shipping Line</span>
                <span className="font-semibold text-gray-900">{selected.shippingLine || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Vessel</span>
                <span className="font-semibold text-gray-900">{selected.vesselName || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Port of Loading</span>
                <span className="font-semibold text-gray-900">{selected.portOfLoading || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Port of Discharge</span>
                <span className="font-semibold text-gray-900">{selected.portOfDischarge || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">ETD</span>
                <span className="font-semibold text-gray-900">{formatDate(selected.etd)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">ETA</span>
                <span className="font-semibold text-gray-900">{formatDate(selected.eta)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Status</span>
                <TradeStatusBadge status={selected.shipmentStatus} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 space-y-2">
              <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Current vessel / cargo position
              </p>
              <input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                disabled={!canEdit || ['Customs Cleared Buyer', 'Cancelled'].includes(selected.shipmentStatus)}
                placeholder="e.g. Departed Jebel Ali, ETA Jeddah 12 Nov"
                className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs disabled:bg-emerald-50"
              />
              <p className="text-[11px] text-emerald-800">
                The position is saved with the next shipment status update. ETA {formatDate(selected.eta)}.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Shipment Items (partial shipment support)</h4>
              <TradeTable>
                <TradeTableHeader
                  columns={['SKU', 'Item', 'Quantity', 'UOM', 'Unit Price', 'Line Total']}
                />
                <TradeTableBody>
                  {selected.items.map((item) => (
                    <TradeTableRow key={item.id}>
                      <TradeTableCell className="font-mono">{item.sku || '—'}</TradeTableCell>
                      <TradeTableCell className="font-medium text-gray-900">{item.productName}</TradeTableCell>
                      <TradeTableCell className="font-bold">{Number(item.quantity)}</TradeTableCell>
                      <TradeTableCell>{item.uom}</TradeTableCell>
                      <TradeTableCell>{Number(item.unitPriceForeign).toLocaleString()}</TradeTableCell>
                      <TradeTableCell className="font-bold text-gray-900">
                        {Number(item.lineTotalForeign).toLocaleString()}
                      </TradeTableCell>
                    </TradeTableRow>
                  ))}
                </TradeTableBody>
              </TradeTable>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/export/customs?orderId=${selected.orderId}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Customs declaration <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={`/export/dispatch?orderId=${selected.orderId}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Dispatch <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={`/export/packing?orderId=${selected.orderId}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Packing list <ArrowRight className="w-3.5 h-3.5" />
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
        title={editing ? `Edit Booking ${editing.shipmentNumber}` : 'Book Export Shipment'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" /> {formError}
            </div>
          )}

          <FormSection title="Booking & carrier">
            {!editing && (
              <div>
                <FieldLabel required>Export order</FieldLabel>
                <OrderSelect
                  value={form.orderId}
                  onChange={handleOrderChange}
                  required
                  disabled={saving}
                />
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <FieldLabel>Shipping line</FieldLabel>
                <input
                  value={form.shippingLine}
                  onChange={(e) => updateForm({ shippingLine: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                  placeholder="e.g. Maersk"
                />
              </div>
              <div>
                <FieldLabel>Booking reference</FieldLabel>
                <input
                  value={form.bookingRef}
                  onChange={(e) => updateForm({ bookingRef: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <FieldLabel>Bill of lading no</FieldLabel>
                <input
                  value={form.blNumber}
                  onChange={(e) => updateForm({ blNumber: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Port of loading</FieldLabel>
                <PortSelect
                  value={form.portOfLoading}
                  onChange={(name) => updateForm({ portOfLoading: name })}
                  placeholder="Select loading port…"
                />
              </div>
              <div>
                <FieldLabel>Port of discharge</FieldLabel>
                <PortSelect
                  value={form.portOfDischarge}
                  onChange={(name) => updateForm({ portOfDischarge: name })}
                  placeholder="Select discharge port…"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <FieldLabel>Vessel name</FieldLabel>
                <input
                  value={form.vesselName}
                  onChange={(e) => updateForm({ vesselName: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <FieldLabel>ETD</FieldLabel>
                <input
                  type="date"
                  value={form.etd}
                  onChange={(e) => updateForm({ etd: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <FieldLabel>ETA</FieldLabel>
                <input
                  type="date"
                  value={form.eta}
                  onChange={(e) => updateForm({ eta: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
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
            <div>
              <FieldLabel>Current position / remarks</FieldLabel>
              <input
                value={form.currentPosition}
                onChange={(e) => updateForm({ currentPosition: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
          </FormSection>

          {!editing && (
            <FormSection
              title="Shipment quantity"
              subtitle="Reduce quantities for a partial shipment; the backend validates the remaining order quantity"
            >
              {lines.length === 0 ? (
                <p className="text-center text-gray-400 py-4 text-xs">
                  Select an export order to load its remaining items.
                </p>
              ) : (
                <div className="space-y-2">
                  {lines.map((line, index) => (
                    <div
                      key={`${line.productId}-${index}`}
                      className="grid grid-cols-12 gap-2 items-end p-2.5 rounded-xl border border-gray-200 bg-gray-50/60"
                    >
                      <div className="col-span-6 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{line.productName}</p>
                        <p className="text-[10px] text-gray-400">
                          {line.sku || 'No SKU'} · {line.uom}
                        </p>
                      </div>
                      <div className="col-span-3">
                        <FieldLabel required>Quantity</FieldLabel>
                        <input
                          type="number"
                          min="0.0001"
                          step="any"
                          value={line.quantity}
                          onChange={(e) => updateLine(index, Number(e.target.value))}
                          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
                        />
                      </div>
                      <div className="col-span-3 text-[11px] text-gray-500">
                        Order qty: {Number(order?.items.find((i) => i.productId === line.productId)?.quantity || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </FormSection>
          )}

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
              disabled={saving || (!editing && !form.orderId)}
              className="px-4 py-2 rounded-lg bg-[#014582] text-white hover:bg-[#01366a] text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'Saving…' : editing ? 'Save Booking' : 'Book Shipment'}
            </button>
          </div>
        </form>
      </TradeModal>
    </TradePage>
  );
}
