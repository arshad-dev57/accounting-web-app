import { redirect } from 'next/navigation';

/** HR notifications removed from ERPNext HR UX */
export default function LegacyHrRedirect() {
  redirect('/hr/hr-setup');
}
