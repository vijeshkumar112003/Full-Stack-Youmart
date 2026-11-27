'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  CircleCheck,
  CircleX,
  Clock,
  Flag,
  Hourglass,
  Image as ImageIcon,
  Images,
  Info,
  Megaphone,
  MinusCircle,
  PlayCircle,
  Plus,
  Radio,
  Rocket,
  ShieldCheck,
  TriangleAlert,
  Video,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES, formatMoney, type AdKind, type AdState, type AdView, type Money } from '@youmart/shared-client';
import { api } from '@/lib/api';
import { adUrl } from '@/lib/ads';
import { Skeleton, dateTime } from './ui';

// DESKTOP (>= 1025px) "Advertise on YouMart" in the app's design (apps/mobile/src/app/ads/index.tsx):
// the purple-to-orange hero with the price card, the two formats, how it works, and the
// advertiser's ads as cards with their state, dates, price and Pay / Cancel.

const PRICE_FALLBACK: Money = '1000.00';
const ORANGE = '#f97316';

const STATE: Record<AdState, { label: string; fg: string; bg: string; Icon: LucideIcon }> = {
  IN_REVIEW: { label: 'In review', fg: '#b45309', bg: '#fef3c7', Icon: Clock },
  AWAITING_PAYMENT: { label: 'Approved · pay to book', fg: '#1d4ed8', bg: '#dbeafe', Icon: CircleCheck },
  SCHEDULED: { label: 'Scheduled', fg: '#6d28d9', bg: '#ede9fe', Icon: CalendarDays },
  LIVE: { label: 'Live now', fg: '#047857', bg: '#d1fae5', Icon: Radio },
  ENDED: { label: 'Ended', fg: '#475569', bg: '#e2e8f0', Icon: Flag },
  REJECTED: { label: 'Not approved', fg: '#b91c1c', bg: '#fee2e2', Icon: CircleX },
  EXPIRED: { label: 'Expired · not paid', fg: '#475569', bg: '#e2e8f0', Icon: Hourglass },
  CANCELLED: { label: 'Cancelled', fg: '#475569', bg: '#e2e8f0', Icon: MinusCircle },
  REMOVED: { label: 'Taken down', fg: '#b91c1c', bg: '#fee2e2', Icon: TriangleAlert },
};

const STEPS: { Icon: LucideIcon; title: string; text: string }[] = [
  { Icon: Images, title: 'Create', text: 'Upload up to 5 photos or one video, a headline and a link' },
  { Icon: ShieldCheck, title: 'Review', text: 'Our team checks it - usually within a few hours' },
  { Icon: Wallet, title: 'Pay', text: 'Only after approval, from your YouMart Wallet' },
  { Icon: Rocket, title: 'Go live', text: 'Shown to every shopper on the app and the website' },
];

const rupees = (m: Money) => formatMoney(m).replace(/\.00$/, '');

