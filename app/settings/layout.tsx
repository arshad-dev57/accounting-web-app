'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Hash,
  Coins,
  Package,
  HeartHandshake,
  Image as ImageIcon,
  UserCircle,
  Link2,
  Ruler,
  Users,
  Tags,
  Award,
  SlidersHorizontal,
  Save,
  HardDrive,
  FileText,
  Palette,
} from 'lucide-react';
import { CollapsibleSidebar } from '../../components/CollapsibleSidebar';
import { ModuleChrome } from '../../components/ModuleChrome';
import { useSidebarCollapsed } from '../../lib/sidebar-collapse';
import { SETTINGS_NAV, requestSettingsSave, type SettingsNavItem } from './nav';

const ICON_MAP: Record<SettingsNavItem['iconKey'], React.ReactNode> = {
  company: <Building2 className="w-4 h-4" />,
  themes: <Palette className="w-4 h-4" />,
  invoice: <Hash className="w-4 h-4" />,
  currency: <Coins className="w-4 h-4" />,
  stock: <Package className="w-4 h-4" />,
  donation: <HeartHandshake className="w-4 h-4" />,
  images: <ImageIcon className="w-4 h-4" />,
  account: <UserCircle className="w-4 h-4" />,
  linked: <Link2 className="w-4 h-4" />,
  units: <Ruler className="w-4 h-4" />,
  agents: <Users className="w-4 h-4" />,
  categories: <Tags className="w-4 h-4" />,
  brands: <Award className="w-4 h-4" />,
  fields: <SlidersHorizontal className="w-4 h-4" />,
  backup: <HardDrive className="w-4 h-4" />,
  pdf: <FileText className="w-4 h-4" />,
};

const NO_SAVE_PATHS = new Set([
  '/settings/backup-restore',
  '/settings/pdf-reports',
  '/settings/currency',
  '/settings/themes',
]);

function SettingsSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed } = useSidebarCollapsed();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <CollapsibleSidebar expandedClassName="w-64" expandedWidth={256}>
      <div className="px-4 pt-4 pb-3 border-b border-white/10 flex-shrink-0">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className={`flex items-center gap-2 text-white hover:text-white/90 transition-colors ${
            collapsed ? 'justify-center w-full' : ''
          }`}
          title="Back to modules"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          {!collapsed && (
            <div className="text-left sidebar-expanded-only">
              <p className="text-base font-bold leading-tight">Settings</p>
              <p className="text-[11px] text-white/45 font-medium">Company Preferences</p>
            </div>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 custom-scrollbar">
        {SETTINGS_NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? 'text-white bg-[#014582] shadow-md shadow-[#014582]/30 font-semibold'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={active ? 'text-white' : 'text-white/45'}>
                {ICON_MAP[item.iconKey]}
              </span>
              <span className="sidebar-expanded-only truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {!NO_SAVE_PATHS.has(pathname) && (
        <div className="px-3 pb-5 pt-2 flex-shrink-0 border-t border-white/10">
          <button
            type="button"
            onClick={() => requestSettingsSave()}
            title="Save Settings"
            className={`w-full flex items-center justify-center gap-2 rounded-lg bg-[#014582] hover:bg-[#01366a] text-white text-sm font-semibold shadow-lg shadow-[#014582]/25 transition-colors ${
              collapsed ? 'px-2 py-2.5' : 'px-4 py-2.5'
            }`}
          >
            <Save className="w-4 h-4 shrink-0" />
            <span className="sidebar-expanded-only">Save Settings</span>
          </button>
        </div>
      )}
    </CollapsibleSidebar>
  );
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ModuleChrome
      title="Settings"
      icon={<SlidersHorizontal className="w-5 h-5 text-[#014582]" />}
      sidebar={<SettingsSidebar />}
      topGroups={[
        {
          label: 'Settings',
          items: SETTINGS_NAV.map((item) => ({ label: item.label, href: item.href }))
        }
      ]}
      headerRightExtra={
        !NO_SAVE_PATHS.has(pathname) ? (
          <button
            type="button"
            onClick={() => requestSettingsSave()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#014582] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#01366a]"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        ) : null
      }
      mainClassName="bg-[#f3f4f6]"
      contentClassName="flex-1 p-6"
    >
      {children}
    </ModuleChrome>
  );
}
