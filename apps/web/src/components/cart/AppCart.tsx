'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ImageOff, Lock, Minus, Plus, ShoppingBag, ShoppingCart, Trash2 } from 'lucide-react';
import {
  cartTotals,
  defaultCheckoutAddress,
  deliveryFee,
  deliveryLabel,
  formatMoney,
  loginHref,
  toPaise,
} from '@youmart/shared-client';
import { useAddresses } from '@/lib/addresses';
import { useCart } from '@/lib/cart';
import { skipImageOptimizer } from '@/lib/images';
import { useProductImages } from '@/lib/product-images';
import { FreeDeliveryProgress } from './FreeDeliveryProgress';

// The app's My Cart (apps/mobile/src/components/CartContent.tsx) for phones: "My Cart", one card
// per line (photo, name, price, − qty + stepper, bin, line total, Buy now for just that line) and
// the summary panel pinned above the bottom bar (free-delivery bar, subtotal, delivery, total,
// Proceed to checkout / Sign in to checkout).

export function AppCart() {
  const router = useRouter();
  const { mode, cart, setQuantity, remove } = useCart();
  const { addresses } = useAddresses();
  const imageFor = useProductImages(cart?.items.map((l) => l.productSlug) ?? []);
  const signedIn = mode === 'account';

  if (!cart) return <div aria-busy="true" className="min-h-[50vh]" />;

  if (cart.items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-[16px] px-[24px] text-center">
        <ShoppingCart aria-hidden="true" className="size-[64px] text-card-border" strokeWidth={1.5} />
        <p className="font-ui text-[20px] font-bold text-black">Your Cart is Empty</p>
        <Link href="/" className="rounded-[10px] bg-brand px-[28px] py-[12px] font-ui text-[15px] font-semibold text-white">
          Start shopping
        </Link>
      </div>
    );
  }

  const deliverTo = signedIn && addresses ? defaultCheckoutAddress(addresses) : null;
  const fee = deliveryFee(cart.subtotal, deliverTo);
  const totals = cartTotals(cart, fee ?? '0.00');

  return (
    <div className="pb-[250px]">
      <h1 className="px-[12px] pb-[8px] pt-[10px] font-ui text-[20px] font-bold text-heading">My Cart</h1>
      <ul className="flex flex-col gap-[8px] px-[12px]">
        {cart.items.map((line) => {
          const img = imageFor(line.productSlug);
          return (
            <li key={line.cartItemId} className="flex gap-[10px] rounded-[10px] border border-cart-border bg-white px-[10px] py-[9px]">
              <Link href={`/product/${line.productSlug}`} className="relative size-[72px] shrink-0 overflow-hidden rounded-[8px] bg-[#f4f7fd]">
                {img ? (
                  <Image src={img} alt="" fill sizes="72px" unoptimized={skipImageOptimizer(img)} className="object-contain" />
                ) : (
                  <ImageOff aria-hidden="true" className="absolute inset-0 m-auto size-[22px] text-card-border" />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                <Link href={`/product/${line.productSlug}`} className="line-clamp-2 font-ui text-[13.5px] font-medium text-black">
                  {line.title}
                </Link>
                <p className="text-[12.5px] text-ink-body">{formatMoney(line.priceSnapshot)}</p>
                <div className="mt-[2px] flex items-center justify-between">
                  <div className="flex items-center rounded-[8px] border border-cart-border">
                    <button
                      type="button"
                      aria-label={line.quantity <= 1 ? `Remove ${line.title}` : 'One less'}
                      onClick={() => (line.quantity <= 1 ? remove(line.cartItemId) : setQuantity(line.cartItemId, line.quantity - 1))}
                      className="px-[10px] py-[4px] text-brand"
                    >
                      <Minus aria-hidden="true" className="size-[16px]" />
                    </button>
                    <span className="min-w-[24px] text-center font-ui text-[14px] font-semibold text-black">{line.quantity}</span>
                    <button type="button" aria-label="One more" onClick={() => setQuantity(line.cartItemId, line.quantity + 1)} className="px-[10px] py-[4px] text-brand">
                      <Plus aria-hidden="true" className="size-[16px]" />
                    </button>
                  </div>
                  <button type="button" aria-label={`Remove ${line.title}`} onClick={() => remove(line.cartItemId)} className="p-[4px] text-cart-danger">
                    <Trash2 aria-hidden="true" className="size-[18px]" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <span className="font-ui text-[14px] font-bold text-black">{formatMoney(line.lineTotal)}</span>
                <button
                  type="button"
                  onClick={() => router.push(signedIn ? `/checkout?buy=${line.cartItemId}` : loginHref('/cart'))}
                  className="flex items-center gap-[5px] rounded-[8px] bg-brand px-[10px] py-[6px] font-ui text-[12.5px] font-semibold text-white"
                >
                  <ShoppingBag aria-hidden="true" className="size-[14px]" /> Buy now
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="fixed inset-x-0 bottom-[calc(70px+env(safe-area-inset-bottom))] z-30 flex flex-col gap-[4px] rounded-t-[18px] border-t border-cart-line bg-white px-[16px] py-[10px] shadow-[0_-6px_18px_rgba(15,23,42,0.08)]">
        <div className="[&_p]:!text-[13px]">
          <FreeDeliveryProgress subtotal={cart.subtotal} />
        </div>
        <p className="flex justify-between text-[13px] text-ink-body">
          Subtotal <span className="font-ui font-semibold text-black">{formatMoney(totals.subtotal)}</span>
        </p>
        <p className="flex justify-between text-[13px] text-ink-body">
          Delivery
          {fee !== null && toPaise(fee) === 0 ? (
            <span className="font-ui font-semibold text-[#28b463]">FREE</span>
          ) : (
            <span className={fee === null ? 'font-ui text-[12px] text-ink-muted' : 'font-ui font-semibold text-black'}>{deliveryLabel(fee)}</span>
          )}
        </p>
        <p className="mt-[1px] flex justify-between border-t border-cart-line pt-[5px] font-ui">
          <span className="text-[15px] font-bold text-black">Total</span>
          <span className="text-[16px] font-bold text-brand">{formatMoney(totals.total)}</span>
        </p>
        <button
          type="button"
          onClick={() => router.push(signedIn ? '/checkout' : loginHref('/checkout'))}
          className="mt-[6px] flex items-center justify-center gap-[8px] rounded-[10px] bg-brand py-[11px] font-ui text-[14.5px] font-semibold text-white"
        >
          {signedIn ? <ArrowRight aria-hidden="true" className="size-[16px]" /> : <Lock aria-hidden="true" className="size-[16px]" />}
          {signedIn ? 'Proceed to checkout' : 'Sign in to checkout'}
        </button>
      </div>
    </div>
  );
}
