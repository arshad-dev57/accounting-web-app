'use client';

export const dynamic = 'force-dynamic';

import { Image as ImageIcon } from 'lucide-react';
import SettingsPlaceholder from '../_components/SettingsPlaceholder';

export default function ImagesSettingsPage() {
  return (
    <SettingsPlaceholder
      title="Images"
      description="Company logo, letterhead, stamps, and document branding assets."
      icon={<ImageIcon className="w-6 h-6 text-[#014582]" />}
    />
  );
}
