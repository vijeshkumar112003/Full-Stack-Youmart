'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Check, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { formatMoney, freeDeliveryProgress } from '@youmart/shared-client';
import { dismissCartToast, useCartToast } from '@/lib/cart-toast';
import { useCart } from '@/lib/cart';
import { FreeDeliveryProgress } from './FreeDeliveryProgress';

// App colours only (apps/mobile/src/components/FreeDeliveryNudge.tsx and its toasts).
const TONES = {
  success: <CheckCircle2 aria-hidden="true" className="mt-[2px] size-[18px] shrink-0 text-[#28b463]" />,
  info: <Info aria-hidden="true" className="mt-[2px] size-[18px] shrink-0 text-brand" />,
  error: <XCircle aria-hidden="true" className="mt-[2px] size-[18px] shrink-0 text-[#e11d48]" />,
} as const;

const PLACE =
  'fixed inset-x-[12px] bottom-[calc(68px+env(safe-area-inset-bottom))] z-[80] mx-auto max-w-[440px] animate-toast-in font-ui motion-reduce:animate-none lg:inset-x-auto lg:bottom-[24px] lg:right-[24px] lg:w-[420px]';

/**
 * The one floating notice. An add-to-cart is the app's brand-blue "Added to cart" popup with the
 * FREE-delivery progress and a Checkout button; everything else is a white app-style card.
 */
export function CartToast() {
  const toast = useCartToast();
  const pathname = usePathname() ?? '';
  const { cart } = useCart();
  if (!toast) return null;
  const cartAdd = toast.tone === 'success' && !toast.action && !!cart && cart.items.length > 0;
  const action = toast.action ?? { href: '/cart', label: 'View cart' };
  const onTarget = pathname.startsWith(action.href);

  if (cartAdd && cart) {
    const unlocked = freeDeliveryProgress(cart.subtotal).unlocked;
    return (
      <div key={toast.id} role="status" className={PLACE}>
        <div
          className={`flex items-center gap-[12px] rounded-[18px] border bg-brand py-[12px] pl-[14px] pr-[10px] shadow-[0_8px_14px_rgba(1,66,170,0.35)] ${unlocked ? 'border-white/60' : 'border-white/[0.18]'}`}
        >
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-[6px]">
              <span className="flex size-[16px] shrink-0 items-center justify-center rounded-full bg-[#28b463]">
                <Check aria-hidden="true" className="size-[11px] text-white" strokeWidth={3} />
              </span>
              <span className="text-[13px] font-bold text-white">Added to cart</span>
              <span className="truncate text-[12px] font-medium text-white/85">
                · {cart.itemCount} item{cart.itemCount === 1 ? '' : 's'} · {formatMoney(cart.subtotal)}
              </span>
            </p>
            {unlocked ? <p className="mt-[2px] text-[14px] font-bold text-white">🎉 Congratulations!</p> : null}
            <div className="mt-[6px]">
              <FreeDeliveryProgress subtotal={cart.subtotal} tone="dark" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-[8px] self-stretch">
            <button
              type="button"
              onClick={dismissCartToast}
              aria-label="Dismiss"
              className="flex size-[24px] items-center justify-center rounded-full bg-white/[0.18] text-white/80 hover:bg-white/30 hover:text-white"
            >
              <X aria-hidden="true" className="size-[15px]" />
            </button>
            {!pathname.startsWith('/checkout') && (
              <Link
                href="/checkout"
                onClick={dismissCartToast}
                className="mt-auto flex items-center gap-[4px] rounded-[12px] bg-white px-[12px] py-[9px] text-[13px] font-bold text-brand hover:bg-brand-popup-bg"
              >
                Checkout <ArrowRight aria-hidden="true" className="size-[14px]" />
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div key={toast.id} role={toast.tone === 'error' ? 'alert' : 'status'} className={PLACE}>
      <div className="flex items-start gap-[10px] rounded-[16px] border border-brand-popup-border bg-white px-[16px] py-[12px] text-[14.5px] leading-[1.5] text-heading shadow-[0_10px_24px_rgba(1,66,170,0.18)]">
        {TONES[toast.tone]}
        <div className="min-w-0 flex-1">
          <p>
            {toast.message}
            {toast.tone !== 'error' && !onTarget && (
              <>
                {' '}
                <Link
                  href={action.href}
                  onClick={dismissCartToast}
                  className="font-bold text-brand hover:underline focus:outline-none focus-visible:underline"
                >
                  {action.label}
                </Link>
              </>
            )}
          </p>
          {toast.details && toast.details.length > 0 && (
            <ul className="mt-[4px] list-disc pl-[18px] text-[13.5px] text-ink-muted">
              {toast.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={dismissCartToast}
          aria-label="Dismiss"
          className="-mr-[4px] flex size-[24px] items-center justify-center rounded-full text-ink-muted hover:bg-brand-popup-bg hover:text-heading focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <X aria-hidden="true" className="size-[15px]" />
        </button>
      </div>
    </div>
  );
}
