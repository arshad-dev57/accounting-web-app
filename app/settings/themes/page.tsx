'use client';

import React from 'react';
import { Check, LayoutPanelLeft, PanelTop } from 'lucide-react';
import { useNavLayout, type NavLayoutMode } from '../../../lib/nav-layout-preference';

const OPTIONS: {
  id: NavLayoutMode;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'sidebar',
    title: 'Sidebar',
    description: 'Classic left navigation on every module. Collapse it when you need more space.',
    icon: <LayoutPanelLeft className="h-7 w-7" />
  },
  {
    id: 'topbar',
    title: 'Top bar',
    description: 'Navigation moves to the top with dropdown menus — same look across all modules.',
    icon: <PanelTop className="h-7 w-7" />
  }
];

export default function ThemesSettingsPage() {
  const { layout, setLayout } = useNavLayout();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Themes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose how module navigation appears. Your choice applies across Accounting, Sales, HR,
          CRM, and every other module.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const selected = layout === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setLayout(option.id)}
              className={[
                'relative flex flex-col items-start gap-3 rounded-2xl border-2 p-5 text-left transition-all',
                selected
                  ? 'border-[#014582] bg-[#014582]/5 shadow-md shadow-[#014582]/10'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              ].join(' ')}
            >
              {selected && (
                <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#014582] text-white">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              )}
              <span
                className={[
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  selected ? 'bg-[#014582] text-white' : 'bg-gray-100 text-gray-600'
                ].join(' ')}
              >
                {option.icon}
              </span>
              <div>
                <p className="text-base font-semibold text-gray-900">{option.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{option.description}</p>
              </div>
              <div
                className={[
                  'mt-1 w-full overflow-hidden rounded-lg border',
                  selected ? 'border-[#014582]/30' : 'border-gray-200'
                ].join(' ')}
              >
                {option.id === 'sidebar' ? (
                  <div className="flex h-20 bg-gray-50">
                    <div className="w-10 bg-[#00274d]" />
                    <div className="flex flex-1 flex-col">
                      <div className="h-5 border-b border-gray-200 bg-white" />
                      <div className="flex-1 p-2">
                        <div className="h-full rounded bg-white border border-gray-100" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-20 flex-col bg-gray-50">
                    <div className="h-5 border-b border-gray-200 bg-white" />
                    <div className="flex h-5 items-center gap-1 border-b border-gray-200 bg-white px-2">
                      <span className="h-2 w-8 rounded-full bg-[#014582]" />
                      <span className="h-2 w-8 rounded-full bg-gray-200" />
                      <span className="h-2 w-8 rounded-full bg-gray-200" />
                    </div>
                    <div className="flex-1 p-2">
                      <div className="h-full rounded bg-white border border-gray-100" />
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400">
        Preference is saved in this browser and takes effect immediately — open any module to see
        the new layout.
      </p>
    </div>
  );
}
