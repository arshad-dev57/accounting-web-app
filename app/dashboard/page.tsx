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
} from 'lucide-react';
import { TopBarBrand } from '../../components/BrandHeader';
import ProfileDropdown from '../../components/ProfileDropdown';
import SubscriptionStatusBanner from '../../components/SubscriptionStatusBanner';
import { MainHubSidebar } from '../../components/MainHubSidebar';

// ============================================================
// BANNER SLIDER
// ============================================================
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
    title: 'Warehouse\nModule Live',
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

// ============================================================
// MAIN DASHBOARD
// ============================================================
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
        {/* Top Bar */}
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

        <SubscriptionStatusBanner />

        {/* Body - Slider and Cards */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="w-full max-w-6xl mx-auto space-y-6">
            {/* Banner Slider */}
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
                <span 
                  className="inline-block px-3 py-1 text-xs font-bold tracking-wider rounded border border-white/30 bg-white/10 text-white/90 w-fit mb-4"
                >
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
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Sales and Purchases Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sales Card */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#00E676]/10 rounded-xl flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-[#00E676]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Sales</h3>
                      <p className="text-sm text-gray-500">Manage your sales</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Sales Today</span>
                    <span className="text-lg font-bold text-gray-800">$0.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Orders Today</span>
                    <span className="text-lg font-bold text-gray-800">0</span>
                  </div>
                </div>
              </div>

              {/* Purchases Card */}
              <div 
                onClick={() => window.location.href = '/purchases'}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#00E676]/10 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-[#00E676]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Purchases</h3>
                      <p className="text-sm text-gray-500">Manage your purchases</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Purchases Today</span>
                    <span className="text-lg font-bold text-gray-800">$0.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Purchase Orders Today</span>
                    <span className="text-lg font-bold text-gray-800">0</span>
                  </div>
                </div>
              </div>

              <div
                onClick={() => window.location.href = '/tax'}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#014582]/10 rounded-xl flex items-center justify-center">
                      <Scale className="w-6 h-6 text-[#014582]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Tax Compliance</h3>
                      <p className="text-sm text-gray-500">VAT, GST & sales tax</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Country packs</span>
                    <span className="text-lg font-bold text-gray-800">16</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Manage globally</span>
                    <span className="text-sm font-semibold text-[#014582]">Open</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
