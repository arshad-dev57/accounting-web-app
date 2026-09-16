'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useLocation } from '@/lib/location-context';
import { productionOrderService, type ProductionOrder } from '@/lib/manufacturing-service';
import {
  MfgPage,
  MfgPageHeader,
  MfgCard,
  MfgSearchInput,
  MfgTable,
  MfgTableRow,
  MfgTableCell,
  MfgStatusBadge,
  MfgProgress,
  MfgLoading,
  MfgEmpty,
  MfgError,
  MfgPagination,
  MfgAddButton,
} from '../../ui';

const STATUS_FILTERS = ['All', 'Draft', 'Planned', 'Released', 'In Progress', 'Paused', 'Partially Completed', 'Completed', 'Closed Short', 'Closed', 'Cancelled'];

export default function ProductionOrdersPage() {
  return (
    <Suspense fallback={<MfgPage><MfgLoading /></MfgPage>}>
      <ProductionOrdersInner />
    </Suspense>
  );
}

function ProductionOrdersInner() {
  const { locationIdForApi } = useLocation();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<ProductionOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || 'All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await productionOrderService.list({
        page,
        limit: 20,
        search: search || undefined,
        status: status === 'All' ? undefined : status,
        locationId: locationIdForApi || undefined,
      });
      setRows(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load production orders');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, locationIdForApi]);

  useEffect(() => { load(); }, [load]);

  const n = (v: any) => Number(v || 0);

  return (
    <MfgPage>
      <MfgPageHeader
        title="Production Orders"
        subtitle="Draft → Planned → Released → In Progress → Completed → Closed"
        icon={<ClipboardList className="w-5 h-5 text-white" />}
        actions={
          <>
            <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 text-white text-sm font-semibold hover:bg-white/25 transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
            <MfgAddButton label="New Order" onClick={() => { window.location.href = '/manufacturing/production/orders/new'; }} />
          </>
        }
      />

      <MfgCard>
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
          <div className="flex-1">
            <MfgSearchInput value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="Search order / product…" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => { setPage(1); setStatus(s); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  status === s ? 'bg-[#014582] text-white' : 'bg-[#F0F4F8] text-[#7A8FA6] hover:bg-[#E5ECF4]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <MfgLoading />
        ) : error ? (
          <MfgError message={error} />
        ) : rows.length === 0 ? (
          <MfgEmpty title="No production orders" message="Create a production order to start the manufacturing workflow." />
        ) : (
          <>
            <MfgTable columns={['Order', 'Product', 'Planned', 'Produced', 'Remaining', 'Start', 'Due', 'Status', 'Progress']}>
              {rows.map((o) => {
                const planned = n(o.plannedQuantity);
                const produced = n(o.producedQuantity ?? o.goodQuantity);
                const remaining = n(o.remainingQuantity) || Math.max(0, planned - produced);
                const progress = planned ? (produced / planned) * 100 : 0;
                return (
                  <MfgTableRow key={o.id || o._id} onClick={() => { window.location.href = `/manufacturing/production/orders/${o.id || o._id}`; }}>
                    <MfgTableCell className="font-bold text-[#014582]">
                      {o.orderNumber || '—'}
                    </MfgTableCell>
                    <MfgTableCell>{o.productName || o.product?.name || '—'}</MfgTableCell>
                    <MfgTableCell>{planned}</MfgTableCell>
                    <MfgTableCell>{produced}</MfgTableCell>
                    <MfgTableCell>{remaining}</MfgTableCell>
                    <MfgTableCell>{o.startDate ? new Date(o.startDate).toLocaleDateString('en-GB') : '—'}</MfgTableCell>
                    <MfgTableCell>{o.dueDate ? new Date(o.dueDate).toLocaleDateString('en-GB') : '—'}</MfgTableCell>
                    <MfgTableCell><MfgStatusBadge status={o.status} /></MfgTableCell>
                    <MfgTableCell><MfgProgress value={progress} /></MfgTableCell>
                  </MfgTableRow>
                );
              })}
            </MfgTable>
            <MfgPagination page={page} total={total} onPage={setPage} />
          </>
        )}
      </MfgCard>
    </MfgPage>
  );
}
