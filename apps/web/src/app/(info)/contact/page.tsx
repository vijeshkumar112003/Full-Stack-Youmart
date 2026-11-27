import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Headset, MailOpen, MapPin, Navigation, PhoneCall, ShoppingBag } from 'lucide-react';
import { BUSINESS, CONTACT_PAGE, FOOTER } from '@youmart/shared-client';
import { ContactForm } from '@/components/info/ContactForm';
import { PageHero } from '@/components/info/PageHero';
import { RichText } from '@/components/info/RichText';
import { FaFacebook, FaInstagram, FaWhatsapp, FaYoutube } from '@/components/ui/FaIcons';

export const metadata: Metadata = { title: 'Contact - You Mart' };

const SOCIAL = [
  { id: 'youtube', icon: FaYoutube, bg: 'bg-social-youtube', label: 'YouTube' },
  { id: 'facebook', icon: FaFacebook, bg: 'bg-social-facebook', label: 'Facebook' },
  { id: 'instagram', icon: FaInstagram, bg: 'bg-instagram', label: 'Instagram' },
] as const;

const WAYS = [
  {
    title: 'WhatsApp',
    detail: BUSINESS.whatsapp,
    text: 'Fastest for order questions',
    href: BUSINESS.whatsappHref,
    external: true,
    icon: <FaWhatsapp className="size-[24px] text-white" />,
    tint: 'bg-[#25D366]',
    action: 'Chat now',
    fg: 'text-[#128C4B]',
  },
  {
    title: 'Call us',
    detail: BUSINESS.phone,
    text: 'Talk to our team',
    href: BUSINESS.phoneHref,
    external: false,
    icon: <PhoneCall aria-hidden="true" className="size-[22px] text-white" />,
    tint: 'bg-brand',
    action: 'Call now',
    fg: 'text-brand',
  },
  {
    title: 'Email us',
    detail: BUSINESS.email,
    text: 'For anything in detail',
    href: `mailto:${BUSINESS.email}`,
    external: false,
    icon: <MailOpen aria-hidden="true" className="size-[22px] text-white" />,
    tint: 'bg-[#6d28d9]',
    action: 'Write to us',
    fg: 'text-[#6d28d9]',
  },
  {
    title: 'Customer care',
    detail: 'Help, 24×7',
    text: 'AI answers and quick help',
    href: '/customer-care',
    external: false,
    icon: <Headset aria-hidden="true" className="size-[22px] text-white" />,
    tint: 'bg-[#0b1b3f]',
    action: 'Get help',
    fg: 'text-heading',
  },
] as const;

