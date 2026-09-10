'use client';

import React from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { HRPage, HRPageHeader, HRCard, HRTable, HRTableRow, HRTableCell, HRStatusBadge, HRWorkflowNotice } from '../ui';
import { hrHcmService } from '@/lib/hr-hcm-service';

export default function ApprovalsPage() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = async () => {
    setLoading(true);
    try { setRows(await hrHcmService.approvals()); }
    catch (e: any) { toast.error(e.message || 'Failed to load'); }
    finally { setLoading(false); }
  };
  React.useEffect(() => { void load(); }, []);

  return (
    <HRPage>
      <HRPageHeader title="Approval inbox" subtitle="Leave, overtime, attendance, loans and bonuses" backHref="/hr/dashboard" />
      <HRWorkflowNotice title="Configurable queue" detail="Requests from employees and managers land here. Approving a record still uses the existing leave/overtime/payroll screens where those already exist." />
      <HRCard title="Pending and recent">
        {loading ? <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div> : (
          <HRTable columns={['Module', 'Title', 'Status', '']}>
            {rows.map((r) => (
              <HRTableRow key={r.id}>
                <HRTableCell className="font-bold">{r.module}</HRTableCell>
                <HRTableCell>{r.title}</HRTableCell>
                <HRTableCell><HRStatusBadge status={r.status} /></HRTableCell>
                <HRTableCell>
                  {r.status === 'Pending' && (
                    <button type="button" className="text-[11px] font-bold text-[#014582]" onClick={async () => {
                      await hrHcmService.updateApproval(r.id, 'Approved');
                      toast.success('Approved');
                      load();
                    }}>Approve</button>
                  )}
                </HRTableCell>
              </HRTableRow>
            ))}
          </HRTable>
        )}
      </HRCard>
    </HRPage>
  );
}
