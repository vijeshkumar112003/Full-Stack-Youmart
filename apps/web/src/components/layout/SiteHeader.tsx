'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Bookmark, Headset, MessagesSquare, Package, QrCode, ShoppingCart, User } from 'lucide-react';
import { ROUTES } from '@youmart/shared-client';
import { useSession } from '@/lib/session';
import { useCartCount } from '@/lib/cart';
import { useWishlistCount } from '@/lib/wishlist';
import { useUnreadCount } from '@/lib/inbox';
import { cartLinkLabel } from '@/components/cart/CartCountBadge';
import { Logo } from './Logo';
import { SearchBar } from './SearchBar';
import { DeliveryBar } from './DeliveryBar';
import { hidesShopHeader } from '@/lib/phone-screens';

function TwoLineLabel({ lines, className }: { lines: [string, string?]; className: string }) {
  return (
    <span className={className}>
      {lines[0]}
      {lines[1] ? (
        <>
          <br />
          {lines[1]}
        </>
      ) : null}
    </span>
  );
}

/** The app header's quick tile: icon over a 1-2 line 9.5px label, all in brand blue. */
function AppTile({
  href,
  label,
  icon,
  ariaLabel,
}: {
  href: string;
  label: [string, string?];
  icon: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <Link href={href} aria-label={ariaLabel} className="flex w-[46px] flex-col items-center gap-[2px] text-brand">
      {icon}
      <TwoLineLabel lines={label} className="text-center font-ui text-[9.5px] font-semibold leading-[11px]" />
    </Link>
  );
}


