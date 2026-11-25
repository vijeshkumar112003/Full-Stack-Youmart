'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlarmClock,
  ArrowRight,
  Bell,
  Bookmark,
  Box,
  ChevronRight,
  CircleHelp,
  Clock,
  FileText,
  Gift,
  Headset,
  Info,
  LifeBuoy,
  Lock,
  LogOut,
  MapPin,
  Megaphone,
  Navigation,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  Tags,
  Undo2,
  User,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES, authUserLabel, formatMoney, formatPhone, loginHref } from '@youmart/shared-client';
import { api } from '@/lib/api';
import { logout, useSession } from '@/lib/session';

// The app's Account tab (apps/mobile/src/app/(tabs)/account.tsx) for phones: blue header with the
// profile, the wallet (or a sign-in card) floating over it, quick tiles, Sell / Advertise, and the
// grouped menu rows.

const TINT = {
  blue: { bg: '#e8f0fe', fg: '#0142aa' },
  green: { bg: '#e7f6ee', fg: '#1e8e4f' },
  amber: { bg: '#fff4e0', fg: '#c77700' },
  rose: { bg: '#fdecef', fg: '#d6335b' },
  violet: { bg: '#f1ebfd', fg: '#6d3fd0' },
  teal: { bg: '#e3f6f6', fg: '#13878a' },
  slate: { bg: '#eef1f5', fg: '#4a5568' },
} as const;
type Tint = keyof typeof TINT;

interface Item {
  icon: LucideIcon;
  label: string;
  tint: Tint;
  href: string;
  auth?: boolean;
}

const REMINDERS: Item[] = [
  { icon: AlarmClock, label: 'Remind me to buy', tint: 'amber', href: ROUTES.reminders, auth: true },
  { icon: Bell, label: 'Alerts', tint: 'blue', href: ROUTES.notifications, auth: true },
  { icon: SlidersHorizontal, label: 'Notification settings', tint: 'violet', href: ROUTES.orderNotifications, auth: true },
];
const ACTIVITY: Item[] = [
  { icon: Gift, label: 'Refer & Earn', tint: 'violet', href: ROUTES.refer },
  { icon: Navigation, label: 'Track an order', tint: 'blue', href: ROUTES.trackOrder },
  { icon: MapPin, label: 'Saved addresses', tint: 'teal', href: ROUTES.addresses, auth: true },
  { icon: ShoppingCart, label: 'My cart', tint: 'amber', href: ROUTES.cart },
  { icon: Undo2, label: 'Returns & refunds', tint: 'green', href: ROUTES.returns, auth: true },
  { icon: Clock, label: 'Recently viewed', tint: 'violet', href: ROUTES.recentlyViewed },
  { icon: Star, label: 'My reviews', tint: 'amber', href: ROUTES.myReviews, auth: true },
];
const SETTINGS: Item[] = [
  { icon: User, label: 'Account details', tint: 'violet', href: ROUTES.accountDetails, auth: true },
  { icon: ShieldCheck, label: 'Privacy & account', tint: 'green', href: ROUTES.privacy, auth: true },
];
const INFO: Item[] = [
  { icon: Info, label: 'About YouMart', tint: 'blue', href: '/about' },
  { icon: Phone, label: 'Contact us', tint: 'teal', href: ROUTES.contact },
  { icon: Headset, label: 'Customer care', tint: 'violet', href: ROUTES.customerCare },
  { icon: CircleHelp, label: 'FAQ', tint: 'amber', href: '/faq' },
  { icon: Box, label: 'Shipping details', tint: 'slate', href: '/shipping' },
  { icon: RefreshCw, label: 'Refund policy', tint: 'green', href: '/refund-policy' },
  { icon: FileText, label: 'Terms & conditions', tint: 'slate', href: '/terms' },
  { icon: Lock, label: 'Privacy policy', tint: 'rose', href: '/privacy-policy' },
];
const QUICK: (Item & { sub: string })[] = [
  { icon: ShoppingBag, label: 'Orders', sub: 'Track & manage', tint: 'blue', href: ROUTES.orders, auth: true },
  { icon: Bookmark, label: 'Favourites', sub: 'Saved items', tint: 'rose', href: ROUTES.wishlist },
  { icon: Tags, label: 'Coupons', sub: 'Offers for you', tint: 'green', href: ROUTES.coupons },
  { icon: LifeBuoy, label: 'Help', sub: '24×7 support', tint: 'violet', href: ROUTES.help },
];

const SIGN_IN = loginHref(ROUTES.account);

