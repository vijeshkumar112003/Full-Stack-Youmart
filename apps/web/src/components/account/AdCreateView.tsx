'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Check, ExternalLink, Images, Loader2, Megaphone, Minus, PlayCircle, Plus, Rocket, Send, ShieldCheck, Trash2, UploadCloud, Wallet } from 'lucide-react';
import { ApiError, ROUTES, formatMoney, type AdAvailability, type AdKind, type AdView, type Money } from '@youmart/shared-client';
import { api } from '@/lib/api';
import { AD_MAX_DAYS, AD_MAX_IMAGES, uploadAdMedia } from '@/lib/ads';
import { BTN_PRIMARY, BTN_SECONDARY, Banner, INPUT, PageHeader, Panel, dateTime } from './ui';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const PRICE_FALLBACK = '1000.00';
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const hourLabel = (h: number) => `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`;

type Item = { key: string; preview: string; status: 'uploading' | 'done' | 'failed'; fileName?: string; url?: string; error?: string };

/** A numbered step card; the number turns into a green tick once the step is complete. */
function Step({ n, title, done, aside, children }: { n: number; title: string; done: boolean; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-[20px] rounded-[14px] border border-catalog-rule bg-white font-ui shadow-rail-card lg:rounded-[24px] lg:border-brand-popup-border">
      <div className="flex items-center gap-[12px] border-b border-catalog-rule px-[20px] py-[14px] lg:border-brand-popup-border lg:px-[22px] lg:py-[16px]">
        <span
          className={`flex size-[30px] shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white ${
            done ? 'bg-[#16a34a]' : 'bg-[linear-gradient(135deg,#3b1a8f,#6d28d9)]'
          }`}
        >
          {done ? <Check aria-hidden="true" className="size-[16px]" strokeWidth={3} /> : n}
        </span>
        <h2 className="flex-1 text-[16.5px] font-semibold text-heading lg:text-[18px] lg:font-bold">{title}</h2>
        {aside}
      </div>
      <div className="p-[20px] lg:p-[22px]">{children}</div>
    </section>
  );
}

