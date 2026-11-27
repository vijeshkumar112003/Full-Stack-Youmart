import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { categoryHref, listingQueryString, parseListingQuery } from '@youmart/shared-client';
import Link from 'next/link';
import { CategoryBar } from '@/components/category/CategoryBar';
import { CategoryTaxonomySidebar } from '@/components/category/CategoryTaxonomySidebar';
import { DeskBrandWall, DeskCategoryHero, DeskSortBar } from '@/components/category/DeskCategory';
import { categoryBrands } from '@/lib/category-brands';
import { FilterSheet } from '@/components/listing/FilterSheet';
import { InfiniteProductGrid } from '@/components/listing/InfiniteProductGrid';
import { RelatedCategories } from '@/components/listing/RelatedCategories';
import { AppCategoryLayout } from '@/components/category/AppCategoryLayout';
import { getCategoryListing, listMoreCategoryProducts, resolveCategoryPath } from '@/lib/catalog';
import { categoryBarMains, categoryContext } from '@/lib/category-taxonomy';

interface CategoryPageProps {
  params: { slug: string[] };
  searchParams: Record<string, string | string[] | undefined>;
}

export function generateMetadata({ params }: CategoryPageProps): Metadata {
  const node = resolveCategoryPath(params.slug);
  return node ? { title: `Shop for ${node.name} | YouMart` } : {};
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const path = params.slug;
  const node = resolveCategoryPath(path);
  if (!node) {
    notFound();
  }
  const query = parseListingQuery(searchParams);
  const listing = await getCategoryListing(path, { ...query, page: 1 });
  const basePath = categoryHref(...path);
  // Only the brands that have products in this category (the category's brand facet).
  const brands = categoryBrands(listing.filters);
  const context = categoryContext(path);
  const title = context?.trail[context.trail.length - 1]?.name ?? node.name;

  const here = context?.main.subcategories.flatMap((sub) => [sub, ...sub.children]).find((n) => n.match === 'catalog' && n.href === basePath);
  const heroImage = here?.image ?? context?.main.image.mobile ?? null;

  async function loadMore(page: number) {
    'use server';
    const res = await listMoreCategoryProducts(path, { ...query, page });
    return res.products;
  }

  return (
    <>
      <CategoryBar mains={categoryBarMains()} activeSlug={context?.main.slug} />
      {/* Phones / tablets: the app's category screen. */}
      <div className="lg:hidden">
        <AppCategoryLayout
          main={context?.main ?? null}
          title={title}
          basePath={basePath}
          query={query}
          brands={brands}
          filterButton={<FilterSheet key={`m-${listingQueryString(query)}`} variant="pill" basePath={basePath} query={query} filters={listing.filters} />}
        >
          {listing.products.length > 0 ? (
            <InfiniteProductGrid
              initial={listing.products}
              total={listing.total}
              loadMore={loadMore}
              card="mini"
              gridClassName="mb-[16px] grid grid-cols-2 gap-[8px] md:grid-cols-3"
            />
          ) : (
            <div className="flex flex-col items-center gap-[8px] py-[48px] text-center">
              <span className="flex size-[60px] items-center justify-center rounded-full bg-brand-popup-bg font-ui text-[26px]">📦</span>
              <p className="font-ui text-[16px] font-bold text-heading">No products here yet</p>
              <p className="px-[12px] text-[13px] text-ink-muted">Try another category or clear the filters.</p>
            </div>
          )}
        </AppCategoryLayout>
      </div>
      {/* Desktop: the app's category screen laid out for a wide screen. */}
      <div className="mx-auto hidden max-w-[1440px] gap-[24px] px-[32px] pb-[8px] pt-[18px] lg:flex">
        {context && <CategoryTaxonomySidebar main={context.main} currentHref={basePath} />}
        <div className="min-w-0 flex-1">
          <DeskCategoryHero
            trail={context?.trail ?? [{ name: node.name, href: basePath }]}
            title={title}
            total={listing.total}
            brandCount={brands.length}
            image={heroImage}
          />
          <DeskBrandWall brands={brands} basePath={basePath} query={query} categoryName={title} />
          <DeskSortBar
            basePath={basePath}
            query={query}
            filters={listing.filters}
            filterButton={<FilterSheet key={`d-${listingQueryString(query)}`} variant="desk" hideSort basePath={basePath} query={query} filters={listing.filters} />}
          />
          {listing.products.length > 0 ? (
            <div className="mt-[18px]">
              <InfiniteProductGrid
                initial={listing.products}
                total={listing.total}
                loadMore={loadMore}
                card="desk"
                gridClassName="grid grid-cols-4 gap-[16px] 2xl:grid-cols-5"
              />
            </div>
          ) : (
            <div className="mt-[18px] flex flex-col items-center gap-[10px] rounded-[20px] border border-brand-popup-border bg-white py-[56px] text-center shadow-rail-card">
              <span className="flex size-[72px] items-center justify-center rounded-full bg-brand-popup-bg font-ui text-[30px]">📦</span>
              <p className="font-ui text-[18px] font-bold text-heading">No products match these filters</p>
              <p className="text-[14px] text-ink-muted">Try another brand or clear the filters.</p>
              <Link href={basePath} className="mt-[6px] rounded-[12px] bg-brand px-[20px] py-[10px] font-ui text-[14px] font-bold text-white hover:bg-[#013a96]">
                Show all {title}
              </Link>
            </div>
          )}

          <RelatedCategories path={path} />
        </div>
      </div>
    </>
  );
}
