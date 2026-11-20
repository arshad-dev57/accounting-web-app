'use client';

export const dynamic = 'force-dynamic';

import { UserCircle } from 'lucide-react';
import SettingsPlaceholder from '../_components/SettingsPlaceholder';

export default function AccountSettingsPage() {
  return (
    <SettingsPlaceholder
      title="Account"
      description="Default ledger accounts used across sales, purchases, and inventory."
      icon={<UserCircle className="w-6 h-6 text-[#014582]" />}
    />
  );
}
