'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  Bookmark,
  ChevronRight,
  Gift,
  LifeBuoy,
  Mail,
  Megaphone,
  Package,
  PackageCheck,
  Pencil,
  Phone,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Tags,
  Wallet,
} from 'lucide-react';
import { ROUTES, authUserLabel, formatMoney, formatPhone } from '@youmart/shared-client';
import { api } from '@/lib/api';
import { useUnreadCount } from '@/lib/inbox';
import { useSession } from '@/lib/session';
import { useWishlistCount } from '@/lib/wishlist';
import { ACTIVITY, INFO, REMINDERS, SETTINGS, TINT, type Item } from './AppAccount';
import { useOrderList } from './AppOrders';
import { DeskOrderCard } from './DeskOrders';
import { Skeleton } from './ui';

// DESKTOP (>= 1025px) account home in the app's design (apps/mobile/src/app/(tabs)/account.tsx):
// a profile hero with the wallet, live stats, the app's grouped menu as cards, recent orders,
// Sell / Advertise / Refer banners and help & information.

const CARD = 'rounded-[24px] border border-brand-popup-border bg-white shadow-rail-card';

const SUBS: Record<string, string> = {
  'Remind me to buy': 'WhatsApp nudges to buy later',
  Alerts: 'Order, refund and support updates',
  'Notification settings': 'WhatsApp and email choices',
  'Refer & Earn': 'Earn 2.5% on friends’ orders',
  'Track an order': 'No sign-in needed',
  'Saved addresses': 'Home, work and more',
  'My cart': 'Items waiting for you',
  'Returns & refunds': 'Follow every return',
  'Recently viewed': 'Pick up where you left off',
  'My reviews': 'Rate and edit reviews',
  'Account details': 'Name, photo, phone and email',
  'Privacy & account': 'Policies and your data',
};

