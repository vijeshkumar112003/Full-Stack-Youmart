'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bookmark, House, MessageCircle, ShoppingCart, User, type LucideIcon } from 'lucide-react';
import { ROUTES } from '@youmart/shared-client';
import { CartCountBadge, cartLinkLabel } from '@/components/cart/CartCountBadge';
import { useCartCount } from '@/lib/cart';

// The app's bottom bar (apps/mobile/src/app/(tabs)/_layout.tsx): Home, Favourites, the round
// "Ask" button in the middle, My Cart and Account. Phone + tablet only.

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
}

const LEFT: Tab[] = [
  { href: ROUTES.home, label: 'Home', icon: House },
  { href: ROUTES.wishlist, label: 'Favourites', icon: Bookmark },
];
const RIGHT: Tab[] = [
  { href: ROUTES.cart, label: 'My Cart', icon: ShoppingCart },
  { href: ROUTES.account, label: 'Account', icon: User },
];

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

function TabLink({ tab, pathname, cartCount }: { tab: Tab; pathname: string; cartCount: number }) {
  const active = isActive(pathname, tab.href);
  const Icon = tab.icon;
  return (
    <li>
      <Link
        href={tab.href}
        aria-current={active ? 'page' : undefined}
        aria-label={tab.href === ROUTES.cart ? cartLinkLabel(cartCount) : undefined}
        className="flex h-full flex-col items-center justify-center gap-[3px] font-ui text-[11.5px]"
      >
        <span className="relative">
          <Icon
            aria-hidden="true"
            className={`size-[26px] ${active ? 'text-brand' : 'text-nav-inactiveIcon'}`}
            fill="currentColor"
            strokeWidth={1.4}
          />
          {tab.href === ROUTES.cart && <CartCountBadge count={cartCount} tone="onWhite" />}
        </span>
        <span className={active ? 'font-semibold text-brand' : 'text-nav-inactiveLabel'}>{tab.label}</span>
      </Link>
    </li>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname() ?? '/';
  const cartCount = useCartCount();
  const askActive = pathname.startsWith('/ask') || pathname.startsWith('/youfind');

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e6ecf5] bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid h-[70px] grid-cols-5">
        {LEFT.map((t) => (
          <TabLink key={t.href} tab={t} pathname={pathname} cartCount={cartCount} />
        ))}
        <li>
          <Link
            href="/ask"
            aria-current={askActive ? 'page' : undefined}
            className="flex h-full flex-col items-center justify-center gap-[3px] font-ui text-[11.5px]"
          >
            <span className="flex size-[40px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#38bdf8_0%,#0142aa_70%)] shadow-[0_4px_10px_rgba(1,66,170,0.4)] ring-[3px] ring-white">
              <MessageCircle aria-hidden="true" className="size-[20px] fill-white text-white" />
            </span>
            <span className="font-semibold text-brand">Ask</span>
          </Link>
        </li>
        {RIGHT.map((t) => (
          <TabLink key={t.href} tab={t} pathname={pathname} cartCount={cartCount} />
        ))}
      </ul>
    </nav>
  );
}
