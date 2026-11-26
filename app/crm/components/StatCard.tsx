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

/** SAP / Odoo style KPI tile — accent bar, large value, compact meta */
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
        ? `${Number(value).toFixed(Number(value) % 1 === 0 ? 0 : 1)}%`
        : typeof value === 'number'
          ? value.toLocaleString()
          : String(value);

  const content = (
    <div className="group relative h-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-gray-300 hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]">
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: accent }} />
      <div className="flex items-start justify-between gap-3 px-4 pb-3.5 pt-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-500">
            {label}
          </p>
          <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-gray-900 tabular-nums">
            {formatted}
          </p>
          {sub ? <p className="mt-2 text-xs text-gray-500">{sub}</p> : null}
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `${accent}12`, color: accent }}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
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
