'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ChevronRight,
  Phone,
  Headset,
  ChevronDown,
  ShoppingCart,
  Package,
  Scale,
  UsersRound,
  Warehouse,
  Building2,
  Store,
} from 'lucide-react';
import { TopBarBrand } from '../../components/BrandHeader';
import ProfileDropdown from '../../components/ProfileDropdown';
import SubscriptionStatusBanner from '../../components/SubscriptionStatusBanner';
import { MainHubSidebar } from '../../components/MainHubSidebar';
import AppBreadcrumbs from '../../components/AppBreadcrumbs';

const banners = [
  {
    title: 'Advanced Financial\nReports',
    subtitle: 'Cash flow, balance sheet & aged receivables at your fingertips',
    badge: 'NEW FEATURE',
    btnText: 'Explore Reports',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80',
    accentColor: '#00C2FF',
  },
  {
    title: 'Inventory\nModule Live',
    subtitle: 'Manage inventory, orders & stock all in one place',
    badge: 'NOW LIVE',
    btnText: 'Open Warehouse',
    image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=1200&q=80',
    accentColor: '#014582',
  },
  {
    title: 'Bank-Grade\nSecurity',
    subtitle: 'Your financial data is encrypted and always protected',
    badge: 'ALWAYS ON',
    btnText: 'Learn More',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&q=80',
    accentColor: '#00E676',
  },
];

const modules = [
  {
    title: 'Sales',
    href: '/sales/dashboard',
    icon: ShoppingCart,
    color: '#00E676',
    overview:
      'Quotations, orders, invoices, deliveries, customers and sales reports — from quote to cash in one place.',
  },
  {
    title: 'Purchases',
    href: '/purchases',
    icon: Package,
    color: '#00E676',
    overview:
      'Requisitions, purchase orders, goods receiving, supplier bills and payments for the buying cycle.',
  },
  {
    title: 'Inventory',
    href: '/warehouse/dashboard',
    icon: Warehouse,
    color: '#014582',
    overview:
      'Stock, locations, products, movements, returns and inventory reports across every warehouse.',
  },
  {
    title: 'Accounting',
    href: '/accounting/dashboard',
    icon: Building2,
    color: '#014582',
    overview:
      'Chart of accounts, journals, bank, receivables, payables, and financial reports for the books.',
  },
  {
    title: 'Point of Sale',
    href: '/pos',
    icon: Store,
    color: '#00C2FF',
    overview:
      'Counter sales, shifts, receipts and walk-in checkout. Same inventory and customers as the rest of the app.',
  },
  {
    title: 'HR Management',
    href: '/hr/dashboard',
    icon: UsersRound,
    color: '#014582',
    overview:
      'Employees, offices, attendance geofence, leave, payroll, live tracking and the full employee file.',
  },
  {
    title: 'Tax Compliance',
    href: '/tax',
    icon: Scale,
    color: '#014582',
    overview:
      'VAT, GST and sales tax packs, rates and reports that apply across sales, purchases, POS and accounting.',
  },
];

export default function DashboardPage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const banner = banners[currentIndex];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MainHubSidebar activePath="/dashboard" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <TopBarBrand title="Main Dashboard" />

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => { window.location.href = '/support'; }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
            >
              <Headset className="w-4 h-4" />
              <span>Support Ticket</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            <div className="w-px h-6 bg-gray-200" />

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-[#014582]" />
            </div>

            <div className="w-px h-6 bg-gray-200" />

            <ProfileDropdown accentClassName="bg-[#014582]" />
          </div>
        </header>

        <AppBreadcrumbs />

        <SubscriptionStatusBanner />

        <div className="flex-1 p-6 overflow-auto">
          <div className="w-full max-w-6xl mx-auto space-y-6">
            <div className="relative w-full h-[420px] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src={banner.image}
                alt="Banner"
                fill
                className="object-cover"
                priority
              />

              <div className="absolute inset-0 bg-gradient-to-r from-[#0A2540]/95 via-[#0A2540]/70 to-transparent" />

              <div className="relative z-10 h-full flex flex-col justify-center px-12">
                <span className="inline-block px-3 py-1 text-xs font-bold tracking-wider rounded border border-white/30 bg-white/10 text-white/90 w-fit mb-4">
                  {banner.badge}
                </span>

                <h1 className="text-4xl font-extrabold text-white leading-tight mb-3 whitespace-pre-line">
                  {banner.title}
                </h1>

                <p className="text-white/60 text-base max-w-md mb-6">
                  {banner.subtitle}
                </p>

                <button
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105 w-fit"
                  style={{ backgroundColor: banner.accentColor, color: '#0A2540' }}
                >
                  {banner.btnText}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/30'
                      }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">Modules</h2>
              <p className="text-sm text-gray-500 mb-4">
                Open any module. Each card is a short overview — tap to go in.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {modules.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <button
                      key={mod.href}
                      type="button"
                      onClick={() => { window.location.href = mod.href; }}
                      className="text-left bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-[#014582]/20 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${mod.color}1A` }}
                          >
                            <Icon className="w-6 h-6" style={{ color: mod.color }} />
                          </div>
                          <h3 className="text-lg font-bold text-gray-800">{mod.title}</h3>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">{mod.overview}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
