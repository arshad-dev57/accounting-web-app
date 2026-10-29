import { redirect } from 'next/navigation';

/** Payroll reports → Salary Register */
export default function LegacyHrRedirect() {
  redirect('/hr/payroll/pay-register');
}
