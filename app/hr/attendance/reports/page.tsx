import { redirect } from 'next/navigation';

/** Attendance reports → Monthly Attendance Sheet */
export default function LegacyHrRedirect() {
  redirect('/hr/shift-and-attendance/report/monthly-attendance-sheet');
}
