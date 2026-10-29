'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { HRCard, HRPage, HRPageHeader, HRStatusBadge, HRTable, HRTableCell, HRTableRow } from '../../ui';
import { hrWorkspaceService, type HrRow } from '@/lib/hr-workspace-service';

export default function JobPortalPage() {
  const [rows, setRows] = useState<HrRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await hrWorkspaceService.list('job-opening', { limit: 200 });
      const openings = (result.rows || []).filter((row) => {
        const status = String(row.status || '').toLowerCase();
        const published = row.publish === true || row.published === true || String(row.publish) === 'true';
        return published || status === 'open' || !status;
      });
      setRows(openings.length ? openings : result.rows || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to load job openings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <HRPage>
      <HRPageHeader
        title="Job Portal"
        subtitle="Published Job Openings from the Recruitment workspace."
        actions={
          <Link
            href="/hr/recruitment/job-opening/new"
            className="rounded bg-[#014582] px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-[#01366a]"
          >
            New Job Opening
          </Link>
        }
      />

      <HRCard className="!p-0 overflow-hidden">
        {loading ? (
          <p className="p-4 text-[13px] text-[#9c9c9c]">Loading openings…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-center text-[13px] text-[#9c9c9c]">No job openings yet.</p>
        ) : (
          <HRTable columns={['Job Title', 'Department', 'Designation', 'Status', '']}>
            {rows.map((row) => (
              <HRTableRow key={row.id}>
                <HRTableCell>
                  <Link href={`/hr/recruitment/job-opening/${row.id}`} className="font-medium text-[#171717] hover:underline">
                    {String(row.jobTitle || row.designation || 'Opening')}
                  </Link>
                </HRTableCell>
                <HRTableCell>{String(row.departmentIdLabel || row.department || '—')}</HRTableCell>
                <HRTableCell>{String(row.designationIdLabel || row.designation || '—')}</HRTableCell>
                <HRTableCell>
                  <HRStatusBadge status={String(row.status || 'Open')} />
                </HRTableCell>
                <HRTableCell>
                  <Link href={`/hr/recruitment/job-applicant/new`} className="text-[12px] text-[#014582] hover:underline">
                    Apply
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
