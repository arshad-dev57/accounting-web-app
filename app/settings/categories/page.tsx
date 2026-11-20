'use client';

export const dynamic = 'force-dynamic';

import { Tags } from 'lucide-react';
import SettingsPlaceholder from '../_components/SettingsPlaceholder';

export default function CategoriesSettingsPage() {
  return (
    <SettingsPlaceholder
      title="Categories"
      description="Product and expense categories used across the company."
      icon={<Tags className="w-6 h-6 text-[#014582]" />}
    />
  );
}
