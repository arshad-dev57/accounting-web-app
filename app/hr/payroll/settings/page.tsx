import { redirect } from 'next/navigation';

/** Legacy payroll settings URL → ERPNext Payroll Settings DocType. */
export default function LegacyPayrollSettingsRedirect() {
  redirect('/hr/payroll/payroll-settings');
}
