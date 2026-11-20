'use client';

export const dynamic = 'force-dynamic';

import { Building2 } from 'lucide-react';
import SettingsPlaceholder from '../_components/SettingsPlaceholder';

export default function CompanyInfoSettingsPage() {
  return (
    <SettingsPlaceholder
      title="Company Info"
      description="Legal name, address, tax IDs, and company contact details."
      icon={<Building2 className="w-6 h-6 text-[#014582]" />}
    />
  );
}
