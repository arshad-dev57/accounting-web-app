'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

export type ModuleTopNavItem = {
  label: string;
  href: string;
  keepAliveProps?: Record<string, unknown>;
};

export type ModuleTopNavGroup = {
  label: string;
  items: ModuleTopNavItem[];
};

export function ModuleTopNav({ groups }: { groups: ModuleTopNavGroup[] }) {
  const pathname = usePathname();
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOpenLabel(null);
  }, [pathname]);

  useEffect(() => {
    if (!openLabel) return undefined;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpenLabel(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenLabel(null);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openLabel]);

  const isActiveHref = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const visibleGroups = groups.filter((g) => g.items.length > 0);

  return (
    <div ref={ref} className="relative border-t border-slate-200 bg-white">
      <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 custom-scrollbar">
        {visibleGroups.map((group) => {
          const groupActive = group.items.some((item) => isActiveHref(item.href));
          const isOpen = openLabel === group.label;
          return (
            <button
              key={group.label}
              type="button"
              onClick={() => setOpenLabel((prev) => (prev === group.label ? null : group.label))}
              className={[
                'inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
                isOpen || groupActive
                  ? 'bg-[#014582] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              ].join(' ')}
            >
              <span>{group.label}</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          );
        })}
      </div>

      {openLabel && (() => {
        const group = visibleGroups.find((g) => g.label === openLabel);
        if (!group) return null;
        return (
          <div className="absolute left-0 right-0 top-full z-40 border-b border-slate-200 bg-white shadow-xl">
            <div className="max-h-[min(60vh,420px)] overflow-y-auto px-4 py-3">
              <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
              <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.items.map((item) => {
                  const active = isActiveHref(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      {...(item.keepAliveProps || {})}
                      onClick={() => setOpenLabel(null)}
                      className={[
                        'rounded-lg px-3 py-2 text-sm transition-colors',
                        active
                          ? 'bg-[#014582] font-semibold text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      ].join(' ')}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
