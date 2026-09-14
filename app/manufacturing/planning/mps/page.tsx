'use client';

import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Workflow } from 'lucide-react';
import { mpsService } from '@/lib/manufacturing-service';
import { ProductPicker, type PickedProduct } from '../../_components/ProductPicker';
import {
  MfgPage,
  MfgPageHeader,
  MfgCard,
  MfgTable,
  MfgTableRow,
  MfgTableCell,
  MfgStatusBadge,
  MfgLoading,
  MfgError,
  MfgEmpty,
  MfgButton,
  MfgField,
  MfgInput,
  MfgSelect,
} from '../../ui';

export default function MpsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<{ productId: string; period: string; quantity?: string }>({ productId: '', period: 'month', quantity: '' });
  const [picked, setPicked] = useState<PickedProduct[]>([]);
  const [created, setCreated] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await mpsService.list({ limit: 100 });
      setRows(res.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load MPS');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!picked.length) return toast.error('Select a product');
    try {
      for (const prod of picked) {
        await mpsService.create({
          ...filter,
          productId: prod.id,
          quantity: Number(filter.quantity || 0),
          locationId: undefined,
        });
      }
      toast.success(picked.length > 1 ? `${picked.length} MPS entries added` : 'MPS entry added');
      setCreated(false);
      setPicked([]);
      setFilter((p) => ({ ...p, productId: '' }));
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to add MPS');
    }
  };

  return (
    <MfgPage>
      <MfgPageHeader
        title="Master Production Schedule (MPS)"
        subtitle="Planned vs actual production by product, week and month"
        icon={<Workflow className="w-5 h-5 text-white" />}
        actions={<MfgButton onClick={() => setCreated((p) => !p)}>+ Schedule</MfgButton>}
      />

      {created && (
        <MfgCard title="Add MPS Entry">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
            <MfgField label="Product">
              <ProductPicker
                multiple
                selected={picked}
                placeholder="Select product…"
                onChange={(products) => {
                  setPicked(products);
                  setFilter((p) => ({ ...p, productId: products[0]?.id || '' }));
                }}
              />
            </MfgField>
            </div>
            <MfgField label="Period">
              <MfgSelect value={filter.period} onChange={(e) => setFilter((p) => ({ ...p, period: e.target.value }))}>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </MfgSelect>
            </MfgField>
            <MfgField label="Quantity"><MfgInput type="number" value={(filter as any).quantity || ''} onChange={(e) => setFilter((p) => ({ ...p, quantity: e.target.value }))} /></MfgField>
            <div className="flex items-end"><MfgButton onClick={add}>Save</MfgButton></div>
          </div>
        </MfgCard>
      )}

      <MfgCard>
        {loading ? <MfgLoading /> : error ? <MfgError message={error} /> : rows.length === 0 ? (
          <MfgEmpty title="No MPS entries" message="Add scheduled production to feed MRP and production planning." />
        ) : (
          <MfgTable columns={['Product', 'Period', 'Planned', 'Actual', 'Week/Month', 'Status']}>
            {rows.map((r) => (
              <MfgTableRow key={r.id || r._id}>
                <MfgTableCell className="font-semibold">{r.productName || r.product?.name || r.productId || '—'}</MfgTableCell>
                <MfgTableCell>{r.period || '—'}</MfgTableCell>
                <MfgTableCell>{r.plannedQuantity ?? r.quantity ?? '—'}</MfgTableCell>
                <MfgTableCell>{r.actualQuantity ?? r.actual ?? '—'}</MfgTableCell>
                <MfgTableCell>{r.month || r.week || '—'}</MfgTableCell>
                <MfgTableCell><MfgStatusBadge status={r.status} /></MfgTableCell>
              </MfgTableRow>
            ))}
          </MfgTable>
        )}
      </MfgCard>
    </MfgPage>
  );
}
