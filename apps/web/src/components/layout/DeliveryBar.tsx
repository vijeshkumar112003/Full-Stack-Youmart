'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, Lock, MapPin, Plus, X } from 'lucide-react';
import { ROUTES, loginHref, type Address } from '@youmart/shared-client';
import { useAddresses } from '@/lib/addresses';
import { useSession } from '@/lib/session';

// The app's "Deliver to" pill (phone header) + its bottom sheet: sign in, or pick one of the saved
// addresses (remembered in this browser), or add a new one.

const KEY = 'ym.deliverTo';

function readChoice(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function DeliveryBar() {
  const session = useSession();
  const authed = session.status === 'authenticated';
  const { addresses } = useAddresses();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<string | null>(null);
  useEffect(() => setChoice(readChoice()), []);

  const selected: Address | undefined =
    addresses?.find((a) => a.id === choice) ?? addresses?.find((a) => a.isDefault) ?? addresses?.[0];
  const summary = selected
    ? `${selected.line1}, ${selected.city}`
    : authed
      ? 'Add a delivery address'
      : 'Sign in to set delivery';

  const pick = (id: string) => {
    setChoice(id);
    try {
      window.localStorage.setItem(KEY, id);
    } catch {
      // ignore
    }
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-[8px] flex max-w-full items-center gap-[6px] self-start rounded-[12px] border border-brand-popup-border bg-brand-popup-bg px-[12px] py-[7px]"
      >
        <MapPin aria-hidden="true" className="size-[14px] shrink-0 fill-brand text-brand" />
        <span className="shrink-0 font-ui text-[13px] font-medium text-brand">Deliver to</span>
        <span className="truncate font-ui text-[13px] font-semibold text-heading">{summary}</span>
        <ChevronDown aria-hidden="true" className="size-[15px] shrink-0 text-brand" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-modal="true" aria-label="Delivery address">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-[24px] bg-page px-[16px] pb-[calc(20px+env(safe-area-inset-bottom))] pt-[8px] animate-[ym-sheet-up_220ms_ease-out]">
            <span aria-hidden="true" className="mx-auto mb-[12px] block h-[5px] w-[40px] rounded-full bg-card-border" />
            <div className="mb-[12px] flex items-start justify-between">
              <div>
                <p className="font-ui text-[12px] font-bold uppercase tracking-[0.8px] text-brand">Delivery</p>
                <p className="font-ui text-[20px] font-bold text-heading">Where should we deliver?</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="flex size-[36px] items-center justify-center rounded-full bg-white shadow">
                <X aria-hidden="true" className="size-[18px]" />
              </button>
            </div>
            {!authed ? (
              <div className="flex flex-col items-center gap-[10px] rounded-[16px] border border-card-border bg-white px-[16px] py-[20px] text-center">
                <Lock aria-hidden="true" className="size-[24px] text-brand" />
                <p className="text-[14px] text-ink-body">Sign in to save and choose delivery addresses.</p>
                <Link href={loginHref('/')} onClick={() => setOpen(false)} className="rounded-[12px] bg-brand px-[26px] py-[10px] font-ui text-[15px] font-bold text-white">
                  Sign in
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-[8px]">
                {(addresses ?? []).map((a) => {
                  const on = a.id === selected?.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => pick(a.id)}
                      className={`flex items-start gap-[10px] rounded-[14px] border bg-white p-[12px] text-left ${on ? 'border-brand ring-1 ring-brand' : 'border-card-border'}`}
                    >
                      <MapPin aria-hidden="true" className="mt-[2px] size-[16px] shrink-0 text-brand" />
                      <span className="flex-1">
                        <span className="block font-ui text-[14px] font-semibold text-heading">{a.fullName}</span>
                        <span className="block text-[12.5px] leading-[17px] text-ink-muted">
                          {a.line1}, {a.city} {a.pincode}
                        </span>
                      </span>
                      {on ? <Check aria-hidden="true" className="size-[18px] text-brand" /> : null}
                    </button>
                  );
                })}
                <Link
                  href={ROUTES.addresses}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-[6px] rounded-[14px] border border-dashed border-brand bg-white py-[12px] font-ui text-[14px] font-semibold text-brand"
                >
                  <Plus aria-hidden="true" className="size-[16px]" /> Add a new address
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