function MenuCard({ title, items }: { title: string; items: Item[] }) {
  return (
    <section aria-label={title} className={`${CARD} p-[10px]`}>
      <h2 className="px-[12px] pb-[6px] pt-[8px] text-[12.5px] font-bold uppercase tracking-[1px] text-ink-muted">{title}</h2>
      <ul>
        {items.map((item) => {
          const t = TINT[item.tint];
          return (
            <li key={item.label}>
              <Link href={item.href} className="group flex items-center gap-[12px] rounded-[16px] px-[12px] py-[10px] transition-colors hover:bg-brand-popup-bg">
                <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[12px]" style={{ background: t.bg }}>
                  <item.icon aria-hidden="true" className="size-[19px]" style={{ color: t.fg }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-bold text-heading group-hover:text-brand">{item.label}</span>
                  {SUBS[item.label] ? <span className="block truncate text-[12.5px] text-ink-muted">{SUBS[item.label]}</span> : null}
                </span>
                <ChevronRight aria-hidden="true" className="size-[16px] text-ink-muted transition-transform group-hover:translate-x-[2px] group-hover:text-brand" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function DeskAccount() {
  const session = useSession();
  const user = session.status === 'authenticated' ? session.user : null;
  const [balance, setBalance] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [offers, setOffers] = useState<number | null>(null);
  const unread = useUnreadCount();
  const favourites = useWishlistCount();
  const { orders, cards, counts } = useOrderList('all', '');

  useEffect(() => {
    let on = true;
    api.wallet.get().then((w) => on && setBalance(w.available)).catch(() => undefined);
    api.auth.getAvatar().then((r) => on && setAvatar(r.avatar)).catch(() => undefined);
    api.orders.coupons().then((r) => on && setOffers(r.items.length)).catch(() => undefined);
    return () => {
      on = false;
    };
  }, []);

  if (!user) return null;
  const name = user.name?.trim() || authUserLabel(user);
  const first = name.split(/\s+/)[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const recent = (orders ?? []).slice(0, 2);

  const stats = [
    { href: ROUTES.orders, Icon: Package, label: 'Orders in progress', value: orders ? counts.active : null, tint: TINT.blue },
    { href: ROUTES.orders, Icon: PackageCheck, label: 'Delivered', value: orders ? counts.delivered : null, tint: TINT.green },
    { href: ROUTES.wishlist, Icon: Bookmark, label: 'Favourites', value: favourites, tint: TINT.rose },
    { href: ROUTES.coupons, Icon: Tags, label: 'Offers for you', value: offers, tint: TINT.amber },
    { href: ROUTES.notifications, Icon: Bell, label: 'Unread alerts', value: unread, tint: TINT.violet },
  ];

  return (
    <div className="font-ui">
      <h1 className="sr-only">My account</h1>

      {/* Profile hero with the wallet. */}
      <section className="relative mb-[18px] overflow-hidden rounded-[28px] bg-[linear-gradient(125deg,#0142aa_0%,#1d5fd1_55%,#3b82f6_100%)] p-[28px] text-white shadow-[0_18px_40px_rgba(1,66,170,0.28)]">
        <span aria-hidden="true" className="absolute -right-[70px] -top-[90px] size-[280px] rounded-full bg-white/10" />
        <span aria-hidden="true" className="absolute -bottom-[100px] left-[38%] size-[220px] rounded-full bg-white/[0.06]" />
        <div className="relative flex items-center gap-[22px]">
          <span className="flex size-[92px] shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-white/90 bg-white text-[34px] font-bold text-brand shadow-[0_0_0_6px_rgba(255,255,255,0.15)]">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="size-full object-cover" />
            ) : (
              name.slice(0, 1).toUpperCase()
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-white/75">{greeting},</p>
            <p className="truncate text-[30px] font-bold leading-[1.15]">{first}</p>
            <p className="mt-[8px] flex flex-wrap gap-[8px] text-[13px] font-semibold">
              {user.username ? <span className="rounded-full bg-white/15 px-[12px] py-[4px]">@{user.username}</span> : null}
              {user.phone ? (
                <span className="inline-flex items-center gap-[6px] rounded-full bg-white/15 px-[12px] py-[4px]">
                  <Phone aria-hidden="true" className="size-[13px]" /> {formatPhone(user.phone)}
                </span>
              ) : null}
              {user.email ? (
                <span className="inline-flex max-w-[280px] items-center gap-[6px] truncate rounded-full bg-white/15 px-[12px] py-[4px]">
                  <Mail aria-hidden="true" className="size-[13px] shrink-0" /> <span className="truncate">{user.email}</span>
                </span>
              ) : null}
              <Link href={ROUTES.accountDetails} className="inline-flex items-center gap-[6px] rounded-full bg-white px-[12px] py-[4px] text-brand hover:bg-brand-popup-bg">
                <Pencil aria-hidden="true" className="size-[13px]" /> Edit profile
              </Link>
            </p>
          </div>
          <Link
            href={ROUTES.wallet}
            className="group w-[300px] shrink-0 rounded-[22px] bg-white p-[18px] text-heading shadow-[0_12px_28px_rgba(0,0,0,0.15)] transition-transform hover:-translate-y-[2px]"
          >
            <span className="flex items-center gap-[10px]">
              <span className="flex size-[40px] items-center justify-center rounded-[12px] bg-brand text-white">
                <Wallet aria-hidden="true" className="size-[20px]" />
              </span>
              <span className="text-[13.5px] font-semibold text-ink-muted">YouMart Wallet</span>
            </span>
            {balance !== null ? (
              <span className="mt-[10px] block text-[28px] font-bold leading-none">{formatMoney(balance)}</span>
            ) : (
              <Skeleton className="mt-[10px] h-[28px] w-[140px]" />
            )}
            <span className="mt-[12px] flex items-center justify-between text-[13px] font-bold text-brand">
              <span className="inline-flex items-center gap-[4px] rounded-full bg-brand-popup-bg px-[12px] py-[6px]">
                <Plus aria-hidden="true" className="size-[14px]" /> Add money
              </span>
              <span className="inline-flex items-center gap-[4px]">
                View activity <ArrowRight aria-hidden="true" className="size-[14px] transition-transform group-hover:translate-x-[2px]" />
              </span>
            </span>
          </Link>
        </div>
      </section>

      {/* Live numbers. */}
      <ul className="mb-[18px] grid grid-cols-5 gap-[12px]">
        {stats.map(({ href, Icon, label, value, tint }) => (
          <li key={label}>
            <Link href={href} className={`${CARD} flex items-center gap-[12px] px-[16px] py-[14px] transition-shadow hover:shadow-product-card`}>
              <span className="flex size-[44px] shrink-0 items-center justify-center rounded-[14px]" style={{ background: tint.bg, color: tint.fg }}>
                <Icon aria-hidden="true" className="size-[20px]" />
              </span>
              <span className="min-w-0">
                {value === null ? <Skeleton className="h-[24px] w-[36px]" /> : <span className="block text-[24px] font-bold leading-none text-heading">{value}</span>}
                <span className="mt-[4px] block truncate text-[12.5px] text-ink-muted">{label}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Recent orders. */}
      <section aria-labelledby="acc-recent" className="mb-[18px]">
        <div className="mb-[12px] flex items-center justify-between">
          <h2 id="acc-recent" className="flex items-center gap-[10px] text-[20px] font-bold text-heading">
            <span aria-hidden="true" className="h-[24px] w-[4px] rounded-full bg-brand" />
            Recent orders
          </h2>
          <Link href={ROUTES.orders} className="inline-flex items-center gap-[4px] rounded-full bg-brand-popup-bg px-[14px] py-[7px] text-[13.5px] font-bold text-brand hover:bg-brand hover:text-white">
            All orders <ArrowRight aria-hidden="true" className="size-[14px]" />
          </Link>
        </div>
        {orders === null ? (
          <Skeleton className="h-[200px] w-full rounded-[24px]" />
        ) : recent.length === 0 ? (
          <div className={`${CARD} flex items-center gap-[18px] px-[24px] py-[22px]`}>
            <span className="flex size-[60px] items-center justify-center rounded-full bg-brand-popup-bg text-brand">
              <ShoppingBag aria-hidden="true" className="size-[28px]" />
            </span>
            <div className="flex-1">
              <p className="text-[17px] font-bold text-heading">No orders yet</p>
              <p className="text-[14px] text-ink-muted">Everything you order shows up here, with live tracking.</p>
            </div>
            <Link href="/" className="rounded-[14px] bg-brand px-[22px] py-[12px] text-[15px] font-bold text-white hover:bg-[#013a96]">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-[14px]">
            {recent.map((o) => (
              <DeskOrderCard key={o.orderId} order={o} cards={cards} />
            ))}
          </div>
        )}
      </section>

      {/* The app's grouped menu. */}
      <div className="mb-[18px] grid grid-cols-3 items-start gap-[16px]">
        <MenuCard title="Shopping & activity" items={ACTIVITY.filter((i) => i.href !== ROUTES.cart)} />
        <div className="flex flex-col gap-[16px]">
          <MenuCard title="Reminders & alerts" items={REMINDERS} />
          <MenuCard title="Account settings" items={SETTINGS} />
        </div>
        <div className="flex flex-col gap-[16px]">
          <Link href={ROUTES.sell} className="group relative flex items-center gap-[14px] overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#050f26,#0a2463_55%,#0142aa)] p-[18px] text-white shadow-rail-card">
            <span aria-hidden="true" className="absolute -right-[30px] -top-[40px] size-[120px] rounded-full bg-white/[0.07]" />
            <span className="flex size-[46px] shrink-0 items-center justify-center rounded-[14px] border border-white/25 bg-white/10">
              <ShoppingCart aria-hidden="true" className="size-[22px] fill-[#ffd23f] text-[#ffd23f]" />
            </span>
            <span className="relative min-w-0 flex-1">
              <span className="block text-[16px] font-bold">Sell on YouMart</span>
              <span className="block text-[12.5px] text-white/75">Take your business online</span>
            </span>
            <span className="relative rounded-full border border-[#ffd23f]/60 px-[9px] py-[3px] text-[10.5px] font-bold tracking-[1px] text-[#ffd23f]">SOON</span>
          </Link>
          <Link href={ROUTES.ads} className={`${CARD} group flex items-center gap-[14px] !border-[#fde2cf] p-[18px] transition-shadow hover:shadow-product-card`}>
            <span className="flex size-[46px] shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#f97316,#ea580c)] text-white">
              <Megaphone aria-hidden="true" className="size-[22px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-bold text-heading">Advertise on YouMart</span>
              <span className="block text-[12.5px] text-ink-muted">Photo or video ads · ₹1,000 per day</span>
            </span>
            <ChevronRight aria-hidden="true" className="size-[16px] text-ink-muted group-hover:text-[#ea580c]" />
          </Link>
          <Link href={ROUTES.refer} className="group relative flex items-center gap-[14px] overflow-hidden rounded-[24px] bg-[linear-gradient(140deg,#0b1b3f_0%,#0142aa_55%,#7c3aed_100%)] p-[18px] text-white shadow-rail-card">
            <Gift aria-hidden="true" className="absolute -bottom-[10px] right-[8px] size-[70px] text-white/10" />
            <span className="flex size-[46px] shrink-0 items-center justify-center rounded-[14px] bg-white/15">
              <Sparkles aria-hidden="true" className="size-[22px] text-[#ffd60a]" />
            </span>
            <span className="relative min-w-0 flex-1">
              <span className="block text-[16px] font-bold">Refer & Earn</span>
              <span className="block text-[12.5px] text-white/75">2.5% of friends’ orders to your wallet</span>
            </span>
          </Link>
          <Link href={ROUTES.help} className={`${CARD} group flex items-center gap-[14px] p-[18px] transition-shadow hover:shadow-product-card`}>
            <span className="flex size-[46px] shrink-0 items-center justify-center rounded-[14px]" style={{ background: TINT.violet.bg, color: TINT.violet.fg }}>
              <LifeBuoy aria-hidden="true" className="size-[22px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-bold text-heading">Help Center</span>
              <span className="block text-[12.5px] text-ink-muted">Get help with an order, follow requests</span>
            </span>
            <ChevronRight aria-hidden="true" className="size-[16px] text-ink-muted group-hover:text-brand" />
          </Link>
        </div>
      </div>

      {/* Help & information. */}
      <section aria-labelledby="acc-info" className={`${CARD} p-[20px]`}>
        <h2 id="acc-info" className="mb-[14px] text-[12.5px] font-bold uppercase tracking-[1px] text-ink-muted">
          Help & information
        </h2>
        <ul className="grid grid-cols-4 gap-[10px]">
          {INFO.map((item) => {
            const t = TINT[item.tint];
            return (
              <li key={item.label}>
                <Link href={item.href} className="group flex items-center gap-[10px] rounded-[16px] bg-[#f8faff] px-[12px] py-[11px] transition-colors hover:bg-brand-popup-bg">
                  <span className="flex size-[36px] shrink-0 items-center justify-center rounded-[11px]" style={{ background: t.bg }}>
                    <item.icon aria-hidden="true" className="size-[17px]" style={{ color: t.fg }} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-heading group-hover:text-brand">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
