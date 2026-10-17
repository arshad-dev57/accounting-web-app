'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Ship,
  Search,
  Filter,
  Eye,
  MapPin,
  CheckCircle2,
  Plus,
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
} from '../../../components/trade/TradeUI';
import importApi, {
  ImportEligibleShipmentPo,
  ImportShipment,
  ImportCarrier,
} from '../../../lib/import-api';
import {
  CarrierSelectField,
  FormSection,
  FieldLabel,
} from '@/components/import/ImportSelectors';

function formatTradeDate(val?: string | null) {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(val);
  }
}

function carrierLabel(shp: ImportShipment) {
  return shp.carrierDisplay || shp.carrierMaster?.name || shp.carrier || shp.carrierManualDesc || null;
}

function blLabel(shp: ImportShipment) {
  return shp.blNumber || shp.blAwbNumber || null;
}

function containerLabel(shp: ImportShipment) {
  return shp.containerNo || shp.containerNumber || null;
}

function metricDisplay(val?: number | string | null) {
  if (val === undefined || val === null || val === '') return '—';
  const n = Number(val);
  if (!Number.isFinite(n) || n === 0) return '—';
  return String(n);
}

function containerDisplay(shp: ImportShipment) {
  const no = containerLabel(shp);
  const load = shp.loadType || '';
  if (no) return no;
  if (load === 'LCL' || load === 'Air cargo' || load === 'Air' || load === 'Bulk') {
    return 'Not applicable';
  }
  return '—';
}

function displayAuditWho(row: NonNullable<ImportShipment['auditTrail']>[number]) {
  if (row.userLabel) return row.userLabel;
  const name = `${row.user?.firstName || ''} ${row.user?.lastName || ''}`.trim();
  if (!name || /^customer\s*\d+$/i.test(name) || /^user\s*\d+$/i.test(name)) {
    return row.user?.email || name || '—';
  }
  return name;
}

const EMPTY_FORM = {
  importPoId: '',
  proformaId: '',
  financeLcId: '',
  carrierManual: '',
  blNumber: '',
  blType: '',
  originPort: '',
  portOfEntry: '',
  containerNo: '',
  containerType: '',
  loadType: '',
  sealNumber: '',
  shipmentMode: 'Ocean',
  bookingRef: '',
  trackingRef: '',
  etd: '',
  eta: '',
  actualDeparture: '',
  actualArrival: '',
  vesselName: '',
  voyageNumber: '',
  consignee: '',
  notifyParty: '',
  packageCount: '',
  grossWeightKg: '',
  cbm: '',
};

type FieldErrors = Partial<Record<keyof typeof EMPTY_FORM | 'form' | 'carrier' | 'items', string>>;

