/**
 * Shared Import-module money / date / FX display helpers.
 * Always show ISO currency code once: "PKR 111,200.00" or "USD 4,000.00".
 *
 * Date convention (entire Import module):
 * - Wire / inputs: YYYY-MM-DD
 * - Backend DB: UTC noon on that calendar day
 * - Display: en-GB (dd MMM yyyy) via formatImportDate
 */

export function parseImportDateOnly(input?: string | Date | null): Date | null {
  if (input == null || input === '') return null;
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return null;
    const utcH = input.getUTCHours();
    if (utcH >= 10 && utcH <= 14) {
      return new Date(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate());
    }
    return new Date(input.getFullYear(), input.getMonth(), input.getDate());
  }
  const s = String(input).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/.exec(s);
  if (m) {
    const y = Number(m[1]);
    const mon = Number(m[2]); // 1-based in string
    const day = Number(m[3]);
    if (m[4] != null) {
      const hour = Number(m[4]);
      if (hour >= 10 && hour <= 14) {
        return new Date(y, mon - 1, day);
      }
      const instant = new Date(s);
      if (!Number.isNaN(instant.getTime())) {
        return new Date(instant.getFullYear(), instant.getMonth(), instant.getDate());
      }
    }
    return new Date(y, mon - 1, day);
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** YYYY-MM-DD for HTML date inputs / API payloads. */
export function toImportDateInputValue(input?: string | Date | null): string {
  const d = parseImportDateOnly(input);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Local calendar today as YYYY-MM-DD (never use toISOString — UTC day shift). */
export function importTodayInputValue(): string {
  return toImportDateInputValue(new Date());
}

/** Display date without timezone month/day shifts. */
export function formatImportDate(input?: string | Date | null): string {
  const d = parseImportDateOnly(input);
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export type FormatImportMoneyOpts = {
  decimals?: number;
  /** When true (default for optional charges), null/undefined → "—" */
  emptyAsDash?: boolean;
  /** When true, treat numeric 0 as empty ("—"). Default false. */
  zeroAsDash?: boolean;
};

/**
 * Format an amount with ISO code once.
 * Never append a second currency after this string.
 */
export function formatImportMoney(
  amount: number | string | null | undefined,
  currencyCode?: string | null,
  opts: FormatImportMoneyOpts = {}
): string {
  const code = String(currencyCode || 'PKR').toUpperCase();
  const emptyAsDash = opts.emptyAsDash !== false;
  const decimals = opts.decimals ?? 2;

  if (amount === undefined || amount === null || amount === '') {
    return emptyAsDash ? '—' : `${code} ${Number(0).toFixed(decimals)}`;
  }
  const n = Number(amount);
  if (!Number.isFinite(n)) {
    return emptyAsDash ? '—' : `${code} ${Number(0).toFixed(decimals)}`;
  }
  if (opts.zeroAsDash && n === 0) return '—';

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
  return `${code} ${formatted}`;
}

/** Optional charge line: null/undefined → "—"; explicit 0 → "PKR 0.00". */
export function formatImportCharge(
  amount: number | string | null | undefined,
  currencyCode?: string | null,
  decimals = 2
): string {
  if (amount === undefined || amount === null || amount === '') {
    return '—';
  }
  return formatImportMoney(amount, currencyCode, { decimals, emptyAsDash: false });
}

export function formatImportFxRate(opts: {
  foreignCurrency?: string | null;
  baseCurrency?: string | null;
  rate?: number | string | null;
  rateDate?: string | Date | null;
  source?: string | null;
  label?: string;
}): string {
  const foreign = String(opts.foreignCurrency || 'USD').toUpperCase();
  const base = String(opts.baseCurrency || 'PKR').toUpperCase();
  const rate = Number(opts.rate);
  const rateStr = Number.isFinite(rate)
    ? rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })
    : '—';
  const dateStr = formatImportDate(opts.rateDate);
  const source = opts.source && String(opts.source).trim() ? String(opts.source).trim() : 'not recorded';
  const label = opts.label || 'Rate';
  return `${label}: 1 ${foreign} = ${rateStr} ${base} (${dateStr}, source: ${source})`;
}
