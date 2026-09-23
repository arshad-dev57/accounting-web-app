'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { HRPage, HRPageHeader, HRWorkflowNotice } from '../../ui';
import { PayrollSettingsPanel } from '../../components/payroll-settings-panel';

export default function SalaryStructuresPage() {
  return (
    <HRPage>
      <HRPageHeader
        title="Salary structures"
        subtitle="Package split percentages and statutory deductions"
        backHref="/hr/payroll/dashboard"
        actions={
          <Link
            href="/hr/settings/payroll"
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-xs font-bold"
          >
            All payroll settings <ExternalLink className="w-3 h-3" />
          </Link>
        }
      />
      <HRWorkflowNotice
        title="How salary is structured"
        detail="Employee package salary is split into basic, house, transport, and medical allowances. Tax, EOBI, and PF are computed from these on payroll Calculate."
      />
      <PayrollSettingsPanel section="salary-structure" />
    </HRPage>
  );
}
