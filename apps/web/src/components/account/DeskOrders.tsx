'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Banknote,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CreditCard,
  Headset,
  ImageOff,
  LayoutGrid,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  ShoppingBag,
  Star,
  X,
} from 'lucide-react';
import {
  ROUTES,
  TRACKING_STEPS,
  formatMoney,
  orderHref,
  type Money,
  type OrderListItem,
} from '@youmart/shared-client';
import { skipImageOptimizer } from '@/lib/images';
import {
  FILTERS,
  STEP,
  TONES,
  bucket,
  fullDate,
  headline,
  lineLabel,
  lines,
  shownLines,
  useOrderList,
  type Card,
  type Filter,
} from './AppOrders';

// DESKTOP (>= 1025px) My Orders in the app's design (apps/mobile/src/app/orders/index.tsx):
// filter tiles with counts + search, orders grouped by month, and a wide card per order -
// coloured status bar, the Order placed -> Packed -> Shipped -> Delivered tracker, its products
// (photo, ×qty, Rate, Buy again) and the order's number, date, payment and total with actions.

const CARD = 'rounded-[24px] border border-brand-popup-border bg-white shadow-rail-card';

const TILE_TONE: Record<Filter, { fg: string; bg: string }> = {
  all: { fg: '#0142aa', bg: '#eaf1ff' },
  active: { fg: TONES.violet.fg, bg: TONES.violet.bg },
  delivered: { fg: TONES.green.fg, bg: TONES.green.bg },
  cancelled: { fg: TONES.red.fg, bg: TONES.red.bg },
  returned: { fg: TONES.grey.fg, bg: TONES.grey.bg },
};
const TILE_ICON: Record<Filter, typeof LayoutGrid> = {
  all: LayoutGrid,
  active: TONES.violet.icon,
  delivered: TONES.green.icon,
  cancelled: TONES.red.icon,
  returned: TONES.grey.icon,
};

export function DeskOrders() {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const list = useOrderList(filter, query);
  return <DeskOrdersView {...list} filter={filter} setFilter={setFilter} query={query} setQuery={setQuery} />;
}

