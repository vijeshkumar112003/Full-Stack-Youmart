'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, Check, ImageOff, Minus, Plus, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { SAFE_CHECKOUT_METHODS, formatMoney, type Money } from '@youmart/shared-client';
import { api } from '@/lib/api';
import { skipImageOptimizer } from '@/lib/images';

// DESKTOP (>= 1025px) checkout pieces in the app's design (apps/mobile/src/app/checkout.tsx):
// numbered step cards on the left (Account, Deliver to, Payment method, Order summary) and a
// sticky Price details card on the right. CheckoutView keeps all the order / payment logic.

export const DESK_CARD = 'rounded-[24px] border border-brand-popup-border bg-white shadow-rail-card';

export const DESK_PILL =
  'mb-[10px] flex h-[54px] w-full items-center justify-center gap-[8px] rounded-[16px] bg-brand px-[20px] font-ui text-[16px] font-bold text-white shadow-[0_10px_18px_rgba(1,66,170,0.32)] transition-colors hover:bg-[#013a96] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70';

/** Matches the `lg` breakpoint (1025px), so checkout renders one layout, not both. */
export function useDesktop(): boolean {
  const [desk, setDesk] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1025px)');
    const update = () => setDesk(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return desk;
}

/** My Cart ✓ → Checkout → Done. */
export function DeskCheckoutSteps({ paying }: { paying: boolean }) {
  const steps = [
    { label: 'My Cart', href: '/cart', state: 'done' as const },
    { label: paying ? 'Payment' : 'Address & Payment', href: null, state: 'on' as const },
    { label: 'Order placed', href: null, state: 'next' as const },
  ];
  return (
    <div className="mb-[20px] flex items-center justify-between">
      <div className="flex items-center gap-[12px]">
        <span aria-hidden="true" className="h-[44px] w-[5px] rounded-[3px] bg-brand" />
        <div>
          <h1 className="font-ui text-[28px] font-bold leading-[34px] text-heading">Checkout</h1>
          <p className="font-ui text-[14px] font-medium text-ink-muted">Safe & secure - just a few steps</p>
        </div>
      </div>
      <ol className="flex items-center gap-[10px] font-ui">
        {steps.map((s, i) => {
          const chip = (
            <span
              className={`flex items-center gap-[8px] rounded-full px-[14px] py-[7px] text-[13.5px] font-bold ${
                s.state === 'on'
                  ? 'bg-brand text-white shadow-[0_6px_12px_rgba(1,66,170,0.3)]'
                  : s.state === 'done'
                    ? 'bg-[#e8f8ee] text-[#15803d]'
                    : 'bg-white text-ink-muted ring-1 ring-brand-popup-border'
              }`}
            >
              <span
                className={`flex size-[20px] items-center justify-center rounded-full text-[11.5px] ${
                  s.state === 'on' ? 'bg-white text-brand' : s.state === 'done' ? 'bg-[#16a34a] text-white' : 'bg-brand-popup-bg text-brand'
                }`}
              >
                {s.state === 'done' ? <Check aria-hidden="true" className="size-[12px]" strokeWidth={3} /> : i + 1}
              </span>
              {s.label}
            </span>
          );
          return (
            <li key={s.label} className="flex items-center gap-[10px]">
              {s.href ? <Link href={s.href}>{chip}</Link> : chip}
              {i < steps.length - 1 ? <span aria-hidden="true" className="h-[2px] w-[32px] rounded-full bg-brand-popup-border" /> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** A numbered step card; the number turns into a green tick once the step is done. */
export function StepCard({
  id,
  index,
  title,
  done,
  right,
  children,
}: {
  id: string;
  index: number;
  title: string;
  done: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={`${DESK_CARD} p-[22px] font-ui`}>
      <div className="mb-[16px] flex items-center gap-[12px]">
        <span
          aria-hidden="true"
          className={`flex size-[32px] shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white ${done ? 'bg-[#16a34a]' : 'bg-brand'}`}
        >
          {done ? <Check className="size-[17px]" strokeWidth={3} /> : index}
        </span>
        <h2 id={id} className="flex-1 text-[19px] font-bold text-heading">
          {title}
          {done ? <span className="sr-only"> (done)</span> : null}
        </h2>
        {right}
      </div>
      {children}
    </section>
  );
}

/** Product photos for order / cart lines by product id (one catalog request per new set). */
export function useLineImages(productIds: readonly string[]): Record<string, string | null> {
  const [images, setImages] = useState<Record<string, string | null>>({});
  const key = [...new Set(productIds)].sort().join(',');
  useEffect(() => {
    const missing = key.split(',').filter((id) => id && !(id in images));
    if (missing.length === 0) return;
    let active = true;
    api.catalog
      .productCards(missing)
      .then(({ items }) => {
        if (!active) return;
        setImages((prev) => {
          const next = { ...prev };
          for (const id of missing) next[id] = null;
          for (const item of items) next[item.id] = item.imageUrl;
          return next;
        });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only for new products
  }, [key]);
  return images;
}

export interface DeskLine {
  key: string;
  productId: string;
  title: string;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
}

export function DeskItems({
  lines,
  editable,
  onQuantity,
}: {
  lines: readonly DeskLine[];
  editable: boolean;
  onQuantity: (key: string, quantity: number) => void;
}) {
  const images = useLineImages(lines.map((l) => l.productId));
  return (
    <ul className="flex flex-col gap-[10px]">
      {lines.map((l) => {
        const img = images[l.productId];
        return (
          <li key={l.key} className="flex items-center gap-[14px] rounded-[16px] bg-[#f8faff] p-[10px]">
            <span className="relative flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-cart-line bg-white">
              {img ? (
                <Image src={img} alt="" fill sizes="72px" unoptimized={skipImageOptimizer(img)} className="object-contain p-[5px]" />
              ) : (
                <ImageOff aria-hidden="true" className="size-[20px] text-card-border" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[14.5px] font-semibold leading-[20px] text-heading">{l.title}</p>
              <p className="mt-[3px] text-[12.5px] text-ink-muted">{formatMoney(l.unitPrice)} each</p>
            </div>
            {editable ? (
              <span className="flex items-center rounded-[12px] border border-brand-popup-border bg-white">
                <button
                  type="button"
                  onClick={() => onQuantity(l.key, l.quantity - 1)}
                  aria-label={l.quantity <= 1 ? `Remove ${l.title}` : 'Decrease quantity'}
                  className={`flex size-[34px] items-center justify-center rounded-l-[12px] hover:bg-brand-popup-bg ${l.quantity <= 1 ? 'text-[#e11d48]' : 'text-brand'}`}
                >
                  {l.quantity <= 1 ? <Trash2 aria-hidden="true" className="size-[15px]" /> : <Minus aria-hidden="true" className="size-[15px]" />}
                </button>
                <span className="min-w-[30px] text-center text-[14.5px] font-bold text-heading">{l.quantity}</span>
                <button
                  type="button"
                  onClick={() => onQuantity(l.key, l.quantity + 1)}
                  aria-label="Increase quantity"
                  className="flex size-[34px] items-center justify-center rounded-r-[12px] text-brand hover:bg-brand-popup-bg"
                >
                  <Plus aria-hidden="true" className="size-[15px]" />
                </button>
              </span>
            ) : (
              <span className="rounded-full bg-white px-[10px] py-[4px] text-[13px] font-bold text-heading ring-1 ring-cart-line">× {l.quantity}</span>
            )}
            <span className="w-[100px] shrink-0 text-right text-[15.5px] font-bold text-heading">{formatMoney(l.lineTotal)}</span>
          </li>
        );
      })}
    </ul>
  );
}

const CARD_ICONS: Record<(typeof SAFE_CHECKOUT_METHODS)[number], string> = {
  Visa: '/placeholders/card-visa.svg',
  Mastercard: '/placeholders/card-mastercard.svg',
  'American Express': '/placeholders/card-amex.svg',
  Discover: '/placeholders/card-discover.svg',
};

export function DeskTrust() {
  return (
    <>
      <ul className="mt-[6px] flex justify-center gap-[8px]">
        {SAFE_CHECKOUT_METHODS.map((m) => (
          <li key={m}>
            <Image src={CARD_ICONS[m]} alt={m} width={40} height={25} unoptimized />
          </li>
        ))}
      </ul>
      <ul className={`${DESK_CARD} mt-[16px] space-y-[12px] p-[18px] font-ui`}>
        {[
          { Icon: ShieldCheck, title: 'Safe & secure payments', text: 'Razorpay - YouMart never sees your card or UPI' },
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
    </>
  );
}
