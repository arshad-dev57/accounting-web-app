import { redirect } from 'next/navigation';

/** Employees list → Employee DocType */
export default function LegacyHrRedirect() {
  redirect('/hr/hr-setup/employee');
}
