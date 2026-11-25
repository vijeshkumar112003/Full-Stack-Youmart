'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark, Clock, ImageOff, Loader2, ShoppingBag, Trash2, X } from 'lucide-react';
import {
  discountPercent,
  formatMoney,
  loginHref,
  type Money,
  type ProductCardData,
  type WishlistItem,
} from '@youmart/shared-client';
import { AddToCartButton } from '@/components/product/AddToCartButton';
import { api } from '@/lib/api';
import { buyNowLine, useCart } from '@/lib/cart';
import { skipImageOptimizer } from '@/lib/images';
import { useWishlist } from '@/lib/wishlist';

// The app's Favourites tab (apps/mobile/src/components/WishlistList.tsx) for phones: "N saved
// items", a 3-column grid of saved cards (photo + % off + remove, name, price, when saved, Add |
// Buy now), and the "No saved items yet" empty state.

const rupees = (m: Money) => formatMoney(m).replace(/\.00$/, '');

function savedWhen(iso: string): string {
  const then = new Date(iso);
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  if (Number.isNaN(days)) return 'Saved';
  if (days <= 0) return 'Saved today';
  if (days === 1) return 'Saved yesterday';
  if (days < 7) return `Saved ${days} days ago`;
  return `Saved ${then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
}

export function AppFavourites() {
  const router = useRouter();
  const { view, mode, remove } = useWishlist();
  const { mode: cartMode } = useCart();
  const [images, setImages] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState<WishlistItem | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const items = view?.items ?? [];

  const idsKey = [...new Set(items.map((i) => i.productId))].sort().join(',');
  useEffect(() => {
    const missing = idsKey.split(',').filter((id) => id && !(id in images));
    if (missing.length === 0) return;
    api.catalog
      .productCards(missing)
      .then(({ items: cards }) =>
        setImages((prev) => {
          const next = { ...prev };
          for (const id of missing) next[id] = '';
          for (const c of cards) next[c.id] = c.imageUrl ?? '';
          return next;
        }),
      )
      .catch(() => undefined);
  }, [idsKey]); // eslint-disable-line react-hooks/exhaustive-deps -- `images` is a cache

  if (mode === 'loading' && !view) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 aria-hidden="true" className="size-[28px] animate-spin text-brand" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-[24px] text-center">
        <span className="flex size-[96px] items-center justify-center rounded-full bg-[#e8f1fb]">
          <Bookmark aria-hidden="true" className="size-[40px] text-brand" strokeWidth={2} />
        </span>
        <p className="mt-[18px] font-ui text-[22px] font-bold text-black">No saved items yet</p>
        <p className="mt-[8px] text-[15px] text-[#475569]">Tap the bookmark on any product to save it here.</p>
        <Link href="/" className="mt-[24px] rounded-[12px] bg-brand px-[30px] py-[14px] font-ui text-[17px] font-bold text-white">
          Explore products
        </Link>
      </div>
    );
  }

  const buyNow = async (item: WishlistItem) => {
    if (!item.productSlug || !item.sellingPrice) return;
    if (cartMode !== 'account') return router.push(loginHref('/checkout'));
    setBuying(item.wishlistItemId);
    try {
      const id = await buyNowLine({
        skuId: item.skuId,
        productId: item.productId,
        productSlug: item.productSlug,
        title: item.title ?? 'Product',
        price: item.sellingPrice,
        ...(images[item.productId] ? { image: images[item.productId] } : {}),
      });
      if (id) router.push(`/checkout?buy=${id}`);
    } finally {
      setBuying(null);
    }
  };

  return (
    <div className="px-[12px] pb-[24px] pt-[12px]">
      <p className="mb-[12px] flex items-center gap-[8px] px-[4px] font-ui text-[15px] font-bold text-heading">
        <span className="flex size-[22px] items-center justify-center rounded-full bg-brand">
          <Bookmark aria-hidden="true" className="size-[12px] fill-white text-white" />
        </span>
        {items.length} saved item{items.length === 1 ? '' : 's'}
      </p>
      <ul className="grid grid-cols-3 gap-[8px]">
        {items.map((item) => {
          const image = images[item.productId] || '';
          const available = item.available && !!item.productSlug && !!item.sellingPrice;
          const off = item.mrp && item.sellingPrice ? discountPercent(item.mrp, item.sellingPrice) : 0;
          const card: ProductCardData | null = available
            ? ({
                id: item.productId,
                skuId: item.skuId,
                slug: item.productSlug!,
                href: `/product/${item.productSlug}`,
                title: item.title ?? 'Product',
                image,
                sellingPrice: item.sellingPrice!,
                mrp: item.mrp ?? item.sellingPrice!,
                rating: 0,
              } as ProductCardData)
            : null;
          return (
            <li key={item.wishlistItemId} className="flex flex-col overflow-hidden rounded-[14px] border border-card-border bg-white">
              <div className="relative aspect-square bg-[#f4f7fd]">
                <Link href={item.productSlug ? `/product/${item.productSlug}` : '#'} className="absolute inset-0">
                  {image ? (
                    <Image src={image} alt="" fill sizes="33vw" unoptimized={skipImageOptimizer(image)} className={`object-contain p-[6px] ${available ? '' : 'opacity-40 grayscale'}`} />
                  ) : (
                    <ImageOff aria-hidden="true" className="absolute inset-0 m-auto size-[24px] text-card-border" />
                  )}
                </Link>
                {off > 0 && available ? (
                  <span className="absolute left-[6px] top-[6px] rounded-[7px] bg-[#e11d48] px-[5px] py-[1px] font-ui text-[9.5px] font-bold text-white">{off}% OFF</span>
                ) : null}
                <button type="button" onClick={() => setConfirming(item)} aria-label="Remove from saved items" className="absolute right-[5px] top-[5px] flex size-[22px] items-center justify-center rounded-full bg-white shadow">
                  <X aria-hidden="true" className="size-[13px]" />
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-[3px] px-[7px] pb-[6px] pt-[5px]">
                <p className="line-clamp-2 min-h-[32px] text-[12px] leading-[16px] text-black">{item.title ?? 'Product'}</p>
                {available ? (
                  <p className="flex items-baseline gap-[4px]">
                    <span className="font-ui text-[13.5px] font-bold text-heading">{rupees(item.sellingPrice!)}</span>
                    {off > 0 && item.mrp ? <span className="text-[10.5px] text-ink-muted line-through">{rupees(item.mrp)}</span> : null}
                  </p>
                ) : (
                  <p className="text-[11.5px] font-semibold text-[#e11d48]">No longer available</p>
                )}
                <p className="flex items-center gap-[3px] text-[10px] text-ink-muted">
                  <Clock aria-hidden="true" className="size-[10px]" /> {savedWhen(item.addedAt)}
                </p>
              </div>
              {card ? (
                <div className="flex flex-col gap-[4px] px-[6px] pb-[6px]">
                  <AddToCartButton product={card} className="flex h-[28px] w-full items-center justify-center gap-[4px] rounded-[8px] bg-brand font-ui text-[12px] font-bold text-white" />
                  <button
                    type="button"
                    disabled={buying !== null}
                    onClick={() => void buyNow(item)}
                    className="flex h-[28px] w-full items-center justify-center gap-[4px] rounded-[8px] bg-[#ffd60a] font-ui text-[12px] font-bold text-[#1f1300] disabled:opacity-60"
                  >
                    {buying === item.wishlistItemId ? <Loader2 aria-hidden="true" className="size-[13px] animate-spin" /> : <ShoppingBag aria-hidden="true" className="size-[12px]" />}
                    Buy now
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirming(item)} className="mx-[6px] mb-[6px] flex h-[28px] items-center justify-center gap-[4px] rounded-[8px] border border-[#fecdd3] font-ui text-[12px] font-semibold text-[#e11d48]">
                  <Trash2 aria-hidden="true" className="size-[12px]" /> Remove
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {confirming ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 px-[24px]" role="dialog" aria-modal="true">
          <div className="w-full max-w-[340px] rounded-[20px] bg-white p-[20px] text-center">
            <p className="font-ui text-[18px] font-bold text-heading">Remove from saved items?</p>
            <p className="mt-[6px] line-clamp-2 text-[14px] text-ink-muted">{confirming.title}</p>
            <div className="mt-[16px] flex gap-[10px]">
              <button type="button" onClick={() => setConfirming(null)} className="h-[44px] flex-1 rounded-[12px] border border-card-border font-ui font-semibold">
                Keep
              </button>
              <button
                type="button"
                onClick={() => {
                  void remove(confirming.wishlistItemId);
                  setConfirming(null);
                }}
                className="h-[44px] flex-1 rounded-[12px] bg-[#e11d48] font-ui font-bold text-white"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