/** Desktop version of the app's quick tile: brand-blue icon over an 11.5px label, soft hover. */
function DeskTile({
  href,
  label,
  icon,
  ariaLabel,
  badge = 0,
}: {
  href: string;
  label: [string, string?];
  icon: React.ReactNode;
  ariaLabel?: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="flex min-w-[62px] max-w-[84px] flex-col items-center gap-[3px] rounded-[12px] px-[4px] py-[6px] text-brand transition-colors hover:bg-brand-popup-bg"
    >
      <span className="relative">
        {icon}
        {badge > 0 ? (
          <span aria-hidden="true" className="absolute -right-[10px] -top-[6px] flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-[1.5px] border-white bg-[#e11d48] px-[4px] font-ui text-[9.5px] font-bold leading-none text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        ) : null}
      </span>
      <TwoLineLabel lines={label} className="max-w-full truncate text-center font-ui text-[11.5px] font-semibold leading-[13px]" />
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname() ?? '/';
  const fullScreen = hidesShopHeader(pathname);
  const session = useSession();
  const cartCount = useCartCount();
  const wishlistCount = useWishlistCount();
  const unread = useUnreadCount();
  const firstName = session.user?.name?.split(' ')[0];

  return (
    <header className="bg-white">
      {/* Phone + tablet (< 1025px): the app's header - logo, QR Login / Track Order / Alerts /
          Customer Care tiles, "Deliver to" and the search bar (camera + voice). */}
      <div className={`flex-col px-[16px] pb-[12px] pt-[8px] lg:hidden ${fullScreen ? 'hidden' : 'flex'}`}>
        <div className="flex items-center justify-between">
          <Logo variant="mobile" className="w-[132px]" priority />
          <nav aria-label="Quick links" className="ml-auto flex items-start gap-[6px]">
            <AppTile href="/scan" label={['QR', 'Login']} icon={<QrCode aria-hidden="true" className="size-[22px]" strokeWidth={1.8} />} />
            <AppTile href={ROUTES.trackOrder} label={['Track', 'Order']} icon={<Package aria-hidden="true" className="size-[22px]" strokeWidth={1.8} />} />
            <AppTile
              href={ROUTES.notifications}
              label={['Alerts']}
              ariaLabel={unread > 0 ? `Alerts, ${unread} unread` : 'Alerts'}
              icon={
                <span className="relative">
                  <Bell aria-hidden="true" className={`size-[22px] ${unread > 0 ? 'fill-brand' : ''}`} strokeWidth={1.8} />
                  {unread > 0 ? (
                    <span aria-hidden="true" className="absolute -right-[9px] -top-[5px] flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-[1.5px] border-white bg-[#e11d48] px-[4px] font-ui text-[9.5px] font-bold leading-none text-white">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  ) : null}
                </span>
              }
            />
            <AppTile href={ROUTES.customerCare} label={['Customer', 'Care']} icon={<Headset aria-hidden="true" className="size-[22px]" strokeWidth={1.8} />} />
          </nav>
        </div>
        <DeliveryBar />
        <SearchBar id="search-mobile" size="app" className="mt-[12px]" />
      </div>

      {/* Desktop (>= 1025px): the app's header laid out wide - logo, "Deliver to", the app search
          (camera + voice), the app's top tiles, then the app's bottom-bar destinations (desktop has
          no bottom bar). Same icons, same brand blue. */}
      <div className="hidden border-b border-[#e6ecf5] shadow-[0_2px_10px_rgba(1,66,170,0.06)] lg:block">
        <div className="mx-auto flex h-[84px] max-w-[1440px] items-center gap-[20px] px-[32px]">
          <Logo className="w-[150px]" priority />
          <DeliveryBar className="!mt-0 max-w-[260px] shrink self-center" />
          <SearchBar id="search-desktop" size="app" className="min-w-[260px] max-w-[620px] flex-1" />
          <nav aria-label="Quick links" className="ml-auto flex shrink-0 items-center">
            <DeskTile href="/qr-login" label={['QR', 'Login']} icon={<QrCode aria-hidden="true" className="size-[24px]" strokeWidth={1.8} />} />
            <DeskTile href={ROUTES.trackOrder} label={['Track', 'Order']} icon={<Package aria-hidden="true" className="size-[24px]" strokeWidth={1.8} />} />
            <DeskTile
              href={ROUTES.notifications}
              label={['Alerts']}
              ariaLabel={unread > 0 ? `Alerts, ${unread} unread` : 'Alerts'}
              icon={<Bell aria-hidden="true" className={`size-[24px] ${unread > 0 ? 'fill-brand' : ''}`} strokeWidth={1.8} />}
              badge={unread}
            />
            <DeskTile href={ROUTES.customerCare} label={['Customer', 'Care']} icon={<Headset aria-hidden="true" className="size-[24px]" strokeWidth={1.8} />} />
            <span aria-hidden="true" className="mx-[10px] h-[40px] w-px bg-[#e6ecf5]" />
            <DeskTile
              href={ROUTES.wishlist}
              label={['Favourites']}
              ariaLabel={`Favourites, ${wishlistCount} ${wishlistCount === 1 ? 'item' : 'items'}`}
              icon={<Bookmark aria-hidden="true" className="size-[24px]" strokeWidth={1.8} />}
              badge={wishlistCount}
            />
            <DeskTile href="/ask" label={['Ask']} ariaLabel="Ask - Yumo and YouFind Bot" icon={<MessagesSquare aria-hidden="true" className="size-[24px]" strokeWidth={1.8} />} />
            <DeskTile
              href={ROUTES.cart}
              label={['My Cart']}
              ariaLabel={cartLinkLabel(cartCount)}
              icon={<ShoppingCart aria-hidden="true" className="size-[24px]" strokeWidth={1.8} />}
              badge={cartCount}
            />
            <DeskTile
              href={ROUTES.account}
              label={session.status === 'authenticated' ? [`Hi, ${firstName ?? 'there'}`] : ['Account']}
              ariaLabel={session.status === 'authenticated' ? 'My account (signed in)' : 'Account'}
              icon={<User aria-hidden="true" className="size-[24px]" strokeWidth={1.8} />}
            />
          </nav>
        </div>
      </div>
    </header>
  );
}
