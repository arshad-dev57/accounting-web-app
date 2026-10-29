import { redirect } from 'next/navigation';

/** Reviews → Appraisal */
export default function LegacyHrRedirect() {
  redirect('/hr/performance/appraisal');
}
