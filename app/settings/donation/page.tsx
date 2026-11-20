'use client';

export const dynamic = 'force-dynamic';

import { HeartHandshake } from 'lucide-react';
import SettingsPlaceholder from '../_components/SettingsPlaceholder';

export default function DonationSettingsPage() {
  return (
    <SettingsPlaceholder
      title="Donation / Charity"
      description="Donation accounts, receipts, and charity-related preferences."
      icon={<HeartHandshake className="w-6 h-6 text-[#014582]" />}
    />
  );
}
