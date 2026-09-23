'use client';

import { HRPage, HRPageHeader, HRWorkflowNotice } from '../../ui';
import { PayrollSettingsPanel } from '../../components/payroll-settings-panel';

export default function PayrollSettingsPage() {
  return (
    <HRPage>
      <HRPageHeader
        title="Payroll settings"
        subtitle="Salary structure, deductions, commission, and statutory rules"
        backHref="/hr/payroll/dashboard"
      />
      <HRWorkflowNotice
        title="Payroll configuration"
        detail="These rules apply on Calculate payroll. Attendance and working-time rules are under HR Settings."
      />
      <PayrollSettingsPanel section="all" />
    </HRPage>
  );
}
