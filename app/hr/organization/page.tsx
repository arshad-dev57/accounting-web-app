import { redirect } from 'next/navigation';

/** Organization → Department */
export default function LegacyHrRedirect() {
  redirect('/hr/hr-setup/department');
}
