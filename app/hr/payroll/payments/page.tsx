import { redirect } from 'next/navigation';

export default function PayrollPaymentsRedirect() {
  redirect('/hr/payroll/payroll-entry');
}
