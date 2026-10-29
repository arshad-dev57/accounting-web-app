import { redirect } from 'next/navigation';

// Holiday maintenance lives in the Leaves workspace, where the screen is
// generated from the backend Holiday List descriptor.
export default function HolidaysRedirect() {
  redirect('/hr/leaves/holiday-list');
}
