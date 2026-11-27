'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Copy, Gift, Share2, ShoppingBag, Sparkles, Star, Wallet, Zap } from 'lucide-react';
import {
  BRAND_OFFERS,
  FEATURE_CARDS,
  PRODUCT_FILTER_TABS,
  ROUTES,
  discountPercent,
  type ProductCardData,
  type ProductFilter,
  type ProductRailSlider,
} from '@youmart/shared-client';
import { OfferBadge } from '@/components/ui/OfferBadge';
import { skipImageOptimizer } from '@/lib/images';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';
import { BrandLogo } from '@/components/mhome/BrandLogo';
import { MiniProductCard } from '@/components/mhome/MiniProductCard';
import {
  BIG_BANNERS,
  FEATURE_ICON,
  FEATURE_SHORT,
  FEATURE_TONE,
  GOLD,
  GRID_BRANDS,
  INK,
  POSTERS,
  RAIL_SORT,
  RAIL_THEME,
  shortMoney,
} from '@/components/mhome/HomeSections';

// The website's DESKTOP home (>= 1025px): the app's home sections (apps/mobile/src/app/(tabs)/
// index.tsx) in the same order and the same colours, laid out for a wide screen - rows instead of
// swipes, arrows instead of dots, more products per row, hover states.

/** Page width shared by every desktop section. */
export const DESK = 'mx-auto w-full max-w-[1440px] px-[32px]';

/* ------------------------------------------------------------------ helpers */

/** A horizontal row that scrolls by a page with arrow buttons (no visible scrollbar). */
export function useRow() {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);
  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update]);
  const page = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.9, behavior: 'smooth' });
  return { ref, onScroll: update, edges, page };
}

export const ROW =
  'flex snap-x snap-mandatory gap-[20px] overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export function Arrows({ edges, page, tone = 'light' }: { edges: { start: boolean; end: boolean }; page: (d: 1 | -1) => void; tone?: 'light' | 'dark' }) {
  const base =
    tone === 'dark'
      ? 'border-white/30 bg-white/15 text-white hover:bg-white hover:text-brand'
      : 'border-brand-popup-border bg-white text-brand hover:border-brand hover:bg-brand hover:text-white';
  return (
    <div className="flex gap-[8px]">
      <button type="button" aria-label="Previous" disabled={edges.start} onClick={() => page(-1)} className={`flex size-[40px] items-center justify-center rounded-full border shadow-[0_4px_12px_rgba(1,66,170,0.12)] transition-colors disabled:pointer-events-none disabled:opacity-35 ${base}`}>
        <ChevronLeft aria-hidden="true" className="size-[20px]" />
      </button>
      <button type="button" aria-label="Next" disabled={edges.end} onClick={() => page(1)} className={`flex size-[40px] items-center justify-center rounded-full border shadow-[0_4px_12px_rgba(1,66,170,0.12)] transition-colors disabled:pointer-events-none disabled:opacity-35 ${base}`}>
        <ChevronRight aria-hidden="true" className="size-[20px]" />
      </button>
    </div>
  );
}

/** The app's section heading (blue accent bar + title + subtitle), desktop size, with a right slot. */
export function Head({ title, sub, chip, right }: { title: React.ReactNode; sub?: string; chip?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-[20px] flex items-end justify-between gap-[16px]">
      <div className="flex items-center gap-[12px]">
        <span aria-hidden="true" className="h-[44px] w-[5px] shrink-0 rounded-[3px] bg-brand" />
        <div>
          {chip}
          <h2 className="font-ui text-[26px] font-bold leading-[32px] text-heading">{title}</h2>
          {sub ? <p className="font-ui text-[14px] font-medium text-ink-muted">{sub}</p> : null}
        </div>
      </div>
      {right}
    </div>
  );
}

function Chip({ icon: Icon, children }: { icon: typeof Zap; children: React.ReactNode }) {
  return (
    <span className="mb-[6px] inline-flex items-center gap-[4px] rounded-[6px] bg-[#ffe500] px-[9px] py-[3px] font-ui text-[11px] font-bold tracking-[0.8px] text-[#1f1300]">
      <Icon aria-hidden="true" className="size-[12px]" /> {children}
    </span>
  );
}

/* ------------------------------------------------------ handpicked for you */

