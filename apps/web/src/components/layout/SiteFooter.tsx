import Link from 'next/link';
import { ArrowRight, Mail, MapPin, MessageCircle, Phone, Smartphone } from 'lucide-react';
import { BUSINESS, FOOTER } from '@youmart/shared-client';
import { FaFacebook, FaInstagram, FaShareAlt, FaYoutube } from '@/components/ui/FaIcons';
import { PROMISES, QUICK_LINKS } from '@/components/mhome/footer-data';

// DESKTOP (>= 1025px) footer: the app's navy footer (apps/mobile/src/components/Footer.tsx, the
// phone site's AppFooter) laid out in columns - brand + promises, quick links, policies, contact,
// the app. Below 1025px AppFooter is shown instead.

const SOCIAL = {
  youtube: FaYoutube,
  facebook: FaFacebook,
  instagram: FaInstagram,
  share: FaShareAlt,
} as const;

const HEAD = 'mb-[14px] font-ui text-[12px] font-bold uppercase tracking-[1.2px] text-white/60';
const LINK = 'font-ui text-[14.5px] font-medium text-white/90 transition-colors hover:text-[#ffd23f]';

export function SiteFooter() {
  const contacts = [
    { icon: Mail, value: BUSINESS.email, href: `mailto:${BUSINESS.email}` },
    { icon: Phone, value: BUSINESS.phone, href: BUSINESS.phoneHref },
    { icon: MessageCircle, value: BUSINESS.whatsapp, href: BUSINESS.whatsappHref },
    { icon: MapPin, value: BUSINESS.address, href: BUSINESS.mapsHref },
  ];
  return (
    <footer className="relative mt-[64px] hidden overflow-hidden rounded-t-[36px] bg-[linear-gradient(170deg,#0b1f4d_0%,#0a2a6e_55%,#0142aa_100%)] lg:block">
      <span aria-hidden="true" className="absolute -right-[140px] -top-[200px] size-[420px] rounded-full bg-white/[0.05]" />
      <span aria-hidden="true" className="absolute -bottom-[220px] left-[30%] size-[380px] rounded-full bg-white/[0.04]" />
      <div className="relative mx-auto max-w-[1440px] px-[32px] pt-[48px]">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1.3fr_1fr] gap-[40px]">
          <div>
            <p className="font-ui text-[34px] font-bold leading-none text-white">
              You<span className="text-[#ffd23f]">Mart</span>
            </p>
            <p className="mt-[12px] max-w-[320px] text-[14px] leading-[21px] text-white/80">
              Shop easy, live better - everything you need, delivered to your door.
            </p>
            <div className="mt-[20px] grid max-w-[340px] grid-cols-2 gap-[8px]">
              {PROMISES.map((p) => (
                <div key={p.label} className="flex items-center gap-[8px] rounded-[12px] bg-white/[0.08] px-[12px] py-[10px]">
                  <p.icon aria-hidden="true" className="size-[17px] shrink-0 text-[#ffd23f]" />
                  <span className="font-ui text-[13px] font-semibold text-white">{p.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-[20px] flex gap-[10px]">
              {FOOTER.social.links.map((s) => {
                const Icon = SOCIAL[s.id];
                return (
                  <a
                    key={s.id}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex size-[38px] items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#ffd23f] hover:text-[#0b1f4d]"
                  >
                    <Icon className="size-[16px]" />
                  </a>
                );
              })}
            </div>
          </div>

          <nav aria-label="Quick links">
            <p className={HEAD}>Quick links</p>
            <ul className="flex flex-col gap-[10px]">
              {QUICK_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className={`${LINK} flex items-center gap-[8px]`}>
                    <l.icon aria-hidden="true" className="size-[15px] text-[#ffd23f]" /> {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="More from YouMart">
            <p className={HEAD}>Shop &amp; sell</p>
            <ul className="flex flex-col gap-[10px]">
              {FOOTER.quickLinks.links
                .filter((l) => !QUICK_LINKS.some((q) => q.href === l.href))
                .map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={LINK}>
                      {l.label}
                    </Link>
                  </li>
                ))}
            </ul>
            <p className={`${HEAD} mt-[24px]`}>{FOOTER.policy.heading}</p>
            <ul className="flex flex-col gap-[10px]">
              {FOOTER.policy.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={LINK}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className={HEAD}>Get in touch</p>
            <div className="flex flex-col gap-[12px]">
              {contacts.map((c) => (
                <a key={c.value} href={c.href} className="group flex items-start gap-[12px]">
                  <span className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-[#ffd23f]">
                    <c.icon aria-hidden="true" className="size-[15px] text-[#0b1f4d]" />
                  </span>
                  <span className="pt-[6px] font-ui text-[14px] font-medium leading-[20px] text-white group-hover:text-[#ffd23f]">{c.value}</span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className={HEAD}>Get the app</p>
            <div className="rounded-[20px] border border-white/15 bg-white/[0.08] p-[18px]">
              <span className="flex size-[44px] items-center justify-center rounded-[14px] bg-[#ffd23f]">
                <Smartphone aria-hidden="true" className="size-[22px] text-[#0b1f4d]" />
              </span>
              <p className="mt-[12px] font-ui text-[16px] font-bold text-white">Shop faster on the YouMart app</p>
              <p className="mt-[4px] text-[13px] leading-[18px] text-white/75">Deals, order tracking and quick reorder in your pocket.</p>
              <a
                href={BUSINESS.appStoreHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-[14px] flex items-center justify-center gap-[6px] rounded-[12px] bg-white py-[10px] font-ui text-[14px] font-bold text-brand transition-transform hover:scale-[1.03]"
              >
                Download app <ArrowRight aria-hidden="true" className="size-[15px]" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-[40px] flex items-center justify-between border-t border-white/[0.18] py-[18px] font-ui text-[13px] font-medium text-white/60">
          <span>© 2026 YouMart · youmart.in · Made in India 🇮🇳</span>
          <span className="flex gap-[20px]">
            {FOOTER.policy.links.slice(0, 3).map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white">
                {l.label}
              </Link>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
