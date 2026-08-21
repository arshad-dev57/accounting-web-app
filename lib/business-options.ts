export const BUSINESS_TYPES = [
  'Sole Proprietorship',
  'Partnership',
  'Limited Liability Company (LLC)',
  'Corporation',
  'Non-Profit Organization',
  'Cooperative',
  'Franchise',
  'Other',
] as const;

export const FISCAL_YEARS = [
  'January - December',
  'July - June',
  'April - March',
  'October - September',
  'Custom',
] as const;

export const INDUSTRIES = [
  'Retail',
  'Wholesale',
  'Manufacturing',
  'Technology / Software',
  'E-commerce',
  'Healthcare',
  'Pharmaceuticals',
  'Construction',
  'Real Estate',
  'Education',
  'Hospitality / Tourism',
  'Food & Beverage',
  'Restaurant / Cafe',
  'Finance / Banking',
  'Insurance',
  'Accounting / Consulting',
  'Legal Services',
  'Professional Services',
  'Agriculture',
  'Automotive',
  'Transportation / Logistics',
  'Import / Export',
  'Energy / Utilities',
  'Telecommunications',
  'Media & Entertainment',
  'Fashion / Apparel',
  'Beauty / Personal Care',
  'Mining',
  'Non-Profit',
  'Government',
  'Other',
] as const;

export const BUSINESS_TYPE_OPTIONS = BUSINESS_TYPES.map((v) => ({
  value: v,
  label: v,
}));

export const FISCAL_YEAR_OPTIONS = FISCAL_YEARS.map((v) => ({
  value: v,
  label: v,
}));

/** Resolve the active fiscal-year date range for a period preference. */
export function calculateFiscalYearDates(
  periodType: string,
  now = new Date()
): { startDate: string; endDate: string; name: string } {
  const y = now.getFullYear();
  const m = now.getMonth() + 1; // 1-12
  // Local YYYY-MM-DD — avoid toISOString() which shifts the calendar day in non-UTC timezones
  const iso = (d: Date) => {
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  };

  let start: Date;
  let end: Date;

  switch (periodType) {
    case 'July - June':
      if (m >= 7) {
        start = new Date(y, 6, 1);
        end = new Date(y + 1, 5, 30);
      } else {
        start = new Date(y - 1, 6, 1);
        end = new Date(y, 5, 30);
      }
      break;
    case 'April - March':
      if (m >= 4) {
        start = new Date(y, 3, 1);
        end = new Date(y + 1, 2, 31);
      } else {
        start = new Date(y - 1, 3, 1);
        end = new Date(y, 2, 31);
      }
      break;
    case 'October - September':
      if (m >= 10) {
        start = new Date(y, 9, 1);
        end = new Date(y + 1, 8, 30);
      } else {
        start = new Date(y - 1, 9, 1);
        end = new Date(y, 8, 30);
      }
      break;
    case 'January - December':
    case 'Custom':
    default:
      start = new Date(y, 0, 1);
      end = new Date(y, 11, 31);
      break;
  }

  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const name =
    startYear === endYear ? `FY ${startYear}` : `FY ${startYear}-${endYear}`;

  return { startDate: iso(start), endDate: iso(end), name };
}

export const INDUSTRY_OPTIONS = INDUSTRIES.map((v) => ({
  value: v,
  label: v,
  searchText: v,
}));
