import { redirect } from 'next/navigation';

export default function AccountingCurrenciesRedirect() {
  redirect('/settings/currency');
}
