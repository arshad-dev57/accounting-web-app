'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  StickyNote,
  Home,
  Pin,
  ListTodo,
  LayoutList,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { BrandHeader } from '../../components/BrandHeader';
import { CollapsibleSidebar } from '../../components/CollapsibleSidebar';
import { ModuleChrome } from '../../components/ModuleChrome';
import { useSidebarCollapsed } from '../../lib/sidebar-collapse';

type NavItemDef = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: (pathname: string, filter: string | null) => boolean;
};

const NOTES_NAV: NavItemDef[] = [
  {
    href: '/notes',
    label: 'All Notes',
    icon: LayoutList,
    match: (_p, f) => !f || f === 'all',
  },
  {
    href: '/notes?filter=pinned',
    label: 'Pinned',
    icon: Pin,
    match: (_p, f) => f === 'pinned',
  },
  {
    href: '/notes?filter=todos',
    label: 'With Todos',
    icon: ListTodo,
    match: (_p, f) => f === 'todos',
  },
];

function NotesSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter');
  const { collapsed } = useSidebarCollapsed();

  return (
    <CollapsibleSidebar expandedClassName="w-60" expandedWidth={240}>
      <BrandHeader subtitle="Notes Module" />

      <div className="custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {!collapsed && (
          <p className="sidebar-expanded-only mb-3 px-2 text-[10px] font-semibold tracking-wider text-white/30">
            NOTES MENU
          </p>
        )}

        {NOTES_NAV.map((item) => {
          const Icon = item.icon;
          const active = item.match
            ? item.match(pathname || '', filter)
            : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`group flex w-full items-center rounded-lg transition-all duration-200 ${
                collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
              } ${
                active
                  ? 'bg-[#014582] text-white shadow-md shadow-[#014582]/25'
                  : 'text-white/65 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 ${
                  active ? 'text-white' : 'text-white/45 group-hover:text-white/80'
                }`}
              />
              <span className="sidebar-expanded-only min-w-0 flex-1 truncate text-sm font-medium">
                {item.label}
              </span>
              {active && !collapsed ? (
                <ChevronRight className="sidebar-expanded-only h-4 w-4 shrink-0 text-white/80" />
              ) : null}
            </Link>
          );
        })}

        <div className="pt-3">
          {!collapsed && (
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-white/35">
              Actions
            </p>
          )}
          <Link
            href="/notes?new=1"
            title="New Note"
            className={`group flex w-full items-center rounded-lg transition-all duration-200 ${
              collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
            } text-white/65 hover:bg-white/5 hover:text-white`}
          >
            <Plus className="h-5 w-5 shrink-0 text-white/45 group-hover:text-white/80" />
            <span className="sidebar-expanded-only text-sm font-medium">New Note</span>
          </Link>
        </div>
      </div>

      <div className="shrink-0 border-t border-white/10 px-3 py-3">
        <Link
          href="/dashboard"
          title="Back to Hub"
          className={`flex w-full items-center rounded-lg text-white/65 hover:bg-white/5 hover:text-white transition-colors ${
            collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
          }`}
        >
          <Home className="h-5 w-5 shrink-0 text-white/45" />
          <span className="sidebar-expanded-only text-sm font-medium">Back to Hub</span>
        </Link>
      </div>
    </CollapsibleSidebar>
  );
}

function NotesLayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <ModuleChrome
      title="Local Notes"
      icon={<StickyNote className="w-5 h-5 text-[#014582]" />}
      sidebar={<NotesSidebar />}
      topGroups={[
        {
          label: 'Notes',
          items: [
            ...NOTES_NAV.map((item) => ({ label: item.label, href: item.href })),
            { label: 'New Note', href: '/notes?new=1' }
          ]
        }
      ]}
      headerLeftExtra={
        <span className="hidden sm:inline text-[11px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
          This device only
        </span>
      }
      mainClassName="bg-[#f4f5f6]"
      contentClassName="flex-1 p-4 md:p-6"
    >
      {children}
    </ModuleChrome>
  );
}

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#f4f5f6] flex items-center justify-center text-sm text-gray-400">
          Loading Notes…
        </div>
      }
    >
      <NotesLayoutInner>{children}</NotesLayoutInner>
    </React.Suspense>
  );
}
