'use client';

import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { SearchCheck, Plus, Save } from 'lucide-react';
import { useLocation } from '@/lib/location-context';
import { inspectionService } from '@/lib/manufacturing-service';
import { ProductPicker } from '../../_components/ProductPicker';
import { MfgRelationPicker, type PickedRelation } from '../../_components/MfgRelationPicker';
import {
  MfgPage,
  MfgPageHeader,
  MfgCard,
  MfgSearchInput,
  MfgTable,
  MfgTableRow,
  MfgTableCell,
  MfgStatusBadge,
  MfgLoading,
  MfgEmpty,
  MfgError,
  MfgPagination,
  MfgButton,
  MfgField,
  MfgInput,
  MfgSelect,
} from '../../ui';

const emptyParam = () => ({ parameterName: '', expectedValue: '', actualValue: '', tolerance: '', unitOfMeasure: '' });

export default function QualityInspectionsPage() {
  const { locationIdForApi } = useLocation();
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<PickedRelation[]>([]);
  const [product, setProduct] = useState<any[]>([]);
  const [type, setType] = useState('Final');
  const [result, setResult] = useState('Pending');
  const [notes, setNotes] = useState('');
  const [params, setParams] = useState([emptyParam()]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inspectionService.list({ page, limit: 20, search: search || undefined, locationId: locationIdForApi || undefined });
      setRows(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load inspections');
    } finally {
      setLoading(false);
    }
  }, [page, search, locationIdForApi]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!order[0]?.id || !product[0]?.id) return toast.error('Select manufacturing order and product');
    setSaving(true);
    try {
      await inspectionService.create({
        productionOrderId: order[0].id,
        productId: product[0].id,
        inspectionType: type,
        result,
        notes,
        qualityParameters: params.filter((p) => p.parameterName),
      });
      toast.success('Inspection saved with parameters');
      setParams([emptyParam()]);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MfgPage>
      <MfgPageHeader title="Quality Inspections" subtitle="One inspection can capture multiple parameters, tolerances and pass/fail results" icon={<SearchCheck className="w-5 h-5 text-white" />} />
      <MfgCard title="New inspection">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <MfgField label="Manufacturing order"><MfgRelationPicker kind="productionOrder" multiple={false} selected={order} onChange={setOrder} /></MfgField>
          <MfgField label="Product"><ProductPicker multiple={false} selected={product} onChange={setProduct} /></MfgField>
          <MfgField label="Type"><MfgSelect value={type} onChange={(e) => setType(e.target.value)}>{['Incoming', 'InProcess', 'Final'].map((v) => <option key={v}>{v}</option>)}</MfgSelect></MfgField>
          <MfgField label="Result"><MfgSelect value={result} onChange={(e) => setResult(e.target.value)}>{['Pending', 'Passed', 'Failed', 'Rework', 'Scrap'].map((v) => <option key={v}>{v}</option>)}</MfgSelect></MfgField>
        </div>
        <table className="w-full text-sm mb-3">
          <thead>
            <tr className="text-[10px] uppercase text-[#7A8FA6] text-left">
              {['Parameter', 'Standard', 'Actual', 'Tolerance', 'UoM'].map((h) => <th key={h} className="px-2 py-2 border-b border-[#DDE4EE]">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {params.map((p, idx) => (
              <tr key={idx}>
                {(['parameterName', 'expectedValue', 'actualValue', 'tolerance', 'unitOfMeasure'] as const).map((k) => (
                  <td key={k} className="px-2 py-1"><MfgInput value={p[k]} onChange={(e) => setParams((prev) => prev.map((x, i) => i === idx ? { ...x, [k]: e.target.value } : x))} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex gap-2">
          <MfgButton variant="secondary" onClick={() => setParams((p) => [...p, emptyParam()])}><Plus className="w-4 h-4" /> Parameter</MfgButton>
          <MfgButton onClick={save} loading={saving}><Save className="w-4 h-4" /> Save inspection</MfgButton>
        </div>
        <MfgField label="Remarks"><MfgInput value={notes} onChange={(e) => setNotes(e.target.value)} /></MfgField>
      </MfgCard>
      <MfgCard title="Inspection history">
        <div className="mb-4"><MfgSearchInput value={search} onChange={(v) => { setPage(1); setSearch(v); }} /></div>
        {loading ? <MfgLoading /> : error ? <MfgError message={error} /> : rows.length === 0 ? <MfgEmpty title="No inspections" /> : (
          <>
            <MfgTable columns={['Inspection #', 'MO #', 'Product', 'Result']}>
              {rows.map((r) => (
                <MfgTableRow key={r.id}>
                  <MfgTableCell className="font-semibold text-[#014582]">{r.inspectionNumber}</MfgTableCell>
                  <MfgTableCell>{r.productionOrderNumber || r.productionOrder?.orderNumber || '—'}</MfgTableCell>
                  <MfgTableCell>{r.productName || '—'}</MfgTableCell>
                  <MfgTableCell><MfgStatusBadge status={r.result || r.status} /></MfgTableCell>
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
