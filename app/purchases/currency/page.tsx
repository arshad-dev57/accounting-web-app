import { redirect } from 'next/navigation';

/** Currency settings live in main Settings. */
export default function PurchasesCurrencyRedirect() {
  redirect('/settings/currency');
}

export function PurchasesCurrencyPage() {
  return null;
}
