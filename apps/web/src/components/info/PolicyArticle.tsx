import Link from 'next/link';
import { ChevronRight, FileText, Headphones, Lock, Mail, RefreshCw, TicketPercent, Truck, type LucideIcon } from 'lucide-react';
import { BUSINESS, type PolicyBlock, type PolicyPage } from '@youmart/shared-client';
import { FaWhatsapp } from '@/components/ui/FaIcons';
import { RichText } from './RichText';

const TEXT =
  'font-ui text-[14.6px] leading-[23.35px] text-ink-body lg:text-[16px] lg:leading-[26px]';
const GAP = 'mb-[21.9px] md:mb-[23.35px] lg:mb-[20px]';

function Block({ block }: { block: PolicyBlock }) {
  if (block.type === 'p') {
    return (
      <p className={`${TEXT} ${GAP}`}>
        <RichText text={block.text} />
      </p>
    );
  }
  const List = block.type === 'ul' ? 'ul' : 'ol';
  return (
    <List
      className={`mb-[21.9px] ml-[43.8px] font-sans text-[14.6px] leading-[23.35px] text-ink-body marker:text-brand lg:mb-[22px] lg:ml-[24px] lg:space-y-[6px] lg:text-[16px] lg:leading-[26px] ${
        block.type === 'ul' ? 'list-disc' : 'list-decimal'
      }`}
    >
      {block.items.map((item) => (
        <li key={item} className="lg:pl-[6px]">
          <RichText text={item} />
        </li>
      ))}
    </List>
  );
}

const slugOf = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

/** Every policy page, for the switcher (matched by the page's meta title). */
const POLICIES: { title: string; label: string; href: string; Icon: LucideIcon; sub: string }[] = [
  { title: 'Privacy Policy', label: 'Privacy', href: '/privacy-policy', Icon: Lock, sub: 'What we collect and why' },
  { title: 'Terms & Conditions', label: 'Terms', href: '/terms', Icon: FileText, sub: 'Using YouMart and the wallet' },
  { title: 'Refund Policy', label: 'Refunds', href: '/refund-policy', Icon: RefreshCw, sub: 'Returns, refunds and the wallet' },
  { title: 'Shipping Details', label: 'Shipping', href: '/shipping', Icon: Truck, sub: 'Delivery areas and charges' },
  { title: 'Offers and Coupons', label: 'Offers', href: '/offers', Icon: TicketPercent, sub: 'How offers and coupons work' },
];

