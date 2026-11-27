'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, Trash2 } from 'lucide-react';
import type { ProductCardData } from '@youmart/shared-client';
import { MiniProductCard } from '@/components/mhome/MiniProductCard';
import { ProductCard } from '@/components/product/ProductCard';
import { clearRecentlyViewed, loadRecentlyViewed } from '@/lib/recently-viewed';
import { useSession } from '@/lib/session';
import { Notice } from './Notice';
import { BODY_TEXT, TEXT_LINK } from './formStyles';
import { BTN_PRIMARY, BTN_SECONDARY, EmptyState, PageHeader, Panel, Skeleton } from './ui';

const GRID = 'grid grid-cols-2 gap-x-[10px] md:grid-cols-3 md:gap-x-[20px]';

/** Account > Recently viewed: the full browsing history as product cards, with Clear. */
export function RecentlyViewedView() {
  const session = useSession();
  const [items, setItems] = useState<ProductCardData[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (session.status === 'loading') return;
    let active = true;
    loadRecentlyViewed()
      .then((list) => active && setItems(list))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [session.status]);

  const clear = () => {
    if (!window.confirm('Clear your recently viewed products?')) return;
    void clearRecentlyViewed().then(() => setItems([]));
  };

  const header = (
    <PageHeader
      title="Recently viewed"
      icon={History}
      subtitle={
        items && items.length > 0
          ? `${items.length} product${items.length === 1 ? '' : 's'} you looked at recently - pick up where you left off.`
          : 'Products you look at show up here, so you can find them again.'
      }
      actions={
        items && items.length > 0 ? (
          <button type="button" onClick={clear} className={`${BTN_SECONDARY} hidden hover:!border-woo-error hover:!text-woo-error lg:inline-flex`}>
            <Trash2 aria-hidden="true" className="size-[15px]" /> Clear history
          </button>
        ) : null
      }
    />
  );

  if (failed)
    return (
      <>
        {header}
        <Notice tone="error">We could not load your history. Please try again.</Notice>
      </>
    );
  if (!items)
    return (
      <>
        {header}
        <div aria-busy="true" className="hidden grid-cols-5 gap-[16px] lg:grid">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-[300px] w-full rounded-[18px]" />
          ))}
        </div>
        <div aria-busy="true" className="min-h-[240px] lg:hidden" />
      </>
    );
  if (items.length === 0) {
    return (
      <>
        {header}
        <div className="hidden lg:block">
          <Panel>
            <EmptyState
              icon={History}
              title="Nothing here yet"
              action={
                <Link href="/" className={BTN_PRIMARY}>
                  Start shopping
                </Link>
              }
            >
              Products you look at will show up here, newest first.
            </EmptyState>
          </Panel>
        </div>
        <p className={`${BODY_TEXT} lg:hidden`}>
          Products you look at will show up here.{' '}
          <Link href="/" className={TEXT_LINK}>
            Start shopping
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      {header}
      {/* Desktop: the app's product cards, five a row. */}
      <ul className="hidden grid-cols-4 gap-[16px] lg:grid min-[1360px]:grid-cols-5">
        {items.map((product) => (
          <li key={product.id}>
            <MiniProductCard product={product} size="desktop" />
          </li>
        ))}
      </ul>
      <div className="lg:hidden">
        <div className="mb-[14px] flex items-center justify-between">
          <p className="font-ui text-[14px] text-ink-muted">{items.length} products</p>
          <button type="button" onClick={clear} className={TEXT_LINK}>
            Clear history
          </button>
        </div>
        <ul className={GRID}>
          {items.map((product) => (
            <li key={product.id} className="mb-[10px]">
              <ProductCard product={product} variant="listing" />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
