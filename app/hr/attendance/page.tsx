import { redirect } from 'next/navigation';

/** Attendance list is the ERPNext Attendance DocType, not a custom calendar. */
export default function AttendanceRedirect() {
  redirect('/hr/shift-and-attendance/attendance');
}
