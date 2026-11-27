'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Banknote,
  Car,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleCheck,
  CircleX,
  CreditCard,
  ImageOff,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Star,
  Clock,
  Undo2,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  TRACKING_STEPS,
  formatMoney,
  orderHref,
  orderListStatusLabel,
  type Money,
  type OrderListItem,
  type OrderListLine,
  type SellerItemStatus,
} from '@youmart/shared-client';
import { api } from '@/lib/api';
import { skipImageOptimizer } from '@/lib/images';

// The app's My Orders (apps/mobile/src/app/orders/index.tsx) for phones: search, filter chips with
// counts, orders grouped by month, and a card per order - coloured status line (Track / View),
// the Order placed -> Packed -> Shipped -> Delivered tracker, its products (photo, ×qty, Rate,
// Buy again), "+ N more", and the order number, date, payment pill and total.

export type Filter = 'all' | 'active' | 'delivered' | 'cancelled' | 'returned';
export const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'On the way' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'returned', label: 'Returned' },
];

export type Tone = { fg: string; bg: string; icon: LucideIcon };
export const TONES = {
  green: { fg: '#15803d', bg: '#e8f7ee', icon: CircleCheck },
  blue: { fg: '#1d4ed8', bg: '#e9f0ff', icon: Package },
  violet: { fg: '#6d28d9', bg: '#f1ebff', icon: Car },
  orange: { fg: '#c2410c', bg: '#fff1e6', icon: Clock },
  red: { fg: '#b91c1c', bg: '#fdecec', icon: CircleX },
  grey: { fg: '#475569', bg: '#eef1f5', icon: Undo2 },
} satisfies Record<string, Tone>;

export const STEP: Record<SellerItemStatus, number> = {
  PENDING: 0,
  CONFIRMED: 0,
  PACKED: 1,
  SHIPPED: 2,
  DELIVERED: 3,
  CANCELLED: -1,
  RETURNED: -1,
};

export const day = (iso: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(iso));
export const fullDate = (iso: string) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
export const monthKey = (iso: string) => new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(iso));

export const lines = (o: OrderListItem): OrderListLine[] => o.lines ?? [];
export const shownLines = (o: OrderListItem): OrderListLine[] => {
  const live = lines(o).filter((l) => l.sellerStatus !== 'CANCELLED');
  return live.length > 0 ? live : lines(o);
};
const latest = (ls: OrderListLine[], s: SellerItemStatus) =>
  ls
    .filter((l) => l.sellerStatus === s)
    .map((l) => l.updatedAt)
    .sort()
    .pop();

export function bucket(o: OrderListItem): Exclude<Filter, 'all'> {
  if (o.status === 'CANCELLED') return 'cancelled';
  const ls = lines(o);
  if (ls.length > 0 && ls.every((l) => l.sellerStatus === 'CANCELLED')) return 'cancelled';
  if (ls.some((l) => l.sellerStatus === 'RETURNED')) return 'returned';
  if (ls.length > 0 && ls.every((l) => ['DELIVERED', 'CANCELLED'].includes(l.sellerStatus))) return 'delivered';
  return 'active';
}

export function headline(o: OrderListItem): { text: string; sub: string | null; tone: Tone } {
  const ls = lines(o);
  const b = bucket(o);
  if (o.status === 'PENDING_PAYMENT') return { text: 'Payment pending', sub: 'Complete payment to confirm', tone: TONES.orange };
  if (b === 'cancelled') {
    const at = latest(ls, 'CANCELLED') ?? o.updatedAt;
    return { text: at ? `Cancelled on ${day(at)}` : 'Cancelled', sub: null, tone: TONES.red };
  }
  if (b === 'returned') {
    const at = latest(ls, 'RETURNED');
    return { text: at ? `Returned on ${day(at)}` : 'Returned', sub: null, tone: TONES.grey };
  }
  if (b === 'delivered') {
    const at = latest(ls, 'DELIVERED');
    return { text: at ? `Delivered on ${day(at)}` : 'Delivered', sub: 'Your item has been delivered', tone: TONES.green };
  }
  const label = orderListStatusLabel(o);
  const shipped = latest(ls, 'SHIPPED');
  if (shipped) return { text: 'On the way', sub: `Shipped on ${day(shipped)}`, tone: TONES.violet };
  const packed = latest(ls, 'PACKED');
  if (packed) return { text: 'Packed', sub: `Ready to ship · ${day(packed)}`, tone: TONES.blue };
  return { text: label === 'Processing' ? 'Order confirmed' : label, sub: 'Seller is preparing it', tone: TONES.blue };
}

