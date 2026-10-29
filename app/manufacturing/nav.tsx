'use client';

import React from 'react';
import Link from 'next/link';
import { Home, LogOut, Factory } from 'lucide-react';
import { BrandHeader } from '@/components/BrandHeader';
import { CollapsibleSidebar } from '@/components/CollapsibleSidebar';
import { performLogout } from '@/lib/auth-logout';
import { useSidebarCollapsed } from '../../lib/sidebar-collapse';
import { MfgWorkspaceSidebar } from './components/mfg-workspace-sidebar';

export function MfgSidebar({ workspaceSlug }: { workspaceSlug: string }) {
  const { collapsed } = useSidebarCollapsed();

  return (
    <CollapsibleSidebar expandedClassName="w-64" expandedWidth={256}>
      <BrandHeader subtitle="Manufacturing Module" />

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar min-h-0">
        {!collapsed && (
          <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-3 sidebar-expanded-only">
            MANUFACTURING NAVIGATION
          </p>
        )}
        <MfgWorkspaceSidebar workspaceSlug={workspaceSlug} />
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
