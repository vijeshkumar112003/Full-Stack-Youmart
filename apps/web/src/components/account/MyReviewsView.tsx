'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, MessageSquareText, Pencil, Star } from 'lucide-react';
import { ROUTES, type MyReviewListItem } from '@youmart/shared-client';
import { api } from '@/lib/api';
import { skipImageOptimizer } from '@/lib/images';
import { Notice } from './Notice';
import { BODY_TEXT, TEXT_LINK } from './formStyles';
import { BTN_PRIMARY, BTN_SMALL, EmptyState, PageHeader, Panel, Pill, StatCard, type PillTone } from './ui';

const STATUS: Record<MyReviewListItem['status'], string | null> = {
  PUBLISHED: null,
  PENDING: 'Under review',
  REJECTED: 'Not published',
};
const TONE: Record<MyReviewListItem['status'], { label: string; tone: PillTone }> = {
  PUBLISHED: { label: 'Published', tone: 'green' },
  PENDING: { label: 'Under review', tone: 'orange' },
  REJECTED: { label: 'Not published', tone: 'red' },
};

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-[2px]" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} aria-hidden="true" className={`size-[16px] ${i <= value ? 'fill-[#f59e0b] text-[#f59e0b]' : 'fill-[#e2e8f0] text-[#e2e8f0]'}`} />
      ))}
    </span>
  );
}

/** My reviews: every review the customer has written, with a link to edit it on the product. */
export function MyReviewsView() {
  const [items, setItems] = useState<MyReviewListItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.catalog
      .myReviews()
      .then((r) => setItems(r.items))
      .catch(() => setFailed(true));
  }, []);

  const header = (
    <PageHeader
      title="My reviews"
      icon={Star}
      subtitle="Every review you've written. Edit one any time from its product page."
    />
  );
  if (failed)
    return (
      <>
        {header}
        <Notice tone="error">We could not load your reviews. Please try again.</Notice>
      </>
    );
  if (!items) return <>{header}<div aria-busy="true" className="min-h-[240px]" /></>;
  if (items.length === 0) {
    return (
      <>
        {header}
        <div className="hidden lg:block">
          <Panel>
            <EmptyState
              icon={MessageSquareText}
              title="No reviews yet"
              action={
                <Link href={ROUTES.orders} className={BTN_PRIMARY}>
                  Go to my orders
                </Link>
              }
            >
              Once an order is delivered, rate it from your orders - your reviews help other shoppers choose.
            </EmptyState>
          </Panel>
        </div>
      <p className={`${BODY_TEXT} lg:hidden`}>
        You haven&rsquo;t written any reviews yet. Once an order is delivered, rate it from{' '}
        <Link href={ROUTES.orders} className={TEXT_LINK}>
          your orders
        </Link>
        .
      </p>
      </>
    );
  }

  const avg = items.reduce((n, r) => n + r.rating, 0) / items.length;
  return (
    <>
    {header}
    <div className="mb-[18px] hidden grid-cols-3 gap-[14px] lg:grid">
      <StatCard icon={MessageSquareText} label="Reviews written" value={items.length} />
      <StatCard icon={Star} label="Your average rating" value={`${avg.toFixed(1)} ★`} tone="orange" />
      <StatCard icon={CheckCircle2} label="Published" value={items.filter((r) => r.status === 'PUBLISHED').length} tone="green" />
    </div>
    <ul className="flex flex-col gap-[14px] lg:hidden">
      {items.map((review) => {
        const status = STATUS[review.status];
        const href = review.product ? `/product/${review.product.slug}#reviews` : null;
        return (
          <li
            key={review.id}
            className="rounded-[12px] border border-catalog-rule bg-white p-[16px] font-ui"
          >
            <div className="flex items-center gap-[12px]">
              {review.product?.imageUrl ? (
                <Image
                  src={review.product.imageUrl}
                  alt=""
                  width={48}
                  height={48}
                  unoptimized={skipImageOptimizer(review.product.imageUrl)}
                  className="size-[48px] rounded-[8px] border border-catalog-rule object-contain"
                />
              ) : null}
              <p className="min-w-0 flex-1 text-[14.5px] font-semibold text-heading">
                {review.product?.title ?? 'Product no longer available'}
              </p>
            </div>
            <div className="mt-[10px] flex items-center gap-[8px]">
              <span className="inline-flex items-center gap-[3px] rounded-[5px] bg-[#26a541] px-[6px] py-[1px] text-[12px] font-bold text-white">
                {review.rating}
                <Star aria-hidden="true" className="size-[11px] fill-white" />
              </span>
              {review.title ? (
                <span className="text-[14.5px] font-semibold text-heading">{review.title}</span>
              ) : null}
            </div>
            <p className="mt-[6px] whitespace-pre-line text-[14px] leading-[1.55] text-ink-body">
              {review.body}
            </p>
            <div className="mt-[8px] flex items-center justify-between text-[12.5px] text-ink-muted">
              <span>
                {new Date(review.updatedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                {status ? ` · ${status}` : ''}
              </span>
              {href ? (
                <Link href={href} className={TEXT_LINK}>
                  Edit review
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
    <ul className="hidden grid-cols-2 gap-[16px] lg:grid">
      {items.map((review) => {
        const st = TONE[review.status];
        const href = review.product ? `/product/${review.product.slug}#reviews` : null;
        return (
          <li key={review.id} className="flex flex-col rounded-[20px] border border-brand-popup-border bg-white p-[18px] font-ui shadow-rail-card transition-shadow hover:shadow-product-card">
            <div className="flex items-center gap-[14px]">
              <span className="flex size-[64px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-brand-popup-border bg-white">
                {review.product?.imageUrl ? (
                  <Image
                    src={review.product.imageUrl}
                    alt=""
                    width={64}
                    height={64}
                    unoptimized={skipImageOptimizer(review.product.imageUrl)}
                    className="size-full object-contain p-[4px]"
                  />
                ) : (
                  <MessageSquareText aria-hidden="true" className="size-[22px] text-card-border" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                {href ? (
                  <Link href={`/product/${review.product!.slug}`} className="line-clamp-2 text-[14.5px] font-bold leading-[1.4] text-heading hover:text-brand">
                    {review.product!.title}
                  </Link>
                ) : (
                  <p className="text-[14.5px] font-bold text-ink-muted">Product no longer available</p>
                )}
              </div>
            </div>
            <div className="mt-[14px] flex items-center justify-between gap-[10px]">
              <Stars value={review.rating} />
              <Pill tone={st.tone}>{st.label}</Pill>
            </div>
            {review.title ? <p className="mt-[8px] text-[15.5px] font-bold text-heading">{review.title}</p> : null}
            <p className="mt-[4px] line-clamp-4 whitespace-pre-line text-[14px] leading-[1.6] text-ink-body">{review.body}</p>
            <div className="mt-auto flex items-center justify-between border-t border-brand-popup-border pt-[12px] text-[12.5px] text-ink-muted [&]:mt-[14px]">
              <span>
                {new Date(review.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              {href ? (
                <Link href={href} className={BTN_SMALL}>
                  <Pencil aria-hidden="true" className="size-[13px]" /> Edit review
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
    </>
  );
}
