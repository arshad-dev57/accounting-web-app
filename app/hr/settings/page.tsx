import { redirect } from 'next/navigation';

/** HR Settings is the ERPNext single DocType, not the legacy toggle screen. */
export default function HrSettingsRedirect() {
  redirect('/hr/hr-setup/hr-settings');
}
