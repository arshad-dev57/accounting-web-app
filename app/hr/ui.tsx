'use client';

/**
 * HR chrome aligned to Bisonstechs app brand (#014582), dense desk layout,
 * hairline borders, and full-width content (no centered max-width gutters).
 */

import React from 'react';
import Link from 'next/link';
import { Search, type LucideIcon } from 'lucide-react';

export function HRPageHeader({
  title,
  subtitle,
  backHref,
  actions
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        {backHref ? (
          <Link href={backHref} className="mb-1 inline-block text-xs font-semibold text-[#7A8FA6] hover:text-[#014582]">
            ← Back
          </Link>
        ) : null}
        <h1 className="text-2xl font-extrabold leading-tight text-[#1A1A2E]">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[#52677E]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function HRStatCard({
  label,
  value,
  icon: Icon,
  color,
  hint
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#DDE4EE] bg-white px-4 py-3.5 shadow-sm">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A8FA6]">{label}</span>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <p className="text-[22px] font-extrabold text-[#1A1A2E]">{value}</p>
      {hint ? (
        <p className="mt-0.5 text-[11px]" style={{ color }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function HRCard({
  title,
  action,
  children,
  className = ''
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-[#DDE4EE] bg-white shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-[#DDE4EE] px-4 py-3">
          {title ? <h2 className="text-sm font-bold text-[#1A1A2E]">{title}</h2> : <span />}
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function HRActionButton({
  children,
  onClick,
  href,
  variant = 'primary',
  icon: Icon,
  className = '',
  disabled = false,
  type = 'button'
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: LucideIcon;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const styles = {
    primary: 'bg-[#014582] text-white hover:bg-[#01366a]',
    secondary: 'bg-white text-[#1A1A2E] border border-[#DDE4EE] hover:bg-[#F0F4F8]',
    ghost: 'text-[#52677E] hover:bg-[#F0F4F8] hover:text-[#014582]',
    danger: 'bg-white text-[#e24c4c] border border-[#f5c2c2] hover:bg-[#fff5f5]'
  };
  const content = (
    <>
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </>
  );
  const cls = `inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3.5 text-[12px] font-bold transition-all disabled:opacity-40 ${styles[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls} aria-disabled={disabled}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls} disabled={disabled}>
      {content}
    </button>
  );
}

export function HRToolbar({
  search,
  setSearch,
  placeholder = 'Search records...',
  filters,
  right
}: {
  search?: string;
  setSearch?: (value: string) => void;
  placeholder?: string;
  filters?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-[#DDE4EE] bg-white px-3 py-2.5 shadow-sm md:flex-row md:items-center">
      {setSearch ? (
        <div className="w-full md:max-w-xs">
          <HRSearchInput value={search || ''} onChange={setSearch} placeholder={placeholder} />
        </div>
      ) : null}
      {filters ? <div className="flex items-center gap-2 overflow-x-auto">{filters}</div> : null}
      {right ? <div className="flex items-center gap-2 md:ml-auto">{right}</div> : null}
    </div>
  );
}

export function HRWorkflowNotice({
  title,
  detail,
  tone = 'blue',
  action
}: {
  title: string;
  detail: string;
  tone?: 'blue' | 'amber' | 'green';
  action?: React.ReactNode;
}) {
  const tones = {
    blue: 'bg-[#f0f4ff] border-[#d0daf8] text-[#2d3a8c]',
    amber: 'bg-[#fff8eb] border-[#f5dfb3] text-[#8a5b00]',
    green: 'bg-[#edfaf0] border-[#c6ebd1] text-[#1b6b3a]'
  };
  return (
    <div className={`mb-3 flex flex-col gap-2 rounded border px-3 py-2.5 md:flex-row md:items-center ${tones[tone]}`}>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold">{title}</p>
        <p className="mt-0.5 text-[11px] opacity-80">{detail}</p>
      </div>
      {action}
    </div>
  );
}

export function HRAvatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  return (
    <span
      className={`${size === 'md' ? 'h-8 w-8 text-[11px]' : 'h-6 w-6 text-[10px]'} inline-flex shrink-0 items-center justify-center rounded-full bg-[#f3f3f3] font-semibold text-[#525252]`}
    >
      {initials || '—'}
    </span>
  );
}

export function HRFilterChips({
  options,
  value,
  onChange
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
              selected
                ? 'bg-[#014582] text-white'
                : 'border border-[#DDE4EE] bg-white text-[#52677E] hover:bg-[#F0F4F8]'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function HRSearchInput({
  value,
  onChange,
  placeholder = 'Search...'
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7c7c7c]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-xl border border-[#DDE4EE] bg-white py-1 pl-8 pr-2.5 text-sm text-[#1A1A2E] placeholder-[#9c9c9c] outline-none focus:border-[#014582] focus:ring-2 focus:ring-[#014582]/20"
      />
    </div>
  );
}

export function HRStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: '#249144',
    Approved: '#249144',
    APPROVED: '#249144',
    Present: '#249144',
    CheckedIn: '#249144',
    'On Leave': '#c58000',
    Pending: '#c58000',
    Late: '#c58000',
    Inactive: '#7c7c7c',
    Absent: '#e24c4c',
    Rejected: '#e24c4c',
    Paid: '#249144',
    PAID: '#249144',
    Draft: '#7c7c7c',
    Scheduled: '#0289f7',
    Submitted: '#0289f7',
    Open: '#0289f7',
    OPEN: '#0289f7',
    Cancelled: '#7c7c7c',
    Withheld: '#c58000',
    Released: '#249144',
    Unpaid: '#c58000',
    Completed: '#249144'
  };
  const color = map[status] || map[String(status || '').toUpperCase()] || '#7c7c7c';
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ backgroundColor: `${color}18`, color }}
    >
      {status || '—'}
    </span>
  );
}

export function HRPayrollNextActionCard({
  title,
  subtitle,
  actionLabel,
  onAction,
  href,
  disabled = false,
  hint
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction?: () => void;
  href?: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded border border-[#014582]/20 bg-[#014582] p-4 text-white">
      <p className="text-[14px] font-semibold">{title}</p>
      <p className="mt-1 text-[12px] text-white/70">{subtitle}</p>
      {hint ? <p className="mt-2 text-[11px] text-white/50">{hint}</p> : null}
      <div className="mt-3">
        <HRActionButton
          href={href}
          onClick={onAction}
          disabled={disabled}
          className="!bg-white !text-[#014582] hover:!bg-[#F0F4F8]"
        >
          {actionLabel}
        </HRActionButton>
      </div>
    </div>
  );
}

export function HRPage({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`w-full ${className}`}>{children}</div>;
}

export function HRTable({
  columns,
  children
}: {
  columns: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[#DDE4EE] bg-[#F0F4F8] text-[11px] font-bold uppercase tracking-wider text-[#7A8FA6]">
            {columns.map((column) => (
              <th key={column} className="whitespace-nowrap px-4 py-2.5 font-bold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">{children}</tbody>
      </table>
    </div>
  );
}

export function HRTableRow({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-[#F0F4F8] hover:bg-[#F0F4F8]/60">{children}</tr>;
}

export function HRTableCell({ children }: { children: React.ReactNode }) {
  return <td className="whitespace-nowrap px-4 py-2.5 align-middle text-[#1A1A2E]">{children}</td>;
}
