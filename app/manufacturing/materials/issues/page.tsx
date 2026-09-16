'use client';

import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FileUp, Save } from 'lucide-react';
import { useLocation } from '@/lib/location-context';
import { materialIssueService, productionOrderService } from '@/lib/manufacturing-service';
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
} from '../../ui';

export default function MaterialIssuesPage() {
  const { locationIdForApi } = useLocation();
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<PickedRelation[]>([]);
  const [warehouse, setWarehouse] = useState<PickedRelation[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await materialIssueService.list({ page, limit: 20, search: search || undefined, locationId: locationIdForApi || undefined });
      setRows(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [page, search, locationIdForApi]);

  useEffect(() => { load(); }, [load]);

  const loadOrderLines = async (items: PickedRelation[]) => {
    setOrder(items);
    const id = items[0]?.id;
    if (!id) { setLines([]); return; }
    try {
      const mats = await productionOrderService.materials(id);
      setLines((mats || []).map((m: any) => ({
        reservationId: m.reservationId || m.id,
        componentId: m.productId,
        productName: m.productName,
        requiredQty: Number(m.requiredQty || 0),
        issuedQty: Number(m.issuedQty || 0),
        remainingQty: Number(m.remainingQty || 0),
        issuedQuantity: Number(m.remainingQty || 0),
        batchNumber: '',
      })));
    } catch (e: any) {
      toast.error(e.message || 'Could not load materials');
    }
  };

  const save = async () => {
    const id = order[0]?.id;
    if (!id) return toast.error('Select a manufacturing order');
    const payloadLines = lines.filter((l) => Number(l.issuedQuantity) > 0);
    if (!payloadLines.length) return toast.error('Enter quantities to issue');
    setSaving(true);
    try {
      await productionOrderService.issueMaterials(id, {
        fromLocationId: warehouse[0]?.id,
        lines: payloadLines.map((l) => ({
          reservationId: l.reservationId,
          componentId: l.componentId,
          issuedQuantity: Number(l.issuedQuantity),
          batchNumber: l.batchNumber || undefined,
        })),
      });
      toast.success('Issued all selected materials as one document');
      setLines([]);
      setOrder([]);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Issue failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MfgPage>
      <MfgPageHeader
        title="Material Issues"
        subtitle="Issue multiple components, batches and quantities against one manufacturing order"
        icon={<FileUp className="w-5 h-5 text-white" />}
      />
      <MfgCard title="New issue document">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <MfgField label="Manufacturing order">
            <MfgRelationPicker kind="productionOrder" multiple={false} selected={order} onChange={loadOrderLines} />
          </MfgField>
          <MfgField label="From warehouse">
            <MfgRelationPicker kind="warehouse" multiple={false} selected={warehouse} onChange={setWarehouse} />
          </MfgField>
        </div>
        {lines.length > 0 && (
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase text-[#7A8FA6] text-left">
                  {['Item', 'Required', 'Already issued', 'Remaining', 'Issue now', 'Batch'].map((h) => (
                    <th key={h} className="px-2 py-2 border-b border-[#DDE4EE]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={line.componentId} className="border-b border-[#DDE4EE]/70">
                    <td className="px-2 py-2 font-medium">{line.productName}</td>
                    <td className="px-2 py-2">{line.requiredQty}</td>
                    <td className="px-2 py-2">{line.issuedQty}</td>
                    <td className="px-2 py-2">{line.remainingQty}</td>
                    <td className="px-2 py-2 w-28">
                      <MfgInput type="number" min={0} value={line.issuedQuantity} onChange={(e) => setLines((p) => p.map((x, i) => i === idx ? { ...x, issuedQuantity: e.target.value } : x))} />
                    </td>
                    <td className="px-2 py-2 w-32">
                      <MfgInput value={line.batchNumber} onChange={(e) => setLines((p) => p.map((x, i) => i === idx ? { ...x, batchNumber: e.target.value } : x))} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <MfgButton onClick={save} loading={saving}><Save className="w-4 h-4" /> Issue materials</MfgButton>
      </MfgCard>
      <MfgCard title="Issue history">
        <div className="mb-4"><MfgSearchInput value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="Search issue / material…" /></div>
        {loading ? <MfgLoading /> : error ? <MfgError message={error} /> : rows.length === 0 ? (
          <MfgEmpty title="No issues" />
        ) : (
          <>
            <MfgTable columns={['Issue #', 'MO #', 'Material', 'Qty', 'Batch', 'Status']}>
              {rows.map((r) => (
                <MfgTableRow key={r.id}>
                  <MfgTableCell className="font-semibold text-[#014582]">{r.issueNumber}</MfgTableCell>
                  <MfgTableCell>{r.productionOrderNumber || r.productionOrder?.orderNumber || '—'}</MfgTableCell>
                  <MfgTableCell>{r.productName || r.componentName || '—'}</MfgTableCell>
                  <MfgTableCell>{r.quantity ?? r.issuedQuantity}</MfgTableCell>
                  <MfgTableCell>{r.batchNumber || '—'}</MfgTableCell>
                  <MfgTableCell><MfgStatusBadge status={r.status} /></MfgTableCell>
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
