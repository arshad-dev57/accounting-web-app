'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  Truck,
  Building2,
  Download,
  Eye,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';

export const TRADE_COLORS = {
  primary: '#014582',
  primaryHover: '#01366a',
  accent: '#0FA3E0',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  slate: '#64748B',
  dark: '#0A2540',
};

export function TradePage({
  children,
  className = '',
  fullWidth = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** Use full content width (no max-w-7xl side gutters). */
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`w-full space-y-6 pb-12 ${fullWidth ? '' : 'max-w-7xl mx-auto'} ${className}`}
    >
      {children}
    </div>
  );
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

/** Explicit frontend-mock disclaimer — never implies live ERP postings. */
export function MockBookBanner({
  moduleName,
  ownershipNote,
}: {
  moduleName: string;
  ownershipNote?: string;
}) {
  return (
    <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
      <p className="font-semibold">
        {moduleName} uses frontend mock data only (browser localStorage demo book).
      </p>
      <p className="text-[11px] text-amber-800/90 mt-1 leading-relaxed">
        Figures are not live Accounting / Inventory postings and are not persisted to the backend.
        {ownershipNote ? ` ${ownershipNote}` : ''}{' '}
        Create and settle real transactions in Sales, Purchases, Warehouse and Accounting.
      </p>
    </div>
  );
}

/** Banner clarifying that transactional create/posting lives in existing ERP modules. */
export function ErpLinkedBanner({
  moduleLabel,
  erpModuleLabel,
  erpHref,
  erpHrefLabel,
  description,
}: {
  moduleLabel: string;
  erpModuleLabel: string;
  erpHref: string;
  erpHrefLabel?: string;
  description?: string;
}) {
  return (
    <div className="mb-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="min-w-0 space-y-1">
        <p className="font-semibold text-slate-800">
          {moduleLabel} uses the existing {erpModuleLabel} transaction flow
        </p>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          {description ||
            'This page is a module-specific view/filter. Create, edit and financial postings happen in the linked ERP module so records are not duplicated.'}
        </p>
      </div>
      <Link
        href={erpHref}
        className="inline-flex items-center justify-center gap-1.5 shrink-0 px-3.5 py-2 rounded-xl bg-[#014582] text-white text-xs font-bold hover:bg-[#01366a] transition-all"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        {erpHrefLabel || `Open ${erpModuleLabel}`}
      </Link>
    </div>
  );
}

