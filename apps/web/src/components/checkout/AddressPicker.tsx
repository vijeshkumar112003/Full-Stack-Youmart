'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  ADDRESS_TYPES,
  EMPTY_ADDRESS_FORM,
  addressLines,
  type Address,
  type AddressInput,
} from '@youmart/shared-client';
import { AddressForm } from '@/components/account/AddressForm';
import { api } from '@/lib/api';

interface AddressPickerProps {
  addresses: readonly Address[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Called with the saved address once address-service has stored it. */
  onAdded: (address: Address) => Promise<void>;
}

// Saved-address cards (address-service model) instead of live's one-off billing form; a new
// address is saved to the address book, and checkout only sends its id.
export function AddressPicker({ addresses, selectedId, onSelect, onAdded }: AddressPickerProps) {
  const [adding, setAdding] = useState(addresses.length === 0);

  const save = async (input: AddressInput) => {
    const address = await api.addresses.create({
      ...input,
      isDefault: addresses.length === 0 || Boolean(input.isDefault),
    });
    await onAdded(address);
    setAdding(false);
  };

  if (adding) {
    return (
      <div className="rounded-[16px] border border-brand-popup-border bg-white p-[15px] lg:p-[20px]">
        <AddressForm
          title="Add a new address"
          initial={{ ...EMPTY_ADDRESS_FORM, isDefault: addresses.length === 0 }}
          onSave={save}
          onCancel={() => setAdding(false)}
        />
      </div>
    );
  }

  return (
    <fieldset>
      <legend className="sr-only">Choose a delivery address</legend>
      <ul className="grid gap-[12px] lg:grid-cols-2">
        {addresses.map((address) => {
          const selected = address.id === selectedId;
          const type =
            ADDRESS_TYPES.find((t) => t.value === address.addressType)?.label ??
            address.addressType;
          return (
            <li key={address.id} className="flex">
              <label
                className={`flex w-full cursor-pointer gap-[12px] rounded-[16px] border p-[14px] transition-colors ${
                  selected
                    ? 'border-brand bg-[#f3f7fe] ring-1 ring-brand'
                    : 'border-brand-popup-border bg-white hover:border-brand/50'
                }`}
              >
                <input
                  type="radio"
                  name="delivery-address"
                  value={address.id}
                  checked={selected}
                  onChange={() => onSelect(address.id)}
                  className="mt-[3px] size-[18px] shrink-0 accent-brand"
                />
                <span className="min-w-0 font-ui text-[14.6px] leading-[1.55] text-ink-body lg:text-[15px]">
                  <span className="mb-[2px] flex flex-wrap items-center gap-[8px]">
                    <strong className="text-heading">{address.fullName}</strong>
                    <span className="rounded-[6px] bg-brand-popup-bg px-[7px] text-[11px] font-semibold uppercase tracking-[0.04em] text-brand">
                      {type}
                    </span>
                    {address.isDefault && (
                      <span className="rounded-full bg-brand px-[8px] text-[11px] font-semibold uppercase tracking-[0.04em] text-white">
                        Default
                      </span>
                    )}
                  </span>
                  {addressLines(address)
                    .slice(1)
                    .map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="mt-[12px] flex w-full items-center justify-center gap-[6px] rounded-[16px] border-2 border-dashed border-brand-popup-border py-[12px] font-ui text-[14.5px] font-bold text-brand transition-colors hover:border-brand hover:bg-brand-popup-bg"
      >
        <Plus aria-hidden="true" className="size-[16px]" strokeWidth={2.5} />
        Add a new address
      </button>
    </fieldset>
  );
}
