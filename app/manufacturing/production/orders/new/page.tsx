'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { ClipboardList, Save } from 'lucide-react';
import { useLocation } from '@/lib/location-context';
import {
  productionOrderService,
  manufacturingDefaultsService,
  manufacturingSettingsService,
} from '@/lib/manufacturing-service';
import { ProductPicker, type PickedProduct } from '../../../_components/ProductPicker';
import { MfgRelationPicker, type PickedRelation } from '../../../_components/MfgRelationPicker';
import {
  MfgPage,
  MfgPageHeader,
  MfgCard,
  MfgButton,
  MfgField,
  MfgInput,
  MfgSelect,
  MfgTextarea,
  MfgTable,
  MfgTableRow,
  MfgTableCell,
} from '../../../ui';

export default function NewProductionOrderPage() {
  const router = useRouter();
  const { locationIdForApi, selectedLocation } = useLocation();
  const [saving, setSaving] = useState(false);
  const [picked, setPicked] = useState<PickedProduct[]>([]);
  const [bom, setBom] = useState<PickedRelation[]>([]);
  const [routing, setRouting] = useState<PickedRelation[]>([]);
  const [sourceWh, setSourceWh] = useState<PickedRelation[]>([]);
  const [wipWh, setWipWh] = useState<PickedRelation[]>([]);
  const [fgWh, setFgWh] = useState<PickedRelation[]>([]);
  const [explosion, setExplosion] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, any>>({
    productId: '',
    bomId: '',
    routingId: '',
    plannedQuantity: 1,
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    priority: 'Medium',
    demandType: 'Make to Order',
    salesOrderReference: '',
    sourceWarehouseId: '',
    wipWarehouseId: '',
    finishedGoodsWarehouseId: '',
    notes: '',
  });

  const set = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let settings: { sourceWarehouseId?: string; sourceWarehouseName?: string } = {};
      try {
        settings = (await manufacturingSettingsService.get()) || {};
      } catch {
        settings = {};
      }
      if (cancelled) return;
      const id = String(settings.sourceWarehouseId || locationIdForApi || '');
      if (!id) return;
      setForm((prev) => {
        if (prev.sourceWarehouseId) return prev;
        setSourceWh([{
          id,
          name: settings.sourceWarehouseName || selectedLocation?.name || 'Selected warehouse',
        }]);
        return { ...prev, sourceWarehouseId: id };
      });
    })();
    return () => { cancelled = true; };
  }, [locationIdForApi, selectedLocation?.id, selectedLocation?.name]);

  const setWarehouse = (
    key: 'sourceWarehouseId' | 'wipWarehouseId' | 'finishedGoodsWarehouseId',
    items: PickedRelation[],
    setter: (next: PickedRelation[]) => void
  ) => {
    setter(items);
    set(key, items[0]?.id || '');
  };

  const loadDefaults = async (productId: string, qty = form.plannedQuantity) => {
    try {
      const res = await manufacturingDefaultsService.product(productId, Number(qty) || 1);
      const data = res?.data || res || {};
      if (data.bom) {
        setBom([{ id: data.bom.id, name: data.bom.bomNumber, extra: data.bom.version }]);
        set('bomId', data.bom.id);
      }
      if (data.routing) {
        setRouting([{ id: data.routing.id, name: data.routing.routingNumber || data.routing.description }]);
        set('routingId', data.routing.id);
      }
      setExplosion(data.explosion || []);
    } catch {
      setExplosion([]);
    }
  };

  const save = async () => {
    if (!form.productId) return toast.error('Select a product');
    if (!form.plannedQuantity || Number(form.plannedQuantity) <= 0) return toast.error('Planned quantity must be positive');
    if (!form.sourceWarehouseId) return toast.error('Source warehouse is required');
    setSaving(true);
    try {
      const created = await productionOrderService.create({ ...form, locationId: locationIdForApi || undefined });
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
        title="New Manufacturing Order"
        subtitle="Product selection loads default BOM, routing and calculated material requirements"
        backHref="/manufacturing/production/orders"
        icon={<ClipboardList className="w-5 h-5 text-white" />}
      />

      <MfgCard title="General / planning">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MfgField label="Product">
            <ProductPicker
              multiple={false}
              selected={picked}
              placeholder="Select product…"
              onChange={(products) => {
                setPicked(products);
                setBom([]);
                setRouting([]);
                setForm((p) => ({ ...p, productId: products[0]?.id || '', bomId: '', routingId: '' }));
                if (products[0]?.id) loadDefaults(products[0].id);
              }}
            />
          </MfgField>
          <MfgField label="BOM revision">
            <MfgRelationPicker
              kind="bom"
              multiple={false}
              selected={bom}
              placeholder={form.productId ? 'Select BOM…' : 'Select a product first'}
              filters={{ productId: form.productId || undefined }}
              onChange={(items) => { setBom(items); set('bomId', items[0]?.id || ''); }}
            />
          </MfgField>
          <MfgField label="Routing">
            <MfgInput value={routing[0]?.name || ''} readOnly placeholder="Loaded from product default routing" />
          </MfgField>
          <MfgField label="Planned Quantity">
            <MfgInput
              type="number"
              min={1}
              value={form.plannedQuantity}
              onChange={(e) => {
                set('plannedQuantity', e.target.value);
                if (form.productId) loadDefaults(form.productId, e.target.value);
              }}
            />
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
            <MfgInput value={form.salesOrderReference} onChange={(e) => set('salesOrderReference', e.target.value)} placeholder="Optional SO ref" />
          </MfgField>
          <MfgField label="Source Warehouse *" hint="Required. Materials are reserved and issued from this warehouse only.">
            <MfgRelationPicker kind="warehouse" multiple={false} selected={sourceWh} onChange={(items) => setWarehouse('sourceWarehouseId', items, setSourceWh)} />
          </MfgField>
          <MfgField label="WIP Warehouse">
            <MfgRelationPicker kind="warehouse" multiple={false} selected={wipWh} onChange={(items) => setWarehouse('wipWarehouseId', items, setWipWh)} />
          </MfgField>
          <div className="md:col-span-2">
            <MfgField label="Finished Goods Warehouse">
              <MfgRelationPicker kind="warehouse" multiple={false} selected={fgWh} onChange={(items) => setWarehouse('finishedGoodsWarehouseId', items, setFgWh)} />
            </MfgField>
          </div>
          <div className="md:col-span-2">
            <MfgField label="Notes">
              <MfgTextarea value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </MfgField>
          </div>
        </div>
      </MfgCard>

      <MfgCard title="Calculated material requirement">
        {explosion.length === 0 ? (
          <p className="text-xs text-[#7A8FA6]">Select a product with an active BOM to see required quantities (planned × BOM qty × scrap %).</p>
        ) : (
          <MfgTable columns={['Component', 'BOM qty', 'Scrap %', 'Required', 'Est. cost']}>
            {explosion.map((row: any) => (
              <MfgTableRow key={row.productId}>
                <MfgTableCell className="font-medium">{row.productName}</MfgTableCell>
                <MfgTableCell>{row.bomQty} {row.unit || ''}</MfgTableCell>
                <MfgTableCell>{Number(row.scrapPct || 0)}%</MfgTableCell>
                <MfgTableCell className="font-bold">{Number(row.requiredQty || 0).toLocaleString()}</MfgTableCell>
                <MfgTableCell>{Number(row.estimatedCost || 0).toLocaleString()}</MfgTableCell>
              </MfgTableRow>
            ))}
          </MfgTable>
        )}
      </MfgCard>

      <div className="flex justify-end gap-2">
        <MfgButton variant="secondary" onClick={() => router.push('/manufacturing/production/orders')}>Cancel</MfgButton>
        <MfgButton onClick={save} loading={saving}><Save className="w-4 h-4" /> Create Order</MfgButton>
      </div>
    </MfgPage>
  );
}
