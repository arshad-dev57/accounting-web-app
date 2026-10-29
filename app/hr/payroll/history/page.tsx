import { redirect } from 'next/navigation';

export default function PayrollHistoryRedirect() {
  redirect('/hr/payroll/salary-slip');
}
