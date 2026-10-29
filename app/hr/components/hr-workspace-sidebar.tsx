'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  CalendarRange,
  ChartColumn,
  ChevronDown,
  CircleAlert,
  CircleDot,
  ClipboardList,
  FileText,
  Fingerprint,
  FolderKanban,
  Home,
  Landmark,
  MapPin,
  Palmtree,
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
import { useSidebarCollapsed } from '../../../lib/sidebar-collapse';
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

const ITEM_ICONS: Record<string, LucideIcon> = {
  Employee: UsersRound,
  'Organizational Chart': Building2,
  Company: Building2,
  Branch: Building2,
  Department: Building2,
  Designation: ClipboardList,
  Roster: CalendarRange,
  'Live Tracking': MapPin,
  Attendance: Fingerprint,
  'Leave Application': Palmtree,
  'Holiday List': Palmtree,
  'Payroll Entry': Wallet,
  'Salary Slip': FileText,
  Settings: Settings2
};

function itemIcon(item: HrNavItem): LucideIcon {
  if (item.kind === 'home') return Home;
  if (item.kind === 'dashboard') return ChartColumn;
  if (item.kind === 'settings') return Settings2;
  if (item.kind === 'report') return FileText;
  if (item.kind === 'tool') return FolderKanban;
  return ITEM_ICONS[item.label] || CircleDot;
}

function itemKey(item: HrNavItem): string {
  return `${item.kind}:${item.section || item.resource || item.href || item.report || item.label}`;
}

export function HrWorkspaceSidebar({ workspaceSlug }: { workspaceSlug: string }) {
  const pathname = usePathname();
  const { collapsed } = useSidebarCollapsed();
  const { nav, loading, error, refresh } = useHrNav();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const switcherRef = useRef<HTMLDivElement | null>(null);

  const workspaces = nav?.workspaces || [];
  const active: HrWorkspaceNav | null = useMemo(
    () => workspaces.find((ws) => ws.slug === workspaceSlug) || workspaces[0] || null,
    [workspaces, workspaceSlug]
  );

  useEffect(() => {
    if (!switcherOpen) return undefined;
    const onDown = (event: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) setSwitcherOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [switcherOpen]);

  const isActive = (href?: string | null) =>
    Boolean(href) && (pathname === href || (href && pathname.startsWith(`${href}/`)));

  const renderItem = (item: HrNavItem, nested = false) => {
    if (item.items) {
      const sectionKey = `${active?.slug}:${item.section || item.label}`;
      const isCollapsed = Boolean(collapsedSections[sectionKey]);
      return (
        <div key={itemKey(item)} className="mt-1">
          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsedSections((prev) => ({ ...prev, [sectionKey]: !isCollapsed }))}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-white/40">
                  <FolderKanban className="w-4 h-4" />
                </span>
                <span className="text-sm font-medium text-white/90 truncate sidebar-expanded-only">
                  {item.section || item.label}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-white/40 transition-transform sidebar-expanded-only ${
                  isCollapsed ? '' : 'rotate-180'
                }`}
              />
            </button>
          )}
          {(collapsed || !isCollapsed) && (
            <div className={`${collapsed ? '' : 'ml-3'} mt-1 space-y-1`}>
              {item.items.map((child) => (
                <React.Fragment key={itemKey(child)}>{renderItem(child, true)}</React.Fragment>
              ))}
            </div>
          )}
        </div>
      );
    }

    const Icon = itemIcon(item);
    const unavailable = item.available === false;
    const href = unavailable ? undefined : item.href || undefined;
    const activeItem = !unavailable && isActive(item.href);
    const cls = [
      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
      nested && !collapsed ? 'ml-3' : '',
      unavailable
        ? 'cursor-not-allowed text-white/25'
        : activeItem
          ? 'text-white bg-[#014582] shadow-md shadow-[#014582]/30 font-semibold'
          : 'text-white/70 hover:text-white hover:bg-white/5'
    ]
      .filter(Boolean)
      .join(' ');

    const inner = (
      <>
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="truncate sidebar-expanded-only">{item.label}</span>
      </>
    );

    if (unavailable || !href) {
      return (
        <div key={itemKey(item)} className={cls} title={unavailable ? 'Not available yet' : item.label}>
          {inner}
        </div>
      );
    }
    return (
      <Link key={itemKey(item)} href={href} title={item.label} className={cls}>
        {inner}
      </Link>
    );
  };

  const ActiveIcon = WORKSPACE_ICONS[active?.icon || ''] || UsersRound;

  return (
    <div className="space-y-1">
      <div className="relative mb-3" ref={switcherRef}>
        <button
          type="button"
          onClick={() => setSwitcherOpen((open) => !open)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all"
          title="Switch workspace"
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#014582] text-white">
            <ActiveIcon className="w-4 h-4" />
          </span>
          <div className="min-w-0 flex-1 text-left sidebar-expanded-only">
            <p className="truncate text-sm font-semibold text-white">{active?.label || 'HR'}</p>
            <p className="text-[10px] text-white/40">Workspace</p>
          </div>
          <ChevronDown className="w-4 h-4 flex-shrink-0 text-white/40 sidebar-expanded-only" />
        </button>

        {switcherOpen && !collapsed && (
          <div className="absolute left-0 right-0 top-full z-40 mt-1 rounded-xl border border-white/10 bg-[#00274d] py-1 shadow-xl">
            {workspaces.map((ws) => {
              const Icon = WORKSPACE_ICONS[ws.icon || ''] || UsersRound;
              const current = ws.slug === active?.slug;
              return (
                <Link
                  key={ws.slug}
                  href={`/hr/${ws.slug}`}
                  onClick={() => setSwitcherOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 text-sm ${
                    current
                      ? 'bg-[#014582] text-white font-semibold'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{ws.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {loading && !nav && (
        <p className="px-3 py-2 text-xs text-white/40 sidebar-expanded-only">Loading…</p>
      )}
      {error && !nav && (
        <div className="space-y-2 px-3 py-2">
          <p className="flex items-start gap-2 text-[11px] text-red-300 sidebar-expanded-only">
            <CircleAlert className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>{error}</span>
          </p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="flex items-center gap-1.5 text-[11px] text-white/60 hover:text-white"
          >
            <RefreshCcw className="h-3 w-3" /> <span className="sidebar-expanded-only">Retry</span>
          </button>
        </div>
      )}

      {active && active.items.map((item) => <React.Fragment key={itemKey(item)}>{renderItem(item)}</React.Fragment>)}

      {active?.extraDocuments && active.extraDocuments.length > 0 && (
        <div className="mt-3 pt-2 border-t border-white/10">
          {!collapsed && (
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">
              Linked masters
            </p>
          )}
          <div className="space-y-1">
            {active.extraDocuments.map((extra) =>
              renderItem({
                kind: 'document',
                label: extra.label,
                resource: extra.resource,
                href: extra.href,
                available: true
              })
            )}
          </div>
        </div>
      )}

      {nav?.trackingLinks && nav.trackingLinks.length > 0 && (
        <div className="mt-3 pt-2 border-t border-white/10">
          {!collapsed && (
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">
              Tracking
            </p>
          )}
          <div className="space-y-1">
            {nav.trackingLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                title={link.label}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  pathname === link.href
                    ? 'text-white bg-[#014582] shadow-md shadow-[#014582]/30 font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate sidebar-expanded-only">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
