import type { Metadata } from 'next';
import Link from 'next/link';
import { ClipboardList, Headphones, MessageCircle, PackageSearch, ShoppingBasket, Truck } from 'lucide-react';
import { CategoryBar } from '@/components/category/CategoryBar';
import { TrackOrderForm } from '@/components/account/TrackOrderForm';
import { categoryBarMains } from '@/lib/category-taxonomy';

export const metadata: Metadata = { title: 'Track Order - You Mart' };

interface TrackOrderPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

// Live: a centred 500px form. `?order=` pre-fills the Order ID (links from emails/receipts); the
// phone is always typed, never put in a URL.
export default function TrackOrderPage({ searchParams }: TrackOrderPageProps) {
  const raw = searchParams.order ?? searchParams.orderid;
  const orderNumber = ((Array.isArray(raw) ? raw[0] : raw) ?? '').trim().slice(0, 40);

  return (
    <>
      <CategoryBar mains={categoryBarMains()} />
      <div className="px-[10px] py-[10px] lg:bg-[radial-gradient(circle_at_15%_0%,#e3edff_0%,transparent_55%)] lg:px-[32px] lg:pb-[56px] lg:pt-[48px]">
        <div className="mx-auto mb-[8px] mt-[16px] max-w-[560px] text-center font-ui lg:hidden">
          <span className="mx-auto mb-[12px] flex size-[64px] items-center justify-center rounded-full bg-[#eef3fc]">
            <PackageSearch aria-hidden="true" className="size-[30px] text-brand" />
          </span>
          <h1 className="text-[28px] font-semibold text-heading">Track your order</h1>
          <p className="mt-[4px] text-[15px] text-ink-muted">No sign-in needed - just your order ID and mobile number.</p>
        </div>
        <TrackOrderForm
          initialOrderNumber={orderNumber}
          aside={
            <div className="hidden font-ui lg:block">
              <span className="inline-flex items-center gap-[8px] rounded-full bg-white px-[14px] py-[6px] text-[12.5px] font-bold uppercase tracking-[0.1em] text-brand shadow-rail-card">
                <PackageSearch aria-hidden="true" className="size-[15px]" /> Order tracking
              </span>
              <h1 className="mt-[16px] text-[44px] font-bold leading-[1.1] text-heading">
                Where&rsquo;s my
                <br />
                <span className="text-brand">order?</span>
              </h1>
              <p className="mt-[12px] max-w-[480px] text-[16px] leading-[1.6] text-ink-muted">
                No sign-in needed - just your Order ID (or the courier tracking number) and the mobile number you used at checkout.
              </p>
              <ul className="mt-[24px] grid max-w-[520px] gap-[10px]">
                {[
                  { Icon: ClipboardList, title: 'Find your Order ID', text: 'It’s in your order confirmation on WhatsApp, SMS or email (YM-…)' },
                  { Icon: Truck, title: 'Or use the tracking number', text: 'From your “shipped” message - the courier’s AWB number works too' },
                  { Icon: MessageCircle, title: 'Live updates', text: 'We also message you when it’s packed, shipped and delivered' },
                ].map(({ Icon, title, text }) => (
                  <li key={title} className="flex items-center gap-[14px] rounded-[18px] border border-brand-popup-border bg-white px-[16px] py-[12px] shadow-rail-card">
                    <span className="flex size-[42px] shrink-0 items-center justify-center rounded-[14px] bg-brand-popup-bg text-brand">
                      <Icon aria-hidden="true" className="size-[20px]" />
                    </span>
                    <span>
                      <span className="block text-[14.5px] font-bold text-heading">{title}</span>
                      <span className="block text-[13px] text-ink-muted">{text}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-[18px] flex flex-wrap items-center gap-[16px] text-[14px] font-semibold">
                <Link href="/account/orders" className="inline-flex items-center gap-[6px] text-brand hover:underline">
                  <ShoppingBasket aria-hidden="true" className="size-[16px]" /> Signed in? See My Orders
                </Link>
                <Link href="/customer-care" className="inline-flex items-center gap-[6px] text-brand hover:underline">
                  <Headphones aria-hidden="true" className="size-[16px]" /> Need help?
                </Link>
              </p>
            </div>
          }
        />
      </div>
    </>
  );
}
