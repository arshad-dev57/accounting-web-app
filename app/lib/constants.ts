const PRODUCTION_API_URL = 'https://account-backend-five.vercel.app';

function normalizeApiBase(raw?: string) {
  const value = (raw || '').trim().replace(/\/+$/, '');
  if (!value) return PRODUCTION_API_URL;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

/**
 * Server (rewrites / Route Handlers): API_URL from env.
 * Browser: same-origin /api so Next rewrites to API_URL (local or production).
 */
export const API_BASE_URL =
  typeof window === 'undefined'
    ? normalizeApiBase(process.env.API_URL)
    : '';
