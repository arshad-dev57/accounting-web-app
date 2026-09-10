'use client';

import React from 'react';
import toast from 'react-hot-toast';
import { HcmCrudPage } from '../hcm-ui';
import { HRTableCell, HRStatusBadge } from '../ui';
import { hrHcmService } from '@/lib/hr-hcm-service';
import { hrEmployeesService } from '@/lib/hr-employees-service';

export default function LoansPage() {
  const [employees, setEmployees] = React.useState<any[]>([]);
  React.useEffect(() => { hrEmployeesService.list().then(setEmployees).catch(() => {}); }, []);
  return (
    <HcmCrudPage
      title="Loans & salary advances"
      subtitle="Requests · installments · payroll deduction"
      notice="Approved loans feed the existing payroll engine as monthly loan recovery. Payslips and pay-run workflow are unchanged."
      columns={['Employee', 'Kind', 'Amount', 'Remaining', 'Status', '']}
      load={() => hrHcmService.loans()}
      create={async (input) => hrHcmService.saveLoan({ ...input, employeeId: String(input.employeeId).split('|')[0] })}
      fields={[
        { key: 'employeeId', label: 'Employee', options: employees.map((e) => `${e.id}|${e.name}`) },
        { key: 'kind', label: 'Kind', options: ['loan', 'advance'] },
        { key: 'amount', label: 'Amount', type: 'number' },
        { key: 'installments', label: 'Installments', type: 'number' },
        { key: 'reason', label: 'Reason' },
      ]}
      rowCells={(r) => (
        <>
          <HRTableCell className="font-bold">{r.employee}</HRTableCell>
          <HRTableCell>{r.kind}</HRTableCell>
          <HRTableCell>{r.amount}</HRTableCell>
          <HRTableCell>{r.remaining}</HRTableCell>
          <HRTableCell><HRStatusBadge status={r.status} /></HRTableCell>
          <HRTableCell>
            {r.status === 'Pending' && (
              <button type="button" className="text-[11px] font-bold text-[#014582]" onClick={async () => {
                try { await hrHcmService.updateLoan(r.id, 'Approved'); toast.success('Approved'); } catch (e: any) { toast.error(e.message); }
              }}>Approve</button>
            )}
          </HRTableCell>
        </>
      )}
    />
  );
}
