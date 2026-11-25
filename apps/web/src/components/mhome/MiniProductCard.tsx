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

function BuyButton({ product }: { product: ProductCardData }) {
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
      className="flex h-[30px] w-full items-center justify-center gap-[5px] rounded-[8px] bg-[#ffd814] font-ui text-[13px] font-bold text-heading active:scale-[0.97] disabled:opacity-60"
    >
      <ShoppingBag aria-hidden="true" className="size-[14px]" strokeWidth={2.4} />
      Buy
    </button>
  );
}

export function MiniProductCard({ product }: { product: ProductCardData }) {
  const off = discountPercent(product.mrp, product.sellingPrice);
  const { skuId, slug } = product;
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-[14px] border border-card-border bg-white">
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
          sizes="34vw"
          unoptimized={skipImageOptimizer(product.image)}
          className="object-contain p-[6px]"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-[4px] px-[7px] pb-[8px] pt-[4px]">
        <Link href={product.href} className="line-clamp-2 min-h-[34px] text-[12.5px] leading-[17px] text-black">
          {product.title}
        </Link>
        <Stars rating={product.rating} />
        <div className="flex flex-wrap items-baseline gap-x-[4px]">
          <span className="font-ui text-[14px] font-bold text-heading">{formatMoney(product.sellingPrice)}</span>
          {off > 0 ? (
            <span className="text-[11px] text-ink-muted line-through">{formatMoney(product.mrp)}</span>
          ) : null}
        </div>
        {off > 0 ? <span className="font-ui text-[11.5px] font-bold text-[#e11d48]">{off}% OFF</span> : null}
        <div className="mt-auto flex flex-col gap-[5px] pt-[4px]">
          <AddToCartButton
            product={product}
            className="flex h-[30px] w-full items-center justify-center gap-[5px] rounded-[8px] bg-brand font-ui text-[13px] font-bold text-white active:scale-[0.97]"
          />
          <BuyButton product={product} />
        </div>
      </div>
    </article>
  );
}
