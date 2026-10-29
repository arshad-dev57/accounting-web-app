export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

export default function LegacyManufacturingRedirect() {
  redirect('/manufacturing/manufacturing/routing/new');
}
