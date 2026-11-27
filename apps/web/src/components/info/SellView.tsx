'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, BarChart3, Bike, Box, Check, CheckCircle2, Clock, IndianRupee, LayoutGrid, Loader2, ShieldCheck, Store, XCircle } from 'lucide-react';
import {
  ApiError,
  STORE_CATEGORIES,
  loginHref,
  type SellerApplication,
  type SellerApplicationStatus,
  type SellerBusinessType,
} from '@youmart/shared-client';
import { INPUT, Skeleton } from '@/components/account/ui';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';

const GOLD = '#ffd60a';
const OTHER = 'Other';
const TYPE_LABEL: Record<SellerBusinessType, string> = {
  INDIVIDUAL: 'Individual',
  SHOP: 'Shop / retailer',
  BRAND: 'Own brand',
  MANUFACTURER: 'Manufacturer',
  WHOLESALER: 'Wholesaler',
};
const STEPS = [
  { title: 'Register your business', text: 'Sign up with your GST, PAN and bank details.' },
  { title: 'List your products', text: 'Add photos, prices and stock from your phone or computer.' },
  { title: 'Receive orders', text: 'Customers across India discover and buy from your store.' },
  { title: 'Get paid', text: 'We deliver, and your earnings land in your bank account.' },
];
const PERKS = [
  { Icon: Store, title: 'Your brand store', text: 'A page for your brand and catalogue' },
  { Icon: LayoutGrid, title: 'Seller dashboard', text: 'Orders, stock and payouts in one place' },
  { Icon: Bike, title: 'Delivery handled', text: 'We pick up, pack and deliver' },
  { Icon: ShieldCheck, title: 'Secure payouts', text: 'Clear statements for every order' },
];
const TRACK: { status: SellerApplicationStatus; title: string; text: string }[] = [
  { status: 'NEW', title: 'Application received', text: 'Our seller team is reviewing it.' },
  { status: 'CONTACTED', title: 'Team in touch', text: 'We have reached out to you.' },
  { status: 'SHORTLISTED', title: 'Shortlisted', text: 'You’re on the launch list.' },
  { status: 'ONBOARDED', title: 'Ready to sell', text: 'We will set up your store at launch.' },
];
const digits = (v: string) => v.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const ORBIT = [Box, IndianRupee, Bike, BarChart3];

/** The app's storefront with icons slowly orbiting it (still when reduced motion is on). */
function Orbit() {
  return (
    <div aria-hidden="true" className="relative flex size-[236px] shrink-0 items-center justify-center">
      <span className="absolute size-[184px] rounded-full border border-dashed border-white/20" />
      <span className="absolute size-[120px] rounded-full border border-white/10" />
      <div className="absolute size-[184px] animate-[spin_24s_linear_infinite] motion-reduce:animate-none">
        {ORBIT.map((Icon, i) => {
          const a = (i / ORBIT.length) * Math.PI * 2;
          return (
            <span
              key={i}
              className="absolute left-1/2 top-1/2"
              style={{ transform: `translate(calc(-50% + ${Math.round(Math.cos(a) * 92)}px), calc(-50% + ${Math.round(Math.sin(a) * 92)}px))` }}
            >
              <span className="flex size-[36px] animate-[spin_24s_linear_infinite_reverse] items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur motion-reduce:animate-none">
                <Icon className="size-[16px] text-white" />
              </span>
            </span>
          );
        })}
      </div>
      <span
        className="relative flex size-[78px] items-center justify-center rounded-[24px] shadow-[0_0_0_10px_rgba(255,214,10,0.12),0_16px_36px_rgba(255,214,10,0.3)]"
        style={{ background: GOLD }}
      >
        <Store className="size-[36px] text-[#1f1300]" />
      </span>
    </div>
  );
}

