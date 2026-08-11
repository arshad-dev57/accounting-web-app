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

export const INDUSTRY_OPTIONS = INDUSTRIES.map((v) => ({
  value: v,
  label: v,
  searchText: v,
}));
