'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Archive, Bell, ChevronRight, CreditCard, EyeOff, FileText, Loader2, MapPin, MonitorSmartphone, RotateCcw, ShieldCheck, SlidersHorizontal, Trash2, Truck, UserRound } from 'lucide-react';
import { ApiError, ROUTES, formatMoney, type AccountDeletionCheck } from '@youmart/shared-client';
import { api } from '@/lib/api';
import { logout } from '@/lib/session';
import { BTN_DANGER, BTN_SECONDARY, Banner, Dialog, INPUT, PageHeader, Panel, Skeleton } from './ui';

const POLICIES = [
  { href: '/privacy-policy', label: 'Privacy Policy', sub: 'What we collect and why', Icon: ShieldCheck },
  { href: '/terms', label: 'Terms & Conditions', sub: 'Including YouMart Wallet terms', Icon: FileText },
  { href: '/refund-policy', label: 'Refund Policy', sub: 'Returns, refunds and the wallet', Icon: RotateCcw },
  { href: '/shipping', label: 'Shipping Policy', sub: 'Delivery areas and charges', Icon: Truck },
];

/**
 * W9 on the website: Privacy & account - the policies and account deletion. Deletion waits for
 * orders in progress; a wallet balance must be explicitly given up (Terms: forfeited on deletion).
 */
