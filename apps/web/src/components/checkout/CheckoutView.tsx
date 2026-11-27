'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, ChevronDown, Loader2, Lock, Tag, Zap } from 'lucide-react';
import {
  ApiError,
  deliveryFee,
  fromPaise,
  toPaise,
  CHECKOUT_BLOCKER_MESSAGE,
  PAYMENT_POLL,
  addressLines,
  authUserLabel,
  cartTotals,
  checkoutBlocker,
  codAvailable,
  colors,
  defaultCheckoutAddress,
  formatMoney,
  paymentErrorMessage,
  recalcCart,
  placeOrderErrorMessage,
  pollOrderStatus,
  razorpayCheckoutOptions,
  type CartTotals,
  type CouponQuote,
  type Money,
  type OrderView,
  type PaymentMethodId,
  type WalletSummary,
  walletSplit,
} from '@youmart/shared-client';
import { LogoutButton } from '@/components/account/LogoutButton';
import { Notice } from '@/components/account/Notice';
import { OtpLoginForm } from '@/components/account/OtpLoginForm';
import { BODY_TEXT, TEXT_LINK } from '@/components/account/formStyles';
import { CheckoutSteps } from '@/components/listing/CheckoutSteps';
import { useAddresses } from '@/lib/addresses';
import { api } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { forgetPendingOrder, pendingOrderId, rememberPendingOrder } from '@/lib/pending-order';
import { useSession } from '@/lib/session';
import { AddressPicker } from './AddressPicker';
import { CouponBox } from './CouponBox';
import { PLACING_STEP_MS, PlacingOrderModal, atLeast } from './PlacingOrderModal';
import { OrderPanel, OrderReviewTable, type ReviewRow } from './OrderReview';
import { OrderReceived } from './OrderReceived';
import { PaymentMethods } from './PaymentMethods';
import { WalletOption } from './WalletOption';
import { DESK_CARD, DESK_PILL, DeskCheckoutSteps, DeskItems, DeskTrust, StepCard, useDesktop, type DeskLine } from './DeskCheckout';

type Phase =
  | { step: 'review' }
  | { step: 'placing' }
  /** Placed (PENDING_PAYMENT, stock held); waiting for the customer to pay or retry. */
  | { step: 'pay'; order: OrderView }
  | { step: 'paying'; order: OrderView }
  /** Razorpay reported success; polling until the webhook confirms the order. */
  | { step: 'confirming'; order: OrderView }
  | { step: 'slow'; order: OrderView }
  | { step: 'done'; order: OrderView; placedAt: string };

type Message = { tone: 'info' | 'error'; text: string };

/** Live's section heading ("Billing details"): small Outfit semibold over a 1px blue rule. */
const SECTION_TITLE =
  'mb-[25.6px] flex items-center gap-[10px] border-b border-catalog-rule pb-[8px] font-ui text-[13.1px] font-semibold leading-[1.3] text-heading lg:text-[14.4px]';

// POLISH (W5, flagged): numbered steps that turn into a green check once complete.
function SectionTitle({
  id,
  index,
  done,
  children,
}: {
  id: string;
  index: number;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <h2 id={id} className={SECTION_TITLE}>
      <span
        aria-hidden="true"
        className={`flex size-[22px] shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white ${
          done ? 'bg-woo-success' : 'bg-brand'
        }`}
      >
        {done ? <Check className="size-[14px]" strokeWidth={3} /> : index}
      </span>
      {children}
      {done && <span className="sr-only"> (done)</span>}
    </h2>
  );
}

const PILL =
  'mb-[10px] flex min-h-[48px] w-full py-[6px] text-center leading-[1.2] items-center justify-center gap-[8px] rounded-[30px] border-2 border-white bg-brand px-[16px] font-sans text-[15px] font-bold uppercase text-white transition-[opacity,box-shadow] duration-150 hover:opacity-90 hover:shadow-brand-button focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 disabled:shadow-none lg:min-h-[44px] lg:px-[36px] lg:text-[20px]';

