'use client';

import React from 'react';
import { Factory, Headset, Phone } from 'lucide-react';
import { TopBarBrand } from '../../components/BrandHeader';
import ProfileDropdown from '../../components/ProfileDropdown';
import AppBreadcrumbs from '../../components/AppBreadcrumbs';
import GlobalSearch from '../../components/GlobalSearch';
import { LocationProvider } from '@/lib/location-context';
import { FiscalYearProvider } from '@/lib/fiscal-year-context';
import { usePermissions } from '@/lib/usePermissions';
import { MfgSidebar } from './nav';

export default function ManufacturingLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, hasModuleAccess, loading } = usePermissions();
  const allowed = isAdmin || hasModuleAccess('manufacturing');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#014582] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-[#DDE4EE] p-8 max-w-md text-center shadow-sm">
          <Factory className="w-10 h-10 text-[#014582] mx-auto mb-4" />
          <h1 className="text-lg font-bold text-[#1A1A2E]">Manufacturing</h1>
          <p className="text-sm text-[#7A8FA6] mt-2">
            You do not have permission to access the Manufacturing module. Contact your
            administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <FiscalYearProvider>
      <LocationProvider>
        <MfgSidebar />
        <div className="ml-64 min-h-screen bg-gray-50 flex flex-col">
          <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
            <TopBarBrand title="Manufacturing" icon={<Factory className="w-5 h-5 text-[#014582]" />} />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-[#014582]" />
              </div>
              <div className="w-px h-6 bg-gray-200" />
              <button
                type="button"
                onClick={() => { window.location.href = '/support'; }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
              >
                <Headset className="w-4 h-4" />
                <span>Support</span>
              </button>
              <div className="w-px h-6 bg-gray-200" />
              <GlobalSearch />
              <div className="w-px h-6 bg-gray-200" />
              <ProfileDropdown accentClassName="bg-[#014582]" />
            </div>
          </header>
          <AppBreadcrumbs />
          <div className="flex-1 p-6">{children}</div>
        </div>
      </LocationProvider>
    </FiscalYearProvider>
  );
}