export function lineLabel(l: OrderListLine): string {
  switch (l.sellerStatus) {
    case 'DELIVERED':
      return `Delivered on ${day(l.updatedAt)}`;
    case 'SHIPPED':
      return `Shipped on ${day(l.updatedAt)}`;
    case 'PACKED':
      return 'Packed';
    case 'CANCELLED':
      return 'Cancelled';
    case 'RETURNED':
      return 'Returned';
    default:
      return 'Confirmed';
  }
}

export type Card = { image: string | null; slug: string };

/** The signed-in customer's orders (paged), their product photos, counts and the filtered groups. */
export function useOrderList(filter: Filter, query: string) {
  const [orders, setOrders] = useState<OrderListItem[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cards, setCards] = useState<Record<string, Card>>({});
  const asked = useRef(new Set<string>());

  const loadCards = useCallback((list: OrderListItem[]) => {
    const ids = [...new Set(list.flatMap((o) => lines(o).map((l) => l.productId)))].filter((id) => !asked.current.has(id));
    ids.forEach((id) => asked.current.add(id));
    for (let i = 0; i < ids.length; i += 50) {
      api.catalog
        .productCards(ids.slice(i, i + 50))
        .then(({ items }) => setCards((cur) => ({ ...cur, ...Object.fromEntries(items.map((c) => [c.id, { image: c.imageUrl, slug: c.slug }])) })))
        .catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    api.orders
      .list()
      .then((page) => {
        setOrders(page.items);
        setCursor(page.nextCursor ?? null);
        loadCards(page.items);
      })
      .catch(() => setOrders((cur) => cur ?? []));
  }, [loadCards]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await api.orders.list({ cursor });
      setOrders((cur) => [...(cur ?? []), ...page.items]);
      setCursor(page.nextCursor ?? null);
      loadCards(page.items);
    } finally {
      setLoadingMore(false);
    }
  };

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: 0, active: 0, delivered: 0, cancelled: 0, returned: 0 };
    for (const o of orders ?? []) {
      c.all++;
      c[bucket(o)]++;
    }
    return c;
  }, [orders]);

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const shown = (orders ?? []).filter(
      (o) =>
        (filter === 'all' || bucket(o) === filter) &&
        (!q || o.orderNumber.toLowerCase().includes(q) || lines(o).some((l) => l.title.toLowerCase().includes(q))),
    );
    const groups: { title: string; data: OrderListItem[] }[] = [];
    for (const o of shown) {
      const title = monthKey(o.createdAt);
      const g = groups[groups.length - 1];
      if (g?.title === title) g.data.push(o);
      else groups.push({ title, data: [o] });
    }
    return groups;
  }, [orders, filter, query]);

  return { orders, cursor, loadingMore, loadMore, cards, counts, sections };
}

