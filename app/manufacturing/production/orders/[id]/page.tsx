'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ClipboardList,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  XCircle,
  Lock,
  Layers,
  Cog,
  Package,
  Calculator,
} from 'lucide-react';
import {
  productionOrderService,
  type ProductionOrder,
  type MaterialLine,
} from '@/lib/manufacturing-service';
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
  MFG_COLORS,
} from '../../../ui';

const ACTIONS = [
  { status: 'release', label: 'Release', color: 'primary', icon: PlayCircle },
  { status: 'pause', label: 'Pause', color: 'secondary', icon: PauseCircle },
  { status: 'resume', label: 'Resume', color: 'secondary', icon: PlayCircle },
  { status: 'complete', label: 'Complete', color: 'primary', icon: CheckCircle2 },
  { status: 'close', label: 'Close', color: 'ghost', icon: Lock },
  { status: 'cancel', label: 'Cancel', color: 'danger', icon: XCircle },
] as const;

export default function ProductionOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = String(params?.id || '');
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [materials, setMaterials] = useState<MaterialLine[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [costing, setCosting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [o, m, op, c] = await Promise.all([
        productionOrderService.get(id),
        productionOrderService.materials(id).catch(() => []),
        productionOrderService.operations(id).catch(() => []),
        productionOrderService.costing(id).catch(() => null),
      ]);
      setOrder(o);
      setMaterials(m);
      setOperations(op);
      setCosting(c);
    } catch (e: any) {
      setError(e.message || 'Failed to load production order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const act = async (status: string) => {
    setBusy(true);
    try {
      const reason = status === 'cancel' || status === 'pause' ? (window.prompt(`Reason for ${status}?`) || undefined) : undefined;
      if (status === 'release') await productionOrderService.release(id);
      else if (status === 'pause') await productionOrderService.pause(id, reason);
      else if (status === 'resume') await productionOrderService.resume(id);
      else if (status === 'complete') await productionOrderService.complete(id);
      else if (status === 'close') await productionOrderService.close(id);
      else if (status === 'cancel') await productionOrderService.cancel(id, reason);
      toast.success(`Order ${status}d`);
      load();
    } catch (e: any) {
      toast.error(e.message || `Failed to ${status}`);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <MfgPage><MfgLoading /></MfgPage>;
  if (error || !order) return <MfgPage><MfgError message={error || 'Order not found'} /></MfgPage>;

  const n = (v: any) => Number(v || 0);
  const planned = n(order.plannedQuantity);
  const produced = n(order.producedQuantity ?? order.goodQuantity);
  const remaining = n(order.remainingQuantity) || Math.max(0, planned - produced);
  const c = costing || {};
  const costItems = [
    ['Material Cost', n(c.materialCost), MFG_COLORS.primary],
    ['Labor Cost', n(c.laborCost), MFG_COLORS.accent],
    ['Machine Cost', n(c.machineCost), MFG_COLORS.purple],
    ['Overhead', n(c.overhead), MFG_COLORS.warning],
    ['Total Cost', n(c.totalCost ?? (n(c.materialCost) + n(c.laborCost) + n(c.machineCost) + n(c.overhead))), MFG_COLORS.success],
  ];

  return (
    <MfgPage>
      <MfgPageHeader
        title={order.orderNumber || 'Production Order'}
        subtitle={`${order.productName || order.product?.name || 'Product'} · ${order.status || 'Draft'}`}
        backHref="/manufacturing/production/orders"
        icon={<ClipboardList className="w-5 h-5 text-white" />}
        actions={
          <>
            {ACTIONS.filter((a) => {
              if (order.status === 'Completed' || order.status === 'Closed' || order.status === 'Cancelled') return false;
              if (order.status === 'Draft' || order.status === 'Planned') return a.status === 'release' || a.status === 'cancel';
              if (order.status === 'Released') return a.status === 'cancel';
              if (order.status === 'In Progress' || order.status === 'InProgress') return a.status === 'pause' || a.status === 'complete' || a.status === 'cancel';
              if (order.status === 'Paused') return a.status === 'resume' || a.status === 'cancel';
              return false;
            }).map((a) => {
              const Icon = a.icon;
              return (
                <MfgButton
                  key={a.status}
                  variant={a.color}
                  onClick={() => act(a.status)}
                  loading={busy}
                >
                  <Icon className="w-4 h-4" /> {a.label}
                </MfgButton>
              );
            })}
          </>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <MfgStatCard label="Planned" value={planned} icon={Package} color={MFG_COLORS.primary} />
        <MfgStatCard label="Good Quantity" value={n(order.goodQuantity)} icon={Package} color={MFG_COLORS.success} />
        <MfgStatCard label="Scrap" value={n(order.scrapQuantity ?? order.scrappedQuantity)} icon={Cog} color={MFG_COLORS.danger} />
        <MfgStatCard label="Rework" value={n(order.reworkQuantity)} icon={Cog} color={MFG_COLORS.warning} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Materials */}
        <MfgCard title="Materials">
          {materials.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#7A8FA6]">
              No material lines. Release the order to compute requirements from the BOM.
            </p>
          ) : (
            <MfgTable columns={['Material', 'Required', 'Reserved', 'Issued', 'Remaining']}>
              {materials.map((m, i) => (
                <MfgTableRow key={m.productId || i}>
                  <MfgTableCell className="font-medium">{m.productName || 'Material'}</MfgTableCell>
                  <MfgTableCell>{n(m.requiredQty)}</MfgTableCell>
                  <MfgTableCell>{n(m.reservedQty)}</MfgTableCell>
                  <MfgTableCell>{n(m.issuedQty ?? m.consumedQty)}</MfgTableCell>
                  <MfgTableCell>{n(m.remainingQty) || Math.max(0, n(m.requiredQty) - n(m.issuedQty ?? m.consumedQty))}</MfgTableCell>
                </MfgTableRow>
              ))}
            </MfgTable>
          )}
        </MfgCard>

        {/* Operations */}
        <MfgCard title="Operations">
          {operations.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#7A8FA6]">No operations defined (attach a routing).</p>
          ) : (
            <MfgTable columns={['Seq', 'Operation', 'Work Center', 'Status']}>
              {operations.map((op, i) => (
                <MfgTableRow key={op.id || i}>
                  <MfgTableCell>{op.sequence ?? i + 1}</MfgTableCell>
                  <MfgTableCell className="font-medium">{op.name || op.operationName || 'Operation'}</MfgTableCell>
                  <MfgTableCell>{op.workCenterName || op.workCenter?.name || '—'}</MfgTableCell>
                  <MfgTableCell><MfgStatusBadge status={op.status || 'Pending'} /></MfgTableCell>
                </MfgTableRow>
              ))}
            </MfgTable>
          )}
        </MfgCard>
      </div>

      {/* Production + Cost */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MfgCard title="Production">
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Planned', planned],
              ['Produced', produced],
              ['Scrap', n(order.scrappedQuantity)],
              ['Rework', n(order.reworkQuantity)],
              ['Rejected', n(order.rejectedQuantity)],
              ['Remaining', remaining],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl bg-[#F4F7FB] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A8FA6]">{label}</p>
                <p className="text-2xl font-extrabold text-[#1A1A2E] mt-1">{value}</p>
              </div>
            ))}
          </div>
        </MfgCard>

        <MfgCard title="Manufacturing Cost">
          <div className="space-y-3">
            {costItems.map(([label, value, color]) => (
              <div key={String(label)} className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#1A1A2E]">{label}</span>
                <span className="text-sm font-extrabold" style={{ color: String(color) }}>{Number(value).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#7A8FA6] mt-4">
            Cost is computed by the backend integrating with the Accounting module.
          </p>
        </MfgCard>
      </div>
    </MfgPage>
  );
}