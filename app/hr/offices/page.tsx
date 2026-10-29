import { redirect } from 'next/navigation';

/** Branch replaces the legacy offices screen. */
export default function OfficesRedirect() {
  redirect('/hr/hr-setup/branch');
}
