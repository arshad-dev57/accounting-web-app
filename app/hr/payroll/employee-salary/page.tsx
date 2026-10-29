import { redirect } from 'next/navigation';

/** Employee salary → Salary Structure Assignment */
export default function LegacyHrRedirect() {
  redirect('/hr/payroll/salary-structure-assignment');
}
