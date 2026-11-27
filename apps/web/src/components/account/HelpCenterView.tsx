'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CreditCard,
  FileText,
  Headphones,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquareText,
  PackagePlus,
  PackageSearch,
  PackageX,
  RotateCcw,
  Phone,
  Send,
  Sparkles,
  Truck,
  UserRound,
  Wallet,
  XCircle,
} from 'lucide-react';
import {
  ApiError,
  BUSINESS,
  HELP_TOPIC_LABELS,
  ROUTES,
  formatMoney,
  orderHref,
  type HelpTicket,
  type HelpTopic,
  type OrderListItem,
} from '@youmart/shared-client';
import { api } from '@/lib/api';
import { BTN_PRIMARY, BTN_SECONDARY, Banner, EmptyState, PageHeader, Panel, Pill, Skeleton, dateOnly, dateTime, type PillTone } from './ui';
import { useDesktop } from '@/components/checkout/DeskCheckout';
import { headline } from './AppOrders';

const TOPIC_ICON: Record<HelpTopic, typeof CircleHelp> = {
  ORDER_STATUS: PackageSearch,
  CANCELLATION: XCircle,
  RETURN_REFUND: RotateCcw,
  DAMAGED_WRONG_ITEM: PackageX,
  PAYMENT_WALLET: CreditCard,
  ACCOUNT: UserRound,
  OTHER: CircleHelp,
};
const TOPICS = Object.keys(HELP_TOPIC_LABELS) as HelpTopic[];
/** Topics about an order: the order picker is shown first for these. */
const ORDER_TOPICS = new Set<HelpTopic>(['ORDER_STATUS', 'CANCELLATION', 'RETURN_REFUND', 'DAMAGED_WRONG_ITEM', 'PAYMENT_WALLET']);

const STATUS: Record<HelpTicket['status'], { label: string; tone: PillTone }> = {
  OPEN: { label: 'Open', tone: 'orange' },
  IN_PROGRESS: { label: 'In progress', tone: 'blue' },
  RESOLVED: { label: 'Resolved', tone: 'green' },
};

