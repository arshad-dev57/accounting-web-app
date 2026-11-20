'use client';

export const dynamic = 'force-dynamic';

import { Package } from 'lucide-react';
import SettingsPlaceholder from '../_components/SettingsPlaceholder';

export default function StockSettingsPage() {
  return (
    <SettingsPlaceholder
      title="Stock"
      description="Negative stock rules, valuation method, and warehouse defaults."
      icon={<Package className="w-6 h-6 text-[#014582]" />}
    />
  );
}
