import { redirect } from 'next/navigation';

/** Cost center reports removed from ERPNext HR UX */
export default function LegacyHrRedirect() {
  redirect('/hr/hr-setup');
}
