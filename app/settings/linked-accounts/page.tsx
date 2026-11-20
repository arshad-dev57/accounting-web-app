'use client';

export const dynamic = 'force-dynamic';

import { Link2 } from 'lucide-react';
import SettingsPlaceholder from '../_components/SettingsPlaceholder';

export default function LinkedAccountsSettingsPage() {
  return (
    <SettingsPlaceholder
      title="Linked Accounts"
      description="Map document types to posting accounts and clearing accounts."
      icon={<Link2 className="w-6 h-6 text-[#014582]" />}
    />
  );
}