export function TradePageHeader({
  title,
  subtitle,
  description,
  moduleName,
  badge,
  backHref,
  actions,
  icon,
}: {
  title: string;
  subtitle?: string;
  description?: string;
  moduleName?: string;
  badge?: string;
  backHref?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const displaySubtitle = subtitle || description;
  const displayBadge = moduleName || badge;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#00274d] via-[#014582] to-blue-700 rounded-2xl px-5 sm:px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 shadow-xl text-white">
      <div className="absolute -right-10 -top-14 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
      <div className="flex items-center gap-3 relative min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 transition-all flex-shrink-0"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>
        )}
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 shadow-inner">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {displayBadge && (
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 uppercase tracking-wider">
                {displayBadge}
              </span>
              <span className="text-xs text-white/70">Bisonstechs Enterprise Suite</span>
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug truncate">
            {title}
          </h1>
          {displaySubtitle && (
            <p className="text-xs text-white/80 font-medium mt-0.5 line-clamp-1">{displaySubtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="relative flex items-center flex-wrap gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

export function TradeStatCard({
  label,
  value,
  icon: Icon,
  color = TRADE_COLORS.primary,
  hint,
  href,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  hint?: string;
  href?: string;
}) {
  const content = (
    <div
      className={`bg-white rounded-xl p-4 shadow-sm border border-[#DDE4EE] transition-all duration-200 ${
        href ? 'hover:border-[#014582]/50 hover:shadow-md cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#7A8FA6] leading-tight line-clamp-1">{label}</span>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}1A` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="text-xl sm:text-2xl font-extrabold text-[#1A1A2E] tracking-tight">{value}</p>
      {hint && <p className="text-[11px] font-medium mt-1 truncate" style={{ color }}>{hint}</p>}
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }
  return content;
}

export function TradeCard({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-[#DDE4EE] overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-4 border-b border-[#DDE4EE]">
          <div>
            {title && <h2 className="text-sm font-bold text-[#1A1A2E]">{title}</h2>}
            {subtitle && <p className="text-xs text-[#7A8FA6] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function TradeStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();

  let bg = 'bg-gray-100 text-gray-700 border-gray-200';

  if (
    s.includes('approved') ||
    s.includes('cleared') ||
    s.includes('received') ||
    s.includes('completed') ||
    s.includes('passed') ||
    s.includes('realized') ||
    s.includes('paid') ||
    s.includes('settled') ||
    s.includes('optimal') ||
    s.includes('active') ||
    s.includes('order won')
  ) {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (
    s.includes('transit') ||
    s.includes('voyage') ||
    s.includes('dispatched') ||
    s.includes('loaded') ||
    s.includes('ordered') ||
    s.includes('confirmed') ||
    s.includes('allocated')
  ) {
    bg = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (
    s.includes('pending') ||
    s.includes('review') ||
    s.includes('assessment') ||
    s.includes('packing') ||
    s.includes('inspection') ||
    s.includes('quoted') ||
    s.includes('low') ||
    s.includes('negotiation') ||
    s.includes('draft')
  ) {
    bg = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (
    s.includes('cancel') ||
    s.includes('reject') ||
    s.includes('lost') ||
    s.includes('hold') ||
    s.includes('damage') ||
    s.includes('shortage') ||
    s.includes('overdue')
  ) {
    bg = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${bg} whitespace-nowrap`}
    >
      {status}
    </span>
  );
}

export function TradeWorkflowStepper({
  steps,
  currentStepIndex,
}: {
  steps: string[];
  currentStepIndex: number;
}) {
  return (
    <div className="w-full overflow-x-auto py-2 custom-scrollbar">
      <div className="flex items-center min-w-max">
        {steps.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          return (
            <React.Fragment key={step}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-[#014582] text-white ring-4 ring-[#014582]/20'
                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-xs font-medium whitespace-nowrap ${
                    isCurrent
                      ? 'text-[#014582] font-bold'
                      : isDone
                      ? 'text-gray-800'
                      : 'text-gray-400'
                  }`}
                >
                  {step}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`w-8 h-0.5 mx-2 ${
                    isDone ? 'bg-emerald-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export function TradeTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#DDE4EE]">
      <table className="w-full text-left border-collapse text-xs sm:text-sm">{children}</table>
    </div>
  );
}

export function TradeTableHeader({ columns }: { columns: string[] }) {
  return (
    <thead className="bg-[#f8fafc] border-b border-[#DDE4EE] text-gray-600 uppercase text-[11px] font-bold tracking-wider">
      <tr>
        {columns.map((col, idx) => (
          <th key={idx} className="px-4 py-3">
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function TradeTableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-[#DDE4EE] bg-white">{children}</tbody>;
}

export function TradeTableRow({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-blue-50/40 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TradeTableCell({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 text-gray-700 align-middle ${className}`}>{children}</td>;
}

export function TradeDetailDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  children,
  actions,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-out">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#DDE4EE] flex items-center justify-between bg-[#f8fafc]">
          <div>
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs if present */}
        {tabs && tabs.length > 0 && (
          <div className="px-6 border-b border-[#DDE4EE] flex gap-4 bg-white overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange?.(tab)}
                className={`py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-[#014582] text-[#014582]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">{children}</div>

        {/* Actions */}
        {actions && (
          <div className="px-6 py-4 border-t border-[#DDE4EE] bg-[#f8fafc] flex items-center justify-end gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export function TradeModal({
  isOpen,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'max-w-2xl',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className={`w-full ${maxWidth} bg-white rounded-2xl shadow-2xl border border-[#DDE4EE] overflow-hidden`}>
        <div className="px-6 py-4 border-b border-[#DDE4EE] flex items-center justify-between bg-[#f8fafc]">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4 custom-scrollbar">{children}</div>
        {actions && (
          <div className="px-6 py-4 border-t border-[#DDE4EE] bg-[#f8fafc] flex items-center justify-end gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export function TradePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between text-xs text-gray-500 py-3 px-2">
        <span>Showing {totalItems} total records</span>
      </div>
    );
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-3 px-2 text-xs text-gray-600">
      <span>
        Showing <strong className="text-gray-900">{start}</strong> to{' '}
        <strong className="text-gray-900">{end}</strong> of{' '}
        <strong className="text-gray-900">{totalItems}</strong> entries
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-3 py-1 font-semibold text-gray-800">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