export default function ImportShipmentsPage() {
  const [shipments, setShipments] = useState<ImportShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedShipment, setSelectedShipment] = useState<ImportShipment | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [eligiblePos, setEligiblePos] = useState<ImportEligibleShipmentPo[]>([]);
  const [supplierFilter, setSupplierFilter] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState<ImportCarrier | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [cargoQty, setCargoQty] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [lcWarning, setLcWarning] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState<{
    status: string;
    actualDeparture?: string;
    actualArrival?: string;
    deliveredAt?: string;
    blNumber?: string;
    containerNo?: string;
    loadType?: string;
    originPort?: string;
    packageCount?: string;
    grossWeightKg?: string;
    eta?: string;
    etaReason?: string;
    note?: string;
  } | null>(null);
  const [statusErrors, setStatusErrors] = useState<Record<string, string>>({});
  const [statusFormError, setStatusFormError] = useState<string | null>(null);

  const fetchShipments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (statusFilter !== 'All') params.status = statusFilter;
      const data = await importApi.listShipments(params);
      const rows = Array.isArray(data) ? data : [];
      setShipments(rows.filter((s): s is ImportShipment => Boolean(s?.id)));
    } catch (err: any) {
      console.error('Failed to load shipments:', err);
      setError(err?.response?.data?.message || err?.response?.data?.error || err.message || 'Failed to load shipments');
      setShipments([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  useEffect(() => {
    importApi
      .listEligibleShipmentPos({ limit: 100 })
      .then((rows) =>
        setEligiblePos(Array.isArray(rows) ? rows.filter((p) => Boolean(p?.id)) : [])
      )
      .catch(() => setEligiblePos([]));
  }, []);

  const supplierOptions = useMemo(() => {
    const map = new Map<string, string>();
    eligiblePos.forEach((p) => {
      if (p?.supplierId) map.set(p.supplierId, p.supplierName || p.supplierId);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [eligiblePos]);

  const filteredEligiblePos = useMemo(
    () =>
      (supplierFilter ? eligiblePos.filter((p) => p?.supplierId === supplierFilter) : eligiblePos).filter(
        (p) => Boolean(p?.id)
      ),
    [eligiblePos, supplierFilter]
  );

  const selectedPo = useMemo(
    () => filteredEligiblePos.find((p) => p.id === form.importPoId) || null,
    [filteredEligiblePos, form.importPoId]
  );

  const applyPo = (po: ImportEligibleShipmentPo | null) => {
    if (!po) return;
    const qtyMap: Record<string, string> = {};
    (po.items || []).forEach((it) => {
      if (!it?.id) return;
      qtyMap[it.id] = String(it.remainingQty);
    });
    setCargoQty(qtyMap);
    const primaryPi = po.proformas?.[0];
    const primaryLc = po.financeLcs?.[0];
    setForm((f) => ({
      ...f,
      importPoId: po.id,
      originPort: po.portOfLoading || f.originPort,
      portOfEntry: po.portOfEntry || f.portOfEntry,
      proformaId: primaryPi?.id || '',
      financeLcId: primaryLc?.id || '',
    }));
    setLcWarning(null);
  };

  const validateForm = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!selectedCarrier && !form.carrierManual.trim()) {
      errors.carrier = 'Carrier is required';
    }
    if (form.etd && form.eta) {
      if (new Date(form.eta) <= new Date(form.etd)) {
        errors.eta = 'ETA must be after ETD';
      }
    }
    if (form.etd && selectedPo?.orderDate) {
      if (new Date(form.etd) < new Date(String(selectedPo.orderDate).slice(0, 10))) {
        errors.etd = 'ETD must not be before the PO order date';
      }
    }
    if (form.loadType === 'FCL' && form.containerNo.trim()) {
      if (!/^[A-Za-z]{4}\d{7}$/.test(form.containerNo.trim())) {
        errors.containerNo = 'ISO 6346 required: 4 letters + 7 digits';
      }
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (form.actualDeparture && new Date(form.actualDeparture) > today) {
      errors.actualDeparture = 'Actual ship date (ATD) must not be in the future';
    }
    if (form.actualArrival && new Date(form.actualArrival) > today) {
      errors.actualArrival = 'Actual arrival date (ATA) must not be in the future';
    }
    const hasQty = Object.values(cargoQty).some((v) => Number(v) > 0);
    if (selectedPo && !hasQty) errors.items = 'Enter ship quantity for at least one PO line';
    return errors;
  };

  const handleCreateShipment = async () => {
    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    setError(null);
    try {
      const items = (selectedPo?.items || [])
        .map((it) => {
          const qty = Number(cargoQty[it.id] || 0);
          if (qty <= 0) return null;
          return {
            importPoItemId: it.id,
            productId: it.productId,
            productName: it.productName,
            sku: it.sku,
            quantity: qty,
            uom: it.uom,
          };
        })
        .filter(Boolean);

      const created = await importApi.createShipment({
        importPoId: form.importPoId || undefined,
        proformaId: form.proformaId || undefined,
        financeLcId: form.financeLcId || undefined,
        carrierId: selectedCarrier?.id,
        carrier: selectedCarrier?.name,
        carrierManualDesc: !selectedCarrier ? form.carrierManual || undefined : undefined,
        shipmentMode: form.shipmentMode || undefined,
        loadType: form.loadType || undefined,
        bookingRef: form.bookingRef || undefined,
        trackingRef: form.trackingRef || undefined,
        blNumber: form.blNumber || undefined,
        blType: form.blType || undefined,
        originPort: form.originPort || undefined,
        portOfEntry: form.portOfEntry || undefined,
        containerNo: form.containerNo || undefined,
        containerType: form.containerType || undefined,
        sealNumber: form.sealNumber || undefined,
        etd: form.etd || undefined,
        eta: form.eta || undefined,
        actualDeparture: form.actualDeparture || undefined,
        actualArrival: form.actualArrival || undefined,
        vesselName: form.vesselName || undefined,
        voyageNumber: form.voyageNumber || undefined,
        consignee: form.consignee || undefined,
        notifyParty: form.notifyParty || undefined,
        packageCount: form.packageCount ? Number(form.packageCount) : undefined,
        grossWeightKg: form.grossWeightKg ? Number(form.grossWeightKg) : undefined,
        cbm: form.cbm ? Number(form.cbm) : undefined,
        items: items as any,
      } as any);

      if (created?.lcWarning) setLcWarning(created.lcWarning);
      setIsCreateOpen(false);
      setForm({ ...EMPTY_FORM });
      setSelectedCarrier(null);
      setCargoQty({});
      setFieldErrors({});
      if (created?.id) {
        setShipments((prev) => [created, ...prev.filter((s) => s?.id && s.id !== created.id)]);
      }
      await fetchShipments();
      importApi
        .listEligibleShipmentPos({ limit: 100 })
        .then((rows) => setEligiblePos(Array.isArray(rows) ? rows.filter((p) => Boolean(p?.id)) : []))
        .catch(() => {});
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to create shipment';
      setError(msg);
      setFieldErrors({ form: msg });
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (shp: ImportShipment) => {
    if (!shp?.id) return;
    setSelectedShipment(shp);
    setDetailLoading(true);
    try {
      const full = await importApi.getShipment(shp.id);
      if (full?.id) setSelectedShipment(full);
    } catch {
      /* keep list row */
    } finally {
      setDetailLoading(false);
    }
  };

  const openStatusModal = (partial: NonNullable<typeof statusModal>) => {
    setStatusErrors({});
    setStatusFormError(null);
    setStatusModal(partial);
  };

  const submitStatus = async () => {
    if (!selectedShipment || !statusModal) return;
    const fieldErrs: Record<string, string> = {};
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const loadType = statusModal.loadType || selectedShipment.loadType || '';

    if (statusModal.status === 'Departed') {
      if (!statusModal.actualDeparture) fieldErrs.actualDeparture = 'Actual ship date (ATD) is required';
      else if (new Date(statusModal.actualDeparture) > today) {
        fieldErrs.actualDeparture = 'ATD must not be in the future';
      }
      if (!statusModal.blNumber?.trim()) fieldErrs.blNumber = 'B/L number is required to mark as Departed';
      if (loadType === 'FCL') {
        if (!statusModal.containerNo?.trim()) {
          fieldErrs.containerNo = 'Container number is required for FCL before Departed';
        } else if (!/^[A-Za-z]{4}\d{7}$/.test(statusModal.containerNo.trim())) {
          fieldErrs.containerNo = 'ISO 6346 required: 4 letters + 7 digits';
        }
      }
      if (!statusModal.originPort?.trim() && !selectedShipment.originPort) {
        fieldErrs.originPort = 'Port of loading is required before Departed';
      }
      if (!statusModal.packageCount || Number(statusModal.packageCount) <= 0) {
        fieldErrs.packageCount = 'Number of packages is required before Departed';
      }
      if (!statusModal.grossWeightKg || Number(statusModal.grossWeightKg) <= 0) {
        fieldErrs.grossWeightKg = 'Gross weight (kg) is required before Departed';
      }
    }
    if (statusModal.status === 'Arrived') {
      if (!statusModal.actualArrival) fieldErrs.actualArrival = 'Actual arrival date (ATA) is required';
      else if (new Date(statusModal.actualArrival) > today) {
        fieldErrs.actualArrival = 'ATA must not be in the future';
      }
      const atd = selectedShipment.actualDeparture || statusModal.actualDeparture;
      if (atd && statusModal.actualArrival && new Date(statusModal.actualArrival) < new Date(String(atd).slice(0, 10))) {
        fieldErrs.actualArrival = 'ATA must be on or after the ATD';
      }
    }
    if (statusModal.status === 'Delivered/Received' && statusModal.deliveredAt) {
      if (new Date(statusModal.deliveredAt) > today) {
        fieldErrs.deliveredAt = 'Delivered date must not be in the future';
      }
      const ata = selectedShipment.actualArrival || statusModal.actualArrival;
      if (ata && new Date(statusModal.deliveredAt) < new Date(String(ata).slice(0, 10))) {
        fieldErrs.deliveredAt = 'Delivered date must be on or after the ATA';
      }
    }

    setStatusErrors(fieldErrs);
    if (Object.keys(fieldErrs).length) {
      setStatusFormError(Object.values(fieldErrs)[0]);
      return;
    }

    setActionLoading(true);
    setError(null);
    setStatusFormError(null);
    try {
      const updated = await importApi.updateShipmentStatus(selectedShipment.id, statusModal.status, {
        actualDeparture: statusModal.actualDeparture || undefined,
        actualArrival: statusModal.actualArrival || undefined,
        deliveredAt: statusModal.deliveredAt || undefined,
        blNumber: statusModal.blNumber || undefined,
        containerNo: statusModal.containerNo || undefined,
        loadType: statusModal.loadType || undefined,
        originPort: statusModal.originPort || undefined,
        packageCount: statusModal.packageCount ? Number(statusModal.packageCount) : undefined,
        grossWeightKg: statusModal.grossWeightKg ? Number(statusModal.grossWeightKg) : undefined,
        eta: statusModal.eta || undefined,
        etaReason: statusModal.etaReason || undefined,
        note: statusModal.note || undefined,
      });
      if (!updated?.id) {
        throw new Error('Status update returned an empty shipment');
      }
      setSelectedShipment(updated);
      setShipments((prev) => prev.map((s) => (s?.id === updated.id ? updated : s)).filter((s) => Boolean(s?.id)));
      setStatusModal(null);
      setStatusErrors({});
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to update shipment status';
      const field = err?.response?.data?.field;
      setStatusFormError(msg);
      if (field) setStatusErrors((e) => ({ ...e, [field]: msg }));
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // LC warning when ETD changes
  useEffect(() => {
    if (!selectedPo || !form.etd) {
      setLcWarning(null);
      return;
    }
    const lc = selectedPo.financeLcs?.find((l) => l.id === form.financeLcId) || selectedPo.financeLcs?.[0];
    if (!lc) {
      setLcWarning(null);
      return;
    }
    const etd = new Date(form.etd);
    if (lc.latestShipmentDate && etd > new Date(lc.latestShipmentDate)) {
      setLcWarning(`ETD is after LC ${lc.lcNumber} latest shipment date (${formatTradeDate(lc.latestShipmentDate)})`);
    } else if (lc.expiryDate && etd > new Date(lc.expiryDate)) {
      setLcWarning(`ETD is after LC ${lc.lcNumber} expiry date (${formatTradeDate(lc.expiryDate)})`);
    } else {
      setLcWarning(null);
    }
  }, [form.etd, form.financeLcId, selectedPo]);

  const status = selectedShipment?.shipmentStatus || '';

  return (
    <TradePage>
      <TradePageHeader
        title="Import Shipments & Tracking"
        subtitle="Carrier vessel tracking, container milestones, ports of discharge and arrival schedules"
        moduleName="Import Operations"
        backHref="/import/dashboard"
        icon={<Ship className="w-5 h-5 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchShipments}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                setFieldErrors({});
                setForm({ ...EMPTY_FORM });
                setSelectedCarrier(null);
                setIsCreateOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Shipment
            </button>
          </div>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="font-bold underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      <TradeCard>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search shipment, BL, carrier, container..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#014582]"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {['All', 'Booking Confirmed', 'Departed', 'In Transit', 'Arrived', 'Cleared', 'Delivered/Received'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                  statusFilter === st ? 'bg-[#014582] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#014582]" />
            <p className="text-xs">Loading shipments...</p>
          </div>
        ) : shipments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-xs">No import shipments found.</p>
          </div>
        ) : (
          <TradeTable>
            <TradeTableHeader
              columns={[
                'Shipment No',
                'Linked PO',
                'Carrier',
                'B/L / AWB',
                'Route',
                'ETA',
                'Container',
                'Status',
                'Actions',
              ]}
            />
            <TradeTableBody>
              {shipments.filter((shp) => shp?.id).map((shp) => (
                <TradeTableRow key={shp.id}>
                  <TradeTableCell className="font-bold text-[#014582]">{shp.shipmentNumber}</TradeTableCell>
                  <TradeTableCell className="text-gray-700 font-medium">
                    {shp.poRef ? (
                      <Link href={`/import/purchase-orders?po=${shp.importPoId || shp.poRef}`} className="hover:underline text-blue-700">
                        {shp.poRef}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </TradeTableCell>
                  <TradeTableCell>
                    <span className="font-semibold text-gray-900 block">{carrierLabel(shp) || '—'}</span>
                    <span className="text-[10px] text-gray-400">
                      {shp.carrierMaster?.code ? `${shp.carrierMaster.code} · ` : ''}
                      {shp.shipmentMode || shp.carrierMaster?.carrierType || '—'}
                    </span>
                  </TradeTableCell>
                  <TradeTableCell className="font-mono text-xs font-semibold">
                    {blLabel(shp) || <span className="text-gray-400 font-sans">Not yet issued</span>}
                  </TradeTableCell>
                  <TradeTableCell className="text-xs text-gray-700">
                    {shp.routeLabel ||
                      `${shp.originPortLabel || shp.originPort || '—'} → ${shp.destinationPortLabel || shp.portOfEntry || '—'}`}
                  </TradeTableCell>
                  <TradeTableCell className="font-bold text-gray-900">{formatTradeDate(shp.eta)}</TradeTableCell>
                  <TradeTableCell>
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-[10px] font-mono text-gray-700">
                      {containerDisplay(shp)}
                    </span>
                    {shp.loadType ? (
                      <span className="block text-[10px] text-gray-400 mt-0.5">{shp.loadType}</span>
                    ) : null}
                  </TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={shp.shipmentStatus} />
                  </TradeTableCell>
                  <TradeTableCell>
                    <button
                      type="button"
                      onClick={() => openDetail(shp)}
                      className="p-1.5 rounded-lg text-[#014582] hover:bg-blue-50"
                      title="Track Shipment"
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
        isOpen={Boolean(selectedShipment)}
        onClose={() => setSelectedShipment(null)}
        title={selectedShipment?.shipmentNumber || 'Shipment Tracking'}
        subtitle={`Carrier: ${selectedShipment ? carrierLabel(selectedShipment) || '—' : ''} • B/L: ${
          selectedShipment ? blLabel(selectedShipment) || 'Not yet issued' : ''
        }`}
        actions={
          selectedShipment && (
            <div className="flex flex-wrap items-center gap-2">
              {status === 'Booking Confirmed' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() =>
                    openStatusModal({
                      status: 'Departed',
                      actualDeparture: new Date().toISOString().slice(0, 10),
                      blNumber: blLabel(selectedShipment) || '',
                      containerNo: containerLabel(selectedShipment) || '',
                      loadType: selectedShipment.loadType || '',
                      originPort: selectedShipment.originPort || '',
                      packageCount:
                        selectedShipment.packageCount != null && Number(selectedShipment.packageCount) > 0
                          ? String(selectedShipment.packageCount)
                          : '',
                      grossWeightKg:
                        selectedShipment.grossWeightKg != null && Number(selectedShipment.grossWeightKg) > 0
                          ? String(selectedShipment.grossWeightKg)
                          : '',
                    })
                  }
                  className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-50"
                >
                  Mark Departed
                </button>
              )}
              {status === 'Departed' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => openStatusModal({ status: 'In Transit' })}
                  className="px-3.5 py-2 rounded-xl border text-xs font-bold"
                >
                  Mark In Transit
                </button>
              )}
              {status === 'In Transit' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() =>
                    openStatusModal({
                      status: 'Arrived',
                      actualArrival: new Date().toISOString().slice(0, 10),
                    })
                  }
                  className="px-3.5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 inline mr-1" /> Mark Arrived
                </button>
              )}
              {status === 'Arrived' && (
                <>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => openStatusModal({ status: 'Customs Clearance' })}
                    className="px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold"
                  >
                    Mark Customs Clearance
                  </button>
                  <Link
                    href="/import/customs"
                    className="px-3.5 py-2 rounded-xl border text-xs font-bold text-[#014582]"
                  >
                    Open Customs
                  </Link>
                </>
              )}
              {(status === 'Customs Clearance' || status === 'Cleared') && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() =>
                    openStatusModal({
                      status: 'Delivered/Received',
                      deliveredAt: new Date().toISOString().slice(0, 10),
                    })
                  }
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  Mark Delivered
                </button>
              )}
              {!['Cancelled', 'Delivered/Received'].includes(status) && (
                <>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => openStatusModal({ status: 'Delayed', note: '' })}
                    className="px-3.5 py-2 rounded-xl border text-amber-700 text-xs font-bold"
                  >
                    Mark Delayed
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => openStatusModal({ status: 'Cancelled', note: '' })}
                    className="px-3.5 py-2 rounded-xl border border-red-200 text-red-700 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          )
        }
      >
        {selectedShipment && (
          <div className="space-y-6 text-xs">
            {detailLoading && (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading detail…
              </div>
            )}
            <div className="p-4 rounded-xl bg-blue-50/90 border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-bold text-blue-900 text-xs">Route</span>
              </div>
              <p className="text-xs text-blue-800">
                Status: {selectedShipment.shipmentStatus} •{' '}
                {selectedShipment.routeLabel ||
                  `${selectedShipment.originPortLabel || selectedShipment.originPort || '—'} → ${
                    selectedShipment.destinationPortLabel || selectedShipment.portOfEntry || '—'
                  }`}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Carrier</span>
                <span className="font-bold text-gray-900">{carrierLabel(selectedShipment) || '—'}</span>
                {selectedShipment.carrierMaster?.code && (
                  <span className="block text-[10px] text-gray-500">{selectedShipment.carrierMaster.code}</span>
                )}
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">B/L / AWB</span>
                <span className="font-mono font-bold text-[#014582]">
                  {blLabel(selectedShipment) || 'Not yet issued'}
                </span>
                {selectedShipment.blType && (
                  <span className="block text-[10px] text-gray-500">{selectedShipment.blType}</span>
                )}
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Container</span>
                <span className="font-mono font-bold text-gray-900">{containerDisplay(selectedShipment)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Load type</span>
                <span className="font-bold text-gray-900">{selectedShipment.loadType || '—'}</span>
                {selectedShipment.containerType ? (
                  <span className="block text-[10px] text-gray-500">{selectedShipment.containerType}</span>
                ) : null}
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">ETD / ATD</span>
                <span className="font-semibold text-gray-900">
                  {formatTradeDate(selectedShipment.etd)} / {formatTradeDate(selectedShipment.actualDeparture)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">ETA / ATA</span>
                <span className="font-bold text-[#014582]">
                  {formatTradeDate(selectedShipment.eta)} / {formatTradeDate(selectedShipment.actualArrival)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Vessel / Voyage</span>
                <span className="font-semibold text-gray-900">
                  {selectedShipment.vesselName || selectedShipment.vesselFlight || '—'}
                  {selectedShipment.voyageNumber ? ` · ${selectedShipment.voyageNumber}` : ''}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <span className="text-gray-400 block text-[10px] uppercase mb-1">Linked PI</span>
                {(selectedShipment.linkedProformas || []).length > 0 || selectedShipment.proforma ? (
                  <div className="flex flex-wrap gap-2">
                    {(selectedShipment.linkedProformas?.length
                      ? selectedShipment.linkedProformas
                      : selectedShipment.proforma
                        ? [selectedShipment.proforma]
                        : []
                    ).map((pi) => (
                      <Link
                        key={pi.id}
                        href={`/import/proforma-invoices?pi=${pi.id}`}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-blue-100 bg-blue-50 text-blue-800 font-semibold hover:underline"
                      >
                        {pi.piNumber}
                        {pi.status ? <span className="text-[10px] font-normal text-blue-600">· {pi.status}</span> : null}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <span className="font-medium text-gray-800">—</span>
                )}
              </div>
              <div className="col-span-2 sm:col-span-3">
                <span className="text-gray-400 block text-[10px] uppercase mb-1">Linked LC</span>
                {(selectedShipment.linkedLcs || []).length > 0 || selectedShipment.financeLc ? (
                  <div className="space-y-1.5">
                    {(selectedShipment.linkedLcs?.length
                      ? selectedShipment.linkedLcs
                      : selectedShipment.financeLc
                        ? [selectedShipment.financeLc]
                        : []
                    ).map((lc) => (
                      <div key={lc.id} className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/import/finance?lc=${lc.id}`}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-amber-100 bg-amber-50 text-amber-900 font-semibold hover:underline"
                        >
                          {lc.lcNumber}
                          {lc.status ? (
                            <span className="text-[10px] font-normal text-amber-700">· {lc.status}</span>
                          ) : null}
                        </Link>
                        <span className="text-[10px] text-gray-500">
                          Latest ship {formatTradeDate(lc.latestShipmentDate)} · Exp{' '}
                          {formatTradeDate(lc.expiryDate)}
                        </span>
                      </div>
                    ))}
                    {selectedShipment.lcWarning && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                        {selectedShipment.lcWarning}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="font-medium text-gray-800">—</span>
                )}
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Packages / Weight / CBM</span>
                <span className="font-medium text-gray-800">
                  {metricDisplay(selectedShipment.packageCount)} · {metricDisplay(selectedShipment.grossWeightKg)} kg ·{' '}
                  {metricDisplay(selectedShipment.cbm)} CBM
                </span>
              </div>
            </div>

            {(selectedShipment.items || []).length > 0 && (
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Shipment lines</h4>
                <table className="w-full text-xs border border-gray-100 rounded-xl overflow-hidden">
                  <thead className="bg-gray-50 text-[10px] uppercase text-gray-400">
                    <tr>
                      <th className="text-left px-3 py-2">Product</th>
                      <th className="text-right px-3 py-2">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedShipment.items!.filter(Boolean).map((it, idx) => (
                      <tr key={it.id || idx} className="border-t border-gray-50">
                        <td className="px-3 py-2 font-semibold">{it.productName}</td>
                        <td className="px-3 py-2 text-right">
                          {it.quantity} {it.uom}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div>
              <h4 className="font-bold text-gray-900 mb-3">Milestone history</h4>
              <div className="space-y-3 relative pl-6 border-l-2 border-blue-200 ml-2">
                {(selectedShipment.milestones || []).filter(Boolean).map((m, i) => (
                  <div key={m.key || i} className="relative">
                    <div
                      className={`w-3.5 h-3.5 rounded-full absolute -left-[31px] top-0.5 border-2 ${
                        m.completed
                          ? 'bg-emerald-600 border-white ring-2 ring-emerald-500'
                          : 'bg-white border-gray-300'
                      }`}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className={`font-semibold ${m.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                          {m.title}
                        </span>
                        {m.location && (
                          <span className="block text-[10px] text-gray-500">{m.location}</span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">
                        {m.completed
                          ? formatTradeDate(typeof m.actualAt === 'string' ? m.actualAt : m.date)
                          : m.plannedAt
                            ? `Planned ${formatTradeDate(typeof m.plannedAt === 'string' ? m.plannedAt : String(m.plannedAt))}`
                            : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {(selectedShipment.etaHistory || []).length > 0 && (
              <div>
                <h4 className="font-bold text-gray-900 mb-2">ETA change history</h4>
                <div className="space-y-2">
                  {selectedShipment.etaHistory!.map((h, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-gray-100 bg-gray-50">
                      {h.from} → {h.to}
                      {h.reason ? ` · ${h.reason}` : ''}
                      <div className="text-[10px] text-gray-500">{formatTradeDate(h.at)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(selectedShipment.auditTrail || []).length > 0 && (
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Status audit trail</h4>
                <div className="space-y-2">
                  {selectedShipment.auditTrail!.filter((row) => row?.id).map((row) => {
                    const label =
                      row.label ||
                      (row.action === 'CREATE'
                        ? `Created → ${row.details?.to || row.details?.nextStatus || 'Booking Confirmed'}`
                        : `${row.details?.from || row.details?.previousStatus || '—'} → ${
                            row.details?.to || row.details?.nextStatus || row.action
                          }`);
                    const reason = row.reason || row.details?.reason;
                    return (
                      <div key={row.id} className="flex justify-between gap-2 p-2.5 rounded-lg border border-gray-100 bg-gray-50">
                        <div>
                          <div className="font-semibold text-gray-900">{label}</div>
                          {reason ? <div className="text-[10px] text-gray-600 mt-0.5">Note: {reason}</div> : null}
                          <div className="text-[10px] text-gray-500">{displayAuditWho(row)}</div>
                        </div>
                        <div className="text-[10px] text-gray-500">{formatTradeDate(row.createdAt)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </TradeDetailDrawer>

      <TradeModal
        isOpen={isCreateOpen}
        onClose={() => !saving && setIsCreateOpen(false)}
        title="Create Import Shipment"
        maxWidth="max-w-3xl"
        actions={
          <div className="flex justify-end gap-2">
            <button type="button" disabled={saving} onClick={() => setIsCreateOpen(false)} className="px-3 py-2 rounded-xl border text-xs font-semibold">
              Cancel
            </button>
            <button type="button" disabled={saving} onClick={handleCreateShipment} className="px-4 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-60">
              {saving ? 'Creating…' : 'Create Shipment'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
          {fieldErrors.form && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700">{fieldErrors.form}</div>
          )}
          {lcWarning && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">{lcWarning}</div>
          )}
          <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2.5">
            Shipment tracking does not create stock. Receive goods via Import GRN after arrival/clearance.
          </p>

          <FormSection title="Linked documents">
            <div className="space-y-3">
              <div>
                <FieldLabel>Supplier</FieldLabel>
                <select
                  value={supplierFilter}
                  onChange={(e) => {
                    const next = e.target.value;
                    setSupplierFilter(next);
                    if (form.importPoId) {
                      const stillOk = eligiblePos.some(
                        (p) => p.id === form.importPoId && (!next || p.supplierId === next)
                      );
                      if (!stillOk) {
                        setForm((f) => ({ ...f, importPoId: '', proformaId: '', financeLcId: '' }));
                        setCargoQty({});
                      }
                    }
                  }}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                >
                  <option value="">All suppliers with open qty…</option>
                  {supplierOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Import PO</FieldLabel>
                <select
                  value={form.importPoId}
                  onChange={(e) => {
                    const po = filteredEligiblePos.find((p) => p.id === e.target.value) || null;
                    if (!po) {
                      setForm((f) => ({ ...f, importPoId: '', proformaId: '', financeLcId: '' }));
                      setCargoQty({});
                      return;
                    }
                    if (po.supplierId) setSupplierFilter(po.supplierId);
                    applyPo(po);
                  }}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                >
                  <option value="">Select PO with remaining unshipped qty…</option>
                  {filteredEligiblePos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.poNumber} · {p.supplierName} · remaining {p.remainingTotal}
                    </option>
                  ))}
                </select>
              </div>
              {selectedPo && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FieldLabel>Linked PI</FieldLabel>
                    <select
                      value={form.proformaId}
                      onChange={(e) => setForm((f) => ({ ...f, proformaId: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2"
                    >
                      <option value="">Optional…</option>
                      {(selectedPo.proformas || []).map((pi) => (
                        <option key={pi.id} value={pi.id}>
                          {pi.piNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Linked LC</FieldLabel>
                    <select
                      value={form.financeLcId}
                      onChange={(e) => setForm((f) => ({ ...f, financeLcId: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2"
                    >
                      <option value="">Optional…</option>
                      {(selectedPo.financeLcs || []).map((lc) => (
                        <option key={lc.id} value={lc.id}>
                          {lc.lcNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </FormSection>

          <FormSection title="Carrier & identity">
            <div className="space-y-3">
              <div>
                <FieldLabel required>Carrier / freight forwarder</FieldLabel>
                <CarrierSelectField
                  selected={
                    selectedCarrier
                      ? {
                          id: selectedCarrier.id,
                          name: selectedCarrier.name,
                          code: selectedCarrier.code,
                          carrierType: selectedCarrier.carrierType,
                        }
                      : null
                  }
                  onSelect={(c) => setSelectedCarrier(c as ImportCarrier)}
                />
                {fieldErrors.carrier && <p className="text-[10px] text-red-600 mt-1">{fieldErrors.carrier}</p>}
                {!selectedCarrier && (
                  <div className="mt-2">
                    <FieldLabel>Manual carrier description (exception only)</FieldLabel>
                    <input
                      value={form.carrierManual}
                      onChange={(e) => setForm((f) => ({ ...f, carrierManual: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel>Shipment mode</FieldLabel>
                  <select
                    value={form.shipmentMode}
                    onChange={(e) => setForm((f) => ({ ...f, shipmentMode: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2"
                  >
                    {['Ocean', 'Air', 'Road', 'Rail', 'Multimodal'].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Load type</FieldLabel>
                  <select
                    value={form.loadType}
                    onChange={(e) => setForm((f) => ({ ...f, loadType: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2"
                  >
                    <option value="">Select…</option>
                    {['FCL', 'LCL', 'Bulk', 'Air cargo'].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>B/L type</FieldLabel>
                  <select
                    value={form.blType}
                    onChange={(e) => setForm((f) => ({ ...f, blType: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2"
                  >
                    <option value="">Select…</option>
                    {['Original', 'Telex Release', 'Sea Waybill', 'Surrender'].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>B/L / AWB number</FieldLabel>
                  <input
                    value={form.blNumber}
                    onChange={(e) => setForm((f) => ({ ...f, blNumber: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2"
                    placeholder="Optional until Departed"
                  />
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="Route, dates & cargo">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <FieldLabel>Port of loading</FieldLabel>
                <input
                  value={form.originPort}
                  onChange={(e) => setForm((f) => ({ ...f, originPort: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                />
              </div>
              <div>
                <FieldLabel>Port of discharge</FieldLabel>
                <input
                  value={form.portOfEntry}
                  onChange={(e) => setForm((f) => ({ ...f, portOfEntry: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                />
              </div>
              <div>
                <FieldLabel>ETD</FieldLabel>
                <input
                  type="date"
                  value={form.etd}
                  onChange={(e) => setForm((f) => ({ ...f, etd: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                />
                {fieldErrors.etd && <p className="text-[10px] text-red-600 mt-1">{fieldErrors.etd}</p>}
              </div>
              <div>
                <FieldLabel>ETA</FieldLabel>
                <input
                  type="date"
                  value={form.eta}
                  onChange={(e) => setForm((f) => ({ ...f, eta: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                />
                {fieldErrors.eta && <p className="text-[10px] text-red-600 mt-1">{fieldErrors.eta}</p>}
              </div>
              <div>
                <FieldLabel>Actual ship date (ATD)</FieldLabel>
                <input
                  type="date"
                  value={form.actualDeparture}
                  onChange={(e) => setForm((f) => ({ ...f, actualDeparture: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                />
                {fieldErrors.actualDeparture && (
                  <p className="text-[10px] text-red-600 mt-1">{fieldErrors.actualDeparture}</p>
                )}
              </div>
              <div>
                <FieldLabel>Actual arrival date (ATA)</FieldLabel>
                <input
                  type="date"
                  value={form.actualArrival}
                  onChange={(e) => setForm((f) => ({ ...f, actualArrival: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                />
                {fieldErrors.actualArrival && (
                  <p className="text-[10px] text-red-600 mt-1">{fieldErrors.actualArrival}</p>
                )}
              </div>
              <div>
                <FieldLabel>Container number</FieldLabel>
                <input
                  value={form.containerNo}
                  onChange={(e) => setForm((f) => ({ ...f, containerNo: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                  placeholder={form.loadType === 'FCL' ? 'e.g. MSCU1234567' : 'Leave empty if none'}
                />
                {fieldErrors.containerNo && (
                  <p className="text-[10px] text-red-600 mt-1">{fieldErrors.containerNo}</p>
                )}
              </div>
              <div>
                <FieldLabel>Container type/size</FieldLabel>
                <select
                  value={form.containerType}
                  onChange={(e) => setForm((f) => ({ ...f, containerType: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                >
                  <option value="">Select…</option>
                  {['20GP', '40GP', '40HC', 'other'].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Vessel name</FieldLabel>
                <input
                  value={form.vesselName}
                  onChange={(e) => setForm((f) => ({ ...f, vesselName: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                />
              </div>
              <div>
                <FieldLabel>Voyage number</FieldLabel>
                <input
                  value={form.voyageNumber}
                  onChange={(e) => setForm((f) => ({ ...f, voyageNumber: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                />
              </div>
              <div>
                <FieldLabel>Packages</FieldLabel>
                <input
                  type="number"
                  value={form.packageCount}
                  onChange={(e) => setForm((f) => ({ ...f, packageCount: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                />
              </div>
              <div>
                <FieldLabel>Gross weight (kg)</FieldLabel>
                <input
                  type="number"
                  value={form.grossWeightKg}
                  onChange={(e) => setForm((f) => ({ ...f, grossWeightKg: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                />
              </div>
              <div>
                <FieldLabel>Volume (CBM)</FieldLabel>
                <input
                  type="number"
                  value={form.cbm}
                  onChange={(e) => setForm((f) => ({ ...f, cbm: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                />
              </div>
              <div>
                <FieldLabel>Consignee</FieldLabel>
                <input
                  value={form.consignee}
                  onChange={(e) => setForm((f) => ({ ...f, consignee: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                />
              </div>
              <div className="col-span-2">
                <FieldLabel>Notify party</FieldLabel>
                <input
                  value={form.notifyParty}
                  onChange={(e) => setForm((f) => ({ ...f, notifyParty: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                />
              </div>
            </div>
          </FormSection>

          {selectedPo?.items?.length ? (
            <FormSection title="Cargo allocation" subtitle="Qty cannot exceed remaining PO quantity">
              {fieldErrors.items && <p className="text-[10px] text-red-600 mb-2">{fieldErrors.items}</p>}
              <table className="w-full text-xs border border-gray-100 rounded-xl overflow-hidden">
                <thead className="bg-gray-50 text-[10px] uppercase text-gray-400">
                  <tr>
                    <th className="text-left px-3 py-2">Product</th>
                    <th className="text-right px-3 py-2">Ordered</th>
                    <th className="text-right px-3 py-2">Shipped</th>
                    <th className="text-right px-3 py-2">Remaining</th>
                    <th className="text-right px-3 py-2">Ship qty</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedPo.items || []).filter((it) => it?.id).map((it) => (
                    <tr key={it.id} className="border-t border-gray-50">
                      <td className="px-3 py-2">
                        <p className="font-semibold">{it.productName}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{it.sku || '—'}</p>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {it.quantity} {it.uom}
                      </td>
                      <td className="px-3 py-2 text-right">{it.shippedQty}</td>
                      <td className="px-3 py-2 text-right font-semibold text-[#014582]">{it.remainingQty}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          max={it.remainingQty}
                          step="any"
                          value={cargoQty[it.id] ?? ''}
                          onChange={(e) => setCargoQty((q) => ({ ...q, [it.id]: e.target.value }))}
                          className="w-24 text-right rounded-lg border border-gray-200 px-2 py-1"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </FormSection>
          ) : null}
        </div>
      </TradeModal>

      <TradeModal
        isOpen={Boolean(statusModal)}
        onClose={() => {
          if (actionLoading) return;
          setStatusModal(null);
          setStatusErrors({});
          setStatusFormError(null);
        }}
        title={statusModal ? `Update status → ${statusModal.status}` : 'Update status'}
        maxWidth="max-w-md"
        actions={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => {
                setStatusModal(null);
                setStatusErrors({});
                setStatusFormError(null);
              }}
              className="px-3 py-2 rounded-xl border text-xs font-semibold"
            >
              Cancel
            </button>
            <button type="button" disabled={actionLoading} onClick={submitStatus} className="px-4 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold disabled:opacity-60">
              {actionLoading ? 'Saving…' : 'Confirm'}
            </button>
          </div>
        }
      >
        {statusModal && (
          <div className="space-y-3 text-xs">
            {statusFormError && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{statusFormError}</span>
              </div>
            )}
            {statusModal.status === 'Departed' && (
              <>
                <div>
                  <FieldLabel required>Actual ship date (ATD)</FieldLabel>
                  <input
                    type="date"
                    value={statusModal.actualDeparture || ''}
                    onChange={(e) => setStatusModal((s) => (s ? { ...s, actualDeparture: e.target.value } : s))}
                    className="w-full rounded-xl border px-3 py-2"
                  />
                  {statusErrors.actualDeparture && (
                    <p className="text-[10px] text-red-600 mt-1">{statusErrors.actualDeparture}</p>
                  )}
                </div>
                <div>
                  <FieldLabel required>B/L / AWB number</FieldLabel>
                  <input
                    value={statusModal.blNumber || ''}
                    onChange={(e) => setStatusModal((s) => (s ? { ...s, blNumber: e.target.value } : s))}
                    className="w-full rounded-xl border px-3 py-2"
                  />
                  {statusErrors.blNumber && <p className="text-[10px] text-red-600 mt-1">{statusErrors.blNumber}</p>}
                </div>
                <div>
                  <FieldLabel>Load type</FieldLabel>
                  <select
                    value={statusModal.loadType || ''}
                    onChange={(e) => setStatusModal((s) => (s ? { ...s, loadType: e.target.value } : s))}
                    className="w-full rounded-xl border px-3 py-2"
                  >
                    <option value="">Select…</option>
                    {['FCL', 'LCL', 'Bulk', 'Air cargo'].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel required={statusModal.loadType === 'FCL'}>
                    Container number {statusModal.loadType === 'FCL' ? '(ISO 6346)' : '(optional)'}
                  </FieldLabel>
                  <input
                    value={statusModal.containerNo || ''}
                    onChange={(e) => setStatusModal((s) => (s ? { ...s, containerNo: e.target.value } : s))}
                    className="w-full rounded-xl border px-3 py-2"
                    placeholder={statusModal.loadType === 'FCL' ? 'e.g. MSCU1234567' : 'Leave empty if N/A'}
                  />
                  {statusErrors.containerNo && (
                    <p className="text-[10px] text-red-600 mt-1">{statusErrors.containerNo}</p>
                  )}
                </div>
                <div>
                  <FieldLabel required>Port of loading</FieldLabel>
                  <input
                    value={statusModal.originPort || ''}
                    onChange={(e) => setStatusModal((s) => (s ? { ...s, originPort: e.target.value } : s))}
                    className="w-full rounded-xl border px-3 py-2"
                  />
                  {statusErrors.originPort && (
                    <p className="text-[10px] text-red-600 mt-1">{statusErrors.originPort}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FieldLabel required>Packages</FieldLabel>
                    <input
                      type="number"
                      min={0}
                      value={statusModal.packageCount || ''}
                      onChange={(e) => setStatusModal((s) => (s ? { ...s, packageCount: e.target.value } : s))}
                      className="w-full rounded-xl border px-3 py-2"
                    />
                    {statusErrors.packageCount && (
                      <p className="text-[10px] text-red-600 mt-1">{statusErrors.packageCount}</p>
                    )}
                  </div>
                  <div>
                    <FieldLabel required>Gross weight (kg)</FieldLabel>
                    <input
                      type="number"
                      min={0}
                      value={statusModal.grossWeightKg || ''}
                      onChange={(e) => setStatusModal((s) => (s ? { ...s, grossWeightKg: e.target.value } : s))}
                      className="w-full rounded-xl border px-3 py-2"
                    />
                    {statusErrors.grossWeightKg && (
                      <p className="text-[10px] text-red-600 mt-1">{statusErrors.grossWeightKg}</p>
                    )}
                  </div>
                </div>
              </>
            )}
            {statusModal.status === 'Arrived' && (
              <div>
                <FieldLabel required>Actual arrival date (ATA)</FieldLabel>
                <input
                  type="date"
                  value={statusModal.actualArrival || ''}
                  onChange={(e) => setStatusModal((s) => (s ? { ...s, actualArrival: e.target.value } : s))}
                  className="w-full rounded-xl border px-3 py-2"
                />
                {statusErrors.actualArrival && (
                  <p className="text-[10px] text-red-600 mt-1">{statusErrors.actualArrival}</p>
                )}
                {selectedShipment?.actualDeparture && (
                  <p className="text-[10px] text-gray-500 mt-1">
                    ATD on file: {formatTradeDate(selectedShipment.actualDeparture)}
                  </p>
                )}
              </div>
            )}
            {statusModal.status === 'Delivered/Received' && (
              <div>
                <FieldLabel required>Delivered / received date</FieldLabel>
                <input
                  type="date"
                  value={statusModal.deliveredAt || ''}
                  onChange={(e) => setStatusModal((s) => (s ? { ...s, deliveredAt: e.target.value } : s))}
                  className="w-full rounded-xl border px-3 py-2"
                />
                {statusErrors.deliveredAt && (
                  <p className="text-[10px] text-red-600 mt-1">{statusErrors.deliveredAt}</p>
                )}
              </div>
            )}
            {(statusModal.status === 'Cancelled' || statusModal.status === 'Delayed') && (
              <div>
                <p className="text-gray-600 mb-2">
                  {statusModal.status === 'Cancelled'
                    ? 'Cancel this shipment? It will no longer count toward shipped PO quantity.'
                    : 'Mark this shipment as Delayed. You can resume the normal status flow later.'}
                </p>
                <FieldLabel>Reason / note</FieldLabel>
                <textarea
                  value={statusModal.note || ''}
                  onChange={(e) => setStatusModal((s) => (s ? { ...s, note: e.target.value } : s))}
                  rows={2}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
            )}
            {statusModal.status === 'In Transit' && (
              <p className="text-gray-600">Confirm vessel/flight is in transit from the port of loading.</p>
            )}
            {statusModal.status === 'Customs Clearance' && (
              <p className="text-gray-600">Move this shipment into customs clearance.</p>
            )}
          </div>
        )}
      </TradeModal>
    </TradePage>
  );
}
