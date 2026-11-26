'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChartColumn,
  ChevronDown,
  CircleAlert,
  CircleDot,
  FileText,
  Fingerprint,
  FolderKanban,
  Home,
  Landmark,
  MapPin,
  Receipt,
  RefreshCcw,
  Settings2,
  Target,
  TreePalm,
  UserRoundCog,
  UserRoundSearch,
  UsersRound,
  Wallet,
  type LucideIcon
} from 'lucide-react';
import { useHrNav } from '../../../lib/hr-nav-context';
import type { HrNavItem, HrWorkspaceNav } from '../../../lib/hr-workspace-service';

const WORKSPACE_ICONS: Record<string, LucideIcon> = {
  settings: Settings2,
  'user-round-cog': UserRoundCog,
  'user-round-search': UserRoundSearch,
  fingerprint: Fingerprint,
  'tree-palm': TreePalm,
  receipt: Receipt,
  target: Target,
  landmark: Landmark,
  wallet: Wallet
};

function itemKey(item: HrNavItem): string {
  return `${item.kind}:${item.section || item.resource || item.href || item.report || item.label}`;
}

function flattenLeafItems(items: HrNavItem[]): { section: string; item: HrNavItem }[] {
  const out: { section: string; item: HrNavItem }[] = [];
  for (const item of items) {
    if (item.items?.length) {
      const section = item.section || item.label || 'More';
      for (const child of item.items) {
        if (child.items?.length) {
          out.push(...flattenLeafItems([child]).map((row) => ({
            section: row.section === 'More' ? section : row.section,
            item: row.item
          })));
        } else {
          out.push({ section, item: child });
        }
      }
    } else if (item.kind !== 'section') {
      out.push({ section: '', item });
    }
  }
  return out;
}

function groupBySection(rows: { section: string; item: HrNavItem }[]) {
  const order: string[] = [];
  const map = new Map<string, HrNavItem[]>();
  for (const row of rows) {
    const key = row.section || 'Main';
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(row.item);
  }
  return order.map((section) => ({ section, items: map.get(section)! }));
}

export function HrTopNav({ workspaceSlug }: { workspaceSlug: string }) {
  const pathname = usePathname();
  const { nav, loading, error, refresh } = useHrNav();
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);

  const workspaces = nav?.workspaces || [];
  const active: HrWorkspaceNav | null = useMemo(
    () => workspaces.find((ws) => ws.slug === workspaceSlug) || workspaces[0] || null,
    [workspaces, workspaceSlug]
  );

  useEffect(() => {
    setOpenSlug(null);
  }, [pathname]);

  useEffect(() => {
    if (!openSlug) return undefined;
    const onDown = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) setOpenSlug(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenSlug(null);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openSlug]);

  const isActiveHref = (href?: string | null) =>
    Boolean(href) && (pathname === href || (href != null && pathname.startsWith(`${href}/`)));

  const renderLink = (item: HrNavItem) => {
    const unavailable = item.available === false;
    const href = unavailable ? undefined : item.href || undefined;
    const activeItem = !unavailable && isActiveHref(item.href);
    const cls = [
      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
      unavailable
        ? 'cursor-not-allowed text-slate-300'
        : activeItem
          ? 'bg-[#014582] font-semibold text-white'
          : 'text-slate-700 hover:bg-slate-100'
    ].join(' ');

    const Icon =
      item.kind === 'home'
        ? Home
        : item.kind === 'dashboard'
          ? ChartColumn
          : item.kind === 'report'
            ? FileText
            : item.kind === 'tool'
              ? FolderKanban
              : item.kind === 'settings'
                ? Settings2
                : CircleDot;

    if (unavailable || !href) {
      return (
        <div key={itemKey(item)} className={cls} title="Not available yet">
          <Icon className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
          <span className="truncate">{item.label}</span>
        </div>
      );
    }

    return (
      <Link
        key={itemKey(item)}
        href={href}
        onClick={() => setOpenSlug(null)}
        className={cls}
      >
        <Icon className="h-3.5 w-3.5 flex-shrink-0 opacity-70" />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <div ref={navRef} className="relative border-b border-slate-200 bg-white">
      <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 custom-scrollbar">
        {loading && !nav && (
          <span className="px-2 text-xs font-medium text-slate-400">Loading workspaces…</span>
        )}

        {error && !nav && (
          <div className="flex items-center gap-2 px-2 text-xs text-red-600">
            <CircleAlert className="h-3.5 w-3.5" />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex items-center gap-1 font-semibold text-[#014582] hover:underline"
            >
              <RefreshCcw className="h-3 w-3" /> Retry
            </button>
          </div>
        )}

        {workspaces.map((ws) => {
          const Icon = WORKSPACE_ICONS[ws.icon || ''] || UsersRound;
          const isCurrent = ws.slug === active?.slug;
          const isOpen = openSlug === ws.slug;
          return (
            <button
              key={ws.slug}
              type="button"
              onClick={() => setOpenSlug((prev) => (prev === ws.slug ? null : ws.slug))}
              className={[
                'inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
                isOpen || isCurrent
                  ? 'bg-[#014582] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              ].join(' ')}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{ws.label}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
          );
        })}

        {nav?.trackingLinks?.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={[
              'inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
              pathname === link.href
                ? 'bg-[#014582] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            ].join(' ')}
          >
            <MapPin className="h-3.5 w-3.5" />
            {link.label}
          </Link>
        ))}
      </div>

      {openSlug && (() => {
        const ws = workspaces.find((w) => w.slug === openSlug);
        if (!ws) return null;
        const groups = groupBySection(flattenLeafItems(ws.items || []));
        const extras = (ws.extraDocuments || []).map((extra) => ({
          kind: 'document' as const,
          label: extra.label,
          resource: extra.resource,
          href: extra.href,
          available: true
        }));

        return (
          <div className="absolute left-0 right-0 top-full z-40 border-b border-slate-200 bg-white shadow-xl">
            <div className="max-h-[min(70vh,520px)] overflow-y-auto px-4 py-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Workspace
                  </p>
                  <h2 className="text-base font-extrabold text-[#1A1A2E]">{ws.label}</h2>
                </div>
                <Link
                  href={`/hr/${ws.slug}`}
                  onClick={() => setOpenSlug(null)}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#014582] hover:bg-slate-200"
                >
                  Open home
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {groups.map((group) => (
                  <div key={group.section} className="min-w-0">
                    <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {group.section}
                    </p>
                    <div className="space-y-0.5">{group.items.map((item) => renderLink(item))}</div>
                  </div>
                ))}

                {extras.length > 0 && (
                  <div className="min-w-0">
                    <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Linked masters
                    </p>
                    <div className="space-y-0.5">{extras.map((item) => renderLink(item))}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
