import { redirect } from 'next/navigation';

/** Shift plans → Shift Schedule */
export default function LegacyHrRedirect() {
  redirect('/hr/shift-and-attendance/shift-schedule');
}
