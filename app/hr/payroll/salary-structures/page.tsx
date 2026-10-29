import { redirect } from 'next/navigation';

/** Salary structures → Salary Structure */
export default function LegacyHrRedirect() {
  redirect('/hr/payroll/salary-structure');
}
