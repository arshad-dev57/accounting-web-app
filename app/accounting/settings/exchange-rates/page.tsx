import { redirect } from 'next/navigation';

export default function AccountingExchangeRatesRedirect() {
  redirect('/settings/currency');
}
