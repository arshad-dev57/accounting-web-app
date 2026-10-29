import { redirect } from 'next/navigation';

// Shift management lives in the Shift & Attendance workspace now, where the
// screen is generated from the backend Shift Type descriptor.
export default function ShiftsRedirect() {
  redirect('/hr/shift-and-attendance/shift-type');
}
