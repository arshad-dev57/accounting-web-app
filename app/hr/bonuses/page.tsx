import { redirect } from 'next/navigation';

/** Bonuses → Additional Salary */
export default function LegacyHrRedirect() {
  redirect('/hr/payroll/additional-salary');
}
