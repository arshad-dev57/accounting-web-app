import { redirect } from 'next/navigation';

/** Salary Register is the ERPNext payroll report. */
export default function PayRegisterRedirect() {
  redirect('/hr/payroll/report/salary-register');
}
