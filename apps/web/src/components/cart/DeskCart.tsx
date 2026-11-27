'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  Check,
  ChevronRight,
  Lock,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Trash2,
  Truck,
  Undo2,
} from 'lucide-react';
import {
  FREE_DELIVERY_MIN,
  SAFE_CHECKOUT_METHODS,
  cartTotals,
  defaultCheckoutAddress,
  deliveryFee,
  deliveryLabel,
  formatMoney,
  freeDeliveryProgress,
  fromPaise,
  loginHref,
  toCardData,
  toPaise,
  type CartLine,
  type Money,
  type ProductCardData,
  type ProductListItem,
} from '@youmart/shared-client';
import { Notice } from '@/components/account/Notice';
import { TEXT_LINK } from '@/components/account/formStyles';
import { Arrows, Head, ROW, useRow } from '@/components/dhome/DesktopSections';
import { MiniProductCard } from '@/components/mhome/MiniProductCard';
import { api } from '@/lib/api';
import { useAddresses } from '@/lib/addresses';
import { useCart } from '@/lib/cart';
import { showCartToast } from '@/lib/cart-toast';
import { skipImageOptimizer } from '@/lib/images';
import { useProductImages } from '@/lib/product-images';
import { useWishlist } from '@/lib/wishlist';
import { FreeDeliveryProgress } from './FreeDeliveryProgress';

// DESKTOP (>= 1025px) cart in the app's design (apps/mobile/src/components/CartContent.tsx): the
// app's line cards (photo, name, price, − qty + stepper, bin, line total, Buy now for just that
// line) and its summary (free-delivery bar, subtotal, delivery, total, Proceed / Sign in to
// checkout), laid out Flipkart-style - items on the left, a sticky price card on the right.

const CARD = 'rounded-[24px] border border-brand-popup-border bg-white shadow-rail-card';
const money = (m: Money) => formatMoney(m);

const CARD_ICONS: Record<(typeof SAFE_CHECKOUT_METHODS)[number], string> = {
  Visa: '/placeholders/card-visa.svg',
  Mastercard: '/placeholders/card-mastercard.svg',
  'American Express': '/placeholders/card-amex.svg',
  Discover: '/placeholders/card-discover.svg',
};

/** The catalog card for each cart line's product (M.R.P., category) - one request per new set. */
function useLineCards(lines: readonly CartLine[]) {
  const [cards, setCards] = useState<Record<string, ProductListItem>>({});
  const key = [...new Set(lines.map((l) => l.productId))].sort().join(',');
  useEffect(() => {
    const missing = key.split(',').filter((id) => id && !(id in cards));
    if (missing.length === 0) return;
    let active = true;
    api.catalog
      .productCards(missing)
      .then(({ items }) => active && setCards((prev) => ({ ...prev, ...Object.fromEntries(items.map((i) => [i.id, i])) })))
      .catch(() => undefined);
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the product set changes
  }, [key]);
  return cards;
}

