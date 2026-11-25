// Phone pages (below 1025px) that the app opens as their own screen: they get the app's inner
// header (back + title) instead of the shop header. Account pages draw their own (AccountShell).

const TITLES: [RegExp, string][] = [
  [/^\/track-order\/?$/, 'Track an order'],
  [/^\/about\/?$/, 'About YouMart'],
  [/^\/contact\/?$/, 'Contact us'],
  [/^\/customer-care\/?$/, 'Customer care'],
  [/^\/faq\/?$/, 'FAQ'],
  [/^\/shipping\/?$/, 'Shipping details'],
  [/^\/refund-policy\/?$/, 'Refund policy'],
  [/^\/terms\/?$/, 'Terms & conditions'],
  [/^\/privacy-policy\/?$/, 'Privacy policy'],
  [/^\/order-notifications\/?$/, 'Notification settings'],
  [/^\/cancel-order\/?$/, 'Cancel an order'],
  [/^\/offers\/?$/, 'Offers'],
  [/^\/checkout\/?$/, 'Checkout'],
  [/^\/sell\/?$/, 'Sell on YouMart'],
  [/^\/youfind\/?$/, 'YouFind Bot'],
  [/^\/lens\/?$/, 'Search by photo'],
  [/^\/ask\/yumo\/?$/, 'Yumo'],
];

/** Pages with their own full-screen design (no shop header, no generic title bar). */
const OWN_HEADER = [/^\/product\//, /^\/account(\/|$)/, /^\/ask\/?$/, /^\/scan\/?$/, /^\/qr-login\/?$/];

export function phoneScreenTitle(pathname: string): string | null {
  return TITLES.find(([re]) => re.test(pathname))?.[1] ?? null;
}

/** True when the shop header should be hidden on phones for this page. */
export function hidesShopHeader(pathname: string): boolean {
  return OWN_HEADER.some((re) => re.test(pathname)) || phoneScreenTitle(pathname) !== null;
}
