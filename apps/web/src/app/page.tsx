import { BRAND_OFFERS, EXPLORE_FEATURES, FEATURE_CARDS } from '@youmart/shared-client';
import { BestCategoriesCarousel } from '@/components/home/BestCategoriesCarousel';
import { BestCategoriesShowcase } from '@/components/home/BestCategoriesShowcase';
import { BrandStrip } from '@/components/home/BrandStrip';
import { CategoryMegaMenu } from '@/components/home/CategoryMegaMenu';
import { ExploreCategories } from '@/components/home/ExploreCategories';
import { ExploreFeatureStrip } from '@/components/home/ExploreFeatureStrip';
import { FeatureCards } from '@/components/home/FeatureCards';
import { ProductRails } from '@/components/home/ProductRails';
import { ProductRailSliders } from '@/components/home/ProductRailSliders';
import { ProductShowcase } from '@/components/home/ProductShowcase';
import { PromoBanners } from '@/components/home/PromoBanners';
import { PromoSlider } from '@/components/home/PromoSlider';
import { BrandVideoWindow } from '@/components/home/BrandVideoWindow';
import { SponsoredSlot } from '@/components/home/SponsoredSlot';
import { getHomeProducts } from '@/lib/catalog';
import {
  BestCategories as PhoneBestCategories,
  BigBanners,
  BrandGrid,
  BrandOffers,
  CategoryPager,
  FeatureStrip,
  PicksShowcase,
  PromoPairs,
  RailPanels,
  ReferBanner,
  type MainCat,
} from '@/components/mhome/HomeSections';
import { storeCategories } from '@/lib/categories';
import { categoryTaxonomy, exploreCategories, taxonomyBestSlides } from '@/lib/category-taxonomy';

export default async function HomePage() {
  const bestSlides = taxonomyBestSlides();
  const featured = bestSlides[0];
  const { rails, sliders, showcase } = await getHomeProducts();

  const mains: MainCat[] = categoryTaxonomy.map((m) => ({
    slug: m.slug,
    name: m.name,
    href: m.href,
    image: m.image.mobile,
    hasChildren: m.subcategories.length > 0,
  }));

  return (
    <>
      {/* Phone + tablet (< 1025px): the app's home screen, section by section. */}
      <div className="flex flex-col pb-[4px] lg:hidden">
        <PromoPairs />
        <CategoryPager mains={mains} />
        <div className="mt-[16px]">
          <SponsoredSlot />
        </div>
        <RailPanels rails={sliders} />
        <ReferBanner />
        <BrandOffers />
        <BrandGrid />
        <BigBanners />
        <PicksShowcase showcase={showcase} />
        <PhoneBestCategories slides={bestSlides} />
        <FeatureStrip />
      </div>

    {/* Desktop (>= 1025px): unchanged. */}
    <div className="hidden flex-col lg:flex">
      <div className="order-2 mt-[27px] lg:order-1 lg:mt-0">
        {/* Below 1025px: the live category grid, unchanged. Desktop: the redesigned section. */}
        <CategoryMegaMenu categories={storeCategories} />
        <ExploreCategories mains={exploreCategories()} />
        <ExploreFeatureStrip features={EXPLORE_FEATURES} />
      </div>
      <div className="order-1 lg:order-2">
        {/* Below 1025px: live's banner pairs, unchanged. Desktop: the redesigned slider. */}
        <PromoBanners />
        <PromoSlider />
      </div>

      <div className="order-3">
        {/* v1.19 the live image ad (approved + paid); nothing when none is live. */}
        <SponsoredSlot />
        {rails.length > 0 && <ProductRails rails={rails} />}
        <ProductRailSliders rails={sliders} />
        <BrandStrip brands={BRAND_OFFERS} />
        <ProductShowcase productsFor={showcase} />
        {featured && (
          <BestCategoriesCarousel
            title={`Best Categories Today \u2014 ${featured.name}`}
            items={featured.items}
          />
        )}
        <BestCategoriesShowcase slides={bestSlides} />
        <FeatureCards cards={FEATURE_CARDS} />
      </div>
      {/* v1.18 today's brand video (or a live video ad), floating in the corner on desktop. */}
    </div>
      <BrandVideoWindow />
    </>
  );
}
