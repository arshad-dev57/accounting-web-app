'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { ClipboardList, Save } from 'lucide-react';
import { useLocation } from '@/lib/location-context';
import { productionOrderService, bomService } from '@/lib/manufacturing-service';
import { ProductPicker, type PickedProduct } from '../../../_components/ProductPicker';
import {
  MfgPage,
  MfgPageHeader,
  MfgCard,
  MfgButton,
  MfgField,
  MfgInput,
  MfgSelect,
  MfgTextarea,
} from '../../../ui';

export default function NewProductionOrderPage() {
  const router = useRouter();
  const { locationIdForApi } = useLocation();
  const [boms, setBoms] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [picked, setPicked] = useState<PickedProduct[]>([]);
  const [form, setForm] = useState<Record<string, any>>({
    productId: '',
    bomId: '',
    plannedQuantity: 1,
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    priority: 'Medium',
    demandType: 'Make to Order',
    salesOrderId: '',
    sourceWarehouseId: '',
    wipWarehouseId: '',
    finishedGoodsWarehouseId: '',
    notes: '',
  });

  useEffect(() => {
    let mounted = true;
    const params: any = { limit: 200 };
    if (form.productId) params.productId = form.productId;
    bomService.list(params)
      .then((b) => { if (mounted) setBoms(b.data || []); })
      .catch(() => { if (mounted) setBoms([]); });
    return () => { mounted = false; };
  }, [form.productId]);

  const set = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

  const save = async () => {
    if (!form.productId) return toast.error('Select a product');
    if (!form.plannedQuantity || Number(form.plannedQuantity) <= 0) return toast.error('Planned quantity must be positive');
    setSaving(true);
    try {
      const payload = { ...form, locationId: locationIdForApi || undefined };
      const created = await productionOrderService.create(payload);
      toast.success('Production order created');
      router.push(`/manufacturing/production/orders/${created.id || created._id}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to create production order');
    } finally {
      setSaving(false);
    }
  };

  const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
  const DEMAND_TYPES = ['Make to Stock', 'Make to Order', 'Sales Order', 'Forecast', 'Manual'];

  return (
    <MfgPage>
      <MfgPageHeader
        title="New Production Order"
        subtitle="Create a production order linked to a product and BOM"
        backHref="/manufacturing/production/orders"
        icon={<ClipboardList className="w-5 h-5 text-white" />}
      />

      <MfgCard title="Order Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MfgField label="Product">
            <ProductPicker
              multiple={false}
              selected={picked}
              placeholder="Select product…"
              onChange={(products) => {
                setPicked(products);
                setForm((p) => ({ ...p, productId: products[0]?.id || '', bomId: '' }));
              }}
            />
          </MfgField>

          <MfgField label="BOM">
            <MfgSelect value={form.bomId} onChange={(e) => set('bomId', e.target.value)}>
              <option value="">{form.productId ? 'Select BOM…' : 'Select a product first'}</option>
              {boms.map((b: any) => (
                <option key={b.id || b._id} value={b.id || b._id}>{b.bomNumber || b.name || b.id}</option>
              ))}
            </MfgSelect>
          </MfgField>

          <MfgField label="Planned Quantity">
            <MfgInput type="number" min={1} value={form.plannedQuantity} onChange={(e) => set('plannedQuantity', e.target.value)} />
          </MfgField>

          <MfgField label="Priority">
            <MfgSelect value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              {PRIORITIES.map((v) => <option key={v} value={v}>{v}</option>)}
            </MfgSelect>
          </MfgField>

          <MfgField label="Start Date">
            <MfgInput type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </MfgField>

          <MfgField label="Due Date">
            <MfgInput type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
          </MfgField>

          <MfgField label="Demand Type">
            <MfgSelect value={form.demandType} onChange={(e) => set('demandType', e.target.value)}>
              {DEMAND_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
            </MfgSelect>
          </MfgField>

          <MfgField label="Sales Order Reference">
            <MfgInput value={form.salesOrderId} onChange={(e) => set('salesOrderId', e.target.value)} placeholder="Optional SO ref" />
          </MfgField>

          <MfgField label="Source Warehouse Id">
            <MfgInput value={form.sourceWarehouseId} onChange={(e) => set('sourceWarehouseId', e.target.value)} />
          </MfgField>

          <MfgField label="WIP Warehouse Id">
            <MfgInput value={form.wipWarehouseId} onChange={(e) => set('wipWarehouseId', e.target.value)} />
          </MfgField>

          <div className="md:col-span-2">
            <MfgField label="Finished Goods Warehouse Id">
              <MfgInput value={form.finishedGoodsWarehouseId} onChange={(e) => set('finishedGoodsWarehouseId', e.target.value)} />
            </MfgField>
          </div>

          <div className="md:col-span-2">
            <MfgField label="Notes">
              <MfgTextarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Internal notes…" />
            </MfgField>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <MfgButton variant="secondary" onClick={() => router.push('/manufacturing/production/orders')}>Cancel</MfgButton>
          <MfgButton onClick={save} loading={saving}>
            <Save className="w-4 h-4" /> Create Order
          </MfgButton>
        </div>
      </MfgCard>
    </MfgPage>
  );
}
