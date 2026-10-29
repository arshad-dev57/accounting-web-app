import { redirect } from 'next/navigation';

/** Payroll Entry is the ERPNext DocType, not the legacy run workspace. */
export default function PayrollRunRedirect() {
  redirect('/hr/payroll/payroll-entry');
}
