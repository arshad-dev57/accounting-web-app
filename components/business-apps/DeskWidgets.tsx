'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function DeskStatCard({
  label,
  value,
  icon: Icon,
  href,
  sub,
  format = 'number',
  accent = '#014582',
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  href?: string;
  sub?: string;
  format?: 'number' | 'currency' | 'percent';
  accent?: string;
}) {
  const formatted =
    format === 'currency'
      ? Number(value).toLocaleString()
      : format === 'percent'
        ? `${value}%`
        : typeof value === 'number'
          ? value.toLocaleString()
          : String(value);

  const content = (
    <div className="group h-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:border-[#014582]/25 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-gray-500">
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

export function DeskShortcut({
  href,
  label,
  sub,
  icon: Icon,
}: {
  href: string;
  label: string;
  sub: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:border-[#014582]/30 hover:shadow-sm"
    >
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#014582]/10 text-[#014582]">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      <p className="mt-0.5 text-xs text-gray-500">{sub}</p>
    </Link>
  );
}

export function DeskPanel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function DeskLinkGroup({
  title,
  items,
}: {
  title: string;
  items: { href: string; label: string }[];
}) {
  return (
    <DeskPanel title={title}>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.href + item.label}>
            <Link
              href={item.href}
              className="flex items-center rounded-md px-2 py-1.5 text-sm text-[#014582] hover:bg-[#014582]/5"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </DeskPanel>
  );
}

export function DeskBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.min((count / total) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex justify-between text-sm">
          <span className="truncate text-gray-700 capitalize">{label.replace(/_/g, ' ')}</span>
          <span className="ml-2 font-medium tabular-nums text-gray-500">{count}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
      </div>
    </div>
  );
}

export function DeskHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight text-gray-900">{title}</h1>
        <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function DeskLoading() {
  return (
    <div className="space-y-5">
      <div className="h-9 w-48 animate-pulse rounded-lg bg-gray-200" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-56 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    </div>
  );
}

export function DeskError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <AlertCircle className="mb-3 h-12 w-12 text-red-400" />
      <p className="font-medium text-red-600">Failed to load dashboard</p>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#014582] px-4 py-2 text-sm text-white hover:bg-[#01366a]"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
    </div>
  );
}

export const STATUS_COLORS: Record<string, string> = {
  planning: '#64748b',
  active: '#014582',
  on_hold: '#f59e0b',
  completed: '#10b981',
  cancelled: '#ef4444',
  todo: '#94a3b8',
  in_progress: '#0ea5e9',
  review: '#8b5cf6',
  done: '#10b981',
  blocked: '#ef4444',
  scheduled: '#014582',
  published: '#10b981',
  draft: '#94a3b8',
  pending: '#f59e0b',
  pending_approval: '#f59e0b',
  expired: '#ef4444',
  archived: '#6b7280',
  confirmed: '#0ea5e9',
  checked_in: '#8b5cf6',
  no_show: '#ef4444',
  open: '#f59e0b',
};
