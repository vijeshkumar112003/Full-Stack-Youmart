import type { Metadata } from 'next';
import { ArrowRight, BadgeCheck, Eye, Headset, Home, Package, PartyPopper, ShieldCheck, Sparkles, Sprout, Tags, Target, Truck, Wallet } from 'lucide-react';
import Link from 'next/link';
import { ABOUT_PAGE } from '@youmart/shared-client';
import { RichText } from '@/components/info/RichText';

export const metadata: Metadata = { title: 'About - You Mart' };

const EYEBROW = 'font-ui text-[14px] font-semibold uppercase leading-[1.25] lg:text-[15px]';
const H2 = 'font-ui text-[26px] font-semibold uppercase leading-[1.3] text-heading lg:text-[34px]';
const BODY = 'font-ui text-[14.6px] leading-[1.6] lg:text-[16px]';

// Live About template: split dark/white hero, image + intro, Mission & Vision band, "Talk to us"
// band. Stock photos are placeholders until YouMart supplies its own.
export default function AboutPage() {
  const { hero, intro, missionVision, cta } = ABOUT_PAGE;
  return (
    <>
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#061a45_0%,#0142aa_55%,#1e88e5_100%)]">
        <span aria-hidden="true" className="absolute -right-[120px] -top-[140px] size-[460px] rounded-full bg-white/[0.06]" />
        <div className="relative mx-auto flex max-w-[1240px] flex-col gap-[36px] px-[20px] py-[56px] lg:flex-row lg:items-center lg:gap-[48px] lg:py-[96px]">
          <div className="lg:w-1/2">
            <p className={`${EYEBROW} text-[#ffd60a]`}>{hero.eyebrow}</p>
            <h1 className="mt-[14px] font-ui text-[36px] font-bold leading-[1.15] text-white lg:text-[56px]">
              {hero.title}
            </h1>
            <p className="mt-[16px] max-w-[480px] font-ui text-[16px] leading-[1.6] text-white/80">
              Shop easy, live better - everything for your home, garden, family and celebrations, delivered to your door.
            </p>
          </div>
          <ul className="grid flex-1 grid-cols-2 gap-[14px]">
            {[
              { Icon: Package, value: '5 lakh+', label: 'Products' },
              { Icon: Tags, value: '8,000+', label: 'Brands' },
              { Icon: Truck, value: 'Fast', label: 'Delivery across India' },
              { Icon: ShieldCheck, value: '100%', label: 'Secure payments' },
            ].map(({ Icon, value, label }) => (
              <li key={label} className="rounded-[18px] bg-white/[0.08] p-[20px] text-white ring-1 ring-white/15 backdrop-blur-[2px]">
                <Icon aria-hidden="true" className="size-[26px] text-[#ffd60a]" />
                <p className="mt-[14px] font-ui text-[30px] font-bold leading-none">{value}</p>
                <p className="mt-[6px] font-ui text-[14px] text-white/75">{label}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto flex max-w-[1240px] flex-col gap-[30px] px-[20px] py-[50px] lg:flex-row lg:items-center lg:gap-[56px] lg:py-[96px]">
        <ul className="grid w-full shrink-0 grid-cols-2 gap-[14px] lg:w-[560px]">
          {[
            { Icon: Sprout, title: 'Home & garden', text: 'Seeds, plants, fertilisers and tools' },
            { Icon: Sparkles, title: 'Beauty & care', text: 'Cosmetics, skin and hair care' },
            { Icon: PartyPopper, title: 'Celebrations', text: 'Party, gifts and festival decor' },
            { Icon: Home, title: 'Everyday needs', text: 'Kitchen, cleaning and stationery' },
          ].map(({ Icon, title, text }) => (
            <li key={title} className="rounded-[18px] border border-catalog-rule bg-white p-[20px] shadow-rail-card lg:rounded-[24px] lg:border-brand-popup-border">
              <span className="flex size-[46px] items-center justify-center rounded-[14px] bg-[#eef3fc] text-brand">
                <Icon aria-hidden="true" className="size-[22px]" />
              </span>
              <p className="mt-[12px] font-ui text-[16px] font-semibold text-heading">{title}</p>
              <p className="mt-[2px] font-ui text-[13.5px] text-ink-muted">{text}</p>
            </li>
          ))}
        </ul>
        <div>
          <p className={`${EYEBROW} text-heading`}>{intro.eyebrow}</p>
          <h2 className={`${H2} mt-[10px] lg:normal-case lg:font-bold`}>{intro.title}</h2>
          <h3 className="mt-[30px] font-ui text-[16px] font-semibold uppercase leading-[1.2] text-heading lg:text-[17px]">
            {intro.subtitle}
          </h3>
          {intro.paragraphs.map((text) => (
            <p key={text.slice(0, 24)} className={`${BODY} mt-[10px] text-ink-body`}>
              <RichText text={text} />
            </p>
          ))}
        </div>
      </section>

      {/* Mission & vision as cards. */}
      <section className="bg-[#f3f7fe]">
        <div className="mx-auto max-w-[1240px] px-[20px] py-[50px] lg:py-[80px]">
          <p className={`${EYEBROW} text-center text-brand`}>{missionVision.eyebrow}</p>
          <h2 className="mt-[8px] text-center font-ui text-[28px] font-bold leading-[1.25] text-heading lg:text-[36px]">{missionVision.title}</h2>
          <div className="mt-[32px] grid gap-[20px] lg:grid-cols-2">
            {missionVision.items.map((item, i) => {
              const Icon = i === 0 ? Target : Eye;
              return (
                <div key={item.title} className="relative overflow-hidden rounded-[28px] border border-brand-popup-border bg-white p-[28px] shadow-rail-card lg:p-[36px]">
                  <span aria-hidden="true" className="absolute -right-[40px] -top-[40px] size-[140px] rounded-full bg-brand/[0.05]" />
                  <span className="relative flex size-[56px] items-center justify-center rounded-[18px] bg-[linear-gradient(140deg,#0142aa,#3b82f6)] text-white shadow-[0_10px_20px_rgba(1,66,170,0.28)]">
                    <Icon aria-hidden="true" className="size-[26px]" />
                  </span>
                  <h3 className="relative mt-[18px] font-ui text-[24px] font-bold text-heading">{item.title}</h3>
                  <p className={`${BODY} relative mt-[8px] text-ink-body`}>
                    <RichText text={item.text} />
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why shop with YouMart. */}
      <section className="mx-auto max-w-[1240px] px-[20px] py-[50px] lg:py-[80px]">
        <p className={`${EYEBROW} text-center text-brand`}>Why YouMart</p>
        <h2 className="mt-[8px] text-center font-ui text-[28px] font-bold leading-[1.25] text-heading lg:text-[36px]">Shopping made simple</h2>
        <ul className="mt-[32px] grid gap-[16px] sm:grid-cols-2 lg:grid-cols-4">
          {[
            { Icon: BadgeCheck, title: 'Genuine products', text: 'Quality-checked items from trusted brands.' },
            { Icon: Wallet, title: 'Instant refunds', text: 'Refunds land in your YouMart Wallet right away.' },
            { Icon: ShieldCheck, title: 'Secure payments', text: 'UPI, cards and net banking through Razorpay.' },
            { Icon: Headset, title: 'Real help', text: 'AI answers 24×7, and our team on WhatsApp.' },
          ].map(({ Icon, title, text }) => (
            <li key={title} className="rounded-[24px] border border-brand-popup-border bg-white p-[22px] shadow-rail-card transition-shadow hover:shadow-product-card">
              <span className="flex size-[48px] items-center justify-center rounded-[16px] bg-brand-popup-bg text-brand">
                <Icon aria-hidden="true" className="size-[23px]" />
              </span>
              <p className="mt-[14px] font-ui text-[17px] font-bold text-heading">{title}</p>
              <p className="mt-[4px] font-ui text-[14px] leading-[1.55] text-ink-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Talk to us. */}
      <section className="mx-auto max-w-[1240px] px-[20px] pb-[56px] lg:pb-[80px]">
        <div className="relative flex flex-col items-center overflow-hidden rounded-[28px] bg-[linear-gradient(120deg,#061a45_0%,#0142aa_60%,#1e88e5_100%)] px-[24px] py-[44px] text-center lg:py-[56px]">
          <span aria-hidden="true" className="absolute -right-[60px] -top-[80px] size-[260px] rounded-full bg-white/[0.07]" />
          <span aria-hidden="true" className="absolute -bottom-[90px] -left-[40px] size-[220px] rounded-full bg-white/[0.05]" />
          <h2 className="relative font-ui text-[26px] font-bold leading-[1.3] text-white lg:text-[34px]">{cta.title}</h2>
          <p className="relative mt-[10px] max-w-[640px] font-ui text-[16px] leading-[1.5] text-white/80 lg:text-[18px]">{cta.text}</p>
          <div className="relative mt-[24px] flex flex-wrap justify-center gap-[10px]">
            <Link
              href={cta.href}
              className="inline-flex h-[50px] items-center gap-[8px] rounded-[16px] bg-[#ffd60a] px-[26px] font-ui text-[15px] font-bold text-[#1f1300] transition-[filter] hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {cta.button} <ArrowRight aria-hidden="true" className="size-[17px]" />
            </Link>
            <Link
              href="/"
              className="inline-flex h-[50px] items-center gap-[8px] rounded-[16px] bg-white/10 px-[26px] font-ui text-[15px] font-bold text-white ring-1 ring-white/30 hover:bg-white/20"
            >
              Start shopping
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
