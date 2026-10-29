import { redirect } from 'next/navigation';

/** Payroll Settings is the ERPNext DocType under Payroll setup. */
export default function PayrollSettingsRedirect() {
  redirect('/hr/payroll/payroll-settings');
}
