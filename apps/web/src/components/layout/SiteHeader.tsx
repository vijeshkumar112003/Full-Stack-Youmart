'use client';

import Link from 'next/link';
import { Bell, Download, Headset, Heart, Package, PackageSearch, QrCode, ShoppingCart } from 'lucide-react';
import { BUSINESS, ROUTES } from '@youmart/shared-client';
import { useSession } from '@/lib/session';
import { useCartCount } from '@/lib/cart';
import { useWishlistCount } from '@/lib/wishlist';
import { useUnreadCount } from '@/lib/inbox';
import { CartCountBadge, cartLinkLabel } from '@/components/cart/CartCountBadge';
import { Logo } from './Logo';
import { SearchBar } from './SearchBar';
import { DeliveryBar } from './DeliveryBar';
import { FaMapMarkerAlt, FaUser, FaWhatsapp } from '@/components/ui/FaIcons';

interface DesktopAction {
  href: string;
  lines: [string, string?];
  icon: React.ReactNode;
}

const TILE_ICON = 'size-6';

// Order, labels and glyphs as measured on the live desktop header; targets as live links them.
const DESKTOP_ACTIONS: DesktopAction[] = [
  {
    href: ROUTES.addresses,
    lines: ['Delivery', 'location'],
    icon: <FaMapMarkerAlt className={TILE_ICON} />,
  },
  { href: ROUTES.account, lines: ['My', 'Account'], icon: <FaUser className={TILE_ICON} /> },
  {
    href: ROUTES.trackOrder,
    lines: ['Order', 'Track'],
    icon: <PackageSearch aria-hidden="true" className={TILE_ICON} strokeWidth={2.25} />,
  },
  {
    href: BUSINESS.appStoreHref,
    lines: ['Download', 'App'],
    icon: <Download aria-hidden="true" className={TILE_ICON} strokeWidth={2.5} />,
  },
  {
    href: ROUTES.wishlist,
    lines: ['My', 'Wishlist'],
    icon: <Heart aria-hidden="true" className={TILE_ICON} strokeWidth={2.5} />,
  },
  {
    href: ROUTES.customerCare,
    lines: ['Customer', 'Care'],
    icon: <FaWhatsapp className={TILE_ICON} />,
  },
  // v1.15: the inbox - order updates, refunds, support replies.
  {
    href: ROUTES.notifications,
    lines: ['Notifi-', 'cations'],
    icon: <Bell aria-hidden="true" className={TILE_ICON} strokeWidth={2.5} />,
  },
  {
    href: ROUTES.cart,
    lines: ['Cart'],
    icon: <ShoppingCart aria-hidden="true" className={TILE_ICON} strokeWidth={2.5} />,
  },
];

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

export function SiteHeader() {
  const session = useSession();
  const cartCount = useCartCount();
  const wishlistCount = useWishlistCount();
  const unread = useUnreadCount();
  // Same tile as live's "My Account"; once signed in it greets the customer instead.
  const firstName = session.user?.name?.split(' ')[0];
  const accountLines: [string, string] =
    session.status === 'authenticated' ? ['Hi,', firstName ?? 'there'] : ['My', 'Account'];

  return (
    <header className="bg-white">
      {/* Phone + tablet (< 1025px): the app's header - logo, QR Login / Track Order / Alerts /
          Customer Care tiles, "Deliver to" and the search bar (camera + voice). */}
      <div className="flex flex-col px-[16px] pb-[12px] pt-[8px] lg:hidden">
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

      {/* Desktop (>= 1025px): 121px row, geometry scaled exactly like the live Elementor columns */}
      <div className="hidden h-[121px] items-center pl-[clamp(20px,calc((100vw-1025px)*0.37+24px),119px)] pr-[clamp(16px,calc((100vw-1025px)*0.22+16px),73px)] pt-[5px] lg:flex">
        <Logo className="w-[max(120px,calc(15.3vw-39px))]" priority />
        <SearchBar
          id="search-desktop"
          className="ml-[20px] w-[calc(38.4vw-75px)] min-w-[220px] shrink"
        />
        <nav aria-label="Account and shopping" className="ml-auto shrink-0 pl-[16px]">
          <ul className="flex items-start gap-[14px]">
            {DESKTOP_ACTIONS.map(({ href, lines, icon }) => (
              <li key={href} className="last:ml-[3px]">
                <Link
                  href={href}
                  aria-label={
                    href === ROUTES.cart
                      ? cartLinkLabel(cartCount)
                      : href === ROUTES.wishlist
                        ? `My wishlist, ${wishlistCount} ${wishlistCount === 1 ? 'item' : 'items'}`
                        : href === ROUTES.notifications
                          ? unread > 0
                            ? `Notifications, ${unread} unread`
                            : 'Notifications'
                          : href === ROUTES.account && session.status === 'authenticated'
                          ? 'My account (signed in)'
                          : undefined
                  }
                  className="group flex min-w-[38px] flex-col items-center"
                >
                  <span className="relative flex size-[38px] items-center justify-center rounded-tile bg-brand p-[7px] text-white">
                    {icon}
                    {href === ROUTES.cart && <CartCountBadge count={cartCount} tone="onBrand" />}
                    {href === ROUTES.wishlist && (
                      <CartCountBadge count={wishlistCount} tone="onBrand" />
                    )}
                    {href === ROUTES.notifications && unread > 0 && (
                      <span
                        aria-hidden="true"
                        className="absolute -right-[7px] -top-[7px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#e11d48] px-[5px] font-ui text-[11px] font-bold leading-none text-white ring-2 ring-white"
                      >
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </span>
                  <TwoLineLabel
                    lines={href === ROUTES.account ? accountLines : lines}
                    className="mt-[1px] text-center font-ui text-[13px] font-semibold leading-[16.9px] text-ink-strong"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

    </header>
  );
}
