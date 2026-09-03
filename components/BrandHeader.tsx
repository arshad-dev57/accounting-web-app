'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  fetchProfileCached,
  invalidateProfileCache,
  profileToBranding,
} from '../lib/profile-cache';

export const APP_NAME = 'Bisonstechs';
export const APP_LOGO_FALLBACK = '/bisontechs.png';

const PROFILE_CACHE_KEY = 'bisonstechs_company_branding';

export type CompanyBranding = {
  logo: string;
  organizationName: string;
};

function readCachedBranding(): CompanyBranding {
  if (typeof window === 'undefined') {
    return { logo: APP_LOGO_FALLBACK, organizationName: APP_NAME };
  }
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CompanyBranding;
      return {
        logo: parsed.logo || APP_LOGO_FALLBACK,
        organizationName: parsed.organizationName || APP_NAME,
      };
    }
  } catch {
    /* ignore */
  }
  return { logo: APP_LOGO_FALLBACK, organizationName: APP_NAME };
}

function writeCachedBranding(branding: CompanyBranding) {
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(branding));
  } catch {
    /* ignore */
  }
}

function authToken() {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('auth_token') ||
    document.cookie
      .split('; ')
      .find((c) => c.startsWith('auth_token='))
      ?.split('=')[1] ||
    ''
  );
}

export function useCompanyBranding() {
  const [branding, setBranding] = useState<CompanyBranding>({
    logo: APP_LOGO_FALLBACK,
    organizationName: APP_NAME,
  });

  useEffect(() => {
    setBranding(readCachedBranding());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const profile = await fetchProfileCached();
        if (cancelled || !profile) return;
        const next = profileToBranding(profile);
        writeCachedBranding(next);
        setBranding(next);
      } catch {
        /* keep cached / fallback */
      }
    };

    load();
    const onRefresh = () => {
      invalidateProfileCache();
      void (async () => {
        const profile = await fetchProfileCached(true);
        if (cancelled || !profile) return;
        const next = profileToBranding(profile);
        writeCachedBranding(next);
        setBranding(next);
      })();
    };
    window.addEventListener('company-branding-updated', onRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener('company-branding-updated', onRefresh);
    };
  }, []);

  return branding;
}

type BrandHeaderProps = {
  subtitle?: string;
  compact?: boolean;
};

export function notifyCompanyBrandingUpdated(branding?: Partial<CompanyBranding>) {
  if (branding) {
    const current = readCachedBranding();
    writeCachedBranding({
      logo: branding.logo || current.logo || APP_LOGO_FALLBACK,
      organizationName: branding.organizationName || current.organizationName || APP_NAME,
    });
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('company-branding-updated'));
  }
}

function CompanyLogo({
  src,
  alt,
  className,
}: {
  src?: string;
  alt?: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || APP_LOGO_FALLBACK}
      alt={alt || APP_NAME}
      className={className || 'w-full h-full object-contain'}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = APP_LOGO_FALLBACK;
      }}
    />
  );
}

export function BrandHeader({ subtitle, compact = false }: BrandHeaderProps) {
  const { logo, organizationName } = useCompanyBranding();

  return (
    <div
      className={`flex items-center gap-3 border-b border-white/10 flex-shrink-0 ${
        compact ? 'px-4 py-4' : 'px-5 py-6'
      }`}
    >
      <div className="w-10 h-10 rounded-xl bg-white overflow-hidden flex items-center justify-center flex-shrink-0">
        <CompanyLogo src={logo} alt={organizationName || APP_NAME} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-extrabold tracking-wide text-white truncate">{APP_NAME}</p>
        <p className="text-[11px] text-white/50 truncate">
          {subtitle || organizationName || 'Business Suite'}
        </p>
      </div>
    </div>
  );
}

type TopBarBrandProps = {
  title: string;
  icon?: ReactNode;
  dark?: boolean;
};

export function TopBarBrand({ title, icon, dark = false }: TopBarBrandProps) {
  const { logo } = useCompanyBranding();

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div
        className={`w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 ${
          dark ? 'bg-white' : 'bg-white border border-gray-200'
        }`}
      >
        <CompanyLogo src={logo} />
      </div>
      <div className="min-w-0">
        <p
          className={`text-xs font-semibold tracking-wide truncate ${
            dark ? 'text-white/85' : 'text-gray-500'
          }`}
        >
          {APP_NAME}
        </p>
        <h1
          className={`text-lg font-bold flex items-center gap-2 leading-tight truncate ${
            dark ? 'text-white' : 'text-gray-800'
          }`}
        >
          {icon}
          {title}
        </h1>
      </div>
    </div>
  );
}
