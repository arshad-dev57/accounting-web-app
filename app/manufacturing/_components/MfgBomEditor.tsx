'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useLocation } from '@/lib/location-context';
import { bomService } from '@/lib/manufacturing-service';
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

type BomLine = {
  componentId: string;
  componentName: string;
  sku?: string;
  quantity: number;
  unitOfMeasure: string;
  scrapPercentage: number;
  substituteMaterial: string;
  operationSequence: string;
  estimatedCost: number;
  notes: string;
};

function emptyLine(): BomLine {
  return {
    componentId: '',
    componentName: '',
    quantity: 1,
    unitOfMeasure: 'pcs',
    scrapPercentage: 0,
    substituteMaterial: '',
    operationSequence: '',
    estimatedCost: 0,
    notes: '',
  };
}

export function MfgBomEditor({ initial }: { initial?: any }) {
  const router = useRouter();
  const { locationIdForApi } = useLocation();
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<PickedProduct[]>(
    initial?.productId ? [{ id: initial.productId, name: initial.productName || initial.product?.name || '', sku: initial.product?.sku }] : []
  );
  const [form, setForm] = useState({
    version: initial?.version || '1.0',
    status: initial?.status || 'Draft',
    effectiveFrom: initial?.effectiveFrom ? String(initial.effectiveFrom).slice(0, 10) : new Date().toISOString().slice(0, 10),
    effectiveTo: initial?.effectiveTo ? String(initial.effectiveTo).slice(0, 10) : '',
    notes: initial?.notes || '',
  });
  const [lines, setLines] = useState<BomLine[]>(() => {
    const comps = initial?.components || [];
    if (!comps.length) return [emptyLine()];
    return comps.map((c: any) => ({
      componentId: c.componentId || c.productId || '',
      componentName: c.componentName || c.productName || c.name || '',
      sku: c.sku,
      quantity: Number(c.quantity || 1),
      unitOfMeasure: c.unitOfMeasure || c.unit || 'pcs',
      scrapPercentage: Number(c.scrapPercentage ?? c.scrapPct ?? 0),
      substituteMaterial: c.substituteMaterial || c.substituteName || '',
      operationSequence: c.operationSequence != null ? String(c.operationSequence) : '',
      estimatedCost: Number(c.estimatedCost || 0),
      notes: c.notes || '',
    }));
  });

  const setLine = (idx: number, patch: Partial<BomLine>) => {
    setLines((prev) => prev.map((line, i) => (i === idx ? { ...line, ...patch } : line)));
  };

  const materialCost = lines.reduce((s, l) => s + Number(l.estimatedCost || 0), 0);
  const scrapCost = lines.reduce(
    (s, l) => s + Number(l.estimatedCost || 0) * (Number(l.scrapPercentage || 0) / 100),
    0
  );

  const save = async () => {
    if (!product[0]?.id) return toast.error('Select the finished product');
    const components = lines.filter((l) => l.componentId && Number(l.quantity) > 0);
    if (!components.length) return toast.error('Add at least one component');
    setSaving(true);
    try {
      const payload = {
        productId: product[0].id,
        locationId: locationIdForApi || initial?.locationId || undefined,
        version: form.version,
        status: form.status,
        effectiveFrom: form.effectiveFrom || undefined,
        effectiveTo: form.effectiveTo || undefined,
        notes: form.notes,
        totalEstimatedCost: materialCost + scrapCost,
        components: components.map((l, i) => ({
          componentId: l.componentId,
          quantity: Number(l.quantity),
          unitOfMeasure: l.unitOfMeasure,
          scrapPercentage: Number(l.scrapPercentage || 0),
          substituteMaterial: l.substituteMaterial || undefined,
          operationSequence: l.operationSequence ? Number(l.operationSequence) : undefined,
          estimatedCost: Number(l.estimatedCost || 0),
          notes: l.notes || undefined,
          sequence: i + 1,
        })),
      };
      const saved = initial?.id
        ? await bomService.update(initial.id, payload)
        : await bomService.create(payload);
      toast.success(initial?.id ? 'BOM updated' : 'BOM created');
      router.push(`/manufacturing/master/bom/${saved.id || initial?.id}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save BOM');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MfgPage>
      <MfgPageHeader
        title={initial?.id ? initial.bomNumber || 'Edit BOM' : 'New Bill of Materials'}
        subtitle="Header, components, scrap, substitutes and estimated material cost in one document"
        backHref="/manufacturing/master/bom"
        icon={undefined}
        actions={
          <MfgButton onClick={save} loading={saving}>
            <Save className="w-4 h-4" /> Save BOM
          </MfgButton>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MfgCard title="General" className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MfgField label="Finished Product">
              <ProductPicker
                multiple={false}
                selected={product}
                onChange={setProduct}
                placeholder="Select finished product…"
              />
            </MfgField>
            <MfgField label="Version / Revision">
              <MfgInput value={form.version} onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))} />
            </MfgField>
            <MfgField label="Status">
              <MfgSelect value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                {['Draft', 'Active', 'Obsolete'].map((v) => <option key={v}>{v}</option>)}
              </MfgSelect>
            </MfgField>
            <MfgField label="Effective From">
              <MfgInput type="date" value={form.effectiveFrom} onChange={(e) => setForm((p) => ({ ...p, effectiveFrom: e.target.value }))} />
            </MfgField>
            <MfgField label="Effective To">
              <MfgInput type="date" value={form.effectiveTo} onChange={(e) => setForm((p) => ({ ...p, effectiveTo: e.target.value }))} />
            </MfgField>
            <div className="md:col-span-2">
              <MfgField label="Notes">
                <MfgTextarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
              </MfgField>
            </div>
          </div>
        </MfgCard>
        <MfgCard title="BOM Costing">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-[#7A8FA6]">Material</dt><dd className="font-bold">{materialCost.toLocaleString()}</dd></div>
            <div className="flex justify-between"><dt className="text-[#7A8FA6]">Expected scrap</dt><dd className="font-bold">{scrapCost.toLocaleString()}</dd></div>
            <div className="flex justify-between border-t border-[#DDE4EE] pt-3"><dt className="font-semibold">Estimated cost</dt><dd className="font-extrabold text-[#014582]">{(materialCost + scrapCost).toLocaleString()}</dd></div>
          </dl>
          <p className="text-[11px] text-[#7A8FA6] mt-3">Cost uses component estimated cost × quantity, plus scrap %.</p>
        </MfgCard>
      </div>

      <MfgCard
        title="Components"
        action={
          <MfgButton variant="secondary" onClick={() => setLines((p) => [...p, emptyLine()])}>
            <Plus className="w-4 h-4" /> Add component
          </MfgButton>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[980px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-[#7A8FA6]">
                {['Item', 'Qty', 'UoM', 'Scrap %', 'Est. cost', 'Substitute', 'Op seq', ''].map((h) => (
                  <th key={h} className="px-2 py-2 border-b border-[#DDE4EE]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={`${line.componentId}-${idx}`} className="border-b border-[#DDE4EE]/70">
                  <td className="px-2 py-2 min-w-[240px]">
                    <ProductPicker
                      multiple={false}
                      selected={line.componentId ? [{ id: line.componentId, name: line.componentName, sku: line.sku }] : []}
                      placeholder="Component…"
                      onChange={(items) => setLine(idx, {
                        componentId: items[0]?.id || '',
                        componentName: items[0]?.name || '',
                        sku: items[0]?.sku,
                      })}
                    />
                  </td>
                  <td className="px-2 py-2 w-24">
                    <MfgInput type="number" min={0} step="any" value={line.quantity} onChange={(e) => setLine(idx, { quantity: Number(e.target.value) })} />
                  </td>
                  <td className="px-2 py-2 w-24">
                    <MfgInput value={line.unitOfMeasure} onChange={(e) => setLine(idx, { unitOfMeasure: e.target.value })} />
                  </td>
                  <td className="px-2 py-2 w-24">
                    <MfgInput type="number" min={0} step="any" value={line.scrapPercentage} onChange={(e) => setLine(idx, { scrapPercentage: Number(e.target.value) })} />
                  </td>
                  <td className="px-2 py-2 w-28">
                    <MfgInput type="number" min={0} step="any" value={line.estimatedCost} onChange={(e) => setLine(idx, { estimatedCost: Number(e.target.value) })} />
                  </td>
                  <td className="px-2 py-2 w-40">
                    <MfgInput value={line.substituteMaterial} onChange={(e) => setLine(idx, { substituteMaterial: e.target.value })} placeholder="Optional" />
                  </td>
                  <td className="px-2 py-2 w-20">
                    <MfgInput value={line.operationSequence} onChange={(e) => setLine(idx, { operationSequence: e.target.value })} />
                  </td>
                  <td className="px-2 py-2">
                    <button type="button" onClick={() => setLines((p) => p.filter((_, i) => i !== idx))} className="text-[#E74C3C]">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MfgCard>
    </MfgPage>
  );
}

export default MfgBomEditor;

