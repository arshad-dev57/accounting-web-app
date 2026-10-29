import { redirect } from 'next/navigation';

/** HR documents vault → Employee */
export default function LegacyHrRedirect() {
  redirect('/hr/hr-setup/employee');
}
