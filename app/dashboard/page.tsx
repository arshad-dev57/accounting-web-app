'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState, useMemo, type ComponentType } from 'react';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { usePermissions } from '../../lib/usePermissions';
import { TopBarBrand } from '../../components/BrandHeader';
import ProfileDropdown from '../../components/ProfileDropdown';
import NotificationDropdown from '../../components/NotificationDropdown';
import SubscriptionStatusBanner from '../../components/SubscriptionStatusBanner';
import AppBreadcrumbs from '../../components/AppBreadcrumbs';
import GlobalSearch from '../../components/GlobalSearch';
import {
  SalesAppIcon,
  PurchasesAppIcon,
  InventoryAppIcon,
  AccountingAppIcon,
  PosAppIcon,
  HrAppIcon,
  TaxAppIcon,
  ManufacturingAppIcon,
  SearchAppIcon,
  SupportAppIcon,
  ProfileAppIcon,
  CompanyAppIcon,
  UsersAppIcon,
  ImportAppIcon,
  ExportAppIcon,
  TradingAppIcon,
} from '../../components/dashboard/ModuleAppIcons';

const banners = [
  {
    title: 'Advanced Financial\nReports',
    subtitle: 'Cash flow, balance sheet & aged receivables at your fingertips',
    badge: 'NEW FEATURE',
    btnText: 'Explore Reports',
    href: '/accounting/reports',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80',
    accentColor: '#00C2FF',
  },
  {
    title: 'Inventory\nModule Live',
    subtitle: 'Manage inventory, orders & stock all in one place',
    badge: 'NOW LIVE',
    btnText: 'Open Inventory',
    href: '/warehouse/dashboard',
    image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=1200&q=80',
    accentColor: '#014582',
  },
  {
    title: 'Bank-Grade\nSecurity',
    subtitle: 'Your financial data is encrypted and always protected',
    badge: 'ALWAYS ON',
    btnText: 'Learn More',
    href: '/accounting/dashboard',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&q=80',
    accentColor: '#00E676',
  },
];

type ModuleItem = {
  title: string;
  detail: string;
  Icon: ComponentType<{ className?: string }>;
  href?: string;
  action?: 'search' | 'profile';
  /** Key used with canAccessDashboardModule / dashboard.module_<key>.view */
  permModule?: string;
  /** Hide from non-admin users entirely */
  adminOnly?: boolean;
};

