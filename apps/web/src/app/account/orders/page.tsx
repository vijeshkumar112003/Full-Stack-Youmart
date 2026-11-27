import type { Metadata } from 'next';
import { AccountShell } from '@/components/account/AccountShell';
import { DeskOrders } from '@/components/account/DeskOrders';
import { AppOrders } from '@/components/account/AppOrders';
import { RequireAuth } from '@/components/account/RequireAuth';

export const metadata: Metadata = { title: 'Orders - You Mart' };

export default function OrdersPage() {
  return (
    <RequireAuth>
      <AccountShell active="orders">
        <h1 className="sr-only lg:hidden">Orders</h1>
        <div className="lg:hidden">
          <AppOrders />
        </div>
        <div className="hidden lg:block">
          <DeskOrders />
        </div>
      </AccountShell>
    </RequireAuth>
  );
}