export function DeskCart() {
  const router = useRouter();
  const { mode, cart, notice, setQuantity, remove, restore, dismissNotice, reload } = useCart();
  const { addresses } = useAddresses();
  const wishlist = useWishlist();
  const imageFor = useProductImages(cart?.items.map((l) => l.productSlug) ?? []);
  const cards = useLineCards(cart?.items ?? []);
  const [removed, setRemoved] = useState<{ line: CartLine; index: number } | null>(null);
  const signedIn = mode === 'account';

  if (!cart) {
    if (mode === 'account' && notice?.tone === 'error') {
      return (
        <div className="mt-[24px]">
          <Notice tone="error">
            {notice.message}{' '}
            <button type="button" onClick={reload} className={TEXT_LINK}>
              Try again
            </button>
          </Notice>
        </div>
      );
    }
    return <div aria-busy="true" aria-label="Loading your cart" className="min-h-[420px]" />;
  }

  const deliverTo = signedIn && addresses ? defaultCheckoutAddress(addresses) : null;
  const fee = deliveryFee(cart.subtotal, deliverTo);
  const totals = cartTotals(cart, fee ?? '0.00');
  const freeFee = fee !== null && toPaise(fee) === 0;
  // M.R.P. is known when the catalog card is for the same option as the line.
  const mrpOf = (line: CartLine): Money | null => {
    const c = cards[line.productId];
    return c && c.skuId === line.skuId && toPaise(c.mrp) > toPaise(line.priceSnapshot) ? c.mrp : null;
  };
  const mrpTotal = cart.items.reduce((n, l) => n + toPaise(mrpOf(l) ?? l.priceSnapshot) * l.quantity, 0);
  const savings = mrpTotal - toPaise(cart.subtotal);

  const onRemove = (line: CartLine) => {
    setRemoved({ line, index: cart.items.findIndex((i) => i.cartItemId === line.cartItemId) });
    remove(line.cartItemId);
  };
  const saveForLater = async (line: CartLine) => {
    const ok = await wishlist.add({
      skuId: line.skuId,
      productId: line.productId,
      productSlug: line.productSlug,
      title: line.title,
      price: line.priceSnapshot,
      mrp: mrpOf(line) ?? line.priceSnapshot,
    });
    if (ok) {
      remove(line.cartItemId);
      showCartToast({ tone: 'success', message: 'Moved to your Favourites.', action: { href: '/wishlist', label: 'View Favourites' } });
    }
  };
  const buyNow = (line: CartLine) => router.push(signedIn ? `/checkout?buy=${line.cartItemId}` : loginHref('/cart'));
  const checkout = () => router.push(signedIn ? '/checkout' : loginHref('/checkout'));

  const notices = (
    <>
      {notice ? (
        <div className="mb-[16px]">
          <Notice tone={notice.tone}>
            {notice.message}
            {notice.details?.length ? (
              <ul className="mt-[4px] list-disc pl-[18px]">
                {notice.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            ) : null}{' '}
            <button type="button" onClick={dismissNotice} className={TEXT_LINK}>
              Dismiss
            </button>
          </Notice>
        </div>
      ) : null}
      {removed ? (
        <div className="mb-[16px] flex items-center gap-[12px] rounded-[16px] border border-brand-popup-border bg-white px-[16px] py-[12px] font-ui shadow-rail-card">
          <span className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-[#fff1f1] text-[#e11d48]">
            <Trash2 aria-hidden="true" className="size-[16px]" />
          </span>
          <p className="min-w-0 flex-1 truncate text-[14px] text-ink-body">
            Removed <span className="font-semibold text-heading">{removed.line.title}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              restore(removed.line, removed.index);
              setRemoved(null);
            }}
            className="flex items-center gap-[6px] rounded-full bg-brand-popup-bg px-[14px] py-[7px] text-[13px] font-bold text-brand hover:bg-brand hover:text-white"
          >
            <Undo2 aria-hidden="true" className="size-[14px]" /> Undo
          </button>
        </div>
      ) : null}
    </>
  );

  if (cart.items.length === 0) {
    return (
      <>
        <Steps />
        {notices}
        <div className={`${CARD} mx-auto mt-[8px] flex max-w-[760px] flex-col items-center px-[32px] py-[56px] text-center font-ui`}>
          <span className="relative flex size-[120px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#eaf1ff_0%,#f6f9ff_100%)]">
            <ShoppingCart aria-hidden="true" className="size-[54px] text-brand" strokeWidth={1.6} />
            <span className="absolute -right-[4px] top-[10px] flex size-[34px] items-center justify-center rounded-full bg-[#ffd60a] text-[16px] font-bold text-[#1f1300]">0</span>
          </span>
          <h2 className="mt-[22px] text-[28px] font-bold text-heading">Your Cart is Empty</h2>
          <p className="mt-[6px] max-w-[440px] text-[15px] leading-[1.55] text-ink-muted">
            Looks like you haven&rsquo;t added anything yet. Explore lakhs of products across every category.
          </p>
          <div className="mt-[24px] flex gap-[12px]">
            <Link href="/" className="flex h-[48px] items-center gap-[8px] rounded-[14px] bg-brand px-[28px] text-[15px] font-bold text-white shadow-[0_8px_14px_rgba(1,66,170,0.3)] hover:bg-[#013a96]">
              Start shopping <ArrowRight aria-hidden="true" className="size-[17px]" />
            </Link>
            <Link href="/wishlist" className="flex h-[48px] items-center gap-[8px] rounded-[14px] border border-brand-popup-border bg-white px-[22px] text-[15px] font-bold text-heading hover:border-brand hover:text-brand">
              <Bookmark aria-hidden="true" className="size-[17px]" /> My Favourites
            </Link>
          </div>
        </div>
      </>
    );
  }

  const firstCategory = cards[cart.items[0]!.productId]?.category.slug ?? null;
  const unlocked = freeDeliveryProgress(cart.subtotal).unlocked;

  return (
    <>
      <Steps />
      <div className="grid grid-cols-[minmax(0,1fr)_400px] items-start gap-[28px]">
        <div className="min-w-0">
          {notices}

          {/* The app's free-delivery nudge, as a banner. */}
          <div className="mb-[16px] flex items-center gap-[16px] rounded-[20px] bg-[linear-gradient(120deg,#0b1f4d_0%,#0142aa_60%,#2f6fe0_100%)] px-[20px] py-[16px] shadow-[0_12px_24px_-12px_rgba(1,66,170,0.55)]">
            <span className="flex size-[48px] shrink-0 items-center justify-center rounded-[14px] bg-white/[0.14] text-[#ffd23f]">
              <Truck aria-hidden="true" className="size-[24px]" />
            </span>
            <div className="min-w-0 flex-1">
              {unlocked ? <p className="mb-[4px] font-ui text-[15px] font-bold text-white">🎉 You&rsquo;ve unlocked FREE delivery!</p> : null}
              <FreeDeliveryProgress subtotal={cart.subtotal} tone="dark" />
            </div>
          </div>

          <section aria-labelledby="cart-items" className={`${CARD} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-cart-line px-[24px] py-[16px]">
              <h2 id="cart-items" className="font-ui text-[18px] font-bold text-heading">
                {cart.itemCount} item{cart.itemCount === 1 ? '' : 's'} in your cart
              </h2>
              <DeliverTo address={deliverTo} signedIn={signedIn} />
            </div>
            <ul>
              {cart.items.map((line) => {
                const img = imageFor(line.productSlug);
                const mrp = mrpOf(line);
                const off = mrp ? Math.round((1 - Number(line.priceSnapshot) / Number(mrp)) * 100) : 0;
                return (
                  <li key={line.cartItemId} className="flex gap-[20px] border-b border-cart-line px-[24px] py-[20px] last:border-b-0">
                    <Link href={`/product/${line.productSlug}`} className="relative size-[120px] shrink-0 overflow-hidden rounded-[18px] border border-cart-line bg-[#f6f9ff]">
                      <Image src={img} alt="" fill sizes="120px" unoptimized={skipImageOptimizer(img)} className="object-contain p-[8px]" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col font-ui">
                      <Link href={`/product/${line.productSlug}`} className="line-clamp-2 text-[15.5px] font-semibold leading-[1.4] text-heading hover:text-brand">
                        {line.title}
                      </Link>
                      <div className="mt-[6px] flex flex-wrap items-baseline gap-x-[8px]">
                        <span className="text-[17px] font-bold text-heading">{money(line.priceSnapshot)}</span>
                        {mrp ? <del className="text-[13px] text-ink-muted">{money(mrp)}</del> : null}
                        {off > 0 ? <span className="text-[13px] font-bold text-[#e11d48]">{off}% off</span> : null}
                      </div>
                      <p className="mt-[4px] flex items-center gap-[5px] text-[12.5px] text-[#15803d]">
                        <Check aria-hidden="true" className="size-[13px]" strokeWidth={3} /> In your cart · delivered by YouMart
                      </p>
                      <div className="mt-auto flex flex-wrap items-center gap-[10px] pt-[12px]">
                        <div className="flex items-center rounded-[12px] border border-brand-popup-border">
                          <button
                            type="button"
                            aria-label={line.quantity <= 1 ? `Remove ${line.title}` : 'One less'}
                            onClick={() => {
                              setRemoved(null);
                              if (line.quantity <= 1) onRemove(line);
                              else setQuantity(line.cartItemId, line.quantity - 1);
                            }}
                            className="flex size-[36px] items-center justify-center text-brand hover:bg-brand-popup-bg"
                          >
                            <Minus aria-hidden="true" className="size-[16px]" />
                          </button>
                          <span className="min-w-[36px] text-center text-[15px] font-bold text-heading">{line.quantity}</span>
                          <button
                            type="button"
                            aria-label="One more"
                            onClick={() => {
                              setRemoved(null);
                              setQuantity(line.cartItemId, line.quantity + 1);
                            }}
                            className="flex size-[36px] items-center justify-center text-brand hover:bg-brand-popup-bg"
                          >
                            <Plus aria-hidden="true" className="size-[16px]" />
                          </button>
                        </div>
                        <button type="button" onClick={() => void saveForLater(line)} className="flex h-[36px] items-center gap-[6px] rounded-[12px] px-[12px] text-[13px] font-semibold text-ink-body hover:bg-brand-popup-bg hover:text-brand">
                          <Bookmark aria-hidden="true" className="size-[15px]" /> Save for later
                        </button>
                        <button type="button" onClick={() => onRemove(line)} className="flex h-[36px] items-center gap-[6px] rounded-[12px] px-[12px] text-[13px] font-semibold text-ink-body hover:bg-[#fff1f1] hover:text-[#e11d48]">
                          <Trash2 aria-hidden="true" className="size-[15px]" /> Remove
                        </button>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end justify-between font-ui">
                      <div className="text-right">
                        <p className="text-[12px] text-ink-muted">Item total</p>
                        <p className="text-[19px] font-bold text-heading">{money(line.lineTotal)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => buyNow(line)}
                        aria-label={`Buy now: ${line.title}`}
                        className="flex h-[38px] items-center gap-[6px] rounded-[12px] bg-[#ffd60a] px-[14px] text-[13.5px] font-bold text-[#1f1300] shadow-[0_6px_12px_rgba(255,214,10,0.35)] hover:brightness-95"
                      >
                        <ShoppingBag aria-hidden="true" className="size-[15px]" /> Buy this now
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center justify-between bg-[#f6f9ff] px-[24px] py-[14px] font-ui">
              <Link href="/" className="flex items-center gap-[6px] text-[14px] font-bold text-brand hover:underline">
                <ChevronRight aria-hidden="true" className="size-[15px] rotate-180" /> Continue shopping
              </Link>
              <button type="button" onClick={checkout} className="flex h-[44px] items-center gap-[8px] rounded-[14px] bg-brand px-[22px] text-[14.5px] font-bold text-white hover:bg-[#013a96]">
                {signedIn ? 'Place order' : 'Sign in to checkout'} <ArrowRight aria-hidden="true" className="size-[16px]" />
              </button>
            </div>
          </section>
        </div>

        <aside aria-label="Price details" className="sticky top-[16px] flex flex-col gap-[16px] font-ui">
          <div className={`${CARD} p-[22px]`}>
            <p className="text-[12.5px] font-bold uppercase tracking-[1px] text-ink-muted">Price details</p>
            <dl className="mt-[14px] space-y-[12px] text-[14.5px]">
              <div className="flex justify-between">
                <dt className="text-ink-body">
                  Price ({cart.itemCount} item{cart.itemCount === 1 ? '' : 's'})
                </dt>
                <dd className="font-semibold text-heading">{savings > 0 ? money(fromPaise(mrpTotal)) : money(totals.subtotal)}</dd>
              </div>
              {savings > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-ink-body">Discount</dt>
                  <dd className="font-semibold text-[#15803d]">− {money(fromPaise(savings))}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-ink-body">Delivery</dt>
                {freeFee ? (
                  <dd className="font-bold text-[#28b463]">FREE</dd>
                ) : (
                  <dd className={fee === null ? 'text-right text-[13px] text-ink-muted' : 'font-semibold text-heading'}>{deliveryLabel(fee)}</dd>
                )}
              </div>
              {fee === null ? (
                <p className="rounded-[12px] bg-brand-popup-bg px-[12px] py-[8px] text-[12.5px] leading-[1.45] text-ink-body">
                  {signedIn ? 'Add a delivery address to see the exact charge.' : 'Sign in to see the delivery charge for your address.'} Free on orders over {money(FREE_DELIVERY_MIN).replace(/\.00$/, '')}.
                </p>
              ) : null}
            </dl>
            <div className="mt-[14px] flex items-baseline justify-between border-t border-dashed border-brand-popup-border pt-[14px]">
              <span className="text-[17px] font-bold text-heading">Total amount</span>
              <span className="text-[24px] font-bold text-brand">{money(totals.total)}</span>
            </div>
            {savings > 0 ? (
              <p className="mt-[12px] flex items-center gap-[8px] rounded-[12px] bg-[#e8f8ee] px-[12px] py-[9px] text-[13.5px] font-bold text-[#15803d]">
                <Tag aria-hidden="true" className="size-[15px]" /> You save {money(fromPaise(savings))} on this order
              </p>
            ) : null}
            <button
              type="button"
              onClick={checkout}
              className="mt-[16px] flex h-[54px] w-full items-center justify-center gap-[8px] rounded-[16px] bg-brand text-[16px] font-bold text-white shadow-[0_10px_18px_rgba(1,66,170,0.32)] hover:bg-[#013a96]"
            >
              {signedIn ? <ArrowRight aria-hidden="true" className="size-[18px]" /> : <Lock aria-hidden="true" className="size-[17px]" />}
              {signedIn ? 'Proceed to checkout' : 'Sign in to checkout'}
            </button>
            <ul className="mt-[14px] flex justify-center gap-[8px]">
              {SAFE_CHECKOUT_METHODS.map((m) => (
                <li key={m}>
                  <Image src={CARD_ICONS[m]} alt={m} width={40} height={25} unoptimized />
                </li>
              ))}
            </ul>
          </div>
          <ul className={`${CARD} space-y-[12px] p-[18px]`}>
            {[
              { Icon: ShieldCheck, title: 'Safe & secure payments', text: 'UPI, cards, net banking or cash on delivery' },
              { Icon: RotateCcw, title: 'Easy returns', text: 'Hassle-free returns & refunds' },
              { Icon: BadgeCheck, title: '100% genuine products', text: 'Quality-checked by YouMart' },
            ].map(({ Icon, title, text }) => (
              <li key={title} className="flex items-center gap-[12px]">
                <span className="flex size-[38px] shrink-0 items-center justify-center rounded-[12px] bg-brand-popup-bg text-brand">
                  <Icon aria-hidden="true" className="size-[18px]" />
                </span>
                <span>
                  <span className="block text-[13.5px] font-bold text-heading">{title}</span>
                  <span className="block text-[12px] text-ink-muted">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {firstCategory ? <AlsoLike category={firstCategory} exclude={cart.items.map((l) => l.productId)} /> : null}
    </>
  );
}

/** Cart → Address → Payment, the cart step current. */
function Steps() {
  const steps = ['My Cart', 'Address', 'Payment'];
  return (
    <div className="mb-[20px] flex items-center justify-between">
      <h1 className="font-ui text-[28px] font-bold text-heading">My Cart</h1>
      <ol className="flex items-center gap-[10px] font-ui">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-[10px]">
            <span className={`flex items-center gap-[8px] rounded-full px-[14px] py-[7px] text-[13.5px] font-bold ${i === 0 ? 'bg-brand text-white shadow-[0_6px_12px_rgba(1,66,170,0.3)]' : 'bg-white text-ink-muted ring-1 ring-brand-popup-border'}`}>
              <span className={`flex size-[20px] items-center justify-center rounded-full text-[11.5px] ${i === 0 ? 'bg-white text-brand' : 'bg-brand-popup-bg text-brand'}`}>{i + 1}</span>
              {s}
            </span>
            {i < steps.length - 1 ? <span aria-hidden="true" className="h-[2px] w-[36px] rounded-full bg-brand-popup-border" /> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function DeliverTo({ address, signedIn }: { address: { fullName: string; city: string; state: string; pincode?: string } | null; signedIn: boolean }) {
  if (address) {
    return (
      <span className="flex max-w-[380px] items-center gap-[8px] rounded-full bg-brand-popup-bg px-[12px] py-[6px] font-ui text-[13px] text-ink-body">
        <MapPin aria-hidden="true" className="size-[15px] shrink-0 text-brand" />
        <span className="truncate">
          Deliver to <span className="font-bold text-heading">{address.fullName}</span>, {address.city}
          {address.pincode ? ` - ${address.pincode}` : ''}
        </span>
      </span>
    );
  }
  return (
    <Link
      href={signedIn ? '/account/addresses' : loginHref('/cart')}
      className="flex items-center gap-[8px] rounded-full bg-brand-popup-bg px-[12px] py-[6px] font-ui text-[13px] font-semibold text-brand hover:bg-brand hover:text-white"
    >
      <MapPin aria-hidden="true" className="size-[15px]" />
      {signedIn ? 'Add a delivery address' : 'Sign in to set delivery address'}
    </Link>
  );
}

/** "You may also like": top-rated products from the first item's category. */
function AlsoLike({ category, exclude }: { category: string; exclude: string[] }) {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const row = useRow();
  const skip = useMemo(() => new Set(exclude), [exclude]);
  useEffect(() => {
    let active = true;
    api.catalog
      .listProducts({ category, sort: 'rating', limit: 20 })
      .then((page) => active && setProducts(page.items.map(toCardData)))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [category]);
  const shown = products.filter((p) => !skip.has(p.id));
  const { onScroll } = row;
  useEffect(() => onScroll(), [shown.length, onScroll]);
  if (shown.length === 0) return null;
  return (
    <section className={`mt-[28px] ${CARD} p-[24px]`}>
      <Head title="You may also like" sub="Top picks to go with your cart" right={<Arrows edges={row.edges} page={row.page} />} />
      <div ref={row.ref} onScroll={row.onScroll} className={`${ROW} !gap-[16px]`}>
        {shown.map((p) => (
          <div key={p.id} className="w-[calc((100%-80px)/6)] shrink-0 snap-start">
            <MiniProductCard product={p} size="desktop" />
          </div>
        ))}
      </div>
    </section>
  );
}
