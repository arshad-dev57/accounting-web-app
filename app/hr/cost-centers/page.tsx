import { redirect } from 'next/navigation';

/** Cost centers removed from ERPNext HR UX */
export default function LegacyHrRedirect() {
  redirect('/hr/hr-setup');
}
