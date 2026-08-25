// lib/auth-cookies.ts
// Shared cookie options so auth works across bisonstechs.com ↔ app.bisonstechs.com

export const LOGGED_IN_COOKIE = 'bt_logged_in';
export const LOGOUT_FLAG_COOKIE = 'bt_logged_out';
export const AUTH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;
export const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60;

const AUTH_COOKIES_TO_CLEAR: { name: string; httpOnly: boolean }[] = [
  { name: 'auth_token', httpOnly: true },
  { name: 'refresh_token', httpOnly: true },
  { name: 'user_data', httpOnly: true },
  { name: 'subscription_access', httpOnly: false },
  { name: LOGGED_IN_COOKIE, httpOnly: false },
];

type SameSite = 'lax' | 'strict' | 'none';

export type AuthCookieBase = {
  path: string;
  sameSite: SameSite;
  secure: boolean;
  maxAge: number;
  domain?: string;
};

function hostMatchesCookieDomain(host: string, domain: string): boolean {
  const h = host.split(':')[0].toLowerCase();
  const d = domain.replace(/^\./, '').toLowerCase();
  return h === d || h.endsWith(`.${d}`);
}

/** Parent domain for cross-subdomain cookies, e.g. ".bisonstechs.com" */
export function cookieDomain(requestHost?: string): string | undefined {
  // Never attach parent domain on localhost — browsers reject it.
  if (process.env.NODE_ENV !== 'production') return undefined;
  const domain = process.env.COOKIE_DOMAIN?.trim();
  if (!domain) return undefined;

  // Vercel (*.vercel.app) cannot set Domain=.bisonstechs.com — browser drops the cookie,
  // proxy sees no auth_token, and OTP success redirects back to /login.
  const host = (requestHost || '').split(':')[0].toLowerCase();
  if (host.endsWith('.vercel.app') || host === 'vercel.app') return undefined;
  if (process.env.VERCEL && !hostMatchesCookieDomain(host, domain)) return undefined;
  if (host && !hostMatchesCookieDomain(host, domain)) return undefined;
  return domain;
}

export function authCookieBase(maxAge: number, requestHost?: string): AuthCookieBase {
  const opts: AuthCookieBase = {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge,
  };
  const domain = cookieDomain(requestHost);
  if (domain) opts.domain = domain;
  return opts;
}

export function httpOnlyAuthCookie(maxAge = AUTH_TOKEN_MAX_AGE, requestHost?: string) {
  return { ...authCookieBase(maxAge, requestHost), httpOnly: true as const };
}

export function publicAuthCookie(maxAge = AUTH_TOKEN_MAX_AGE, requestHost?: string) {
  return { ...authCookieBase(maxAge, requestHost), httpOnly: false as const };
}

/** Non-sensitive flag readable by marketing site JS on bisonstechs.com */
export function loggedInCookieOptions(maxAge = AUTH_TOKEN_MAX_AGE, requestHost?: string) {
  return publicAuthCookie(maxAge, requestHost);
}

export function clearCookieOptions(httpOnly: boolean, requestHost?: string) {
  return {
    ...authCookieBase(0, requestHost),
    httpOnly,
    maxAge: 0,
    expires: new Date(0),
  };
}

function expiredSetCookieHeader(
  name: string,
  httpOnly: boolean,
  domain?: string
): string {
  const parts = [
    `${name}=`,
    'Path=/',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'Max-Age=0',
    'SameSite=Lax',
  ];
  if (httpOnly) parts.push('HttpOnly');
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  if (domain) parts.push(`Domain=${domain}`);
  return parts.join('; ');
}

type CookieWritable = {
  headers: { append: (name: string, value: string) => void };
};

/**
 * Expire auth cookies on a response. Emits host-only AND Domain= variants
 * because Next.js `cookies.set` can only store one cookie per name, and a
 * leftover cookie on the other scope is enough to bounce /login → dashboard.
 */
export function applyClearedAuthCookies(
  response: CookieWritable,
  requestHost?: string,
  extraNames: { name: string; httpOnly: boolean }[] = []
) {
  const domain = cookieDomain(requestHost);
  const envDomain = process.env.COOKIE_DOMAIN?.trim();
  const domains = new Set<string | undefined>([undefined]);
  if (domain) domains.add(domain);
  if (envDomain) domains.add(envDomain);

  const names = [...AUTH_COOKIES_TO_CLEAR, ...extraNames];

  for (const { name, httpOnly } of names) {
    for (const d of domains) {
      // headers.append (not cookies.set) so host-only AND Domain= cookies
      // can both be expired — Next's cookie jar only keeps one entry per name.
      response.headers.append(
        'Set-Cookie',
        expiredSetCookieHeader(name, httpOnly, d)
      );
    }
  }
}
