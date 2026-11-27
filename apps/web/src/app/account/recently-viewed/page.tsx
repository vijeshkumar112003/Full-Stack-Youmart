import type { Metadata } from 'next';
import { AccountShell } from '@/components/account/AccountShell';
import { RecentlyViewedView } from '@/components/account/RecentlyViewedView';

export const metadata: Metadata = { title: 'Recently viewed - You Mart' };

// Guests have a (this-browser) history too, so this page doesn't require signing in.
export default function RecentlyViewedPage() {
  return (
    <AccountShell active="recent">
      <RecentlyViewedView />
    </AccountShell>
  );
}