export default function ContactPage() {
  const socialLinks = SOCIAL.map((s) => ({
    ...s,
    link: FOOTER.social.links.find((l) => l.id === s.id),
  }));
  return (
    <>
      <PageHero title={CONTACT_PAGE.hero.title} text={CONTACT_PAGE.hero.text} />

      {/* Ways to reach us. */}
      <section className="relative z-[1] mx-auto max-w-[1240px] px-[20px] pt-[28px] lg:-mt-[60px] lg:pt-0">
        <ul className="grid gap-[14px] sm:grid-cols-2 lg:grid-cols-4 lg:gap-[18px]">
          {WAYS.map((w) => (
            <li key={w.title}>
              <a
                href={w.href}
                target={w.external ? '_blank' : undefined}
                rel={w.external ? 'noopener noreferrer' : undefined}
                className="group flex h-full flex-col rounded-[24px] bg-white p-[20px] font-ui shadow-[0_12px_32px_rgba(11,27,63,0.1)] ring-1 ring-[#e6ecf6] transition hover:-translate-y-[2px] hover:shadow-[0_18px_40px_rgba(11,27,63,0.14)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <span className={`flex size-[50px] items-center justify-center rounded-[16px] ${w.tint}`}>{w.icon}</span>
                <span className="mt-[14px] text-[17px] font-bold text-heading">{w.title}</span>
                <span className={`mt-[2px] break-words text-[15px] font-bold ${w.fg}`}>{w.detail}</span>
                <span className="mt-[4px] flex-1 text-[13.5px] text-ink-muted">{w.text}</span>
                <span className={`mt-[14px] inline-flex items-center gap-[6px] text-[14px] font-bold ${w.fg}`}>
                  {w.action}
                  <ArrowRight aria-hidden="true" className="size-[15px] transition group-hover:translate-x-[3px]" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Message form beside the store card and map. */}
      <section className="mx-auto grid max-w-[1240px] gap-[24px] px-[20px] py-[40px] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start lg:py-[56px]">
        <ContactForm />
        <div className="overflow-hidden rounded-[28px] border border-brand-popup-border bg-white font-ui shadow-rail-card">
          <iframe
            title={`Map: ${BUSINESS.address}`}
            src={BUSINESS.mapEmbedSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[260px] w-full border-0 lg:h-[300px]"
          />
          <div className="p-[22px]">
            <div className="flex items-start gap-[14px]">
              <span className="flex size-[46px] shrink-0 items-center justify-center rounded-[14px] bg-[#ffe4e6]">
                <MapPin aria-hidden="true" className="size-[22px] text-[#e11d48]" />
              </span>
              <div>
                <p className="text-[17px] font-bold text-heading">Visit our store</p>
                <p className="mt-[2px] text-[14px] leading-[1.55] text-ink-body">{BUSINESS.address}</p>
              </div>
            </div>
            <a
              href={BUSINESS.mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-[16px] flex h-[46px] items-center justify-center gap-[8px] rounded-[14px] bg-brand-popup-bg text-[14.5px] font-bold text-brand hover:bg-[#dce8fd]"
            >
              <Navigation aria-hidden="true" className="size-[16px]" /> Get directions
            </a>
            <div className="mt-[18px] flex items-center justify-between border-t border-brand-popup-border pt-[16px]">
              <span className="text-[13.5px] font-bold text-heading">Follow YouMart</span>
              <ul aria-label="Follow us" className="flex gap-[8px]">
                {socialLinks.map(({ id, icon: Icon, bg, label, link }) =>
                  link ? (
                    <li key={id}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className={`flex size-[38px] items-center justify-center rounded-full ${bg} transition-transform hover:-translate-y-[2px]`}
                      >
                        <Icon className="size-[16px] text-white" />
                      </a>
                    </li>
                  ) : null,
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Closing call to action. */}
      <section className="mx-auto max-w-[1240px] px-[20px] pb-[50px] lg:pb-[72px]">
        <div className="relative flex flex-col gap-[20px] overflow-hidden rounded-[28px] bg-[linear-gradient(120deg,#061a45_0%,#0142aa_60%,#1e88e5_100%)] px-[28px] py-[32px] font-ui text-white lg:flex-row lg:items-center lg:px-[44px]">
          <span aria-hidden="true" className="absolute -right-[60px] -top-[80px] size-[240px] rounded-full bg-white/[0.07]" />
          <div className="relative flex-1">
            <h2 className="text-[24px] font-bold leading-[1.25] lg:text-[28px]">{CONTACT_PAGE.cta.title}</h2>
            <p className="mt-[8px] max-w-[620px] text-[15px] leading-[1.6] text-white/80">
              <RichText text={CONTACT_PAGE.cta.text} />
            </p>
          </div>
          <div className="relative flex flex-wrap gap-[10px]">
            <Link href="/" className="inline-flex h-[50px] items-center gap-[8px] rounded-[16px] bg-[#ffd60a] px-[24px] text-[15px] font-bold text-[#1f1300] hover:brightness-95">
              <ShoppingBag aria-hidden="true" className="size-[18px]" /> Start shopping
            </Link>
            <a href={CONTACT_PAGE.cta.href} className="inline-flex h-[50px] items-center gap-[8px] rounded-[16px] bg-white/10 px-[24px] text-[15px] font-bold text-white ring-1 ring-white/30 hover:bg-white/20">
              <PhoneCall aria-hidden="true" className="size-[17px]" /> {CONTACT_PAGE.cta.button}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
