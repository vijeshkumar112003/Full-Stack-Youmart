'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

// Phones (<1025px) get the app's "Filters" pill that opens the filters as a bottom sheet, instead
// of the whole filter panel sitting above the results. Desktop keeps the sidebar as it was.
export function PhoneFilterSheet({ children, activeCount }: { children: ReactNode; activeCount: number }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="mb-[10px] inline-flex h-[36px] items-center gap-[6px] rounded-full border border-brand bg-white px-[14px] font-ui text-[14px] font-semibold text-brand lg:hidden"
      >
        <SlidersHorizontal aria-hidden="true" className="size-[16px]" />
        Filters{activeCount > 0 ? ` (${activeCount})` : ''}
      </button>

      <div
        className={open ? 'fixed inset-0 z-[1000] bg-black/45 lg:static lg:z-auto lg:bg-transparent' : 'hidden lg:block'}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      >
        <div
          role={open ? 'dialog' : undefined}
          aria-modal={open || undefined}
          aria-label={open ? 'Filters' : undefined}
          className={
            open
              ? 'absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-[20px] bg-white lg:static lg:max-h-none lg:rounded-none lg:bg-transparent'
              : ''
          }
        >
          {open ? (
            <div className="flex items-center justify-between px-[16px] pb-[4px] pt-[12px] lg:hidden">
              <span className="mx-auto h-[4px] w-[40px] rounded-full bg-[#d5dbe5]" aria-hidden="true" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="absolute right-[12px] top-[10px] grid size-[32px] place-items-center rounded-full bg-[#eef3fc] text-brand"
              >
                <X aria-hidden="true" className="size-[16px]" />
              </button>
            </div>
          ) : null}
          <div className={open ? 'min-h-0 flex-1 overflow-y-auto px-[10px] pb-[10px] lg:overflow-visible lg:p-0' : ''}>
            {children}
          </div>
          {open ? (
            <div className="border-t border-catalog-rule bg-white p-[12px] pb-[calc(12px+env(safe-area-inset-bottom))] lg:hidden">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-[46px] w-full rounded-full bg-brand font-ui text-[15px] font-semibold text-white"
              >
                Show results
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