// Policy pages (Privacy, Terms, Refund, Shipping, Offers): a brand title band with the policy
// switcher, then the text in a readable card with numbered sections; "On this page" and a help
// card beside it on desktop.
export function PolicyArticle({ page, children }: { page: PolicyPage; children?: React.ReactNode }) {
  const title = page.title.replace(/\s*[–-]\s*you\s*mart\s*:?$/i, '').trim();
  const headings = page.sections.filter((s) => s.heading).map((s) => s.heading!);
  const current = POLICIES.find((p) => p.title === page.metaTitle);
  const Icon = current?.Icon ?? FileText;
  let n = 0;
  return (
    <>
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#061a45_0%,#0142aa_55%,#1e88e5_100%)]">
        <span aria-hidden="true" className="absolute -right-[80px] -top-[120px] size-[340px] rounded-full bg-white/[0.07]" />
        <span aria-hidden="true" className="absolute bottom-[-150px] left-[40%] hidden size-[300px] rounded-full bg-white/[0.04] lg:block" />
        <div className="relative mx-auto max-w-[1240px] px-[20px] py-[40px] lg:max-w-[1320px] lg:pb-[30px] lg:pt-[44px]">
          <nav aria-label="Breadcrumb" className="mb-[14px] hidden items-center gap-[6px] font-ui text-[13px] text-white/70 lg:flex">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <ChevronRight aria-hidden="true" className="size-[13px]" />
            <span>Policies</span>
            <ChevronRight aria-hidden="true" className="size-[13px]" />
            <span className="font-semibold text-white">{title}</span>
          </nav>
          <div className="flex items-center gap-[18px]">
            <span className="hidden size-[64px] shrink-0 items-center justify-center rounded-[20px] bg-white/15 ring-1 ring-white/20 lg:flex">
              <Icon aria-hidden="true" className="size-[30px] text-white" />
            </span>
            <div>
              <p className="font-ui text-[13px] font-semibold uppercase tracking-[0.12em] text-[#ffd60a]">YouMart policies</p>
              <h1 className="mt-[8px] font-ui text-[30px] font-bold leading-[1.2] text-white lg:mt-[4px] lg:text-[40px]">{title}</h1>
              {current ? <p className="mt-[4px] hidden font-ui text-[15px] text-white/80 lg:block">{current.sub}</p> : null}
            </div>
          </div>
          <ul className="mt-[24px] hidden gap-[8px] lg:flex">
            {POLICIES.map((p) => {
              const on = p === current;
              return (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    aria-current={on ? 'page' : undefined}
                    className={`inline-flex items-center gap-[7px] rounded-full px-[16px] py-[8px] font-ui text-[13.5px] font-bold transition-colors ${
                      on ? 'bg-white text-brand shadow-[0_6px_14px_rgba(0,0,0,0.15)]' : 'bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20'
                    }`}
                  >
                    <p.Icon aria-hidden="true" className="size-[15px]" /> {p.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
      <div className="mx-auto max-w-[1240px] px-[12px] py-[28px] lg:grid lg:max-w-[1320px] lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-[28px] lg:px-[20px] lg:pb-[64px] lg:pt-[32px]">
        <div className="min-w-0">
          {children}
          <article className="rounded-[18px] border border-catalog-rule bg-white px-[22px] py-[26px] shadow-rail-card md:px-[40px] lg:rounded-[28px] lg:border-brand-popup-border lg:px-[56px] lg:py-[44px]">
            {page.sections.map((section, index) => {
              if (section.heading) n += 1;
              return (
                <section
                  key={section.heading ?? index}
                  id={section.heading ? slugOf(section.heading) : undefined}
                  className={`scroll-mt-[110px] ${section.heading && index > 0 ? 'lg:mt-[12px] lg:border-t lg:border-brand-popup-border lg:pt-[26px]' : ''}`}
                >
                  {section.heading && (
                    <h2 className="mb-[10px] mt-[8px] flex items-center gap-[12px] font-ui text-[18px] font-semibold leading-[1.35] text-heading lg:mb-[14px] lg:mt-0 lg:text-[21px] lg:font-bold">
                      <span aria-hidden="true" className="hidden size-[32px] shrink-0 items-center justify-center rounded-[10px] bg-brand-popup-bg text-[14px] font-bold text-brand lg:flex">
                        {n}
                      </span>
                      {section.heading}
                    </h2>
                  )}
                  {section.blocks.map((block, blockIndex) => (
                    <Block key={blockIndex} block={block} />
                  ))}
                </section>
              );
            })}
          </article>
        </div>
        <aside className="hidden space-y-[16px] lg:sticky lg:top-[16px] lg:block">
          {headings.length > 2 ? (
            <nav aria-label="On this page" className="max-h-[calc(100vh-260px)] overflow-y-auto rounded-[24px] border border-brand-popup-border bg-white p-[16px] shadow-rail-card [scrollbar-width:thin]">
              <p className="mb-[8px] px-[8px] font-ui text-[12px] font-bold uppercase tracking-[0.08em] text-ink-muted">On this page</p>
              <ol className="space-y-[2px]">
                {headings.map((h, i) => (
                  <li key={h}>
                    <a href={`#${slugOf(h)}`} className="flex gap-[10px] rounded-[12px] px-[8px] py-[7px] font-ui text-[13.5px] text-ink-body hover:bg-brand-popup-bg hover:text-brand">
                      <span className="w-[18px] shrink-0 text-right font-bold text-brand">{i + 1}</span>
                      <span>{h}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
          <div className="rounded-[24px] bg-[linear-gradient(140deg,#0142aa,#3b82f6)] p-[18px] font-ui text-white shadow-[0_12px_28px_rgba(1,66,170,0.25)]">
            <span className="flex size-[42px] items-center justify-center rounded-[14px] bg-white/15">
              <Headphones aria-hidden="true" className="size-[20px]" />
            </span>
            <p className="mt-[10px] text-[16px] font-bold">Questions about this policy?</p>
            <p className="mt-[2px] text-[13px] text-white/80">Our team is happy to help.</p>
            <div className="mt-[14px] grid gap-[8px]">
              <a href={BUSINESS.whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-[8px] rounded-[12px] bg-[#25d366] py-[9px] text-[14px] font-bold">
                <FaWhatsapp className="size-[16px]" /> WhatsApp us
              </a>
              <a href={`mailto:${BUSINESS.email}`} className="flex items-center justify-center gap-[8px] rounded-[12px] bg-white py-[9px] text-[14px] font-bold text-brand">
                <Mail aria-hidden="true" className="size-[16px]" /> {BUSINESS.email}
              </a>
              <Link href="/customer-care" className="text-center text-[13px] font-semibold text-white/90 hover:underline">
                Visit Customer Care
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