function Status({ app }: { app: SellerApplication }) {
  if (app.status === 'DECLINED') {
    return (
      <div className="flex items-start gap-[12px] rounded-[14px] border border-[#f5c2c2] bg-[#fdf6f6] p-[16px]">
        <XCircle aria-hidden="true" className="mt-[2px] size-[20px] text-[#b91c1c]" />
        <p className="text-[14.5px] text-heading">
          Your application ({app.referenceCode}) was closed. You&rsquo;re welcome to apply again when selling opens to everyone.
        </p>
      </div>
    );
  }
  const at = TRACK.findIndex((t) => t.status === app.status);
  return (
    <div>
      <div className="mb-[18px] flex items-start gap-[12px] rounded-[16px] bg-[#f8faff] p-[14px]">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-bold text-heading">{app.businessName}</p>
          <p className="truncate text-[13px] text-ink-muted">
            {TYPE_LABEL[app.businessType]} · {app.category} · {app.city}
          </p>
        </div>
        <div className="shrink-0 rounded-[12px] bg-white px-[12px] py-[6px] text-right ring-1 ring-brand-popup-border">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">Ref.</p>
          <p className="text-[14px] font-bold text-brand">{app.referenceCode}</p>
        </div>
      </div>
      <ol className="space-y-[2px]">
        {TRACK.map((t, i) => {
          const done = i <= at;
          return (
            <li key={t.status} className="relative flex gap-[14px] pb-[16px] last:pb-0">
              {i < TRACK.length - 1 ? (
                <span aria-hidden="true" className={`absolute left-[13px] top-[28px] h-[calc(100%-28px)] w-[2px] ${i < at ? 'bg-brand' : 'bg-[#e2e8f0]'}`} />
              ) : null}
              <span className={`relative z-[1] flex size-[28px] shrink-0 items-center justify-center rounded-full ${done ? 'bg-brand text-white' : 'border-2 border-[#cbd5e1] bg-white'} ${i === at ? 'shadow-[0_0_0_5px_rgba(1,66,170,0.15)]' : ''}`}>
                {done ? <Check aria-hidden="true" className="size-[15px]" strokeWidth={3} /> : null}
              </span>
              <span>
                <span className={`block text-[15px] font-semibold ${done ? 'text-heading' : 'text-ink-muted'}`}>{t.title}</span>
                <span className="block text-[13px] text-ink-muted">
                  {t.status === 'NEW' ? `Submitted ${fmtDate(app.createdAt)}. ` : ''}
                  {t.text}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * v1.19 "Sell on YouMart" on the website: what's coming for sellers, and the early-access
 * application (seller-service; the admin team works through Admin -> Seller applications). Once
 * applied, the application's live status shows instead of the form.
 */
export function SellView() {
  const session = useSession();
  const pathname = usePathname();
  const signedIn = session.status === 'authenticated';
  const [app, setApp] = useState<SellerApplication | null | undefined>(undefined);
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState<SellerBusinessType | null>(null);
  const [category, setCategory] = useState('');
  const [otherCategory, setOtherCategory] = useState('');
  const [hasGstin, setHasGstin] = useState<boolean | null>(null);
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const categories = useMemo(() => [...STORE_CATEGORIES.map((c) => c.name), OTHER], []);

  useEffect(() => {
    if (!signedIn) {
      setApp(null);
      return;
    }
    if (session.status === 'authenticated') {
      setContactName((n) => n || session.user.name || '');
      setPhone((p) => p || (session.user.phone ? digits(session.user.phone) : ''));
      setEmail((e) => e || session.user.email || '');
    }
    api.sellers
      .myApplication()
      .then((r) => setApp(r.application))
      .catch(() => setApp(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  const finalCategory = category === OTHER ? otherCategory.trim() : category;
  const errors = {
    businessName: businessName.trim() ? null : 'Enter your business or store name',
    city: city.trim() ? null : 'Enter your city',
    type: type ? null : 'Choose one',
    category: finalCategory ? null : category === OTHER ? 'Tell us what you sell' : 'Choose one',
    gst: hasGstin === null ? 'Choose one' : null,
    contactName: contactName.trim() ? null : 'Enter your name',
    phone: /^[6-9]\d{9}$/.test(digits(phone)) ? null : 'Enter a valid 10-digit mobile number',
    email: !email.trim() || EMAIL_RE.test(email.trim()) ? null : 'Enter a valid email',
  };
  const valid = Object.values(errors).every((e) => e === null);
  const err = (e: string | null) => (tried && e ? <p className="mt-[4px] text-[12.5px] text-woo-error">{e}</p> : null);

  const submit = async () => {
    setTried(true);
    setServerError(null);
    if (!valid || !type || hasGstin === null) return;
    setSending(true);
    try {
      const res = await api.sellers.apply({
        businessName: businessName.trim(),
        contactName: contactName.trim(),
        phone: digits(phone),
        ...(email.trim() ? { email: email.trim() } : {}),
        city: city.trim(),
        businessType: type,
        category: finalCategory,
        hasGstin,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      setApp(res.application);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : 'Could not send your application. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const label = 'mb-[6px] block text-[13.5px] font-semibold text-heading';
  const chip = (on: boolean) =>
    `rounded-full border px-[14px] py-[6px] text-[13.5px] font-semibold transition-colors ${on ? 'border-brand bg-[#eef3fc] text-brand' : 'border-catalog-rule text-heading hover:border-brand'}`;

  return (
    <div className="font-ui">
      <section className="relative overflow-hidden bg-[linear-gradient(160deg,#050f26_0%,#0a2463_55%,#0142aa_100%)] text-white">
        <span aria-hidden="true" className="absolute -right-[120px] -top-[120px] size-[420px] rounded-full bg-white/[0.06]" />
        <span aria-hidden="true" className="absolute bottom-[-160px] left-[30%] size-[360px] rounded-full bg-[#ffd60a]/[0.07]" />
        <span aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-[40px] px-[20px] py-[56px] lg:max-w-[1440px] lg:grid-cols-[1.1fr_1fr] lg:gap-[64px] lg:px-[32px] lg:py-[64px]">
          <div>
            <span
              className="inline-flex items-center gap-[8px] rounded-full bg-white/10 px-[12px] py-[5px] text-[12.5px] font-bold uppercase tracking-[0.1em]"
              style={{ color: GOLD }}
            >
              <span className="size-[7px] animate-pulse rounded-full" style={{ background: GOLD }} /> Launching soon · early
              access open
            </span>
            <div className="mt-[8px] hidden lg:block">
              <Orbit />
            </div>
            <p className="mt-[16px] text-[12.5px] font-bold uppercase tracking-[0.16em] text-[#8fa6dc] lg:mt-[4px]">
              YouMart for sellers
            </p>
            <h1 className="mt-[8px] text-[40px] font-bold leading-[1.1] lg:text-[52px]">
              Your shop.
              <br />
              <span style={{ color: GOLD }}>Every doorstep.</span>
            </h1>
            <p className="mt-[14px] max-w-[540px] text-[16.5px] leading-[1.6] text-white/80">
              YouMart is opening to sellers. Bring your products to customers across India, and we take care of orders,
              delivery and payments.
            </p>
            <ul className="mt-[22px] flex flex-wrap gap-[10px]">
              {['No fees to apply', 'Takes about a minute', '5 lakh+ products already live'].map((t) => (
                <li
                  key={t}
                  className="flex items-center gap-[6px] rounded-full bg-white/[0.08] px-[12px] py-[6px] text-[13px] font-semibold ring-1 ring-white/15"
                >
                  <CheckCircle2 aria-hidden="true" className="size-[14px]" style={{ color: GOLD }} />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div id="sell-apply" className="scroll-mt-[16px] rounded-[24px] bg-white p-[24px] text-heading shadow-[0_30px_70px_rgba(0,0,0,0.35)] lg:p-[28px]">
            {app === undefined ? (
              <Skeleton className="h-[320px] w-full" />
            ) : app ? (
              <>
                <p className="mb-[4px] flex items-center gap-[8px] text-[18px] font-semibold">
                  {app.status === 'DECLINED' ? <Clock aria-hidden="true" className="size-[20px] text-ink-muted" /> : <CheckCircle2 aria-hidden="true" className="size-[20px] text-[#15803d]" />}
                  Your application
                </p>
                <div className="mt-[14px]">
                  <Status app={app} />
                </div>
              </>
            ) : !signedIn ? (
              <div>
                <span className="flex size-[56px] items-center justify-center rounded-[18px]" style={{ background: GOLD }}>
                  <Store aria-hidden="true" className="size-[28px] text-[#1f1300]" />
                </span>
                <p className="mt-[14px] text-[22px] font-bold">Get early access</p>
                <p className="mt-[4px] text-[14.5px] text-ink-muted">
                  Sign in to apply - it takes about a minute. We&rsquo;ll contact you before we open to sellers.
                </p>
                <p className="mb-[8px] mt-[18px] text-[12.5px] font-bold uppercase tracking-[0.1em] text-ink-muted">
                  What we&rsquo;ll ask
                </p>
                <ul className="grid grid-cols-2 gap-[8px]">
                  {['Business or store name', 'Your city', 'What you sell', 'GST registered or not'].map((t) => (
                    <li key={t} className="flex items-center gap-[8px] rounded-[12px] bg-[#f8faff] px-[12px] py-[10px] text-[13.5px] font-semibold text-heading">
                      <Check aria-hidden="true" className="size-[15px] shrink-0 text-brand" strokeWidth={3} />
                      {t}
                    </li>
                  ))}
                </ul>
                <Link
                  href={loginHref(pathname)}
                  className="mt-[20px] flex h-[52px] w-full items-center justify-center gap-[8px] rounded-[16px] text-[16px] font-bold text-[#1f1300] shadow-[0_10px_20px_rgba(255,214,10,0.35)] transition-[filter] hover:brightness-95"
                  style={{ background: GOLD }}
                >
                  Sign in to apply <ArrowRight aria-hidden="true" className="size-[18px]" />
                </Link>
                <p className="mt-[10px] text-center text-[12.5px] text-ink-muted">No fees to apply · No commitment</p>
              </div>
            ) : (
              <>
                <p className="text-[18px] font-semibold">Apply for early access</p>
                <p className="mb-[16px] text-[13.5px] text-ink-muted">We&rsquo;ll contact you before we open to sellers.</p>
                <div className="grid gap-[12px] md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label htmlFor="s-biz" className={label}>Business or store name</label>
                    <input id="s-biz" value={businessName} onChange={(e) => setBusinessName(e.target.value)} maxLength={120} placeholder="e.g. Green Leaf Agro Store" className={INPUT} />
                    {err(errors.businessName)}
                  </div>
                  <div>
                    <label htmlFor="s-city" className={label}>City</label>
                    <input id="s-city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} placeholder="e.g. Coimbatore" className={INPUT} />
                    {err(errors.city)}
                  </div>
                  <div>
                    <label htmlFor="s-cat" className={label}>What do you sell?</label>
                    <select id="s-cat" value={category} onChange={(e) => setCategory(e.target.value)} className={INPUT}>
                      <option value="">Choose a category</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {err(errors.category)}
                  </div>
                  {category === OTHER ? (
                    <div className="md:col-span-2">
                      <label htmlFor="s-other" className={label}>Your products</label>
                      <input id="s-other" value={otherCategory} onChange={(e) => setOtherCategory(e.target.value)} maxLength={80} placeholder="e.g. Handmade candles" className={INPUT} />
                    </div>
                  ) : null}
                  <div className="md:col-span-2">
                    <p className={label}>You are a</p>
                    <div className="flex flex-wrap gap-[8px]">
                      {(Object.keys(TYPE_LABEL) as SellerBusinessType[]).map((t) => (
                        <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)} className={chip(type === t)}>
                          {TYPE_LABEL[t]}
                        </button>
                      ))}
                    </div>
                    {err(errors.type)}
                  </div>
                  <div className="md:col-span-2">
                    <p className={label}>GST registered?</p>
                    <div className="flex gap-[8px]">
                      <button type="button" aria-pressed={hasGstin === true} onClick={() => setHasGstin(true)} className={chip(hasGstin === true)}>Yes</button>
                      <button type="button" aria-pressed={hasGstin === false} onClick={() => setHasGstin(false)} className={chip(hasGstin === false)}>Not yet</button>
                    </div>
                    {err(errors.gst)}
                  </div>
                  <div>
                    <label htmlFor="s-name" className={label}>Your name</label>
                    <input id="s-name" value={contactName} onChange={(e) => setContactName(e.target.value)} maxLength={100} className={INPUT} />
                    {err(errors.contactName)}
                  </div>
                  <div>
                    <label htmlFor="s-phone" className={label}>Mobile number</label>
                    <input id="s-phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" className={INPUT} />
                    {err(errors.phone)}
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="s-email" className={label}>Email <span className="font-normal text-ink-muted">(optional)</span></label>
                    <input id="s-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" className={INPUT} />
                    {err(errors.email)}
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="s-note" className={label}>Anything else we should know <span className="font-normal text-ink-muted">(optional)</span></label>
                    <textarea id="s-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} placeholder="e.g. number of products, where you sell today" className="w-full resize-none rounded-[10px] border border-catalog-rule px-[14px] py-[10px] text-[15px] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                  </div>
                </div>
                {serverError ? <p className="mt-[10px] text-[13.5px] text-woo-error">{serverError}</p> : null}
                <button type="button" onClick={() => void submit()} disabled={sending} className="mt-[18px] inline-flex h-[52px] w-full items-center justify-center gap-[8px] rounded-[16px] text-[16px] font-bold text-[#1f1300] shadow-[0_10px_20px_rgba(255,214,10,0.35)] transition-[filter] hover:brightness-95 disabled:opacity-60" style={{ background: GOLD }}>
                  {sending ? <Loader2 aria-hidden="true" className="size-[16px] animate-spin" /> : null}
                  Apply for early access
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-[20px] py-[48px] lg:max-w-[1440px] lg:px-[32px] lg:py-[56px]">
        <p className="text-center text-[12.5px] font-bold uppercase tracking-[0.16em] text-brand">How it will work</p>
        <h2 className="mb-[28px] mt-[6px] text-center text-[26px] font-bold text-heading lg:text-[32px]">
          From sign-up to payout in four steps
        </h2>
        <ol className="relative grid gap-[16px] md:grid-cols-2 lg:grid-cols-4 lg:gap-[20px]">
          <span
            aria-hidden="true"
            className="absolute left-[12%] right-[12%] top-[39px] hidden h-[3px] rounded-full bg-[linear-gradient(90deg,#0142aa,#93b4ee)] lg:block"
          />
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative rounded-[24px] border border-brand-popup-border bg-white p-[20px] text-center shadow-rail-card"
            >
              <span className="mx-auto mb-[14px] flex size-[42px] items-center justify-center rounded-full bg-brand text-[17px] font-bold text-white shadow-[0_0_0_6px_#ffffff,0_8px_16px_rgba(1,66,170,0.3)]">
                {i + 1}
              </span>
              <p className="text-[16.5px] font-bold text-heading">{step.title}</p>
              <p className="mt-[4px] text-[14px] leading-[1.55] text-ink-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-[#f3f7fe] py-[48px] lg:py-[56px]">
        <div className="mx-auto max-w-[1240px] px-[20px] lg:max-w-[1440px] lg:px-[32px]">
          <p className="text-center text-[12.5px] font-bold uppercase tracking-[0.16em] text-brand">Built for sellers</p>
          <h2 className="mb-[28px] mt-[6px] text-center text-[26px] font-bold text-heading lg:text-[32px]">
            Everything you need to sell online
          </h2>
          <ul className="grid gap-[16px] md:grid-cols-2 lg:grid-cols-4 lg:gap-[20px]">
            {PERKS.map(({ Icon, title, text }) => (
              <li
                key={title}
                className="rounded-[24px] border border-brand-popup-border bg-white p-[22px] shadow-rail-card transition-shadow hover:shadow-product-card"
              >
                <span className="mb-[14px] flex size-[48px] items-center justify-center rounded-[16px] bg-brand-popup-bg text-brand">
                  <Icon aria-hidden="true" className="size-[23px]" />
                </span>
                <p className="text-[16.5px] font-bold text-heading">{title}</p>
                <p className="mt-[4px] text-[14px] leading-[1.55] text-ink-muted">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {app ? null : (
        <section className="mx-auto max-w-[1240px] px-[20px] py-[48px] lg:max-w-[1440px] lg:px-[32px]">
          <div className="relative flex flex-col items-center gap-[18px] overflow-hidden rounded-[28px] bg-[linear-gradient(120deg,#050f26_0%,#0a2463_55%,#0142aa_100%)] px-[28px] py-[34px] text-center text-white lg:flex-row lg:px-[44px] lg:text-left">
            <span aria-hidden="true" className="absolute -right-[60px] -top-[80px] size-[240px] rounded-full bg-white/[0.06]" />
            <span className="relative flex size-[60px] shrink-0 items-center justify-center rounded-[20px]" style={{ background: GOLD }}>
              <Store aria-hidden="true" className="size-[28px] text-[#1f1300]" />
            </span>
            <div className="relative flex-1">
              <p className="text-[24px] font-bold leading-[1.25]">Ready to bring your shop to every doorstep?</p>
              <p className="mt-[4px] text-[15px] text-white/75">Takes about a minute · No fees to apply</p>
            </div>
            {signedIn ? (
              <button
                type="button"
                onClick={() => document.getElementById('sell-apply')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="relative inline-flex h-[52px] items-center gap-[8px] rounded-[16px] px-[26px] text-[16px] font-bold text-[#1f1300] transition-[filter] hover:brightness-95"
                style={{ background: GOLD }}
              >
                Apply for early access <ArrowRight aria-hidden="true" className="size-[18px]" />
              </button>
            ) : (
              <Link
                href={loginHref(pathname)}
                className="relative inline-flex h-[52px] items-center gap-[8px] rounded-[16px] px-[26px] text-[16px] font-bold text-[#1f1300] transition-[filter] hover:brightness-95"
                style={{ background: GOLD }}
              >
                Sign in to apply <ArrowRight aria-hidden="true" className="size-[18px]" />
              </Link>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