export function PrivacyAccountView() {
  const router = useRouter();
  const [check, setCheck] = useState<AccountDeletionCheck | null | 'error'>(null);
  const [open, setOpen] = useState(false);
  const [forfeit, setForfeit] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.auth
      .deletionCheck()
      .then(setCheck)
      .catch(() => setCheck('error'));
  }, []);

  const ready = check && check !== 'error' ? check : null;
  const hasBalance = ready ? ready.walletBalance !== '0.00' : false;
  const canConfirm = confirmText.trim().toUpperCase() === 'DELETE' && (!hasBalance || forfeit);

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.auth.deleteAccount(hasBalance && forfeit);
      await logout().catch(() => undefined);
      router.replace('/?account=deleted');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete your account. Please try again.');
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Privacy & account" icon={ShieldCheck} subtitle="Our policies, and control over your account and data." />

      <ul className="mb-[20px] hidden grid-cols-3 gap-[14px] font-ui lg:grid">
        {[
          { Icon: EyeOff, title: 'We never sell your data', text: 'Your details are used only to deliver orders and support you.' },
          { Icon: CreditCard, title: 'Payments stay with Razorpay', text: 'YouMart never sees your card or UPI details.' },
          { Icon: SlidersHorizontal, title: 'You are in control', text: 'Choose what we send, sign out devices, delete your account.' },
        ].map(({ Icon, title, text }) => (
          <li key={title} className="flex items-start gap-[14px] rounded-[20px] border border-brand-popup-border bg-white p-[18px] shadow-rail-card">
            <span className="flex size-[44px] shrink-0 items-center justify-center rounded-[14px] bg-[#e8f8ee] text-[#15803d]">
              <Icon aria-hidden="true" className="size-[20px]" />
            </span>
            <span>
              <span className="block text-[15px] font-bold text-heading">{title}</span>
              <span className="mt-[2px] block text-[13px] leading-[1.5] text-ink-muted">{text}</span>
            </span>
          </li>
        ))}
      </ul>

      <Panel title="Policies">
        <ul className="grid gap-[10px] md:grid-cols-2">
          {POLICIES.map(({ href, label, sub, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex items-center gap-[12px] rounded-[12px] border border-catalog-rule p-[14px] font-ui transition-colors hover:border-brand lg:rounded-[18px] lg:border-brand-popup-border lg:p-[16px] lg:hover:bg-brand-popup-bg"
              >
                <span className="flex size-[40px] items-center justify-center rounded-[10px] bg-[#eef3fc] text-brand lg:size-[46px] lg:rounded-[14px] lg:bg-[linear-gradient(140deg,#0142aa,#3b82f6)] lg:text-white">
                  <Icon aria-hidden="true" className="size-[19px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-semibold text-heading">{label}</span>
                  <span className="block text-[12.5px] text-ink-muted">{sub}</span>
                </span>
                <ChevronRight aria-hidden="true" className="size-[16px] text-ink-muted transition-transform group-hover:translate-x-[2px] group-hover:text-brand" />
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Your data">
        <ul className="mb-[14px] hidden grid-cols-4 gap-[10px] font-ui lg:grid">
          {[
            { href: `${ROUTES.notifications}?tab=settings`, Icon: Bell, label: 'Notification settings', sub: 'WhatsApp & email' },
            { href: ROUTES.devices, Icon: MonitorSmartphone, label: 'Signed-in devices', sub: 'Sign out anywhere' },
            { href: ROUTES.addresses, Icon: MapPin, label: 'Saved addresses', sub: 'Edit or delete' },
            { href: ROUTES.accountDetails, Icon: UserRound, label: 'Account details', sub: 'Name, phone, email' },
          ].map(({ href, Icon, label, sub }) => (
            <li key={label}>
              <Link href={href} className="group flex h-full flex-col gap-[8px] rounded-[16px] bg-[#f8faff] p-[14px] transition-colors hover:bg-brand-popup-bg">
                <Icon aria-hidden="true" className="size-[20px] text-brand" />
                <span className="text-[14px] font-bold text-heading group-hover:text-brand">{label}</span>
                <span className="text-[12px] text-ink-muted">{sub}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="font-ui text-[14.5px] leading-[1.6] text-ink-body">
          We use your name, contact details and addresses only to deliver your orders and support you.
          Manage what we send you under{' '}
          <Link href={ROUTES.notifications} className="font-semibold text-brand hover:underline">
            Notifications
          </Link>{' '}
          and which devices are signed in under{' '}
          <Link href={ROUTES.devices} className="font-semibold text-brand hover:underline">
            Signed-in devices
          </Link>
          .
        </p>
      </Panel>

      <section className="rounded-[14px] border border-[#f5c2c2] bg-white shadow-rail-card lg:rounded-[24px]">
        <div className="flex items-center gap-[10px] rounded-t-[14px] border-b border-[#f5c2c2] bg-[#fdf6f6] px-[20px] py-[14px] lg:rounded-t-[24px] lg:px-[22px] lg:py-[16px]">
          <span className="flex size-[34px] items-center justify-center rounded-[10px] bg-[#fee2e2]">
            <Trash2 aria-hidden="true" className="size-[17px] text-woo-error" />
          </span>
          <h2 className="font-ui text-[16.5px] font-semibold text-[#991b1b] lg:text-[18px] lg:font-bold">Delete account</h2>
          <span className="ml-auto hidden rounded-full bg-[#fee2e2] px-[10px] py-[2px] font-ui text-[12px] font-bold text-[#b91c1c] lg:inline">Permanent</span>
        </div>
        <div className="p-[20px] font-ui text-[14.5px] leading-[1.6] text-ink-body lg:p-[22px]">
          <div className="mb-[14px] hidden grid-cols-2 gap-[12px] lg:grid">
            <div className="rounded-[16px] bg-[#fdf6f6] p-[14px]">
              <p className="mb-[6px] flex items-center gap-[6px] text-[13.5px] font-bold text-[#991b1b]">
                <Trash2 aria-hidden="true" className="size-[14px]" /> Removed for good
              </p>
              <p className="text-[13px] text-ink-body">Your profile, saved addresses, wishlist, reviews and wallet balance.</p>
            </div>
            <div className="rounded-[16px] bg-[#f8faff] p-[14px]">
              <p className="mb-[6px] flex items-center gap-[6px] text-[13.5px] font-bold text-heading">
                <Archive aria-hidden="true" className="size-[14px] text-brand" /> Kept (required by law)
              </p>
              <p className="text-[13px] text-ink-body">Order and invoice records - without your contact details.</p>
            </div>
          </div>
          <p>
            Deleting your account permanently removes your profile, saved addresses, wishlist and
            reviews. Order and invoice records we must keep by law are kept, without your contact
            details. This can&rsquo;t be undone.
          </p>
          {check === null ? (
            <Skeleton className="mt-[16px] h-[44px] w-[220px]" />
          ) : check === 'error' ? (
            <Banner tone="error">Couldn&rsquo;t check your account right now. Please refresh the page.</Banner>
          ) : check.openOrders > 0 ? (
            <div className="mt-[16px]">
              <Banner tone="info">
                You have {check.openOrders} order{check.openOrders === 1 ? '' : 's'} in progress. You can
                delete your account once {check.openOrders === 1 ? 'it is' : 'they are'} delivered or
                cancelled.{' '}
                <Link href={ROUTES.orders} className="font-semibold underline">
                  View orders
                </Link>
              </Banner>
            </div>
          ) : (
            <>
              {hasBalance ? (
                <div className="mt-[16px] flex items-start gap-[10px] rounded-[10px] border border-[#fde2b8] bg-[#fff8ec] px-[14px] py-[12px] text-[14px] text-[#92400e]">
                  <AlertTriangle aria-hidden="true" className="mt-[2px] size-[16px] shrink-0" />
                  <span>
                    Your YouMart Wallet has <strong>{formatMoney(check.walletBalance)}</strong>. Wallet
                    money is store credit and is <strong>lost</strong> when the account is deleted.{' '}
                    <Link href="/" className="font-semibold underline">
                      Spend it first
                    </Link>
                    .
                  </span>
                </div>
              ) : null}
              <button type="button" onClick={() => setOpen(true)} disabled={!check.canDelete && !hasBalance} className={`${BTN_DANGER} mt-[16px]`}>
                <Trash2 aria-hidden="true" className="size-[16px]" />
                Delete my account
              </button>
            </>
          )}
        </div>
      </section>

      <Dialog
        open={open}
        onClose={() => !busy && setOpen(false)}
        title="Delete your YouMart account?"
        description="This is permanent. You’ll be signed out everywhere."
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} disabled={busy} className={BTN_SECONDARY}>
              Keep my account
            </button>
            <button type="button" onClick={() => void remove()} disabled={!canConfirm || busy} className={BTN_DANGER}>
              {busy ? <Loader2 aria-hidden="true" className="size-[16px] animate-spin" /> : <Trash2 aria-hidden="true" className="size-[16px]" />}
              Delete permanently
            </button>
          </>
        }
      >
        {hasBalance && ready ? (
          <label className="mb-[16px] flex cursor-pointer items-start gap-[10px] rounded-[10px] border border-[#fde2b8] bg-[#fff8ec] px-[14px] py-[12px] font-ui text-[14px] text-[#92400e]">
            <input type="checkbox" checked={forfeit} onChange={(e) => setForfeit(e.target.checked)} className="mt-[3px] size-[16px] accent-woo-error" />
            <span>
              I understand my wallet balance of <strong>{formatMoney(ready.walletBalance)}</strong> will be
              lost and can&rsquo;t be refunded.
            </span>
          </label>
        ) : null}
        <label htmlFor="delete-confirm" className="mb-[6px] block font-ui text-[13.5px] font-semibold text-heading">
          Type <span className="font-mono text-woo-error">DELETE</span> to confirm
        </label>
        <input
          id="delete-confirm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoComplete="off"
          className={INPUT}
        />
        {error ? <p className="mt-[10px] font-ui text-[13.5px] text-woo-error">{error}</p> : null}
      </Dialog>
    </>
  );
}
