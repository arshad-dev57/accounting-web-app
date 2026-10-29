'use client';

// ERPNext Shop Floor page — open Job Cards for the plant floor.

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Factory, RefreshCcw } from 'lucide-react';
import { HRCard, HRPage, HRStatusBadge, HRTable, HRTableCell, HRTableRow } from '@/hr/ui';
import { mfgWorkspaceService, type MfgRow } from '@/lib/mfg-workspace-service';

export default function ShopFloorPage() {
  const params = useParams<{ workspace: string }>();
  const workspaceSlug = params?.workspace || 'manufacturing';
  const [rows, setRows] = useState<MfgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await mfgWorkspaceService.list('job-card', { limit: 100 });
      setRows(
        data.rows.filter((row) =>
          ['Open', 'Pending', 'Work In Progress', 'InProgress', 'In Progress', 'On Hold', 'Paused'].includes(
            String(row.status || '')
          )
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load shop floor');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <HRPage>
      <div className="mb-4 flex items-start justify-between gap-4 border-b border-[#e2e2e2] pb-3">
        <div>
          <p className="text-[11px] text-[#7c7c7c]">Manufacturing</p>
          <h1 className="flex items-center gap-2 text-[18px] font-semibold text-[#171717]">
            <Factory className="h-4 w-4 text-[#525252]" />
            Shop Floor
          </h1>
          <p className="mt-0.5 text-[12px] text-[#7c7c7c]">Open job cards for the plant floor</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded border border-[#c7c7c7] bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#171717] hover:bg-[#f3f3f3]"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <HRCard>
        {error && <p className="mb-3 text-sm text-[#e24c4c]">{error}</p>}
        {loading ? (
          <p className="text-sm text-[#7A8FA6]">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-[#7A8FA6]">No open job cards on the shop floor.</p>
        ) : (
          <HRTable columns={['Job Card', 'Operation', 'Workstation', 'Qty', 'Status', '']}>
            {rows.map((row) => (
              <HRTableRow key={String(row.id)}>
                <HRTableCell>{String(row.workOrderNumber || row.id)}</HRTableCell>
                <HRTableCell>{String(row.operationName || '—')}</HRTableCell>
                <HRTableCell>{String(row.workCenterIdLabel || row.workCenterId || '—')}</HRTableCell>
                <HRTableCell>
                  {Number(row.completedQuantity || 0)} / {Number(row.plannedQuantity || 0)}
                </HRTableCell>
                <HRTableCell>
                  <HRStatusBadge status={String(row.status || '')} />
                </HRTableCell>
                <HRTableCell>
                  <Link
                    href={`/manufacturing/${workspaceSlug}/job-card/${row.id}`}
                    className="text-[12px] font-semibold text-[#014582] hover:underline"
                  >
                    Open
                  </Link>
                </HRTableCell>
              </HRTableRow>
            ))}
          </HRTable>
        )}
      </HRCard>
    </HRPage>
  );
}
