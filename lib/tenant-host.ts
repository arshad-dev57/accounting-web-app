/**
 * Tenant subdomain helpers for option-1 multi-tenancy:
 * acme.bisonstechs.com → slug "acme"
 */

const RESERVED = new Set([
  'app',
  'www',
  'api',
  'admin',
  'mail',
  'cdn',
  'static',
  'assets',
  'staging',
  'dev',
  'test',
  'demo',
  'help',
  'support',
  'status',
  'docs',
  'blog',
  'portal',
  'login',
  'register',
  'dashboard',
  'billing',
  'localhost',
  'bisonstechs',
]);

export function tenantRootDomain(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN?.trim() ||
    process.env.NEXT_PUBLIC_COOKIE_DOMAIN?.trim()?.replace(/^\./, '') ||
    'bisonstechs.com';
  return fromEnv.replace(/^\./, '').toLowerCase();
}

export function slugifyCompanyName(input: string): string {
  return String(input || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 48)
    .replace(/^-+|-+$/g, '');
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED.has(String(slug || '').toLowerCase());
}

export function isValidSlugFormat(slug: string): boolean {
  const s = String(slug || '');
  if (s.length < 2 || s.length > 48) return false;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) return false;
  if (isReservedSlug(s)) return false;
  return true;
}

/** Parse tenant slug from Host (null on app/www/apex/localhost bare). */
export function extractTenantSlugFromHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const hostname = String(host).split(':')[0].toLowerCase().trim();
  if (!hostname || hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }

  if (hostname.endsWith('.localhost')) {
    const label = hostname.slice(0, -'.localhost'.length);
    if (!label || label.includes('.')) return null;
    if (!isValidSlugFormat(label)) return null;
    return label;
  }

  const root = tenantRootDomain();
  if (hostname === root || hostname === `www.${root}` || hostname === `app.${root}`) {
    return null;
  }
  if (!hostname.endsWith(`.${root}`)) return null;

  const prefix = hostname.slice(0, -(`.${root}`.length));
  if (!prefix || prefix.includes('.')) return null;
  if (!isValidSlugFormat(prefix)) return null;
  return prefix;
}

/** Build https://{slug}.bisonstechs.com{path} (or http for localhost). */
export function tenantAppUrl(slug: string, path = '/dashboard'): string {
  const s = slugifyCompanyName(slug);
  const root = tenantRootDomain();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (root === 'localhost' || process.env.NODE_ENV !== 'production') {
    // Local: keep same origin unless explicitly on a *.localhost host
    if (typeof window !== 'undefined') {
      const current = extractTenantSlugFromHost(window.location.host);
      if (current) {
        return `${window.location.protocol}//${s}.localhost${window.location.port ? `:${window.location.port}` : ''}${cleanPath}`;
      }
    }
    return cleanPath;
  }
  return `https://${s}.${root}${cleanPath}`;
}

export function apexAppHost(): string {
  const root = tenantRootDomain();
  return `app.${root}`;
}
