import Image from 'next/image';
import Link from 'next/link';
import { LayoutGrid, Package } from 'lucide-react';
import {
  listingQueryString,
  selectedValues,
  withFilter,
  type ListingQuery,
  type TaxonomyMain,
} from '@youmart/shared-client';
import { BrandLogo } from '@/components/mhome/BrandLogo';

// The app's category screen (apps/mobile/src/app/category/[slug].tsx) for phones: a sub-category
// rail on the left (a sub with its own items swaps the rail to its sub-to-sub list), "Shop by
// brand" tiles + Filter & Sort across the top, and the product grid beside the rail.

interface RailEntry {
  key: string;
  name: string;
  href: string;
  image: string | null;
  all?: boolean;
}

function railFor(main: TaxonomyMain, basePath: string): { entries: RailEntry[]; current: string } {
  // Subs the catalog doesn't hold yet link to the main's own page - never "current" there.
  const sub = main.subcategories.find(
    (s) => s.href !== main.href && (basePath === s.href || basePath.startsWith(`${s.href}/`)),
  );
  const ownList = sub && sub.children.length > 0 && !(sub.children.length === 1 && sub.children[0]!.name === sub.name);
  if (sub && ownList) {
    return {
      current: basePath,
      entries: [
        { key: `all-${sub.slug}`, name: `All ${sub.name}`, href: sub.href, image: sub.image, all: true },
        ...sub.children.map((c) => ({ key: c.slug, name: c.name, href: c.href, image: c.image })),
      ],
    };
  }
  return {
    current: sub?.href ?? basePath,
    entries: [
      { key: `all-${main.slug}`, name: `All ${main.name}`, href: main.href, image: main.image.mobile, all: true },
      ...main.subcategories.map((s) => ({ key: s.slug, name: s.name, href: s.href, image: s.image })),
    ],
  };
}

export function AppCategoryLayout({
  main,
  title,
  basePath,
  query,
  brands,
  filterButton,
  children,
}: {
  main: TaxonomyMain | null;
  title: string;
  basePath: string;
  query: ListingQuery;
  brands: { value: string; count: number }[];
  filterButton: React.ReactNode;
  children: React.ReactNode;
}) {
  const rail = main ? railFor(main, basePath) : null;
  const chosen = selectedValues(query, 'brand');
  const brandHref = (value: string | null) =>
    `${basePath}${listingQueryString({ ...query, filters: withFilter(query.filters, 'brand', value) })}`;

  return (
    <div className="flex min-h-[70vh]">
      {rail ? (
        <nav aria-label="Categories" className="sticky top-0 max-h-[calc(100dvh-70px)] w-[80px] shrink-0 overflow-y-auto border-r border-cart-line bg-white [scrollbar-width:none]">
          {rail.entries.map((e) => {
            const on = e.all ? basePath === e.href : e.href !== main?.href && e.href === rail.current;
            return (
              <Link
                key={e.key}
                href={e.href}
                aria-current={on ? 'page' : undefined}
                className={`relative flex flex-col items-center gap-[4px] px-[4px] py-[9px] text-center ${on ? 'bg-brand-popup-bg' : ''}`}
              >
                {on ? <span aria-hidden="true" className="absolute inset-y-[8px] left-0 w-[3px] rounded-r-[3px] bg-brand" /> : null}
                <span className={`relative flex size-[52px] items-center justify-center overflow-hidden rounded-[14px] ${on ? 'ring-2 ring-brand' : ''} bg-brand-popup-bg`}>
                  {e.image ? (
                    <Image src={e.image} alt="" fill sizes="52px" className="object-cover" />
                  ) : e.all ? (
                    <LayoutGrid aria-hidden="true" className="size-[20px] text-brand" />
                  ) : (
                    <Package aria-hidden="true" className="size-[20px] text-brand" />
                  )}
                </span>
                <span className={`line-clamp-2 font-ui text-[10.5px] leading-[12.5px] ${on ? 'font-bold text-brand' : 'font-medium text-heading'}`}>{e.name}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}

      <div className="min-w-0 flex-1 px-[8px] pt-[8px]">
        <h1 className="truncate px-[2px] font-ui text-[17px] font-bold text-heading">{title}</h1>
        <div className="mt-[6px] flex items-center justify-between gap-[8px] px-[2px]">
          <span className="font-ui text-[12.5px] font-semibold text-ink-muted">{brands.length > 0 ? 'Shop by brand' : ''}</span>
          {filterButton}
        </div>
        {brands.length > 0 ? (
          <div className="-mx-[8px] mt-[8px] flex gap-[6px] overflow-x-auto px-[8px] pb-[4px] [scrollbar-width:none]">
            <Link
              href={brandHref(null)}
              className={`flex h-[48px] w-[64px] shrink-0 items-center justify-center rounded-[12px] border bg-white font-ui text-[13px] font-bold ${chosen.length === 0 ? 'border-brand text-brand ring-1 ring-brand' : 'border-[#e3e9f3] text-heading'}`}
            >
              All
            </Link>
            {brands.slice(0, 40).map((b) => {
              const on = chosen.includes(b.value);
              return (
                <Link
                  key={b.value}
                  href={brandHref(on ? null : b.value)}
                  aria-label={`${b.value} (${b.count})`}
                  className={`flex h-[48px] w-[84px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] border bg-white px-[4px] [&_img]:!max-h-[30px] [&_span]:!text-[11px] ${on ? 'border-brand ring-1 ring-brand' : 'border-[#e3e9f3]'}`}
                >
                  <BrandLogo name={b.value} />
                </Link>
              );
            })}
          </div>
        ) : null}
        <div className="mt-[8px]">{children}</div>
      </div>
    </div>
  );
}
