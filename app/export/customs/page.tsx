'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FileCheck2,
  Search,
  Eye,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
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
  formatMoney,
  type ExportCustoms,
  type ExportOrder,
  type ExportShipment,
} from '../../../lib/export-api';
import { useExportList } from '../../../lib/use-export-list';
import { usePermissions } from '../../../lib/usePermissions';
import { useCurrency } from '../../../lib/currency-context';

const CUSTOMS_STATUSES = [
  'Draft',
  'Submitted',
  'Goods Inspected',
  'Let Export Order (LEO) Granted',
  'Sailed & Completed',
];

const NEXT_STATUS: Record<string, string[]> = {
  Draft: ['Submitted'],
  Submitted: ['Goods Inspected', 'Let Export Order (LEO) Granted'],
  'Goods Inspected': ['Let Export Order (LEO) Granted'],
  'Let Export Order (LEO) Granted': ['Sailed & Completed'],
  'Sailed & Completed': [],
};

export default function ExportCustomsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-10 text-center text-xs text-gray-400">Loading…</div>
      }
    >
      <ExportCustomsPageContent />
    </React.Suspense>
  );
}

function ExportCustomsPageContent() {
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const { code: displayCurrency } = useCurrency();
  const canCreate = can('export.customs.create');
  const canEdit = can('export.customs.edit');

  const orderIdFilter = searchParams?.get('orderId') || undefined;
  const list = useExportList<ExportCustoms>((query) => exportApi.listCustoms(query), {
    limit: 20,
    extraQuery: orderIdFilter ? { orderId: orderIdFilter } : undefined,
  });

  const [selected, setSelected] = useState<ExportCustoms | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExportCustoms | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<ExportOrder | null>(null);
  const [shipments, setShipments] = useState<ExportShipment[]>([]);
  const [shipmentId, setShipmentId] = useState('');
  const [exportPort, setExportPort] = useState('');
  const [declarationDate, setDeclarationDate] = useState(new Date().toISOString().slice(0, 10));
  const [fobValue, setFobValue] = useState<number | ''>('');
  const [customsAgent, setCustomsAgent] = useState('');
  const [drawbackEligible, setDrawbackEligible] = useState(false);
  const [drawbackValue, setDrawbackValue] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const resetForm = useCallback((presetOrderId?: string) => {
    setEditing(null);
    setOrderId(presetOrderId || '');
    setOrder(null);
    setShipments([]);
    setShipmentId('');
    setExportPort('');
    setDeclarationDate(new Date().toISOString().slice(0, 10));
    setFobValue('');
    setCustomsAgent('');
    setDrawbackEligible(false);
    setDrawbackValue('');
    setNotes('');
    setFormError(null);
  }, []);

  const loadShipments = async (selectedOrderId: string) => {
    if (!selectedOrderId) {
      setShipments([]);
      return;
    }
    try {
      const res = await exportApi.listShipments({ orderId: selectedOrderId, limit: 100 });
      setShipments(res.items || []);
    } catch {
      setShipments([]);
    }
  };

  const handleOrderChange = async (id: string, selectedOrder?: ExportOrder | null) => {
    setOrderId(id);
    setOrder(selectedOrder || null);
    setShipmentId('');
    if (id) await loadShipments(id);
  };

  const openCreate = async () => {
    resetForm(orderIdFilter);
    setModalOpen(true);
    if (orderIdFilter) {
      try {
        const record = await exportApi.getOrder(orderIdFilter);
        setOrder(record);
        setFobValue(Number(record.totalForeign));
        await loadShipments(orderIdFilter);
      } catch {
        // the selector will surface the error when the order is chosen manually
      }
    }
  };

  const openEdit = (decl: ExportCustoms) => {
    setEditing(decl);
    setOrderId(decl.orderId);
    setOrder(null);
    setShipments([]);
    setShipmentId(decl.shipmentId || '');
    setExportPort(decl.exportPort || '');
    setDeclarationDate(decl.declarationDate ? decl.declarationDate.slice(0, 10) : '');
    setFobValue(Number(decl.fobValueForeign));
    setCustomsAgent(decl.customsAgent || '');
    setDrawbackEligible(Boolean(decl.dutyDrawbackEligible));
    setDrawbackValue(Number(decl.dutyDrawbackEstimatedForeign || 0));
    setNotes(decl.notes || '');
    setFormError(null);
    setModalOpen(true);
    void loadShipments(decl.orderId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!editing && !orderId) return setFormError('Select the export order being declared.');
    if (!editing && fobValue !== '' && Number(fobValue) < 0) {
      return setFormError('FOB value cannot be negative.');
    }
    setSaving(true);
    try {
      const payload = {
        exportPort: exportPort || undefined,
        declarationDate: declarationDate || undefined,
        fobValueForeign: fobValue === '' ? undefined : Number(fobValue),
        customsAgent: customsAgent || undefined,
        dutyDrawbackEligible: drawbackEligible,
        dutyDrawbackEstimatedForeign: drawbackValue === '' ? 0 : Number(drawbackValue),
        shipmentId: shipmentId || undefined,
        notes: notes || undefined,
      };
      let saved: ExportCustoms;
      if (editing) {
        saved = await exportApi.updateCustoms(editing.id, payload);
        toast.success(`Declaration ${saved.shippingBillNo} updated`);
      } else {
        saved = await exportApi.createCustoms({ ...payload, orderId });
        toast.success(`Customs declaration ${saved.shippingBillNo} created`);
      }
      setModalOpen(false);
      resetForm();
      list.reload();
      setSelected(saved);
    } catch (err) {
      setFormError(errorMessage(err, editing ? 'Failed to update declaration' : 'Failed to create declaration'));
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (decl: ExportCustoms, status: string) => {
    setActionId(decl.id);
    try {
      const updated = await exportApi.updateCustomsStatus(decl.id, status);
      setSelected(updated);
      list.setItems((prev) => prev.map((row) => (row.id === decl.id ? updated : row)));
      toast.success(`Declaration moved to ${status}`);
    } catch (err) {
      toast.error(errorMessage(err, `Failed to move declaration to ${status}`));
    } finally {
      setActionId(null);
    }
  };

  const currency = selected?.orderCurrency || displayCurrency;

  return (
    <TradePage>
      <TradePageHeader
        title="Export Customs Declarations"
        subtitle="Shipping bills, customs inspection, Let Export Order (LEO) grants and duty drawback tracking"
        moduleName="Export Operations"
        backHref="/export/dashboard"
        icon={<FileCheck2 className="w-5 h-5 text-white" />}
        actions={
          canCreate ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Declaration
            </button>
          ) : undefined
        }
      />

      <TradeCard>
        <OrderFilterBanner orderId={orderIdFilter} entityLabel="customs declarations" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search shipping bill, port or customs agent…"
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
              <option value="">All statuses</option>
              {CUSTOMS_STATUSES.map((s) => (
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
            columns={['Shipping Bill No', 'Order Ref', 'Overseas Buyer', 'Export Port', 'Declaration Date', 'FOB Value', 'Drawback', 'Customs Agent', 'Status', 'Actions']}
          />
          <TradeTableBody>
            {list.loading && list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={10}>
                  <RefreshCw className="w-4 h-4 animate-spin inline mr-2" /> Loading customs declarations…
                </TradeTableCell>
              </TradeTableRow>
            ) : list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={10}>
                  No customs declarations match the current filters.
                </TradeTableCell>
              </TradeTableRow>
            ) : (
              list.items.map((decl) => (
                <TradeTableRow key={decl.id}>
                  <TradeTableCell className="font-bold text-[#014582]">{decl.shippingBillNo}</TradeTableCell>
                  <TradeTableCell className="font-semibold text-gray-800">
                    <Link href={`/export/orders?order=${decl.orderId}`} className="hover:underline text-blue-700">
                      {decl.orderNumber || decl.orderId.slice(0, 8)}
                    </Link>
                  </TradeTableCell>
                  <TradeTableCell className="font-semibold text-gray-900">
                    {decl.orderCustomerName || '—'}
                  </TradeTableCell>
                  <TradeTableCell className="text-xs text-gray-700">{decl.exportPort || '—'}</TradeTableCell>
                  <TradeTableCell className="text-gray-600">{formatDate(decl.declarationDate)}</TradeTableCell>
                  <TradeTableCell className="font-bold text-gray-900">
                    {decl.orderCurrency
                      ? formatMoney(decl.fobValueForeign, decl.orderCurrency)
                      : Number(decl.fobValueForeign).toLocaleString()}
                  </TradeTableCell>
                  <TradeTableCell className="text-xs text-gray-700">
                    {decl.dutyDrawbackEligible ? (
                      <span className="font-semibold text-emerald-700">
                        {decl.orderCurrency
                          ? formatMoney(decl.dutyDrawbackEstimatedForeign, decl.orderCurrency)
                          : Number(decl.dutyDrawbackEstimatedForeign).toLocaleString()}
                      </span>
                    ) : (
                      'Not eligible'
                    )}
                  </TradeTableCell>
                  <TradeTableCell className="text-xs text-gray-700">{decl.customsAgent || '—'}</TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={decl.status} />
                  </TradeTableCell>
                  <TradeTableCell>
                    <button
                      type="button"
                      onClick={() => setSelected(decl)}
                      className="p-1.5 rounded-lg text-[#014582] hover:bg-blue-50 transition-colors"
                      title="View declaration"
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
        title={selected?.shippingBillNo || 'Customs Declaration'}
        subtitle={selected ? `Order ${selected.orderNumber || selected.orderId.slice(0, 8)}` : undefined}
        actions={
          selected ? (
            <div className="flex flex-wrap items-center gap-2">
              {canEdit && selected.status === 'Draft' && (
                <button
                  type="button"
                  onClick={() => openEdit(selected)}
                  className="px-3.5 py-2 rounded-xl border border-[#014582]/30 text-[#014582] text-xs font-bold"
                >
                  Edit Declaration
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
                <span className="text-gray-400 block text-[10px] uppercase">Shipping Bill No</span>
                <span className="font-bold text-gray-900">{selected.shippingBillNo}</span>
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
                <span className="text-gray-400 block text-[10px] uppercase">Declaration Date</span>
                <span className="font-semibold text-gray-900">{formatDate(selected.declarationDate)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">LEO Date</span>
                <span className="font-semibold text-gray-900">{formatDate(selected.leoDate)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Export Port</span>
                <span className="font-semibold text-gray-900">{selected.exportPort || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Customs Agent</span>
                <span className="font-semibold text-gray-900">{selected.customsAgent || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">FOB Value</span>
                <span className="font-bold text-gray-900">
                  {currency
                    ? formatMoney(selected.fobValueForeign, currency)
                    : Number(selected.fobValueForeign).toLocaleString()}
                </span>
                <span className="block text-[10px] text-gray-400">
                  base {formatMoney(selected.fobValueBase, displayCurrency)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Duty Drawback</span>
                <span className="font-bold text-gray-900">
                  {selected.dutyDrawbackEligible
                    ? currency
                      ? formatMoney(selected.dutyDrawbackEstimatedForeign, currency)
                      : Number(selected.dutyDrawbackEstimatedForeign).toLocaleString()
                    : 'Not eligible'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Status</span>
                <TradeStatusBadge status={selected.status} />
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Shipment</span>
                <span className="font-mono text-gray-700">{selected.shipmentId || 'Not linked'}</span>
              </div>
            </div>

            {selected.status === 'Let Export Order (LEO) Granted' && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 mt-0.5" />
                <div>
                  <p className="font-bold">Let Export Order granted</p>
                  <p className="text-[11px]">
                    Dispatch handover can proceed once the packing list is certified. LEO date{' '}
                    {formatDate(selected.leoDate)}.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/export/shipments?orderId=${selected.orderId}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Shipments <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={`/export/dispatch?orderId=${selected.orderId}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Dispatch <ArrowRight className="w-3.5 h-3.5" />
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
        title={editing ? `Edit Declaration ${editing.shippingBillNo}` : 'Create Customs Declaration'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" /> {formError}
            </div>
          )}

          <FormSection title="Declaration">
            {!editing && (
              <div>
                <FieldLabel required>Export order</FieldLabel>
                <OrderSelect value={orderId} onChange={handleOrderChange} required disabled={saving} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Declaration date</FieldLabel>
                <input
                  type="date"
                  value={declarationDate}
                  onChange={(e) => setDeclarationDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <FieldLabel>Export port</FieldLabel>
                <input
                  value={exportPort}
                  onChange={(e) => setExportPort(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                  placeholder="e.g. Jebel Ali"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Linked shipment</FieldLabel>
                <select
                  value={shipmentId}
                  onChange={(e) => setShipmentId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                >
                  <option value="">No shipment link</option>
                  {shipments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shipmentNumber} — {s.shipmentStatus}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Customs agent</FieldLabel>
                <input
                  value={customsAgent}
                  onChange={(e) => setCustomsAgent(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>
                  FOB value {order ? `(${order.currency})` : ''}
                </FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={fobValue}
                  onChange={(e) => setFobValue(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={order ? String(order.totalForeign) : 'Defaults to order total'}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <FieldLabel>Estimated duty drawback</FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={drawbackValue}
                  onChange={(e) => setDrawbackValue(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={drawbackEligible}
                onChange={(e) => setDrawbackEligible(e.target.checked)}
              />
              Duty drawback eligible
            </label>
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
              onClick={() => setModalOpen(false)}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || (!editing && !orderId)}
              className="px-4 py-2 rounded-lg bg-[#014582] text-white hover:bg-[#01366a] text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'Saving…' : editing ? 'Save Declaration' : 'Create Declaration'}
            </button>
          </div>
        </form>
      </TradeModal>
    </TradePage>
  );
}
