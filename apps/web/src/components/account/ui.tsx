'use client';

import { useId, useRef } from 'react';
import { X, type LucideIcon } from 'lucide-react';
import { useModal } from '@/lib/useModal';

// Desktop account building blocks (wallet, returns, help, devices, privacy, order page): one look
// for every page - a title row, white rounded panels, status pills, empty states and dialogs.

export const BTN_PRIMARY =
  'inline-flex h-[42px] items-center justify-center gap-[8px] rounded-[10px] bg-brand px-[20px] font-ui text-[14.5px] font-semibold text-white lg:h-[44px] lg:rounded-[12px] lg:font-bold lg:shadow-[0_8px_16px_rgba(1,66,170,0.25)] lg:hover:bg-[#013a96] transition-[opacity,box-shadow] duration-150 hover:shadow-brand-button focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none';
export const BTN_SECONDARY =
  'inline-flex h-[42px] items-center justify-center gap-[8px] rounded-[10px] border border-catalog-rule bg-white px-[18px] font-ui text-[14.5px] font-semibold text-heading lg:h-[44px] lg:rounded-[12px] lg:border-brand-popup-border lg:font-bold transition-colors hover:border-brand hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-60';
export const BTN_DANGER =
  'inline-flex h-[42px] items-center justify-center gap-[8px] rounded-[10px] bg-woo-error px-[20px] font-ui text-[14.5px] font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-woo-error focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
export const BTN_SMALL =
  'inline-flex h-[32px] items-center justify-center gap-[6px] rounded-[8px] border border-catalog-rule bg-white px-[12px] font-ui text-[13px] font-semibold text-heading lg:h-[34px] lg:rounded-[10px] lg:border-brand-popup-border lg:font-bold transition-colors hover:border-brand hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-60';
export const INPUT =
  'h-[44px] w-full rounded-[10px] border border-catalog-rule bg-white px-[14px] font-ui text-[15px] text-ink-input transition-[border-color,box-shadow] placeholder:text-ink-placeholder hover:border-cart-border focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

