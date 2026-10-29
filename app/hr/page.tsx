export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

/** ERPNext HR lands on the HR Setup workspace home, not a custom dashboard. */
export default function HRIndex() {
  redirect('/hr/hr-setup');
}
