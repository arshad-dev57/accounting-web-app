// Company contact + tax registration details for report headers, sourced
// from the authoritative /api/profile payload (session-cached).

import { fetchProfileCached } from './profile-cache';

export type CompanyContactInfo = {
  phone?: string;
  email?: string;
  website?: string;
  taxRegistrationNumber?: string;
};

export function readCompanyContactFromProfile(
  profile: Record<string, unknown> | null
): CompanyContactInfo {
  if (!profile) return {};
  const company = (profile.company as Record<string, unknown> | null | undefined) || {};
  const bd = (profile.businessDetails as Record<string, unknown> | null | undefined) || {};
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = String((profile as Record<string, unknown>)[key] ?? '').trim();
      if (value) return value;
    }
    return '';
  };
  return {
    phone: pick('contactNo', 'phone') || String(company.phone ?? '').trim() || undefined,
    email: pick('email') || String(company.email ?? '').trim() || undefined,
    website: pick('websiteLink') || String(company.website ?? '').trim() || undefined,
    taxRegistrationNumber:
      String(bd.taxRegistrationNumber ?? company.taxRegistrationNumber ?? '').trim() || undefined,
  };
}

export async function loadCompanyContactInfo(): Promise<CompanyContactInfo> {
  if (typeof window === 'undefined') return {};
  try {
    const profile = await fetchProfileCached();
    return readCompanyContactFromProfile(profile);
  } catch {
    return {};
  }
}
