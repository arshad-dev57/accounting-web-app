import { redirect } from 'next/navigation';

/** Tasks removed from ERPNext HR UX */
export default function LegacyHrRedirect() {
  redirect('/hr/hr-setup');
}
