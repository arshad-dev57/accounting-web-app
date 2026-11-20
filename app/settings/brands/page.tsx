import { redirect } from 'next/navigation';

/** Brands live in Inventory — keep Settings nav link working. */
export default function BrandsSettingsPage() {
  redirect('/warehouse/brands');
}
