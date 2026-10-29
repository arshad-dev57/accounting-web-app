import { redirect } from 'next/navigation';

/** Legacy HR reports hub → HR Setup */
export default function LegacyHrRedirect() {
  redirect('/hr/hr-setup');
}
