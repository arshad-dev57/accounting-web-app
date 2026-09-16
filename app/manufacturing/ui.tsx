'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Inbox,
  type LucideIcon,
} from 'lucide-react';

// ============================================================
// Shared Manufacturing UI primitives (mirrors HR module design)
// ============================================================

export const MFG_COLORS = {
  primary: '#014582',
  accent: '#0FA3E0',
  success: '#2ECC71',
  danger: '#E74C3C',
  warning: '#F39C12',
  purple: '#8E44AD',
  slate: '#7A8FA6',
};

export const MFG_PIE_COLORS = [
  '#014582', '#0FA3E0', '#2ECC71', '#F39C12', '#8E44AD', '#E74C3C', '#0891B2', '#EC4899',
];

export function MfgPage({ children }: { children: React.ReactNode }) {
  return <div className="max-w-7xl space-y-6">{children}</div>;
}

export function MfgPageHeader({
  title,
  subtitle,
  backHref,
  actions,
  icon,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden bg-[#014582] rounded-2xl px-5 py-4 flex items-center justify-between mb-2 shadow-[0_12px_28px_rgba(1,69,130,0.16)]">
      <div className="absolute -right-10 -top-14 w-48 h-48 rounded-full bg-[#0FA3E0]/20 pointer-events-none" />
      <div className="flex items-center gap-3 relative">
        {backHref && (
          <Link
            href={backHref}
            className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>
        )}
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
            {icon}
          </div>
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

export function MfgStatCard({
  label,
  value,
  icon: Icon,
  color,
  hint,
  href,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  hint?: string;
  href?: string;
}) {
  const inner = (
    <div className={`bg-white rounded-xl p-4 shadow-sm border border-[#DDE4EE] ${href ? 'hover:border-[#014582]/40 hover:shadow-md transition-all' : ''}`}>
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
  if (!href) return inner;
  return <Link href={href} className="block">{inner}</Link>;
}

export function MfgCard({
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
          {title && <h2 className="text-sm font-bold text-[#1A1A2E]">{title}</h2>}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function MfgSearchInput({
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

export function MfgStatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    Running: '#2ECC71', 'In Progress': '#0FA3E0', InProgress: '#0FA3E0', Completed: '#2ECC71',
    'Partially Completed': '#F39C12', 'Closed Short': '#E67E22',
    Closed: '#7A8FA6', Draft: '#7A8FA6', Planned: '#F39C12', Released: '#8E44AD',
    Paused: '#F39C12', Pending: '#F39C12', Cancelled: '#E74C3C', Rejected: '#E74C3C',
    Passed: '#2ECC71', Failed: '#E74C3C', Rework: '#F39C12', Scrap: '#E74C3C',
    Idle: '#7A8FA6', Maintenance: '#8E44AD', Breakdown: '#E74C3C', Offline: '#7A8FA6',
    Delayed: '#E74C3C', Active: '#2ECC71', Inactive: '#7A8FA6', Approved: '#2ECC71',
    Submitted: '#0FA3E0', Open: '#0FA3E0', Scheduled: '#0FA3E0', Overdue: '#E74C3C',
    Shortage: '#E74C3C', Reserved: '#0FA3E0', Issued: '#2ECC71', Consumed: '#2ECC71',
    'In Inspection': '#F39C12', New: '#0FA3E0', High: '#E74C3C', Medium: '#F39C12',
    Low: '#7A8FA6', Urgent: '#E74C3C',
  };
  const color = (status && map[status]) || '#7A8FA6';
  return (
    <span
      className="px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap"
      style={{ backgroundColor: `${color}1A`, color }}
    >
      {status || '—'}
    </span>
  );
}

export function MfgProgress({ value, color = '#0FA3E0' }: { value: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="flex-1 h-2 bg-[#EDF1F7] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] font-bold text-[#7A8FA6]">{Math.round(pct)}%</span>
    </div>
  );
}

// ============================================================
// Table
// ============================================================
export function MfgTable({ columns, children }: { columns: string[]; children: React.ReactNode }) {
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

export function MfgTableRow({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-[#F0F4F8]/60 transition-colors border-b border-[#DDE4EE]/60 last:border-0 ${onClick ? 'cursor-pointer' : ''}`}
    >
      {children}
    </tr>
  );
}

export function MfgTableCell({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 text-[#1A1A2E] whitespace-nowrap ${className}`}>{children}</td>;
}

// ============================================================
// States & misc
// ============================================================
export function MfgLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-[#7A8FA6]">
      <Loader2 className="w-6 h-6 animate-spin mb-2" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function MfgEmpty({ title = 'No data found', message }: { title?: string; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox className="w-8 h-8 text-[#C6D2E3] mb-3" />
      <p className="text-sm font-bold text-[#1A1A2E]">{title}</p>
      {message && <p className="text-xs text-[#7A8FA6] mt-1 max-w-md">{message}</p>}
    </div>
  );
}

export function MfgError({ message }: { message?: string }) {
  return (
    <div className="flex items-start gap-2 py-6 px-4 rounded-xl border border-[#F5D7DA] bg-[#FDF1F2] text-[#B71C2C]">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <p className="text-sm font-medium">{message || 'Unable to load data.'}</p>
    </div>
  );
}

export function MfgPagination({
  page,
  total,
  limit = 20,
  onPage,
}: {
  page: number;
  total: number;
  limit?: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil((Number(total) || 0) / limit));
  const prev = page > 1;
  const next = page < pages;
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[#DDE4EE]">
      <p className="text-xs text-[#7A8FA6] font-medium">
        Page {page} of {pages} · {total || 0} records
      </p>
      <div className="flex items-center gap-2">
        <button
          disabled={!prev}
          onClick={() => onPage(page - 1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#DDE4EE] text-[#1A1A2E] disabled:opacity-40 hover:bg-gray-50 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          disabled={!next}
          onClick={() => onPage(page + 1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#DDE4EE] text-[#1A1A2E] disabled:opacity-40 hover:bg-gray-50 transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Buttons
// ============================================================
export function MfgButton({
  children,
  onClick,
  variant = 'primary',
  disabled,
  loading,
  type = 'button',
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}) {
  const styles: Record<string, string> = {
    primary: 'bg-[#014582] text-white hover:bg-[#01366a]',
    secondary: 'bg-white text-[#1A1A2E] border border-[#DDE4EE] hover:bg-gray-50',
    danger: 'bg-[#E74C3C] text-white hover:bg-[#C0392B]',
    ghost: 'bg-transparent text-[#014582] hover:bg-[#014582]/10',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

export function MfgAddButton({
  label,
  onClick,
  icon = true,
}: {
  label: string;
  onClick?: () => void;
  icon?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#014582] text-white text-sm font-semibold hover:bg-[#01366a] transition-all"
    >
      {icon && <Plus className="w-4 h-4" />}
      {label}
    </button>
  );
}

// ============================================================
// Form fields
// ============================================================
const fieldBase =
  'w-full bg-white rounded-xl px-3.5 py-2.5 text-sm text-[#1A1A2E] placeholder-[#A9B7C9] border border-[#DDE4EE] focus:outline-none focus:ring-2 focus:ring-[#014582]/20 focus:border-[#014582]/50 transition-all';

export function MfgField({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-[#1A1A2E] mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-[#7A8FA6] mt-1">{hint}</span>}
    </label>
  );
}

export function MfgInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldBase} ${props.className || ''}`} />;
}

export function MfgSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldBase} ${props.className || ''}`} />;
}

export function MfgTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldBase} min-h-[80px] ${props.className || ''}`} />;
}

export function MfgTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 bg-white rounded-xl border border-[#DDE4EE] p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            active === tab.id ? 'bg-[#014582] text-white' : 'text-[#7A8FA6] hover:bg-[#F0F4F8]'
          }`}
        >
          {tab.label}
          {tab.count != null && (
            <span className={`ml-1.5 ${active === tab.id ? 'text-white/80' : 'text-[#A9B7C9]'}`}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function MfgSection({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#1A1A2E]">{title}</h3>
          {description && <p className="text-xs text-[#7A8FA6] mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}


