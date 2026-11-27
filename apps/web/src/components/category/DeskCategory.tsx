'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { Check, ChevronRight, LayoutGrid, Search, Tag, X, XCircle } from 'lucide-react';
import {
  listingQueryString,
  selectedValues,
  withFilter,
  type CategoryFilters,
  type ListingQuery,
  type ListingSort,
} from '@youmart/shared-client';
import { BrandLogo } from '@/components/mhome/BrandLogo';
import { useModal } from '@/lib/useModal';

// DESKTOP (>= 1025px) category page pieces in the app's design: the gradient header, the
// category's own brands as logo tiles, and the sort pills + filter chips toolbar.

type Brand = { value: string; count: number };

export function DeskCategoryHero({
  trail,
  title,
  total,
  brandCount,
  image,
}: {
  trail: readonly { name: string; href: string }[];
  title: string;
  total: number;
  brandCount: number;
  image: string | null;
}) {
  const crumbs = [{ name: 'Home', href: '/' }, ...trail];
  return (
    <section className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(120deg,#0b1f4d_0%,#0142aa_55%,#2f6fe0_100%)] shadow-[0_12px_28px_-12px_rgba(1,66,170,0.55)]">
      <span aria-hidden="true" className="absolute -left-[60px] -top-[90px] size-[240px] rounded-full bg-white/[0.06]" />
      <span aria-hidden="true" className="absolute bottom-[-120px] left-[38%] size-[220px] rounded-full bg-white/[0.05]" />
      {image ? (
        <div className="absolute inset-y-0 right-0 w-[38%] [mask-image:linear-gradient(90deg,transparent,#000_45%)]">
          <Image src={image} alt="" fill sizes="520px" className="object-cover object-[50%_45%]" priority />
        </div>
      ) : null}
      <div className="relative flex min-h-[150px] flex-col justify-center px-[32px] py-[24px]">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-[6px] font-ui text-[13px] text-white/75">
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <li key={c.href} className="flex items-center gap-[6px]">
                  {last ? (
                    <span aria-current="page" className="font-semibold text-[#ffd23f]">
                      {c.name}
                    </span>
                  ) : (
                    <>
                      <Link href={c.href} className="hover:text-white hover:underline">
                        {c.name}
                      </Link>
                      <ChevronRight aria-hidden="true" className="size-[12px]" strokeWidth={2.5} />
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        <h1 className="mt-[8px] max-w-[60%] font-ui text-[32px] font-bold leading-[1.15] text-white">{title}</h1>
        <div className="mt-[12px] flex flex-wrap gap-[8px]">
          <span className="flex items-center gap-[6px] rounded-full bg-white/[0.14] px-[12px] py-[5px] font-ui text-[13px] font-semibold text-white backdrop-blur">
            <LayoutGrid aria-hidden="true" className="size-[14px] text-[#ffd23f]" />
            {total.toLocaleString('en-IN')} product{total === 1 ? '' : 's'}
          </span>
          {brandCount > 0 ? (
            <span className="flex items-center gap-[6px] rounded-full bg-white/[0.14] px-[12px] py-[5px] font-ui text-[13px] font-semibold text-white backdrop-blur">
              <Tag aria-hidden="true" className="size-[14px] text-[#ffd23f]" />
              {brandCount} brand{brandCount === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

const WALL = 15; // tiles before "View all" (2 rows of 8 with the "All" tile)

export function DeskBrandWall({
  brands,
  basePath,
  query,
  categoryName,
}: {
  brands: Brand[];
  basePath: string;
  query: ListingQuery;
  categoryName: string;
}) {
  const [open, setOpen] = useState(false);
  const chosen = selectedValues(query, 'brand');
  const href = (value: string | null) => {
    const next = value === null ? [] : chosen.includes(value) ? chosen.filter((v) => v !== value) : [...chosen, value];
    return `${basePath}${listingQueryString({ ...query, filters: withFilter(query.filters, 'brand', next.join(',') || null) })}`;
  };
  // Chosen brands always stay visible on the wall.
  const wall = useMemo(() => {
    const first = brands.slice(0, WALL);
    const extra = brands.filter((b) => chosen.includes(b.value) && !first.includes(b));
    return [...extra, ...first].slice(0, Math.max(WALL, extra.length));
  }, [brands, chosen]);
  if (brands.length === 0) return null;
  const more = brands.length > wall.length;

  return (
    <section aria-labelledby="desk-brands" className="mt-[20px] rounded-[20px] border border-brand-popup-border bg-white p-[20px] shadow-rail-card">
      <div className="mb-[14px] flex items-end justify-between gap-[12px]">
        <div>
          <h2 id="desk-brands" className="flex items-center gap-[10px] font-ui text-[20px] font-bold text-heading">
            <span aria-hidden="true" className="h-[4px] w-[26px] rounded-full bg-brand" />
            Shop by <span className="-ml-[4px] text-brand">brand</span>
          </h2>
          <p className="mt-[2px] font-ui text-[13px] text-ink-muted">
            {brands.length} brand{brands.length === 1 ? '' : 's'} in {categoryName}
          </p>
        </div>
        {more ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-[4px] rounded-full bg-brand-popup-bg px-[14px] py-[7px] font-ui text-[13px] font-bold text-brand hover:bg-brand hover:text-white"
          >
            View all {brands.length} <ChevronRight aria-hidden="true" className="size-[14px]" />
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-8 gap-[10px]">
        <Link
          href={href(null)}
          className={`relative flex h-[76px] flex-col items-center justify-center gap-[2px] rounded-[14px] border font-ui transition-all ${
            chosen.length === 0 ? 'border-brand bg-brand text-white shadow-[0_8px_14px_rgba(1,66,170,0.3)]' : 'border-[#e3e9f3] bg-white text-heading hover:-translate-y-[2px] hover:border-brand'
          }`}
        >
          <LayoutGrid aria-hidden="true" className="size-[18px]" />
          <span className="text-[13px] font-bold">All brands</span>
        </Link>
        {wall.map((b) => (
          <BrandTile key={b.value} brand={b} on={chosen.includes(b.value)} href={href(b.value)} />
        ))}
      </div>
      {open ? <BrandDialog brands={brands} chosen={chosen} href={href} onClose={() => setOpen(false)} categoryName={categoryName} /> : null}
    </section>
  );
}

function BrandTile({ brand, on, href, onClick }: { brand: Brand; on: boolean; href: string; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={`${brand.value} (${brand.count} products)`}
      title={`${brand.value} - ${brand.count} product${brand.count === 1 ? '' : 's'}`}
      aria-current={on ? 'true' : undefined}
      className={`group relative flex h-[76px] items-center justify-center overflow-hidden rounded-[14px] border bg-white px-[8px] pb-[12px] transition-all [&_img]:!max-h-[34px] ${
        on ? 'border-brand ring-2 ring-brand' : 'border-[#e3e9f3] hover:-translate-y-[2px] hover:border-brand hover:shadow-[0_8px_16px_-6px_rgba(1,66,170,0.3)]'
      }`}
    >
      <BrandLogo name={brand.value} />
      <span className="absolute inset-x-0 bottom-[4px] truncate px-[6px] text-center font-ui text-[10.5px] font-semibold text-ink-muted">
        <span className="text-heading">{brand.value}</span> · {brand.count}
      </span>
      {on ? (
        <span className="absolute right-[5px] top-[5px] flex size-[18px] items-center justify-center rounded-full bg-brand">
          <Check aria-hidden="true" className="size-[11px] text-white" strokeWidth={3} />
        </span>
      ) : null}
    </Link>
  );
}

function BrandDialog({
  brands,
  chosen,
  href,
  onClose,
  categoryName,
}: {
  brands: Brand[];
  chosen: string[];
  href: (v: string | null) => string;
  onClose: () => void;
  categoryName: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [q, setQ] = useState('');
  const close = useCallback(() => onClose(), [onClose]);
  useModal(true, close, closeRef);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const term = q.trim().toLowerCase();
  const shown = term ? brands.filter((b) => b.value.toLowerCase().includes(term)) : brands;
  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(11,31,77,0.55)] p-[24px]" onClick={(e) => e.target === e.currentTarget && close()}>
      <div role="dialog" aria-modal="true" aria-label={`Brands in ${categoryName}`} className="flex h-[min(680px,88vh)] w-full max-w-[880px] flex-col overflow-hidden rounded-[24px] bg-white font-ui shadow-[0_24px_60px_rgba(11,31,77,0.35)]">
        <div className="flex items-center gap-[16px] border-b border-cart-line px-[24px] py-[16px]">
          <div className="min-w-0 flex-1">
            <h2 className="text-[20px] font-bold text-heading">Brands in {categoryName}</h2>
            <p className="text-[12.5px] text-ink-muted">{brands.length} brands · pick one or more</p>
          </div>
          <label className="flex h-[42px] w-[300px] items-center gap-[8px] rounded-[12px] border border-brand-popup-border px-[12px] focus-within:border-brand">
            <Search aria-hidden="true" className="size-[16px] text-ink-muted" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brands" className="min-w-0 flex-1 bg-transparent text-[14px] text-heading outline-none placeholder:text-ink-muted" />
            {q ? (
              <button type="button" onClick={() => setQ('')} aria-label="Clear search">
                <XCircle aria-hidden="true" className="size-[16px] text-ink-muted" />
              </button>
            ) : null}
          </label>
          <button ref={closeRef} type="button" onClick={close} aria-label="Close" className="flex size-[34px] items-center justify-center rounded-full bg-brand-popup-bg text-heading hover:bg-brand hover:text-white">
            <X aria-hidden="true" className="size-[18px]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-[24px]">
          <div className="grid grid-cols-6 gap-[10px]">
            {shown.map((b) => (
              <BrandTile key={b.value} brand={b} on={chosen.includes(b.value)} href={href(b.value)} onClick={close} />
            ))}
          </div>
          {shown.length === 0 ? <p className="py-[40px] text-center text-[14px] text-ink-muted">No brand matches “{q}”</p> : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

const SORTS: { value: ListingSort; label: string }[] = [
  { value: 'default', label: 'Relevance' },
  { value: 'discount', label: 'Biggest discount' },
  { value: 'price', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'date', label: 'Newest first' },
  { value: 'rating', label: 'Top rated' },
];

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** Sort pills (links), the Filters button, and the active filters as removable chips. */
export function DeskSortBar({
  basePath,
  query,
  filters,
  filterButton,
}: {
  basePath: string;
  query: ListingQuery;
  filters: CategoryFilters | null;
  filterButton: React.ReactNode;
}) {
  const to = (q: Omit<ListingQuery, 'page'>) => `${basePath}${listingQueryString(q)}`;
  const chips: { key: string; label: string; href: string }[] = [];
  if (query.minPrice !== null || query.maxPrice !== null) {
    const label =
      query.minPrice !== null && query.maxPrice !== null
        ? `${rupees(query.minPrice)} – ${rupees(query.maxPrice)}`
        : query.minPrice !== null
          ? `Over ${rupees(query.minPrice)}`
          : `Under ${rupees(query.maxPrice!)}`;
    chips.push({ key: 'price', label, href: to({ ...query, minPrice: null, maxPrice: null }) });
  }
  if (query.minRating > 0) chips.push({ key: 'rating', label: `${query.minRating}★ & above`, href: to({ ...query, minRating: 0 }) });
  for (const key of Object.keys(query.filters)) {
    const def = filters?.filters.find((f) => f.key === key || `${f.key}_min` === key || `${f.key}_max` === key);
    const name = def?.label ?? key.replace(/_/g, ' ');
    if (key.endsWith('_min') || key.endsWith('_max')) {
      chips.push({
        key,
        label: `${name} ${key.endsWith('_min') ? '≥' : '≤'} ${query.filters[key]}${def?.unit ? ` ${def.unit}` : ''}`,
        href: to({ ...query, filters: withFilter(query.filters, key, null) }),
      });
      continue;
    }
    const values = selectedValues(query, key);
    for (const v of values) {
      const rest = values.filter((x) => x !== v).join(',') || null;
      chips.push({
        key: `${key}:${v}`,
        label: def?.type === 'boolean' ? name : key === 'brand' ? v : `${name}: ${v}`,
        href: to({ ...query, filters: withFilter(query.filters, key, rest) }),
      });
    }
  }

  return (
    <div className="mt-[20px] rounded-[20px] border border-brand-popup-border bg-white px-[16px] py-[12px] shadow-rail-card">
      <div className="flex items-center gap-[12px]">
        <span className="shrink-0 font-ui text-[13px] font-bold uppercase tracking-[0.8px] text-ink-muted">Sort by</span>
        <div className="flex min-w-0 flex-1 flex-wrap gap-[8px]">
          {SORTS.map((s) => {
            const on = query.sort === s.value;
            return (
              <Link
                key={s.value}
                href={to({ ...query, sort: s.value })}
                aria-current={on ? 'true' : undefined}
                className={`rounded-full border px-[14px] py-[7px] font-ui text-[13px] font-semibold transition-colors ${
                  on ? 'border-brand bg-brand text-white' : 'border-[#e3e9f3] bg-white text-ink-body hover:border-brand hover:text-brand'
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
        {filterButton}
      </div>
      {chips.length > 0 ? (
        <div className="mt-[12px] flex flex-wrap items-center gap-[8px] border-t border-cart-line pt-[12px]">
          <span className="font-ui text-[12.5px] font-semibold text-ink-muted">Applied:</span>
          {chips.map((c) => (
            <Link
              key={c.key}
              href={c.href}
              aria-label={`Remove ${c.label}`}
              className="flex items-center gap-[6px] rounded-full bg-brand-popup-bg py-[5px] pl-[12px] pr-[8px] font-ui text-[12.5px] font-semibold text-brand hover:bg-brand hover:text-white"
            >
              {c.label}
              <X aria-hidden="true" className="size-[13px]" strokeWidth={2.5} />
            </Link>
          ))}
          <Link
            href={to({ sort: query.sort, minPrice: null, maxPrice: null, minRating: 0, filters: {} })}
            className="ml-[4px] font-ui text-[12.5px] font-bold text-[#e11d48] hover:underline"
          >
            Clear all
          </Link>
        </div>
      ) : null}
    </div>
  );
}
