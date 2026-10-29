import { redirect } from 'next/navigation';

/** Legacy HR dashboard replaced by HR Setup workspace */
export default function LegacyHrRedirect() {
  redirect('/hr/hr-setup');
}
