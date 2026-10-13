/** Client-side product UOM helpers (mirrors backend productUomService). */

const FRACTIONAL = new Set([
  'KG', 'G', 'GRAM', 'GRAMS', 'KILOGRAM', 'KILOGRAMS',
  'LTR', 'L', 'LITRE', 'LITER', 'LITRES', 'LITERS',
  'ML', 'MILLILITRE', 'MILLILITER',
  'M', 'MTR', 'METER', 'METRE',
]);

export type ProductUomFields = {
  stockUnitName?: string | null;
  stockUnit?: string | null;
  salesUnitName?: string | null;
  salesConversionFactor?: number | null;
  purchaseUnitName?: string | null;
  purchaseConversionFactor?: number | null;
  allowFractionalQty?: boolean | null;
  currentStock?: number | null;
  availableStock?: number | null;
};

export function normalizeUnitToken(unit?: string | null) {
  return String(unit || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function isFractionalUnit(unit?: string | null) {
  const u = normalizeUnitToken(unit);
  if (!u) return false;
  if (FRACTIONAL.has(u)) return true;
  // Match "Kilogram", "Kgs", "Grams", "Litre", etc.
  if (u.includes('KILO') || u === 'KG' || u === 'KGS') return true;
  if (u.includes('GRAM') || u === 'G' || u === 'GS') return true;
  if (u.includes('LITR') || u === 'L' || u === 'LTR' || u === 'LTRS') return true;
  if (u.includes('MILLI') || u === 'ML') return true;
  if (u.includes('METR') || u === 'M' || u === 'MTR') return true;
  return false;
}

export function resolveProductUom(p: ProductUomFields = {}) {
  const stockUnit = String(p.stockUnitName || p.stockUnit || 'Pcs').trim() || 'Pcs';
  const salesUnit = String(p.salesUnitName || stockUnit).trim() || stockUnit;
  const salesFactor = Number(p.salesConversionFactor) > 0 ? Number(p.salesConversionFactor) : 1;
  const allowFractional = Boolean(
    p.allowFractionalQty || isFractionalUnit(stockUnit) || isFractionalUnit(salesUnit)
  );
  const decimalPlaces = allowFractional ? 3 : 0;
  return { stockUnit, salesUnit, salesFactor, allowFractional, decimalPlaces };
}

/** Quick-pick amounts for weight / volume sales. */
export function weightQuickAmounts(unit?: string | null) {
  const u = normalizeUnitToken(unit);
  if (u === 'G' || u.includes('GRAM')) return [50, 100, 250, 500, 750, 1000];
  if (u === 'ML' || u.includes('MILLI')) return [50, 100, 250, 500, 750, 1000];
  // KG / LTR / metres default
  return [0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 5];
}

export function normalizeSalesQty(qty: number, _p?: ProductUomFields) {
  const n = Number(qty);
  if (!Number.isFinite(n) || n <= 0) return 0;
  // Keep 3 decimals so weight sales (1.5 KG) are not rounded to whole pieces.
  return Math.round(n * 1000) / 1000;
}

/** Available stock is in base/stock units; return max qty in sales units. */
export function maxSellableSalesQty(p: ProductUomFields) {
  const uom = resolveProductUom(p);
  const avail = Number(p.availableStock ?? p.currentStock ?? 0) || 0;
  if (uom.salesFactor <= 0) return 0;
  return normalizeSalesQty(Math.max(0, avail / uom.salesFactor), uom);
}

export function formatQty(qty: number, unit?: string) {
  const n = Number(qty) || 0;
  const u = String(unit || '').trim();
  const text = Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/\.?0+$/, '');
  return u ? `${text} ${u}` : text;
}

export const COMMON_UOM_OPTIONS = [
  'Pcs', 'KG', 'G', 'LTR', 'ML', 'MTR', 'Box', 'Pkt', 'Btl', 'Doz', 'Ctn',
];
