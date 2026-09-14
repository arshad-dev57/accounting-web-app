'use client';

import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ListTodo, PlayCircle, PauseCircle, CheckCircle2 } from 'lucide-react';
import { useLocation } from '@/lib/location-context';
import { workOrderService } from '@/lib/manufacturing-service';
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
  MfgError,
  MfgEmpty,
  MfgPagination,
  MfgButton,
} from '../../ui';

export default function WorkOrdersPage() {
  const { locationIdForApi } = useLocation();
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await workOrderService.list({
        page,
        limit: 20,
        search: search || undefined,
        locationId: locationIdForApi || undefined,
      });
      setRows(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load work orders');
    } finally {
      setLoading(false);
    }
  }, [page, search, locationIdForApi]);

  useEffect(() => { load(); }, [load]);

  const run = async (id: string, action: 'start' | 'pause' | 'resume' | 'complete' | 'report', payload?: any) => {
    setBusyId(id);
    try {
      if (action === 'start') await workOrderService.start(id);
      else if (action === 'pause') await workOrderService.pause(id);
      else if (action === 'resume') await workOrderService.resume(id);
      else if (action === 'complete') await workOrderService.complete(id, payload || {});
      else await workOrderService.report(id, payload || {});
      toast.success(`Work order ${action === 'report' ? 'updated' : action + 'ed'}`);
      load();
    } catch (e: any) {
      toast.error(e.message || `Failed to ${action}`);
    } finally {
      setBusyId(null);
    }
  };

  const reportQty = async (wo: any) => {
    const goodQty = window.prompt('Good quantity produced');
    if (goodQty === null) return;
    const scrapQty = window.prompt('Scrap quantity (0 if none)') || '0';
    await run(wo.id || wo._id, 'report', {
      goodQuantity: Number(goodQty),
      scrapQuantity: Number(scrapQty),
    });
  };

  return (
    <MfgPage>
      <MfgPageHeader
        title="Work Orders"
        subtitle="Shop-floor execution of routing operations — start, report and complete"
        icon={<ListTodo className="w-5 h-5 text-white" />}
      />
      <MfgCard>
        <div className="mb-4">
          <MfgSearchInput value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="Search work order / operation…" />
        </div>
        {loading ? <MfgLoading /> : error ? <MfgError message={error} /> : rows.length === 0 ? (
          <MfgEmpty title="No work orders" message="Work orders are created automatically when a production order is released with a routing." />
        ) : (
          <>
            <MfgTable columns={['WO #', 'MO #', 'Operation', 'Work Center', 'Planned', 'Completed', 'Status', 'Actions']}>
              {rows.map((wo) => {
                const id = wo.id || wo._id;
                const st = wo.status || 'Pending';
                return (
                  <MfgTableRow key={id}>
                    <MfgTableCell className="font-semibold text-[#014582]">{wo.workOrderNumber || '—'}</MfgTableCell>
                    <MfgTableCell>{wo.productionOrderNumber || wo.productionOrder?.orderNumber || wo.productionOrderId || '—'}</MfgTableCell>
                    <MfgTableCell>{wo.operationName || '—'}</MfgTableCell>
                    <MfgTableCell>{wo.workCenterName || wo.workCenter?.name || '—'}</MfgTableCell>
                    <MfgTableCell>{wo.plannedQuantity ?? '—'}</MfgTableCell>
                    <MfgTableCell>{wo.completedQuantity ?? wo.completedQty ?? '—'}</MfgTableCell>
                    <MfgTableCell><MfgStatusBadge status={st} /></MfgTableCell>
                    <MfgTableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {st === 'Pending' && (
                          <MfgButton variant="primary" onClick={() => run(id, 'start')} loading={busyId === id}><PlayCircle className="w-4 h-4" /> Start</MfgButton>
                        )}
                        {st === 'In Progress' && (
                          <MfgButton variant="secondary" onClick={() => run(id, 'pause')} loading={busyId === id}><PauseCircle className="w-4 h-4" /> Pause</MfgButton>
                        )}
                        {st === 'Paused' && (
                          <MfgButton variant="secondary" onClick={() => run(id, 'resume')} loading={busyId === id}><PlayCircle className="w-4 h-4" /> Resume</MfgButton>
                        )}
                        {['Pending', 'In Progress', 'Paused'].includes(st) && (
                          <MfgButton variant="ghost" onClick={() => reportQty(wo)} loading={busyId === id}>Report</MfgButton>
                        )}
                        {['In Progress', 'Paused'].includes(st) && (
                          <MfgButton variant="primary" onClick={() => run(id, 'complete')} loading={busyId === id}><CheckCircle2 className="w-4 h-4" /> Complete</MfgButton>
                        )}
                      </div>
                    </MfgTableCell>
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
