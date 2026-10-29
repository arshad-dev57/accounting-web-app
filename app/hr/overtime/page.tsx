import { redirect } from 'next/navigation';

/** Overtime → Overtime Slip */
export default function LegacyHrRedirect() {
  redirect('/hr/shift-and-attendance/overtime-slip');
}
