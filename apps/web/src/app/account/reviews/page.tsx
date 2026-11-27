import type { Metadata } from 'next';
import { AccountShell } from '@/components/account/AccountShell';
import { MyReviewsView } from '@/components/account/MyReviewsView';
import { RequireAuth } from '@/components/account/RequireAuth';

export const metadata: Metadata = { title: 'My reviews - You Mart' };

export default function MyReviewsPage() {
  return (
    <RequireAuth>
      <AccountShell active="reviews">
        <MyReviewsView />
      </AccountShell>
    </RequireAuth>
  );
}
