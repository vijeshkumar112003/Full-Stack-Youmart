'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { skipImageOptimizer } from '@/lib/images';
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Copy,
  Diamond,
  Flame,
  Gift,
  Home as HomeIcon,
  Info,
  Lightbulb,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Rocket,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Tags,
  HelpCircle,
  Check,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import {
  BRAND_OFFERS,
  BUSINESS,
  FEATURE_CARDS,
  PRODUCT_FILTER_TABS,
  PROMO_BANNER_SLIDES,
  PROMO_SLIDER_INTERVAL_MS,
  ROUTES,
  discountPercent,
  formatMoney,
  type FeatureCard,
  type Money,
  type ProductCardData,
  type ProductFilter,
  type ProductRailKey,
  type ProductRailSlider,
} from '@youmart/shared-client';
import { OfferBadge } from '@/components/ui/OfferBadge';
import { ArrangeCategories, useCategoryOrder } from '@/components/home/CategoryOrder';
import type { BestCategorySlide } from '@/lib/category-taxonomy';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';
import { BrandLogo } from './BrandLogo';
import { MiniProductCard } from './MiniProductCard';
import { Dots, SNAP_ROW, SectionHead, usePager } from './pager';

// The website's phone home (below 1025px) - the app's home screen section by section, same order,
// same look (apps/mobile/src/app/(tabs)/index.tsx and its components).

/* ---------------------------------------------------------------- promo pairs */

export function PromoPairs() {
  const { bind, index, goTo } = usePager(PROMO_BANNER_SLIDES.length, { autoMs: PROMO_SLIDER_INTERVAL_MS });
  return (
    <section aria-label="Offers" className="pt-[12px]">
      <div {...bind} className={SNAP_ROW}>
        {PROMO_BANNER_SLIDES.map((pair) => (
          <div key={pair[0].id} className="flex w-full shrink-0 snap-start gap-[12px] px-[16px]">
            {pair.map((b) => (
              <Link
                key={b.id}
                href={b.href}
                className="relative block aspect-[3.2] flex-1 overflow-hidden rounded-[12px] bg-brand-popup-bg active:opacity-95"
              >
                <Image src={b.poster} alt={b.title} fill sizes="50vw" className="object-cover" />
              </Link>
            ))}
          </div>
        ))}
      </div>
      <Dots className="mt-[8px]" count={PROMO_BANNER_SLIDES.length} index={index} onPick={goTo} />
    </section>
  );
}

/* ------------------------------------------------------------ shop by category */

export interface MainCat {
  slug: string;
  name: string;
  href: string;
  image: string | null;
  hasChildren: boolean;
}

const PER_PAGE = 9;