const modules: ModuleItem[] = [
  {
    title: 'Accounting',
    href: '/accounting/dashboard',
    Icon: AccountingAppIcon,
    detail: 'Let\'s automate your bills, bank transactions and accounting processes.',
    permModule: 'accounting',
  },
  {
    title: 'Sales',
    href: '/sales/dashboard',
    Icon: SalesAppIcon,
    detail: 'Create quotations, manage orders, and track customer invoices in one place.',
    permModule: 'sales',
  },
  {
    title: 'Purchases',
    href: '/purchases',
    Icon: PurchasesAppIcon,
    detail: 'Raise purchase orders, receive goods, and control vendor bills smoothly.',
    permModule: 'purchases',
  },
  {
    title: 'Inventory',
    href: '/warehouse/dashboard',
    Icon: InventoryAppIcon,
    detail: 'Track stock levels, warehouses, and product movements in real time.',
    permModule: 'inventory',
  },
  {
    title: 'Manufacturing',
    href: '/manufacturing/dashboard',
    Icon: ManufacturingAppIcon,
    detail: 'BOMs, production orders, work centers, MRP and shop-floor control in one place.',
    permModule: 'manufacturing',
  },
  {
    title: 'Import Management',
    href: '/import/dashboard',
    Icon: ImportAppIcon,
    detail: 'Import mock book for RFQs, shipments, customs and landed costs — POs/GRN/bills link to Purchases.',
    permModule: 'import',
  },
  {
    title: 'Export Management',
    href: '/export/dashboard',
    Icon: ExportAppIcon,
    detail: 'Overseas export mock book (ESO-*) — sales orders, dispatches and receipts link to Sales.',
    permModule: 'export',
  },
  {
    title: 'Trading Management',
    href: '/trading/dashboard',
    Icon: TradingAppIcon,
    detail: 'Domestic wholesale mock book (TSO-*) — separate from Export; posts via Sales/Purchases.',
    permModule: 'trading',
  },
  {
    title: 'HR Management',
    href: '/hr/dashboard',
    Icon: HrAppIcon,
    detail: 'Manage employees, attendance, payroll, and HR records from one dashboard.',
    permModule: 'hr',
  },
  {
    title: 'Tax Compliance',
    href: '/tax',
    Icon: TaxAppIcon,
    detail: 'Stay compliant with tax filings, reports, and registration details.',
    permModule: 'tax',
  },
  {
    title: 'Users',
    href: '/users',
    Icon: UsersAppIcon,
    detail: 'Invite team members, manage roles, and control access across your company.',
    permModule: 'users',
  },
  {
    title: 'Point of Sale',
    href: '/pos',
    Icon: PosAppIcon,
    detail: 'Run fast checkout counters with receipts, payments, and live sales updates.',
    permModule: 'pos',
  },
  {
    title: 'Search',
    action: 'search',
    Icon: SearchAppIcon,
    detail: 'Quickly find any page or feature across your entire business suite.',
  },
  {
    title: 'Support',
    href: '/support',
    Icon: SupportAppIcon,
    detail: 'Raise support tickets and get help whenever you need assistance.',
  },
  {
    title: 'Profile',
    action: 'profile',
    Icon: ProfileAppIcon,
    detail: 'Update your company profile, contact details, logo, and signature.',
  },
  {
    title: 'Company',
    href: '/companies',
    Icon: CompanyAppIcon,
    detail: 'Create a new company or manage your workspace companies from one place.',
    // Only admins / company managers — not regular role users
    adminOnly: true,
  },
];

const TILE_OFFSETS_KEY = 'dashboard-tile-offsets-v1';

/* Header ke andar ke components (search, profile, brand) ka text white karne ke liye.
   Dropdown / popup panels (role=menu/listbox/dialog ya data-header-panel) ko chhod diya hai
   taake wo white bg par readable rahein. */
const headerCss = `
.dash-header :is(p, span, h1, h2, h3, a, label, svg, button, input):not(:is([role="menu"], [role="listbox"], [role="dialog"], [data-header-panel]) *) {
  color: #ffffff !important;
}
.dash-header input:not([data-header-panel] input) {
  background-color: rgba(255, 255, 255, 0.12) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
}
.dash-header input:not([data-header-panel] input)::placeholder {
  color: rgba(255, 255, 255, 0.7) !important;
}`;

