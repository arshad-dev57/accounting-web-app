'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  type LucideIcon,
} from 'lucide-react';

// ============================================================
// PAGE HEADER — mirrors the mobile app's blue top header
// ============================================================
export function HRPageHeader({
  title,
  subtitle,
  backHref,
  actions,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden bg-[#014582] rounded-2xl px-5 py-4 flex items-center justify-between mb-6 shadow-[0_12px_28px_rgba(1,69,130,0.16)]">
      <div className="absolute -right-10 -top-14 w-48 h-48 rounded-full bg-[#0FA3E0]/20 pointer-events-none" />
      <div className="flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>
        )}
        <div>
          <h1 className="text-lg font-extrabold text-white tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-[11px] text-white/70 font-medium mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="relative flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ============================================================
// STAT CARD — mirrors the mobile dashboard stats grid
// ============================================================
export function HRStatCard({
  label,
  value,
  icon: Icon,
  color,
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  hint?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-[#DDE4EE]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#7A8FA6]">{label}</span>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}1A` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-[#1A1A2E]">{value}</p>
      {hint && <p className="text-[10px] font-medium mt-1" style={{ color }}>{hint}</p>}
    </div>
  );
}

// ============================================================
// CARD — white rounded card like the mobile kCardBg
// ============================================================
export function HRCard({
  title,
  action,
  children,
  className = '',
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-[#DDE4EE] ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DDE4EE]">
          {title && (
            <h2 className="text-sm font-bold text-[#1A1A2E]">{title}</h2>
          )}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
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
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: LucideIcon;
  className?: string;
}) {
  const styles = {
    primary: 'bg-[#014582] text-white hover:bg-[#013a6b] shadow-sm',
    secondary: 'bg-white text-[#014582] border border-[#DDE4EE] hover:border-[#014582]/40 hover:bg-[#F7FAFC]',
    ghost: 'text-[#52677E] hover:bg-[#F0F4F8] hover:text-[#014582]',
  };
  const content = <>{Icon && <Icon className="w-4 h-4" />}{children}</>;
  const cls = `inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${styles[variant]} ${className}`;
  return href ? <Link href={href} className={cls}>{content}</Link> : <button type="button" onClick={onClick} className={cls}>{content}</button>;
}

export function HRToolbar({
  search,
  setSearch,
  placeholder = 'Search records...',
  filters,
  right,
}: {
  search?: string;
  setSearch?: (value: string) => void;
  placeholder?: string;
  filters?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#DDE4EE] bg-white p-3.5 mb-4 md:flex-row md:items-center">
      {setSearch && <div className="w-full md:max-w-sm"><HRSearchInput value={search || ''} onChange={setSearch} placeholder={placeholder} /></div>}
      {filters && <div className="flex items-center gap-2 overflow-x-auto">{filters}</div>}
      {right && <div className="flex items-center gap-2 md:ml-auto">{right}</div>}
    </div>
  );
}

export function HRWorkflowNotice({
  title,
  detail,
  tone = 'blue',
  action,
}: {
  title: string;
  detail: string;
  tone?: 'blue' | 'amber' | 'green';
  action?: React.ReactNode;
}) {
  const tones = {
    blue: 'bg-[#014582]/[0.06] border-[#014582]/15 text-[#014582]',
    amber: 'bg-[#F39C12]/[0.08] border-[#F39C12]/20 text-[#925B00]',
    green: 'bg-[#2ECC71]/[0.08] border-[#2ECC71]/20 text-[#187A42]',
  };
  return <div className={`mb-5 flex flex-col gap-2 rounded-2xl border px-4 py-3 md:flex-row md:items-center ${tones[tone]}`}>
    <div className="min-w-0 flex-1"><p className="text-xs font-extrabold">{title}</p><p className="mt-0.5 text-[11px] font-medium opacity-80">{detail}</p></div>{action}
  </div>;
}

export function HRAvatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return <span className={`${size === 'md' ? 'w-9 h-9 text-xs' : 'w-7 h-7 text-[10px]'} shrink-0 rounded-full bg-[#014582]/10 text-[#014582] inline-flex items-center justify-center font-extrabold`}>{initials || '—'}</span>;
}

// ============================================================
// FILTER CHIPS — mirrors the mobile filter chip row
// ============================================================
export function HRFilterChips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selected
                ? 'bg-[#014582] text-white'
                : 'bg-white text-[#7A8FA6] border border-[#DDE4EE] hover:border-[#014582]/40'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// SEARCH INPUT
// ============================================================
export function HRSearchInput({
  value,
  onChange,
  placeholder = 'Search...',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search className="w-4 h-4 text-[#7A8FA6] absolute left-3.5 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#1A1A2E] placeholder-[#7A8FA6] border border-[#DDE4EE] focus:outline-none focus:ring-2 focus:ring-[#014582]/20 focus:border-[#014582]/50 transition-all"
      />
    </div>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================
export function HRStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: '#2ECC71',
    Approved: '#2ECC71',
    Present: '#2ECC71',
    CheckedIn: '#2ECC71',
    'On Leave': '#F39C12',
    Pending: '#F39C12',
    Late: '#F39C12',
    Inactive: '#7A8FA6',
    Absent: '#E74C3C',
    Rejected: '#E74C3C',
    Paid: '#2ECC71',
    Draft: '#7A8FA6',
    Scheduled: '#0FA3E0',
    Review: '#8E44AD',
    Open: '#0FA3E0',
    Closed: '#7A8FA6',
    'Needs action': '#E74C3C',
  };
  const color = map[status] || '#7A8FA6';
  return (
    <span
      className="px-2.5 py-1 rounded-full text-[10px] font-bold"
      style={{ backgroundColor: `${color}1A`, color }}
    >
      {status}
    </span>
  );
}

// ============================================================
// SIMPLE TABLE
// ============================================================
export function HRTable({
  columns,
  children,
}: {
  columns: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            {columns.map((c) => (
              <th
                key={c}
                className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#7A8FA6] border-b border-[#DDE4EE] whitespace-nowrap"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function HRTableRow({ children }: { children: React.ReactNode }) {
  return (
    <tr className="hover:bg-[#F0F4F8]/60 transition-colors border-b border-[#DDE4EE]/60 last:border-0">
      {children}
    </tr>
  );
}

export function HRTableCell({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-4 py-3 text-[#1A1A2E] whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
}

// ============================================================
// PAGE SHELL — max width used by every HR page
// ============================================================
export function HRPage({ children }: { children: React.ReactNode }) {
  return <div className="max-w-7xl">{children}</div>;
}
