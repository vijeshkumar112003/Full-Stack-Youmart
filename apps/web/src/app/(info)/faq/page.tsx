import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Headset, MessageCircleQuestion, Navigation, RefreshCw, Sparkles, Truck } from 'lucide-react';
import { BUSINESS, FAQ_PAGE } from '@youmart/shared-client';
import { FaWhatsapp } from '@/components/ui/FaIcons';
import { PageHero } from '@/components/info/PageHero';
import { RichText } from '@/components/info/RichText';

export const metadata: Metadata = { title: 'FAQ - You Mart' };

const TEXT = 'font-ui text-[14.6px] leading-[1.6] text-ink-body lg:text-[16px]';

// Live Elementor accordion: 1px #ececec rules, 16px bold titles, +/- icon, one item open at a time.
export default function FaqPage() {
  return (
    <>
      <PageHero title={FAQ_PAGE.title} text={FAQ_PAGE.subtitle} />
      <div className="mx-auto max-w-[1240px] px-[20px] py-[50px] lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-[32px] lg:py-[64px]">
        <div>
          <h2 className="mb-[24px] font-ui text-[24px] font-semibold uppercase leading-[1.3] text-info-faqHeading lg:mb-[20px] lg:text-[28px] lg:font-bold lg:normal-case lg:text-heading">
            {FAQ_PAGE.heading}
          </h2>
          <div className="border-x border-t border-info-accordionLine lg:flex lg:flex-col lg:gap-[12px] lg:border-0">
            {FAQ_PAGE.items.map((item, index) => (
              <details
                key={item.question}
                name="faq"
                open={index === 0}
                className="group border-b border-info-accordionLine lg:rounded-[20px] lg:border lg:border-brand-popup-border lg:bg-white lg:shadow-rail-card lg:transition-shadow lg:open:shadow-[0_12px_28px_rgba(1,66,170,0.12)] lg:open:ring-1 lg:open:ring-brand/30"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-[16px] p-[16px] font-ui text-[15px] font-bold leading-[1.3] text-ink-body group-open:text-info-accordionIcon lg:px-[20px] lg:py-[18px] lg:text-[16.5px] lg:text-heading lg:group-open:text-brand [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-[14px]">
                    <span aria-hidden="true" className="hidden size-[34px] shrink-0 items-center justify-center rounded-[11px] bg-brand-popup-bg text-[14px] font-bold text-brand group-open:bg-brand group-open:text-white lg:flex">
                      {index + 1}
                    </span>
                    {item.question}
                  </span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-[22px] font-bold leading-none text-info-accordionIcon lg:flex lg:size-[32px] lg:items-center lg:justify-center lg:rounded-full lg:bg-[#f3f7fe] lg:text-[20px] lg:text-brand"
                  >
                    <span className="group-open:hidden">+</span>
                    <span className="hidden group-open:inline">&minus;</span>
                  </span>
                </summary>
                <div
                  className={`${TEXT} border-t border-info-accordionLine px-[16px] pb-[16px] pt-[5px] lg:border-brand-popup-border lg:px-[20px] lg:pb-[20px] lg:pl-[68px] lg:pt-[8px]`}
                >
                  {item.answer.map((part, partIndex) =>
                    typeof part === 'string' ? (
                      <p key={partIndex} className="mt-[10px]">
                        <RichText text={part} />
                      </p>
                    ) : (
                      <ul key={partIndex} className="ml-[24px] mt-[6px] list-disc marker:text-brand">
                        {part.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    ),
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>

        <aside className="mt-[30px] space-y-[16px] font-ui lg:sticky lg:top-[16px] lg:mt-[56px]">
          <div className="rounded-[24px] bg-[linear-gradient(140deg,#0142aa,#3b82f6)] p-[22px] text-white shadow-[0_14px_32px_rgba(1,66,170,0.25)]">
            <span className="flex size-[46px] items-center justify-center rounded-[14px] bg-white/15">
              <MessageCircleQuestion aria-hidden="true" className="size-[22px]" />
            </span>
            <p className="mt-[12px] text-[19px] font-bold">Still have a question?</p>
            <p className="mt-[4px] text-[14px] text-white/80">Ask Yumo for an instant answer, or talk to our team.</p>
            <div className="mt-[16px] grid gap-[8px]">
              <Link href="/ask/yumo" className="flex items-center justify-center gap-[8px] rounded-[12px] bg-white py-[10px] text-[14.5px] font-bold text-brand hover:bg-brand-popup-bg">
                <Sparkles aria-hidden="true" className="size-[16px]" /> Ask Yumo
              </Link>
              <a href={BUSINESS.whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-[8px] rounded-[12px] bg-[#25d366] py-[10px] text-[14.5px] font-bold">
                <FaWhatsapp className="size-[16px]" /> WhatsApp us
              </a>
            </div>
          </div>
          <nav aria-label="Helpful pages" className="rounded-[24px] border border-brand-popup-border bg-white p-[10px] shadow-rail-card">
            <p className="px-[12px] pb-[4px] pt-[8px] text-[12px] font-bold uppercase tracking-[0.08em] text-ink-muted">Helpful pages</p>
            <ul>
              {[
                { href: '/track-order', label: 'Track an order', Icon: Navigation },
                { href: '/shipping', label: 'Shipping & delivery', Icon: Truck },
                { href: '/refund-policy', label: 'Returns & refunds', Icon: RefreshCw },
                { href: '/customer-care', label: 'Customer care', Icon: Headset },
              ].map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link href={href} className="group flex items-center gap-[12px] rounded-[14px] px-[12px] py-[10px] text-[14.5px] font-semibold text-heading hover:bg-brand-popup-bg hover:text-brand">
                    <Icon aria-hidden="true" className="size-[18px] text-brand" />
                    <span className="flex-1">{label}</span>
                    <ChevronRight aria-hidden="true" className="size-[16px] text-ink-muted group-hover:text-brand" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </>
  );
}
