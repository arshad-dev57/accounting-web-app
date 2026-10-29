import { redirect } from 'next/navigation';

/** Calendar → Shift & Attendance */
export default function LegacyHrRedirect() {
  redirect('/hr/shift-and-attendance');
}
