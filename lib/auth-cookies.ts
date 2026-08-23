// lib/auth-cookies.ts
// Shared cookie options so auth works across bisonstechs.com ↔ app.bisonstechs.com

export const LOGGED_IN_COOKIE = 'bt_logged_in';
export const AUTH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;
export const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60;

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
  };
}
