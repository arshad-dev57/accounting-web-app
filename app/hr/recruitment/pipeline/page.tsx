'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { HRCard, HRPage, HRPageHeader, HRStatusBadge } from '../../ui';
import { hrWorkspaceService, type HrRow } from '@/lib/hr-workspace-service';

const STAGES = ['Open', 'Replied', 'Shortlisted', 'Hold', 'Accepted', 'Rejected'] as const;

export default function HiringPipelinePage() {
  const [rows, setRows] = useState<HrRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await hrWorkspaceService.list('job-applicant', { limit: 500 });
      setRows(result.rows || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to load applicants');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byStage = useMemo(() => {
    const map: Record<string, HrRow[]> = Object.fromEntries(STAGES.map((s) => [s, []]));
    for (const row of rows) {
      const status = String(row.status || 'Open');
      if (!map[status]) map[status] = [];
      map[status].push(row);
    }
    return map;
  }, [rows]);

  return (
    <HRPage>
      <HRPageHeader
        title="Hiring Pipeline"
        subtitle="Kanban of Job Applicants by status — same DocType as ERPNext Recruitment."
        actions={
          <Link
            href="/hr/recruitment/job-applicant/new"
            className="rounded bg-[#014582] px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-[#01366a]"
          >
            New Applicant
          </Link>
        }
      />

      {loading ? (
        <p className="text-[13px] text-[#9c9c9c]">Loading pipeline…</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <div key={stage} className="w-64 flex-shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b6b6b]">{stage}</p>
                <span className="text-[11px] text-[#9c9c9c]">{byStage[stage]?.length || 0}</span>
              </div>
              <div className="space-y-2 rounded border border-[#ececec] bg-[#fafafa] p-2 min-h-[320px]">
                {(byStage[stage] || []).map((row) => (
                  <Link key={row.id} href={`/hr/recruitment/job-applicant/${row.id}`}>
                    <HRCard className="!p-3 hover:border-[#cfcfcf]">
                      <p className="truncate text-[13px] font-medium text-[#171717]">
                        {String(row.applicantName || 'Applicant')}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[#6b6b6b]">
                        {String(row.jobTitle || row.jobOpeningIdLabel || '—')}
                      </p>
                      <div className="mt-2">
                        <HRStatusBadge status={String(row.status || stage)} />
                      </div>
                    </HRCard>
                  </Link>
                ))}
                {!byStage[stage]?.length && (
                  <p className="px-1 py-6 text-center text-[11px] text-[#b0b0b0]">No applicants</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </HRPage>
  );
}
