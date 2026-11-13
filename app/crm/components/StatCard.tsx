'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  /** Kept for callers; ignored in the clean desk style */
  color?: string;
  icon: LucideIcon;
  href?: string;
  sub?: string;
  format?: 'number' | 'currency' | 'percent';
  currency?: string;
  accent?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  sub,
  format = 'number',
  currency = 'PKR',
  accent = '#014582',
}: StatCardProps) {
  const formatted =
    format === 'currency'
      ? `${currency} ${Number(value).toLocaleString()}`
      : format === 'percent'
        ? `${value}%`
        : typeof value === 'number'
          ? value.toLocaleString()
          : String(value);

  const content = (
    <div className="group h-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-[#014582]/25 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 truncate">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-gray-900 tabular-nums">
            {formatted}
          </p>
          {sub ? <p className="mt-1 text-xs text-gray-400">{sub}</p> : null}
        </div>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accent}14`, color: accent }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }
  return content;
}
