'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { routingService } from '@/lib/manufacturing-service';
import { ProductPicker, type PickedProduct } from './ProductPicker';
import { MfgRelationPicker, type PickedRelation } from './MfgRelationPicker';
import {
  MfgPage,
  MfgPageHeader,
  MfgCard,
  MfgButton,
  MfgField,
  MfgInput,
  MfgSelect,
  MfgTextarea,
} from '../ui';

type OpLine = {
  operationName: string;
  workCenterId: string;
  workCenterName?: string;
  machineId: string;
  machineName?: string;
  setupTime: number;
  runTime: number;
  queueTime: number;
  laborRequirement: number;
  inspectionRequired: boolean;
  estimatedCost: number;
  description: string;
  notes: string;
};

function emptyOp(): OpLine {
  return {
    operationName: '',
    workCenterId: '',
    machineId: '',
    setupTime: 0,
    runTime: 0,
    queueTime: 0,
    laborRequirement: 1,
    inspectionRequired: false,
    estimatedCost: 0,
    description: '',
    notes: '',
  };
}

export function MfgRoutingEditor({ initial }: { initial?: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<PickedProduct[]>(
    initial?.productId ? [{ id: initial.productId, name: initial.productName || initial.product?.name || '', sku: initial.product?.sku }] : []
  );
  const [form, setForm] = useState({
    description: initial?.description || '',
    version: initial?.version || '1.0',
    status: initial?.status || 'Draft',
    notes: initial?.notes || '',
  });
  const [ops, setOps] = useState<OpLine[]>(() => {
    const list = initial?.operations || [];
    if (!list.length) return [emptyOp()];
    return [...list]
      .sort((a: any, b: any) => Number(a.sequence || 0) - Number(b.sequence || 0))
      .map((op: any) => ({
        operationName: op.operationName || op.name || '',
        workCenterId: op.workCenterId || '',
        workCenterName: op.workCenter?.name || op.workCenterName,
        machineId: op.machineId || '',
        machineName: op.machine?.name || op.machineName,
        setupTime: Number(op.setupTime || 0),
        runTime: Number(op.runTime || 0),
        queueTime: Number(op.queueTime || 0),
        laborRequirement: Number(op.laborRequirement || 1),
        inspectionRequired: Boolean(op.inspectionRequired),
        estimatedCost: Number(op.estimatedCost || 0),
        description: op.description || '',
        notes: op.notes || '',
      }));
  });

  const setOp = (idx: number, patch: Partial<OpLine>) => {
    setOps((prev) => prev.map((op, i) => (i === idx ? { ...op, ...patch } : op)));
  };
  const move = (idx: number, dir: -1 | 1) => {
    setOps((prev) => {
      const next = [...prev];
      const dest = idx + dir;
      if (dest < 0 || dest >= next.length) return prev;
      [next[idx], next[dest]] = [next[dest], next[idx]];
      return next;
    });
  };

  const totalTime = ops.reduce((s, o) => s + Number(o.setupTime) + Number(o.runTime) + Number(o.queueTime), 0);
  const totalCost = ops.reduce((s, o) => s + Number(o.estimatedCost || 0), 0);

  const save = async () => {
    if (!product[0]?.id) return toast.error('Select a product');
    const operations = ops.filter((o) => o.operationName.trim());
    if (!operations.length) return toast.error('Add at least one operation');
    if (operations.some((o) => !o.workCenterId)) return toast.error('Each operation needs a work center');
    setSaving(true);
    try {
      const payload = {
        productId: product[0].id,
        description: form.description || operations.map((o) => o.operationName).join(' → '),
        version: form.version,
        status: form.status,
        notes: form.notes,
        operations: operations.map((o, i) => ({
          operationName: o.operationName,
          sequence: i + 1,
          workCenterId: o.workCenterId,
          machineId: o.machineId || undefined,
          setupTime: Number(o.setupTime || 0),
          runTime: Number(o.runTime || 0),
          queueTime: Number(o.queueTime || 0),
          laborRequirement: Number(o.laborRequirement || 1),
          inspectionRequired: o.inspectionRequired,
          estimatedCost: Number(o.estimatedCost || 0),
          description: o.description,
          notes: o.notes,
        })),
      };
      const saved = initial?.id
        ? await routingService.update(initial.id, payload)
        : await routingService.create(payload);
      toast.success(initial?.id ? 'Routing updated' : 'Routing created');
      router.push(`/manufacturing/master/routings/${saved.id || initial.id}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save routing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MfgPage>
      <MfgPageHeader
        title={initial?.id ? initial.routingNumber || 'Edit Routing' : 'New Routing'}
        subtitle="Multiple operations in sequence — setup, run, queue, labor and quality checkpoints"
        backHref="/manufacturing/master/routings"
        actions={
          <MfgButton onClick={save} loading={saving}>
            <Save className="w-4 h-4" /> Save routing
          </MfgButton>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MfgCard title="Routing header" className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MfgField label="Product">
              <ProductPicker multiple={false} selected={product} onChange={setProduct} />
            </MfgField>
            <MfgField label="Description">
              <MfgInput value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Cutting → Welding → Paint" />
            </MfgField>
            <MfgField label="Version">
              <MfgInput value={form.version} onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))} />
            </MfgField>
            <MfgField label="Status">
              <MfgSelect value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                {['Draft', 'Active', 'Obsolete'].map((v) => <option key={v}>{v}</option>)}
              </MfgSelect>
            </MfgField>
            <div className="md:col-span-2">
              <MfgField label="Notes">
                <MfgTextarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
              </MfgField>
            </div>
          </div>
        </MfgCard>
        <MfgCard title="Estimated totals">
          <p className="text-3xl font-extrabold text-[#014582]">{totalTime} min</p>
          <p className="text-xs text-[#7A8FA6] mt-1">Setup + run + queue</p>
          <p className="text-xl font-bold mt-4">{totalCost.toLocaleString()}</p>
          <p className="text-xs text-[#7A8FA6]">Estimated operation cost</p>
        </MfgCard>
      </div>

      <MfgCard
        title="Operations"
        action={
          <MfgButton variant="secondary" onClick={() => setOps((p) => [...p, emptyOp()])}>
            <Plus className="w-4 h-4" /> Add operation
          </MfgButton>
        }
      >
        <div className="space-y-4">
          {ops.map((op, idx) => (
            <div key={idx} className="rounded-xl border border-[#DDE4EE] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-[#014582]">Step {idx + 1}</p>
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(idx, -1)} className="p-1 text-[#7A8FA6]"><ArrowUp className="w-4 h-4" /></button>
                  <button type="button" onClick={() => move(idx, 1)} className="p-1 text-[#7A8FA6]"><ArrowDown className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setOps((p) => p.filter((_, i) => i !== idx))} className="p-1 text-[#E74C3C]"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <MfgField label="Operation">
                  <MfgInput value={op.operationName} onChange={(e) => setOp(idx, { operationName: e.target.value })} placeholder="Cutting" />
                </MfgField>
                <MfgField label="Work center">
                  <MfgRelationPicker
                    kind="workCenter"
                    multiple={false}
                    selected={op.workCenterId ? [{ id: op.workCenterId, name: op.workCenterName || op.workCenterId }] : []}
                    onChange={(items: PickedRelation[]) => setOp(idx, { workCenterId: items[0]?.id || '', workCenterName: items[0]?.name })}
                  />
                </MfgField>
                <MfgField label="Machine">
                  <MfgRelationPicker
                    kind="machine"
                    multiple={false}
                    selected={op.machineId ? [{ id: op.machineId, name: op.machineName || op.machineId }] : []}
                    onChange={(items: PickedRelation[]) => setOp(idx, { machineId: items[0]?.id || '', machineName: items[0]?.name })}
                  />
                </MfgField>
                <MfgField label="Setup (min)"><MfgInput type="number" min={0} value={op.setupTime} onChange={(e) => setOp(idx, { setupTime: Number(e.target.value) })} /></MfgField>
                <MfgField label="Run / unit (min)"><MfgInput type="number" min={0} value={op.runTime} onChange={(e) => setOp(idx, { runTime: Number(e.target.value) })} /></MfgField>
                <MfgField label="Queue (min)"><MfgInput type="number" min={0} value={op.queueTime} onChange={(e) => setOp(idx, { queueTime: Number(e.target.value) })} /></MfgField>
                <MfgField label="Workers"><MfgInput type="number" min={0} value={op.laborRequirement} onChange={(e) => setOp(idx, { laborRequirement: Number(e.target.value) })} /></MfgField>
                <MfgField label="Estimated cost"><MfgInput type="number" min={0} value={op.estimatedCost} onChange={(e) => setOp(idx, { estimatedCost: Number(e.target.value) })} /></MfgField>
                <label className="flex items-center gap-2 text-sm font-medium text-[#1A1A2E] mt-6">
                  <input type="checkbox" checked={op.inspectionRequired} onChange={(e) => setOp(idx, { inspectionRequired: e.target.checked })} />
                  Quality checkpoint
                </label>
                <div className="md:col-span-3">
                  <MfgField label="Instructions">
                    <MfgInput value={op.description} onChange={(e) => setOp(idx, { description: e.target.value })} placeholder="Work instructions, tools, drawings…" />
                  </MfgField>
                </div>
              </div>
            </div>
          ))}
        </div>
      </MfgCard>
    </MfgPage>
  );
}

export default MfgRoutingEditor;
