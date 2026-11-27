import Link from 'next/link';
import {
  ChevronLeft,
  AlarmClock,
  Bell,
  Megaphone,
  Gift,
  Clock,
  Heart,
  House,
  LifeBuoy,
  LogOut,
  MapPin,
  MonitorSmartphone,
  RotateCcw,
  ShieldCheck,
  ShoppingBasket,
  Star,
  TicketPercent,
  Truck,
  UserRound,
  Wallet,
} from 'lucide-react';
import { ACCOUNT_NAV, ROUTES, type AccountNavGroup, type AccountSection } from '@youmart/shared-client';
import { LogoutButton } from './LogoutButton';

const ICONS: Record<AccountSection, typeof House> = {
  dashboard: House,
  orders: ShoppingBasket,
  returns: RotateCcw,
  track: Truck,
  addresses: MapPin,
  account: UserRound,
  wishlist: Heart,
  recent: Clock,
  reviews: Star,
  wallet: Wallet,
  coupons: TicketPercent,
  notifications: Bell,
  devices: MonitorSmartphone,
  privacy: ShieldCheck,
  help: LifeBuoy,
  refer: Gift,
  reminders: AlarmClock,
  ads: Megaphone,
  logout: LogOut,
};

const GROUPS: AccountNavGroup[] = ['Shopping', 'Money', 'Account', 'Support'];

interface AccountShellProps {
  active: AccountSection;
  children: React.ReactNode;
  /** Phone screen title (defaults to the menu label) and where its back button goes. */
  title?: string;
  backHref?: string;
}

const LINK =
  'group flex w-full items-center rounded-[12px] px-[12px] py-[9px] font-ui text-[14.5px] font-medium leading-[22px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand';

// Desktop account layout: a sticky side menu grouped by what it's for (Shopping, Money, Account,
// Support) as a 27% column from 922px, stacked full-width above the content below it.
export function AccountShell({ active, children, title, backHref = ROUTES.account }: AccountShellProps) {
  const label = title ?? ACCOUNT_NAV.find((item) => item.key === active)?.label ?? 'My account';
  return (
    <>
    {/* Phones / tablets: the app's inner-screen header (back + title); no side menu. */}
    <div className="sticky top-0 z-30 flex h-[60px] items-center justify-center bg-page/95 px-[16px] backdrop-blur lg:hidden">
      <Link
        href={backHref}
        aria-label="Back"
        className="absolute left-[16px] flex size-[44px] items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(15,23,42,0.12)]"
      >
        <ChevronLeft aria-hidden="true" className="size-[22px] text-heading" />
      </Link>
      <h1 className="max-w-[calc(100%-120px)] truncate font-ui text-[17px] font-bold text-heading">{label}</h1>
    </div>
    <div className="mx-auto max-w-[1240px] px-[16px] pb-[24px] pt-[8px] lg:flex lg:max-w-[1440px] lg:items-start lg:gap-[28px] lg:px-[32px] lg:pb-[48px] lg:pt-[28px]">
      <nav
        aria-label="Account pages"
        className="mb-[20px] hidden max-h-[calc(100vh-32px)] overflow-y-auto rounded-[24px] border border-brand-popup-border bg-white p-[12px] shadow-rail-card [scrollbar-width:thin] lg:sticky lg:top-[16px] lg:block lg:w-[280px] lg:shrink-0"
      >
        {GROUPS.map((group) => (
          <div key={group} className="mb-[6px] border-b border-catalog-rule pb-[8px] last:mb-0 last:border-0 last:pb-0">
            <p className="px-[12px] pb-[4px] pt-[8px] font-ui text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
              {group}
            </p>
            <ul>
              {ACCOUNT_NAV.filter((item) => item.group === group).map((item) => {
                const Icon = ICONS[item.key];
                const current = item.key === active;
                const tone = current
                  ? 'bg-brand font-semibold text-white shadow-[0_6px_12px_rgba(1,66,170,0.3)]'
                  : 'text-heading hover:bg-brand-popup-bg hover:text-brand';
                const icon = (
                  <Icon
                    aria-hidden="true"
                    className={`mr-[10px] size-[17px] shrink-0 ${current ? '' : 'text-ink-muted group-hover:text-brand'}`}
                  />
                );
                return (
                  <li key={item.key} className="mb-[2px] last:mb-0">
                    {item.key === 'logout' ? (
                      <LogoutButton className={`${LINK} ${tone}`}>
                        {icon}
                        {item.label}
                      </LogoutButton>
                    ) : (
                      <Link
                        href={item.href}
                        aria-current={current ? 'page' : undefined}
                        className={`${LINK} ${tone}`}
                      >
                        {icon}
                        {item.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="ym-account min-w-0 lg:flex-1">{children}</div>
    </div>
    </>
  );
}
