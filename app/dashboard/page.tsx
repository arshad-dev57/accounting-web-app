'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Home, 
  Warehouse, 
  Building2, 
  HelpCircle,
  ChevronRight,
  LogOut,
  Phone,
  Headset,
  ChevronDown,
  User
} from 'lucide-react';

// ============================================================
// SIDEBAR
// ============================================================
function Sidebar() {
  const [activeIndex, setActiveIndex] = useState(0);

  const menuItems = [
    { icon: <Home className="w-5 h-5" />, label: 'Home', path: '/dashboard' },
    { icon: <Building2 className="w-5 h-5" />, label: 'Accounting', path: '/accounting/dashboard' },
    { icon: <Warehouse className="w-5 h-5" />, label: 'Warehouse', path: '/warehouse/dashboard' },
  ];

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="w-56 min-h-screen bg-[#1a1a2e] text-white flex flex-col shadow-xl flex-shrink-0">
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div className="w-10 h-10 bg-[#7c4dff] rounded-xl flex items-center justify-center">
          <span className="text-xl font-bold">W</span>
        </div>
        <span className="text-lg font-extrabold tracking-wider">WarehousePro</span>
      </div>

      <div className="flex-1 px-3 py-4 space-y-1">
        <p className="px-2 text-[10px] font-semibold text-white/30 tracking-wider mb-3">
          MAIN MENU
        </p>
        
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleNavigation(item.path)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group
              ${activeIndex === index 
                ? 'bg-[#7c4dff]/20 text-[#b388ff]' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
          >
            <div className="flex items-center gap-3">
              <span className={activeIndex === index ? 'text-[#b388ff]' : 'text-white/40'}>
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            {activeIndex === index && (
              <ChevronRight className="w-4 h-4 text-[#b388ff]" />
            )}
          </button>
        ))}
      </div>

      <div className="px-3 pb-6">
        <div className="p-4 bg-[#7c4dff]/10 rounded-xl border border-[#7c4dff]/20">
          <HelpCircle className="w-5 h-5 text-[#b388ff] mb-2" />
          <p className="text-sm font-semibold text-white">Need Help?</p>
          <p className="text-xs text-white/40">Contact our support team</p>
        </div>
        
        <button className="w-full flex items-center gap-3 px-3 py-2.5 mt-3 text-white/40 hover:text-white/60 hover:bg-white/5 rounded-lg transition-all">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}

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
    accentColor: '#7C4DFF',
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
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all">
              <Headset className="w-4 h-4" />
              <span>Support Ticket</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            <div className="w-px h-6 bg-gray-200" />

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-[#7c4dff]" />
              <span>Call Us: 03 111 006 555</span>
            </div>

            <div className="w-px h-6 bg-gray-200" />

            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all">
              <div className="w-8 h-8 bg-[#7c4dff] rounded-full flex items-center justify-center text-white text-sm font-bold">
                A
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>
        </header>

        {/* Body - Only Slider */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-6xl">
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
          </div>
        </div>
      </div>
    </div>
  );
}