function Busy({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="status"
      className="mb-[16px] flex items-start gap-[10px] rounded-[10px] border border-catalog-rule bg-cart-headBg px-[14px] py-[12px] font-ui text-[15px] leading-[1.5] text-heading"
    >
      <Loader2
        aria-hidden="true"
        className="mt-[3px] size-[16px] shrink-0 animate-spin text-brand"
      />
      <span>{children}</span>
    </p>
  );
}

// One page, three blocks in order of need: who you are (OTP), where it goes (saved addresses),
// how you pay (Razorpay). The money path and its rules live in shared-client checkout.ts.
export function CheckoutView() {
  const router = useRouter();
  const session = useSession();
  const loggedIn = session.status === 'authenticated';
  const userId = session.user?.id ?? null;
  const { cart: fullCart, reload: reloadCart, setQuantity, remove } = useCart();
  // "Buy this now" (cart, wishlist, product page): only these cart lines are ordered; the rest
  // stay in the cart. Without ?buy= the whole cart is checked out, as before.
  const buyParam = useSearchParams().get('buy');
  const buyIds = buyParam ? buyParam.split(',').filter(Boolean) : null;
  const cart =
    fullCart && buyIds
      ? recalcCart(
          fullCart.cartId,
          fullCart.items.filter((line) => buyIds.includes(line.cartItemId)),
        )
      : fullCart;
  const partial = Boolean(buyIds && fullCart && cart && fullCart.items.length > cart.items.length);
  const { addresses, reload: reloadAddresses } = useAddresses();
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentMethodId>('razorpay');
  const [coupon, setCoupon] = useState<CouponQuote | null>(null);
  const [couponNote, setCouponNote] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ step: 'review' });
  const [message, setMessage] = useState<Message | null>(null);
  // Until we know whether this customer has an unpaid order from before a reload.
  const [resumeChecked, setResumeChecked] = useState(false);
  const polling = useRef<AbortController | null>(null);
  // W9: the YouMart Wallet - on by default when it has money (wallet first, Razorpay for any rest).
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [useWallet, setUseWallet] = useState(true);
  // One layout at a time: the desktop step cards from 1025px, the phone page below.
  const desk = useDesktop();
  const pill = desk ? DESK_PILL : PILL;

  const addressId =
    chosenId && addresses?.some((a) => a.id === chosenId)
      ? chosenId
      : (defaultCheckoutAddress(addresses ?? [])?.id ?? null);

  // v1.16: delivery by the chosen address (free from ₹2,000) - order-service charges the same.
  const shipAddress = addresses?.find((a) => a.id === addressId) ?? null;
  const shipping = (cart ? deliveryFee(cart.subtotal, shipAddress) : null) ?? '0.00';
  const withShipping = (amount: Money) => fromPaise(toPaise(amount) + toPaise(shipping));

  useEffect(() => () => polling.current?.abort(), []);

  useEffect(() => {
    if (!userId) {
      setWallet(null);
      return;
    }
    let active = true;
    api.wallet
      .get()
      .then((w) => active && setWallet(w))
      .catch(() => active && setWallet(null));
    return () => {
      active = false;
    };
  }, [userId]);

  // Quantities can change on this page: an applied coupon is checked again against the new lines
  // (after a short pause, so the cart update reaches the server first). If it no longer applies it
  // comes off with the reason.
  const lineKey = (cart?.items ?? []).map((l) => `${l.cartItemId}:${l.quantity}`).join();
  const quotedFor = useRef(lineKey);
  useEffect(() => {
    if (!coupon) {
      quotedFor.current = lineKey;
      return;
    }
    if (quotedFor.current === lineKey || !cart || cart.items.length === 0) return;
    const code = coupon.coupon.code;
    const ids = buyIds ? cart.items.map((l) => l.cartItemId) : undefined;
    const t = setTimeout(() => {
      quotedFor.current = lineKey;
      api.orders
        .quoteCoupon(code, ids)
        .then((quote) => setCoupon(quote))
        .catch((failure: unknown) => {
          setCoupon(null);
          setCouponNote(
            failure instanceof ApiError
              ? `${code} was removed: ${failure.message}`
              : `${code} was removed - please apply it again.`,
          );
        });
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineKey, coupon]);

  const changeQuantity = (cartItemId: string, quantity: number) => {
    setCouponNote(null);
    if (quantity <= 0) remove(cartItemId);
    else setQuantity(cartItemId, quantity);
  };

  const finish = (order: OrderView) => {
    forgetPendingOrder();
    reloadCart();
    api.wallet
      .get()
      .then(setWallet)
      .catch(() => undefined);
    setMessage(null);
    setPhase({ step: 'done', order, placedAt: new Date().toISOString() });
    window.scrollTo({ top: 0 });
  };

  // The webhook is the source of truth: after Razorpay's success callback we only watch the order.
  const confirm = async (order: OrderView) => {
    polling.current?.abort();
    const controller = new AbortController();
    polling.current = controller;
    setMessage(null);
    setPhase({ step: 'confirming', order });
    let outcome;
    try {
      outcome = await pollOrderStatus(() => api.orders.get(order.orderId), {
        ...PAYMENT_POLL,
        signal: controller.signal,
      });
    } catch {
      outcome = { kind: 'cancelled' as const, order };
    }
    if (outcome.kind === 'aborted') return;
    if (outcome.kind === 'confirmed') {
      finish(outcome.order);
    } else if (outcome.kind === 'cancelled') {
      forgetPendingOrder();
      setPhase({ step: 'review' });
      setMessage({ tone: 'error', text: `Order ${order.orderNumber} was cancelled.` });
    } else {
      setPhase({ step: 'slow', order });
    }
  };

  const pay = async (order: OrderView) => {
    setMessage(null);
    setPhase({ step: 'paying', order });
    let result;
    const withWallet = walletOn;
    try {
      let razorpayOrder;
      if (withWallet) {
        // Wallet first: the server takes what the wallet can cover and returns a Razorpay order
        // for any rest (none when the wallet pays it all - the order is confirmed at once).
        const paid = await api.payments.pay(order.orderId, true, 'ONLINE');
        if (paid.status === 'PAID' || !paid.razorpay) {
          await confirm(order);
          return;
        }
        razorpayOrder = paid.razorpay;
      } else {
        razorpayOrder = await api.payments.createRazorpayOrder(order.orderId);
      }
      const prefill = {
        name: session.user?.name ?? order.shippingAddress.fullName,
        email: session.user?.email ?? undefined,
        contact: session.user?.phone ?? order.shippingAddress.phone,
      };
      result = await openRazorpayCheckout(
        razorpayCheckoutOptions(razorpayOrder, order, prefill, colors.brand.DEFAULT),
      );
    } catch (error) {
      // 409 = no longer payable: most likely already paid (e.g. in another tab) - check.
      if (error instanceof ApiError && error.status === 409) {
        await confirm(order);
        return;
      }
      setPhase({ step: 'pay', order });
      setMessage({
        tone: 'error',
        text:
          error instanceof ApiError
            ? paymentErrorMessage(error)
            : 'Razorpay could not be opened. Please check your connection and try again.',
      });
      return;
    }
    if (result.kind === 'paid') {
      await confirm(order);
      return;
    }
    setPhase({ step: 'pay', order });
    setMessage(
      result.lastError
        ? {
            tone: 'error',
            text: `Payment failed: ${result.lastError.replace(/\.?\s*$/, '.')} Your order is saved - you can try again.`,
          }
        : {
            tone: 'info',
            text: 'Payment was not completed. Your order is saved and its items are held for you.',
          },
    );
  };

  const placeOrder = async () => {
    if (!cart) return;
    const blocker = checkoutBlocker({ loggedIn, addressId, cart });
    if (blocker || !addressId || !userId) {
      setMessage({ tone: 'error', text: CHECKOUT_BLOCKER_MESSAGE[blocker ?? 'address'] });
      return;
    }
    setMessage(null);
    setPhase({ step: 'placing' });
    const useCod =
      payment === 'cod' &&
      codAvailable(
        (coupon ? withShipping(coupon.total) : cartTotals(cart, shipping).total) as Money,
      );
    let order: OrderView;
    try {
      // The real request runs under the "Placing your order" steps (a minimum so it reads as real;
      // Cash on Delivery's confirmation is the last step, below).
      order = await atLeast(
        api.orders.checkout(
          addressId,
          buyIds ? cart.items.map((line) => line.cartItemId) : undefined,
          coupon?.coupon.code,
        ),
        (placingSteps.length - (useCod ? 1 : 0)) * PLACING_STEP_MS + 150,
      );
    } catch (error) {
      setPhase({ step: 'review' });
      setMessage({ tone: 'error', text: placeOrderErrorMessage(error) });
      reloadCart();
      return;
    }
    rememberPendingOrder(userId, order.orderId);
    // The cart stays until payment; refresh in case the server changed it.
    reloadCart();
    if (useCod) {
      // Cash on Delivery: confirmed straight away - nothing to pay now.
      try {
        await atLeast(api.payments.pay(order.orderId, false, 'COD'), PLACING_STEP_MS);
        finish(await api.orders.get(order.orderId));
      } catch (error) {
        setPhase({ step: 'pay', order });
        setMessage({
          tone: 'error',
          text:
            error instanceof ApiError
              ? error.message
              : 'Cash on Delivery could not be confirmed. Please try again or pay online.',
        });
      }
      return;
    }
    await pay(order);
  };

  // Resume an unpaid (or just-confirmed) order after a reload.
  useEffect(() => {
    if (session.status === 'loading') return;
    if (!userId) {
      setResumeChecked(true);
      return;
    }
    const orderId = pendingOrderId(userId);
    if (!orderId) {
      setResumeChecked(true);
      return;
    }
    let active = true;
    api.orders
      .get(orderId)
      .then((order) => {
        if (!active) return;
        if (order.status === 'PENDING_PAYMENT') {
          setPhase({ step: 'pay', order });
          setMessage({
            tone: 'info',
            text: `Order ${order.orderNumber} is waiting for payment.`,
          });
        } else if (order.status === 'CONFIRMED') {
          finish(order);
        } else {
          forgetPendingOrder();
        }
      })
      .catch(() => forgetPendingOrder())
      .finally(() => active && setResumeChecked(true));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per signed-in customer
  }, [session.status, userId]);

  const order = 'order' in phase ? phase.order : null;
  const payTotal = (
    order
      ? order.grandTotal
      : coupon
        ? withShipping(coupon.total)
        : cart
          ? cartTotals(cart, shipping).total
          : '0.00'
  ) as Money;
  const codChosen = payment === 'cod' && codAvailable(payTotal);
  const walletOn = Boolean(wallet && useWallet && wallet.available !== '0.00' && !codChosen);
  const placingSteps = [
    'Checking prices & stock',
    ...(coupon ? [`Applying ${coupon.coupon.code}`] : []),
    payment === 'cod'
      ? 'Confirming your Cash on Delivery order'
      : walletOn
        ? 'Applying your YouMart Wallet'
        : 'Preparing secure payment',
  ];
  const cartEmpty = !cart || cart.items.length === 0;

  useEffect(() => {
    // Only while reviewing: placing an order empties (part of) the cart on purpose.
    if (resumeChecked && !order && phase.step === 'review' && cart && cart.items.length === 0) {
      router.replace('/cart');
    }
  }, [resumeChecked, order, phase.step, cart, router]);

  if (phase.step === 'done') {
    return <OrderReceived order={phase.order} placedAt={phase.placedAt} />;
  }

  const steps = desk ? <DeskCheckoutSteps paying={false} /> : <CheckoutSteps current="Shop" active={2} centered />;
  if (!resumeChecked || session.status === 'loading' || (!order && cartEmpty)) {
    return (
      <>
        {steps}
        <div aria-busy="true" aria-label="Loading checkout" className="min-h-[480px]" />
      </>
    );
  }

  // Before placing: the cart (a preview). After: the server's re-priced order (what is charged).
  const rows: ReviewRow[] = order
    ? order.items.map((item) => ({
        key: item.skuId,
        title: item.title,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      }))
    : (cart?.items ?? []).map((line) => ({
        key: line.cartItemId,
        title: line.title,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
      }));
  const preview = cartTotals(cart!, shipping);
  const totals: CartTotals = order
    ? { subtotal: order.subtotal, shipping: order.shippingTotal, total: order.grandTotal }
    : coupon
      ? { ...preview, total: withShipping(coupon.total) }
      : preview;
  // v1.13: the coupon row - the placed order's own discount, or the one previewed here.
  const discount = order
    ? order.discountTotal && order.discountTotal !== '0.00'
      ? { code: order.couponCode ?? null, amount: order.discountTotal }
      : null
    : coupon
      ? { code: coupon.coupon.code, amount: coupon.discount }
      : null;

  const busy = phase.step === 'placing' || phase.step === 'paying' || phase.step === 'confirming';
  const notice = message && <Notice tone={message.tone}>{message.text}</Notice>;

  let action: React.ReactNode;
  if (phase.step === 'confirming') {
    action = <Busy>Confirming your payment with Razorpay&hellip; Please keep this page open.</Busy>;
  } else if (phase.step === 'slow') {
    action = (
      <>
        <Notice tone="info">
          Your payment is still being confirmed - this can take a minute. We&rsquo;ll show your
          receipt as soon as it lands; you won&rsquo;t be charged twice.
        </Notice>
        <button type="button" onClick={() => void confirm(phase.order)} className={pill}>
          Check payment status
        </button>
      </>
    );
  } else if (order) {
    action = (
      <>
        <button
          type="button"
          onClick={() => void pay(order)}
          disabled={phase.step === 'paying'}
          aria-busy={phase.step === 'paying' || undefined}
          className={pill}
        >
          {phase.step === 'paying' ? (
            <>
              <Loader2 aria-hidden="true" className="size-[18px] animate-spin" />
              Opening Razorpay&hellip;
            </>
          ) : (
            <>
              <Lock aria-hidden="true" className="size-[16px]" />
              {walletOn && wallet
                ? walletSplit(order.grandTotal, wallet.available).online === '0.00'
                  ? `Pay ${formatMoney(order.grandTotal)} from wallet`
                  : `Pay ${formatMoney(walletSplit(order.grandTotal, wallet.available).online)}`
                : `Pay ${formatMoney(order.grandTotal)}`}
            </>
          )}
        </button>
        <p className="mb-[12px] text-center font-ui text-[13px] text-ink-muted">
          Order <strong className="text-heading">{order.orderNumber}</strong> &middot; items held
          for you
        </p>
      </>
    );
  } else {
    action = (
      <button
        type="button"
        onClick={() => void placeOrder()}
        disabled={phase.step === 'placing'}
        aria-busy={phase.step === 'placing' || undefined}
        className={pill}
      >
        {phase.step === 'placing' ? (
          <>
            <Loader2 aria-hidden="true" className="size-[18px] animate-spin" />
            Placing order&hellip;
          </>
        ) : payment === 'cod' && codAvailable(totals.total) ? (
          'Place order - Cash on Delivery'
        ) : walletOn && wallet && walletSplit(totals.total, wallet.available).online === '0.00' ? (
          'Place order - pay with wallet'
        ) : (
          'Place order'
        )}
      </button>
    );
  }

  if (desk) {
    const deskLines: DeskLine[] = order
      ? order.items.map((item) => ({
          key: item.skuId,
          productId: item.productId,
          title: item.title,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        }))
      : (cart?.items ?? []).map((line) => ({
          key: line.cartItemId,
          productId: line.productId,
          title: line.title,
          quantity: line.quantity,
          unitPrice: line.priceSnapshot,
          lineTotal: line.lineTotal,
        }));
    const itemCount = deskLines.reduce((n, l) => n + l.quantity, 0);
    const freeShip = toPaise(totals.shipping) === 0;
    // No address yet (and under the free-delivery amount): the charge isn't known.
    const feeUnknown = !order && Boolean(cart) && deliveryFee(cart!.subtotal, shipAddress) === null;
    const user = session.status === 'authenticated' ? session.user : null;
    const saved = discount && discount.amount !== '0.00' ? discount : null;
    return (
      <>
        <PlacingOrderModal open={phase.step === 'placing'} steps={placingSteps} />
        <DeskCheckoutSteps paying={Boolean(order)} />
        <div className="grid grid-cols-[minmax(0,1fr)_420px] items-start gap-[28px] pb-[24px] font-ui">
          <div className="flex min-w-0 flex-col gap-[16px]">
            <StepCard id="checkout-account" index={1} title="Account" done={loggedIn}>
              {user ? (
                <div className="flex items-center gap-[12px] rounded-[16px] bg-[#f8faff] px-[14px] py-[12px]">
                  <span className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-brand text-[17px] font-bold text-white">
                    {authUserLabel(user).charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] text-ink-muted">Logged in as</p>
                    <p className="truncate text-[15px] font-bold text-heading">{authUserLabel(user)}</p>
                  </div>
                  {!order && (
                    <LogoutButton className="rounded-full px-[12px] py-[6px] text-[13px] font-semibold text-brand hover:bg-brand-popup-bg">
                      Not you? Log out
                    </LogoutButton>
                  )}
                </div>
              ) : (
                <>
                  <p className={`${BODY_TEXT} mb-[15px]`}>
                    Log in with your mobile number or email to continue - new customers get an account
                    automatically. Your cart is kept.
                  </p>
                  <OtpLoginForm mode="login" returnTo="/checkout" bare />
                </>
              )}
            </StepCard>

            <StepCard
              id="checkout-address"
              index={2}
              title="Deliver to"
              done={Boolean(order) || Boolean(loggedIn && addressId)}
            >
              {order ? (
                <address className="rounded-[16px] border border-brand bg-[#f3f7fe] px-[16px] py-[12px] text-[14.5px] not-italic leading-[1.55] text-ink-body">
                  {addressLines(order.shippingAddress).map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              ) : loggedIn && addresses ? (
                <AddressPicker
                  addresses={addresses}
                  selectedId={addressId}
                  onSelect={(id) => {
                    setChosenId(id);
                    setMessage(null);
                  }}
                  onAdded={async (address) => {
                    await reloadAddresses();
                    setChosenId(address.id);
                    setMessage(null);
                  }}
                />
              ) : loggedIn ? (
                <div aria-busy="true" aria-label="Loading your addresses" className="min-h-[120px]" />
              ) : (
                <p className="text-[14.5px] text-ink-muted">Log in to choose a saved address or add a new one.</p>
              )}
            </StepCard>

            <StepCard id="checkout-payment" index={3} title="Payment method" done={false}>
              <div className="[&>div:first-child]:mt-0 [&>fieldset:first-child]:mt-0 [&>fieldset]:mb-0 [&>fieldset]:mt-[14px]">
                {wallet && loggedIn ? (
                  <WalletOption
                    wallet={wallet}
                    total={totals.total}
                    on={useWallet}
                    onChange={setUseWallet}
                    disabled={busy || Boolean(order)}
                    cod={codChosen}
                  />
                ) : null}
                <PaymentMethods
                  selected={payment === 'cod' && !codAvailable(totals.total) ? 'razorpay' : payment}
                  onSelect={setPayment}
                  disabled={busy}
                  codAllowed={codAvailable(totals.total)}
                />
              </div>
            </StepCard>

            <StepCard
              id="checkout-items"
              index={4}
              title={`Order summary (${itemCount} item${itemCount === 1 ? '' : 's'})`}
              done={false}
              right={
                !order ? (
                  <Link
                    href="/cart"
                    className="rounded-full bg-brand-popup-bg px-[14px] py-[6px] text-[13px] font-bold text-brand hover:bg-brand hover:text-white"
                  >
                    Edit cart
                  </Link>
                ) : null
              }
            >
              {partial && !order ? (
                <p className="mb-[12px] flex items-center gap-[8px] rounded-[12px] bg-brand-popup-bg px-[12px] py-[10px] text-[14px] font-semibold text-brand">
                  <Zap aria-hidden="true" className="size-[16px] shrink-0" />
                  Buying {cart?.items.length === 1 ? 'this item' : `these ${cart?.items.length} items`} only -
                  the rest stay in your cart.
                </p>
              ) : null}
              <DeskItems lines={deskLines} editable={!order && !busy} onQuantity={changeQuantity} />
            </StepCard>
          </div>

          <aside aria-label="Price details" className="sticky top-[16px]">
            <div className={`${DESK_CARD} p-[22px]`}>
              <p className="mb-[14px] text-[12.5px] font-bold uppercase tracking-[1px] text-ink-muted">
                Price details
              </p>
              {couponNote && !order && (
                <p role="status" className="mb-[8px] text-[13px] font-semibold text-woo-error">
                  {couponNote}
                </p>
              )}
              {!order && cart && (
                <CouponBox
                  subtotal={totals.subtotal}
                  cartItemIds={buyIds ? cart.items.map((line) => line.cartItemId) : undefined}
                  applied={coupon}
                  onChange={setCoupon}
                  disabled={busy}
                />
              )}
              <dl className="space-y-[12px] text-[14.5px]">
                <div className="flex justify-between">
                  <dt className="text-ink-body">
                    Price ({itemCount} item{itemCount === 1 ? '' : 's'})
                  </dt>
                  <dd className="font-semibold text-heading">{formatMoney(totals.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-body">Delivery</dt>
                  {feeUnknown ? (
                    <dd className="text-[13px] text-ink-muted">Select an address</dd>
                  ) : (
                    <dd className={freeShip ? 'font-bold text-[#28b463]' : 'font-semibold text-heading'}>
                      {freeShip ? 'FREE' : formatMoney(totals.shipping)}
                    </dd>
                  )}
                </div>
                {saved ? (
                  <div className="flex justify-between">
                    <dt className="text-ink-body">Coupon{saved.code ? ` (${saved.code})` : ''}</dt>
                    <dd className="font-semibold text-[#15803d]">&minus;{formatMoney(saved.amount)}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="mt-[14px] flex items-baseline justify-between border-t border-dashed border-brand-popup-border pt-[14px]">
                <span className="text-[17px] font-bold text-heading">Total amount</span>
                <span className="text-[24px] font-bold text-brand">{formatMoney(totals.total)}</span>
              </div>
              {feeUnknown ? (
                <p className="mt-[4px] text-right text-[12px] text-ink-muted">+ delivery for your address (free over ₹2,000)</p>
              ) : null}
              {saved ? (
                <p className="mt-[12px] flex items-center gap-[8px] rounded-[12px] bg-[#e8f8ee] px-[12px] py-[9px] text-[13.5px] font-bold text-[#15803d]">
                  <Tag aria-hidden="true" className="size-[15px]" /> You save {formatMoney(saved.amount)} on
                  this order
                </p>
              ) : null}
              <div className="mt-[16px]">
                {notice ? <div className="mb-[12px]">{notice}</div> : null}
                {action}
              </div>
              <p className="mt-[4px] text-[12px] leading-[1.5] text-ink-muted">
                Your personal data will be used to process your order and support your experience, as
                described in our{' '}
                <Link href="/privacy-policy" className="font-semibold text-brand hover:underline">
                  privacy policy
                </Link>
                .
              </p>
            </div>
            <DeskTrust />
          </aside>
        </div>
      </>
    );
  }

  return (
    <>
      <PlacingOrderModal open={phase.step === 'placing'} steps={placingSteps} />
      {steps}
      <div className="px-[10px] pb-[32px] font-ui">
        <details className="group mb-[24px] mt-[10px] rounded-[10px] border border-catalog-rule bg-white min-[922px]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-[12px] px-[14px] py-[12px] text-[15px] font-semibold text-brand [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-[6px]">
              <span className="group-open:hidden">Show order summary</span>
              <span className="hidden group-open:inline">Hide order summary</span>
              <ChevronDown
                aria-hidden="true"
                className="size-[16px] transition-transform group-open:rotate-180"
              />
            </span>
            <strong className="font-sans text-[16px] tabular-nums text-black">
              {formatMoney(totals.total)}
            </strong>
          </summary>
          <div className="border-t border-catalog-rule px-[14px] pb-[10px]">
            <OrderReviewTable rows={rows} totals={totals} editable={!order} discount={discount} />
          </div>
        </details>

        <div className="min-[922px]:flex min-[922px]:items-start min-[922px]:justify-between min-[922px]:pt-[25.6px]">
          <div className="mb-[29.2px] min-[922px]:mb-[32px] min-[922px]:w-[55%] min-[922px]:pt-[25.6px]">
            <section aria-labelledby="checkout-account" className="mb-[32px]">
              <SectionTitle id="checkout-account" index={1} done={loggedIn}>
                Account
              </SectionTitle>
              {session.status === 'authenticated' ? (
                <div className={`${BODY_TEXT} flex flex-wrap items-center gap-x-[6px]`}>
                  Logged in as <strong>{authUserLabel(session.user)}</strong>.
                  {!order && <LogoutButton className={TEXT_LINK}>Not you? Log out</LogoutButton>}
                </div>
              ) : (
                <>
                  <p className={`${BODY_TEXT} mb-[15px]`}>
                    Log in with your mobile number or email to continue - new customers get an
                    account automatically. Your cart is kept.
                  </p>
                  <OtpLoginForm mode="login" returnTo="/checkout" bare />
                </>
              )}
            </section>

            <section aria-labelledby="checkout-address">
              <SectionTitle id="checkout-address" index={2} done={Boolean(order)}>
                Delivery address
              </SectionTitle>
              {order ? (
                // The order carries its own address snapshot; it can't change after placing.
                <address
                  className={`${BODY_TEXT} rounded-[10px] border border-brand bg-cart-rowHover px-[14px] py-[12px] not-italic`}
                >
                  {addressLines(order.shippingAddress).map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              ) : loggedIn && addresses ? (
                <AddressPicker
                  addresses={addresses}
                  selectedId={addressId}
                  onSelect={(id) => {
                    setChosenId(id);
                    setMessage(null);
                  }}
                  onAdded={async (address) => {
                    await reloadAddresses();
                    setChosenId(address.id);
                    setMessage(null);
                  }}
                />
              ) : loggedIn ? (
                <div
                  aria-busy="true"
                  aria-label="Loading your addresses"
                  className="min-h-[120px]"
                />
              ) : (
                <p className={`${BODY_TEXT} text-ink-muted`}>
                  Log in to choose a saved address or add a new one.
                </p>
              )}
            </section>
          </div>

          <div className="min-[922px]:w-[40%]">
            <OrderPanel>
              {partial && !order ? (
                <p className="mb-[14px] flex items-center gap-[8px] rounded-[10px] bg-cart-headBg px-[12px] py-[10px] text-[14px] font-semibold text-brand">
                  <Zap aria-hidden="true" className="size-[16px] shrink-0" />
                  Buying{' '}
                  {cart?.items.length === 1
                    ? 'this item'
                    : `these ${cart?.items.length} items`}{' '}
                  only - the rest stay in your cart.
                </p>
              ) : null}
              <OrderReviewTable
                rows={rows}
                totals={totals}
                editable={!order && !busy}
                discount={discount}
                onQuantity={changeQuantity}
              />
              {couponNote && !order && (
                <p role="status" className="mb-[8px] mt-[10px] text-[13px] font-semibold text-woo-error">
                  {couponNote}
                </p>
              )}
              {!order && cart && (
                <CouponBox
                  subtotal={totals.subtotal}
                  cartItemIds={buyIds ? cart.items.map((line) => line.cartItemId) : undefined}
                  applied={coupon}
                  onChange={setCoupon}
                  disabled={busy}
                />
              )}
              {wallet && loggedIn ? (
                <WalletOption
                  wallet={wallet}
                  total={totals.total}
                  on={useWallet}
                  onChange={setUseWallet}
                  disabled={busy || Boolean(order)}
                  cod={codChosen}
                />
              ) : null}
              <PaymentMethods
                selected={payment === 'cod' && !codAvailable(totals.total) ? 'razorpay' : payment}
                onSelect={setPayment}
                disabled={busy}
                codAllowed={codAvailable(totals.total)}
              />
              <p className="mb-[25.6px] text-[14.6px] leading-[1.6] text-ink-body lg:text-[16px]">
                Your personal data will be used to process your order, support your experience
                throughout this website, and for other purposes described in our{' '}
                <Link href="/privacy-policy" className={TEXT_LINK}>
                  privacy policy
                </Link>
                .
              </p>
              {notice}
              {action}
            </OrderPanel>
          </div>
        </div>
      </div>
    </>
  );
}
