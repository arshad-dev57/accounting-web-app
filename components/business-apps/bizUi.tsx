import React from 'react';
import Link from 'next/link';

export const bizInput =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#014582]';
export const bizSelect = 'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#014582]';
export const bizBtnPrimary =
  'inline-flex items-center gap-2 rounded-lg bg-[#014582] px-4 py-2 text-sm font-semibold text-white hover:bg-[#013663] disabled:opacity-60';
export const bizBtnSecondary =
  'inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50';

export function fmtDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function fmtDateTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** yyyy-mm-dd key in local time. */
export function dayKey(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** `datetime-local` value (local time) for a Date. */
export function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type BizTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export function meetingStatusTone(s: string): BizTone {
  if (s === 'completed') return 'success';
  if (s === 'cancelled') return 'danger';
  if (s === 'in_progress') return 'warning';
  return 'info';
}

export function bookingStatusTone(s: string): BizTone {
  if (s === 'completed' || s === 'confirmed') return 'success';
  if (s === 'cancelled' || s === 'no_show') return 'danger';
  if (s === 'pending') return 'warning';
  return 'info';
}

export function noticeStatusTone(s: string): BizTone {
  if (s === 'published') return 'success';
  if (s === 'draft' || s === 'archived') return 'neutral';
  if (s === 'expired') return 'danger';
  return 'warning';
}

export function BizLoading({ height = 'h-48' }: { height?: string }) {
  return <div className={`${height} animate-pulse rounded-2xl border border-gray-200 bg-white`} />;
}

export function BizCard({
  title,
  children,
  className = '',
  right,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
      {title ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {right}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function BizField({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block text-gray-600">{label}</span>
      {children}
    </label>
  );
}

export function BizLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-[#014582] hover:underline">
      {children}
    </Link>
  );
}

/** Key → count list (e.g. "by status"), used by report pages. */
export function BizBreakdown({ title, map }: { title: string; map?: Record<string, number> | null }) {
  const entries = Object.entries(map || {});
  return (
    <BizCard title={title}>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">No data yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {entries.map(([k, v]) => (
            <li key={k} className="flex items-center justify-between py-2 text-sm">
              <span className="capitalize text-gray-700">{k.replace(/_/g, ' ')}</span>
              <span className="tabular-nums font-medium text-gray-900">{v}</span>
            </li>
          ))}
        </ul>
      )}
    </BizCard>
  );
}

export function BizNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">{children}</div>
  );
}
