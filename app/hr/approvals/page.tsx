import { redirect } from 'next/navigation';

/** Approvals → Leave Application */
export default function LegacyHrRedirect() {
  redirect('/hr/leaves/leave-application');
}
