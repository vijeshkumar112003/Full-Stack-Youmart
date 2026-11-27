'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BadgePercent,
  Check,
  CircleCheck,
  ClipboardCopy,
  Clock,
  Copy,
  Info,
  ShoppingCart,
  Sparkles,
  TicketPercent,
} from 'lucide-react';
import { formatMoney, toPaise, type AvailableCoupon, type Money } from '@youmart/shared-client';

// DESKTOP (>= 1025px) Coupons in the app's design (apps/mobile/src/app/coupons.tsx): a brand hero,
// how-to steps, tabs (all / fit your cart / need a bigger cart) and ticket-style coupon cards.

type Tab = 'all' | 'usable' | 'locked';

const off = (c: AvailableCoupon) =>
  c.discountType === 'PERCENT' ? `${Number(c.discountValue)}%` : `₹${Number(c.discountValue)}`;

const until = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

/** Ends within 3 days: shown as "Ends soon". */
const endingSoon = (iso: string | null) =>
  Boolean(iso) && new Date(iso!).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

const money = (m: Money | null) => (m && toPaise(m) > 0 ? formatMoney(m) : null);

export function DeskCoupons({
  items,
  cartSubtotal,
}: {
  items: AvailableCoupon[];
  /** The cart's subtotal when it has items (then each coupon says whether it fits). */
  cartSubtotal: Money | null;
}) {
  const [tab, setTab] = useState<Tab>('all');
  const [copied, setCopied] = useState<string | null>(null);
  const withCart = Boolean(cartSubtotal);
  const usable = items.filter((c) => c.applicable);
  const locked = items.filter((c) => !c.applicable);
  const shown = !withCart || tab === 'all' ? items : tab === 'usable' ? usable : locked;
  const best = withCart
    ? usable.reduce<AvailableCoupon | null>(
        (b, c) => (!b || toPaise(c.discount) > toPaise(b.discount) ? c : b),
        null,
      )
    : null;

  const copy = (code: string) => {
    void navigator.clipboard?.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  return (
    <div className="font-ui">
      <section className="relative mb-[18px] overflow-hidden rounded-[24px] bg-[linear-gradient(120deg,#0142aa_0%,#1d5fd1_60%,#3b82f6_100%)] px-[30px] py-[26px] text-white shadow-[0_14px_32px_rgba(1,66,170,0.25)]">
        <span aria-hidden="true" className="absolute -right-[50px] -top-[70px] size-[220px] rounded-full bg-white/10" />
        <TicketPercent aria-hidden="true" className="absolute bottom-[-18px] right-[36px] size-[130px] rotate-[-14deg] text-white/10" />
        <div className="relative flex items-center gap-[20px]">
          <span className="flex size-[64px] shrink-0 items-center justify-center rounded-[20px] bg-white/15">
            <BadgePercent aria-hidden="true" className="size-[32px]" />
          </span>
          <div className="flex-1">
            <h1 className="text-[28px] font-bold leading-[34px]">Coupons & offers</h1>
            <p className="mt-[2px] text-[15px] text-white/85">
              {items.length} offer{items.length === 1 ? '' : 's'} running now - copy a code and use it at checkout.
            </p>
          </div>
          {best ? (
            <div className="rounded-[18px] bg-white px-[18px] py-[12px] text-heading">
              <p className="text-[12px] font-bold uppercase tracking-[0.8px] text-ink-muted">Best for your cart</p>
              <p className="text-[22px] font-bold text-[#15803d]">Save {formatMoney(best.discount)}</p>
              <p className="text-[13px] font-semibold text-brand">with {best.code}</p>
            </div>
          ) : null}
        </div>
      </section>

      <ol className="mb-[18px] grid grid-cols-3 gap-[12px]">
        {[
          { Icon: ClipboardCopy, title: 'Copy a code', text: 'Tap the code on any offer' },
          { Icon: ShoppingCart, title: 'Go to checkout', text: 'Add items and open checkout' },
          { Icon: Sparkles, title: 'Apply & save', text: 'Paste it under “Have a coupon?”' },
        ].map(({ Icon, title, text }, i) => (
          <li key={title} className="flex items-center gap-[12px] rounded-[18px] border border-brand-popup-border bg-white px-[16px] py-[12px] shadow-rail-card">
            <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[12px] bg-brand-popup-bg text-brand">
              <Icon aria-hidden="true" className="size-[19px]" />
            </span>
            <span>
              <span className="block text-[14px] font-bold text-heading">
                {i + 1}. {title}
              </span>
              <span className="block text-[12.5px] text-ink-muted">{text}</span>
            </span>
          </li>
        ))}
      </ol>

      {withCart ? (
        <div role="tablist" aria-label="Filter coupons" className="mb-[16px] flex gap-[10px]">
          {(
            [
              ['all', `All offers (${items.length})`],
              ['usable', `Fit your cart (${usable.length})`],
              ['locked', `Add more to unlock (${locked.length})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`rounded-full px-[16px] py-[8px] text-[14px] font-bold transition-colors ${
                tab === id
                  ? 'bg-brand text-white shadow-[0_6px_12px_rgba(1,66,170,0.3)]'
                  : 'bg-white text-heading ring-1 ring-brand-popup-border hover:ring-brand'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <p className="mb-[16px] flex items-center gap-[8px] rounded-[14px] bg-brand-popup-bg px-[14px] py-[10px] text-[13.5px] text-heading">
          <Info aria-hidden="true" className="size-[16px] shrink-0 text-brand" />
          Add items to your cart to see which offers fit it and how much you save.
        </p>
      )}

      {shown.length === 0 ? (
        <div className="flex flex-col items-center rounded-[24px] border border-brand-popup-border bg-white px-[20px] py-[48px] text-center shadow-rail-card">
          <TicketPercent aria-hidden="true" className="size-[52px] text-card-border" />
          <p className="mt-[10px] text-[18px] font-bold text-heading">
            {tab === 'usable' ? 'None fit your cart yet' : tab === 'locked' ? 'Nothing to unlock' : 'No offers right now'}
          </p>
          <p className="mt-[4px] text-[14px] text-ink-muted">
            {tab === 'usable'
              ? 'Add a little more to unlock an offer.'
              : tab === 'locked'
                ? 'Every offer fits your cart - nice!'
                : 'Check back soon - new coupons drop regularly.'}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-[16px] min-[1680px]:grid-cols-3">
          {shown.map((c) => {
            const min = money(c.minOrderValue);
            const cap = c.discountType === 'PERCENT' ? money(c.maxDiscount) : null;
            const end = until(c.endsAt);
            const soon = endingSoon(c.endsAt);
            const fits = withCart && c.applicable;
            const dim = withCart && !c.applicable;
            return (
              <li
                key={c.code}
                className={`flex overflow-hidden rounded-[20px] border bg-white shadow-rail-card transition-shadow hover:shadow-product-card ${
                  fits ? 'border-[#86d3a3]' : 'border-brand-popup-border'
                }`}
              >
                <div
                  className={`relative flex w-[104px] shrink-0 flex-col items-center justify-center py-[18px] text-white ${
                    dim ? 'bg-[#7d9bd0]' : 'bg-[linear-gradient(160deg,#0142aa,#2563eb)]'
                  }`}
                >
                  <span className="text-[26px] font-bold leading-none">{off(c)}</span>
                  <span className="mt-[4px] text-[12px] font-bold tracking-[0.14em] text-[#cfe3ff]">OFF</span>
                  {/* Ticket notches. */}
                  <span aria-hidden="true" className="absolute -right-[9px] -top-[9px] size-[18px] rounded-full bg-page" />
                  <span aria-hidden="true" className="absolute -bottom-[9px] -right-[9px] size-[18px] rounded-full bg-page" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col border-l-2 border-dashed border-brand-popup-border p-[16px]">
                  <div className="flex items-start justify-between gap-[8px]">
                    <p className="text-[16px] font-bold leading-[21px] text-heading">{c.title}</p>
                    {soon ? (
                      <span className="shrink-0 rounded-full bg-[#fff1e6] px-[8px] py-[2px] text-[11.5px] font-bold text-[#c2410c]">Ends soon</span>
                    ) : null}
                  </div>
                  {c.description ? <p className="mt-[4px] line-clamp-2 text-[13px] leading-[18px] text-ink-body">{c.description}</p> : null}
                  <ul className="mt-[8px] flex flex-wrap gap-x-[12px] gap-y-[2px] text-[12.5px] text-ink-muted">
                    {min ? <li>Min. order {min}</li> : <li>No minimum order</li>}
                    {cap ? <li>Up to {cap} off</li> : null}
                    {end ? (
                      <li className="flex items-center gap-[4px]">
                        <Clock aria-hidden="true" className="size-[12px]" /> Till {end}
                      </li>
                    ) : null}
                  </ul>
                  {fits ? (
                    <p className="mt-[8px] flex items-center gap-[6px] text-[13px] font-bold text-[#15803d]">
                      <CircleCheck aria-hidden="true" className="size-[15px]" />
                      Fits your cart{toPaise(c.discount) > 0 ? ` - save ${formatMoney(c.discount)}` : ''}
                    </p>
                  ) : dim && c.reason ? (
                    <p className="mt-[8px] text-[13px] font-semibold text-[#c2410c]">{c.reason}</p>
                  ) : null}
                  <div className="mt-auto flex items-center gap-[10px] pt-[12px]">
                    <button
                      type="button"
                      onClick={() => copy(c.code)}
                      aria-label={`Copy code ${c.code}`}
                      className="inline-flex items-center gap-[8px] rounded-[10px] border-[1.5px] border-dashed border-brand bg-brand-popup-bg px-[12px] py-[6px] text-[14px] font-bold tracking-[0.1em] text-brand hover:bg-white"
                    >
                      {c.code}
                      {copied === c.code ? (
                        <Check aria-hidden="true" className="size-[15px] text-[#16a34a]" />
                      ) : (
                        <Copy aria-hidden="true" className="size-[14px]" />
                      )}
                    </button>
                    <Link
                      href={fits ? '/checkout' : '/'}
                      className="ml-auto whitespace-nowrap rounded-full px-[12px] py-[6px] text-[13.5px] font-bold text-brand hover:bg-brand-popup-bg"
                    >
                      {fits ? 'Use now' : 'Shop now'}
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
