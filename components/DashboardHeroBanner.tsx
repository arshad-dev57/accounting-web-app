'use client';

import type { ReactNode } from 'react';

type DashboardHeroBannerProps = {
  badge?: string;
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
};

/**
 * Distributor-hub style page hero used on module dashboards.
 */
export default function DashboardHeroBanner({
  badge = 'Live ERP',
  eyebrow = 'Real-time sync',
  title,
  subtitle,
  actions,
  children,
}: DashboardHeroBannerProps) {
  return (
    <div className="bg-gradient-to-r from-[#00274d] via-[#014582] to-blue-700 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {badge ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 uppercase tracking-wider">
              {badge}
            </span>
          ) : null}
          {eyebrow ? <span className="text-xs text-white/70">{eyebrow}</span> : null}
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle ? (
          <div className="text-xs text-white/80 mt-1 max-w-2xl">{subtitle}</div>
        ) : null}
        {children}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      ) : null}
    </div>
  );
}

/** Period / action chip styles that sit on the dark hero. */
export function heroChipClass(active: boolean) {
  return [
    'px-3.5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed',
    active
      ? 'bg-white text-[#014582] shadow-md'
      : 'bg-white/10 text-white border border-white/20 hover:bg-white/20',
  ].join(' ');
}

export function heroIconBtnClass() {
  return 'p-2.5 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed';
}