export function CategoryPager({ mains }: { mains: MainCat[] }) {
  const { ordered, save } = useCategoryOrder(mains);
  const [arranging, setArranging] = useState(false);
  const pages: MainCat[][] = [];
  for (let i = 0; i < ordered.length; i += PER_PAGE) pages.push(ordered.slice(i, i + PER_PAGE));
  const { bind, index, goTo } = usePager(pages.length);
  return (
    <section aria-label="Shop by category" className="mt-[12px]">
      <div className="mb-[12px] flex items-baseline justify-between px-[16px]">
        <h2 className="font-ui text-[17px] font-bold text-heading">Shop by category</h2>
        <button type="button" onClick={() => setArranging(true)} className="font-ui text-[11.5px] font-medium text-ink-muted">
          Tap to rearrange
        </button>
      </div>
      <div {...bind} className={SNAP_ROW}>
        {pages.map((page, p) => (
          <div key={p} className="grid w-full shrink-0 snap-start grid-cols-3 gap-x-[8px] gap-y-[10px] px-[16px]">
            {page.map((c) => (
              <Link
                key={c.slug}
                href={c.href}
                className="relative flex flex-col overflow-hidden rounded-[14px] border border-brand-popup-border bg-white shadow-[0_2px_5px_rgba(1,66,170,0.08)] active:opacity-90"
              >
                <span className="relative block aspect-square bg-brand-popup-bg">
                  {c.image ? (
                    <Image src={c.image} alt="" fill sizes="33vw" className="object-cover" />
                  ) : (
                    <Tags aria-hidden="true" className="absolute inset-0 m-auto size-[22px] text-brand" />
                  )}
                </span>
                <span className="flex flex-1 items-center justify-center border-t border-brand-popup-border px-[6px] py-[6px] text-center font-ui text-[10.5px] font-semibold leading-[13px] text-heading">
                  {c.name}
                </span>
                {c.hasChildren ? (
                  <span aria-hidden="true" className="absolute right-[8px] top-[8px] size-[6px] rounded-full bg-brand" />
                ) : null}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <Dots className="mt-[16px]" count={pages.length} index={index} onPick={goTo} />
      <ArrangeCategories
        open={arranging}
        onClose={() => setArranging(false)}
        items={ordered}
        onSave={async (next) => {
          await save(next);
          setArranging(false);
        }}
      />
    </section>
  );
}

/* ------------------------------------------------------ handpicked deal panels */

const RAIL_THEME: Record<ProductRailKey, { gradient: string; icon: LucideIcon; tagline: string }> = {
  'left-off': { gradient: 'linear-gradient(140deg,#0b1b3f 0%,#0142aa 55%,#2f6ae8 100%)', icon: Clock, tagline: 'Continue where you stopped' },
  trending: { gradient: 'linear-gradient(140deg,#3b0a6b 0%,#7c3aed 55%,#c026d3 100%)', icon: Flame, tagline: 'What everyone is buying' },
  'top-deals': { gradient: 'linear-gradient(140deg,#7f1d1d 0%,#e11d48 55%,#f97316 100%)', icon: Tags, tagline: 'Biggest savings today' },
  recommended: { gradient: 'linear-gradient(140deg,#053d33 0%,#047857 55%,#14b8a6 100%)', icon: Sparkles, tagline: 'Picked to match your taste' },
  explore: { gradient: 'linear-gradient(140deg,#172554 0%,#1d4ed8 50%,#06b6d4 100%)', icon: Compass, tagline: 'Discover something new' },
};

const shortMoney = (m: Money) => formatMoney(m).replace(/\.00$/, '');

const RAIL_SORT: Record<ProductRailKey, string> = {
  'left-off': 'date',
  trending: 'rating',
  'top-deals': 'discount',
  recommended: 'rating',
  explore: 'date',
};

export function RailPanels({ rails }: { rails: ProductRailSlider[] }) {
  const panels = rails.filter((r) => r.products.length > 0);
  const { bind, index, goTo } = usePager(panels.length);
  if (panels.length === 0) return null;
  return (
    <section aria-label="Handpicked for you" className="mt-[20px]">
      <SectionHead title="Handpicked for you" />
      <div {...bind} className={`${SNAP_ROW} mt-[12px] gap-[12px] scroll-px-[16px] px-[16px]`}>
        {panels.map((rail) => {
          const t = RAIL_THEME[rail.key] ?? RAIL_THEME.explore;
          const Icon = t.icon;
          return (
            <div
              key={rail.key}
              style={{ backgroundImage: t.gradient }}
              className="relative flex w-[min(calc(100vw-48px),380px)] shrink-0 snap-start flex-col gap-[10px] overflow-hidden rounded-[22px] p-[14px]"
            >
              <span aria-hidden="true" className="pointer-events-none absolute -right-[50px] -top-[70px] size-[170px] rounded-full bg-white/[0.09]" />
              <span aria-hidden="true" className="pointer-events-none absolute -bottom-[60px] -left-[40px] size-[120px] rounded-full bg-white/[0.09]" />
              <div className="relative flex items-center gap-[10px]">
                <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[12px] border border-white/25 bg-white/[0.18]">
                  <Icon aria-hidden="true" className="size-[17px] text-white" />
                </span>
                <Link href={`/shop?orderby=${RAIL_SORT[rail.key] ?? 'date'}`} className="min-w-0 flex-1">
                  <span className="block truncate font-ui text-[16px] font-bold text-white">{rail.heading}</span>
                  <span className="block truncate font-ui text-[11.5px] font-medium text-white/80">{t.tagline}</span>
                </Link>
                <Link
                  href={`/shop?orderby=${RAIL_SORT[rail.key] ?? 'date'}`}
                  className="flex h-[28px] shrink-0 items-center gap-[2px] rounded-full border border-white/30 bg-white/[0.18] pl-[10px] pr-[6px] font-ui text-[11.5px] font-bold text-white"
                >
                  View all <ChevronRight aria-hidden="true" className="size-[14px]" />
                </Link>
              </div>
              <div className="relative grid grid-cols-2 gap-[10px]">
                {rail.products.slice(0, 4).map((p) => {
                  const off = discountPercent(p.mrp, p.sellingPrice);
                  return (
                    <Link key={p.id} href={p.href} className="flex flex-col gap-[4px] rounded-[16px] bg-white p-[6px] pb-[9px] shadow-[0_3px_8px_rgba(0,0,0,0.12)] active:scale-[0.97]">
                      <span className="relative block aspect-square overflow-hidden rounded-[12px] bg-[#f4f7fd]">
                        <Image src={p.image} alt="" fill sizes="45vw" unoptimized={skipImageOptimizer(p.image)} className="object-contain" />
                        {off > 0 ? (
                          <span className="absolute left-[6px] top-[6px] rounded-[7px] bg-[#e11d48] px-[6px] py-[2px] font-ui text-[9.5px] font-bold text-white">
                            {off}% OFF
                          </span>
                        ) : null}
                      </span>
                      <span className="truncate px-[2px] font-ui text-[12px] font-medium text-black">{p.title}</span>
                      <span className="flex items-baseline gap-[5px] px-[2px]">
                        <span className="font-ui text-[14px] font-bold text-heading">{shortMoney(p.sellingPrice)}</span>
                        {off > 0 ? <span className="text-[10.5px] text-ink-muted line-through">{shortMoney(p.mrp)}</span> : null}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <Dots className="mt-[10px]" count={panels.length} index={index} onPick={goTo} />
    </section>
  );
}

/* ------------------------------------------------------------ refer & earn */

const INK = '#2a1a8f';
const GOLD = '#ffc94d';

export function ReferBanner() {
  const signedIn = useSession().status === 'authenticated';
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!signedIn) return setCode(null);
    let on = true;
    api.auth
      .referral()
      .then((r) => on && setCode(r.code))
      .catch(() => undefined);
    return () => {
      on = false;
    };
  }, [signedIn]);

  const invite = async () => {
    if (!code) return;
    const text = `Shop on YouMart with my code ${code}: https://youmart.in/?ref=${code}`;
    if (navigator.share) await navigator.share({ text }).catch(() => undefined);
    else await navigator.clipboard?.writeText(text).catch(() => undefined);
  };

  return (
    <section className="mx-[16px] mt-[20px]">
      <div className="relative flex min-h-[196px] overflow-hidden rounded-[24px] bg-[#3a22c4] py-[18px] pl-[18px] pr-[8px] shadow-[0_8px_16px_rgba(42,26,143,0.35)]">
        <span aria-hidden="true" className="absolute -right-[90px] -top-[110px] size-[260px] rounded-full bg-[#5a3cf0]" />
        <span aria-hidden="true" className="absolute -bottom-[120px] -left-[80px] size-[200px] rounded-full bg-[#2c1a9e]" />
        <span aria-hidden="true" className="absolute -bottom-[70px] right-[40px] size-[120px] rounded-full bg-[#ff7a59]/35" />
        <div className="relative z-[1] flex flex-1 flex-col gap-[7px]">
          <span className="flex items-center gap-[4px] self-start rounded-[6px] px-[9px] py-[3px] font-ui text-[10.5px] font-bold tracking-[1px]" style={{ background: GOLD, color: INK }}>
            <Sparkles aria-hidden="true" className="size-[11px]" /> REFER &amp; EARN
          </span>
          <p className="font-ui text-[21px] font-bold leading-[26px] text-white">
            Invite friends,
            <br />
            earn <span style={{ color: GOLD }}>2.5%</span> on their orders
          </p>
          <p className="font-ui text-[12px] font-medium leading-[17px] text-white/80">
            On every order of ₹500+ · credited to your wallet after delivery
          </p>
          <div className="mt-[6px] flex flex-wrap items-center gap-[8px]">
            {code ? (
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1600);
                }}
                className="flex items-center gap-[6px] rounded-[12px] border-[1.5px] border-dashed border-white/55 bg-white/10 px-[10px] py-[7px]"
              >
                <span className="font-ui text-[9.5px] font-bold tracking-[1px] text-white/70">CODE</span>
                <span className="font-ui text-[14px] font-bold tracking-[1.2px] text-white">{code}</span>
                {copied ? <Check aria-hidden="true" className="size-[15px] text-[#86efac]" /> : <Copy aria-hidden="true" className="size-[15px] text-white" />}
              </button>
            ) : null}
            {code ? (
              <button type="button" onClick={invite} className="flex items-center gap-[5px] rounded-[12px] bg-white px-[14px] py-[9px] font-ui text-[13.5px] font-bold" style={{ color: INK }}>
                Invite now <ArrowRight aria-hidden="true" className="size-[15px]" />
              </button>
            ) : (
              <Link href={ROUTES.refer} className="flex items-center gap-[5px] rounded-[12px] bg-white px-[14px] py-[9px] font-ui text-[13.5px] font-bold" style={{ color: INK }}>
                Invite &amp; earn <ArrowRight aria-hidden="true" className="size-[15px]" />
              </Link>
            )}
          </div>
        </div>
        <div aria-hidden="true" className="relative flex w-[112px] shrink-0 items-center justify-center">
          <span className="absolute size-[104px] rounded-full border-2 border-white/[0.18]" />
          <span className="flex size-[82px] -rotate-[8deg] items-center justify-center rounded-full shadow-[0_6px_10px_rgba(0,0,0,0.25)]" style={{ background: GOLD }}>
            <Gift className="size-[46px]" style={{ color: INK }} />
          </span>
          {[
            'right-[6px] top-[6px] size-[30px] text-[14px]',
            'bottom-[18px] left-0 size-[22px] text-[11px] [animation-delay:500ms]',
            'bottom-[4px] right-[18px] size-[18px] text-[9px] [animation-delay:900ms]',
          ].map((c) => (
            <span key={c} className={`absolute flex animate-[ym-float_2.6s_ease-in-out_infinite] items-center justify-center rounded-full border-2 border-[#f2b622] bg-[#ffd75e] font-ui font-bold text-[#9a6400] ${c}`}>
              ₹
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------ top brands, big offers */

export function BrandOffers() {
  return (
    <section className="relative mt-[28px] bg-gradient-to-b from-[rgba(1,66,170,0.08)] via-[rgba(124,58,237,0.05)] to-transparent pb-[8px] pt-[16px]">
      <div className="mb-[8px] flex items-end gap-[10px] px-[16px]">
        <div className="flex-1">
          <span className="mb-[5px] inline-flex items-center gap-[3px] rounded-[6px] bg-[#ffe500] px-[8px] py-[2px] font-ui text-[9.5px] font-bold tracking-[0.8px] text-[#1f1300]">
            <Zap aria-hidden="true" className="size-[10px]" /> BRAND FEST
          </span>
          <h2 className="font-ui text-[19px] font-bold text-heading">
            Top Brands, <span className="text-brand">Big Offers</span>
          </h2>
          <p className="text-[12px] text-ink-muted">Biggest discounts first · tap a brand to shop</p>
        </div>
        <span className="flex items-center gap-[2px] rounded-[10px] border border-brand/15 bg-white py-[5px] pl-[10px] pr-[6px] font-ui text-[11px] font-semibold text-brand">
          Swipe <ChevronRight aria-hidden="true" className="size-[13px]" />
        </span>
      </div>
      <div className={`${SNAP_ROW} gap-[14px] scroll-px-[16px] px-[16px] pb-[18px] pt-[10px]`}>
        {BRAND_OFFERS.map((b) => (
          <Link key={b.id} href={b.href} className="relative w-[156px] shrink-0 snap-start active:scale-[0.97]" aria-label={`${b.name}, ${b.badge.join(' ')}`}>
            <span className="block rounded-[24px] bg-[linear-gradient(135deg,#2f6ae8_0%,#7c3aed_50%,#ffe500_100%)] p-[2px] shadow-[0_7px_12px_rgba(1,66,170,0.25)]">
              <span className="relative block size-[152px] overflow-hidden rounded-[22px] bg-white">
                <Image src={b.poster} alt="" fill sizes="152px" className="object-cover" />
                <span className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-b from-transparent to-black/45" />
                <span className="absolute left-[8px] top-[8px] max-w-[132px] truncate rounded-[6px] border border-white/25 bg-[rgba(11,27,63,0.55)] px-[9px] py-[3px] font-ui text-[10.5px] font-bold tracking-[0.3px] text-white">
                  {b.name}
                </span>
                <span className="absolute bottom-[9px] right-[9px] flex items-center gap-[5px] rounded-[10px] bg-white py-[3px] pl-[10px] pr-[3px] font-ui text-[11.5px] font-bold text-brand shadow">
                  Shop
                  <span className="flex size-[18px] items-center justify-center rounded-full bg-brand">
                    <ArrowRight aria-hidden="true" className="size-[10px] text-white" />
                  </span>
                </span>
              </span>
            </span>
            <OfferBadge lines={b.badge} className="!-bottom-[8px] !-left-[8px] !size-[64px]" />
          </Link>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- shop by brand */

const GRID_BRANDS = [
  'Apple', 'IFFCO URBAN GARDENS', 'Milton', 'Pampers', 'XERGY', 'Samsung', 'UGAOO', 'The Decorshed', 'Himalaya', 'Realme', 'TrustBasket', 'Crompton',
  'Dell', 'UTKARSH', 'Cello', 'Huggies', 'BEHOMA', 'Vivo', 'Erwon', 'Borosil', 'Beats', 'KRAFTSKALA', 'Go Garden', 'Oppo',
  'Lenovo', 'Lazy Gardener', 'TIED RIBBONS', 'MamyPoko', 'Xiaomi', 'OrganicDews', 'Halonix', 'Leafy Tales', 'Asus', 'Urban Plant', 'Huawei', 'BIODROPS',
  'OnePlus', 'ORGANIC PLANT', 'MAHADHAN', 'HASTHIP', 'KYARI', 'PHILIPS', 'homecrop', 'COIR GARDEN', 'Casa De Amor', 'Garden Genie', 'Biostadt', 'Mitti Soul',
  'wipro', 'Daily Dump', 'Pi industries ltd', 'Nestasia', 'Hadly', 'Brigreenery', 'ecofynd', 'Orgamify', 'Sansar Green', 'Foodie Puppies', 'Anand Agro Care', 'MyOwnGarden',
];
const BRAND_PAGES: string[][] = [];
for (let i = 0; i < GRID_BRANDS.length; i += 12) BRAND_PAGES.push(GRID_BRANDS.slice(i, i + 12));

export function BrandGrid() {
  const { bind, index, goTo } = usePager(BRAND_PAGES.length, { autoMs: 4000 });
  return (
    <section className="relative mt-[20px] bg-gradient-to-b from-[rgba(1,66,170,0.09)] via-[rgba(1,66,170,0.03)] to-transparent pb-[12px] pt-[16px]">
      <div className="mb-[12px] px-[16px]">
        <h2 className="font-ui text-[19px] font-bold text-heading">Shop by Brand</h2>
        <p className="font-ui text-[12.5px] font-medium text-ink-muted">Trusted names, all in one place</p>
      </div>
      <div {...bind} className={SNAP_ROW}>
        {BRAND_PAGES.map((brands, p) => (
          <div key={p} className="grid w-full shrink-0 snap-start grid-cols-3 gap-[8px] px-[16px] py-[4px]">
            {brands.map((name) => (
              <Link
                key={name}
                href={`${ROUTES.search}?q=${encodeURIComponent(name)}`}
                aria-label={`Shop ${name}`}
                className="flex h-[72px] items-center justify-center rounded-[14px] border border-[#e3e9f3] bg-white shadow-[0_3px_8px_rgba(15,23,42,0.07)] active:scale-[0.97]"
              >
                <BrandLogo name={name} />
              </Link>
            ))}
          </div>
        ))}
      </div>
      <Dots className="mt-[12px]" count={BRAND_PAGES.length} index={index} onPick={goTo} />
    </section>
  );
}

/* ------------------------------------------- everything you need, in one place */

const BIG_BANNERS = [
  { id: 'products', image: '/banners/youmart-500000-products.webp', href: '/shop?orderby=rating', label: '500000+ products - shop now' },
  { id: 'brands', image: '/banners/youmart-8000-brands.webp', href: '/shop?orderby=discount', label: '8000+ brands - shop now' },
];

export function BigBanners() {
  const { bind, index, goTo } = usePager(BIG_BANNERS.length, { autoMs: 4500 });
  return (
    <section className="mt-[28px]">
      <div className="mb-[12px] flex flex-col gap-[5px] px-[16px]">
        <span className="inline-flex items-center gap-[3px] self-start rounded-[6px] bg-[#ffe500] px-[8px] py-[2px] font-ui text-[9.5px] font-bold tracking-[0.8px] text-[#1f1300]">
          <Star aria-hidden="true" className="size-[10px] fill-current" /> YOUMART
        </span>
        <h2 className="font-ui text-[19px] font-bold text-heading">
          Everything you need, <span className="text-brand">in one place</span>
        </h2>
      </div>
      <div {...bind} className={`${SNAP_ROW} gap-[8px] scroll-px-[6px] px-[6px] pb-[6px]`}>
        {BIG_BANNERS.map((b) => (
          <Link
            key={b.id}
            href={b.href}
            aria-label={b.label}
            className="relative block aspect-[2.4] w-[calc(100vw-20px)] shrink-0 snap-start overflow-hidden rounded-[20px] bg-[#e6efff] shadow-[0_8px_14px_rgba(1,66,170,0.22)] ring-[1.5px] ring-inset ring-white/60"
          >
            <Image src={b.image} alt="" fill sizes="100vw" className="object-cover" />
          </Link>
        ))}
      </div>
      <Dots className="mt-[12px]" count={BIG_BANNERS.length} index={index} onPick={goTo} />
    </section>
  );
}

/* ------------------------------------------------------------- shop our picks */

const POSTERS: Record<ProductFilter, { icon: LucideIcon; lead: string; word: string; note: string; bg: string; ink: string; leadTone: string; wordTone: string; ring: string }> = {
  new: { icon: Sparkles, lead: 'New', word: 'Arrival', note: 'Fresh in store', bg: '#0142aa', ink: '#fff', leadTone: '#fee533', wordTone: '#fff', ring: '#0142aa' },
  all: { icon: Flame, lead: 'Hot', word: 'Sale', note: 'Trending now', bg: '#fdd039', ink: '#0f172a', leadTone: '#ff0000', wordTone: '#ff0000', ring: '#ff3300' },
  sale: { icon: Tags, lead: 'Best', word: 'Offer', note: 'Biggest savings', bg: '#0f172a', ink: '#fff', leadTone: '#fff', wordTone: '#ff3300', ring: '#0f172a' },
};

export function PicksShowcase({ showcase }: { showcase: Record<ProductFilter, ProductCardData[]> }) {
  const [tab, setTab] = useState<ProductFilter>('new');
  const items = (showcase[tab] ?? []).slice(0, 21);
  return (
    <section className="mt-[28px] px-[16px]">
      <div className="-mx-[16px] mb-[12px]">
        <SectionHead title="Shop our picks" sub="Fresh arrivals, hot sales & the best offers" />
      </div>
      <div role="tablist" className="mb-[16px] flex gap-[8px] pt-[4px]">
        {PRODUCT_FILTER_TABS.map((t) => {
          const p = POSTERS[t.key];
          const on = tab === t.key;
          const Icon = p.icon;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.key)}
              style={{ background: p.bg, borderColor: on ? p.ring : 'transparent' }}
              className={`relative h-[112px] flex-1 overflow-hidden rounded-[18px] border-[2.5px] px-[10px] pb-[9px] pt-[10px] text-left transition-all duration-300 ${on ? '-translate-y-[3px] opacity-100' : 'scale-[0.97] opacity-[0.78]'}`}
            >
              <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0)_45%,rgba(0,0,0,0.1)_100%)]" />
              <Icon aria-hidden="true" className="absolute -bottom-[14px] -right-[10px] size-[64px] opacity-[0.14]" style={{ color: p.ink }} />
              <span className="relative mb-[6px] flex size-[30px] items-center justify-center rounded-[10px] border border-white/30 bg-white/[0.22]">
                <Icon aria-hidden="true" className="size-[17px]" style={{ color: p.ink }} />
              </span>
              <span className="relative block font-ui text-[15px] font-bold leading-[17px] tracking-[0.4px]" style={{ color: p.leadTone }}>
                {p.lead.toUpperCase()}
              </span>
              <span className="relative block truncate font-ui text-[17px] font-bold leading-[20px] tracking-[0.4px]" style={{ color: p.wordTone }}>
                {p.word.toUpperCase()}
              </span>
              <span className="relative block truncate text-[10.5px] opacity-85" style={{ color: p.ink }}>
                {p.note}
              </span>
              {on ? (
                <span className="absolute right-[8px] top-[8px] flex size-[20px] items-center justify-center rounded-full bg-white">
                  <Check aria-hidden="true" className="size-[12px] text-heading" strokeWidth={3} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-[8px]">
        {items.map((p) => (
          <MiniProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------ best categories today */

export function BestCategories({ slides }: { slides: BestCategorySlide[] }) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  if (!slide) return null;
  const go = (n: number) => setIndex((n + slides.length) % slides.length);
  return (
    <section className="mt-[28px] px-[12px]">
      <div className="overflow-hidden rounded-[24px] border border-brand-popup-border bg-white">
        <div className="bg-brand-popup-bg px-[16px] pb-[12px] pt-[16px]">
          <div className="flex items-center gap-[8px]">
            <span aria-hidden="true" className="h-[3px] w-[22px] rounded-[2px] bg-brand" />
            <span className="font-ui text-[11.5px] font-bold uppercase tracking-[0.8px] text-brand">Best Categories Today</span>
          </div>
          <h2 className="mt-[6px] font-ui text-[24px] font-bold text-heading">{slide.name}</h2>
          <div className="mt-[12px] flex items-center justify-between gap-[8px]">
            <Link href={slide.href} className="flex min-w-0 items-center gap-[6px] rounded-[10px] bg-brand px-[16px] py-[10px] font-ui text-[13px] font-semibold text-white">
              <span className="truncate">Shop {slide.name}</span> <ArrowRight aria-hidden="true" className="size-[14px] shrink-0" />
            </Link>
            <div className="flex gap-[8px]">
              <button type="button" aria-label="Previous category" onClick={() => go(index - 1)} className="flex size-[36px] items-center justify-center rounded-full border border-card-border bg-white text-brand">
                <ChevronLeft aria-hidden="true" className="size-[18px]" />
              </button>
              <button type="button" aria-label="Next category" onClick={() => go(index + 1)} className="flex size-[36px] items-center justify-center rounded-full border border-card-border bg-white text-brand">
                <ChevronRight aria-hidden="true" className="size-[18px]" />
              </button>
            </div>
          </div>
          <div className={`${SNAP_ROW} -mr-[16px] mt-[12px] gap-[8px] pr-[16px]`}>
            {slides.map((s, i) => (
              <button
                key={s.slug}
                type="button"
                onClick={() => go(i)}
                className={`h-[34px] shrink-0 rounded-[10px] border px-[14px] font-ui text-[12.5px] font-semibold ${i === index ? 'border-brand bg-brand text-white' : 'border-cart-line bg-white text-heading'}`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
        <div className={`${SNAP_ROW} gap-[12px] p-[16px]`}>
          {slide.items.map((it) => (
            <Link key={it.key} href={it.href} className="w-[150px] shrink-0 snap-start overflow-hidden rounded-[18px] border border-cart-line bg-white">
              <span className="relative block aspect-[2/3] bg-brand-popup-bg">
                {it.image ? <Image src={it.image} alt="" fill sizes="150px" className="object-cover" /> : <Tags aria-hidden="true" className="absolute inset-0 m-auto size-[30px] text-card-border" />}
              </span>
              <span className="flex items-center justify-between gap-[6px] border-t border-cart-line px-[12px] py-[10px]">
                <span className="truncate font-ui text-[13px] font-semibold text-heading">{it.name}</span>
                <span className="flex size-[20px] shrink-0 items-center justify-center rounded-full border border-brand text-brand">
                  <ChevronRight aria-hidden="true" className="size-[12px]" />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------- trust strip + footer */

const FEATURE_ICON: Record<FeatureCard['id'], LucideIcon> = { expertise: Lightbulb, quality: Diamond, guarantee: ShieldCheck };
const FEATURE_TONE: Record<FeatureCard['id'], { bg: string; ink: string; chip: string }> = {
  expertise: { bg: '#fee533', ink: '#0f172a', chip: 'rgba(0,0,0,0.08)' },
  quality: { bg: '#024caa', ink: '#fff', chip: 'rgba(255,255,255,0.2)' },
  guarantee: { bg: '#28b463', ink: '#fff', chip: 'rgba(255,255,255,0.2)' },
};
const FEATURE_SHORT: Record<FeatureCard['id'], string> = {
  expertise: 'Expert help for every order',
  quality: 'Top-quality products',
  guarantee: 'Satisfaction guaranteed',
};

export function FeatureStrip() {
  return (
    <section className="mt-[20px] flex gap-[8px] px-[16px]">
      {FEATURE_CARDS.map((c) => {
        const t = FEATURE_TONE[c.id];
        const Icon = FEATURE_ICON[c.id];
        return (
          <div key={c.id} className="flex flex-1 flex-col items-center gap-[6px] rounded-[16px] px-[8px] py-[12px] text-center" style={{ background: t.bg, color: t.ink }}>
            <span className="flex size-[36px] items-center justify-center rounded-[11px]" style={{ background: t.chip }}>
              <Icon aria-hidden="true" className="size-[18px]" />
            </span>
            <span className="font-ui text-[13px] font-bold">{c.title}</span>
            <span className="line-clamp-2 text-[10.5px] leading-[13.5px]">{FEATURE_SHORT[c.id]}</span>
          </div>
        );
      })}
    </section>
  );
}

const PROMISES: { icon: LucideIcon; label: string }[] = [
  { icon: BadgeCheck, label: 'Genuine products' },
  { icon: Rocket, label: 'Fast delivery' },
  { icon: RefreshCw, label: 'Easy returns' },
  { icon: Lock, label: 'Secure payments' },
];
const QUICK_LINKS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Home', href: ROUTES.home, icon: HomeIcon },
  { label: 'My Orders', href: ROUTES.orders, icon: ShoppingBag },
  { label: 'Track Order', href: ROUTES.trackOrder, icon: Navigation },
  { label: 'Refer & Earn', href: ROUTES.refer, icon: Gift },
  { label: 'About Us', href: '/about', icon: Info },
  { label: 'Contact Us', href: ROUTES.contact, icon: Phone },
  { label: 'FAQs', href: '/faq', icon: HelpCircle },
];

/** The app's compact navy footer - shown on every page below 1025px. */
export function AppFooter() {
  const contacts: { icon: LucideIcon; value: string; href: string }[] = [
    { icon: Mail, value: BUSINESS.email, href: `mailto:${BUSINESS.email}` },
    { icon: Phone, value: BUSINESS.phone, href: BUSINESS.phoneHref },
    { icon: MessageCircle, value: BUSINESS.whatsapp, href: BUSINESS.whatsappHref },
    { icon: MapPin, value: BUSINESS.address, href: BUSINESS.mapsHref },
  ];
  return (
    <footer className="relative mt-[20px] flex flex-col gap-[6px] overflow-hidden rounded-t-[20px] bg-[linear-gradient(170deg,#0b1f4d_0%,#0a2a6e_55%,#0142aa_100%)] px-[16px] pb-[12px] pt-[16px] lg:hidden">
      <span aria-hidden="true" className="absolute -right-[70px] -top-[100px] size-[200px] rounded-full bg-white/[0.06]" />
      <p className="font-ui text-[24px] font-bold text-white">
        You<span className="text-[#ffd23f]">Mart</span>
      </p>
      <p className="text-[12.5px] leading-[18px] text-white/80">Shop easy, live better - everything you need, delivered to your door.</p>
      <div className="mt-[8px] flex gap-[6px]">
        {PROMISES.map((p) => (
          <div key={p.label} className="flex flex-1 flex-col items-center gap-[3px] rounded-[10px] bg-white/[0.08] px-[2px] py-[8px] text-center">
            <p.icon aria-hidden="true" className="size-[15px] text-[#ffd23f]" />
            <span className="font-ui text-[10px] font-semibold leading-[12px] text-white">{p.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-[12px] font-ui text-[11px] font-bold uppercase tracking-[1px] text-white/60">Quick links</p>
      <div className="flex flex-wrap gap-[6px]">
        {QUICK_LINKS.map((l) => (
          <Link key={l.label} href={l.href} className="flex items-center gap-[5px] rounded-[8px] bg-white/10 px-[10px] py-[6px] font-ui text-[12.5px] font-semibold text-white active:opacity-70">
            <l.icon aria-hidden="true" className="size-[14px]" /> {l.label}
          </Link>
        ))}
      </div>
      <p className="mt-[12px] font-ui text-[11px] font-bold uppercase tracking-[1px] text-white/60">Get in touch</p>
      <div className="flex flex-col gap-[8px]">
        {contacts.map((c) => (
          <a key={c.value} href={c.href} className="flex items-center gap-[10px] active:opacity-70">
            <span className="flex size-[24px] shrink-0 items-center justify-center rounded-full bg-[#ffd23f]">
              <c.icon aria-hidden="true" className="size-[13px] text-[#0b1f4d]" />
            </span>
            <span className="font-ui text-[12.5px] font-medium leading-[17px] text-white">{c.value}</span>
          </a>
        ))}
      </div>
      <p className="mt-[12px] border-t border-white/[0.18] pt-[8px] text-center font-ui text-[11px] font-medium text-white/60">
        © 2026 YouMart · youmart.in · Made in India 🇮🇳
      </p>
    </footer>
  );
}
