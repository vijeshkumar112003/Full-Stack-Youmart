'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Check, Search, SlidersHorizontal, Star, X, XCircle } from 'lucide-react';
import {
  LISTING_RATING_OPTIONS,
  LISTING_SORT_OPTIONS,
  listingQueryString,
  selectedValues,
  withFilter,
  type CategoryFilter,
  type CategoryFilters,
  type ListingQuery,
} from '@youmart/shared-client';
import { useModal } from '@/lib/useModal';

// The app's filter sheet (apps/mobile/src/components/FilterSheet.tsx): filter names down the left,
// a tick-list on the right, Clear all + Apply at the bottom. A bottom sheet on phones, a centred
// card on desktop. Rendered in a portal so no parent style or stacking context can overlap it.

const SEARCH_FROM = 8;
const PRICE_STEPS = [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000];
const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

type Section =
  | { key: 'sort'; label: string }
  | { key: 'price'; label: string }
  | { key: 'rating'; label: string }
  | { key: string; label: string; facet: CategoryFilter };

type PriceBand = { label: string; min: number | null; max: number | null };

function priceBands(range: { min: number; max: number } | null | undefined): PriceBand[] {
  if (!range) return [];
  const steps = PRICE_STEPS.filter((s) => s > range.min && s < range.max);
  if (steps.length === 0) return [];
  const bands: PriceBand[] = [{ label: `Under ${rupees(steps[0]!)}`, min: null, max: steps[0]! }];
  for (let i = 1; i < steps.length; i++) {
    bands.push({ label: `${rupees(steps[i - 1]!)} - ${rupees(steps[i]!)}`, min: steps[i - 1]!, max: steps[i]! });
  }
  const last = steps[steps.length - 1]!;
  bands.push({ label: `Over ${rupees(last)}`, min: last, max: null });
  return bands;
}

/** "Up to 1 kg" < "1 - 5 kg" and "10% off" < "25% off": bands read best in numeric order. */
function orderValues(facet: CategoryFilter) {
  const values = [...(facet.values ?? [])].filter((v) => v.count > 0);
  if (!facet.key.endsWith('_band')) return values;
  const lead = (v: string) => (/^(up to|under)/i.test(v) ? -1 : parseFloat(v.replace(/[^\d.]/g, ' ').trim()) || 0);
  return values.sort((a, b) => lead(a.value) - lead(b.value));
}

const valueLabel = (facet: CategoryFilter, v: string) =>
  facet.type === 'boolean' ? (v === 'true' ? 'Yes' : v === 'false' ? 'No' : v) : `${v}${facet.unit ? ` ${facet.unit}` : ''}`;

/** How many picks (not sort) a query has - the number on the Filter button. */
export function activeFilterCount(query: ListingQuery): number {
  const ranges = new Set(Object.keys(query.filters).filter((k) => /_(min|max)$/.test(k)).map((k) => k.replace(/_(min|max)$/, '')));
  const picks = Object.keys(query.filters)
    .filter((k) => !/_(min|max)$/.test(k))
    .reduce((n, k) => n + selectedValues(query, k).length, 0);
  return ranges.size + picks + (query.minPrice !== null || query.maxPrice !== null ? 1 : 0) + (query.minRating > 0 ? 1 : 0);
}