/** W9 on the website: Help Center - raise a request (optionally about an order) and follow it. */
export function HelpCenterView() {
  const params = useSearchParams();
  const orderParam = params.get('order');
  const topicParam = params.get('topic') as HelpTopic | null;
  const [tickets, setTickets] = useState<HelpTicket[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderListItem[] | null>(null);
  const [topic, setTopic] = useState<HelpTopic | null>(
    topicParam && topicParam in HELP_TOPIC_LABELS ? topicParam : orderParam ? 'ORDER_STATUS' : null,
  );
  const [orderId, setOrderId] = useState<string>('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [openTicket, setOpenTicket] = useState<string | null>(null);
  const desk = useDesktop();

  const loadTickets = useCallback(async (from?: string) => {
    const page = await api.support.listTickets({ limit: 20, ...(from ? { cursor: from } : {}) });
    setCursor(page.nextCursor);
    return page.items;
  }, []);

  useEffect(() => {
    loadTickets()
      .then(setTickets)
      .catch(() => setTickets([]));
    api.orders
      .list({ limit: 30 })
      .then((page) => {
        setOrders(page.items);
        if (orderParam) {
          const hit = page.items.find((o) => o.orderNumber === orderParam || o.orderId === orderParam);
          if (hit) setOrderId(hit.orderId);
        }
      })
      .catch(() => setOrders([]));
  }, [loadTickets, orderParam]);

  const chosenOrder = useMemo(() => orders?.find((o) => o.orderId === orderId) ?? null, [orders, orderId]);

  const submit = async () => {
    setMessage(null);
    if (!topic) {
      setMessage({ tone: 'error', text: 'Choose what you need help with.' });
      return;
    }
    if (text.trim().length < 10) {
      setMessage({ tone: 'error', text: 'Tell us a little more (at least 10 characters).' });
      return;
    }
    setBusy(true);
    try {
      const ticket = await api.support.createTicket({
        topic,
        message: text.trim(),
        ...(orderId ? { orderId } : {}),
      });
      setTickets((cur) => [ticket, ...(cur ?? [])]);
      setOpenTicket(ticket.ticketId);
      setText('');
      setMessage({
        tone: 'success',
        text: `Request ${ticket.reference} sent. Our team usually replies within 24 hours - you’ll get a notification.`,
      });
    } catch (error) {
      setMessage({
        tone: 'error',
        text: error instanceof ApiError ? error.message : 'Could not send your request. Please try again.',
      });
    } finally {
      setBusy(false);
    }
  };

  const ticketList = (
    <>
          {tickets === null ? (
            <div className="space-y-[10px] p-[20px]">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-[64px] w-full" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <EmptyState icon={MessageSquareText} title="No requests yet">
              Requests you raise appear here with our team&rsquo;s replies.
            </EmptyState>
          ) : (
            <ul>
              {tickets.map((t) => {
                const s = STATUS[t.status];
                const expanded = openTicket === t.ticketId;
                return (
                  <li key={t.ticketId} className="border-b border-catalog-rule last:border-0">
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setOpenTicket(expanded ? null : t.ticketId)}
                      className="flex w-full items-start justify-between gap-[12px] px-[20px] py-[14px] text-left font-ui transition-colors hover:bg-[#fafcff]"
                    >
                      <span className="min-w-0">
                        <span className="block text-[14.5px] font-semibold text-heading">{t.topicLabel}</span>
                        <span className="mt-[2px] block text-[12.5px] text-ink-muted">
                          {t.reference} · {dateTime(t.createdAt)}
                          {t.orderNumber ? ` · #${t.orderNumber}` : ''}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-[8px]">
                        {t.adminReply && t.status !== 'RESOLVED' ? (
                          <span className="rounded-full bg-brand px-[8px] py-[1px] text-[11px] font-semibold text-white">Reply</span>
                        ) : null}
                        <Pill tone={s.tone}>{s.label}</Pill>
                        <ChevronDown aria-hidden="true" className={`size-[16px] text-ink-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
                      </span>
                    </button>
                    {expanded ? (
                      <div className="space-y-[10px] px-[20px] pb-[16px] font-ui text-[14px] leading-[1.55]">
                        <div className="rounded-[12px] bg-[#f6f8fb] px-[14px] py-[10px]">
                          <p className="mb-[2px] text-[12px] font-semibold text-ink-muted">You wrote</p>
                          <p className="whitespace-pre-line text-heading">{t.message}</p>
                        </div>
                        {t.adminReply ? (
                          <div className="rounded-[12px] border border-[#c9d8f5] bg-[#f1f6fe] px-[14px] py-[10px]">
                            <p className="mb-[2px] text-[12px] font-semibold text-brand">
                              YouMart Support{t.repliedAt ? ` · ${dateTime(t.repliedAt)}` : ''}
                            </p>
                            <p className="whitespace-pre-line text-heading">{t.adminReply}</p>
                          </div>
                        ) : (
                          <p className="text-[13px] text-ink-muted">Our team hasn&rsquo;t replied yet - we&rsquo;ll notify you when they do.</p>
                        )}
                        {t.orderNumber ? (
                          <Link href={orderHref(t.orderNumber)} className="inline-block text-[13px] font-semibold text-brand hover:underline">
                            View order #{t.orderNumber}
                          </Link>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          {cursor ? (
            <div className="border-t border-catalog-rule p-[12px] text-center">
              <button
                type="button"
                className={BTN_SECONDARY}
                onClick={() =>
                  void loadTickets(cursor).then((more) => setTickets((cur) => [...(cur ?? []), ...more]))
                }
              >
                Show older requests
              </button>
            </div>
          ) : null}
    </>
  );

  if (desk) {
    const pick = (o: OrderListItem) => {
      setOrderId(o.orderId);
      setTopic((t) => (t && ORDER_TOPICS.has(t) ? t : 'ORDER_STATUS'));
      setMessage(null);
      document.getElementById('help-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const openCount = (tickets ?? []).filter((t) => t.status !== 'RESOLVED').length;
    return (
      <div className="font-ui">
        <h1 className="sr-only">Help Center</h1>
        {/* Hero: the app's "How can we help?" card with Ask Yumo beside it. */}
        <section className="relative mb-[18px] overflow-hidden rounded-[24px] bg-[linear-gradient(120deg,#0142aa_0%,#1d5fd1_60%,#3b82f6_100%)] px-[30px] py-[26px] text-white shadow-[0_14px_32px_rgba(1,66,170,0.25)]">
          <span aria-hidden="true" className="absolute -right-[50px] -top-[70px] size-[220px] rounded-full bg-white/10" />
          <div className="relative flex items-center gap-[24px]">
            <span className="flex size-[64px] shrink-0 items-center justify-center rounded-[20px] bg-white/15">
              <Headphones aria-hidden="true" className="size-[32px]" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[28px] font-bold leading-[34px]">How can we help?</h2>
              <p className="mt-[2px] text-[15px] text-white/85">
                Tracking, cancellations, returns, refunds or payment - pick an order below or raise a request.
              </p>
            </div>
            <Link
              href="/ask/yumo"
              className="group flex w-[300px] shrink-0 items-center gap-[12px] rounded-[18px] bg-white px-[16px] py-[12px] text-heading transition-transform hover:-translate-y-[1px]"
            >
              <span className="flex size-[44px] shrink-0 items-center justify-center rounded-full bg-brand-popup-bg text-brand">
                <Sparkles aria-hidden="true" className="size-[21px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15.5px] font-bold">Ask Yumo</span>
                <span className="block text-[12.5px] leading-[17px] text-ink-muted">Instant answers about orders, delivery & refunds</span>
              </span>
              <ChevronRight aria-hidden="true" className="size-[18px] text-brand transition-transform group-hover:translate-x-[2px]" />
            </Link>
          </div>
        </section>

        <ul className="mb-[18px] grid grid-cols-5 gap-[12px]">
          {[
            { href: ROUTES.orders, Icon: PackageSearch, title: 'Track an order', text: 'See where it is' },
            { href: ROUTES.cancelOrder, Icon: XCircle, title: 'Cancel an order', text: 'Before it ships' },
            { href: ROUTES.returns, Icon: RotateCcw, title: 'Returns & refunds', text: 'Track a return' },
            { href: ROUTES.wallet, Icon: Wallet, title: 'Payments & wallet', text: 'Refunds, balance' },
            { href: '/youfind', Icon: PackagePlus, title: 'YouFind Bot', text: 'Can’t find a product?' },
          ].map(({ href, Icon, title, text }) => (
            <li key={title}>
              <Link
                href={href}
                className="flex h-full items-center gap-[12px] rounded-[18px] border border-brand-popup-border bg-white px-[14px] py-[12px] shadow-rail-card transition-[border-color,box-shadow] hover:border-brand/50 hover:shadow-product-card"
              >
                <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[12px] bg-brand-popup-bg text-brand">
                  <Icon aria-hidden="true" className="size-[19px]" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-bold text-heading">{title}</span>
                  <span className="block truncate text-[12px] text-ink-muted">{text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {orders && orders.length > 0 ? (
          <section aria-labelledby="help-recent" className="mb-[18px] rounded-[24px] border border-brand-popup-border bg-white p-[20px] shadow-rail-card">
            <div className="mb-[12px] flex items-center justify-between">
              <h2 id="help-recent" className="text-[18px] font-bold text-heading">
                Need help with a recent order?
              </h2>
              <Link href={ROUTES.orders} className="text-[13.5px] font-bold text-brand hover:underline">
                All orders
              </Link>
            </div>
            <ul className="grid grid-cols-4 gap-[12px]">
              {orders.slice(0, 4).map((o) => {
                const on = o.orderId === orderId;
                const first = o.lines?.[0]?.title;
                const more = (o.lines?.length ?? 0) - 1;
                return (
                  <li key={o.orderId}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => pick(o)}
                      className={`flex h-full w-full flex-col rounded-[16px] border p-[14px] text-left transition-colors ${
                        on ? 'border-brand bg-[#f3f7fe] ring-1 ring-brand' : 'border-brand-popup-border hover:border-brand/50'
                      }`}
                    >
                      <span className="flex w-full items-center justify-between gap-[8px]">
                        <span className="text-[14px] font-bold text-heading">#{o.orderNumber}</span>
                        <span
                          className="truncate rounded-full px-[8px] py-[1px] text-[11.5px] font-bold"
                          style={{ color: headline(o).tone.fg, background: headline(o).tone.bg }}
                        >
                          {headline(o).text}
                        </span>
                      </span>
                      {first ? (
                        <span className="mt-[6px] line-clamp-2 text-[13px] leading-[18px] text-ink-body">
                          {first}
                          {more > 0 ? ` + ${more} more` : ''}
                        </span>
                      ) : null}
                      <span className="mt-auto flex w-full items-center justify-between pt-[10px] text-[12.5px]">
                        <span className="text-ink-muted">
                          {formatMoney(o.grandTotal)} · {dateOnly(o.createdAt)}
                        </span>
                        <span className="font-bold text-brand">{on ? 'Selected' : 'Get help'}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start gap-[20px]">
          <section id="help-form" aria-labelledby="help-form-title" className="scroll-mt-[16px] rounded-[24px] border border-brand-popup-border bg-white p-[22px] shadow-rail-card">
            <h2 id="help-form-title" className="mb-[4px] text-[19px] font-bold text-heading">
              Raise a request
            </h2>
            <p className="mb-[16px] text-[13.5px] text-ink-muted">Our team usually replies within 24 hours.</p>
            <p className="mb-[10px] text-[13.5px] font-bold text-heading">What do you need help with?</p>
            <div className="mb-[18px] grid grid-cols-4 gap-[8px]">
              {TOPICS.map((t) => {
                const Icon = TOPIC_ICON[t];
                const on = topic === t;
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setTopic(t)}
                    className={`flex flex-col items-start gap-[8px] rounded-[14px] border p-[12px] text-left text-[13px] font-bold leading-[17px] transition-colors ${
                      on ? 'border-brand bg-[#f3f7fe] text-brand ring-1 ring-brand' : 'border-brand-popup-border text-heading hover:border-brand/50'
                    }`}
                  >
                    <span className={`flex size-[32px] items-center justify-center rounded-[10px] ${on ? 'bg-brand text-white' : 'bg-brand-popup-bg text-brand'}`}>
                      <Icon aria-hidden="true" className="size-[16px]" />
                    </span>
                    {HELP_TOPIC_LABELS[t]}
                  </button>
                );
              })}
            </div>

            {topic && ORDER_TOPICS.has(topic) ? (
              <div className="mb-[16px]">
                <label htmlFor="help-order-desk" className="mb-[6px] block text-[13.5px] font-bold text-heading">
                  Which order?
                </label>
                <div className="relative">
                  <select
                    id="help-order-desk"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="h-[46px] w-full appearance-none rounded-[14px] border border-brand-popup-border bg-white pl-[14px] pr-[36px] text-[14.5px] text-ink-input focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  >
                    <option value="">{orders === null ? 'Loading your orders…' : 'Not about a specific order'}</option>
                    {(orders ?? []).map((o) => (
                      <option key={o.orderId} value={o.orderId}>
                        #{o.orderNumber} · {formatMoney(o.grandTotal)} · {dateTime(o.createdAt)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-[12px] top-1/2 size-[16px] -translate-y-1/2 text-ink-muted" />
                </div>
                {chosenOrder ? (
                  <p className="mt-[6px] text-[12.5px]">
                    <Link href={orderHref(chosenOrder.orderNumber)} className="font-semibold text-brand hover:underline">
                      View order #{chosenOrder.orderNumber}
                    </Link>
                  </p>
                ) : null}
              </div>
            ) : null}

            <label htmlFor="help-message-desk" className="mb-[6px] block text-[13.5px] font-bold text-heading">
              Describe the problem
            </label>
            <textarea
              id="help-message-desk"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder="Tell us what happened - the more detail, the faster we can help."
              className="w-full resize-y rounded-[14px] border border-brand-popup-border px-[14px] py-[10px] text-[14.5px] text-ink-input placeholder:text-ink-placeholder focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <p className="mb-[14px] mt-[4px] text-right text-[12px] text-ink-muted">{text.length}/2000</p>
            {message ? <Banner tone={message.tone}>{message.text}</Banner> : null}
            <button
              type="button"
              onClick={() => void submit()}
              disabled={busy}
              className="flex h-[52px] w-full items-center justify-center gap-[8px] rounded-[16px] bg-brand text-[16px] font-bold text-white shadow-[0_10px_18px_rgba(1,66,170,0.32)] transition-colors hover:bg-[#013a96] disabled:cursor-wait disabled:opacity-70"
            >
              {busy ? <Loader2 aria-hidden="true" className="size-[17px] animate-spin" /> : <Send aria-hidden="true" className="size-[16px]" />}
              Send request
            </button>
          </section>

          <div className="flex min-w-0 flex-col gap-[16px]">
            <section aria-labelledby="help-mine" className="overflow-hidden rounded-[24px] border border-brand-popup-border bg-white shadow-rail-card">
              <div className="flex items-center justify-between px-[20px] pb-[12px] pt-[18px]">
                <h2 id="help-mine" className="text-[18px] font-bold text-heading">
                  My help requests
                </h2>
                {openCount > 0 ? (
                  <span className="rounded-full bg-[#fff1e6] px-[10px] py-[2px] text-[12px] font-bold text-[#c2410c]">{openCount} open</span>
                ) : null}
              </div>
              {ticketList}
            </section>

            <section aria-labelledby="help-policies" className="rounded-[24px] border border-brand-popup-border bg-white p-[8px] shadow-rail-card">
              <h2 id="help-policies" className="px-[12px] pb-[4px] pt-[10px] text-[18px] font-bold text-heading">
                Policies & answers
              </h2>
              <ul>
                {[
                  { href: '/faq', Icon: CircleHelp, label: 'Frequently asked questions' },
                  { href: '/refund-policy', Icon: RotateCcw, label: 'Returns & refund policy' },
                  { href: '/shipping', Icon: Truck, label: 'Shipping & delivery' },
                  { href: '/terms', Icon: FileText, label: 'Terms & conditions' },
                ].map(({ href, Icon, label }) => (
                  <li key={href}>
                    <Link href={href} className="flex items-center gap-[12px] rounded-[14px] px-[12px] py-[10px] text-[14.5px] font-semibold text-heading hover:bg-brand-popup-bg hover:text-brand">
                      <Icon aria-hidden="true" className="size-[19px] text-brand" />
                      <span className="flex-1">{label}</span>
                      <ChevronRight aria-hidden="true" className="size-[16px] text-ink-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="help-contact" className="rounded-[24px] border border-brand-popup-border bg-white p-[18px] shadow-rail-card">
              <h2 id="help-contact" className="mb-[12px] text-[18px] font-bold text-heading">
                Contact us
              </h2>
              <div className="grid grid-cols-3 gap-[10px]">
                {[
                  { href: BUSINESS.phoneHref, Icon: Phone, title: 'Call us', text: BUSINESS.phone },
                  { href: BUSINESS.whatsappHref, Icon: MessageCircle, title: 'WhatsApp', text: 'Chat with us' },
                  { href: BUSINESS.supportEmailHref, Icon: Mail, title: 'Email', text: BUSINESS.email },
                ].map(({ href, Icon, title, text: sub }) => (
                  <a
                    key={title}
                    href={href}
                    {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="flex flex-col items-center rounded-[16px] bg-[#f8faff] px-[8px] py-[12px] text-center transition-colors hover:bg-brand-popup-bg"
                  >
                    <span className="flex size-[38px] items-center justify-center rounded-full bg-white text-brand ring-1 ring-brand-popup-border">
                      <Icon aria-hidden="true" className="size-[18px]" />
                    </span>
                    <span className="mt-[6px] text-[13.5px] font-bold text-heading">{title}</span>
                    <span className="w-full truncate text-[11.5px] text-ink-muted">{sub}</span>
                  </a>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Help Center"
        subtitle="Get help with an order, a refund or your account. We reply in your notifications and by email."
      />

      <div className="mb-[20px] grid gap-[14px] md:grid-cols-2 lg:grid-cols-4">
        <Link
          href={ROUTES.customerCare}
          className="group flex items-center gap-[14px] rounded-[14px] bg-[linear-gradient(135deg,#4c1d95,#6d28d9_60%,#8b5cf6)] p-[16px] font-ui text-white shadow-[0_10px_28px_rgba(109,40,217,0.28)] transition-transform hover:-translate-y-[1px]"
        >
          <span className="flex size-[42px] items-center justify-center rounded-[12px] bg-white/15">
            <Sparkles aria-hidden="true" className="size-[20px]" />
          </span>
          <span>
            <span className="block text-[15px] font-semibold">Ask YouMart AI</span>
            <span className="block text-[12.5px] text-white/80">Instant answers, any time</span>
          </span>
        </Link>
        <Link
          href={ROUTES.returns}
          className="flex items-center gap-[14px] rounded-[14px] border border-catalog-rule bg-white p-[16px] font-ui shadow-rail-card transition-shadow hover:shadow-product-card"
        >
          <span className="flex size-[42px] items-center justify-center rounded-[12px] bg-[#eef3fc] text-brand">
            <RotateCcw aria-hidden="true" className="size-[20px]" />
          </span>
          <span>
            <span className="block text-[15px] font-semibold text-heading">Returns & refunds</span>
            <span className="block text-[12.5px] text-ink-muted">Track a return</span>
          </span>
        </Link>
        <Link
          href="/youfind"
          className="flex items-center gap-[14px] rounded-[14px] border border-catalog-rule bg-white p-[16px] font-ui shadow-rail-card transition-shadow hover:shadow-product-card"
        >
          <span className="flex size-[42px] items-center justify-center rounded-[12px] bg-[#e8f7ee] text-[#047857]">
            <PackageSearch aria-hidden="true" className="size-[20px]" />
          </span>
          <span>
            <span className="block text-[15px] font-semibold text-heading">YouFind Bot</span>
            <span className="block text-[12.5px] text-ink-muted">Can&rsquo;t find a product? Ask</span>
          </span>
        </Link>
        <Link
          href="/faq"
          className="flex items-center gap-[14px] rounded-[14px] border border-catalog-rule bg-white p-[16px] font-ui shadow-rail-card transition-shadow hover:shadow-product-card"
        >
          <span className="flex size-[42px] items-center justify-center rounded-[12px] bg-[#eef3fc] text-brand">
            <FileText aria-hidden="true" className="size-[20px]" />
          </span>
          <span>
            <span className="block text-[15px] font-semibold text-heading">FAQs & policies</span>
            <span className="block text-[12.5px] text-ink-muted">Shipping, refunds, terms</span>
          </span>
        </Link>
      </div>

      <div className="grid items-start gap-[20px] lg:grid-cols-[1.1fr_1fr]">
        <Panel title="Raise a request">
          <p className="mb-[10px] font-ui text-[13.5px] font-semibold text-heading">What do you need help with?</p>
          <div className="mb-[18px] grid grid-cols-2 gap-[8px] md:grid-cols-3">
            {TOPICS.map((t) => {
              const Icon = TOPIC_ICON[t];
              const on = topic === t;
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTopic(t)}
                  className={`flex flex-col items-start gap-[6px] rounded-[12px] border p-[12px] text-left font-ui text-[13.5px] font-semibold transition-colors ${
                    on
                      ? 'border-brand bg-[#eef3fc] text-brand'
                      : 'border-catalog-rule text-heading hover:border-cart-border'
                  }`}
                >
                  <Icon aria-hidden="true" className={`size-[18px] ${on ? 'text-brand' : 'text-ink-muted'}`} />
                  {HELP_TOPIC_LABELS[t]}
                </button>
              );
            })}
          </div>

          {topic && ORDER_TOPICS.has(topic) ? (
            <div className="mb-[16px]">
              <label htmlFor="help-order" className="mb-[6px] block font-ui text-[13.5px] font-semibold text-heading">
                Which order?
              </label>
              <div className="relative">
                <select
                  id="help-order"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="h-[44px] w-full appearance-none rounded-[10px] border border-catalog-rule bg-white pl-[14px] pr-[36px] font-ui text-[14.5px] text-ink-input focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  <option value="">{orders === null ? 'Loading your orders…' : 'Not about a specific order'}</option>
                  {(orders ?? []).map((o) => (
                    <option key={o.orderId} value={o.orderId}>
                      #{o.orderNumber} · {formatMoney(o.grandTotal)} · {dateTime(o.createdAt)}
                    </option>
                  ))}
                </select>
                <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-[12px] top-1/2 size-[16px] -translate-y-1/2 text-ink-muted" />
              </div>
              {chosenOrder ? (
                <p className="mt-[6px] font-ui text-[12.5px] text-ink-muted">
                  <Link href={orderHref(chosenOrder.orderNumber)} className="font-semibold text-brand hover:underline">
                    View order #{chosenOrder.orderNumber}
                  </Link>
                </p>
              ) : null}
            </div>
          ) : null}

          <label htmlFor="help-message" className="mb-[6px] block font-ui text-[13.5px] font-semibold text-heading">
            Describe the problem
          </label>
          <textarea
            id="help-message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="Tell us what happened - the more detail, the faster we can help."
            className="w-full resize-y rounded-[10px] border border-catalog-rule px-[14px] py-[10px] font-ui text-[14.5px] text-ink-input placeholder:text-ink-placeholder focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <p className="mb-[14px] mt-[4px] text-right font-ui text-[12px] text-ink-muted">{text.length}/2000</p>
          {message ? <Banner tone={message.tone}>{message.text}</Banner> : null}
          <button type="button" onClick={() => void submit()} disabled={busy} className={`${BTN_PRIMARY} w-full`}>
            {busy ? <Loader2 aria-hidden="true" className="size-[16px] animate-spin" /> : <Send aria-hidden="true" className="size-[15px]" />}
            Send request
          </button>
        </Panel>

        <Panel title="My requests" padded={false}>
          {ticketList}
        </Panel>
      </div>
    </>
  );
}
