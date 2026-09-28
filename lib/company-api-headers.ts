/**
 * Multi-company request headers for browser fetches and Next.js API proxies.
 * Keep this file free of 'use client' imports so API routes can use it.
 */

export const COMPANY_STORAGE_KEY = 'bisonstechs_active_company_id';

/** Browser-side: Authorization + X-Company-Id for raw fetch() calls. */
export function browserCompanyAuthHeaders(
  extra: Record<string, string> = {}
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token') || '';
    if (token) headers.Authorization = `Bearer ${token}`;
    const companyId = localStorage.getItem(COMPANY_STORAGE_KEY) || '';
    if (companyId) headers['X-Company-Id'] = companyId;
  }
  return headers;
}

/**
 * Next.js route handler: forward auth + active company to the Express backend.
 * Reads X-Company-Id from the incoming request, or falls back to cookie.
 */
export function backendProxyHeaders(request: {
  cookies: { get: (name: string) => { value: string } | undefined };
  headers: { get: (name: string) => string | null };
}): { token: string | null; headers: Record<string, string> } {
  const token =
    request.cookies.get('auth_token')?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    null;

  const companyId =
    request.headers.get('x-company-id') ||
    request.cookies.get('active_company_id')?.value ||
    '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (companyId) {
    try {
      headers['X-Company-Id'] = decodeURIComponent(companyId);
    } catch {
      headers['X-Company-Id'] = companyId;
    }
  }

  return { token, headers };
}
