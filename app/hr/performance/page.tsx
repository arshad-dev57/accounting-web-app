'use client';

import React from 'react';
import { Star, Target } from 'lucide-react';
import { HRPage, HRPageHeader, HRCard, HRStatusBadge, HRTable, HRTableRow, HRTableCell, HRWorkflowNotice, HRAvatar } from '../ui';
import { PERFORMANCE } from '../data';

function Rating({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-1">
      <Star className="w-3.5 h-3.5 text-[#F39C12] fill-[#F39C12]" />
      <span className="font-bold">{value.toFixed(1)}</span>
    </span>
  );
}

export default function PerformancePage() {
  return (
    <HRPage>
      <HRPageHeader
        title="Performance Reviews"
        subtitle="H1 2026 review cycle"
        backHref="/hr/dashboard"
      />

      <HRWorkflowNotice title="Review cycle flow" detail="Employee self-review → manager review → calibration → acknowledgement. Keep goals, feedback, and the final decision together." action={<button className="text-[11px] font-extrabold underline underline-offset-2">Cycle details</button>} />

      <HRCard title="H1 2026 review cycle" action={<span className="text-[10px] font-semibold text-[#7A8FA6]">2 reviews awaiting manager input</span>}>
        <HRTable columns={['Employee', 'Review Period', 'Rating', 'Goals Completed', 'Reviewer', 'Status']}>
          {PERFORMANCE.map((p) => (
            <HRTableRow key={p.employee}>
              <HRTableCell className="font-bold">
                <span className="flex items-center gap-2">
                  <HRAvatar name={p.employee} />
                  {p.employee}
                </span>
              </HRTableCell>
              <HRTableCell>{p.period}</HRTableCell>
              <HRTableCell><Rating value={p.rating} /></HRTableCell>
              <HRTableCell className="font-semibold"><span className="inline-flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-[#0FA3E0]" />{p.goals}</span></HRTableCell>
              <HRTableCell>{p.reviewer}</HRTableCell>
              <HRTableCell><HRStatusBadge status={p.status} /></HRTableCell>
            </HRTableRow>
          ))}
        </HRTable>
      </HRCard>
    </HRPage>
  );
}