export function DeskOrdersView({
  orders,
  cursor,
  loadingMore,
  loadMore,
  cards,
  counts,
  sections,
  filter,
  setFilter,
  query,
  setQuery,
}: ReturnType<typeof useOrderList> & {
  filter: Filter;
  setFilter: (f: Filter) => void;
  query: string;
  setQuery: (q: string) => void;
}) {
  if (!orders) {
    return (
      <div className={`${CARD} flex min-h-[420px] items-center justify-center`}>
        <Loader2 aria-hidden="true" className="size-[32px] animate-spin text-brand" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={`${CARD} flex flex-col items-center px-[32px] py-[64px] text-center font-ui`}>
        <span className="flex size-[112px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#eaf1ff_0%,#f6f9ff_100%)]">
          <ShoppingBag aria-hidden="true" className="size-[50px] text-brand" strokeWidth={1.6} />
        </span>
        <h2 className="mt-[20px] text-[26px] font-bold text-heading">No orders yet</h2>
        <p className="mt-[6px] text-[15px] text-ink-muted">Everything you order shows up here, with live tracking.</p>
        <Link href="/" className="mt-[22px] rounded-[14px] bg-brand px-[28px] py-[13px] text-[15px] font-bold text-white shadow-[0_8px_14px_rgba(1,66,170,0.3)] hover:bg-[#013a96]">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="font-ui">
      <div className="mb-[18px] flex items-end justify-between gap-[20px]">
        <div className="flex items-center gap-[12px]">
          <span aria-hidden="true" className="h-[44px] w-[5px] rounded-[3px] bg-brand" />
          <div>
            <h1 className="text-[28px] font-bold leading-[34px] text-heading">My Orders</h1>
            <p className="text-[14px] font-medium text-ink-muted">Track, return or buy again</p>
          </div>
        </div>
        <label className="flex h-[46px] w-[380px] items-center gap-[10px] rounded-[14px] border border-brand-popup-border bg-white px-[14px] shadow-rail-card focus-within:border-brand">
          <Search aria-hidden="true" className="size-[18px] text-ink-muted" />
          <span className="sr-only">Search your orders</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product or order number"
            className="h-full min-w-0 flex-1 bg-transparent text-[14.5px] text-heading outline-none placeholder:text-ink-placeholder"
          />
          {query ? (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
              <X aria-hidden="true" className="size-[17px] text-ink-muted" />
            </button>
          ) : null}
        </label>
      </div>

      <div role="tablist" aria-label="Filter orders" className="mb-[24px] grid grid-cols-5 gap-[12px]">
        {FILTERS.map((f) => {
          const on = filter === f.key;
          const tone = TILE_TONE[f.key];
          const Icon = TILE_ICON[f.key];
          return (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-[12px] rounded-[18px] border px-[14px] py-[12px] text-left transition-all ${
                on ? 'border-brand bg-white shadow-[0_10px_20px_-10px_rgba(1,66,170,0.45)] ring-2 ring-brand' : 'border-brand-popup-border bg-white hover:-translate-y-[2px] hover:border-brand/60'
              }`}
            >
              <span className="flex size-[42px] shrink-0 items-center justify-center rounded-[12px]" style={{ background: tone.bg, color: tone.fg }}>
                <Icon aria-hidden="true" className="size-[20px]" />
              </span>
              <span className="min-w-0">
                <span className="block text-[22px] font-bold leading-none text-heading">{counts[f.key]}</span>
                <span className="mt-[3px] block truncate text-[13px] font-semibold text-ink-muted">{f.key === 'all' ? 'All orders' : f.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {sections.length === 0 ? (
        <div className={`${CARD} flex flex-col items-center gap-[8px] py-[56px] text-center text-ink-muted`}>
          <Search aria-hidden="true" className="size-[32px]" />
          <p className="text-[15px] font-semibold text-heading">No orders match</p>
          <p className="text-[13.5px]">Try another word or filter.</p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setFilter('all');
            }}
            className="mt-[6px] rounded-full bg-brand-popup-bg px-[16px] py-[8px] text-[13.5px] font-bold text-brand hover:bg-brand hover:text-white"
          >
            Show all orders
          </button>
        </div>
      ) : (
        sections.map((s) => (
          <section key={s.title} className="mb-[24px]">
            <h2 className="mb-[12px] flex items-center gap-[10px] text-[13px] font-bold uppercase tracking-[1px] text-ink-muted">
              {s.title}
              <span className="h-px flex-1 bg-brand-popup-border" />
              <span className="normal-case tracking-normal">
                {s.data.length} order{s.data.length === 1 ? '' : 's'}
              </span>
            </h2>
            <div className="flex flex-col gap-[16px]">
              {s.data.map((o) => (
                <DeskOrderCard key={o.orderId} order={o} cards={cards} />
              ))}
            </div>
          </section>
        ))
      )}

      {cursor ? (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={loadingMore}
          className="mx-auto mt-[8px] flex items-center gap-[8px] rounded-full border border-brand bg-white px-[22px] py-[11px] text-[14px] font-bold text-brand hover:bg-brand hover:text-white"
        >
          {loadingMore ? <Loader2 aria-hidden="true" className="size-[16px] animate-spin" /> : null} Show older orders
        </button>
      ) : null}
    </div>
  );
}

const PREVIEW = 3;

function DeskOrderCard({ order, cards }: { order: OrderListItem; cards: Record<string, Card> }) {
  const [expanded, setExpanded] = useState(false);
  const ls = shownLines(order);
  const cancelled = lines(order).filter((l) => l.sellerStatus === 'CANCELLED');
  const cancelledCount = lines(order).length - ls.length;
  const total = (Number(order.grandTotal) - (cancelledCount > 0 ? cancelled.reduce((n, l) => n + Number(l.paid ?? 0), 0) : 0)).toFixed(2) as Money;
  const h = headline(order);
  const b = bucket(order);
  const shown = expanded ? ls : ls.slice(0, PREVIEW);
  const more = ls.length - shown.length;
  const units = ls.reduce((n, l) => n + l.quantity, 0);
  const step = Math.max(...ls.map((l) => STEP[l.sellerStatus]), 0);
  const tracking = b === 'active' && order.status !== 'PENDING_PAYMENT';
  const showSteps = tracking || b === 'delivered';
  const href = orderHref(order.orderNumber);
  const Icon = h.tone.icon;

  return (
    <article className={`${CARD} overflow-hidden`}>
      <div className="flex items-center gap-[12px] px-[22px] py-[14px]" style={{ background: h.tone.bg, color: h.tone.fg }}>
        <span className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-white/70">
          <Icon aria-hidden="true" className="size-[18px]" />
        </span>
        <p className="min-w-0 flex-1 truncate text-[15px]">
          <strong className="font-bold">{h.text}</strong>
          {h.sub ? <span className="text-ink-muted">{`  ·  ${h.sub}`}</span> : null}
        </p>
        <dl className="flex items-center gap-[22px] text-right text-heading">
          <div>
            <dt className="text-[11.5px] font-semibold uppercase tracking-[0.6px] text-ink-muted">Order</dt>
            <dd className="text-[13.5px] font-bold">#{order.orderNumber}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] font-semibold uppercase tracking-[0.6px] text-ink-muted">Placed</dt>
            <dd className="text-[13.5px] font-bold">{fullDate(order.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] font-semibold uppercase tracking-[0.6px] text-ink-muted">Total</dt>
            <dd className="flex items-center justify-end gap-[6px] text-[15px] font-bold">
              {order.paymentMethod ? (
                <span
                  className={`flex items-center gap-[3px] rounded-full px-[7px] py-[1px] text-[10.5px] font-bold ${order.paymentMethod === 'COD' ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#e8f7ee] text-[#15803d]'}`}
                >
                  {order.paymentMethod === 'COD' ? <Banknote aria-hidden="true" className="size-[11px]" /> : <CreditCard aria-hidden="true" className="size-[11px]" />}
                  {order.paymentMethod === 'COD' ? 'COD' : 'Paid'}
                </span>
              ) : null}
              {formatMoney(total)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_220px] gap-[24px] px-[22px] py-[18px]">
        <div className="min-w-0">
          {showSteps ? (
            <ol className="mb-[16px] flex max-w-[640px]" aria-label="Order progress">
              {TRACKING_STEPS.map((label, i) => (
                <li key={label} className="flex flex-1 flex-col items-center gap-[6px]">
                  <span className="flex w-full items-center">
                    <span className={`h-[3px] flex-1 rounded-full ${i === 0 ? 'invisible' : i <= step ? 'bg-[#16a34a]' : 'bg-[#dbe3ee]'}`} />
                    <span className={`flex size-[24px] shrink-0 items-center justify-center rounded-full ${i <= step ? 'bg-[#16a34a] shadow-[0_0_0_4px_#dcf5e5]' : 'border-2 border-[#dbe3ee] bg-white'}`}>
                      {i <= step ? <Check aria-hidden="true" className="size-[13px] text-white" strokeWidth={3} /> : null}
                    </span>
                    <span className={`h-[3px] flex-1 rounded-full ${i === TRACKING_STEPS.length - 1 ? 'invisible' : i < step ? 'bg-[#16a34a]' : 'bg-[#dbe3ee]'}`} />
                  </span>
                  <span className={`text-[12px] ${i <= step ? 'font-bold text-heading' : 'font-medium text-ink-muted'}`}>{label}</span>
                </li>
              ))}
            </ol>
          ) : null}

          <ul className="flex flex-col gap-[10px]">
            {shown.map((l) => {
              const card = cards[l.productId];
              const mixed = ls.some((x) => x.sellerStatus !== l.sellerStatus);
              return (
                <li key={l.orderItemId} className="flex items-center gap-[14px] rounded-[16px] bg-[#f8faff] p-[10px]">
                  <Link href={card?.slug ? `/product/${card.slug}` : href} className="relative flex size-[76px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-cart-line bg-white">
                    {card?.image ? (
                      <Image src={card.image} alt="" fill sizes="76px" unoptimized={skipImageOptimizer(card.image)} className="object-contain p-[5px]" />
                    ) : (
                      <ImageOff aria-hidden="true" className="size-[22px] text-card-border" />
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={card?.slug ? `/product/${card.slug}` : href} className="line-clamp-2 text-[14.5px] font-semibold leading-[20px] text-heading hover:text-brand">
                      {l.title}
                    </Link>
                    <p className="mt-[3px] text-[12.5px] text-ink-muted">
                      Qty {l.quantity}
                      {l.paid ? ` · ${formatMoney(l.paid)}` : ''}
                      {mixed ? <span className="font-semibold text-heading">{`  ·  ${lineLabel(l)}`}</span> : null}
                    </p>
                  </div>
                  {l.sellerStatus === 'DELIVERED' && card?.slug ? (
                    <div className="flex shrink-0 items-center gap-[8px]">
                      <Link href={`/product/${card.slug}#d-reviews`} className="flex items-center gap-[2px] rounded-full border border-brand-popup-border bg-white px-[10px] py-[6px] hover:border-[#f5a524]">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} aria-hidden="true" className="size-[13px] fill-[#c2cad6] text-[#c2cad6]" />
                        ))}
                        <span className="ml-[4px] text-[12.5px] font-bold text-heading">Rate</span>
                      </Link>
                      <Link href={`/product/${card.slug}`} className="flex items-center gap-[5px] rounded-full bg-brand px-[12px] py-[7px] text-[12.5px] font-bold text-white hover:bg-[#013a96]">
                        <RefreshCw aria-hidden="true" className="size-[13px]" /> Buy again
                      </Link>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {more > 0 || expanded ? (
            <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-[10px] flex items-center gap-[4px] text-[13.5px] font-bold text-brand hover:underline">
              {expanded ? 'Show less' : `+ ${more} more item${more > 1 ? 's' : ''}`}
              {expanded ? <ChevronUp aria-hidden="true" className="size-[15px]" /> : <ChevronDown aria-hidden="true" className="size-[15px]" />}
            </button>
          ) : null}
        </div>

        <div className="flex flex-col gap-[10px] border-l border-cart-line pl-[24px]">
          <p className="text-[12.5px] text-ink-muted">
            {units} item{units === 1 ? '' : 's'}
            {cancelledCount > 0 ? ` · ${cancelledCount} cancelled` : ''}
          </p>
          <Link href={href} className="flex h-[42px] items-center justify-center gap-[6px] rounded-[12px] bg-brand text-[14px] font-bold text-white shadow-[0_6px_12px_rgba(1,66,170,0.28)] hover:bg-[#013a96]">
            {tracking ? <MapPin aria-hidden="true" className="size-[16px]" /> : null}
            {tracking ? 'Track order' : order.status === 'PENDING_PAYMENT' ? 'Complete payment' : 'Order details'}
            <ChevronRight aria-hidden="true" className="size-[15px]" />
          </Link>
          {tracking ? (
            <Link href={href} className="flex h-[40px] items-center justify-center rounded-[12px] border border-brand-popup-border text-[13.5px] font-bold text-heading hover:border-brand hover:text-brand">
              Order details
            </Link>
          ) : null}
          <Link href={ROUTES.customerCare} className="flex h-[40px] items-center justify-center gap-[6px] rounded-[12px] text-[13.5px] font-semibold text-ink-body hover:bg-brand-popup-bg hover:text-brand">
            <Headset aria-hidden="true" className="size-[15px]" /> Need help?
          </Link>
        </div>
      </div>
    </article>
  );
}
