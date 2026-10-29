import { redirect } from 'next/navigation';

/** Leave inbox → Leave Application */
export default function LegacyHrRedirect() {
  redirect('/hr/leaves/leave-application');
}
