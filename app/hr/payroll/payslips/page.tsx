import { redirect } from 'next/navigation';

/** Salary Slip is the ERPNext DocType list/form. */
export default function PayslipsRedirect() {
  redirect('/hr/payroll/salary-slip');
}
