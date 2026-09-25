'use client';

import { useEffect, useState, type ComponentType } from 'react';
import Image from 'next/image';
import {
  Phone,
  Headset,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { TopBarBrand } from '../../components/BrandHeader';
import ProfileDropdown from '../../components/ProfileDropdown';
import SubscriptionStatusBanner from '../../components/SubscriptionStatusBanner';
import AppBreadcrumbs from '../../components/AppBreadcrumbs';
import GlobalSearch from '../../components/GlobalSearch';
import CompanySwitcher from '../../components/CompanySwitcher';
import AllCompaniesOverview from '../../components/AllCompaniesOverview';
import { useCompanyOptional } from '../../lib/company-context';
import {
  SalesAppIcon,
  PurchasesAppIcon,
  InventoryAppIcon,
  AccountingAppIcon,
  PosAppIcon,
  HrAppIcon,
  TaxAppIcon,
  SearchAppIcon,
  SupportAppIcon,
  ProfileAppIcon,
  CompanyAppIcon,
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
  action?: 'search' | 'profile' | 'company';
};

const modules: ModuleItem[] = [
  {
    title: 'Sales',
    href: '/sales/dashboard',
    Icon: SalesAppIcon,
    detail: 'Create quotations, manage orders, and track customer invoices in one place.',
  },
  {
    title: 'Purchases',
    href: '/purchases',
    Icon: PurchasesAppIcon,
    detail: 'Raise purchase orders, receive goods, and control vendor bills smoothly.',
  },
  {
    title: 'Inventory',
    href: '/warehouse/dashboard',
    Icon: InventoryAppIcon,
    detail: 'Track stock levels, warehouses, and product movements in real time.',
  },
  {
    title: 'Accounting',
    href: '/accounting/dashboard',
    Icon: AccountingAppIcon,
    detail: 'Let’s automate your bills, bank transactions and accounting processes.',
  },
  {
    title: 'Point of Sale',
    href: '/pos',
    Icon: PosAppIcon,
    detail: 'Run fast checkout counters with receipts, payments, and live sales updates.',
  },
  {
    title: 'HR Management',
    href: '/hr/dashboard',
    Icon: HrAppIcon,
    detail: 'Manage employees, attendance, payroll, and HR records from one dashboard.',
  },
  {
    title: 'Tax Compliance',
    href: '/tax',
    Icon: TaxAppIcon,
    detail: 'Stay compliant with tax filings, reports, and registration details.',
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
    action: 'company',
    Icon: CompanyAppIcon,
    detail: 'Switch between companies or create a new company for your workspace.',
  },
];

function openHeaderAction(action: ModuleItem['action']) {
  if (!action || typeof window === 'undefined') return;
  const eventName =
    action === 'search'
      ? 'open-global-search'
      : action === 'profile'
        ? 'open-profile-dropdown'
        : 'open-company-switcher';
  window.dispatchEvent(new Event(eventName));
}

export default function DashboardPage() {
  const companyCtx = useCompanyOptional();
  const isAllCompanies = companyCtx?.isAllCompanies === true;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const banner = banners[currentIndex];

  return (
    <div className="flex min-h-screen bg-[#111827]">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <header className="bg-[#1f2937] border-b border-[#374151] px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 flex-shrink-0">
          <div className="min-w-0 shrink">
            <TopBarBrand title="Main Dashboard" dark />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 min-w-0 shrink-0">
            <CompanySwitcher compact />

            <button
              type="button"
              onClick={() => { window.location.href = '/support'; }}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 text-sm text-white/80 hover:text-white hover:bg-[#374151] rounded-lg transition-all"
              title="Support Ticket"
            >
              <Headset className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Support Ticket</span>
              <ChevronDown className="w-3 h-3 hidden md:inline" />
            </button>

            <div className="hidden lg:block w-px h-6 bg-[#374151]" />

            <div className="hidden lg:flex items-center text-sm text-white/80">
              <Phone className="w-4 h-4 text-[#00C2FF]" />
            </div>

            <div className="hidden sm:block w-px h-6 bg-[#374151]" />

            <GlobalSearch />

            <div className="w-px h-6 bg-[#374151]" />

            <ProfileDropdown accentClassName="bg-[#014582]" />
          </div>
        </header>

        <AppBreadcrumbs />

        <SubscriptionStatusBanner />

        <div className="flex-1 px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-12 overflow-auto">
          <div className="w-full max-w-6xl mx-auto space-y-8 sm:space-y-10">
            {/* Auto-rotating ERP / accounting banners */}
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

            {isAllCompanies ? (
              <AllCompaniesOverview />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-10 pb-28 sm:pb-32">
                {modules.map((mod) => {
                  const Icon = mod.Icon;
                  return (
                    <button
                      key={mod.title}
                      type="button"
                      onClick={() => {
                        if (mod.action) {
                          openHeaderAction(mod.action);
                          return;
                        }
                        if (mod.href) window.location.href = mod.href;
                      }}
                      className="group relative z-0 hover:z-40 focus-within:z-40 flex flex-col items-center justify-center gap-3 sm:gap-4 md:gap-5 py-8 sm:py-10 md:py-12 px-3 sm:px-4 md:px-5 rounded-2xl sm:rounded-3xl bg-[#1a2332] hover:bg-[#243044] transition-colors duration-200"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-[96px] md:h-[96px] rounded-xl sm:rounded-2xl md:rounded-[22px] bg-[#111827] border border-white/5 flex items-center justify-center shadow-[0_0_20px_2px_rgba(113,75,103,0.18)] group-hover:shadow-[0_0_28px_6px_rgba(113,75,103,0.4)] transition-shadow duration-300">
                        <Icon className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16" />
                      </div>
                      <span className="text-xs sm:text-sm md:text-base font-medium text-white text-center leading-snug px-1">
                        {mod.title}
                      </span>

                      <div
                        className="pointer-events-none absolute left-1/2 top-[calc(100%-0.35rem)] w-[min(440px,calc(100vw-1.5rem))] max-w-[440px] -translate-x-1/2 opacity-0 translate-y-1 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:scale-100 transition-all duration-200 ease-out"
                        role="tooltip"
                      >
                        <div className="mx-auto h-0 w-0 border-l-[12px] border-r-[12px] border-b-[13px] border-l-transparent border-r-transparent border-b-[#37373f]" />
                        <div className="rounded-2xl bg-[#37373f] px-5 sm:px-6 py-5 sm:py-6 text-left shadow-xl shadow-black/40">
                          <p className="text-sm sm:text-base md:text-[17px] leading-relaxed text-white/90">
                            {mod.detail}
                          </p>
                          <p className="mt-4 sm:mt-5 text-right text-sm sm:text-base md:text-[16px] font-medium text-[#4ba392]">
                            Open →
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
