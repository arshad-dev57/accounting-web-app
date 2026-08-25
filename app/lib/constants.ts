const PRODUCTION_API_URL = 'https://account-backend-five.vercel.app';

function normalizeApiBase(raw?: string) {
  const value = (raw || PRODUCTION_API_URL).trim().replace(/\/+$/, '');
  if (!value) return PRODUCTION_API_URL;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export const API_BASE_URL = normalizeApiBase(process.env.API_URL);
