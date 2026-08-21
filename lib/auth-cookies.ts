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

/** Parent domain for cross-subdomain cookies, e.g. ".bisonstechs.com" */
export function cookieDomain(): string | undefined {
  // Never attach parent domain on localhost — browsers reject it.
  if (process.env.NODE_ENV !== 'production') return undefined;
  const domain = process.env.COOKIE_DOMAIN?.trim();
  return domain && domain.length > 0 ? domain : undefined;
}

export function authCookieBase(maxAge: number): AuthCookieBase {
  const opts: AuthCookieBase = {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge,
  };
  const domain = cookieDomain();
  if (domain) opts.domain = domain;
  return opts;
}

export function httpOnlyAuthCookie(maxAge = AUTH_TOKEN_MAX_AGE) {
  return { ...authCookieBase(maxAge), httpOnly: true as const };
}

export function publicAuthCookie(maxAge = AUTH_TOKEN_MAX_AGE) {
  return { ...authCookieBase(maxAge), httpOnly: false as const };
}

/** Non-sensitive flag readable by marketing site JS on bisonstechs.com */
export function loggedInCookieOptions(maxAge = AUTH_TOKEN_MAX_AGE) {
  return publicAuthCookie(maxAge);
}

export function clearCookieOptions(httpOnly: boolean) {
  return {
    ...authCookieBase(0),
    httpOnly,
    maxAge: 0,
  };
}
