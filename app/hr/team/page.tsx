import { redirect } from 'next/navigation';

/** My Team → Employee */
export default function LegacyHrRedirect() {
  redirect('/hr/hr-setup/employee');
}
