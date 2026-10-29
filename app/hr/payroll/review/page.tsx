import { redirect } from 'next/navigation';

export default function PayrollReviewRedirect() {
  redirect('/hr/payroll/payroll-entry');
}
