import { redirect } from 'next/navigation';

export default function PayrollProcessingRedirect() {
  redirect('/hr/payroll/payroll-entry');
}