export function FilterSheet({
  basePath,
  query,
  filters,
  variant,
  hideSort = false,
}: {
  basePath: string;
  query: ListingQuery;
  filters: CategoryFilters | null;
  /** 'pill' = the app's small "Filter & Sort" pill (phone); 'desk' = the desktop toolbar button. */
  variant: 'pill' | 'desk';
  /** Desktop shows sort as pills in the toolbar, so the sheet leaves it out. */
  hideSort?: boolean;
}) {
  const router = useRouter();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState<ListingQuery>(query);
  const [active, setActive] = useState('');
  const [search, setSearch] = useState('');
  const close = useCallback(() => setOpen(false), []);
  useModal(open, close, closeRef);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (open) setDraft(query);
  }, [open, query]);
  useEffect(() => setSearch(''), [active]);

  const bands = useMemo(() => priceBands(filters?.price), [filters]);
  const sections = useMemo<Section[]>(() => {
    const facets = (filters?.filters ?? []).filter((f) =>
      f.type === 'range' ? f.min != null && f.max != null && f.max > f.min : orderValues(f).length > 0,
    );
    const out: Section[] = hideSort ? [] : [{ key: 'sort', label: 'Sort by' }];
    const brand = facets.find((f) => f.key === 'brand');
    if (brand) out.push({ key: brand.key, label: brand.label, facet: brand });
    out.push({ key: 'price', label: 'Price' });
    out.push({ key: 'rating', label: 'Customer ratings' });
    for (const f of facets) if (f.key !== 'brand') out.push({ key: f.key, label: f.label, facet: f });
    return out;
  }, [filters, hideSort]);
  const current = sections.find((s) => s.key === active) ?? sections[0]!;

  const update = (next: Partial<ListingQuery>) => setDraft((d) => ({ ...d, ...next, page: 1 }));
  const toggleFacet = (key: string, value: string) => {
    const cur = selectedValues(draft, key);
    const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    update({ filters: withFilter(draft.filters, key, next.join(',') || null) });
  };
  const picked = (s: Section): number => {
    if (s.key === 'sort') return draft.sort !== 'default' ? 1 : 0;
    if (s.key === 'price') return draft.minPrice != null || draft.maxPrice != null ? 1 : 0;
    if (s.key === 'rating') return draft.minRating ? 1 : 0;
    if ('facet' in s && s.facet.type === 'range') return draft.filters[`${s.key}_min`] || draft.filters[`${s.key}_max`] ? 1 : 0;
    return selectedValues(draft, s.key).length;
  };
  const draftCount = activeFilterCount(draft);
  const count = activeFilterCount(query);

  const apply = () => {
    setOpen(false);
    router.push(`${basePath}${listingQueryString(draft)}`);
  };
  const clearAll = () =>
    setDraft((d) => ({ ...d, sort: hideSort ? d.sort : 'default', minPrice: null, maxPrice: null, minRating: 0, filters: {} }));

  const right = () => {
    if (current.key === 'sort') {
      return LISTING_SORT_OPTIONS.map((o) => (
        <Row key={o.value} round label={o.label} on={draft.sort === o.value} onClick={() => update({ sort: o.value })} />
      ));
    }
    if (current.key === 'price') {
      return (
        <>
          {bands.map((b) => {
            const on = draft.minPrice === b.min && draft.maxPrice === b.max;
            return (
              <Row
                key={b.label}
                label={b.label}
                on={on}
                onClick={() => update(on ? { minPrice: null, maxPrice: null } : { minPrice: b.min, maxPrice: b.max })}
              />
            );
          })}
          <p className="mb-[8px] mt-[14px] font-ui text-[12px] font-bold uppercase tracking-[0.8px] text-ink-muted">Or your own range</p>
          <div className="flex items-center gap-[8px]">
            <NumberBox label="Min" value={draft.minPrice} onChange={(v) => update({ minPrice: v })} />
            <span className="text-ink-muted">–</span>
            <NumberBox label="Max" value={draft.maxPrice} onChange={(v) => update({ maxPrice: v })} />
          </div>
        </>
      );
    }
    if (current.key === 'rating') {
      return LISTING_RATING_OPTIONS.filter((o) => o.value > 0).map((o) => {
        const on = draft.minRating === o.value;
        return (
          <Row
            key={o.value}
            round
            label={
              <span className="flex items-center gap-[4px]">
                {o.value}
                <Star aria-hidden="true" className="size-[14px] fill-[#f5a524] text-[#f5a524]" /> &amp; above
              </span>
            }
            on={on}
            onClick={() => update({ minRating: on ? 0 : o.value })}
          />
        );
      });
    }
    if (!('facet' in current)) return null;
    const facet = current.facet;
    if (facet.type === 'range') {
      const unit = facet.unit ? ` ${facet.unit}` : '';
      const num = (k: string) => (draft.filters[k] ? Number(draft.filters[k]) : null);
      const set = (k: string, v: number | null) => update({ filters: withFilter(draft.filters, k, v == null ? null : String(v)) });
      return (
        <>
          <p className="mb-[10px] text-[13px] text-ink-muted">
            From {facet.min}
            {unit} to {facet.max}
            {unit}
          </p>
          <div className="flex items-center gap-[8px]">
            <NumberBox label="Min" value={num(`${facet.key}_min`)} onChange={(v) => set(`${facet.key}_min`, v)} />
            <span className="text-ink-muted">–</span>
            <NumberBox label="Max" value={num(`${facet.key}_max`)} onChange={(v) => set(`${facet.key}_max`, v)} />
          </div>
        </>
      );
    }
    const values = orderValues(facet);
    const q = search.trim().toLowerCase();
    const shown = q ? values.filter((v) => v.value.toLowerCase().includes(q)) : values;
    const sel = selectedValues(draft, facet.key);
    const multiple = facet.type === 'multi_select' || facet.type === 'boolean';
    return (
      <>
        {values.length > SEARCH_FROM ? (
          <label className="sticky top-0 z-[1] -mx-[4px] mb-[8px] flex h-[40px] items-center gap-[8px] rounded-[12px] border border-brand-popup-border bg-white px-[12px] shadow-[0_6px_10px_-8px_rgba(1,66,170,0.4)]">
            <Search aria-hidden="true" className="size-[16px] text-ink-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${facet.label.toLowerCase()}`}
              className="min-w-0 flex-1 bg-transparent font-ui text-[14px] text-heading outline-none placeholder:text-ink-muted"
            />
            {search ? (
              <button type="button" onClick={() => setSearch('')} aria-label="Clear search">
                <XCircle aria-hidden="true" className="size-[16px] text-ink-muted" />
              </button>
            ) : null}
          </label>
        ) : null}
        {shown.map((v) => (
          <Row
            key={v.value}
            round={!multiple}
            label={valueLabel(facet, v.value)}
            count={v.count}
            on={sel.includes(v.value)}
            onClick={() =>
              multiple
                ? toggleFacet(facet.key, v.value)
                : update({ filters: withFilter(draft.filters, facet.key, sel.includes(v.value) ? null : v.value) })
            }
          />
        ))}
        {shown.length === 0 ? <p className="py-[20px] text-center text-[13px] text-ink-muted">No matches</p> : null}
      </>
    );
  };

  const trigger =
    variant === 'desk' ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={`flex h-[40px] shrink-0 items-center gap-[8px] rounded-[12px] border px-[14px] font-ui text-[14px] font-bold transition-colors ${
          count > 0 ? 'border-brand bg-brand text-white' : 'border-brand-popup-border bg-white text-brand hover:border-brand hover:bg-brand-popup-bg'
        }`}
      >
        <SlidersHorizontal aria-hidden="true" className="size-[16px]" />
        Filters
        {count > 0 ? (
          <span className="flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-white px-[5px] text-[11.5px] text-brand">{count}</span>
        ) : null}
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="flex shrink-0 items-center gap-[5px] rounded-full border border-brand/30 bg-white px-[10px] py-[4px] font-ui text-[12.5px] font-semibold text-brand"
      >
        <SlidersHorizontal aria-hidden="true" className="size-[13px]" />
        Filter &amp; Sort
        {count > 0 ? (
          <span className="flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-brand px-[4px] text-[10px] font-bold text-white">{count}</span>
        ) : null}
      </button>
    );

  const dialog = open ? (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-[rgba(11,31,77,0.55)] lg:items-center lg:p-[24px]"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex h-[82dvh] w-full flex-col overflow-hidden rounded-t-[24px] bg-white font-ui shadow-[0_-10px_30px_rgba(1,66,170,0.25)] sm:max-w-[560px] lg:h-[min(640px,86vh)] lg:max-w-[820px] lg:rounded-[24px] lg:shadow-[0_24px_60px_rgba(11,31,77,0.35)]"
      >
        <span aria-hidden="true" className="mx-auto mt-[8px] h-[4px] w-[40px] shrink-0 rounded-full bg-cart-line lg:hidden" />
        <div className="flex shrink-0 items-center justify-between border-b border-cart-line px-[18px] py-[12px] lg:px-[24px] lg:py-[16px]">
          <div>
            <h2 id={titleId} className="text-[18px] font-bold text-heading lg:text-[20px]">
              {hideSort ? 'Filters' : 'Filter & Sort'}
            </h2>
            {filters ? <p className="text-[12.5px] text-ink-muted">{filters.category.name}</p> : null}
          </div>
          <div className="flex items-center gap-[14px]">
            <button
              type="button"
              onClick={clearAll}
              disabled={draftCount === 0 && (hideSort || draft.sort === 'default')}
              className="text-[13px] font-bold tracking-[0.5px] text-brand disabled:opacity-40"
            >
              CLEAR ALL
            </button>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Close filters"
              className="flex size-[32px] items-center justify-center rounded-full bg-brand-popup-bg text-heading hover:bg-brand hover:text-white"
            >
              <X aria-hidden="true" className="size-[17px]" />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <ul role="tablist" aria-orientation="vertical" className="w-[38%] shrink-0 overflow-y-auto bg-[#f3f6fb] lg:w-[250px]">
            {sections.map((s) => {
              const on = s.key === current.key;
              const n = picked(s);
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setActive(s.key)}
                    className={`relative flex w-full items-center gap-[8px] px-[14px] py-[14px] text-left text-[13.5px] lg:px-[20px] lg:text-[14.5px] ${
                      on ? 'bg-white font-bold text-heading' : 'font-medium text-ink-body hover:bg-white/60'
                    }`}
                  >
                    {on ? <span aria-hidden="true" className="absolute inset-y-[8px] left-0 w-[4px] rounded-r-[4px] bg-brand" /> : null}
                    <span className="min-w-0 flex-1">{s.label}</span>
                    {n > 0 && s.key !== 'sort' ? (
                      <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-[5px] text-[10.5px] font-bold text-white">{n}</span>
                    ) : n > 0 ? (
                      <span aria-hidden="true" className="size-[7px] rounded-full bg-brand" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <div role="tabpanel" className="min-w-0 flex-1 overflow-y-auto px-[14px] py-[12px] lg:px-[24px] lg:py-[16px]">
            <p className="mb-[8px] text-[12px] font-bold uppercase tracking-[0.8px] text-ink-muted">{current.label}</p>
            <div className="lg:grid lg:grid-cols-2 lg:gap-x-[12px] lg:[&>label]:col-span-2 lg:[&>p]:col-span-2 lg:[&>div]:col-span-2">{right()}</div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-[12px] border-t border-cart-line px-[16px] py-[12px] pb-[calc(12px+env(safe-area-inset-bottom))] lg:px-[24px] lg:py-[16px]">
          <button
            type="button"
            onClick={close}
            className="h-[46px] flex-1 rounded-[14px] border border-brand-popup-border text-[15px] font-bold text-heading hover:bg-brand-popup-bg lg:max-w-[180px]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={apply}
            className="h-[46px] flex-[2] rounded-[14px] bg-brand text-[15px] font-bold text-white shadow-[0_8px_14px_rgba(1,66,170,0.3)] hover:bg-[#013a96] lg:ml-auto lg:max-w-[260px]"
          >
            Apply{draftCount > 0 ? ` (${draftCount})` : ''}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {trigger}
      {mounted && dialog ? createPortal(dialog, document.body) : null}
    </>
  );
}

function Row({
  label,
  on,
  onClick,
  round = false,
  count,
}: {
  label: React.ReactNode;
  on: boolean;
  onClick: () => void;
  round?: boolean;
  count?: number;
}) {
  return (
    <button
      type="button"
      role={round ? 'radio' : 'checkbox'}
      aria-checked={on}
      onClick={onClick}
      className={`mb-[6px] flex w-full items-center gap-[10px] rounded-[12px] border px-[12px] py-[10px] text-left transition-colors ${
        on ? 'border-brand bg-brand-popup-bg' : 'border-transparent hover:bg-[#f7f9fd]'
      }`}
    >
      {round ? (
        <span className={`flex size-[20px] shrink-0 items-center justify-center rounded-full border-2 ${on ? 'border-brand' : 'border-[#c5d0e3]'}`}>
          {on ? <span className="size-[10px] rounded-full bg-brand" /> : null}
        </span>
      ) : (
        <span className={`flex size-[20px] shrink-0 items-center justify-center rounded-[6px] border-2 ${on ? 'border-brand bg-brand' : 'border-[#c5d0e3] bg-white'}`}>
          {on ? <Check aria-hidden="true" className="size-[13px] text-white" strokeWidth={3} /> : null}
        </span>
      )}
      <span className={`min-w-0 flex-1 truncate text-[14px] ${on ? 'font-semibold text-heading' : 'text-ink-body'}`}>{label}</span>
      {count != null ? <span className="shrink-0 text-[12px] text-ink-muted">{count}</span> : null}
    </button>
  );
}

function NumberBox({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <label className="flex h-[42px] min-w-0 flex-1 items-center gap-[6px] rounded-[12px] border border-brand-popup-border bg-white px-[12px] focus-within:border-brand">
      <span className="text-[12px] font-semibold text-ink-muted">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Math.max(0, Number(e.target.value)))}
        className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-heading outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
    </label>
  );
}
