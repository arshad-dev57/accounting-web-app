function normalizeApiBase(raw?: string) {
  const value = (raw || 'http://localhost:5000').trim().replace(/\/+$/, '');
  if (!value) return 'http://localhost:5000';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export const API_BASE_URL = normalizeApiBase(process.env.API_URL);