export function AppAccount() {
  const session = useSession();
  const loggedIn = session.status === 'authenticated';
  const user = loggedIn ? session.user : null;
  const label = user ? authUserLabel(user) : 'Hello, Guest';
  const [balance, setBalance] = useState<string | null>(null);
  const [confirmOut, setConfirmOut] = useState(false);

  useEffect(() => {
    if (!loggedIn) return setBalance(null);
    let on = true;
    api.wallet
      .get()
      .then((w) => on && setBalance(w.balance))
      .catch(() => on && setBalance(null));
    return () => {
      on = false;
    };
  }, [loggedIn]);

  const to = (item: { href: string; auth?: boolean }) => (item.auth && !loggedIn ? SIGN_IN : item.href);
  const contact = user?.phone ? formatPhone(user.phone) : (user?.email ?? null);

  return (
    <div className="pb-[28px]">
      <header className="relative overflow-hidden rounded-b-[28px] bg-brand px-[16px] pb-[64px] pt-[20px]">
        <span aria-hidden="true" className="absolute -right-[60px] -top-[90px] size-[220px] rounded-full bg-white/[0.07]" />
        <span aria-hidden="true" className="absolute -bottom-[50px] -left-[40px] size-[140px] rounded-full bg-white/[0.06]" />
        <div className="relative flex items-center gap-[12px]">
          <span className="flex size-[72px] shrink-0 items-center justify-center rounded-full border-2 border-white/85">
            {loggedIn ? (
              <span className="flex size-[68px] items-center justify-center rounded-full bg-white font-ui text-[28px] font-bold text-brand">
                {label.slice(0, 1).toUpperCase()}
              </span>
            ) : (
              <span className="flex size-[68px] items-center justify-center rounded-full bg-white">
                <User aria-hidden="true" className="size-[34px] fill-brand text-brand" />
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-ui text-[22px] font-bold text-white">{label}</p>
            {user?.username ? <p className="truncate font-ui text-[13px] text-white/85">@{user.username}</p> : null}
            <p className="truncate text-[13.5px] text-white/80">{loggedIn ? contact : 'Sign in to see orders, wallet & more'}</p>
          </div>
          {loggedIn ? (
            <Link href={ROUTES.accountDetails} className="flex items-center gap-[4px] rounded-full bg-white/[0.18] px-[12px] py-[6px] font-ui text-[13px] font-semibold text-white">
              <Pencil aria-hidden="true" className="size-[13px]" /> Edit
            </Link>
          ) : null}
        </div>
      </header>

      <div className="relative -mt-[48px] px-[16px]">
        {loggedIn ? (
          <Link href={ROUTES.wallet} className="flex items-center gap-[12px] rounded-[20px] bg-white p-[16px] shadow-[0_8px_20px_rgba(1,66,170,0.15)]">
            <span className="flex size-[44px] items-center justify-center rounded-[14px] bg-brand">
              <Wallet aria-hidden="true" className="size-[22px] text-white" />
            </span>
            <span className="flex-1">
              <span className="block font-ui text-[13px] text-ink-muted">YouMart Wallet</span>
              <span className="block font-ui text-[20px] font-bold text-heading">{balance ? formatMoney(balance) : '—'}</span>
            </span>
            <span className="flex items-center gap-[2px] rounded-full bg-brand-popup-bg px-[12px] py-[7px] font-ui text-[13px] font-semibold text-brand">
              <Plus aria-hidden="true" className="size-[15px]" /> Add money
            </span>
          </Link>
        ) : (
          <div className="rounded-[20px] bg-white p-[18px] shadow-[0_8px_20px_rgba(1,66,170,0.15)]">
            <p className="font-ui text-[18px] font-bold text-heading">Welcome to YouMart</p>
            <p className="mt-[4px] text-[14px] leading-[20px] text-ink-muted">
              Sign in for order tracking, instant wallet refunds and faster checkout.
            </p>
            <Link href={SIGN_IN} className="mt-[14px] flex h-[46px] items-center justify-center gap-[6px] rounded-[12px] bg-brand font-ui text-[16px] font-bold text-white">
              Sign in / Sign up <ArrowRight aria-hidden="true" className="size-[16px]" />
            </Link>
          </div>
        )}
      </div>

      <div className="mt-[14px] grid grid-cols-4 gap-[8px] px-[16px]">
        {QUICK.map((q) => (
          <Link key={q.label} href={to(q)} className="flex flex-col items-center gap-[4px] rounded-[16px] bg-white px-[4px] py-[12px] text-center active:scale-[0.97]">
            <span className="flex size-[44px] items-center justify-center rounded-[14px]" style={{ background: TINT[q.tint].bg }}>
              <q.icon aria-hidden="true" className="size-[22px]" style={{ color: TINT[q.tint].fg }} fill={q.icon === Bookmark ? 'currentColor' : 'none'} />
            </span>
            <span className="font-ui text-[13.5px] font-semibold text-heading">{q.label}</span>
            <span className="w-full truncate text-[11.5px] text-ink-muted">{q.sub}</span>
          </Link>
        ))}
      </div>

      <Link href={ROUTES.sell} className="relative mx-[16px] mt-[14px] flex items-center gap-[12px] overflow-hidden rounded-[18px] bg-brand p-[14px]">
        <span aria-hidden="true" className="absolute -right-[30px] -top-[40px] size-[120px] rounded-full bg-white/[0.07]" />
        <span className="flex size-[44px] shrink-0 items-center justify-center rounded-[12px] border border-white/25 bg-white/10">
          <ShoppingCart aria-hidden="true" className="size-[22px] fill-[#ffd23f] text-[#ffd23f]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-ui text-[16px] font-bold text-white">Sell on YouMart</span>
          <span className="block truncate text-[13px] text-white/75">Take your business online</span>
        </span>
        <span className="flex shrink-0 items-center gap-[5px] rounded-full border border-[#ffd23f]/60 px-[10px] py-[4px] font-ui text-[10.5px] font-bold tracking-[1px] text-[#ffd23f]">
          <span className="size-[6px] rounded-full bg-[#ffd23f]" /> COMING SOON
        </span>
      </Link>

      <Link href={ROUTES.ads} className="mx-[16px] mt-[10px] flex items-center gap-[12px] rounded-[18px] border border-[#fde2cf] bg-white p-[14px]">
        <span className="flex size-[44px] shrink-0 items-center justify-center rounded-[12px] bg-[linear-gradient(135deg,#f97316_0%,#ea580c_100%)]">
          <Megaphone aria-hidden="true" className="size-[22px] text-white" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-ui text-[16px] font-bold text-heading">Advertise on YouMart</span>
          <span className="block truncate text-[13px] text-ink-muted">Photo or video ads · ₹1,000 per day</span>
        </span>
        <span className="rounded-[6px] bg-[#fff1e6] px-[7px] py-[2px] font-ui text-[11px] font-bold tracking-[1px] text-[#c2410c]">NEW</span>
        <ChevronRight aria-hidden="true" className="size-[18px] text-heading" />
      </Link>

      <Section title="Reminders & alerts" items={REMINDERS} to={to} />
      <Section title="My activity" items={ACTIVITY} to={to} />
      {loggedIn ? <Section title="Settings" items={SETTINGS} to={to} /> : null}
      <Section title="Help & information" items={INFO} to={to} />

      {loggedIn ? (
        <button
          type="button"
          onClick={() => setConfirmOut(true)}
          className="mx-[16px] mt-[18px] flex w-[calc(100%-32px)] items-center justify-center gap-[8px] rounded-[16px] bg-white py-[14px] font-ui text-[16px] font-semibold text-[#e11d48]"
        >
          <LogOut aria-hidden="true" className="size-[20px]" /> Log out
        </button>
      ) : null}
      <p className="mt-[18px] text-center text-[13px] text-ink-muted">YouMart · Shop Easy, Live Better</p>

      {confirmOut ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 px-[24px]" role="dialog" aria-modal="true">
          <div className="w-full max-w-[340px] rounded-[20px] bg-white p-[20px] text-center">
            <p className="font-ui text-[18px] font-bold text-heading">Log out?</p>
            <p className="mt-[6px] text-[14px] text-ink-muted">You can sign in again anytime with your mobile number or email.</p>
            <div className="mt-[16px] flex gap-[10px]">
              <button type="button" onClick={() => setConfirmOut(false)} className="h-[44px] flex-1 rounded-[12px] border border-card-border font-ui font-semibold">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmOut(false);
                  void logout();
                }}
                className="h-[44px] flex-1 rounded-[12px] bg-[#e11d48] font-ui font-bold text-white"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Section({ title, items, to }: { title: string; items: Item[]; to: (i: Item) => string }) {
  return (
    <section className="mt-[22px] px-[16px]">
      <h2 className="mb-[8px] pl-[6px] font-ui text-[14px] font-bold uppercase tracking-[1px] text-[#4a5568]">{title}</h2>
      <ul className="overflow-hidden rounded-[20px] bg-white">
        {items.map((it, i) => (
          <li key={it.label} className={i < items.length - 1 ? 'border-b border-[#eef1f5]' : ''}>
            <Link href={to(it)} className="flex items-center gap-[14px] px-[16px] py-[13px] active:bg-[#f5f8ff]">
              <span className="flex size-[40px] items-center justify-center rounded-[12px]" style={{ background: TINT[it.tint].bg }}>
                <it.icon aria-hidden="true" className="size-[19px]" style={{ color: TINT[it.tint].fg }} />
              </span>
              <span className="flex-1 font-ui text-[16px] font-medium text-heading">{it.label}</span>
              <ChevronRight aria-hidden="true" className="size-[18px] text-heading" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
