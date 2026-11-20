import { redirect } from 'next/navigation';

/** Currency settings live in main Settings. */
export default function SalesCurrencyRedirect() {
  redirect('/settings/currency');
}

/** Keep registry import name working if referenced. */
export function SalesCurrencyPage() {
  return null;
}
