'use client';

import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { RotateCcw, Plus, Save } from 'lucide-react';
import { useLocation } from '@/lib/location-context';
import { productionOrderService, scrapService } from '@/lib/manufacturing-service';
import { ProductPicker } from '../../_components/ProductPicker';
import { MfgRelationPicker, type PickedRelation } from '../../_components/MfgRelationPicker';
import {
  MfgPage, MfgPageHeader, MfgCard, MfgSearchInput, MfgTable, MfgTableRow, MfgTableCell,
  MfgLoading, MfgEmpty, MfgError, MfgPagination, MfgButton, MfgField, MfgInput,
} from '../../ui';

const emptyLine = () => ({ productId: '', productName: '', quantity: '', reason: '', recoverable: false, cost: '' });

export default function ScrapPage() {
  const { locationIdForApi } = useLocation();
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<PickedRelation[]>([]);
  const [workCenter, setWorkCenter] = useState<PickedRelation[]>([]);
  const [lines, setLines] = useState([emptyLine()]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await scrapService.list({ page, limit: 20, search: search || undefined, locationId: locationIdForApi || undefined });
      setRows(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load scrap');
    } finally {
      setLoading(false);
    }
  }, [page, search, locationIdForApi]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!order[0]?.id) return toast.error('Select a manufacturing order');
    const payload = lines.filter((l) => l.productId && Number(l.quantity) > 0);
    if (!payload.length) return toast.error('Add scrap lines');
    setSaving(true);
    try {
      await productionOrderService.recordScrap(order[0].id, {
        lines: payload.map((l) => ({
          ...l,
          quantity: Number(l.quantity),
          cost: Number(l.cost || 0),
          workCenterId: workCenter[0]?.id,
        })),
      });
      toast.success('Scrap recorded as one transaction');
      setLines([emptyLine()]);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MfgPage>
      <MfgPageHeader title="Scrap / Wastage" subtitle="Record multiple scrap lines against one manufacturing order — reason, recoverable flag and cost" icon={<RotateCcw className="w-5 h-5 text-white" />} />
      <MfgCard title="New scrap document">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <MfgField label="Manufacturing order"><MfgRelationPicker kind="productionOrder" multiple={false} selected={order} onChange={setOrder} /></MfgField>
          <MfgField label="Work center"><MfgRelationPicker kind="workCenter" multiple={false} selected={workCenter} onChange={setWorkCenter} /></MfgField>
        </div>
        {lines.map((line, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
            <div className="md:col-span-2">
              <ProductPicker multiple={false} selected={line.productId ? [{ id: line.productId, name: line.productName }] : []} onChange={(items) => setLines((p) => p.map((x, i) => i === idx ? { ...x, productId: items[0]?.id || '', productName: items[0]?.name || '' } : x))} />
            </div>
            <MfgInput type="number" placeholder="Qty" value={line.quantity} onChange={(e) => setLines((p) => p.map((x, i) => i === idx ? { ...x, quantity: e.target.value } : x))} />
            <MfgInput placeholder="Reason" value={line.reason} onChange={(e) => setLines((p) => p.map((x, i) => i === idx ? { ...x, reason: e.target.value } : x))} />
            <label className="flex items-center gap-2 text-xs font-medium"><input type="checkbox" checked={line.recoverable} onChange={(e) => setLines((p) => p.map((x, i) => i === idx ? { ...x, recoverable: e.target.checked } : x))} /> Recoverable</label>
            <MfgInput type="number" placeholder="Cost" value={line.cost} onChange={(e) => setLines((p) => p.map((x, i) => i === idx ? { ...x, cost: e.target.value } : x))} />
          </div>
        ))}
        <div className="flex gap-2">
          <MfgButton variant="secondary" onClick={() => setLines((p) => [...p, emptyLine()])}><Plus className="w-4 h-4" /> Line</MfgButton>
          <MfgButton onClick={save} loading={saving}><Save className="w-4 h-4" /> Save scrap</MfgButton>
        </div>
      </MfgCard>
      <MfgCard title="Scrap history">
        <div className="mb-4"><MfgSearchInput value={search} onChange={(v) => { setPage(1); setSearch(v); }} /></div>
        {loading ? <MfgLoading /> : error ? <MfgError message={error} /> : rows.length === 0 ? <MfgEmpty title="No scrap records" /> : (
          <>
            <MfgTable columns={['MO #', 'Material', 'Qty', 'Reason', 'Cost']}>
              {rows.map((r) => (
                <MfgTableRow key={r.id}>
                  <MfgTableCell className="font-semibold text-[#014582]">{r.productionOrderNumber || r.productionOrder?.orderNumber || '—'}</MfgTableCell>
                  <MfgTableCell>{r.productName || r.materialName || '—'}</MfgTableCell>
                  <MfgTableCell>{r.quantity}</MfgTableCell>
                  <MfgTableCell>{r.reason || '—'}</MfgTableCell>
                  <MfgTableCell>{Number(r.cost || 0).toLocaleString()}</MfgTableCell>
                </MfgTableRow>
              ))}
            </MfgTable>
            <MfgPagination page={page} total={total} onPage={setPage} />
          </>
        )}
      </MfgCard>
    </MfgPage>
  );
}
