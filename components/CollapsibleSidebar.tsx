'use client';

import type { ReactNode } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useSidebarCollapsed, useSidebarWidthVar } from '../lib/sidebar-collapse';

type CollapsibleSidebarProps = {
  children: ReactNode;
  /** Tailwind width when expanded, e.g. w-56 / w-64 */
  expandedClassName?: string;
  /** Pixel width when expanded (drives content margin CSS var) */
  expandedWidth?: number;
  /** Fixed left rail (module layouts) vs in-flow (hub pages) */
  fixed?: boolean;
  /** Full viewport height vs min-height for in-flow hubs */
  fullHeight?: boolean;
  className?: string;
  bgClassName?: string;
};

/**
 * Shared app sidebar shell: collapse to icons-only, expand to full labels.
 * State is shared + persisted so every module sidebar stays in sync.
 */
export function CollapsibleSidebar({
  children,
  expandedClassName = 'w-64',
  expandedWidth = 256,
  fixed = true,
  fullHeight = true,
  className = '',
  bgClassName = 'bg-[#00274d]',
}: CollapsibleSidebarProps) {
  const { collapsed, toggle } = useSidebarCollapsed();
  useSidebarWidthVar(expandedWidth);

  return (
    <aside
      data-app-sidebar
      data-collapsed={collapsed ? 'true' : 'false'}
      className={[
        collapsed ? 'w-16' : expandedClassName,
        fullHeight ? 'h-screen' : 'min-h-screen',
        bgClassName,
        'text-white flex flex-col shadow-xl flex-shrink-0 transition-[width] duration-200 ease-out z-30 overflow-hidden',
        fixed ? 'fixed left-0 top-0' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={`flex-shrink-0 border-b border-white/10 ${
          collapsed ? 'flex justify-center px-1 py-2' : 'flex justify-end px-2 py-2'
        }`}
      >
        <button
          type="button"
          data-sidebar-toggle
          onClick={toggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">{children}</div>
    </aside>
  );
}

/** Main column that tracks the live sidebar width CSS variable. */
export function SidebarMain({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`min-h-screen flex flex-col transition-[margin] duration-200 ease-out ${className}`}
      style={{ marginLeft: 'var(--app-sidebar-width, 16rem)' }}
    >
      {children}
    </div>
  );
}
