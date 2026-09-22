'use client';

import React from 'react';
import { HcmCrudPage } from '../hcm-ui';
import { HRTableCell } from '../ui';
import { hrHcmService } from '@/lib/hr-hcm-service';
import { hrCostCenterService, CostCenter } from '@/lib/hr-cost-center-service';

export default function OrganizationPage() {
  const [tab, setTab] = React.useState<'dept' | 'desig'>('dept');
  const [costCenters, setCostCenters] = React.useState<CostCenter[]>([]);

  React.useEffect(() => {
    hrCostCenterService.list().then(setCostCenters).catch(() => {});
  }, []);

  const costCenterOptions = costCenters
    .filter((c) => c.status === 'active')
    .map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` }));

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
          notice="Each department links to a Cost Center master record. Employee payroll uses the employee's cost center (direct assignment or department default)."
          columns={['Name', 'Cost center', 'Headcount']}
          load={() => hrHcmService.departments()}
          create={(input) => hrHcmService.saveDepartment(input)}
          fields={[
            { key: 'name', label: 'Department name' },
            {
              key: 'costCenterId',
              label: 'Cost center',
              options: costCenterOptions.map((o) => o.label),
              optionValues: costCenterOptions.map((o) => o.value),
            },
          ]}
          rowCells={(r) => (
            <>
              <HRTableCell className="font-bold">{r.name}</HRTableCell>
              <HRTableCell>
                {r.costCenterRef
                  ? `${r.costCenterRef.code} — ${r.costCenterRef.name}`
                  : (r.costCenter || '—')}
              </HRTableCell>
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
