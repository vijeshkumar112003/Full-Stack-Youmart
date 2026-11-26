'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ROUTES } from '@youmart/shared-client';
import { CartCountBadge, cartLinkLabel } from '@/components/cart/CartCountBadge';
import { useCartCount } from '@/lib/cart';

// The app's bottom bar (apps/mobile/src/app/(tabs)/_layout.tsx + AiNavButton.tsx): Home,
// Favourites, the "Ask" orb in the middle, My Cart and Account. Same solid icons as the app
// (Ionicons home / bookmark / cart / person / chatbubbles, MIT), 24px, grey #989898 or brand
// blue, 11px labels, 52px bar. Phone + tablet only.

const ICONS: Record<string, ReactNode> = {
  home: (
    <>
      <path d="M261.56 101.28a8 8 0 00-11.06 0L66.4 277.15a8 8 0 00-2.47 5.79L63.9 448a32 32 0 0032 32H192a16 16 0 0016-16V328a8 8 0 018-8h80a8 8 0 018 8v136a16 16 0 0016 16h96.06a32 32 0 0032-32V282.94a8 8 0 00-2.47-5.79z" />
      <path d="M490.91 244.15l-74.8-71.56V64a16 16 0 00-16-16h-48a16 16 0 00-16 16v32l-57.92-55.38C272.77 35.14 264.71 32 256 32c-8.68 0-16.72 3.14-22.14 8.63l-212.7 203.5c-6.22 6-7 15.87-1.34 22.37A16 16 0 0043 267.56L250.5 69.28a8 8 0 0111.06 0l207.52 198.28a16 16 0 0022.59-.44c6.14-6.36 5.63-16.86-.76-22.97z" />
    </>
  ),
  bookmark: (
    <path d="M400 480a16 16 0 01-10.63-4L256 357.41 122.63 476A16 16 0 0196 464V96a64.07 64.07 0 0164-64h192a64.07 64.07 0 0164 64v368a16 16 0 01-16 16z" />
  ),
  cart: (
    <>
      <circle cx="176" cy="416" r="32" />
      <circle cx="400" cy="416" r="32" />
      <path d="M456.8 120.78a23.92 23.92 0 00-18.56-8.78H133.89l-6.13-34.78A16 16 0 00112 64H48a16 16 0 000 32h50.58l45.66 258.78A16 16 0 00160 368h256a16 16 0 000-32H173.42l-5.64-32h241.66A24.07 24.07 0 00433 284.71l28.8-144a24 24 0 00-5-19.93z" />
    </>
  ),
  person: (
    <path d="M332.64 64.58C313.18 43.57 286 32 256 32c-30.16 0-57.43 11.5-76.8 32.38-19.58 21.11-29.12 49.8-26.88 80.78C156.76 206.28 203.27 256 256 256s99.16-49.71 103.67-110.82c2.27-30.7-7.33-59.33-27.03-80.6zM432 480H80a31 31 0 01-24.2-11.13c-6.5-7.77-9.12-18.38-7.18-29.11C57.06 392.94 83.4 353.61 124.8 326c36.78-24.51 83.37-38 131.2-38s94.42 13.5 131.2 38c41.4 27.6 67.74 66.93 76.18 113.75 1.94 10.73-.68 21.34-7.18 29.11A31 31 0 01432 480z" />
  ),
  chatbubbles: (
    <>
      <path d="M439.9 405.6a26.77 26.77 0 01-9.59-2l-56.78-20.13-.42-.17a9.88 9.88 0 00-3.91-.76 10.32 10.32 0 00-3.62.66c-1.38.52-13.81 5.19-26.85 8.77-7.07 1.94-31.68 8.27-51.43 8.27-50.48 0-97.68-19.4-132.89-54.63A183.38 183.38 0 01100.3 215.1a175.9 175.9 0 014.06-37.58c8.79-40.62 32.07-77.57 65.55-104A194.76 194.76 0 01290.3 32c52.21 0 100.86 20 137 56.18 34.16 34.27 52.88 79.33 52.73 126.87a177.86 177.86 0 01-30.3 99.15l-.19.28-.74 1c-.17.23-.34.45-.5.68l-.15.27a21.63 21.63 0 00-1.08 2.09l15.74 55.94a26.42 26.42 0 011.12 7.11 24 24 0 01-24.03 24.03z" />
      <path d="M299.87 425.39a15.74 15.74 0 00-10.29-8.1c-5.78-1.53-12.52-1.27-17.67-1.65a201.78 201.78 0 01-128.82-58.75A199.21 199.21 0 0186.4 244.16C85 234.42 85 232 85 232a16 16 0 00-28-10.58s-7.88 8.58-11.6 17.19a162.09 162.09 0 0011 150.06C59 393 59 395 58.42 399.5c-2.73 14.11-7.51 39-10 51.91a24 24 0 008 22.92l.46.39A24.34 24.34 0 0072 480a23.42 23.42 0 009-1.79l53.51-20.65a8.05 8.05 0 015.72 0c21.07 7.84 43 12 63.78 12a176 176 0 0074.91-16.66c5.46-2.56 14-5.34 19-11.12a15 15 0 001.95-16.39z" />
    </>
  ),
};

