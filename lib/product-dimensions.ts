import type { Product } from '@/app/api/product/route';

export function productDimensionUnit(product: Pick<Product, 'dimensionUnit' | 'dimensionUnitName'>) {
  return product.dimensionUnit || product.dimensionUnitName || 'cm';
}

export function productWeightUnit(product: Pick<Product, 'weightUnit' | 'weightUnitName'>) {
  return product.weightUnit || product.weightUnitName || 'KG';
}

export function calcProductVolume(
  length?: number | null,
  width?: number | null,
  height?: number | null,
  unit = 'cm'
) {
  const l = Number(length) || 0;
  const w = Number(width) || 0;
  const h = Number(height) || 0;
  if (!l || !w || !h) return { volume: 0, cbm: 0, unit };

  const raw = l * w * h;
  const u = unit.toLowerCase();
  let cbm = raw;
  if (u === 'cm') cbm = raw / 1_000_000;
  else if (u === 'mm') cbm = raw / 1_000_000_000;
  else if (u === 'in' || u === 'inch' || u === 'inches') cbm = raw * 0.000016387064;
  else if (u === 'ft' || u === 'feet' || u === 'foot') cbm = raw * 0.0283168466;

  return { volume: raw, cbm, unit };
}

export function hasProductDimensions(product: Pick<Product, 'length' | 'width' | 'height'>) {
  return [product.length, product.width, product.height].some((v) => Number(v) > 0);
}

export function formatProductDimensions(product: Pick<Product, 'length' | 'width' | 'height' | 'dimensionUnit' | 'dimensionUnitName'>) {
  if (!hasProductDimensions(product)) return null;
  const unit = productDimensionUnit(product);
  return `${Number(product.length) || 0} × ${Number(product.width) || 0} × ${Number(product.height) || 0} ${unit}`;
}

export function formatProductVolume(product: Pick<Product, 'length' | 'width' | 'height' | 'dimensionUnit' | 'dimensionUnitName' | 'volume'>) {
  const unit = productDimensionUnit(product);
  const { volume, cbm } = calcProductVolume(product.length, product.width, product.height, unit);
  const stored = Number(product.volume) || 0;
  const displayVolume = stored > 0 ? stored : volume;
  if (!displayVolume) return null;
  return {
    volumeText: `${displayVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}³`,
    cbmText: cbm > 0 ? `${cbm.toLocaleString(undefined, { maximumFractionDigits: 4 })} m³` : null,
  };
}

export function formatProductWeight(product: Pick<Product, 'weight' | 'weightUnit' | 'weightUnitName'>) {
  const weight = Number(product.weight) || 0;
  if (!weight) return null;
  return `${weight.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${productWeightUnit(product)}`;
}
