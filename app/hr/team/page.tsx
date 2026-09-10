'use client';

import React from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { HRPage, HRPageHeader, HRCard, HRTable, HRTableRow, HRTableCell, HRWorkflowNotice, HRStatCard } from '../ui';
import { hrHcmService } from '@/lib/hr-hcm-service';
import { Users } from 'lucide-react';

export default function TeamPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    hrHcmService.team().then(setData).catch((e) => toast.error(e.message || 'Failed')).finally(() => setLoading(false));
  }, []);
  const members = data?.members || [];
  const approvals = data?.approvals || {};

  return (
    <HRPage>
      <HRPageHeader title="My Team" subtitle="Direct reports, attendance and pending approvals" backHref="/hr/dashboard" />
      <HRWorkflowNotice title="Manager workspace" detail="If the signed-in user is set as reporting manager on employee profiles, this list is scoped to those reports. Otherwise HR sees the wider roster. Salary is hidden from managers who are not HR/payroll." />
      {loading ? <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <HRStatCard label="Team members" value={members.length} icon={Users} color="#014582" />
            <HRStatCard label="Leave pending" value={(approvals.leaves || []).length} icon={Users} color="#F39C12" />
            <HRStatCard label="OT pending" value={(approvals.overtime || []).length} icon={Users} color="#8E44AD" />
            <HRStatCard label="Attendance pending" value={(approvals.attendance || []).length} icon={Users} color="#E74C3C" />
          </div>
          <HRCard title="Team attendance today">
            <HRTable columns={['Employee', 'Department', 'Check-in', 'Status']}>
              {members.map((m: any) => (
                <HRTableRow key={m.id}>
                  <HRTableCell className="font-bold">{m.name}</HRTableCell>
                  <HRTableCell>{m.department || '—'}</HRTableCell>
                  <HRTableCell>{m.attendance?.checkIn ? new Date(m.attendance.checkIn).toLocaleTimeString() : '—'}</HRTableCell>
                  <HRTableCell>{m.attendance?.status || 'Absent'}</HRTableCell>
                </HRTableRow>
              ))}
            </HRTable>
          </HRCard>
        </>
      )}
    </HRPage>
  );
}
