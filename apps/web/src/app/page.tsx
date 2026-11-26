import { BestCategoriesShowcase } from '@/components/home/BestCategoriesShowcase';
import { ExploreCategories } from '@/components/home/ExploreCategories';
import { PromoSlider } from '@/components/home/PromoSlider';
import { BrandVideoWindow } from '@/components/home/BrandVideoWindow';
import { SponsoredSlot } from '@/components/home/SponsoredSlot';
import {
  DeskBigBanners,
  DeskBrandGrid,
  DeskBrandOffers,
  DeskFeatureStrip,
  DeskPicks,
  DeskRailPanels,
  DeskReferBanner,
} from '@/components/dhome/DesktopSections';
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
import { categoryTaxonomy, exploreCategories, taxonomyBestSlides } from '@/lib/category-taxonomy';

export default async function HomePage() {
  const bestSlides = taxonomyBestSlides();
  const { sliders, showcase } = await getHomeProducts();

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

      {/* Desktop (>= 1025px): the app's home, same sections in the same order, laid out wide. */}
      <div className="hidden flex-col pb-[8px] lg:flex">
        <PromoSlider />
        <ExploreCategories mains={exploreCategories()} />
        <div className="mt-[24px]">
          <SponsoredSlot />
        </div>
        <DeskRailPanels rails={sliders} />
        <DeskReferBanner />
        <DeskBrandOffers />
        <DeskBrandGrid />
        <DeskBigBanners />
        <DeskPicks showcase={showcase} />
        <BestCategoriesShowcase slides={bestSlides} />
        <DeskFeatureStrip />
      </div>
      <BrandVideoWindow />
    </>
  );
}
