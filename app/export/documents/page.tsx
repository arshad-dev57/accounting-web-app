'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FolderArchive,
  Search,
  Eye,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Send,
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
  type ExportDocument,
  type ExportOrder,
  type ExportShipment,
} from '../../../lib/export-api';
import { useExportList } from '../../../lib/use-export-list';
import { usePermissions } from '../../../lib/usePermissions';

const DOC_TYPES = [
  'Commercial Invoice',
  'Certificate of Origin',
  'Bill of Lading',
  'Packing List',
  'Insurance Certificate',
  'Inspection Certificate',
  'Fumigation Certificate',
  'Bank Covering Letter',
  'Other',
];

const DOCUMENT_STATUSES = ['Draft', 'Finalized', 'Legalized', 'Dispatched via DHL', 'Delivered'];

const NEXT_STATUS: Record<string, string[]> = {
  Draft: ['Finalized'],
  Finalized: ['Legalized', 'Dispatched via DHL'],
  'Dispatched via DHL': ['Delivered'],
  Legalized: [],
  Delivered: [],
};

type InvoiceOption = { id: string; invoiceNumber?: string; invoiceDate?: string; grandTotal?: number; totalAmount?: number };

export default function ExportDocumentsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-10 text-center text-xs text-gray-400">Loading…</div>
      }
    >
      <ExportDocumentsPageContent />
    </React.Suspense>
  );
}

