/** Normal list pagination — default on first load. */
export const DEFAULT_PRODUCT_PAGE_SIZE = 20;

/** Bulk fetch shortcuts beside pagination (user clicks to load more per request). */
export const PRODUCT_BULK_PAGE_SIZE_OPTIONS = [100, 500, 2500] as const;


export function resolveProductCategoryIds(
  selectedCategory: string,
  categories: Array<{ id?: string; parentId?: string | null }>
): string | undefined {
  if (!selectedCategory || selectedCategory === 'all') return undefined;
  const childIds = categories
    .filter((c) => String(c.parentId || '') === String(selectedCategory))
    .map((c) => String(c.id || ''))
    .filter(Boolean);
  const ids = [selectedCategory, ...childIds].filter(Boolean);
  if (!ids.length) return undefined;
  return ids.join(',');
}