export function DeskAds({
  ads,
  busy,
  message,
  onPay,
  onCancel,
}: {
  ads: AdView[] | null;
  busy: string | null;
  message: React.ReactNode;
  onPay: (ad: AdView) => void;
  onCancel: (ad: AdView) => void;
}) {
  const [price, setPrice] = useState<Record<AdKind, Money>>({ IMAGE: PRICE_FALLBACK, VIDEO: PRICE_FALLBACK });
  useEffect(() => {
    for (const kind of ['IMAGE', 'VIDEO'] as const) {
      api.ads
        .availability(kind)
        .then((a) => setPrice((p) => ({ ...p, [kind]: a.pricePerDay })))
        .catch(() => undefined);
    }
  }, []);
  const from = Number(price.IMAGE) <= Number(price.VIDEO) ? price.IMAGE : price.VIDEO;
  const count = (states: AdState[]) => (ads ?? []).filter((a) => states.includes(a.state)).length;
  const stats = [
    { label: 'Live now', value: count(['LIVE']), fg: '#047857', bg: '#d1fae5', Icon: Radio },
    { label: 'Scheduled', value: count(['SCHEDULED']), fg: '#6d28d9', bg: '#ede9fe', Icon: CalendarDays },
    { label: 'In review', value: count(['IN_REVIEW']), fg: '#b45309', bg: '#fef3c7', Icon: Clock },
    { label: 'Waiting for payment', value: count(['AWAITING_PAYMENT']), fg: '#1d4ed8', bg: '#dbeafe', Icon: Wallet },
  ];

  return (
    <div className="font-ui">
      <h1 className="sr-only">Advertise on YouMart</h1>
      <section className="relative mb-[18px] overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#1a0b3d_0%,#3b1a8f_55%,#c2410c_130%)] px-[32px] py-[30px] text-white shadow-[0_18px_40px_rgba(59,26,143,0.3)]">
        <span aria-hidden="true" className="absolute -right-[80px] -top-[70px] size-[280px] rounded-full bg-[rgba(249,115,22,0.22)] blur-[2px]" />
        <Megaphone aria-hidden="true" className="absolute bottom-[-26px] right-[330px] size-[150px] rotate-[-12deg] text-white/[0.06]" />
        <div className="relative flex items-center gap-[32px]">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-[6px] rounded-full bg-white/10 px-[12px] py-[5px] text-[12px] font-bold tracking-[0.12em]">
              <Megaphone aria-hidden="true" className="size-[13px]" style={{ color: ORANGE }} /> YOUMART ADS
            </span>
            <p className="mt-[14px] text-[36px] font-bold leading-[1.15]">
              Put your brand in front of
              <br />
              <span className="text-[#fdba74]">every shopper.</span>
            </p>
            <p className="mt-[10px] max-w-[560px] text-[15.5px] leading-[1.6] text-white/80">
              A photo carousel on the Home screen, or your video in the floating player - for whole days at a time,
              on the app and the website.
            </p>
          </div>
          <div className="w-[320px] shrink-0 rounded-[22px] bg-white/10 p-[20px] ring-1 ring-white/15 backdrop-blur">
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-white/70">From</p>
            <p className="mt-[2px] text-[34px] font-bold leading-none">
              {rupees(from)}
              <span className="text-[15px] font-semibold text-white/70"> / 24 hours</span>
            </p>
            <p className="mt-[8px] flex items-center gap-[6px] text-[13px] text-white/80">
              <CircleCheck aria-hidden="true" className="size-[14px] text-[#86efac]" /> Pay only after we approve it
            </p>
            <Link
              href={ROUTES.adsNew}
              className="mt-[16px] flex h-[50px] items-center justify-center gap-[8px] rounded-[16px] text-[16px] font-bold text-[#1f1300] shadow-[0_10px_20px_rgba(255,214,10,0.3)] transition-[filter] hover:brightness-95"
              style={{ background: '#ffd60a' }}
            >
              <Plus aria-hidden="true" className="size-[18px]" /> Create an ad
            </Link>
          </div>
        </div>
      </section>

      {message}

      <div className="mb-[18px] grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] gap-[16px]">
        <section aria-labelledby="ads-formats" className="rounded-[24px] border border-brand-popup-border bg-white p-[20px] shadow-rail-card">
          <h2 id="ads-formats" className="mb-[14px] text-[12.5px] font-bold uppercase tracking-[1px] text-ink-muted">
            Two formats
          </h2>
          <ul className="flex flex-col gap-[10px]">
            {[
              { Icon: Images, fg: '#c2410c', bg: '#ffedd5', title: 'Photo carousel', text: 'Up to 5 photos in Home’s Sponsored slot', kind: 'IMAGE' as const },
              { Icon: PlayCircle, fg: '#6d28d9', bg: '#ede9fe', title: 'Video', text: 'Plays on loop in Home’s floating player', kind: 'VIDEO' as const },
            ].map(({ Icon, fg, bg, title, text, kind }) => (
              <li key={title} className="flex items-center gap-[14px] rounded-[16px] bg-[#f8f7fd] p-[14px]">
                <span className="flex size-[46px] shrink-0 items-center justify-center rounded-[14px]" style={{ background: bg, color: fg }}>
                  <Icon aria-hidden="true" className="size-[22px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15.5px] font-bold text-heading">{title}</span>
                  <span className="block text-[13px] text-ink-muted">{text}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[16px] font-bold text-heading">{rupees(price[kind])}</span>
                  <span className="block text-[11.5px] text-ink-muted">per day</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="ads-how" className="rounded-[24px] border border-brand-popup-border bg-white p-[20px] shadow-rail-card">
          <h2 id="ads-how" className="mb-[14px] text-[12.5px] font-bold uppercase tracking-[1px] text-ink-muted">
            How it works
          </h2>
          <ol className="relative grid grid-cols-4 gap-[12px]">
            <span aria-hidden="true" className="absolute left-[12%] right-[12%] top-[21px] h-[2px] rounded-full bg-[linear-gradient(90deg,#3b1a8f,#f97316)]" />
            {STEPS.map(({ Icon, title, text }, i) => (
              <li key={title} className="relative text-center">
                <span className="mx-auto flex size-[44px] items-center justify-center rounded-full bg-[#ede9fe] text-[#3b1a8f] shadow-[0_0_0_5px_#ffffff]">
                  <Icon aria-hidden="true" className="size-[19px]" />
                </span>
                <p className="mt-[8px] text-[14.5px] font-bold text-heading">
                  {i + 1}. {title}
                </p>
                <p className="mt-[2px] text-[12.5px] leading-[17px] text-ink-muted">{text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-[14px] flex items-center gap-[8px] rounded-[12px] bg-[#f8f7fd] px-[12px] py-[8px] text-[13px] text-heading">
            <Info aria-hidden="true" className="size-[15px] shrink-0 text-[#6d28d9]" />
            One ad of each format runs at a time, so yours is never sharing the spot.
          </p>
        </section>
      </div>

      <section aria-labelledby="ads-mine" className="rounded-[24px] border border-brand-popup-border bg-white p-[22px] shadow-rail-card">
        <div className="mb-[16px] flex items-center justify-between">
          <h2 id="ads-mine" className="text-[19px] font-bold text-heading">
            My ads{ads && ads.length > 0 ? ` (${ads.length})` : ''}
          </h2>
          <Link
            href={ROUTES.adsNew}
            className="inline-flex items-center gap-[6px] rounded-full bg-[#3b1a8f] px-[16px] py-[8px] text-[14px] font-bold text-white transition-colors hover:bg-[#2e1470]"
          >
            <Plus aria-hidden="true" className="size-[16px]" /> Create an ad
          </Link>
        </div>

        {ads && ads.length > 0 ? (
          <ul className="mb-[16px] grid grid-cols-4 gap-[10px]">
            {stats.map(({ label, value, fg, bg, Icon }) => (
              <li key={label} className="flex items-center gap-[12px] rounded-[16px] border border-brand-popup-border px-[14px] py-[10px]">
                <span className="flex size-[38px] items-center justify-center rounded-[12px]" style={{ background: bg, color: fg }}>
                  <Icon aria-hidden="true" className="size-[18px]" />
                </span>
                <span>
                  <span className="block text-[20px] font-bold leading-none text-heading">{value}</span>
                  <span className="block text-[12.5px] text-ink-muted">{label}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {ads === null ? (
          <div className="grid grid-cols-2 gap-[14px]">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-[200px] w-full" />
            ))}
          </div>
        ) : ads.length === 0 ? (
          <div className="flex flex-col items-center rounded-[20px] bg-[#f8f7fd] py-[44px] text-center">
            <span className="flex size-[66px] items-center justify-center rounded-full bg-[#ede9fe] text-[#6d28d9]">
              <Rocket aria-hidden="true" className="size-[30px]" />
            </span>
            <p className="mt-[12px] text-[18px] font-bold text-heading">No ads yet</p>
            <p className="mt-[4px] max-w-[440px] text-[14px] text-ink-muted">
              Photo carousels show on the home page; videos play in the floating window. You only pay after we approve it.
            </p>
            <Link
              href={ROUTES.adsNew}
              className="mt-[16px] inline-flex h-[46px] items-center gap-[8px] rounded-[14px] bg-[#3b1a8f] px-[22px] text-[15px] font-bold text-white hover:bg-[#2e1470]"
            >
              <Megaphone aria-hidden="true" className="size-[17px]" /> Create your first ad
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-[14px]">
            {ads.map((ad) => {
              const st = STATE[ad.state];
              const thumb = ad.media[0];
              const open = ad.state === 'AWAITING_PAYMENT' || ad.state === 'IN_REVIEW';
              return (
                <li key={ad.adId} className="flex flex-col rounded-[20px] border border-brand-popup-border bg-white p-[14px] transition-shadow hover:shadow-product-card">
                  <div className="flex gap-[14px]">
                    <span className="relative flex h-[96px] w-[150px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-[#1a0b3d]">
                      {thumb && ad.kind === 'IMAGE' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={adUrl(thumb)} alt="" className="size-full object-cover" />
                      ) : thumb ? (
                        <video src={adUrl(thumb)} muted className="size-full object-cover" />
                      ) : (
                        <PlayCircle aria-hidden="true" className="size-[30px] text-white" />
                      )}
                      <span className="absolute left-[6px] top-[6px] inline-flex items-center gap-[4px] rounded-full bg-black/60 px-[7px] py-[1px] text-[10.5px] font-semibold text-white">
                        {ad.kind === 'IMAGE' ? <ImageIcon aria-hidden="true" className="size-[11px]" /> : <Video aria-hidden="true" className="size-[11px]" />}
                        {ad.kind === 'IMAGE' ? `${ad.media.length} photo${ad.media.length === 1 ? '' : 's'}` : 'Video'}
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex items-center gap-[4px] rounded-full px-[9px] py-[2px] text-[12px] font-bold" style={{ background: st.bg, color: st.fg }}>
                        <st.Icon aria-hidden="true" className="size-[12px]" /> {st.label}
                      </span>
                      <p className="mt-[5px] truncate text-[16px] font-bold text-heading">{ad.headline}</p>
                      <p className="truncate text-[13px] text-ink-muted">
                        {ad.advertiserName} · {ad.referenceCode}
                      </p>
                    </div>
                  </div>
                  <div className="mt-[12px] flex items-center gap-[8px] rounded-[12px] bg-[#f8f7fd] px-[12px] py-[8px] text-[13px] text-heading">
                    <CalendarDays aria-hidden="true" className="size-[15px] shrink-0 text-ink-muted" />
                    <span className="min-w-0 flex-1 truncate">
                      {dateTime(ad.startsAt)} → {dateTime(ad.endsAt)}
                    </span>
                  </div>
                  <div className="mt-[10px] flex items-baseline justify-between">
                    <span className="text-[13px] text-ink-muted">
                      {ad.days} {ad.days === 1 ? 'day' : 'days'} × {rupees(ad.pricePerDay)}
                    </span>
                    <span className="text-[18px] font-bold text-heading">{formatMoney(ad.amount)}</span>
                  </div>
                  {ad.state === 'REJECTED' || ad.state === 'REMOVED' ? (
                    <p className="mt-[10px] flex items-start gap-[6px] rounded-[12px] bg-[#fee2e2] px-[12px] py-[8px] text-[13px] text-[#991b1b]">
                      <Info aria-hidden="true" className="mt-[2px] size-[14px] shrink-0" />
                      {ad.rejectReason ?? 'No reason given.'}
                    </p>
                  ) : ad.state === 'IN_REVIEW' ? (
                    <p className="mt-[10px] text-[13px] text-ink-muted">We&rsquo;ll review it soon. You pay only after it&rsquo;s approved.</p>
                  ) : ad.state === 'AWAITING_PAYMENT' ? (
                    <p className="mt-[10px] text-[13px] font-semibold text-[#1d4ed8]">Approved! Pay before {dateTime(ad.startsAt)} to book your slot.</p>
                  ) : null}
                  {open ? (
                    <div className="mt-auto flex gap-[10px] pt-[12px]">
                      <button
                        type="button"
                        onClick={() => onCancel(ad)}
                        disabled={busy !== null}
                        className="h-[42px] flex-1 rounded-[12px] border border-brand-popup-border text-[14px] font-bold text-heading transition-colors hover:border-woo-error hover:text-woo-error disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      {ad.state === 'AWAITING_PAYMENT' ? (
                        <button
                          type="button"
                          onClick={() => onPay(ad)}
                          disabled={busy !== null}
                          className="flex h-[42px] flex-[2] items-center justify-center gap-[6px] rounded-[12px] bg-brand text-[14px] font-bold text-white shadow-[0_8px_16px_rgba(1,66,170,0.28)] hover:bg-[#013a96] disabled:opacity-60"
                        >
                          <Wallet aria-hidden="true" className="size-[15px]" /> Pay {formatMoney(ad.amount)}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
