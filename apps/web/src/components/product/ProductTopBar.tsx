'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Search, ShoppingCart } from 'lucide-react';
import { ROUTES } from '@youmart/shared-client';
import { CartCountBadge, cartLinkLabel } from '@/components/cart/CartCountBadge';
import { useCartCount } from '@/lib/cart';

/** The app's product-screen top bar on phones: back, the product name, search and the cart. */
export function ProductTopBar({ title }: { title: string }) {
  const router = useRouter();
  const count = useCartCount();
  const btn = 'flex size-[40px] shrink-0 items-center justify-center rounded-full bg-white text-heading shadow-[0_3px_10px_rgba(15,23,42,0.12)]';
  return (
    <div className="sticky top-0 z-30 flex items-center gap-[10px] bg-page/95 px-[12px] py-[8px] backdrop-blur lg:hidden">
      <button type="button" onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))} aria-label="Back" className={btn}>
        <ChevronLeft aria-hidden="true" className="size-[22px]" />
      </button>
      <p className="min-w-0 flex-1 truncate font-ui text-[15px] font-semibold text-heading">{title}</p>
      <Link href={ROUTES.search} aria-label="Search" className={btn}>
        <Search aria-hidden="true" className="size-[19px]" />
      </Link>
      <Link href={ROUTES.cart} aria-label={cartLinkLabel(count)} className={`relative ${btn}`}>
        <ShoppingCart aria-hidden="true" className="size-[19px]" />
        <CartCountBadge count={count} tone="onWhite" />
      </Link>
    </div>
  );
}
