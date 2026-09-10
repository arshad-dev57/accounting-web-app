'use client';

import React from 'react';
import { HcmCrudPage } from '../hcm-ui';
import { HRTableCell } from '../ui';
import { hrHcmService } from '@/lib/hr-hcm-service';
import { hrEmployeesService } from '@/lib/hr-employees-service';

export default function DocumentsPage() {
  const [employees, setEmployees] = React.useState<any[]>([]);
  React.useEffect(() => { hrEmployeesService.list().then(setEmployees).catch(() => {}); }, []);
  return (
    <HcmCrudPage
      title="HR documents"
      subtitle="Contracts, policies and expiry tracking"
      notice="Store document titles and expiry dates only. Do not upload unnecessary sensitive files. Expiry dates appear on the employee dossier."
      columns={['Title', 'Category', 'Employee', 'Expires']}
      load={() => hrHcmService.documents()}
      create={async (input) => hrHcmService.saveDocument({ ...input, employeeId: String(input.employeeId || '').split('|')[0] || null })}
      fields={[
        { key: 'title', label: 'Title' },
        { key: 'category', label: 'Category', options: ['Contract', 'Offer letter', 'Certificate', 'Policy', 'HR', 'Company'] },
        { key: 'employeeId', label: 'Employee (optional)', options: employees.map((e) => `${e.id}|${e.name}`) },
        { key: 'reference', label: 'Reference' },
        { key: 'expiresAt', label: 'Expiry date', type: 'date' },
      ]}
      rowCells={(r) => (
        <>
          <HRTableCell className="font-bold">{r.title}</HRTableCell>
          <HRTableCell>{r.category}</HRTableCell>
          <HRTableCell>{r.employee}</HRTableCell>
          <HRTableCell>{r.expiresAt || '—'}</HRTableCell>
        </>
      )}
    />
  );
}
