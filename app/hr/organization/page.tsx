'use client';

import React from 'react';
import { HcmCrudPage, HRStatusBadge } from '../hcm-ui';
import { HRTableCell } from '../ui';
import { hrHcmService } from '@/lib/hr-hcm-service';

export default function OrganizationPage() {
  const [tab, setTab] = React.useState<'dept' | 'desig'>('dept');
  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 pt-4 flex gap-2">
        <button type="button" onClick={() => setTab('dept')} className={`px-4 py-2 rounded-xl text-xs font-bold ${tab === 'dept' ? 'bg-[#014582] text-white' : 'bg-white border border-[#DDE4EE] text-[#7A8FA6]'}`}>Departments</button>
        <button type="button" onClick={() => setTab('desig')} className={`px-4 py-2 rounded-xl text-xs font-bold ${tab === 'desig' ? 'bg-[#014582] text-white' : 'bg-white border border-[#DDE4EE] text-[#7A8FA6]'}`}>Designations</button>
      </div>
      {tab === 'dept' ? (
        <HcmCrudPage
          title="Departments"
          subtitle="Organization structure · cost centers · reporting units"
          notice="Employee department remains the existing text field on the profile. This catalog standardizes names, sub-departments and cost centers without replacing current employee records."
          columns={['Name', 'Cost center', 'Headcount']}
          load={() => hrHcmService.departments()}
          create={(input) => hrHcmService.saveDepartment(input)}
          fields={[
            { key: 'name', label: 'Department name' },
            { key: 'costCenter', label: 'Cost center' },
          ]}
          rowCells={(r) => (
            <>
              <HRTableCell className="font-bold">{r.name}</HRTableCell>
              <HRTableCell>{r.costCenter || '—'}</HRTableCell>
              <HRTableCell>{r.headcount || 0}</HRTableCell>
            </>
          )}
        />
      ) : (
        <HcmCrudPage
          title="Designations"
          subtitle="Job titles and levels"
          notice="Designation catalog feeds promotions and the employee profile. Existing designation strings stay valid."
          columns={['Name', 'Level']}
          load={() => hrHcmService.designations()}
          create={(input) => hrHcmService.saveDesignation(input)}
          fields={[
            { key: 'name', label: 'Designation' },
            { key: 'level', label: 'Level', type: 'number' },
          ]}
          rowCells={(r) => (
            <>
              <HRTableCell className="font-bold">{r.name}</HRTableCell>
              <HRTableCell>{r.level}</HRTableCell>
            </>
          )}
        />
      )}
    </div>
  );
}
