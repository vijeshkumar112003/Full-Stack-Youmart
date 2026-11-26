'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { skipImageOptimizer } from '@/lib/images';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Star } from 'lucide-react';
import { discountPercent, formatMoney, type ProductCardData } from '@youmart/shared-client';
import { AddToCartButton } from '@/components/product/AddToCartButton';
import { WishlistButton } from '@/components/product/WishlistButton';
import { buyNowLine, useAddToCart, useCart } from '@/lib/cart';

// The app's compact product card (3 across in "Shop our picks"): image + save, 2-line title, stars,
// price / MRP / % off, then Add (blue) and Buy (yellow) stacked full width.

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-[1px]" aria-label={rating > 0 ? `Rated ${rating.toFixed(1)}` : 'No ratings yet'}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={`size-[12px] ${i < Math.round(rating) ? 'fill-star-filled text-star-filled' : 'fill-[#d9dee7] text-[#d9dee7]'}`}
        />
      ))}
    </div>
  );
}

function BuyButton({ product, desktop }: { product: ProductCardData; desktop: boolean }) {
  const router = useRouter();
  const addToCart = useAddToCart();
  const { mode } = useCart();
  const [busy, setBusy] = useState(false);
  const { skuId, slug } = product;
  if (!skuId || !slug) return null;
  const line = {
    skuId,
    productId: product.id,
    productSlug: slug,
    title: product.title,
    price: product.sellingPrice,
    image: product.image,
  };
  const buy = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (mode === 'account') {
        const id = await buyNowLine(line);
        if (id) router.push(`/checkout?buy=${id}`);
        return;
      }
      if (await addToCart(line, 1)) router.push('/checkout');
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      onClick={buy}
      disabled={busy}
      className={`flex w-full items-center justify-center gap-[5px] rounded-[8px] bg-[#ffd814] font-ui font-bold text-heading transition-colors hover:bg-[#f7ca00] active:scale-[0.97] disabled:opacity-60 ${desktop ? 'h-[36px] rounded-[10px] text-[14px]' : 'h-[30px] text-[13px]'}`}
    >
      <ShoppingBag aria-hidden="true" className="size-[14px]" strokeWidth={2.4} />
      Buy
    </button>
  );
}

export function MiniProductCard({ product, size = 'phone' }: { product: ProductCardData; size?: 'phone' | 'desktop' }) {
  const desktop = size === 'desktop';
  const off = discountPercent(product.mrp, product.sellingPrice);
  const { skuId, slug } = product;
  return (
    <article className={`group relative flex h-full flex-col overflow-hidden border border-card-border bg-white ${desktop ? 'rounded-[18px] transition-all duration-200 hover:-translate-y-[3px] hover:border-brand hover:shadow-[0_14px_28px_rgba(1,66,170,0.14)]' : 'rounded-[14px]'}`}>
      <div className="absolute right-[6px] top-[6px] z-[2]">
        <WishlistButton
          variant="icon"
          product={
            skuId && slug
              ? {
                  skuId,
                  productId: product.id,
                  productSlug: slug,
                  title: product.title,
                  price: product.sellingPrice,
                  mrp: product.mrp,
                }
              : null
          }
        />
      </div>
      <Link href={product.href} className="relative block aspect-square bg-white">
        <Image
          src={product.image}
          alt={product.title}
          fill
          sizes={desktop ? '220px' : '34vw'}
          unoptimized={skipImageOptimizer(product.image)}
          className={`object-contain ${desktop ? 'p-[12px] transition-transform duration-300 group-hover:scale-105' : 'p-[6px]'}`}
        />
      </Link>
      <div className={`flex flex-1 flex-col gap-[4px] ${desktop ? 'px-[12px] pb-[12px] pt-[6px]' : 'px-[7px] pb-[8px] pt-[4px]'}`}>
        <Link href={product.href} className={`line-clamp-2 text-black hover:text-brand ${desktop ? 'min-h-[40px] text-[14px] leading-[20px]' : 'min-h-[34px] text-[12.5px] leading-[17px]'}`}>
          {product.title}
        </Link>
        <Stars rating={product.rating} />
        <div className="flex flex-wrap items-baseline gap-x-[4px]">
          <span className={`font-ui font-bold text-heading ${desktop ? 'text-[17px]' : 'text-[14px]'}`}>{formatMoney(product.sellingPrice)}</span>
          {off > 0 ? (
            <span className="text-[11px] text-ink-muted line-through">{formatMoney(product.mrp)}</span>
          ) : null}
        </div>
        {off > 0 ? <span className="font-ui text-[11.5px] font-bold text-[#e11d48]">{off}% OFF</span> : null}
        <div className={`mt-auto flex gap-[6px] pt-[6px] ${desktop ? 'flex-row' : 'flex-col'}`}>
          <AddToCartButton
            product={product}
            className={`flex w-full items-center justify-center gap-[5px] bg-brand font-ui font-bold text-white transition-colors hover:bg-[#003a96] active:scale-[0.97] ${desktop ? 'h-[36px] rounded-[10px] text-[14px]' : 'h-[30px] rounded-[8px] text-[13px]'}`}
          />
          <BuyButton product={product} desktop={desktop} />
        </div>
      </div>
    </article>
  );
}