function ExportDocumentsPageContent() {
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const canCreate = can('export.documents.create');
  const canEdit = can('export.documents.edit');

  const orderIdFilter = searchParams?.get('orderId') || undefined;
  const [docTypeFilter, setDocTypeFilter] = useState('');
  const list = useExportList<ExportDocument>((query) => exportApi.listDocuments(query), {
    limit: 20,
    extraQuery: {
      ...(orderIdFilter ? { orderId: orderIdFilter } : {}),
      ...(docTypeFilter ? { docType: docTypeFilter } : {}),
    },
  });

  const [selected, setSelected] = useState<ExportDocument | null>(null);
  const [courierTracking, setCourierTracking] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExportDocument | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<ExportOrder | null>(null);
  const [shipments, setShipments] = useState<ExportShipment[]>([]);
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [shipmentId, setShipmentId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [courierTrackingNo, setCourierTrackingNo] = useState('');
  const [filePlaceholder, setFilePlaceholder] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = useCallback((presetOrderId?: string) => {
    setEditing(null);
    setOrderId(presetOrderId || '');
    setOrder(null);
    setShipments([]);
    setInvoices([]);
    setDocType(DOC_TYPES[0]);
    setShipmentId('');
    setInvoiceId('');
    setIssueDate(new Date().toISOString().slice(0, 10));
    setCourierTrackingNo('');
    setFilePlaceholder('');
    setNotes('');
    setFormError(null);
  }, []);

  const loadOrderLinks = async (selectedOrderId: string) => {
    if (!selectedOrderId) {
      setShipments([]);
      setInvoices([]);
      return;
    }
    const [shipmentResult, full] = await Promise.allSettled([
      exportApi.listShipments({ orderId: selectedOrderId, limit: 100 }),
      exportApi.getOrderFull(selectedOrderId),
    ]);
    setShipments(shipmentResult.status === 'fulfilled' ? shipmentResult.value.items || [] : []);
    setInvoices(full.status === 'fulfilled' ? full.value.invoices || [] : []);
  };

  const handleOrderChange = async (id: string, selectedOrder?: ExportOrder | null) => {
    setOrderId(id);
    setOrder(selectedOrder || null);
    setShipmentId('');
    setInvoiceId('');
    await loadOrderLinks(id);
  };

  const openCreate = async () => {
    resetForm(orderIdFilter);
    setModalOpen(true);
    if (orderIdFilter) {
      try {
        const record = await exportApi.getOrder(orderIdFilter);
        setOrder(record);
        await loadOrderLinks(orderIdFilter);
      } catch {
        // handled by the order selector if the user selects manually
      }
    }
  };

  const openEdit = (doc: ExportDocument) => {
    setEditing(doc);
    setOrderId(doc.orderId || '');
    setOrder(null);
    setShipments([]);
    setInvoices([]);
    setDocType(doc.docType);
    setShipmentId(doc.shipmentId || '');
    setInvoiceId(doc.invoiceId || '');
    setIssueDate(doc.issueDate ? doc.issueDate.slice(0, 10) : '');
    setCourierTrackingNo(doc.courierTrackingNo || '');
    setFilePlaceholder(doc.filePlaceholder || '');
    setNotes(doc.notes || '');
    setFormError(null);
    setModalOpen(true);
    if (doc.orderId) void loadOrderLinks(doc.orderId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!editing && !orderId) return setFormError('Select the export order for this document.');
    setSaving(true);
    try {
      let saved: ExportDocument;
      if (editing) {
        saved = await exportApi.updateDocument(editing.id, {
          issueDate: issueDate || undefined,
          courierTrackingNo: courierTrackingNo || undefined,
          filePlaceholder: filePlaceholder || undefined,
          notes: notes || undefined,
        });
        toast.success(`Document ${saved.docNumber} updated`);
      } else {
        saved = await exportApi.createDocument({
          docType,
          orderId,
          shipmentId: shipmentId || undefined,
          invoiceId: invoiceId || undefined,
          issueDate: issueDate || undefined,
          courierTrackingNo: courierTrackingNo || undefined,
          filePlaceholder: filePlaceholder || undefined,
          notes: notes || undefined,
        });
        toast.success(`Document ${saved.docNumber} created`);
      }
      setModalOpen(false);
      resetForm();
      list.reload();
      setSelected(saved);
      setCourierTracking(saved.courierTrackingNo || '');
    } catch (err) {
      setFormError(errorMessage(err, editing ? 'Failed to update document' : 'Failed to create document'));
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (doc: ExportDocument, status: string) => {
    if (status === 'Dispatched via DHL' && !courierTracking.trim()) {
      toast.error('Enter the DHL tracking number before dispatching');
      return;
    }
    setActionId(doc.id);
    try {
      const updated = await exportApi.updateDocumentStatus(doc.id, status, {
        courierTrackingNo: status === 'Dispatched via DHL' ? courierTracking.trim() : undefined,
      });
      setSelected(updated);
      setCourierTracking(updated.courierTrackingNo || '');
      list.setItems((prev) => prev.map((row) => (row.id === doc.id ? updated : row)));
      toast.success(`Document moved to ${status}`);
    } catch (err) {
      toast.error(errorMessage(err, `Failed to move document to ${status}`));
    } finally {
      setActionId(null);
    }
  };

  return (
    <TradePage>
      <TradePageHeader
        title="Export Documents & Bank Presentation"
        subtitle="Commercial invoices, legalized certificates of origin, bills of lading and courier delivery tracking"
        moduleName="Export Operations"
        backHref="/export/dashboard"
        icon={<FolderArchive className="w-5 h-5 text-white" />}
        actions={
          canCreate ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#014582] text-xs font-bold hover:bg-white/90 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Document
            </button>
          ) : undefined
        }
      />

      <TradeCard>
        <OrderFilterBanner orderId={orderIdFilter} entityLabel="documents" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search document no, buyer or courier…"
                value={list.search}
                onChange={(e) => list.setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#014582]"
              />
            </div>
            <select
              value={docTypeFilter}
              onChange={(e) => {
                setDocTypeFilter(e.target.value);
                list.changePage(1);
              }}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white"
            >
              <option value="">All document types</option>
              {DOC_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              value={list.status}
              onChange={(e) => list.setStatus(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white"
            >
              <option value="">All statuses</option>
              {DOCUMENT_STATUSES.map((s) => (
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
            columns={['Document Type', 'Document Number', 'Order Ref', 'Overseas Customer', 'Issue Date', 'Courier Tracking', 'Status', 'Actions']}
          />
          <TradeTableBody>
            {list.loading && list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={8}>
                  <RefreshCw className="w-4 h-4 animate-spin inline mr-2" /> Loading documents…
                </TradeTableCell>
              </TradeTableRow>
            ) : list.items.length === 0 ? (
              <TradeTableRow>
                <TradeTableCell className="text-gray-400 py-8 text-center" colSpan={8}>
                  No documents match the current filters.
                </TradeTableCell>
              </TradeTableRow>
            ) : (
              list.items.map((doc) => (
                <TradeTableRow key={doc.id}>
                  <TradeTableCell className="font-bold text-[#014582]">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#014582]" />
                      <span>{doc.docType}</span>
                    </div>
                  </TradeTableCell>
                  <TradeTableCell className="font-mono text-xs font-semibold text-gray-800">
                    {doc.docNumber}
                  </TradeTableCell>
                  <TradeTableCell className="text-gray-700">
                    {doc.orderId ? (
                      <Link href={`/export/orders?order=${doc.orderId}`} className="hover:underline text-blue-700">
                        {doc.orderNumber || doc.orderId.slice(0, 8)}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </TradeTableCell>
                  <TradeTableCell className="font-semibold text-gray-900">
                    {doc.customerName || '—'}
                  </TradeTableCell>
                  <TradeTableCell className="text-gray-600">{formatDate(doc.issueDate)}</TradeTableCell>
                  <TradeTableCell className="font-mono text-xs text-gray-700">
                    {doc.courierTrackingNo || 'Electronic delivery'}
                  </TradeTableCell>
                  <TradeTableCell>
                    <TradeStatusBadge status={doc.status} />
                  </TradeTableCell>
                  <TradeTableCell>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(doc);
                        setCourierTracking(doc.courierTrackingNo || '');
                      }}
                      className="p-1.5 rounded-lg text-[#014582] hover:bg-blue-50 transition-colors"
                      title="View document"
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
        title={selected?.docNumber || 'Export Document'}
        subtitle={selected ? `${selected.docType} · ${selected.customerName || 'No buyer'}` : undefined}
        actions={
          selected ? (
            <div className="flex flex-wrap items-center gap-2">
              {canEdit && selected.status === 'Draft' && (
                <button
                  type="button"
                  onClick={() => openEdit(selected)}
                  className="px-3.5 py-2 rounded-xl border border-[#014582]/30 text-[#014582] text-xs font-bold"
                >
                  Edit Document
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
                    {next === 'Dispatched via DHL' ? (
                      <Send className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    {next}
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
                <span className="text-gray-400 block text-[10px] uppercase">Document Type</span>
                <span className="font-bold text-gray-900">{selected.docType}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Document Number</span>
                <span className="font-mono font-bold text-gray-900">{selected.docNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Export Order</span>
                {selected.orderId ? (
                  <Link
                    href={`/export/orders?order=${selected.orderId}`}
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    {selected.orderNumber || selected.orderId.slice(0, 8)}
                  </Link>
                ) : (
                  <span className="text-gray-600">—</span>
                )}
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Issue Date</span>
                <span className="font-semibold text-gray-900">{formatDate(selected.issueDate)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Courier Tracking</span>
                <span className="font-mono font-semibold text-blue-700">
                  {selected.courierTrackingNo || 'Electronic delivery'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Status</span>
                <TradeStatusBadge status={selected.status} />
              </div>
            </div>

            {selected.status !== 'Dispatched via DHL' && selected.status !== 'Delivered' && canEdit && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100 space-y-2">
                <FieldLabel>DHL tracking number</FieldLabel>
                <input
                  value={courierTracking}
                  onChange={(e) => setCourierTracking(e.target.value)}
                  placeholder="Required when dispatching the document set by courier"
                  className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs"
                />
              </div>
            )}

            <div className="p-6 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/70 text-center space-y-2">
              <FileText className="w-10 h-10 text-[#014582] mx-auto opacity-70" />
              <p className="font-bold text-gray-800">
                {selected.filePlaceholder || 'No file reference recorded'}
              </p>
              <p className="text-gray-500 text-[11px]">
                File storage is not configured for this deployment. The document reference above is stored on the
                export record; attach the actual file through your document management system.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {selected.orderId && (
                <Link
                  href={`/export/orders?order=${selected.orderId}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Export order <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
              <Link
                href={`/export/receipts${selected.orderId ? `?orderId=${selected.orderId}` : ''}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Receipts <ArrowRight className="w-3.5 h-3.5" />
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
        title={editing ? `Edit Document ${editing.docNumber}` : 'Create Export Document'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" /> {formError}
            </div>
          )}

          <FormSection title="Document & order">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel required>Document type</FieldLabel>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  disabled={Boolean(editing)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs disabled:bg-gray-50"
                >
                  {DOC_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Issue date</FieldLabel>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                />
              </div>
            </div>

            {!editing && (
              <div>
                <FieldLabel required>Export order</FieldLabel>
                <OrderSelect value={orderId} onChange={handleOrderChange} required disabled={saving} />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <FieldLabel>Commercial invoice</FieldLabel>
                <select
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                >
                  <option value="">No invoice link</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber || inv.id.slice(0, 8)} ·{' '}
                      {formatDate(inv.invoiceDate)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </FormSection>

          <FormSection title="Courier & file reference">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Courier tracking no</FieldLabel>
                <input
                  value={courierTrackingNo}
                  onChange={(e) => setCourierTrackingNo(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                  placeholder="DHL / courier tracking number"
                />
              </div>
              <div>
                <FieldLabel>File reference</FieldLabel>
                <input
                  value={filePlaceholder}
                  onChange={(e) => setFilePlaceholder(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                  placeholder="e.g. COO-2026-1042.pdf"
                />
              </div>
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
              {saving ? 'Saving…' : editing ? 'Save Document' : 'Create Document'}
            </button>
          </div>
        </form>
      </TradeModal>
    </TradePage>
  );
}
