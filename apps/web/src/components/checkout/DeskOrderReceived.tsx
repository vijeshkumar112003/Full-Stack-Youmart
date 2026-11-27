'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Banknote,
  Check,
  ClipboardCheck,
  Copy,
  CreditCard,
  FileText,
  Headphones,
  House,
  MapPin,
  PackageCheck,
  ShoppingBag,
  Tag,
  Truck,
} from 'lucide-react';
import {
  addressLines,
  formatMoney,
  orderHref,
  orderOverview,
  shippingLabel,
  toPaise,
  type OrderView,
} from '@youmart/shared-client';
import { InvoiceDownload } from './InvoiceDownload';
import { DESK_CARD, DeskItems, type DeskLine } from './DeskCheckout';

// DESKTOP (>= 1025px) "order placed" screen in the app's design (apps/mobile/src/app/order-success.tsx):
// a big green tick hero, what happens next, the items with photos and the address on the left, and a
// sticky order card (details, price, invoice, actions) on the right. Phones keep OrderReceived.

const NEXT = [
  { Icon: ClipboardCheck, label: 'Order placed' },
  { Icon: PackageCheck, label: 'Packed' },
  { Icon: Truck, label: 'Shipped' },
  { Icon: House, label: 'Delivered' },
];

export function DeskOrderReceived({ order, placedAt }: { order: OrderView; placedAt: string }) {
  const [copied, setCopied] = useState(false);
  const cod = order.paymentMethod === 'COD';
  const lines: DeskLine[] = order.items.map((item) => ({
    key: item.skuId,
    productId: item.productId,
    title: item.title,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
  }));
  const units = lines.reduce((n, l) => n + l.quantity, 0);
  const saved = order.discountTotal && toPaise(order.discountTotal) > 0 ? order.discountTotal : null;
  const details = orderOverview(order, placedAt).filter(
    (row) => !['Order number', 'Coupon', 'Total'].includes(row.label),
  );

  return (
    <div className="pb-[24px] font-ui">
      {/* Hero: the app's big tick, the thank-you and the order number. */}
      <section
        role="status"
        className="relative mb-[20px] overflow-hidden rounded-[28px] bg-[linear-gradient(120deg,#0142aa_0%,#1d5fd1_55%,#3b82f6_100%)] px-[36px] py-[30px] text-white shadow-[0_18px_40px_rgba(1,66,170,0.28)]"
      >
        <span aria-hidden="true" className="absolute -right-[60px] -top-[80px] size-[260px] rounded-full bg-white/10" />
        <span aria-hidden="true" className="absolute -bottom-[90px] right-[180px] size-[200px] rounded-full bg-white/5" />
        <div className="relative flex items-center gap-[26px]">
          <span className="flex size-[88px] shrink-0 items-center justify-center rounded-full bg-[#16a34a] shadow-[0_0_0_10px_rgba(255,255,255,0.18)]">
            <Check aria-hidden="true" className="size-[48px]" strokeWidth={3} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-[32px] font-bold leading-[38px]">Order confirmed!</h1>
            <p className="mt-[4px] text-[16px] text-white/85">
              Thank you for shopping with YouMart. We&rsquo;ll let you know when it ships.
            </p>
            <p className="mt-[14px] inline-flex items-center gap-[10px] rounded-full bg-white/15 py-[6px] pl-[16px] pr-[6px] text-[14px] font-semibold">
              Order #{order.orderNumber}
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(order.orderNumber).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  });
                }}
                className="flex items-center gap-[5px] rounded-full bg-white px-[12px] py-[4px] text-[12.5px] font-bold text-brand hover:bg-brand-popup-bg"
              >
                {copied ? <Check aria-hidden="true" className="size-[13px]" /> : <Copy aria-hidden="true" className="size-[13px]" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </p>
          </div>
          <div className="w-[300px] shrink-0 rounded-[20px] bg-white px-[18px] py-[14px] text-heading">
            <p className="flex items-center gap-[8px] text-[13px] font-bold uppercase tracking-[0.8px] text-ink-muted">
              {cod ? <Banknote aria-hidden="true" className="size-[16px] text-[#16a34a]" /> : <CreditCard aria-hidden="true" className="size-[16px] text-[#16a34a]" />}
              {cod ? 'Cash on Delivery' : 'Payment confirmed'}
            </p>
            <p className="mt-[4px] text-[26px] font-bold text-brand">{formatMoney(order.grandTotal)}</p>
            <p className="text-[13px] leading-[1.45] text-ink-body">
              {cod ? 'Keep this ready (cash or UPI) when your order arrives.' : 'Paid securely - a receipt is on its way to you.'}
            </p>
          </div>
        </div>
      </section>

      {/* What happens next: the order's journey, first step done. */}
      <ol className={`${DESK_CARD} mb-[20px] flex items-center px-[28px] py-[18px]`}>
        {NEXT.map(({ Icon, label }, i) => (
          <li key={label} className="flex flex-1 items-center gap-[12px] last:flex-none">
            <span
              className={`flex size-[42px] shrink-0 items-center justify-center rounded-full ${
                i === 0 ? 'bg-[#16a34a] text-white' : 'bg-brand-popup-bg text-brand'
              }`}
            >
              <Icon aria-hidden="true" className="size-[20px]" />
            </span>
            <span>
              <span className={`block text-[14.5px] font-bold ${i === 0 ? 'text-[#15803d]' : 'text-heading'}`}>{label}</span>
              <span className="block text-[12px] text-ink-muted">{i === 0 ? 'Just now' : 'We’ll notify you'}</span>
            </span>
            {i < NEXT.length - 1 ? (
              <span aria-hidden="true" className={`mx-[16px] h-[3px] flex-1 rounded-full ${i === 0 ? 'bg-[linear-gradient(90deg,#16a34a,#dbe6fb)]' : 'bg-brand-popup-border'}`} />
            ) : null}
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-[minmax(0,1fr)_420px] items-start gap-[28px]">
        <div className="flex min-w-0 flex-col gap-[16px]">
          <section aria-labelledby="placed-items" className={`${DESK_CARD} p-[22px]`}>
            <h2 id="placed-items" className="mb-[16px] flex items-center gap-[10px] text-[19px] font-bold text-heading">
              <ShoppingBag aria-hidden="true" className="size-[20px] text-brand" />
              Items in this order ({units})
            </h2>
            <DeskItems lines={lines} editable={false} onQuantity={() => undefined} />
          </section>

          <section aria-labelledby="placed-address" className={`${DESK_CARD} p-[22px]`}>
            <h2 id="placed-address" className="mb-[14px] flex items-center gap-[10px] text-[19px] font-bold text-heading">
              <MapPin aria-hidden="true" className="size-[20px] text-brand" />
              Delivering to
            </h2>
            <address className="rounded-[16px] bg-[#f8faff] px-[16px] py-[12px] text-[14.5px] not-italic leading-[1.6] text-ink-body">
              {addressLines(order.shippingAddress).map((line, i) => (
                <span key={line} className={`block ${i === 0 ? 'font-bold text-heading' : ''}`}>
                  {line}
                </span>
              ))}
            </address>
          </section>
        </div>

        <aside aria-label="Order details" className="sticky top-[16px] flex flex-col gap-[16px]">
          <div className={`${DESK_CARD} p-[22px]`}>
            <p className="mb-[12px] text-[12.5px] font-bold uppercase tracking-[1px] text-ink-muted">Order details</p>
            <dl className="space-y-[10px] text-[14.5px]">
              {details.map((row) => (
                <div key={row.label} className="flex justify-between gap-[16px]">
                  <dt className="text-ink-body">{row.label}</dt>
                  <dd className="text-right font-semibold text-heading">{row.value}</dd>
                </div>
              ))}
            </dl>

            <p className="mb-[12px] mt-[20px] border-t border-dashed border-brand-popup-border pt-[16px] text-[12.5px] font-bold uppercase tracking-[1px] text-ink-muted">
              Price details
            </p>
            <dl className="space-y-[10px] text-[14.5px]">
              <div className="flex justify-between">
                <dt className="text-ink-body">Price ({units} item{units === 1 ? '' : 's'})</dt>
                <dd className="font-semibold text-heading">{formatMoney(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-body">Delivery</dt>
                <dd className={toPaise(order.shippingTotal) === 0 ? 'font-bold text-[#28b463]' : 'font-semibold text-heading'}>
                  {toPaise(order.shippingTotal) === 0 ? 'FREE' : (shippingLabel(order.shippingTotal) ?? formatMoney(order.shippingTotal))}
                </dd>
              </div>
              {saved ? (
                <div className="flex justify-between">
                  <dt className="text-ink-body">Coupon{order.couponCode ? ` (${order.couponCode})` : ''}</dt>
                  <dd className="font-semibold text-[#15803d]">&minus;{formatMoney(saved)}</dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-[14px] flex items-baseline justify-between border-t border-dashed border-brand-popup-border pt-[14px]">
              <span className="text-[17px] font-bold text-heading">{cod ? 'To pay on delivery' : 'Total paid'}</span>
              <span className="text-[24px] font-bold text-brand">{formatMoney(order.grandTotal)}</span>
            </div>
            {saved ? (
              <p className="mt-[12px] flex items-center gap-[8px] rounded-[12px] bg-[#e8f8ee] px-[12px] py-[9px] text-[13.5px] font-bold text-[#15803d]">
                <Tag aria-hidden="true" className="size-[15px]" /> You saved {formatMoney(saved)} on this order
              </p>
            ) : null}

            <div className="mt-[16px] flex items-center gap-[12px] rounded-[16px] bg-[#f8faff] px-[14px] py-[10px]">
              <FileText aria-hidden="true" className="size-[20px] shrink-0 text-brand" />
              <div className="min-w-0 flex-1 text-[14px] [&_a]:font-semibold [&_button]:font-semibold">
                <p className="text-[12.5px] font-bold text-heading">GST invoice</p>
                <InvoiceDownload orderId={order.orderId} />
              </div>
            </div>

            <div className="mt-[18px] grid grid-cols-2 gap-[10px]">
              <Link
                href={orderHref(order.orderNumber)}
                className="flex h-[50px] items-center justify-center rounded-[16px] border-[1.5px] border-brand text-[15px] font-bold text-brand transition-colors hover:bg-brand-popup-bg"
              >
                View order
              </Link>
              <Link
                href="/"
                className="flex h-[50px] items-center justify-center rounded-[16px] bg-brand text-[15px] font-bold text-white shadow-[0_10px_18px_rgba(1,66,170,0.32)] transition-colors hover:bg-[#013a96]"
              >
                Continue shopping
              </Link>
            </div>
            <Link
              href={`/account/help?order=${encodeURIComponent(order.orderNumber)}`}
              className="mt-[12px] flex items-center justify-center gap-[6px] text-[13.5px] font-semibold text-brand hover:underline"
            >
              <Headphones aria-hidden="true" className="size-[15px]" /> Need help with this order?
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
