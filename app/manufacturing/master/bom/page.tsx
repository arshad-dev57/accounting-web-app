'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Boxes } from 'lucide-react';
import { bomService } from '@/lib/manufacturing-service';
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
  MfgAddButton,
} from '../../ui';

export default function BomListPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bomService.list({ page, limit: 20, search: search || undefined });
      setRows(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load BOMs');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <MfgPage>
      <MfgPageHeader
        title="Bill of Materials"
        subtitle="Versions, components, scrap and estimated cost — historical production keeps the revision used at release"
        icon={<Boxes className="w-5 h-5 text-white" />}
        actions={<MfgAddButton label="New BOM" onClick={() => { window.location.href = '/manufacturing/master/bom/new'; }} />}
      />
      <MfgCard>
        <div className="mb-4"><MfgSearchInput value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="Search BOM / product…" /></div>
        {loading ? <MfgLoading /> : error ? <MfgError message={error} /> : rows.length === 0 ? (
          <MfgEmpty title="No BOMs" message="Create a BOM with multiple components, scrap % and costing." />
        ) : (
          <>
            <MfgTable columns={['BOM', 'Product', 'Version', 'Components', 'Est. cost', 'Status']}>
              {rows.map((r) => (
                <MfgTableRow key={r.id} onClick={() => { window.location.href = `/manufacturing/master/bom/${r.id}`; }}>
                  <MfgTableCell className="font-semibold text-[#014582]">{r.bomNumber || '—'}</MfgTableCell>
                  <MfgTableCell>{r.productName || r.product?.name || '—'}</MfgTableCell>
                  <MfgTableCell>{r.version || '—'}</MfgTableCell>
                  <MfgTableCell>{Array.isArray(r.components) ? r.components.length : '—'}</MfgTableCell>
                  <MfgTableCell>{Number(r.totalEstimatedCost || 0).toLocaleString()}</MfgTableCell>
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