export function PageHeader({
  title,
  subtitle,
  actions,
  icon: Icon,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** Shown in a brand tile on desktop. */
  icon?: LucideIcon;
}) {
  return (
    <header className="relative mb-[20px] flex flex-wrap items-end justify-between gap-[12px] [.ym-account_&]:mb-[14px] lg:items-center lg:overflow-hidden lg:rounded-[24px] lg:border lg:border-brand-popup-border lg:bg-[linear-gradient(115deg,#ffffff_45%,#eaf1ff_100%)] lg:px-[24px] lg:py-[20px] lg:shadow-rail-card [.ym-account_&]:lg:mb-[18px]">
      <span aria-hidden="true" className="pointer-events-none absolute -right-[40px] -top-[60px] hidden size-[180px] rounded-full bg-brand/[0.06] lg:block" />
      <div className="relative flex min-w-0 items-center gap-[16px]">
        {Icon ? (
          <span className="hidden size-[56px] shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(140deg,#0142aa,#3b82f6)] text-white shadow-[0_10px_20px_rgba(1,66,170,0.28)] lg:flex">
            <Icon aria-hidden="true" className="size-[26px]" />
          </span>
        ) : null}
        <div className="min-w-0">
          {/* Inside an account screen on phones the app header already shows the title. */}
          <h1 className="font-ui text-[26px] font-semibold leading-[1.25] text-heading [.ym-account_&]:hidden lg:text-[26px] lg:font-bold lg:[.ym-account_&]:block">{title}</h1>
          {subtitle ? (
            <p className="mt-[4px] font-ui text-[14.5px] leading-[1.5] text-ink-muted lg:mt-[2px]">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="relative flex flex-wrap items-center gap-[10px]">{actions}</div> : null}
    </header>
  );
}

/** Segmented tabs in the app's style (brand pill for the selected one). */
export function Tabs<K extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: readonly { key: K; label: string; icon?: LucideIcon; count?: number | null }[];
  value: K;
  onChange: (key: K) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-[8px]">
      {tabs.map(({ key, label: text, icon: Icon, count }) => {
        const on = key === value;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(key)}
            className={`inline-flex h-[38px] items-center gap-[6px] rounded-full px-[16px] font-ui text-[13.5px] font-bold transition-colors ${
              on
                ? 'bg-brand text-white shadow-[0_6px_12px_rgba(1,66,170,0.3)]'
                : 'bg-white text-heading ring-1 ring-brand-popup-border hover:ring-brand'
            }`}
          >
            {Icon ? <Icon aria-hidden="true" className="size-[15px]" /> : null}
            {text}
            {count != null ? (
              <span className={`rounded-full px-[7px] text-[12px] ${on ? 'bg-white/20' : 'bg-brand-popup-bg text-brand'}`}>{count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** A small stat card (icon, big value, label) for the top of a page. */
export function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'blue',
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  tone?: PillTone;
}) {
  return (
    <div className="flex items-center gap-[14px] rounded-[14px] border border-catalog-rule bg-white p-[16px] font-ui shadow-rail-card lg:rounded-[20px] lg:border-brand-popup-border lg:p-[18px]">
      <span className={`flex size-[44px] shrink-0 items-center justify-center rounded-[14px] ${STAT_TONES[tone]}`}>
        <Icon aria-hidden="true" className="size-[20px]" />
      </span>
      <div className="min-w-0">
        <p className="text-[22px] font-bold leading-[1.15] tabular-nums text-heading">{value}</p>
        <p className="truncate text-[12.5px] text-ink-muted">{label}</p>
      </div>
    </div>
  );
}

const STAT_TONES: Record<PillTone, string> = {
  green: 'bg-[#e8f7ee] text-[#15803d]',
  blue: 'bg-[#eef3fc] text-brand',
  violet: 'bg-[#f1ebff] text-[#6d28d9]',
  orange: 'bg-[#fff1e6] text-[#c2410c]',
  red: 'bg-[#fdecec] text-[#b91c1c]',
  grey: 'bg-[#f1f5f9] text-[#475569]',
};

export function Panel({
  title,
  aside,
  children,
  className = '',
  padded = true,
}: {
  title?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={`mb-[20px] rounded-[14px] border border-catalog-rule bg-white shadow-rail-card lg:rounded-[24px] lg:border-brand-popup-border ${className}`}
    >
      {title ? (
        <div className="flex items-center justify-between gap-[12px] border-b border-catalog-rule px-[20px] py-[14px] lg:border-brand-popup-border lg:px-[22px] lg:py-[16px]">
          <h2 className="font-ui text-[16.5px] font-semibold text-heading lg:text-[18px] lg:font-bold">{title}</h2>
          {aside}
        </div>
      ) : null}
      <div className={padded ? 'p-[20px] lg:p-[22px]' : ''}>{children}</div>
    </section>
  );
}

export type PillTone = 'green' | 'blue' | 'violet' | 'orange' | 'red' | 'grey';

const PILL_TONES: Record<PillTone, string> = {
  green: 'bg-[#e8f7ee] text-[#15803d]',
  blue: 'bg-[#e9f0ff] text-[#1d4ed8]',
  violet: 'bg-[#f1ebff] text-[#6d28d9]',
  orange: 'bg-[#fff1e6] text-[#c2410c]',
  red: 'bg-[#fdecec] text-[#b91c1c]',
  grey: 'bg-[#f1f5f9] text-[#475569]',
};

export function Pill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-[6px] whitespace-nowrap rounded-full px-[10px] py-[3px] font-ui text-[12.5px] font-semibold ${PILL_TONES[tone]}`}
    >
      <span aria-hidden="true" className="size-[6px] rounded-full bg-current" />
      {children}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-[20px] py-[48px] text-center font-ui">
      <span className="mb-[14px] flex size-[64px] items-center justify-center rounded-full bg-[#eef3fc] lg:size-[80px] lg:shadow-[0_0_0_10px_#f5f8ff]">
        <Icon aria-hidden="true" className="size-[28px] text-brand lg:size-[34px]" />
      </span>
      <p className="text-[17px] font-semibold text-heading lg:mt-[6px] lg:text-[19px] lg:font-bold">{title}</p>
      {children ? (
        <p className="mt-[6px] max-w-[420px] text-[14.5px] leading-[1.55] text-ink-muted">
          {children}
        </p>
      ) : null}
      {action ? <div className="mt-[18px]">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-[8px] bg-[#eef1f5] ${className}`} />;
}

/** An inline message box (success / error / info) for these pages. */
export function Banner({
  tone,
  children,
}: {
  tone: 'success' | 'error' | 'info';
  children: React.ReactNode;
}) {
  const style =
    tone === 'success'
      ? 'border-[#bfe6cc] bg-[#effaf3] text-[#166534]'
      : tone === 'error'
        ? 'border-[#f5c2c2] bg-[#fdf0f0] text-[#991b1b]'
        : 'border-[#c9d8f5] bg-[#f1f6fe] text-[#1e3a8a]';
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`mb-[16px] rounded-[10px] border px-[14px] py-[11px] font-ui text-[14.5px] leading-[1.5] lg:rounded-[14px] ${style}`}
    >
      {children}
    </div>
  );
}

