'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  LogOut,
  LayoutDashboard,
  Warehouse,
  Scissors,
  Layers,
  Factory,
} from 'lucide-react';
import { BrandHeader } from '@/components/BrandHeader';
import { CollapsibleSidebar } from '@/components/CollapsibleSidebar';
import { performLogout } from '@/lib/auth-logout';
import { useSidebarCollapsed } from '../../lib/sidebar-collapse';
import { MfgWorkspaceSidebar } from './components/mfg-workspace-sidebar';
import { isTextileWeavingCompany, useCompanyOptional } from '@/lib/company-context';

const WEAVING_LINKS = [
  { href: '/manufacturing/weaving', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/manufacturing/weaving/godown', label: 'Godown Register', icon: Warehouse },
  { href: '/manufacturing/weaving/twisting', label: 'Twisting / Coning', icon: Scissors },
  { href: '/manufacturing/weaving/warping', label: 'Warping (Beams)', icon: Layers },
  { href: '/manufacturing/weaving/looms', label: 'Looms & Wages', icon: Factory },
];

export function MfgSidebar({ workspaceSlug }: { workspaceSlug: string }) {
  const { collapsed } = useSidebarCollapsed();
  const pathname = usePathname();
  const companyCtx = useCompanyOptional();
  const weavingMode =
    pathname.startsWith('/manufacturing/weaving') ||
    isTextileWeavingCompany(companyCtx?.activeCompany);

  return (
    <CollapsibleSidebar expandedClassName="w-64" expandedWidth={256}>
      <BrandHeader subtitle={weavingMode ? 'Textile Weaving' : 'Manufacturing Module'} />

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar min-h-0">
        {!collapsed && (
          <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-3 sidebar-expanded-only">
            {weavingMode ? 'WEAVING NAVIGATION' : 'MANUFACTURING NAVIGATION'}
          </p>
        )}
        {weavingMode ? (
          <div className="space-y-1">
            {WEAVING_LINKS.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    active
                      ? 'bg-white/15 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium sidebar-expanded-only">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <MfgWorkspaceSidebar workspaceSlug={workspaceSlug} />
        )}
      </div>

      <div className="px-3 pb-6 flex-shrink-0">
        <Link
          href="/dashboard"
          title="Main Dashboard"
          className="w-full flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg transition-all text-white/60 hover:text-white hover:bg-white/5"
        >
          <Home className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium sidebar-expanded-only">Main Dashboard</span>
        </Link>
        <button
          type="button"
          title="Logout"
          onClick={() => void performLogout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-white/40 hover:text-white/60 hover:bg-white/5 rounded-lg transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium sidebar-expanded-only">Logout</span>
        </button>
      </div>
    </CollapsibleSidebar>
  );
}
