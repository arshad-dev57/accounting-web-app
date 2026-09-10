'use client';

import { HcmCrudPage } from '../hcm-ui';
import { HRTableCell, HRStatusBadge } from '../ui';
import { hrHcmService } from '@/lib/hr-hcm-service';
import { hrEmployeesService } from '@/lib/hr-employees-service';
import React from 'react';

export default function LifecyclePage() {
  const [employees, setEmployees] = React.useState<any[]>([]);
  React.useEffect(() => {
    hrEmployeesService.list().then(setEmployees).catch(() => {});
  }, []);
  const names = employees.map((e) => `${e.id}|${e.name}`);
  return (
    <HcmCrudPage
      title="Employee lifecycle"
      subtitle="Onboarding · transfer · promotion · salary revision · exit"
      notice="Lifecycle events update the existing employee record (department, designation, salary, status). Attendance auto check-in/out is not changed."
      columns={['Employee', 'Event', 'From', 'To', 'Effective']}
      load={() => hrHcmService.lifecycle()}
      create={async (input) => {
        const [employeeId] = String(input.employeeId || '').split('|');
        return hrHcmService.saveLifecycle({ ...input, employeeId, toValue: input.toValue, type: input.type });
      }}
      fields={[
        { key: 'employeeId', label: 'Employee', options: names },
        { key: 'type', label: 'Event type', options: ['onboarding', 'transfer_department', 'transfer_branch', 'promotion', 'salary_revision', 'resignation', 'termination', 'offboarding'] },
        { key: 'fromValue', label: 'From' },
        { key: 'toValue', label: 'To / new value' },
        { key: 'effective', label: 'Effective date', type: 'date' },
        { key: 'notes', label: 'Notes' },
      ]}
      rowCells={(r) => (
        <>
          <HRTableCell className="font-bold">{r.employee}</HRTableCell>
          <HRTableCell><HRStatusBadge status={r.type} /></HRTableCell>
          <HRTableCell>{r.fromValue || '—'}</HRTableCell>
          <HRTableCell>{r.toValue || '—'}</HRTableCell>
          <HRTableCell>{r.effective || '—'}</HRTableCell>
        </>
      )}
    />
  );
}
