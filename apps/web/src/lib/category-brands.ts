import type { CategoryFilters } from '@youmart/shared-client';

/** Only brands that have products in THIS category (most products first, "Generic" last). */
export function categoryBrands(filters: CategoryFilters | null): { value: string; count: number }[] {
  const facet = filters?.filters.find((f) => f.key === 'brand' && f.type !== 'range');
  const values = (facet?.values ?? []).filter((v) => v.count > 0 && v.value.trim());
  const generic = (v: { value: string }) => /^(generic|unbranded|others?)$/i.test(v.value.trim());
  return [...values].sort((a, b) => Number(generic(a)) - Number(generic(b)) || b.count - a.count);
}
