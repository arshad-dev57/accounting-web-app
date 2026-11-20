'use client';

import type { ReactNode } from 'react';
import { Construction } from 'lucide-react';

export default function SettingsPlaceholder({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          {icon}
          {title}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>

      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
        <Construction className="w-10 h-10 mx-auto text-[#014582]/50 mb-3" />
        <p className="text-sm font-semibold text-gray-800">Coming next</p>
        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
          This settings section is ready in the sidebar. We&apos;ll wire the full form and API on
          the next pass — same pattern as Document Numbering.
        </p>
      </div>
    </div>
  );
}
