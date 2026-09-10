'use client';

import React from 'react';
import toast from 'react-hot-toast';
import { HcmCrudPage } from '../hcm-ui';
import { HRTableCell, HRStatusBadge } from '../ui';
import { hrHcmService } from '@/lib/hr-hcm-service';
import { hrEmployeesService } from '@/lib/hr-employees-service';

export default function BonusesPage() {
  const [employees, setEmployees] = React.useState<any[]>([]);
  React.useEffect(() => { hrEmployeesService.list().then(setEmployees).catch(() => {}); }, []);
  const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  return (
    <HcmCrudPage
      title="Bonuses & incentives"
      subtitle="Performance, sales, attendance and special awards"
      notice="Approved bonuses for the payroll period are included when you process the existing pay run."
      columns={['Employee', 'Kind', 'Amount', 'Period', 'Status', '']}
      load={() => hrHcmService.bonuses()}
      create={async (input) => hrHcmService.saveBonus({ ...input, employeeId: String(input.employeeId).split('|')[0], period: input.period || period })}
      fields={[
        { key: 'employeeId', label: 'Employee', options: employees.map((e) => `${e.id}|${e.name}`) },
        { key: 'kind', label: 'Kind', options: ['performance', 'sales', 'attendance', 'target', 'special'] },
        { key: 'amount', label: 'Amount', type: 'number' },
        { key: 'period', label: 'Payroll period (YYYY-MM)' },
        { key: 'reason', label: 'Reason' },
      ]}
      rowCells={(r) => (
        <>
          <HRTableCell className="font-bold">{r.employee}</HRTableCell>
          <HRTableCell>{r.kind}</HRTableCell>
          <HRTableCell>{r.amount}</HRTableCell>
          <HRTableCell>{r.period}</HRTableCell>
          <HRTableCell><HRStatusBadge status={r.status} /></HRTableCell>
          <HRTableCell>
            {r.status === 'Pending' && (
              <button type="button" className="text-[11px] font-bold text-[#014582]" onClick={async () => {
                try { await hrHcmService.updateBonus(r.id, 'Approved'); toast.success('Approved'); } catch (e: any) { toast.error(e.message); }
              }}>Approve</button>
            )}
          </HRTableCell>
        </>
      )}
    />
  );
}
