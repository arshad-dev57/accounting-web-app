import { redirect } from 'next/navigation';

/** Leave policies → Leave Policy */
export default function LegacyHrRedirect() {
  redirect('/hr/leaves/leave-policy');
}
