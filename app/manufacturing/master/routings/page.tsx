'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Route } from 'lucide-react';
import { useLocation } from '@/lib/location-context';
import { routingService } from '@/lib/manufacturing-service';
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

export default function RoutingsPage() {
  const { locationIdForApi } = useLocation();
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await routingService.list({ page, limit: 20, search: search || undefined, locationId: locationIdForApi || undefined });
      setRows(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load routings');
    } finally {
      setLoading(false);
    }
  }, [page, search, locationIdForApi]);

  useEffect(() => { load(); }, [load]);

  return (
    <MfgPage>
      <MfgPageHeader
        title="Routings"
        subtitle="Ordered operations with work centers, times and quality checkpoints"
        icon={<Route className="w-5 h-5 text-white" />}
        actions={<MfgAddButton label="New Routing" onClick={() => { window.location.href = '/manufacturing/master/routings/new'; }} />}
      />
      <MfgCard>
        <div className="mb-4"><MfgSearchInput value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="Search routing / product…" /></div>
        {loading ? <MfgLoading /> : error ? <MfgError message={error} /> : rows.length === 0 ? (
          <MfgEmpty title="No routings" message="Create a routing with multiple operations in one document." />
        ) : (
          <>
            <MfgTable columns={['Routing', 'Product', 'Operations', 'Status']}>
              {rows.map((r) => (
                <MfgTableRow key={r.id} onClick={() => { window.location.href = `/manufacturing/master/routings/${r.id}`; }}>
                  <MfgTableCell className="font-semibold text-[#014582]">{r.routingNumber || r.description || '—'}</MfgTableCell>
                  <MfgTableCell>{r.productName || r.product?.name || '—'}</MfgTableCell>
                  <MfgTableCell>{Array.isArray(r.operations) ? r.operations.length : '—'}</MfgTableCell>
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
