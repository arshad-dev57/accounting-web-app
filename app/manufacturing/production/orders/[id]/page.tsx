'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ClipboardList,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  XCircle,
  Lock,
  Package,
  Calculator,
  Plus,
  Save,
} from 'lucide-react';
import {
  productionOrderService,
  inspectionService,
  workOrderService,
  type ProductionOrder,
  type MaterialLine,
} from '@/lib/manufacturing-service';
import { ProductPicker, type PickedProduct } from '../../../_components/ProductPicker';
import { MfgRelationPicker, type PickedRelation } from '../../../_components/MfgRelationPicker';
import {
  MfgPage,
  MfgPageHeader,
  MfgCard,
  MfgStatCard,
  MfgTable,
  MfgTableRow,
  MfgTableCell,
  MfgStatusBadge,
  MfgLoading,
  MfgError,
  MfgButton,
  MfgTabs,
  MfgField,
  MfgInput,
  MfgSelect,
  MfgTextarea,
  MFG_COLORS,
} from '../../../ui';

const n = (v: any) => Number(v || 0);
const fmt = (v: any) => n(v).toLocaleString();
function maxIssuable(line: any) {
  const remaining = n(line.remainingQty);
  if (line.stockResolved === false) return 0;
  if (line.onHandQty == null && line.availableQty == null) return remaining;
  return Math.max(0, Math.min(remaining, n(line.onHandQty ?? line.availableQty)));
}
function fgReceiptCap(order: any) {
  const planned = n(order?.plannedQuantity);
  const already = n(order?.producedQuantity ?? order?.goodQuantity);
  const remainingToProduce = Math.max(0, planned - already);
  return order?.inventoryPosted ? remainingToProduce : Math.max(remainingToProduce, already);
}

