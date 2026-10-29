import { redirect } from 'next/navigation';

/** Roster is Shift Assignment in ERPNext Shift & Attendance. */
export default function RosterRedirect() {
  redirect('/hr/shift-and-attendance/shift-assignment');
}
