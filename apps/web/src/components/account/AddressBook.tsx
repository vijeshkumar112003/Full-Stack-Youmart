'use client';

import { useState } from 'react';
import { Briefcase, Check, House, MapPin, Pencil, Phone, Plus, Star, Trash2 } from 'lucide-react';
import {
  ADDRESS_TYPES,
  EMPTY_ADDRESS_FORM,
  addressLines,
  addressToForm,
  type Address,
  type AddressInput,
} from '@youmart/shared-client';
import { api } from '@/lib/api';
import { useAddresses } from '@/lib/addresses';
import { AddressForm } from './AddressForm';
import { Notice } from './Notice';
import { BODY_TEXT, FORM_BUTTON, TEXT_LINK } from './formStyles';
import { BTN_PRIMARY, PageHeader } from './ui';

const TYPE_ICON: Record<string, typeof House> = { HOME: House, WORK: Briefcase };

type View = { mode: 'list' } | { mode: 'form'; id: string | null };

// address-service owns the rules: one default per customer (setting one un-defaults the rest;
// deleting the default promotes the newest), and every call is scoped to the signed-in user.
// After each change the list is re-read so order and default flags are the server's.
export function AddressBook() {
  const { addresses, failed, reload } = useAddresses();
  const [view, setView] = useState<View>({ mode: 'list' });
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (failed) {
    return (
      <Notice tone="error">
        We could not load your addresses.{' '}
        <button type="button" onClick={() => void reload()} className={TEXT_LINK}>
          Try again
        </button>
      </Notice>
    );
  }
  if (!addresses) {
    return <div aria-busy="true" className="min-h-[240px]" />;
  }

  const save = async (input: AddressInput) => {
    const editing =
      view.mode === 'form' && view.id ? addresses.find((a) => a.id === view.id) : null;
    if (editing) {
      // The default stays the default until another address is made default (never zero).
      await api.addresses.update(editing.id, {
        ...input,
        isDefault: editing.isDefault || Boolean(input.isDefault),
      });
    } else {
      await api.addresses.create({
        ...input,
        isDefault: addresses.length === 0 || Boolean(input.isDefault),
      });
    }
    await reload();
    setView({ mode: 'list' });
    setMessage({ tone: 'success', text: 'Address changed successfully.' });
  };

  const act = async (address: Address, call: () => Promise<unknown>, done: string) => {
    setBusyId(address.id);
    setMessage(null);
    try {
      await call();
      await reload();
      setMessage({ tone: 'success', text: done });
    } catch {
      setMessage({ tone: 'error', text: 'That did not work. Please try again.' });
      await reload();
    } finally {
      setBusyId(null);
    }
  };

  const remove = (address: Address) => {
    if (!window.confirm(`Delete the address for ${address.fullName}, ${address.city}?`)) return;
    void act(address, () => api.addresses.remove(address.id), 'Address deleted.');
  };

  if (view.mode === 'form') {
    const editing = addresses.find((a) => a.id === view.id);
    return (
      <>
      <PageHeader
        title={editing ? 'Edit address' : 'Add a new address'}
        icon={MapPin}
        subtitle="Where should we deliver? We use this at checkout."
      />
      <div className="lg:rounded-[24px] lg:border lg:border-brand-popup-border lg:bg-white lg:p-[24px] lg:shadow-rail-card">
      <AddressForm
        key={view.id ?? 'new'}
        title={editing ? 'Edit address' : 'Add a new address'}
        initial={
          editing
            ? addressToForm(editing)
            : { ...EMPTY_ADDRESS_FORM, isDefault: addresses.length === 0 }
        }
        onSave={save}
        onCancel={() => setView({ mode: 'list' })}
      />
      </div>
      </>
    );
  }

  const add = () => {
    setMessage(null);
    setView({ mode: 'form', id: null });
  };

  const action = `font-ui text-[15px] disabled:cursor-wait disabled:opacity-60 ${TEXT_LINK}`;

  return (
    <div>
      <PageHeader
        title="Saved addresses"
        icon={MapPin}
        subtitle={`${addresses.length} saved address${addresses.length === 1 ? '' : 'es'} - your default is picked first at checkout.`}
        actions={
          <button type="button" onClick={add} className={`${BTN_PRIMARY} hidden lg:inline-flex`}>
            <Plus aria-hidden="true" className="size-[16px]" /> Add new address
          </button>
        }
      />
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
      <p className={`${BODY_TEXT} mb-[25.6px] lg:hidden`}>
        The following addresses will be used on the checkout page by default.
      </p>

      {addresses.length === 0 ? (
        <Notice tone="info">You have not set up any addresses yet.</Notice>
      ) : (
        <ul className="mb-[24px] grid gap-[20px] md:grid-cols-2 lg:gap-[16px] min-[1360px]:grid-cols-3">
          {addresses.map((address) => {
            const type =
              ADDRESS_TYPES.find((t) => t.value === address.addressType)?.label ??
              address.addressType;
            const busy = busyId === address.id;
            const TypeIcon = TYPE_ICON[address.addressType] ?? MapPin;
            return (
              <li
                key={address.id}
                aria-busy={busy || undefined}
                // POLISH (flagged): resting shadow + hover lift, brand-blue border on the default.
                className={`flex flex-col rounded-[10px] border bg-white shadow-rail-card transition-shadow duration-200 hover:shadow-product-card lg:rounded-[20px] ${
                  address.isDefault ? 'border-cart-border lg:border-brand lg:ring-1 lg:ring-brand' : 'border-catalog-rule lg:border-brand-popup-border'
                } ${busy ? 'opacity-70' : ''}`}
              >
                <header className="flex flex-wrap items-center gap-[8px] border-b border-catalog-rule px-[1em] py-[0.7em] lg:gap-[12px] lg:border-brand-popup-border lg:px-[18px] lg:py-[14px]">
                  <span className={`hidden size-[40px] items-center justify-center rounded-[12px] lg:flex ${address.isDefault ? 'bg-brand text-white' : 'bg-brand-popup-bg text-brand'}`}>
                    <TypeIcon aria-hidden="true" className="size-[19px]" />
                  </span>
                  <h3 className="font-ui text-[19.2px] font-semibold leading-[1.3] text-heading lg:flex-1 lg:text-[17px] lg:font-bold">
                    {type}
                  </h3>
                  {address.isDefault && (
                    <span className="inline-flex items-center gap-[4px] rounded-full bg-brand px-[10px] py-[2px] font-ui text-[12px] font-semibold uppercase tracking-[0.04em] text-white">
                      <Check aria-hidden="true" className="hidden size-[12px] lg:block" strokeWidth={3} /> Default
                    </span>
                  )}
                </header>
                <address className={`${BODY_TEXT} flex-1 px-[1em] py-[0.8em] not-italic lg:px-[18px] lg:py-[14px] lg:text-[14.5px] lg:leading-[1.6]`}>
                  {addressLines(address).map((line, i) => (
                    <span key={line} className={`block ${i === 0 ? 'lg:font-bold lg:text-heading' : ''}`}>
                      {line}
                    </span>
                  ))}
                  <span className="mt-[8px] hidden items-center gap-[6px] text-[13px] font-semibold text-ink-muted lg:flex">
                    <Phone aria-hidden="true" className="size-[13px]" /> {address.phone}
                  </span>
                </address>
                <div className="flex flex-wrap gap-x-[18px] gap-y-[6px] border-t border-catalog-rule px-[1em] py-[0.6em] lg:hidden">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setMessage(null);
                      setView({ mode: 'form', id: address.id });
                    }}
                    className={action}
                  >
                    Edit<span className="sr-only"> {type} address</span>
                  </button>
                  {!address.isDefault && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void act(
                          address,
                          () => api.addresses.setDefault(address.id),
                          'Default address updated.',
                        )
                      }
                      className={action}
                    >
                      Set as default
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(address)}
                    className="font-ui text-[15px] text-woo-error hover:underline focus:outline-none focus-visible:underline disabled:cursor-wait disabled:opacity-60"
                  >
                    Delete<span className="sr-only"> {type} address</span>
                  </button>
                </div>
                <div className="hidden gap-[8px] border-t border-brand-popup-border px-[14px] py-[12px] lg:flex">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setMessage(null);
                      setView({ mode: 'form', id: address.id });
                    }}
                    className="inline-flex h-[36px] items-center gap-[6px] rounded-[10px] bg-brand-popup-bg px-[12px] font-ui text-[13px] font-bold text-brand hover:bg-[#dce8fd] disabled:opacity-60"
                  >
                    <Pencil aria-hidden="true" className="size-[13px]" /> Edit<span className="sr-only"> {type} address</span>
                  </button>
                  {!address.isDefault && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void act(address, () => api.addresses.setDefault(address.id), 'Default address updated.')}
                      className="inline-flex h-[36px] items-center gap-[6px] rounded-[10px] px-[12px] font-ui text-[13px] font-bold text-heading ring-1 ring-brand-popup-border hover:ring-brand disabled:opacity-60"
                    >
                      <Star aria-hidden="true" className="size-[13px]" /> Make default
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(address)}
                    aria-label={`Delete ${type} address`}
                    className="ml-auto inline-flex size-[36px] items-center justify-center rounded-[10px] text-ink-muted ring-1 ring-brand-popup-border hover:text-woo-error hover:ring-woo-error disabled:opacity-60"
                  >
                    <Trash2 aria-hidden="true" className="size-[15px]" />
                  </button>
                </div>
              </li>
            );
          })}
          <li className="hidden lg:flex">
            <button
              type="button"
              onClick={add}
              className="flex min-h-[200px] w-full flex-col items-center justify-center gap-[10px] rounded-[20px] border-2 border-dashed border-brand-popup-border bg-white/60 font-ui text-brand transition-colors hover:border-brand hover:bg-brand-popup-bg"
            >
              <span className="flex size-[52px] items-center justify-center rounded-full bg-brand-popup-bg">
                <Plus aria-hidden="true" className="size-[24px]" />
              </span>
              <span className="text-[15px] font-bold">Add a new address</span>
              <span className="text-[12.5px] text-ink-muted">Home, work or anywhere else</span>
            </button>
          </li>
        </ul>
      )}

      <button
        type="button"
        onClick={add}
        className={`${FORM_BUTTON} ${addresses.length > 0 ? 'lg:hidden' : ''}`}
      >
        Add new address
      </button>
    </div>
  );
}
