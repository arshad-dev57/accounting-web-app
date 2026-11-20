import { redirect } from 'next/navigation';

/** PDF report settings moved to main Settings module. */
export default function AccountingPdfReportsRedirect() {
  redirect('/settings/pdf-reports');
}
