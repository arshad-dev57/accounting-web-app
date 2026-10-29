import { redirect } from 'next/navigation';

/** Loans → Employee Advance */
export default function LegacyHrRedirect() {
  redirect('/hr/expenses/employee-advance');
}
