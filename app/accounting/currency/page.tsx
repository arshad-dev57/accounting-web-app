import { redirect } from 'next/navigation';

/** Currency settings moved to main Settings module. */
export default function AccountingCurrencyRedirect() {
  redirect('/settings/currency');
}
