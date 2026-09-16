'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Settings } from 'lucide-react';
import { manufacturingSettingsService } from '@/lib/manufacturing-service';
import { MfgRelationPicker, type PickedRelation } from '../_components/MfgRelationPicker';
import {
  MfgPage,
  MfgPageHeader,
  MfgCard,
  MfgField,
  MfgInput,
  MfgSelect,
  MfgButton,
  MfgLoading,
  MfgError,
} from '../ui';

export default function ManufacturingSettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [wipWh, setWipWh] = useState<PickedRelation[]>([]);
  const [fgWh, setFgWh] = useState<PickedRelation[]>([]);
  const [sourceWh, setSourceWh] = useState<PickedRelation[]>([]);

  useEffect(() => {
    let mounted = true;
    manufacturingSettingsService.get()
      .then((d) => {
        if (!mounted) return;
        const next = d ?? {};
        setSettings(next);
        if (next.wipWarehouseId) {
          setWipWh([{ id: String(next.wipWarehouseId), name: next.wipWarehouseName || 'Selected warehouse' }]);
        }
        if (next.finishedGoodsWarehouseId) {
          setFgWh([{ id: String(next.finishedGoodsWarehouseId), name: next.finishedGoodsWarehouseName || 'Selected warehouse' }]);
        }
        if (next.sourceWarehouseId) {
          setSourceWh([{ id: String(next.sourceWarehouseId), name: next.sourceWarehouseName || 'Selected warehouse' }]);
        }
      })
      .catch((e: any) => { if (mounted) setError(e.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const set = (key: string, val: any) => setSettings((p: any) => ({ ...p, [key]: val }));

  const save = async () => {
    setSaving(true);
    try {
      await manufacturingSettingsService.update(settings);
      toast.success('Settings saved');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <MfgPage><MfgLoading /></MfgPage>;
  if (error) return <MfgPage><MfgError message={error} /></MfgPage>;

  return (
    <MfgPage>
      <MfgPageHeader
        title="Manufacturing Settings"
        subtitle="Numbering, defaults, negative-inventory and automation policy"
        icon={<Settings className="w-5 h-5 text-white" />}
        actions={<MfgButton onClick={save} loading={saving}>Save</MfgButton>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MfgCard title="Production Numbering">
          <div className="grid grid-cols-1 gap-4">
            <MfgField label="Production Order Prefix" hint="e.g. MO-"><MfgInput value={settings.productionOrderPrefix ?? 'MO-'} onChange={(e) => set('productionOrderPrefix', e.target.value)} /></MfgField>
            <MfgField label="Work Order Prefix" hint="e.g. WO-"><MfgInput value={settings.workOrderPrefix ?? 'WO-'} onChange={(e) => set('workOrderPrefix', e.target.value)} /></MfgField>
            <MfgField label="BOM Prefix" hint="e.g. BOM-"><MfgInput value={settings.bomPrefix ?? 'BOM-'} onChange={(e) => set('bomPrefix', e.target.value)} /></MfgField>
            <MfgField label="Next Sequence Number"><MfgInput type="number" value={settings.nextNumber ?? 1} onChange={(e) => set('nextNumber', e.target.value)} /></MfgField>
          </div>
        </MfgCard>

        <MfgCard title="Manufacturing Configuration">
          <div className="grid grid-cols-1 gap-4">
            <MfgField label="Allow Negative Inventory">
              <MfgSelect value={settings.allowNegativeInventory ? 'yes' : 'no'} onChange={(e) => set('allowNegativeInventory', e.target.value === 'yes')}>
                <option value="no">No (recommended)</option>
                <option value="yes">Yes</option>
              </MfgSelect>
            </MfgField>
            <MfgField label="Auto-create Purchase Orders from MRP">
              <MfgSelect value={settings.autoCreatePurchaseOrders ? 'yes' : 'no'} onChange={(e) => set('autoCreatePurchaseOrders', e.target.value === 'yes')}>
                <option value="no">No (manual review)</option>
                <option value="yes">Yes</option>
              </MfgSelect>
            </MfgField>
            <MfgField label="Default Source Warehouse">
              <MfgRelationPicker
                kind="warehouse"
                multiple={false}
                selected={sourceWh}
                placeholder="Select default source warehouse…"
                onChange={(items) => {
                  setSourceWh(items);
                  set('sourceWarehouseId', items[0]?.id || '');
                  set('sourceWarehouseName', items[0]?.name || '');
                }}
              />
            </MfgField>
            <MfgField label="Default WIP Warehouse">
              <MfgRelationPicker
                kind="warehouse"
                multiple={false}
                selected={wipWh}
                placeholder="Select default WIP warehouse…"
                onChange={(items) => {
                  setWipWh(items);
                  set('wipWarehouseId', items[0]?.id || '');
                  set('wipWarehouseName', items[0]?.name || '');
                }}
              />
            </MfgField>
            <MfgField label="Default Finished Goods Warehouse">
              <MfgRelationPicker
                kind="warehouse"
                multiple={false}
                selected={fgWh}
                placeholder="Select default finished-goods warehouse…"
                onChange={(items) => {
                  setFgWh(items);
                  set('finishedGoodsWarehouseId', items[0]?.id || '');
                  set('finishedGoodsWarehouseName', items[0]?.name || '');
                }}
              />
            </MfgField>
          </div>
        </MfgCard>
      </div>
    </MfgPage>
  );
}