export function AppOrders() {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const { orders, cursor, loadingMore, loadMore, cards, counts, sections } = useOrderList(filter, query);

  if (!orders) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 aria-hidden="true" className="size-[28px] animate-spin text-brand" />
      </div>
    );
  }
  if (orders.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-[10px] text-center">
        <span className="flex size-[80px] items-center justify-center rounded-full bg-[#e8f1fb]">
          <ShoppingBag aria-hidden="true" className="size-[38px] text-brand" />
        </span>
        <p className="font-ui text-[19px] font-bold text-heading">No orders yet</p>
        <p className="text-[14px] text-ink-muted">Everything you order shows up here.</p>
        <Link href="/" className="mt-[6px] rounded-[12px] bg-brand px-[26px] py-[12px] font-ui text-[15px] font-bold text-white">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-[60px] z-20 -mx-[16px] bg-page px-[16px] pb-[8px]">
        <label className="flex h-[44px] items-center gap-[8px] rounded-[14px] border border-[#d6e2f2] bg-white px-[12px]">
          <Search aria-hidden="true" className="size-[17px] text-ink-muted" />
          <span className="sr-only">Search your orders</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product or order number"
            className="h-full flex-1 bg-transparent text-[15px] text-heading outline-none placeholder:text-ink-placeholder"
          />
          {query ? (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
              <X aria-hidden="true" className="size-[17px] text-ink-muted" />
            </button>
          ) : null}
        </label>
        <div className="-mx-[16px] mt-[10px] flex gap-[8px] overflow-x-auto px-[16px] [scrollbar-width:none]">
          {FILTERS.map((f) => {
            const on = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`flex shrink-0 items-center gap-[6px] rounded-full border px-[12px] py-[7px] font-ui text-[13px] font-semibold ${on ? 'border-brand bg-brand text-white' : 'border-[#d6e2f2] bg-white text-heading'}`}
              >
                {f.label}
                <span className={`rounded-full px-[6px] text-[11px] font-bold ${on ? 'bg-white/25 text-white' : 'bg-[#eef3fb] text-brand'}`}>{counts[f.key]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="flex flex-col items-center gap-[8px] py-[40px] text-center text-ink-muted">
          <Search aria-hidden="true" className="size-[30px]" />
          <p className="text-[14px]">No orders match this search.</p>
        </div>
      ) : (
        sections.map((s) => (
          <section key={s.title} className="mt-[10px]">
            <h2 className="mb-[8px] px-[2px] font-ui text-[13px] font-bold uppercase tracking-[0.8px] text-ink-muted">{s.title}</h2>
            <div className="flex flex-col gap-[10px]">
              {s.data.map((o) => (
                <OrderCard key={o.orderId} order={o} cards={cards} />
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
          className="mx-auto mt-[16px] flex items-center gap-[6px] rounded-full border border-brand bg-white px-[18px] py-[9px] font-ui text-[14px] font-semibold text-brand"
        >
          {loadingMore ? <Loader2 aria-hidden="true" className="size-[15px] animate-spin" /> : null} Older orders
        </button>
      ) : null}
    </div>
  );
}

export function OrderCard({ order, cards }: { order: OrderListItem; cards: Record<string, Card> }) {
  const [expanded, setExpanded] = useState(false);
  const ls = shownLines(order);
  const cancelledCount = lines(order).length - ls.length;
  const total = (
    Number(order.grandTotal) -
    (cancelledCount > 0 ? lines(order).filter((l) => l.sellerStatus === 'CANCELLED').reduce((n, l) => n + Number(l.paid ?? 0), 0) : 0)
  ).toFixed(2) as Money;
  const h = headline(order);
  const b = bucket(order);
  const shown = expanded ? ls : ls.slice(0, 1);
  const more = ls.length - shown.length;
  const units = ls.reduce((n, l) => n + l.quantity, 0);
  const step = Math.max(...ls.map((l) => STEP[l.sellerStatus]), 0);
  const tracking = b === 'active' && order.status !== 'PENDING_PAYMENT';
  const showSteps = tracking || b === 'delivered';
  const href = orderHref(order.orderNumber);
  const Icon = h.tone.icon;

  return (
    <article className="overflow-hidden rounded-[18px] border border-[#dde7f4] bg-white">
      <Link href={href} className="flex items-center gap-[8px] px-[12px] py-[10px]" style={{ background: h.tone.bg, color: h.tone.fg }}>
        <Icon aria-hidden="true" className="size-[16px] shrink-0" />
        <span className="min-w-0 flex-1 truncate font-ui text-[13.5px]">
          <strong className="font-bold">{h.text}</strong>
          {h.sub ? <span className="text-ink-muted">{`  ·  ${h.sub}`}</span> : null}
        </span>
        <span className="font-ui text-[13px] font-bold">{tracking ? 'Track' : 'View'}</span>
        <ChevronRight aria-hidden="true" className="size-[15px]" />
      </Link>

      {showSteps ? (
        <ol className="flex px-[8px] pb-[4px] pt-[12px]">
          {TRACKING_STEPS.map((label, i) => (
            <li key={label} className="flex flex-1 flex-col items-center gap-[5px]">
              <span className="flex w-full items-center">
                <span className={`h-[2px] flex-1 ${i === 0 ? 'invisible' : i <= step ? 'bg-[#16a34a]' : 'bg-[#dbe3ee]'}`} />
                <span className={`flex size-[18px] shrink-0 items-center justify-center rounded-full ${i <= step ? 'bg-[#16a34a]' : 'border-2 border-[#dbe3ee] bg-white'}`}>
                  {i <= step ? <Check aria-hidden="true" className="size-[11px] text-white" strokeWidth={3} /> : null}
                </span>
                <span className={`h-[2px] flex-1 ${i === TRACKING_STEPS.length - 1 ? 'invisible' : i < step ? 'bg-[#16a34a]' : 'bg-[#dbe3ee]'}`} />
              </span>
              <span className={`truncate font-ui text-[10.5px] ${i <= step ? 'font-semibold text-heading' : 'text-ink-muted'}`}>{label}</span>
            </li>
          ))}
        </ol>
      ) : null}

      {shown.map((l) => {
        const card = cards[l.productId];
        const mixed = ls.some((x) => x.sellerStatus !== l.sellerStatus);
        return (
          <div key={l.orderItemId} className="flex gap-[10px] px-[12px] py-[10px]">
            <Link href={href} className="relative flex size-[62px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#f4f7fd]">
              {card?.image ? (
                <Image src={card.image} alt="" fill sizes="62px" unoptimized={skipImageOptimizer(card.image)} className="object-contain p-[4px]" />
              ) : (
                <ImageOff aria-hidden="true" className="size-[20px] text-card-border" />
              )}
              {l.quantity > 1 ? (
                <span className="absolute bottom-[3px] right-[3px] rounded-[6px] bg-heading/80 px-[5px] font-ui text-[10.5px] font-bold text-white">×{l.quantity}</span>
              ) : null}
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={href} className="line-clamp-2 font-ui text-[14px] font-medium leading-[19px] text-heading">
                {l.title}
              </Link>
              {mixed ? <p className="mt-[2px] text-[12px] font-semibold text-ink-muted">{lineLabel(l)}</p> : null}
              {l.sellerStatus === 'DELIVERED' && card?.slug ? (
                <div className="mt-[6px] flex flex-wrap gap-[8px]">
                  <Link href={`/product/${card.slug}#reviews`} className="flex items-center gap-[2px] rounded-full border border-[#dde7f4] px-[8px] py-[3px]">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} aria-hidden="true" className="size-[12px] fill-[#c2cad6] text-[#c2cad6]" />
                    ))}
                    <span className="ml-[3px] font-ui text-[12px] font-semibold text-heading">Rate</span>
                  </Link>
                  <Link href={`/product/${card.slug}`} className="flex items-center gap-[4px] rounded-full border border-brand/30 px-[9px] py-[3px] font-ui text-[12px] font-semibold text-brand">
                    <RefreshCw aria-hidden="true" className="size-[12px]" /> Buy again
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}

      {more > 0 || expanded ? (
        <button type="button" onClick={() => setExpanded((v) => !v)} className="flex items-center gap-[4px] px-[12px] pb-[8px] font-ui text-[13px] font-semibold text-brand">
          {expanded ? 'Show less' : `+ ${more} more item${more > 1 ? 's' : ''}`}
          {expanded ? <ChevronUp aria-hidden="true" className="size-[14px]" /> : <ChevronDown aria-hidden="true" className="size-[14px]" />}
        </button>
      ) : null}

      <div className="flex items-center gap-[8px] border-t border-[#eef2f8] px-[12px] py-[10px]">
        <div className="min-w-0 flex-1">
          <p className="truncate font-ui text-[13px] font-bold text-heading">#{order.orderNumber}</p>
          <p className="truncate text-[11.5px] text-ink-muted">
            {fullDate(order.createdAt)} · {units} item{units === 1 ? '' : 's'}
            {cancelledCount > 0 ? ` · ${cancelledCount} cancelled` : ''}
          </p>
        </div>
        {order.paymentMethod ? (
          <span
            className={`flex items-center gap-[3px] rounded-full px-[7px] py-[2px] font-ui text-[11px] font-bold ${order.paymentMethod === 'COD' ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#e8f7ee] text-[#15803d]'}`}
          >
            {order.paymentMethod === 'COD' ? <Banknote aria-hidden="true" className="size-[11px]" /> : <CreditCard aria-hidden="true" className="size-[11px]" />}
            {order.paymentMethod === 'COD' ? 'COD' : 'Paid'}
          </span>
        ) : null}
        <span className="font-ui text-[15px] font-bold text-heading">{formatMoney(total)}</span>
      </div>
    </article>
  );
}
