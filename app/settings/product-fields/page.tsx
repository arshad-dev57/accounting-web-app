'use client';

export const dynamic = 'force-dynamic';

import { SlidersHorizontal } from 'lucide-react';
import SettingsPlaceholder from '../_components/SettingsPlaceholder';

export default function ProductFieldsSettingsPage() {
  return (
    <SettingsPlaceholder
      title="Product Fields"
      description="Custom product attributes and field visibility on forms."
      icon={<SlidersHorizontal className="w-6 h-6 text-[#014582]" />}
    />
  );
}