function openHeaderAction(action: ModuleItem['action']) {
  if (!action || typeof window === 'undefined') return;

  if (action === 'search') {
    const scrollRoot = document.querySelector<HTMLElement>('[data-dashboard-scroll]');
    if (scrollRoot) {
      scrollRoot.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Let the header come into view before opening the search panel.
    window.setTimeout(() => {
      window.dispatchEvent(new Event('open-global-search'));
    }, 220);
    return;
  }

  window.dispatchEvent(new Event('open-profile-dropdown'));
}

export default function DashboardPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { canAccessDashboardModule, isAdmin, ready: permsReady } = usePermissions();

  /* ── Draggable tiles: har tile ka offset (x, y) save hota hai, refresh ke baad bhi rehta hai ── */
  const [offsets, setOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingTitle, setDraggingTitle] = useState<string | null>(null);
  const offsetsLoaded = useRef(false);
  const dragRef = useRef<{
    title: string;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    moved: boolean;
  } | null>(null);
  const justDragged = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TILE_OFFSETS_KEY);
      if (raw) setOffsets(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }
    offsetsLoaded.current = true;
  }, []);

  useEffect(() => {
    if (!offsetsLoaded.current || draggingTitle) return;
    try {
      localStorage.setItem(TILE_OFFSETS_KEY, JSON.stringify(offsets));
    } catch {
    
    }
  }, [offsets, draggingTitle]);

  const handleTilePointerDown = (e: React.PointerEvent<HTMLButtonElement>, title: string) => {
    if (e.button !== 0) return;
    const base = offsets[title] ?? { x: 0, y: 0 };
    dragRef.current = {
      title,
      startX: e.clientX,
      startY: e.clientY,
      baseX: base.x,
      baseY: base.y,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleTilePointerMove = (e: React.PointerEvent<HTMLButtonElement>, title: string) => {
    const d = dragRef.current;
    if (!d || d.title !== title) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < 5) return; // chhota hilna = click
    if (!d.moved) {
      d.moved = true;
      setDraggingTitle(title);
    }
    setOffsets((prev) => ({ ...prev, [title]: { x: d.baseX + dx, y: d.baseY + dy } }));
  };

  const endTileDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (d?.moved) {
      // is drag ke baad aane wala click ignore karo
      justDragged.current = true;
      window.setTimeout(() => {
        justDragged.current = false;
      }, 0);
    }
    dragRef.current = null;
    setDraggingTitle(null);
  };

  const resetTileLayout = () => {
    setOffsets({});
    try {
      localStorage.removeItem(TILE_OFFSETS_KEY);
    } catch {
      /* ignore */
    }
  };

  const visibleModules = useMemo(() => {
    if (isAdmin) return modules;
    // Wait until permissions are ready — no flash of wrong tiles
    if (!permsReady) return [];

    return modules.filter((m) => {
      if (m.adminOnly) return false;
      if (!m.permModule) return true; // Search, Support, Profile
      return canAccessDashboardModule(m.permModule);
    });
  }, [isAdmin, permsReady, canAccessDashboardModule]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const banner = banners[currentIndex];

  return (
    <div className="flex min-h-screen bg-[#f3f4f6]">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <header className="dash-header bg-[#014582] text-white border-b border-white/15 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 flex-shrink-0">
          <style>{headerCss}</style>
          <div className="min-w-0 shrink">
            <TopBarBrand title="Main Dashboard" />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 min-w-0 shrink-0">
            <GlobalSearch />
            <NotificationDropdown />

            <div className="w-px h-6 bg-white/30" />

            <ProfileDropdown accentClassName="bg-white/20" />
          </div>
        </header>

        <AppBreadcrumbs />

        <SubscriptionStatusBanner />

        {/* Grid via shared .app-square-grid (same as SidebarMain / rest of app) */}
        <div
          data-dashboard-scroll
          className="app-square-grid flex-1 px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-12 overflow-auto"
        >
          <div className="w-full max-w-6xl mx-auto space-y-8 sm:space-y-10">

            {/* Banner */}
            <div className="relative w-full h-[220px] sm:h-[300px] md:h-[380px] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src={banner.image}
                alt={banner.badge}
                fill
                className="object-cover transition-opacity duration-500"
                priority
                sizes="(max-width: 768px) 100vw, 1152px"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A2540]/95 via-[#0A2540]/70 to-transparent" />

              <div className="relative z-10 h-full flex flex-col justify-center px-5 sm:px-8 md:px-12">
                <span className="inline-block px-3 py-1 text-[10px] sm:text-xs font-bold tracking-wider rounded border border-white/30 bg-white/10 text-white/90 w-fit mb-3 sm:mb-4">
                  {banner.badge}
                </span>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-2 sm:mb-3 whitespace-pre-line">
                  {banner.title}
                </h1>
                <p className="text-white/60 text-sm sm:text-base max-w-md mb-4 sm:mb-6">
                  {banner.subtitle}
                </p>
                <button
                  type="button"
                  onClick={() => { window.location.href = banner.href; }}
                  className="flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105 w-fit text-[#0A2540]"
                  style={{ backgroundColor: banner.accentColor }}
                >
                  {banner.btnText}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Go to slide ${index + 1}`}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'w-6 bg-white'
                        : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </div>

            {Object.keys(offsets).length > 0 && (
              <div className="flex justify-end -mb-4">
                <button
                  type="button"
                  onClick={resetTileLayout}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#e5e7eb] text-xs font-semibold text-[#014582] hover:bg-[#f3f4f6] transition-colors"
                >
                  Reset layout
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-10 pb-28 sm:pb-32">
              {!isAdmin && !permsReady
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={`skel-${i}`}
                      className="flex flex-col items-center justify-center gap-4 py-10 px-4 rounded-3xl bg-white border border-[#e5e7eb] animate-pulse"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-gray-100" />
                      <div className="h-3 w-20 rounded bg-gray-100" />
                    </div>
                  ))
                : visibleModules.map((mod) => {
                    const Icon = mod.Icon;
                    const off = offsets[mod.title];
                    const isDragging = draggingTitle === mod.title;
                    return (
                      <button
                        key={mod.title}
                        type="button"
                        onPointerDown={(e) => handleTilePointerDown(e, mod.title)}
                        onPointerMove={(e) => handleTilePointerMove(e, mod.title)}
                        onPointerUp={endTileDrag}
                        onPointerCancel={endTileDrag}
                        style={{
                          transform: off || isDragging
                            ? `translate(${off?.x ?? 0}px, ${off?.y ?? 0}px)${isDragging ? ' scale(1.04)' : ''}`
                            : undefined,
                          zIndex: isDragging ? 50 : undefined,
                        }}
                        onClick={() => {
                          if (justDragged.current) return;
                          if (mod.action) {
                            openHeaderAction(mod.action);
                            return;
                          }
                          if (mod.href) window.location.href = mod.href;
                        }}
                        className={`select-none md:touch-none ${isDragging ? 'cursor-grabbing shadow-2xl' : 'cursor-grab'} group relative z-0 hover:z-40 focus-within:z-40 flex flex-col items-center justify-center gap-3 sm:gap-4 md:gap-5 py-8 sm:py-10 md:py-12 px-3 sm:px-4 md:px-5 rounded-2xl sm:rounded-3xl bg-white hover:bg-[#f3f4f6] transition-colors duration-200 shadow-sm border border-[#e5e7eb]`}
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-[96px] md:h-[96px] rounded-xl sm:rounded-2xl md:rounded-[22px] bg-[#f3f4f6] border border-gray-200 flex items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.06)] group-hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)] transition-shadow duration-300">
                          <Icon className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16" />
                        </div>
                        <span className="text-xs sm:text-sm md:text-base font-medium text-gray-800 text-center leading-snug px-1">
                          {mod.title}
                        </span>

                        {!isDragging && (
                        <div
                          className="pointer-events-none absolute left-1/2 top-[calc(100%-0.35rem)] w-[min(440px,calc(100vw-1.5rem))] max-w-[440px] -translate-x-1/2 opacity-0 translate-y-1 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:scale-100 transition-all duration-200 ease-out"
                          role="tooltip"
                        >
                          <div className="mx-auto h-0 w-0 border-l-[12px] border-r-[12px] border-b-[13px] border-l-transparent border-r-transparent border-b-[#1e293b]" />
                          <div className="rounded-2xl bg-[#1e293b] px-5 sm:px-6 py-5 sm:py-6 text-left shadow-xl shadow-black/20">
                            <p className="text-sm sm:text-base md:text-[17px] leading-relaxed text-white/90">
                              {mod.detail}
                            </p>
                            <p className="mt-4 sm:mt-5 text-right text-sm sm:text-base md:text-[16px] font-medium text-[#00C2FF]">
                              Open →
                            </p>
                          </div>
                        </div>
                        )}
                      </button>
                    );
                  })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}