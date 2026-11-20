export type CompanyBranding = {
  logo: string;
  organizationName: string;
};

const PROFILE_SESSION_KEY = 'bisonstechs_profile_session';
const PROFILE_SESSION_TS_KEY = 'bisonstechs_profile_session_ts';
const PROFILE_TTL_MS = 5 * 60 * 1000;

let inflight: Promise<Record<string, unknown> | null> | null = null;

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

function readSessionProfile(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  try {
    const ts = Number(sessionStorage.getItem(PROFILE_SESSION_TS_KEY) || 0);
    const raw = sessionStorage.getItem(PROFILE_SESSION_KEY);
    if (!raw || !ts || Date.now() - ts > PROFILE_TTL_MS) return null;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function writeSessionProfile(profile: Record<string, unknown>) {
  try {
    sessionStorage.setItem(PROFILE_SESSION_KEY, JSON.stringify(profile));
    sessionStorage.setItem(PROFILE_SESSION_TS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function invalidateProfileCache() {
  inflight = null;
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(PROFILE_SESSION_KEY);
    sessionStorage.removeItem(PROFILE_SESSION_TS_KEY);
  } catch {
    /* ignore */
  }
}

export function profileToBranding(profile: Record<string, unknown> | null): CompanyBranding {
  if (!profile) {
    return { logo: '', organizationName: '' };
  }
  const businessDetails = profile.businessDetails as { logo?: string } | undefined;
  return {
    // Prefer company logo only — do not force static BisonsTechs fallback
    logo: businessDetails?.logo || '',
    organizationName: (profile.organizationName as string) || '',
  };
}

/** One in-flight /api/profile request shared app-wide. */
export async function fetchProfileCached(force = false): Promise<Record<string, unknown> | null> {
  if (typeof window === 'undefined') return null;

  // Tenant subdomain: localStorage empty after redirect from app.* — hydrate from cookies
  if (!authToken()) {
    try {
      const { hydrateAuthFromSession } = await import('./auth-session-hydrate');
      await hydrateAuthFromSession();
    } catch {
      /* continue — cookie-backed /api/profile may still work */
    }
  }

  if (!force) {
    const cached = readSessionProfile();
    if (cached) return cached;
  }

  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const token = authToken();
      const res = await fetch('/api/profile', {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.data) return readSessionProfile();
      writeSessionProfile(data.data);
      return data.data as Record<string, unknown>;
    } catch {
      return readSessionProfile();
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