export function DeskRailPanels({ rails }: { rails: ProductRailSlider[] }) {
  const panels = rails.filter((r) => r.products.length > 0);
  const [active, setActive] = useState(0);
  const row = useRow();
  // A new collection starts at its first product.
  useEffect(() => {
    row.ref.current?.scrollTo({ left: 0 });
    row.onScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  const rail = panels[active] ?? panels[0];
  if (!rail) return null;
  const t = RAIL_THEME[rail.key] ?? RAIL_THEME.explore;
  const Icon = t.icon;
  const href = `/shop?orderby=${RAIL_SORT[rail.key] ?? 'date'}`;
  return (
    <section aria-label="Handpicked for you" className={`${DESK} mt-[48px]`}>
      <Head title="Handpicked for you" sub="Deals, trends and picks chosen for you" />
      <div className="flex gap-[20px]">
        {/* Collections: the app's five panels as a vertical picker, each in its own colour. */}
        <div role="tablist" aria-label="Collections" aria-orientation="vertical" className="flex w-[290px] shrink-0 flex-col gap-[10px] self-stretch">
          {panels.map((r, i) => {
            const rt = RAIL_THEME[r.key] ?? RAIL_THEME.explore;
            const RIcon = rt.icon;
            const on = i === active;
            return (
              <button
                key={r.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                style={on ? { backgroundImage: rt.gradient } : undefined}
                className={`group relative flex flex-1 items-center gap-[12px] overflow-hidden rounded-[18px] border px-[14px] py-[10px] text-left transition-all duration-200 ${
                  on
                    ? 'border-transparent shadow-[0_10px_22px_rgba(15,23,42,0.2)]'
                    : 'border-brand-popup-border bg-white hover:border-brand hover:shadow-[0_6px_16px_rgba(1,66,170,0.12)]'
                }`}
              >
                {on ? <span aria-hidden="true" className="pointer-events-none absolute -right-[30px] -top-[40px] size-[110px] rounded-full bg-white/10" /> : null}
                <span
                  style={on ? undefined : { backgroundImage: rt.gradient }}
                  className={`relative flex size-[44px] shrink-0 items-center justify-center rounded-[14px] ${on ? 'border border-white/25 bg-white/[0.18]' : ''}`}
                >
                  <RIcon aria-hidden="true" className="size-[21px] text-white" />
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className={`block truncate font-ui text-[15.5px] font-bold ${on ? 'text-white' : 'text-heading'}`}>{r.heading}</span>
                  <span className={`block truncate font-ui text-[12.5px] font-medium ${on ? 'text-white/80' : 'text-ink-muted'}`}>{rt.tagline}</span>
                </span>
                <ChevronRight aria-hidden="true" className={`relative size-[18px] shrink-0 transition-transform group-hover:translate-x-[2px] ${on ? 'text-white' : 'text-brand'}`} />
              </button>
            );
          })}
        </div>

        {/* The picked collection: a gradient banner, then its products five at a time. */}
        <div role="tabpanel" aria-label={rail.heading} className="min-w-0 flex-1 overflow-hidden rounded-[26px] border border-brand-popup-border bg-white shadow-[0_10px_30px_rgba(1,66,170,0.1)]">
          <div style={{ backgroundImage: t.gradient }} className="relative flex items-center gap-[16px] overflow-hidden px-[24px] py-[18px]">
            <span aria-hidden="true" className="pointer-events-none absolute -right-[40px] -top-[90px] size-[240px] rounded-full bg-white/[0.09]" />
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-[80px] right-[220px] size-[160px] rounded-full bg-white/[0.07]" />
            <span className="relative flex size-[52px] shrink-0 items-center justify-center rounded-[16px] border border-white/25 bg-white/[0.18]">
              <Icon aria-hidden="true" className="size-[26px] text-white" />
            </span>
            <div className="relative min-w-0">
              <h3 className="truncate font-ui text-[24px] font-bold leading-[30px] text-white">{rail.heading}</h3>
              <p className="font-ui text-[14px] font-medium text-white/80">{t.tagline}</p>
            </div>
            {rail.badge ? (
              <span className="relative ml-[8px] shrink-0 rounded-[10px] bg-[#ffe500] px-[12px] py-[5px] font-ui text-[13px] font-bold text-[#1f1300]">{rail.badge}</span>
            ) : null}
            <div className="relative ml-auto flex shrink-0 items-center gap-[12px]">
              <Arrows edges={row.edges} page={row.page} tone="dark" />
              <Link href={href} className="flex h-[40px] items-center gap-[4px] rounded-full bg-white pl-[18px] pr-[12px] font-ui text-[14px] font-bold text-heading transition-transform hover:scale-[1.04]">
                View all <ChevronRight aria-hidden="true" className="size-[16px]" />
              </Link>
            </div>
          </div>
          <div ref={row.ref} onScroll={row.onScroll} className={`${ROW} gap-[16px] p-[20px]`}>
            {rail.products.map((p) => (
              <div key={p.id} className="w-[calc((100%-64px)/5)] min-w-[190px] shrink-0 snap-start">
                <MiniProductCard product={p} size="desktop" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ refer & earn */

const REFER_STEPS = [
  { icon: Share2, title: 'Share your code', text: 'Send it to friends and family' },
  { icon: ShoppingBag, title: 'They order ₹500+', text: 'On any order, any category' },
  { icon: Wallet, title: 'You earn 2.5%', text: 'Credited to your wallet after delivery' },
];

export function DeskReferBanner() {
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

  return (
    <section className={`${DESK} mt-[48px]`}>
      <div className="relative flex items-center gap-[40px] overflow-hidden rounded-[32px] bg-[#3a22c4] px-[48px] py-[40px] shadow-[0_18px_40px_rgba(42,26,143,0.35)]">
        <span aria-hidden="true" className="absolute -right-[120px] -top-[160px] size-[420px] rounded-full bg-[#5a3cf0]" />
        <span aria-hidden="true" className="absolute -bottom-[180px] -left-[100px] size-[320px] rounded-full bg-[#2c1a9e]" />
        <span aria-hidden="true" className="absolute -bottom-[90px] right-[260px] size-[180px] rounded-full bg-[#ff7a59]/35" />
        <div className="relative z-[1] flex max-w-[520px] flex-col gap-[12px]">
          <span className="flex items-center gap-[5px] self-start rounded-[7px] px-[11px] py-[4px] font-ui text-[12px] font-bold tracking-[1px]" style={{ background: GOLD, color: INK }}>
            <Sparkles aria-hidden="true" className="size-[13px]" /> REFER &amp; EARN
          </span>
          <p className="font-ui text-[36px] font-bold leading-[44px] text-white">
            Invite friends, earn <span style={{ color: GOLD }}>2.5%</span> on their orders
          </p>
          <p className="font-ui text-[15px] font-medium text-white/80">On every order of ₹500+ · credited to your wallet after delivery</p>
          <div className="mt-[8px] flex flex-wrap items-center gap-[12px]">
            {code ? (
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1600);
                }}
                className="flex items-center gap-[8px] rounded-[14px] border-[1.5px] border-dashed border-white/55 bg-white/10 px-[14px] py-[10px] transition-colors hover:bg-white/20"
              >
                <span className="font-ui text-[11px] font-bold tracking-[1px] text-white/70">CODE</span>
                <span className="font-ui text-[17px] font-bold tracking-[1.4px] text-white">{code}</span>
                {copied ? <Check aria-hidden="true" className="size-[17px] text-[#86efac]" /> : <Copy aria-hidden="true" className="size-[17px] text-white" />}
              </button>
            ) : null}
            <Link href={ROUTES.refer} className="flex items-center gap-[6px] rounded-[14px] bg-white px-[22px] py-[12px] font-ui text-[15px] font-bold transition-transform hover:scale-[1.03]" style={{ color: INK }}>
              {code ? 'Invite now' : 'Invite & earn'} <ArrowRight aria-hidden="true" className="size-[17px]" />
            </Link>
          </div>
        </div>
        <div className="relative z-[1] ml-auto flex items-stretch gap-[14px]">
          {REFER_STEPS.map((s, i) => (
            <div key={s.title} className="flex w-[170px] flex-col gap-[8px] rounded-[20px] border border-white/15 bg-white/10 p-[16px] backdrop-blur-sm">
              <span className="flex items-center justify-between">
                <span className="flex size-[40px] items-center justify-center rounded-[12px]" style={{ background: GOLD }}>
                  <s.icon aria-hidden="true" className="size-[20px]" style={{ color: INK }} />
                </span>
                <span className="font-ui text-[28px] font-bold text-white/25">0{i + 1}</span>
              </span>
              <span className="font-ui text-[15px] font-bold text-white">{s.title}</span>
              <span className="text-[12.5px] leading-[17px] text-white/75">{s.text}</span>
            </div>
          ))}
        </div>
        <span aria-hidden="true" className="absolute right-[28px] top-[22px] z-[1] flex size-[44px] -rotate-[8deg] items-center justify-center rounded-full shadow-[0_6px_10px_rgba(0,0,0,0.25)]" style={{ background: GOLD }}>
          <Gift className="size-[24px]" style={{ color: INK }} />
        </span>
      </div>
    </section>
  );
}

/* ------------------------------------------------------ top brands, big offers */

export function DeskBrandOffers() {
  const row = useRow();
  return (
    <section className="mt-[56px] bg-gradient-to-b from-[rgba(1,66,170,0.08)] via-[rgba(124,58,237,0.05)] to-transparent pb-[12px] pt-[32px]">
      <div className={DESK}>
        <Head
          chip={<Chip icon={Zap}>BRAND FEST</Chip>}
          title={
            <>
              Top Brands, <span className="text-brand">Big Offers</span>
            </>
          }
          sub="Biggest discounts first · pick a brand to shop"
          right={<Arrows edges={row.edges} page={row.page} />}
        />
        <div ref={row.ref} onScroll={row.onScroll} className={`${ROW} px-[10px] pb-[22px] pt-[12px]`}>
          {BRAND_OFFERS.map((b) => (
            <Link key={b.id} href={b.href} className="group relative w-[216px] shrink-0 snap-start" aria-label={`${b.name}, ${b.badge.join(' ')}`}>
              <span className="block rounded-[28px] bg-[linear-gradient(135deg,#2f6ae8_0%,#7c3aed_50%,#ffe500_100%)] p-[2.5px] shadow-[0_10px_20px_rgba(1,66,170,0.22)] transition-transform duration-300 group-hover:-translate-y-[4px]">
                <span className="relative block aspect-square overflow-hidden rounded-[26px] bg-white">
                  <Image src={b.poster} alt="" fill sizes="216px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-b from-transparent to-black/45" />
                  <span className="absolute left-[10px] top-[10px] max-w-[180px] truncate rounded-[7px] border border-white/25 bg-[rgba(11,27,63,0.55)] px-[10px] py-[4px] font-ui text-[12px] font-bold tracking-[0.3px] text-white">
                    {b.name}
                  </span>
                  <span className="absolute bottom-[12px] right-[12px] flex items-center gap-[6px] rounded-[12px] bg-white py-[4px] pl-[12px] pr-[4px] font-ui text-[13px] font-bold text-brand shadow">
                    Shop
                    <span className="flex size-[22px] items-center justify-center rounded-full bg-brand">
                      <ArrowRight aria-hidden="true" className="size-[12px] text-white" />
                    </span>
                  </span>
                </span>
              </span>
              <OfferBadge lines={b.badge} className="!-bottom-[10px] !-left-[10px] !size-[76px]" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- shop by brand */

const BRANDS_PER_PAGE = 16;
const BRAND_PAGES: string[][] = [];
for (let i = 0; i < GRID_BRANDS.length; i += BRANDS_PER_PAGE) BRAND_PAGES.push(GRID_BRANDS.slice(i, i + BRANDS_PER_PAGE));

export function DeskBrandGrid() {
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = BRAND_PAGES.length;
  useEffect(() => {
    if (paused || count < 2) return;
    const t = window.setTimeout(() => setPage((p) => (p + 1) % count), 5000);
    return () => window.clearTimeout(t);
  }, [page, paused, count]);
  const go = (d: 1 | -1) => setPage((p) => (p + d + count) % count);
  return (
    <section className="mt-[40px] bg-gradient-to-b from-[rgba(1,66,170,0.09)] via-[rgba(1,66,170,0.03)] to-transparent py-[32px]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className={DESK}>
        <Head
          title="Shop by Brand"
          sub="Trusted names, all in one place"
          right={<Arrows edges={{ start: false, end: false }} page={go} />}
        />
        <div className="overflow-hidden">
          <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${page * 100}%)` }}>
            {BRAND_PAGES.map((brands, p) => (
              <div key={p} className="grid w-full shrink-0 grid-cols-8 gap-[14px] px-[2px] py-[4px]" aria-hidden={p !== page}>
                {brands.map((name) => (
                  <Link
                    key={name}
                    href={`${ROUTES.search}?q=${encodeURIComponent(name)}`}
                    aria-label={`Shop ${name}`}
                    tabIndex={p === page ? 0 : -1}
                    className="flex h-[96px] items-center justify-center rounded-[18px] border border-[#e3e9f3] bg-white shadow-[0_3px_8px_rgba(15,23,42,0.07)] transition-all duration-200 hover:-translate-y-[3px] hover:border-brand hover:shadow-[0_10px_22px_rgba(1,66,170,0.16)]"
                  >
                    <BrandLogo name={name} />
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-[16px] flex items-center justify-center gap-[6px]">
          {BRAND_PAGES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Brands page ${i + 1}`}
              onClick={() => setPage(i)}
              className={`h-[7px] rounded-full transition-all duration-300 ${i === page ? 'w-[22px] bg-brand' : 'w-[7px] bg-card-border'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------- everything you need, in one place */

export function DeskBigBanners() {
  return (
    <section className={`${DESK} mt-[48px]`}>
      <Head
        chip={<Chip icon={Star}>YOUMART</Chip>}
        title={
          <>
            Everything you need, <span className="text-brand">in one place</span>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-[24px]">
        {BIG_BANNERS.map((b) => (
          <Link
            key={b.id}
            href={b.href}
            aria-label={b.label}
            className="group relative block aspect-[2.4] overflow-hidden rounded-[26px] bg-[#e6efff] shadow-[0_12px_24px_rgba(1,66,170,0.2)] ring-[1.5px] ring-inset ring-white/60"
          >
            <Image src={b.image} alt="" fill sizes="(min-width: 1440px) 690px, 48vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- shop our picks */

export function DeskPicks({ showcase }: { showcase: Record<ProductFilter, ProductCardData[]> }) {
  const [tab, setTab] = useState<ProductFilter>('new');
  const items = (showcase[tab] ?? []).slice(0, 18);
  const viewAll = tab === 'new' ? '/shop?orderby=date' : tab === 'sale' ? '/shop?orderby=discount' : '/shop?orderby=rating';
  return (
    <section className={`${DESK} mt-[56px]`}>
      <Head
        title="Shop our picks"
        sub="Fresh arrivals, hot sales & the best offers"
        right={
          <Link href={viewAll} className="flex items-center gap-[4px] rounded-full border border-brand-popup-border bg-white px-[16px] py-[8px] font-ui text-[14px] font-bold text-brand transition-colors hover:bg-brand hover:text-white">
            View all <ChevronRight aria-hidden="true" className="size-[16px]" />
          </Link>
        }
      />
      <div role="tablist" className="mb-[24px] grid grid-cols-3 gap-[16px]">
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
              className={`relative flex h-[120px] items-center gap-[18px] overflow-hidden rounded-[22px] border-[3px] px-[24px] text-left transition-all duration-300 ${on ? '-translate-y-[3px] opacity-100 shadow-[0_14px_26px_rgba(15,23,42,0.22)]' : 'opacity-[0.75] hover:opacity-95'}`}
            >
              <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0)_45%,rgba(0,0,0,0.1)_100%)]" />
              <Icon aria-hidden="true" className="absolute -bottom-[22px] -right-[12px] size-[110px] opacity-[0.14]" style={{ color: p.ink }} />
              <span className="relative flex size-[52px] shrink-0 items-center justify-center rounded-[16px] border border-white/30 bg-white/[0.22]">
                <Icon aria-hidden="true" className="size-[26px]" style={{ color: p.ink }} />
              </span>
              <span className="relative">
                <span className="block font-ui text-[22px] font-bold leading-[24px] tracking-[0.5px]" style={{ color: p.leadTone }}>
                  {p.lead.toUpperCase()} <span style={{ color: p.wordTone }}>{p.word.toUpperCase()}</span>
                </span>
                <span className="mt-[4px] block text-[14px] opacity-85" style={{ color: p.ink }}>
                  {p.note}
                </span>
              </span>
              {on ? (
                <span className="absolute right-[14px] top-[14px] flex size-[24px] items-center justify-center rounded-full bg-white">
                  <Check aria-hidden="true" className="size-[14px] text-heading" strokeWidth={3} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-6 gap-[16px]">
        {items.map((p) => (
          <MiniProductCard key={p.id} product={p} size="desktop" />
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- trust strip */

export function DeskFeatureStrip() {
  return (
    <section className={`${DESK} mt-[56px] grid grid-cols-3 gap-[20px]`}>
      {FEATURE_CARDS.map((c) => {
        const t = FEATURE_TONE[c.id];
        const Icon = FEATURE_ICON[c.id];
        return (
          <div key={c.id} className="relative flex items-center gap-[18px] overflow-hidden rounded-[22px] px-[24px] py-[22px]" style={{ background: t.bg, color: t.ink }}>
            <Icon aria-hidden="true" className="absolute -bottom-[20px] -right-[10px] size-[96px] opacity-[0.1]" />
            <span className="flex size-[56px] shrink-0 items-center justify-center rounded-[16px]" style={{ background: t.chip }}>
              <Icon aria-hidden="true" className="size-[26px]" />
            </span>
            <span>
              <span className="block font-ui text-[19px] font-bold">{c.title}</span>
              <span className="block text-[14px] leading-[19px] opacity-90">{FEATURE_SHORT[c.id]}</span>
            </span>
          </div>
        );
      })}
    </section>
  );
}
