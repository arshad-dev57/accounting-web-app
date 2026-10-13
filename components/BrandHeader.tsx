'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  fetchProfileCached,
  invalidateProfileCache,
  profileToBranding,
} from '../lib/profile-cache';
import { useCompanyOptional } from '../lib/company-context';
import { useSidebarCollapsed } from '../lib/sidebar-collapse';

export const APP_NAME = 'Bisonstechs';
export const APP_LOGO_FALLBACK = '/bisontechs.png';

const PROFILE_CACHE_KEY = 'bisonstechs_company_branding';
const MODULE_SELECTION_HREF = '/dashboard';

export type CompanyBranding = {
  logo: string;
  organizationName: string;
};

function initials(name?: string) {
  if (!name?.trim()) return 'CO';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'CO';
}

function readCachedBranding(): CompanyBranding {
  if (typeof window === 'undefined') {
    return { logo: '', organizationName: '' };
  }
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CompanyBranding;
      return {
        logo: parsed.logo || '',
        organizationName: parsed.organizationName || '',
      };
    }
  } catch {
    /* ignore */
  }
  return { logo: '', organizationName: '' };
}

function writeCachedBranding(branding: CompanyBranding) {
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(branding));
  } catch {
    /* ignore */
  }
}

export function useCompanyBranding() {
  const companyCtx = useCompanyOptional();
  const [branding, setBranding] = useState<CompanyBranding>({
    logo: '',
    organizationName: '',
  });

  useEffect(() => {
    setBranding(readCachedBranding());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const apply = (next: CompanyBranding) => {
      if (cancelled) return;
      writeCachedBranding(next);
      setBranding(next);
    };

    const load = async (force = false) => {
      try {
        const profile = await fetchProfileCached(force);
        if (cancelled) return;
        const fromProfile = profile ? profileToBranding(profile) : null;
        const active = companyCtx?.activeCompany;
        apply({
          logo: active?.logo || fromProfile?.logo || '',
          organizationName:
            active?.name || fromProfile?.organizationName || '',
        });
      } catch {
        const active = companyCtx?.activeCompany;
        if (active) {
          apply({
            logo: active.logo || '',
            organizationName: active.name || '',
          });
        }
      }
    };

    void load();

    const onRefresh = () => {
      invalidateProfileCache();
      void load(true);
    };

    window.addEventListener('company-branding-updated', onRefresh);
    window.addEventListener('active-company-changed', onRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener('company-branding-updated', onRefresh);
      window.removeEventListener('active-company-changed', onRefresh);
    };
  }, [companyCtx?.activeCompanyId, companyCtx?.activeCompany?.logo, companyCtx?.activeCompany?.name]);

  // Prefer live active company over stale cache while switching
  const active = companyCtx?.activeCompany;
  return {
    logo: active?.logo || branding.logo || '',
    organizationName: active?.name || branding.organizationName || '',
  };
}

type BrandHeaderProps = {
  subtitle?: string;
  compact?: boolean;
  /** Where the brand block navigates. Defaults to module selection hub. */
  href?: string;
};

export function notifyCompanyBrandingUpdated(branding?: Partial<CompanyBranding>) {
  if (branding) {
    const current = readCachedBranding();
    writeCachedBranding({
      logo: branding.logo ?? current.logo ?? '',
      organizationName: branding.organizationName || current.organizationName || '',
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
  name,
}: {
  src?: string;
  alt?: string;
  className?: string;
  name?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImg = Boolean(src) && !failed;

  if (!showImg) {
    return (
      <span className="flex h-full w-full items-center justify-center bg-[#014582] text-xs font-bold text-white">
        {initials(name || alt)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt || name || 'Company'}
      className={className || 'w-full h-full object-contain'}
      onError={() => setFailed(true)}
    />
  );
}

export function BrandHeader({
  subtitle,
  compact = false,
  href = MODULE_SELECTION_HREF,
}: BrandHeaderProps) {
  const { logo, organizationName } = useCompanyBranding();
  const { collapsed } = useSidebarCollapsed();
  const brandName = organizationName || APP_NAME;

  return (
    <Link
      href={href}
      title="Go to module selection"
      className={`flex items-center border-b border-white/10 flex-shrink-0 transition-colors hover:bg-white/5 ${
        collapsed
          ? 'justify-center px-2 py-3'
          : compact
            ? 'gap-3 px-4 py-4'
            : 'gap-3 px-5 py-6'
      }`}
    >
      <div className="w-10 h-10 rounded-xl bg-white overflow-hidden flex items-center justify-center flex-shrink-0">
        <CompanyLogo src={logo} alt={brandName} name={brandName} />
      </div>
      {!collapsed && (
        <div className="min-w-0 sidebar-expanded-only">
          <p className="text-sm font-extrabold tracking-wide text-white truncate">{brandName}</p>
          <p className="text-[11px] text-white/50 truncate">
            {subtitle || 'Business Suite'}
          </p>
        </div>
      )}
    </Link>
  );
}

type TopBarBrandProps = {
  title: string;
  icon?: ReactNode;
  dark?: boolean;
  /** Where the brand block navigates. Defaults to module selection hub. */
  href?: string;
};

export function TopBarBrand({
  title,
  icon,
  dark = false,
  href = MODULE_SELECTION_HREF,
}: TopBarBrandProps) {
  const { logo, organizationName } = useCompanyBranding();
  const brandName = organizationName || APP_NAME;

  return (
    <Link
      href={href}
      title="Go to module selection"
      className="flex items-center gap-3 min-w-0 rounded-lg transition-colors hover:opacity-90"
    >
      <div
        className={`w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 ${
          dark ? 'bg-white' : 'bg-white border border-gray-200'
        }`}
      >
        <CompanyLogo src={logo} alt={brandName} name={brandName} />
      </div>
      <div className="min-w-0">
        <p
          className={`text-xs font-semibold tracking-wide truncate ${
            dark ? 'text-white/85' : 'text-gray-500'
          }`}
        >
          {brandName}
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
    </Link>
  );
}