/** A centred dialog: Esc / backdrop closes, focus moves in and back, page scroll locked. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 520,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  useModal(open, onClose, closeRef);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-[16px]">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#0f172a]/50 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{ maxWidth: width }}
        className="relative max-h-[90vh] w-full overflow-y-auto rounded-[16px] bg-white font-ui shadow-[0_24px_60px_rgba(15,23,42,0.25)]"
      >
        <div className="flex items-start justify-between gap-[16px] border-b border-catalog-rule px-[22px] py-[16px]">
          <div>
            <h2 id={titleId} className="text-[18px] font-semibold text-heading">
              {title}
            </h2>
            {description ? (
              <p className="mt-[4px] text-[14px] leading-[1.5] text-ink-muted">{description}</p>
            ) : null}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-[32px] shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-[#f1f5f9] hover:text-heading focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <X aria-hidden="true" className="size-[18px]" />
          </button>
        </div>
        {children ? <div className="px-[22px] py-[18px]">{children}</div> : null}
        {footer ? (
          <div className="flex flex-wrap justify-end gap-[10px] border-t border-catalog-rule bg-[#fafbfc] px-[22px] py-[14px]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Reason picker used by the return / cancel dialogs: radio cards + an optional note. */
export function ReasonPicker({
  reasons,
  value,
  onChange,
  note,
  onNote,
  notePlaceholder = 'Anything else we should know? (optional)',
}: {
  reasons: readonly string[];
  value: string | null;
  onChange: (reason: string) => void;
  note: string;
  onNote: (note: string) => void;
  notePlaceholder?: string;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-[10px] text-[14px] font-semibold text-heading">Choose a reason</legend>
      <div className="grid gap-[8px] md:grid-cols-2">
        {reasons.map((reason) => {
          const checked = value === reason;
          return (
            <label
              key={reason}
              className={`flex cursor-pointer items-center gap-[10px] rounded-[10px] border px-[12px] py-[10px] text-[14px] transition-colors ${
                checked
                  ? 'border-brand bg-[#eef3fc] font-semibold text-brand'
                  : 'border-catalog-rule text-heading hover:border-cart-border'
              }`}
            >
              <input
                type="radio"
                name={name}
                checked={checked}
                onChange={() => onChange(reason)}
                className="size-[16px] accent-brand"
              />
              {reason}
            </label>
          );
        })}
      </div>
      <textarea
        value={note}
        onChange={(e) => onNote(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder={notePlaceholder}
        className="mt-[12px] w-full resize-none rounded-[10px] border border-catalog-rule px-[14px] py-[10px] text-[14.5px] text-ink-input placeholder:text-ink-placeholder focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
    </fieldset>
  );
}

export const dateTime = (iso: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));

export const dateOnly = (iso: string) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  );