export default function ProductionOrderWorkspacePage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || '');
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [materials, setMaterials] = useState<MaterialLine[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [costing, setCosting] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('overview');
  const [issueLines, setIssueLines] = useState<any[]>([]);
  const [output, setOutput] = useState({ goodQuantity: '', scrapQuantity: '', rejectedQuantity: '', reworkQuantity: '', batchNumber: '', warehouseId: '' as string, notes: '' });
  const [fgWh, setFgWh] = useState<PickedRelation[]>([]);
  const [scrapLines, setScrapLines] = useState([{ productId: '', productName: '', quantity: '', reason: '', recoverable: false, cost: '' }]);
  const [bpLines, setBpLines] = useState([{ productId: '', productName: '', quantity: '', warehouseId: '', batchNumber: '' }]);
  const [qc, setQc] = useState({ inspectionType: 'Final', result: 'Pending', notes: '', parameters: [{ parameterName: 'Weight', expectedValue: '', actualValue: '', tolerance: '', unitOfMeasure: '' }] });
  const [report, setReport] = useState<Record<string, any>>({});

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [o, m, op, c, h] = await Promise.all([
        productionOrderService.get(id),
        productionOrderService.materials(id).catch(() => []),
        productionOrderService.operations(id).catch(() => []),
        productionOrderService.costing(id).catch(() => null),
        productionOrderService.history(id).catch(() => []),
      ]);
      setOrder(o);
      setMaterials(m);
      setOperations(op);
      setCosting(c?.data || c);
      setHistory(h);
      setIssueLines(
        (m || []).map((line: any) => ({
          reservationId: line.reservationId || line.id,
          componentId: line.productId,
          productName: line.productName,
          requiredQty: n(line.requiredQty),
          issuedQty: n(line.issuedQty),
          remainingQty: n(line.remainingQty),
          onHandQty: line.onHandQty != null ? n(line.onHandQty) : (line.availableQty != null ? n(line.availableQty) : null),
          stockResolved: line.stockResolved !== false,
          stockError: line.stockError || null,
          issuedQuantity: maxIssuable({ ...line, onHandQty: line.onHandQty, stockResolved: line.stockResolved }),
          batchNumber: '',
          unit: line.unit,
          selected: false,
        }))
      );
      setOutput((p) => ({
        ...p,
        goodQuantity: String(fgReceiptCap(o)),
        scrapQuantity: String(n(o.scrapQuantity ?? o.scrappedQuantity)),
        rejectedQuantity: String(n(o.rejectedQuantity)),
        reworkQuantity: String(n(o.reworkQuantity)),
        batchNumber: o.batchNumber || '',
        warehouseId: o.finishedGoodsWarehouseId || '',
      }));
      if ((o as any).finishedGoodsWarehouse?.id) {
        setFgWh([{ id: String((o as any).finishedGoodsWarehouse.id), name: (o as any).finishedGoodsWarehouse.name || 'Selected warehouse' }]);
      } else if (o.finishedGoodsWarehouseId) {
        setFgWh([{ id: String(o.finishedGoodsWarehouseId), name: 'Selected warehouse' }]);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load production order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const status = order?.status || 'Draft';
  const plannedQty = n(order?.plannedQuantity);
  const producedQty = n(order?.producedQuantity ?? order?.goodQuantity);
  const remainingQty = n(order?.remainingQuantity) || Math.max(0, plannedQty - producedQty);
  const locked = ['Closed', 'Cancelled', 'Closed Short'].includes(status);
  const receiptCap = fgReceiptCap(order);
  const canReceiveFg = !locked
    && receiptCap > 0
    && ['Released', 'In Progress', 'InProgress', 'Paused', 'Partially Completed', 'Completed'].includes(status);

  const act = async (action: string) => {
    setBusy(true);
    try {
      const reason = action === 'cancel' || action === 'pause' || action === 'close-short'
        ? (window.prompt(action === 'close-short' ? 'Reason for closing short?' : `Reason for ${action}?`) || undefined)
        : undefined;
      if (action === 'close-short' && !reason) {
        toast.error('A reason is required to close short');
        return;
      }
      if (action === 'release') await productionOrderService.release(id);
      else if (action === 'start') await productionOrderService.start(id);
      else if (action === 'pause') await productionOrderService.pause(id, reason);
      else if (action === 'resume') await productionOrderService.resume(id);
      else if (action === 'close') await productionOrderService.close(id);
      else if (action === 'close-short') await productionOrderService.closeShort(id, reason);
      else if (action === 'cancel') await productionOrderService.cancel(id, reason);
      toast.success(action === 'close-short' ? 'Order closed short' : `Order ${action}d`);
      await load();
    } catch (e: any) {
      toast.error(e.message || `Failed to ${action}`);
    } finally {
      setBusy(false);
    }
  };

  const stockError = materials.find((m) => m.stockError)?.stockError || issueLines.find((l) => l.stockError)?.stockError;
  const issuableIssueLines = issueLines.filter((l) => maxIssuable(l) > 0);
  const selectedIssueLines = issueLines.filter((l) => l.selected && maxIssuable(l) > 0);
  const allIssuableSelected = issuableIssueLines.length > 0 && issuableIssueLines.every((l) => l.selected);

  const toggleSelectAllIssueLines = () => {
    setIssueLines((prev) => {
      const issuable = prev.filter((l) => maxIssuable(l) > 0);
      const next = issuable.length > 0 && issuable.every((l) => l.selected);
      return prev.map((l) => (maxIssuable(l) > 0 ? { ...l, selected: !next } : { ...l, selected: false }));
    });
  };

  const issueNow = async () => {
    const selected = issueLines.filter((l) => l.selected && maxIssuable(l) > 0);
    if (!selected.length) return toast.error('Select material lines to issue');
    const lines = selected.map((l) => ({
      reservationId: l.reservationId,
      componentId: l.componentId,
      issuedQuantity: Math.min(n(l.issuedQuantity), maxIssuable(l)),
      batchNumber: l.batchNumber || undefined,
    })).filter((l) => n(l.issuedQuantity) > 0);
    if (!lines.length) return toast.error('Enter issued quantities');
    setBusy(true);
    try {
      await productionOrderService.issueMaterials(id, { lines, fromLocationId: order?.sourceWarehouseId });
      toast.success('Materials issued in one transaction');
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Issue failed');
    } finally {
      setBusy(false);
    }
  };

  const completeNow = async () => {
    const qty = n(output.goodQuantity);
    if (qty <= 0) return toast.error('Enter a quantity to receive');
    if (qty > receiptCap) return toast.error(`Cannot receive ${qty}. Remaining quantity is ${receiptCap}.`);
    const nextRemaining = order?.inventoryPosted
      ? Math.max(0, remainingQty - qty)
      : Math.max(0, plannedQty - Math.max(producedQty, qty));
    setBusy(true);
    try {
      await productionOrderService.complete(id, {
        goodQuantity: qty,
        scrapQuantity: n(output.scrapQuantity),
        rejectedQuantity: n(output.rejectedQuantity),
        reworkQuantity: n(output.reworkQuantity),
        batchNumber: output.batchNumber || undefined,
        warehouseId: output.warehouseId || undefined,
      });
      toast.success(
        nextRemaining <= 0
          ? 'Production completed and finished goods received'
          : `Received ${qty}. Order is Partially Completed with ${nextRemaining} remaining.`
      );
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Complete failed');
    } finally {
      setBusy(false);
    }
  };

  const saveScrap = async () => {
    const lines = scrapLines.filter((l) => l.productId && n(l.quantity) > 0);
    if (!lines.length) return toast.error('Add scrap lines');
    setBusy(true);
    try {
      await productionOrderService.recordScrap(id, { lines: lines.map((l) => ({ ...l, quantity: n(l.quantity), cost: n(l.cost) })) });
      toast.success('Scrap recorded');
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Scrap failed');
    } finally {
      setBusy(false);
    }
  };

  const saveByproducts = async () => {
    const lines = bpLines.filter((l) => l.productId && n(l.quantity) > 0);
    if (!lines.length) return toast.error('Add by-product lines');
    setBusy(true);
    try {
      await productionOrderService.recordByproducts(id, { lines: lines.map((l) => ({ ...l, quantity: n(l.quantity) })) });
      toast.success('By-products received to inventory');
      await load();
    } catch (e: any) {
      toast.error(e.message || 'By-product failed');
    } finally {
      setBusy(false);
    }
  };

  const saveQc = async () => {
    if (!order?.productId) return;
    setBusy(true);
    try {
      await inspectionService.create({
        productionOrderId: id,
        productId: order.productId,
        inspectionType: qc.inspectionType,
        result: qc.result,
        notes: qc.notes,
        qualityParameters: qc.parameters.filter((p) => p.parameterName),
      });
      toast.success('Inspection saved');
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Inspection failed');
    } finally {
      setBusy(false);
    }
  };

  const reportOp = async (wo: any) => {
    const payload = report[wo.id] || {};
    setBusy(true);
    try {
      await workOrderService.report(wo.id, {
        goodQuantity: n(payload.goodQuantity),
        scrapQuantity: n(payload.scrapQuantity),
        rejectedQuantity: n(payload.rejectedQuantity),
        downtime: n(payload.downtime),
        notes: payload.notes,
      });
      toast.success('Operation reported');
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Report failed');
    } finally {
      setBusy(false);
    }
  };

  const actions = useMemo(() => {
    const list: { status: string; label: string; color: 'primary' | 'secondary' | 'danger' | 'ghost'; icon: any }[] = [];
    if (status === 'Draft' || status === 'Planned') {
      list.push({ status: 'release', label: 'Release', color: 'primary', icon: PlayCircle });
      list.push({ status: 'cancel', label: 'Cancel', color: 'danger', icon: XCircle });
    } else if (status === 'Released') {
      list.push({ status: 'start', label: 'Start production', color: 'primary', icon: PlayCircle });
      list.push({ status: 'cancel', label: 'Cancel', color: 'danger', icon: XCircle });
    } else if (status === 'In Progress' || status === 'InProgress') {
      list.push({ status: 'pause', label: 'Hold', color: 'secondary', icon: PauseCircle });
      if (remainingQty > 0) list.push({ status: 'close-short', label: 'Close Short', color: 'ghost', icon: Lock });
      list.push({ status: 'cancel', label: 'Cancel', color: 'danger', icon: XCircle });
    } else if (status === 'Paused') {
      list.push({ status: 'resume', label: 'Resume', color: 'secondary', icon: PlayCircle });
      if (remainingQty > 0) list.push({ status: 'close-short', label: 'Close Short', color: 'ghost', icon: Lock });
      list.push({ status: 'cancel', label: 'Cancel', color: 'danger', icon: XCircle });
    } else if (status === 'Partially Completed' || (status === 'Completed' && remainingQty > 0)) {
      list.push({ status: 'close-short', label: 'Close Short', color: 'ghost', icon: Lock });
    } else if (status === 'Completed') {
      list.push({ status: 'close', label: 'Close', color: 'ghost', icon: Lock });
    }
    return list;
  }, [status, remainingQty]);

  if (loading) return <MfgPage><MfgLoading /></MfgPage>;
  if (error || !order) return <MfgPage><MfgError message={error || 'Order not found'} /></MfgPage>;

  const planned = n(order.plannedQuantity);
  const produced = n(order.producedQuantity ?? order.goodQuantity);
  const remaining = n(order.remainingQuantity) || Math.max(0, planned - produced);
  const c = costing || {};
  const inspections = (order as any).qualityInspections || [];
  const scraps = (order as any).scraps || [];
  const byProducts = (order as any).byProducts || [];
  const timeline = [
    { label: 'Created', done: true },
    { label: 'Released', done: !['Draft', 'Planned'].includes(status) },
    { label: 'Materials reserved', done: materials.some((m) => n(m.reservedQty) > 0) || !['Draft', 'Planned'].includes(status) },
    { label: 'Materials issued', done: materials.some((m) => n(m.issuedQty) > 0) },
    { label: 'In production', done: ['In Progress', 'Paused', 'Partially Completed', 'Completed', 'Closed', 'Closed Short'].includes(status) },
    { label: 'Partially completed', done: status === 'Partially Completed' || status === 'Closed Short' || (status === 'Completed' && remaining > 0) },
    { label: 'Completed', done: (status === 'Completed' && remaining <= 0) || status === 'Closed' },
    { label: 'QC', done: inspections.some((i: any) => i.result && i.result !== 'Pending') },
    { label: 'FG received', done: produced > 0 || Boolean((order as any).inventoryPosted) },
    { label: 'Closed', done: status === 'Closed' || status === 'Closed Short' },
  ];

  return (
    <MfgPage>
      <MfgPageHeader
        title={order.orderNumber || 'Manufacturing Order'}
        subtitle={`${order.productName || (order as any).product?.name || 'Product'} · BOM ${(order as any).bom?.bomNumber || order.bomVersion || '—'} · ${status}`}
        backHref="/manufacturing/production/orders"
        icon={<ClipboardList className="w-5 h-5 text-white" />}
        actions={
          <>
            {actions.map((a) => {
              const Icon = a.icon;
              return (
                <MfgButton
                  key={a.status}
                  variant={a.color}
                  onClick={() => act(a.status)}
                  loading={busy}
                  className={a.status === 'close' || a.status === 'close-short' ? '!bg-white/15 !text-white hover:!bg-white/25 [&_svg]:text-white' : ''}
                >
                  <Icon className="w-4 h-4" /> {a.label}
                </MfgButton>
              );
            })}
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MfgStatCard label="Planned" value={planned} icon={Package} color={MFG_COLORS.primary} />
        <MfgStatCard label="Good qty" value={produced} icon={CheckCircle2} color={MFG_COLORS.success} />
        <MfgStatCard label="Rejected" value={n(order.rejectedQuantity)} icon={XCircle} color={MFG_COLORS.danger} />
        <MfgStatCard label="Scrap" value={n(order.scrapQuantity ?? order.scrappedQuantity)} icon={Package} color={MFG_COLORS.danger} />
        <MfgStatCard label="Remaining" value={remaining} icon={Package} color={MFG_COLORS.warning} />
        <MfgStatCard label="Unit cost" value={fmt(c.unitCost || c.unitProductionCost)} icon={Calculator} color={MFG_COLORS.purple} />
      </div>

      <div className="flex flex-wrap gap-2">
        {timeline.map((step) => (
          <span
            key={step.label}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${step.done ? 'bg-[#2ECC71]/15 text-[#1B8A4A]' : 'bg-[#F0F4F8] text-[#7A8FA6]'}`}
          >
            {step.label}
          </span>
        ))}
      </div>

      <MfgTabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'materials', label: 'Materials', count: materials.length },
          { id: 'operations', label: 'Operations', count: operations.length },
          { id: 'output', label: 'Output' },
          { id: 'quality', label: 'Quality', count: inspections.length },
          { id: 'scrap', label: 'Scrap / By-products' },
          { id: 'costing', label: 'Costing' },
          { id: 'history', label: 'History' },
        ]}
      />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MfgCard title="Header">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Product', order.productName || (order as any).product?.name],
                ['SKU', (order as any).product?.sku],
                ['BOM', (order as any).bom?.bomNumber || order.bomVersion],
                ['Routing', (order as any).routing?.routingNumber],
                ['Priority', order.priority],
                ['Demand', (order as any).demandType || order.demandType],
                ['Sales order', (order as any).salesOrderReference || order.salesOrderId],
                ['Batch', (order as any).batchNumber],
                ['Start', order.startDate ? new Date(order.startDate).toLocaleDateString('en-GB') : '—'],
                ['Due', order.dueDate ? new Date(order.dueDate).toLocaleDateString('en-GB') : '—'],
                ['Source WH', (order as any).sourceWarehouse?.name],
                ['FG WH', (order as any).finishedGoodsWarehouse?.name],
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <dt className="text-[10px] uppercase text-[#7A8FA6] font-bold">{k}</dt>
                  <dd className="font-semibold">{v || '—'}</dd>
                </div>
              ))}
            </dl>
            {order.notes && <p className="text-xs text-[#7A8FA6] mt-4">{order.notes}</p>}
          </MfgCard>
          <MfgCard title="Progress">
            <MfgTable columns={['Area', 'Status']}>
              <MfgTableRow><MfgTableCell>Materials issued</MfgTableCell><MfgTableCell>{materials.filter((m) => n(m.remainingQty) <= 0).length}/{materials.length}</MfgTableCell></MfgTableRow>
              <MfgTableRow><MfgTableCell>Operations done</MfgTableCell><MfgTableCell>{operations.filter((o) => o.status === 'Completed').length}/{operations.length}</MfgTableCell></MfgTableRow>
              <MfgTableRow><MfgTableCell>Inspections</MfgTableCell><MfgTableCell>{inspections.length}</MfgTableCell></MfgTableRow>
              <MfgTableRow><MfgTableCell>Created by</MfgTableCell><MfgTableCell>{(order as any).creator ? `${(order as any).creator.firstName || ''} ${(order as any).creator.lastName || ''}`.trim() : '—'}</MfgTableCell></MfgTableRow>
            </MfgTable>
          </MfgCard>
        </div>
      )}

      {tab === 'materials' && (
        <MfgCard
          title="Material requirements & issue"
          action={!locked && (
            <MfgButton onClick={issueNow} loading={busy} disabled={selectedIssueLines.length === 0}>
              <Save className="w-4 h-4" /> Issue selected lines
            </MfgButton>
          )}
        >
          {materials.length === 0 ? (
            <p className="text-xs text-[#7A8FA6] py-8 text-center">Release the order to explode BOM quantities (planned × BOM qty × scrap %).</p>
          ) : (
            <div className="overflow-x-auto">
              {stockError ? (
                <p className="text-xs text-[#B42318] bg-[#FEF3F2] border border-[#FECDCA] rounded-lg px-3 py-2 mb-3">{stockError}</p>
              ) : null}
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="text-[10px] uppercase text-[#7A8FA6] text-left">
                    <th className="w-10 px-2 py-2 border-b border-[#DDE4EE] align-middle">
                      <input
                        type="checkbox"
                        aria-label="Select all unissued materials"
                        className="w-4 h-4 rounded border-[#C6D2E3] text-[#014582] focus:ring-[#014582]/30 align-middle"
                        checked={allIssuableSelected}
                        disabled={locked || issuableIssueLines.length === 0}
                        ref={(el) => {
                          if (el) el.indeterminate = selectedIssueLines.length > 0 && !allIssuableSelected;
                        }}
                        onChange={toggleSelectAllIssueLines}
                      />
                    </th>
                    {['Item', 'Required', 'Reserved', 'Issued', 'Remaining', 'On hand', 'Issue now', 'Batch'].map((h) => (
                      <th key={h} className="px-2 py-2 border-b border-[#DDE4EE]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {issueLines.map((line, idx) => {
                    const issuable = maxIssuable(line) > 0;
                    const cap = maxIssuable(line);
                    return (
                      <tr key={line.reservationId || line.componentId || idx} className="border-b border-[#DDE4EE]/70">
                        <td className="w-10 px-2 py-2 align-middle">
                          <input
                            type="checkbox"
                            aria-label={`Select ${line.productName || 'material'}`}
                            className="w-4 h-4 rounded border-[#C6D2E3] text-[#014582] focus:ring-[#014582]/30 align-middle disabled:opacity-40"
                            checked={Boolean(line.selected) && issuable}
                            disabled={locked || !issuable}
                            onChange={(e) => setIssueLines((p) => p.map((x, i) => i === idx ? { ...x, selected: e.target.checked } : x))}
                          />
                        </td>
                        <td className="px-2 py-2 font-medium">{line.productName} {line.unit ? <span className="text-[#7A8FA6]">({line.unit})</span> : null}</td>
                        <td className="px-2 py-2">{fmt(line.requiredQty)}</td>
                        <td className="px-2 py-2">{fmt(materials[idx]?.reservedQty)}</td>
                        <td className="px-2 py-2">{fmt(line.issuedQty)}</td>
                        <td className="px-2 py-2">{fmt(line.remainingQty)}</td>
                        <td className="px-2 py-2">
                          {line.stockResolved === false || line.onHandQty == null
                            ? <span className="text-[#B42318]">—</span>
                            : fmt(line.onHandQty)}
                        </td>
                        <td className="px-2 py-2 w-28">
                          <MfgInput
                            type="number"
                            min={0}
                            max={cap}
                            value={line.issuedQuantity}
                            disabled={locked || !issuable}
                            onChange={(e) => setIssueLines((p) => p.map((x, i) => i === idx ? { ...x, issuedQuantity: Math.min(n(e.target.value), cap) } : x))}
                          />
                        </td>
                        <td className="px-2 py-2 w-32">
                          <MfgInput value={line.batchNumber} disabled={locked} onChange={(e) => setIssueLines((p) => p.map((x, i) => i === idx ? { ...x, batchNumber: e.target.value } : x))} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </MfgCard>
      )}

      {tab === 'operations' && (
        <MfgCard title="Shop-floor operations">
          {operations.length === 0 ? (
            <p className="text-xs text-[#7A8FA6] py-8 text-center">Attach a routing before release to create work orders automatically.</p>
          ) : (
            <div className="space-y-4">
              {operations.map((op, idx) => (
                <div key={op.id || idx} className="rounded-xl border border-[#DDE4EE] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <p className="text-sm font-bold">{op.sequence}. {op.operationName}</p>
                      <p className="text-xs text-[#7A8FA6]">{op.workCenterName || '—'} · Prev: {operations[idx - 1]?.operationName || '—'} · Next: {operations[idx + 1]?.operationName || '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <MfgStatusBadge status={op.status} />
                      {op.status === 'Pending' && <MfgButton onClick={() => workOrderService.start(op.id).then(load)} loading={busy}>Start</MfgButton>}
                      {op.status === 'In Progress' && <MfgButton variant="secondary" onClick={() => workOrderService.pause(op.id).then(load)}>Pause</MfgButton>}
                      {op.status === 'Paused' && <MfgButton variant="secondary" onClick={() => workOrderService.resume(op.id).then(load)}>Resume</MfgButton>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <MfgField label="Good qty"><MfgInput type="number" value={report[op.id]?.goodQuantity ?? op.completedQuantity ?? ''} onChange={(e) => setReport((p) => ({ ...p, [op.id]: { ...p[op.id], goodQuantity: e.target.value } }))} /></MfgField>
                    <MfgField label="Scrap"><MfgInput type="number" value={report[op.id]?.scrapQuantity ?? op.scrapQuantity ?? ''} onChange={(e) => setReport((p) => ({ ...p, [op.id]: { ...p[op.id], scrapQuantity: e.target.value } }))} /></MfgField>
                    <MfgField label="Rejected"><MfgInput type="number" value={report[op.id]?.rejectedQuantity ?? op.rejectedQuantity ?? ''} onChange={(e) => setReport((p) => ({ ...p, [op.id]: { ...p[op.id], rejectedQuantity: e.target.value } }))} /></MfgField>
                    <MfgField label="Downtime min"><MfgInput type="number" value={report[op.id]?.downtime ?? op.downtime ?? ''} onChange={(e) => setReport((p) => ({ ...p, [op.id]: { ...p[op.id], downtime: e.target.value } }))} /></MfgField>
                    <div className="flex items-end"><MfgButton onClick={() => reportOp(op)} loading={busy}>Report</MfgButton></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </MfgCard>
      )}

      {tab === 'output' && (
        <MfgCard title="Production output / finished goods receipt">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MfgField label="Good quantity">
              <MfgInput type="number" min={0} max={receiptCap} value={output.goodQuantity} onChange={(e) => setOutput((p) => ({ ...p, goodQuantity: e.target.value }))} />
              {remaining > 0 ? <p className="text-[11px] text-[#7A8FA6] mt-1">This receipt. Remaining on order: {fmt(remaining)}</p> : !((order as any).inventoryPosted) && receiptCap > 0 ? <p className="text-[11px] text-[#7A8FA6] mt-1">Receive {fmt(receiptCap)} finished goods to the selected warehouse.</p> : null}
            </MfgField>
            <MfgField label="Rejected"><MfgInput type="number" value={output.rejectedQuantity} onChange={(e) => setOutput((p) => ({ ...p, rejectedQuantity: e.target.value }))} /></MfgField>
            <MfgField label="Scrap"><MfgInput type="number" value={output.scrapQuantity} onChange={(e) => setOutput((p) => ({ ...p, scrapQuantity: e.target.value }))} /></MfgField>
            <MfgField label="Rework"><MfgInput type="number" value={output.reworkQuantity} onChange={(e) => setOutput((p) => ({ ...p, reworkQuantity: e.target.value }))} /></MfgField>
            <MfgField label="Production batch"><MfgInput value={output.batchNumber} onChange={(e) => setOutput((p) => ({ ...p, batchNumber: e.target.value }))} /></MfgField>
            <MfgField label="Finished goods warehouse">
              <MfgRelationPicker
                kind="warehouse"
                multiple={false}
                selected={fgWh}
                onChange={(items) => { setFgWh(items); setOutput((p) => ({ ...p, warehouseId: items[0]?.id || '' })); }}
              />
            </MfgField>
          </div>
          {canReceiveFg && (
            <div className="mt-4 flex justify-end">
              <MfgButton onClick={completeNow} loading={busy}><CheckCircle2 className="w-4 h-4" /> Complete & receive FG</MfgButton>
            </div>
          )}
        </MfgCard>
      )}

      {tab === 'quality' && (
        <MfgCard title="Quality inspection">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <MfgField label="Type">
              <MfgSelect value={qc.inspectionType} onChange={(e) => setQc((p) => ({ ...p, inspectionType: e.target.value }))}>
                {['Incoming', 'InProcess', 'Final'].map((v) => <option key={v}>{v}</option>)}
              </MfgSelect>
            </MfgField>
            <MfgField label="Result">
              <MfgSelect value={qc.result} onChange={(e) => setQc((p) => ({ ...p, result: e.target.value }))}>
                {['Pending', 'Passed', 'Failed', 'Rework', 'Scrap'].map((v) => <option key={v}>{v}</option>)}
              </MfgSelect>
            </MfgField>
            <MfgField label="Remarks"><MfgInput value={qc.notes} onChange={(e) => setQc((p) => ({ ...p, notes: e.target.value }))} /></MfgField>
          </div>
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-[10px] uppercase text-[#7A8FA6] text-left">
                {['Parameter', 'Standard', 'Actual', 'Tolerance', 'UoM'].map((h) => <th key={h} className="px-2 py-2 border-b border-[#DDE4EE]">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {qc.parameters.map((p, idx) => (
                <tr key={idx}>
                  {(['parameterName', 'expectedValue', 'actualValue', 'tolerance', 'unitOfMeasure'] as const).map((k) => (
                    <td key={k} className="px-2 py-1"><MfgInput value={(p as any)[k]} onChange={(e) => setQc((prev) => ({ ...prev, parameters: prev.parameters.map((x, i) => i === idx ? { ...x, [k]: e.target.value } : x) }))} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-2">
            <MfgButton variant="secondary" onClick={() => setQc((p) => ({ ...p, parameters: [...p.parameters, { parameterName: '', expectedValue: '', actualValue: '', tolerance: '', unitOfMeasure: '' }] }))}><Plus className="w-4 h-4" /> Parameter</MfgButton>
            <MfgButton onClick={saveQc} loading={busy}>Save inspection</MfgButton>
          </div>
          {inspections.length > 0 && (
            <div className="mt-6">
              <MfgTable columns={['Inspection', 'Type', 'Result', 'Date']}>
                {inspections.map((i: any) => (
                  <MfgTableRow key={i.id}>
                    <MfgTableCell>{i.inspectionNumber}</MfgTableCell>
                    <MfgTableCell>{i.inspectionType}</MfgTableCell>
                    <MfgTableCell><MfgStatusBadge status={i.result} /></MfgTableCell>
                    <MfgTableCell>{i.inspectionDate ? new Date(i.inspectionDate).toLocaleString() : '—'}</MfgTableCell>
                  </MfgTableRow>
                ))}
              </MfgTable>
            </div>
          )}
        </MfgCard>
      )}

      {tab === 'scrap' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MfgCard title="Scrap / wastage" action={!locked && <MfgButton onClick={saveScrap} loading={busy}>Save scrap</MfgButton>}>
            {scrapLines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-2 mb-3">
                <div className="col-span-2">
                  <ProductPicker
                    multiple={false}
                    selected={line.productId ? [{ id: line.productId, name: line.productName }] : []}
                    onChange={(items: PickedProduct[]) => setScrapLines((p) => p.map((x, i) => i === idx ? { ...x, productId: items[0]?.id || '', productName: items[0]?.name || '' } : x))}
                  />
                </div>
                <MfgInput type="number" placeholder="Qty" value={line.quantity} onChange={(e) => setScrapLines((p) => p.map((x, i) => i === idx ? { ...x, quantity: e.target.value } : x))} />
                <MfgInput placeholder="Reason" value={line.reason} onChange={(e) => setScrapLines((p) => p.map((x, i) => i === idx ? { ...x, reason: e.target.value } : x))} />
                <label className="flex items-center gap-2 text-xs font-medium"><input type="checkbox" checked={line.recoverable} onChange={(e) => setScrapLines((p) => p.map((x, i) => i === idx ? { ...x, recoverable: e.target.checked } : x))} /> Recoverable</label>
              </div>
            ))}
            <MfgButton variant="secondary" onClick={() => setScrapLines((p) => [...p, { productId: '', productName: '', quantity: '', reason: '', recoverable: false, cost: '' }])}><Plus className="w-4 h-4" /> Line</MfgButton>
            {scraps.length > 0 && (
              <MfgTable columns={['Item', 'Qty', 'Reason']}>
                {scraps.map((s: any) => (
                  <MfgTableRow key={s.id}><MfgTableCell>{s.productName || s.materialName}</MfgTableCell><MfgTableCell>{s.quantity}</MfgTableCell><MfgTableCell>{s.reason || '—'}</MfgTableCell></MfgTableRow>
                ))}
              </MfgTable>
            )}
          </MfgCard>
          <MfgCard title="By-products / co-products" action={!locked && <MfgButton onClick={saveByproducts} loading={busy}>Receive</MfgButton>}>
            {bpLines.map((line, idx) => (
              <div key={idx} className="space-y-2 mb-3">
                <ProductPicker
                  multiple={false}
                  selected={line.productId ? [{ id: line.productId, name: line.productName }] : []}
                  onChange={(items: PickedProduct[]) => setBpLines((p) => p.map((x, i) => i === idx ? { ...x, productId: items[0]?.id || '', productName: items[0]?.name || '' } : x))}
                />
                <div className="grid grid-cols-2 gap-2">
                  <MfgInput type="number" placeholder="Qty" value={line.quantity} onChange={(e) => setBpLines((p) => p.map((x, i) => i === idx ? { ...x, quantity: e.target.value } : x))} />
                  <MfgInput placeholder="Batch" value={line.batchNumber} onChange={(e) => setBpLines((p) => p.map((x, i) => i === idx ? { ...x, batchNumber: e.target.value } : x))} />
                </div>
              </div>
            ))}
            <MfgButton variant="secondary" onClick={() => setBpLines((p) => [...p, { productId: '', productName: '', quantity: '', warehouseId: '', batchNumber: '' }])}><Plus className="w-4 h-4" /> Line</MfgButton>
            {byProducts.length > 0 && (
              <MfgTable columns={['Item', 'Qty', 'Batch']}>
                {byProducts.map((s: any) => (
                  <MfgTableRow key={s.id}><MfgTableCell>{s.productName}</MfgTableCell><MfgTableCell>{s.quantity}</MfgTableCell><MfgTableCell>{s.batchNumber || '—'}</MfgTableCell></MfgTableRow>
                ))}
              </MfgTable>
            )}
          </MfgCard>
        </div>
      )}

      {tab === 'costing' && (
        <MfgCard title="Planned vs actual cost">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ['Material', c.materialCost],
              ['Labor', c.laborCost],
              ['Machine', c.machineCost],
              ['Overhead', c.overhead],
              ['Additional / scrap', c.additionalCost],
              ['Total', c.totalCost],
              ['Unit cost', c.unitCost || c.unitProductionCost],
              ['Variance', c.variance],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl bg-[#F4F7FB] p-4">
                <p className="text-[10px] font-bold uppercase text-[#7A8FA6]">{label}</p>
                <p className="text-2xl font-extrabold mt-1">{fmt(value)}</p>
              </div>
            ))}
          </div>
        </MfgCard>
      )}

      {tab === 'history' && (
        <MfgCard title="Audit / status history">
          {history.length === 0 ? (
            <p className="text-xs text-[#7A8FA6]">Status changes, issues and completions are recorded as the order moves.</p>
          ) : (
            <MfgTable columns={['When', 'From', 'To', 'Reason']}>
              {history.map((h) => (
                <MfgTableRow key={h.id}>
                  <MfgTableCell>{h.createdAt ? new Date(h.createdAt).toLocaleString() : '—'}</MfgTableCell>
                  <MfgTableCell>{h.fromStatus || '—'}</MfgTableCell>
                  <MfgTableCell>{h.toStatus}</MfgTableCell>
                  <MfgTableCell>{h.reason || '—'}</MfgTableCell>
                </MfgTableRow>
              ))}
            </MfgTable>
          )}
        </MfgCard>
      )}
    </MfgPage>
  );
}