/** v1.19 Create an ad on the website: format -> media -> details -> schedule, beside a live preview. */
export function AdCreateView() {
  const [kind, setKind] = useState<AdKind>('IMAGE');
  const [items, setItems] = useState<Item[]>([]);
  const [advertiserName, setAdvertiserName] = useState('');
  const [headline, setHeadline] = useState('');
  const [caption, setCaption] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [avail, setAvail] = useState<AdAvailability | null>(null);
  const [day, setDay] = useState<string>('');
  const [hour, setHour] = useState<number | null>(null);
  const [days, setDays] = useState(1);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<AdView | null>(null);
  const [slide, setSlide] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // Earliest start: the next whole hour at least an hour away (time for review).
  const earliest = useMemo(() => Math.ceil((Date.now() + HOUR) / HOUR) * HOUR, []);
  const dates = useMemo(() => Array.from({ length: 30 }, (_, i) => new Date(startOfDay(new Date()).getTime() + i * DAY)), []);

  const loadAvail = useCallback((k: AdKind) => {
    setAvail(null);
    api.ads
      .availability(k)
      .then(setAvail)
      .catch(() => setAvail({ kind: k, pricePerDay: PRICE_FALLBACK, maxDays: AD_MAX_DAYS, booked: [] }));
  }, []);
  useEffect(() => loadAvail(kind), [kind, loadAvail]);

  const booked = useMemo(
    () => (avail?.booked ?? []).map((b) => ({ from: new Date(b.startsAt).getTime(), to: new Date(b.endsAt).getTime() })),
    [avail],
  );
  const clashes = useCallback((start: number, n: number) => booked.some((b) => b.from < start + n * DAY && b.to > start), [booked]);
  const dayDate = day ? new Date(`${day}T00:00:00`) : null;
  const startOf = (d: Date, h: number) => d.getTime() + h * HOUR;
  const hourOk = (d: Date, h: number) => startOf(d, h) >= earliest && !clashes(startOf(d, h), days);
  const dayOk = (d: Date) => Array.from({ length: 24 }, (_, h) => h).some((h) => hourOk(d, h));

  useEffect(() => {
    if (dayDate && hour !== null && !hourOk(dayDate, hour)) setHour(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, booked]);

  const switchKind = (k: AdKind) => {
    if (k === kind) return;
    setKind(k);
    setItems([]);
    setHour(null);
  };

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const video = kind === 'VIDEO';
    const list = Array.from(files).slice(0, video ? 1 : AD_MAX_IMAGES - items.length);
    const added: Item[] = list.map((f) => ({ key: `${f.name}-${f.size}-${Math.random()}`, preview: URL.createObjectURL(f), status: 'uploading' }));
    setItems((cur) => (video ? added : [...cur, ...added]));
    await Promise.all(
      list.map(async (file, i) => {
        const key = added[i]!.key;
        try {
          const res = await uploadAdMedia(file);
          setItems((cur) => cur.map((x) => (x.key === key ? { ...x, status: 'done', fileName: res.fileName, url: res.url } : x)));
        } catch (err) {
          setItems((cur) => cur.map((x) => (x.key === key ? { ...x, status: 'failed', error: err instanceof Error ? err.message : 'Upload failed' } : x)));
        }
      }),
    );
    if (fileRef.current) fileRef.current.value = '';
  };

  const price = Number(avail?.pricePerDay ?? PRICE_FALLBACK);
  const start = dayDate && hour !== null ? startOf(dayDate, hour) : null;
  const uploading = items.some((x) => x.status === 'uploading');
  const uploaded = items.filter((x) => x.status === 'done' && x.fileName);
  const missing = [
    !uploaded.length && (kind === 'IMAGE' ? 'at least one photo' : 'a video'),
    !advertiserName.trim() && 'your brand name',
    !headline.trim() && 'a headline',
    start === null && 'a start time',
  ].filter(Boolean) as string[];
  const linkBad = linkUrl.trim() !== '' && !/^https:\/\/\S+\.\S+/.test(linkUrl.trim());

  const submit = async () => {
    if (missing.length || linkBad || uploading || start === null) return;
    setSending(true);
    setError(null);
    try {
      const { ad } = await api.ads.create({
        kind,
        advertiserName: advertiserName.trim(),
        headline: headline.trim(),
        ...(caption.trim() ? { caption: caption.trim() } : {}),
        ...(linkUrl.trim() ? { linkUrl: linkUrl.trim() } : {}),
        media: uploaded.map((x) => x.fileName!),
        startsAt: new Date(start).toISOString(),
        days,
      });
      setDone(ad);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send your ad. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <>
        <PageHeader title="Ad sent for review" icon={Megaphone} />
        <Panel>
          <div className="flex flex-col items-center py-[24px] text-center font-ui lg:py-[36px]">
            <span className="mb-[14px] flex size-[72px] items-center justify-center rounded-full bg-[#16a34a] text-white shadow-[0_0_0_10px_#e8f8ee]">
              <Check aria-hidden="true" className="size-[38px]" strokeWidth={3} />
            </span>
            <p className="text-[20px] font-semibold text-heading lg:text-[24px] lg:font-bold">Thanks - we&rsquo;ve got your ad</p>
            <p className="mt-[6px] max-w-[480px] text-[14.5px] text-ink-muted">
              Reference <strong className="text-heading">{done.referenceCode}</strong>. We&rsquo;ll review it soon; once it&rsquo;s approved, pay{' '}
              <strong className="text-heading">{formatMoney(done.amount)}</strong> from your YouMart Wallet before {dateTime(done.startsAt)} to book the slot.
            </p>
            <ol className="mt-[22px] hidden w-full max-w-[620px] grid-cols-3 gap-[10px] lg:grid">
              {[
                { Icon: ShieldCheck, title: 'We review it', text: 'Usually within a few hours', on: true },
                { Icon: Wallet, title: 'You pay', text: `${formatMoney(done.amount)} from your wallet`, on: false },
                { Icon: Rocket, title: 'It goes live', text: dateTime(done.startsAt), on: false },
              ].map(({ Icon, title, text, on }) => (
                <li key={title} className={`rounded-[16px] px-[12px] py-[12px] ${on ? 'bg-[#f5f0ff] ring-1 ring-[#c4b5fd]' : 'bg-[#f8f7fd]'}`}>
                  <Icon aria-hidden="true" className={`mx-auto size-[20px] ${on ? 'text-[#6d28d9]' : 'text-ink-muted'}`} />
                  <p className="mt-[6px] text-[14px] font-bold text-heading">{title}</p>
                  <p className="text-[12px] text-ink-muted">{text}</p>
                </li>
              ))}
            </ol>
            <div className="mt-[20px] flex gap-[10px]">
              <Link href={ROUTES.ads} className={BTN_PRIMARY}>
                See my ads
              </Link>
              <Link href={`${ROUTES.wallet}?add=1`} className={BTN_SECONDARY}>
                Add money to wallet
              </Link>
            </div>
          </div>
        </Panel>
      </>
    );
  }

  const label = 'mb-[6px] block font-ui text-[13.5px] font-semibold text-heading lg:font-bold';
  const previewPhotos = items;
  const maxDays = avail?.maxDays ?? AD_MAX_DAYS;
  const steps = [
    { title: 'Format', done: true },
    { title: kind === 'IMAGE' ? 'Photos' : 'Video', done: uploaded.length > 0 },
    { title: 'Details', done: Boolean(advertiserName.trim() && headline.trim()) && !linkBad },
    { title: 'Schedule', done: start !== null },
  ];
  const dayValue = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const shown = previewPhotos.length ? previewPhotos[slide % previewPhotos.length] : null;

  return (
    <>
      <PageHeader
        title="Create an ad"
        icon={Megaphone}
        subtitle="Reviewed by our team before it goes live. You pay only after approval."
        actions={
          <ol className="hidden items-center gap-[6px] font-ui lg:flex">
            {steps.map((s, i) => (
              <li key={s.title} className="flex items-center gap-[6px]">
                <span
                  className={`inline-flex items-center gap-[6px] rounded-full px-[11px] py-[5px] text-[12.5px] font-bold ${
                    s.done ? 'bg-[#e8f8ee] text-[#15803d]' : 'bg-white text-ink-muted ring-1 ring-brand-popup-border'
                  }`}
                >
                  {s.done ? <Check aria-hidden="true" className="size-[13px]" strokeWidth={3} /> : <span className="text-[11.5px]">{i + 1}</span>}
                  {s.title}
                </span>
                {i < steps.length - 1 ? <span aria-hidden="true" className="h-[2px] w-[14px] rounded-full bg-brand-popup-border" /> : null}
              </li>
            ))}
          </ol>
        }
      />
      <div className="grid items-start gap-[20px] lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-[24px]">
        <div className="min-w-0">
          <Step n={1} done={steps[0]!.done} title="Choose a format">
            <div className="grid grid-cols-2 gap-[10px] font-ui lg:gap-[14px]">
              {(
                [
                  ['IMAGE', 'Photo carousel', 'Up to 5 wide photos in Home’s Sponsored slot', Images, '#c2410c', '#ffedd5'],
                  ['VIDEO', 'Video', 'Portrait video in Home’s floating player', PlayCircle, '#6d28d9', '#ede9fe'],
                ] as const
              ).map(([k, title, sub, Icon, fg, bg]) => {
                const on = kind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={on}
                    onClick={() => switchKind(k)}
                    className={`relative flex items-start gap-[12px] rounded-[12px] border p-[14px] text-left transition-colors lg:rounded-[18px] lg:p-[16px] ${
                      on ? 'border-[#6d28d9] bg-[#f5f0ff] ring-1 ring-[#6d28d9]' : 'border-catalog-rule hover:border-cart-border lg:border-brand-popup-border'
                    }`}
                  >
                    <span className="hidden size-[46px] shrink-0 items-center justify-center rounded-[14px] lg:flex" style={{ background: bg, color: fg }}>
                      <Icon aria-hidden="true" className="size-[22px]" />
                    </span>
                    <Icon aria-hidden="true" className={`mt-[2px] size-[20px] lg:hidden ${on ? 'text-[#6d28d9]' : 'text-ink-muted'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-heading lg:text-[16px] lg:font-bold">{title}</span>
                      <span className="block text-[12.5px] text-ink-muted">{sub}</span>
                      <span className="mt-[6px] hidden text-[13px] font-bold text-heading lg:block">
                        {formatMoney(price.toFixed(2) as Money).replace(/\.00$/, '')} <span className="font-semibold text-ink-muted">/ day</span>
                      </span>
                    </span>
                    {on ? (
                      <span className="absolute right-[12px] top-[12px] hidden size-[22px] items-center justify-center rounded-full bg-[#6d28d9] text-white lg:flex">
                        <Check aria-hidden="true" className="size-[13px]" strokeWidth={3} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </Step>

          <Step
            n={2}
            done={steps[1]!.done}
            title={kind === 'IMAGE' ? 'Add your photos' : 'Add your video'}
            aside={
              kind === 'IMAGE' ? (
                <span className="rounded-full bg-[#f5f0ff] px-[10px] py-[2px] font-ui text-[12.5px] font-bold text-[#6d28d9]">
                  {items.length}/{AD_MAX_IMAGES}
                </span>
              ) : null
            }
          >
            <input
              ref={fileRef}
              type="file"
              multiple={kind === 'IMAGE'}
              accept={kind === 'IMAGE' ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/quicktime'}
              className="sr-only"
              onChange={(e) => void addFiles(e.target.files)}
            />
            <div className="grid grid-cols-2 gap-[10px] md:grid-cols-3">
              {items.map((x, i) => (
                <div key={x.key} className={`relative overflow-hidden rounded-[10px] border border-catalog-rule bg-[#0f172a] lg:rounded-[14px] ${kind === 'IMAGE' ? 'aspect-video' : 'aspect-[9/16] max-h-[260px]'}`}>
                  {kind === 'IMAGE' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={x.preview} alt="" className="size-full object-cover" />
                  ) : (
                    <video src={x.preview} muted className="size-full object-cover" />
                  )}
                  {kind === 'IMAGE' ? (
                    <span className="absolute left-[6px] top-[6px] rounded-full bg-black/60 px-[8px] py-[1px] font-ui text-[11px] font-bold text-white">
                      {i === 0 ? 'Cover' : i + 1}
                    </span>
                  ) : null}
                  {x.status === 'uploading' ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                      <Loader2 aria-hidden="true" className="size-[22px] animate-spin" />
                    </span>
                  ) : x.status === 'failed' ? (
                    <span className="absolute inset-x-0 bottom-0 flex items-center gap-[4px] bg-[#b91c1c] px-[6px] py-[3px] font-ui text-[11px] text-white">
                      <AlertCircle aria-hidden="true" className="size-[12px]" /> {x.error}
                    </span>
                  ) : (
                    <span className="absolute bottom-[6px] left-[6px] hidden size-[20px] items-center justify-center rounded-full bg-[#16a34a] text-white lg:flex">
                      <Check aria-hidden="true" className="size-[12px]" strokeWidth={3} />
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => setItems((cur) => cur.filter((y) => y.key !== x.key))}
                    className="absolute right-[6px] top-[6px] flex size-[26px] items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <Trash2 aria-hidden="true" className="size-[13px]" />
                  </button>
                </div>
              ))}
              {(kind === 'IMAGE' ? items.length < AD_MAX_IMAGES : items.length === 0) ? (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    void addFiles(e.dataTransfer.files);
                  }}
                  className={`flex flex-col items-center justify-center gap-[6px] rounded-[10px] border-2 border-dashed border-catalog-rule font-ui text-[13px] font-semibold text-ink-muted transition-colors hover:border-[#6d28d9] hover:bg-[#faf7ff] hover:text-[#6d28d9] lg:rounded-[14px] lg:border-[#d8cdf7] ${
                    items.length ? 'aspect-video' : 'aspect-video md:col-span-3 lg:aspect-auto lg:min-h-[170px]'
                  }`}
                >
                  {items.length ? (
                    <Plus aria-hidden="true" className="size-[22px]" />
                  ) : (
                    <span className="flex size-[52px] items-center justify-center rounded-full bg-[#f5f0ff] text-[#6d28d9]">
                      <UploadCloud aria-hidden="true" className="size-[26px]" />
                    </span>
                  )}
                  <span className="lg:text-[14.5px] lg:font-bold lg:text-heading">{kind === 'IMAGE' ? (items.length ? 'Add more' : 'Add photos') : 'Upload video'}</span>
                  {!items.length ? <span className="hidden text-[12.5px] font-medium lg:block">Click to choose, or drag and drop here</span> : null}
                </button>
              ) : null}
            </div>
            <p className="mt-[10px] font-ui text-[12.5px] text-ink-muted">
              {kind === 'IMAGE'
                ? 'Wide photos (16:9) look best. JPG, PNG or WEBP, up to 8 MB each. They play in this order.'
                : 'Portrait (9:16) video, up to 60 seconds and 60 MB. It plays muted on loop.'}
            </p>
          </Step>

          <Step n={3} done={steps[2]!.done} title="Ad details">
            <div className="grid gap-[14px] md:grid-cols-2">
              <div>
                <label htmlFor="ad-brand" className={label}>
                  Brand / business name *
                </label>
                <input id="ad-brand" value={advertiserName} onChange={(e) => setAdvertiserName(e.target.value)} maxLength={60} placeholder="e.g. Green Leaf Store" className={INPUT} />
              </div>
              <div>
                <label htmlFor="ad-link" className={label}>
                  Link <span className="font-normal text-ink-muted">(optional)</span>
                </label>
                <input id="ad-link" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} maxLength={300} placeholder="https://" className={INPUT} />
                {linkBad ? <p className="mt-[4px] font-ui text-[12.5px] text-woo-error">Links must start with https://</p> : null}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="ad-headline" className={label}>
                  Headline *
                </label>
                <input id="ad-headline" value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={80} placeholder="e.g. Diwali sale - 30% off on all lamps" className={INPUT} />
                <p className="mt-[4px] text-right font-ui text-[12px] text-ink-muted">{headline.length}/80</p>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="ad-caption" className={label}>
                  Caption <span className="font-normal text-ink-muted">(optional)</span>
                </label>
                <textarea
                  id="ad-caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={200}
                  rows={2}
                  placeholder="One line about the offer"
                  className="w-full resize-none rounded-[10px] border border-catalog-rule px-[14px] py-[10px] font-ui text-[15px] text-ink-input focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 lg:rounded-[14px] lg:border-brand-popup-border"
                />
                <p className="mt-[2px] text-right font-ui text-[12px] text-ink-muted">{caption.length}/200</p>
              </div>
            </div>
          </Step>

          <Step n={4} done={steps[3]!.done} title="Schedule">
            {/* Phones: the selects. Desktop: day and time tiles. */}
            <div className="grid gap-[14px] md:grid-cols-3 lg:hidden">
              <div>
                <label htmlFor="ad-day" className={label}>
                  Start date
                </label>
                <select id="ad-day" value={day} onChange={(e) => setDay(e.target.value)} className={INPUT}>
                  <option value="">Choose a day</option>
                  {dates.map((d) => {
                    const v = dayValue(d);
                    return (
                      <option key={v} value={v} disabled={!dayOk(d)}>
                        {d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {dayOk(d) ? '' : ' - fully booked'}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label htmlFor="ad-hour" className={label}>
                  Start time
                </label>
                <select
                  id="ad-hour"
                  value={hour ?? ''}
                  disabled={!dayDate}
                  onChange={(e) => setHour(e.target.value === '' ? null : Number(e.target.value))}
                  className={INPUT}
                >
                  <option value="">Choose a time</option>
                  {Array.from({ length: 24 }, (_, h) => h).map((h) => (
                    <option key={h} value={h} disabled={!dayDate || !hourOk(dayDate, h)}>
                      {hourLabel(h)}
                      {dayDate && !hourOk(dayDate, h) ? ' - unavailable' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ad-days" className={label}>
                  How long: {days} day{days === 1 ? '' : 's'}
                </label>
                <input
                  id="ad-days"
                  type="range"
                  min={1}
                  max={maxDays}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="mt-[12px] w-full accent-[#6d28d9]"
                />
              </div>
            </div>

            <div className="hidden font-ui lg:block">
              <p className={label}>Start date</p>
              <div role="radiogroup" aria-label="Start date" className="grid grid-cols-10 gap-[6px]">
                {dates.map((d) => {
                  const v = dayValue(d);
                  const ok = dayOk(d);
                  const on = day === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={!ok}
                      onClick={() => setDay(v)}
                      title={ok ? undefined : 'Fully booked'}
                      className={`flex flex-col items-center rounded-[12px] py-[6px] transition-colors ${
                        on
                          ? 'bg-[linear-gradient(135deg,#3b1a8f,#6d28d9)] text-white shadow-[0_6px_12px_rgba(109,40,217,0.3)]'
                          : ok
                            ? 'bg-[#f8f7fd] text-heading hover:bg-[#ede9fe]'
                            : 'cursor-not-allowed bg-[#f1f5f9] text-[#cbd5e1] line-through'
                      }`}
                    >
                      <span className={`text-[10.5px] font-bold uppercase ${on ? 'text-white/80' : 'text-ink-muted'}`}>
                        {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                      </span>
                      <span className="text-[17px] font-bold leading-[1.2]">{d.getDate()}</span>
                      <span className={`text-[10.5px] font-semibold ${on ? 'text-white/80' : 'text-ink-muted'}`}>
                        {d.toLocaleDateString('en-IN', { month: 'short' })}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className={`${label} mt-[16px]`}>Start time</p>
              {dayDate ? (
                <div role="radiogroup" aria-label="Start time" className="grid grid-cols-8 gap-[6px]">
                  {Array.from({ length: 24 }, (_, h) => h).map((h) => {
                    const ok = hourOk(dayDate, h);
                    const on = hour === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        disabled={!ok}
                        onClick={() => setHour(h)}
                        className={`h-[36px] rounded-[10px] text-[13px] font-bold transition-colors ${
                          on
                            ? 'bg-[linear-gradient(135deg,#3b1a8f,#6d28d9)] text-white shadow-[0_6px_12px_rgba(109,40,217,0.3)]'
                            : ok
                              ? 'bg-[#f8f7fd] text-heading hover:bg-[#ede9fe]'
                              : 'cursor-not-allowed bg-[#f1f5f9] text-[#cbd5e1]'
                        }`}
                      >
                        {hourLabel(h)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-[12px] bg-[#f8f7fd] px-[14px] py-[10px] text-[13.5px] text-ink-muted">Pick a start date first.</p>
              )}

              <div className="mt-[16px] flex items-center gap-[16px] rounded-[16px] bg-[#f8f7fd] px-[16px] py-[12px]">
                <span className="text-[14px] font-bold text-heading">How long</span>
                <span className="flex items-center rounded-[12px] bg-white ring-1 ring-brand-popup-border">
                  <button
                    type="button"
                    aria-label="One day less"
                    disabled={days <= 1}
                    onClick={() => setDays((d) => Math.max(1, d - 1))}
                    className="flex size-[36px] items-center justify-center rounded-l-[12px] text-[#6d28d9] hover:bg-[#f5f0ff] disabled:opacity-40"
                  >
                    <Minus aria-hidden="true" className="size-[15px]" />
                  </button>
                  <span className="min-w-[70px] text-center text-[14.5px] font-bold text-heading">
                    {days} day{days === 1 ? '' : 's'}
                  </span>
                  <button
                    type="button"
                    aria-label="One day more"
                    disabled={days >= maxDays}
                    onClick={() => setDays((d) => Math.min(maxDays, d + 1))}
                    className="flex size-[36px] items-center justify-center rounded-r-[12px] text-[#6d28d9] hover:bg-[#f5f0ff] disabled:opacity-40"
                  >
                    <Plus aria-hidden="true" className="size-[15px]" />
                  </button>
                </span>
                <input
                  type="range"
                  aria-label="How many days"
                  min={1}
                  max={maxDays}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="flex-1 accent-[#6d28d9]"
                />
                <span className="text-[12.5px] text-ink-muted">max {maxDays}</span>
              </div>
            </div>
            {booked.length ? (
              <p className="mt-[12px] font-ui text-[12.5px] text-ink-muted">
                One {kind === 'IMAGE' ? 'photo' : 'video'} ad runs at a time - booked times are greyed out.
              </p>
            ) : null}
          </Step>
        </div>

        <aside className="space-y-[16px] lg:sticky lg:top-[16px]">
          <div className="overflow-hidden rounded-[16px] border border-catalog-rule bg-white font-ui shadow-rail-card lg:rounded-[24px] lg:border-brand-popup-border">
            <p className="flex items-center justify-between border-b border-catalog-rule px-[16px] py-[10px] text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-muted lg:border-brand-popup-border lg:font-bold">
              Live preview
              <span className="hidden items-center gap-[5px] rounded-full bg-[#e8f8ee] px-[8px] py-[1px] text-[11px] normal-case tracking-normal text-[#15803d] lg:inline-flex">
                <span className="size-[6px] animate-pulse rounded-full bg-[#16a34a]" /> Updates as you type
              </span>
            </p>
            <div className={`relative bg-[#0f172a] ${kind === 'IMAGE' ? 'aspect-[16/9]' : 'mx-auto my-[12px] aspect-[9/16] w-[150px] rounded-[12px] lg:w-[170px] lg:rounded-[18px] lg:ring-4 lg:ring-[#1a0b3d]'} overflow-hidden`}>
              {shown ? (
                kind === 'IMAGE' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shown.preview} alt="" className="size-full object-cover" />
                ) : (
                  <video src={shown.preview} autoPlay muted loop playsInline className="size-full object-cover" />
                )
              ) : (
                <span className="flex size-full flex-col items-center justify-center gap-[6px] text-[12.5px] text-white/60">
                  {kind === 'IMAGE' ? <Images aria-hidden="true" className="size-[26px]" /> : <PlayCircle aria-hidden="true" className="size-[26px]" />}
                  Your {kind === 'IMAGE' ? 'photos' : 'video'} here
                </span>
              )}
              {kind === 'IMAGE' && previewPhotos.length > 1 ? (
                <>
                  <span className="absolute inset-x-0 bottom-[8px] flex justify-center gap-[5px]">
                    {previewPhotos.map((p, i) => (
                      <span key={p.key} className={`h-[6px] rounded-full ${i === slide % previewPhotos.length ? 'w-[16px] bg-white' : 'w-[6px] bg-white/50'}`} />
                    ))}
                  </span>
                  <button type="button" onClick={() => setSlide((s) => s + 1)} className="absolute bottom-[8px] right-[8px] rounded-full bg-white/85 px-[10px] py-[2px] text-[11.5px] font-semibold text-heading">
                    Next photo
                  </button>
                </>
              ) : null}
            </div>
            <div className="p-[14px] lg:p-[16px]">
              <span className="rounded-full bg-[#fff4d6] px-[8px] py-[2px] text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#92400e]">Sponsored</span>
              <p className="mt-[6px] text-[12.5px] font-semibold text-brand">{advertiserName || 'Your brand'}</p>
              <p className="text-[16px] font-semibold leading-[1.3] text-heading lg:font-bold">{headline || 'Your headline'}</p>
              {caption ? <p className="mt-[4px] text-[13px] text-ink-muted">{caption}</p> : null}
              {linkUrl && !linkBad ? (
                <span className="mt-[10px] hidden items-center gap-[4px] rounded-full bg-brand px-[12px] py-[5px] text-[12.5px] font-bold text-white lg:inline-flex">
                  Shop now <ExternalLink aria-hidden="true" className="size-[12px]" />
                </span>
              ) : null}
            </div>
          </div>

          <div className="rounded-[16px] border border-catalog-rule bg-white p-[16px] font-ui shadow-rail-card lg:rounded-[24px] lg:border-brand-popup-border lg:p-[20px]">
            <p className="mb-[10px] hidden text-[12.5px] font-bold uppercase tracking-[1px] text-ink-muted lg:block">Price details</p>
            <dl className="space-y-[6px] text-[14px] lg:space-y-[8px] lg:text-[14.5px]">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Price per day</dt>
                <dd className="tabular-nums">{formatMoney(price.toFixed(2) as Money)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Days</dt>
                <dd className="tabular-nums">{days}</dd>
              </div>
              {start !== null ? (
                <div className="flex justify-between gap-[10px]">
                  <dt className="text-ink-muted">Runs</dt>
                  <dd className="text-right text-[13px]">
                    {dateTime(new Date(start).toISOString())} → {dateTime(new Date(start + days * DAY).toISOString())}
                  </dd>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between border-t border-dashed border-catalog-rule pt-[8px] text-[16px] font-semibold lg:mt-[10px] lg:border-brand-popup-border lg:pt-[12px]">
                <dt className="lg:text-[17px] lg:font-bold">Total</dt>
                <dd className="tabular-nums lg:text-[24px] lg:font-bold lg:text-[#6d28d9]">{formatMoney((price * days).toFixed(2) as Money)}</dd>
              </div>
            </dl>
            <p className="mt-[8px] flex items-center gap-[6px] text-[12px] text-ink-muted">
              <Wallet aria-hidden="true" className="hidden size-[13px] lg:block" /> Paid from your YouMart Wallet after approval.
            </p>
            {error ? <Banner tone="error">{error}</Banner> : null}
            {missing.length ? <p className="mt-[10px] text-[12.5px] text-ink-muted lg:hidden">Still needed: {missing.join(', ')}.</p> : null}
            <ul className="mt-[12px] hidden space-y-[6px] rounded-[14px] bg-[#f8f7fd] p-[12px] lg:block">
              {steps.map((s) => (
                <li key={s.title} className={`flex items-center gap-[8px] text-[13px] font-semibold ${s.done ? 'text-[#15803d]' : 'text-ink-muted'}`}>
                  <span className={`flex size-[18px] items-center justify-center rounded-full ${s.done ? 'bg-[#16a34a] text-white' : 'ring-1 ring-[#cbd5e1]'}`}>
                    {s.done ? <Check aria-hidden="true" className="size-[11px]" strokeWidth={3} /> : null}
                  </span>
                  {s.title}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={sending || uploading || missing.length > 0 || linkBad}
              className="mt-[12px] inline-flex h-[44px] w-full items-center justify-center gap-[8px] rounded-[10px] bg-[linear-gradient(135deg,#3b1a8f,#6d28d9)] font-ui text-[15px] font-semibold text-white disabled:opacity-50 lg:h-[52px] lg:rounded-[16px] lg:text-[16px] lg:font-bold lg:shadow-[0_10px_20px_rgba(109,40,217,0.3)]"
            >
              {sending ? <Loader2 aria-hidden="true" className="size-[16px] animate-spin" /> : <Send aria-hidden="true" className="size-[16px]" />}
              Send for review
            </button>
            <p className="mt-[8px] hidden text-center text-[12px] text-ink-muted lg:block">Nothing is charged now - you pay only after we approve it.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
