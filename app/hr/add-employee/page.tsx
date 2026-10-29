import { redirect } from 'next/navigation';

/** Add Employee → new Employee */
export default function LegacyHrRedirect() {
  redirect('/hr/hr-setup/employee/new');
}
