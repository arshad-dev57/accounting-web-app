'use client';

import { HcmCrudPage } from '../hcm-ui';
import { HRTableCell } from '../ui';
import { hrHcmService } from '@/lib/hr-hcm-service';

export default function LeavePoliciesPage() {
  return (
    <HcmCrudPage
      title="Leave types & policies"
      subtitle="Quotas, carry forward and encashment"
      notice="Existing Apply Leave still works with free-text types. These policies drive leave balances on the employee dossier and ESS."
      columns={['Name', 'Quota', 'Paid', 'Carry', 'Encash']}
      load={() => hrHcmService.leaveTypes()}
      create={(input) => hrHcmService.saveLeaveType(input)}
      fields={[
        { key: 'name', label: 'Leave type name' },
        { key: 'annualQuota', label: 'Annual quota', type: 'number' },
        { key: 'unit', label: 'Unit', options: ['day', 'hour'] },
      ]}
      rowCells={(r) => (
        <>
          <HRTableCell className="font-bold">{r.name}</HRTableCell>
          <HRTableCell>{r.annualQuota}</HRTableCell>
          <HRTableCell>{r.paid ? 'Paid' : 'Unpaid'}</HRTableCell>
          <HRTableCell>{r.carryForward ? 'Yes' : 'No'}</HRTableCell>
          <HRTableCell>{r.encashable ? 'Yes' : 'No'}</HRTableCell>
        </>
      )}
    />
  );
}
