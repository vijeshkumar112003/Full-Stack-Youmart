'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { phoneScreenTitle } from '@/lib/phone-screens';

/** The app's inner-screen header on phones (round back button + centred title). */
export function PhoneScreenHeader() {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const title = phoneScreenTitle(pathname);
  if (!title) return null;
  return (
    <div className="sticky top-0 z-30 flex h-[60px] items-center justify-center bg-page/95 px-[16px] backdrop-blur lg:hidden">
      <button
        type="button"
        aria-label="Back"
        onClick={() => (window.history.length > 1 ? router.back() : router.push('/account'))}
        className="absolute left-[16px] flex size-[44px] items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(15,23,42,0.12)]"
      >
        <ChevronLeft aria-hidden="true" className="size-[22px] text-heading" />
      </button>
      <p className="max-w-[calc(100%-120px)] truncate font-ui text-[17px] font-bold text-heading">{title}</p>
    </div>
  );
}