function Icon({ name, className }: { name: keyof typeof ICONS; className: string }) {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true" className={className}>
      {ICONS[name]}
    </svg>
  );
}

interface Tab {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
}

const LEFT: Tab[] = [
  { href: ROUTES.home, label: 'Home', icon: 'home' },
  { href: ROUTES.wishlist, label: 'Favourites', icon: 'bookmark' },
];
const RIGHT: Tab[] = [
  { href: ROUTES.cart, label: 'My Cart', icon: 'cart' },
  { href: ROUTES.account, label: 'Account', icon: 'person' },
];

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

const ITEM = 'flex h-full flex-col items-center justify-center gap-[2px] pt-[4px] font-ui text-[11px] leading-[14px]';

function TabLink({ tab, pathname, cartCount }: { tab: Tab; pathname: string; cartCount: number }) {
  const active = isActive(pathname, tab.href);
  return (
    <li>
      <Link
        href={tab.href}
        aria-current={active ? 'page' : undefined}
        aria-label={tab.href === ROUTES.cart ? cartLinkLabel(cartCount) : undefined}
        className={ITEM}
      >
        <span className="relative">
          <Icon name={tab.icon} className={`size-[24px] ${active ? 'text-brand' : 'text-[#989898]'}`} />
          {tab.href === ROUTES.cart && <CartCountBadge count={cartCount} tone="onWhite" />}
        </span>
        <span className={`font-medium ${active ? 'text-brand' : 'text-[#818799]'}`}>{tab.label}</span>
      </Link>
    </li>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname() ?? '/';
  const cartCount = useCartCount();
  // Product pages have the app's Add to Cart / Buy Now bar here instead of the tabs.
  if (pathname.startsWith('/product/')) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e6ecf5] bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid h-[56px] grid-cols-5">
        {LEFT.map((t) => (
          <TabLink key={t.href} tab={t} pathname={pathname} cartCount={cartCount} />
        ))}
        <li>
          <Link href="/ask" aria-label="Ask - Yumo and YouFind Bot" className={ITEM}>
            <span className="relative grid h-[24px] w-[34px] place-items-center">
              <span className="absolute size-[34px] animate-pulse rounded-full bg-[#14b8a6]/70" aria-hidden="true" />
              <span className="relative grid size-[28px] place-items-center rounded-full bg-[linear-gradient(135deg,#38bdf8_0%,#0142aa_50%,#0d9488_100%)]">
                <Icon name="chatbubbles" className="size-[15px] text-white" />
              </span>
            </span>
            <span className="font-bold text-brand">Ask</span>
          </Link>
        </li>
        {RIGHT.map((t) => (
          <TabLink key={t.href} tab={t} pathname={pathname} cartCount={cartCount} />
        ))}
      </ul>
    </nav>
  );
}
