import type { Metadata } from 'next';
import { AccountShell } from '@/components/account/AccountShell';
import { LoginSecurityPanel, ProfileCard } from '@/components/account/AccountExtras';
import { EditAccountForm } from '@/components/account/EditAccountForm';
import { RequireAuth } from '@/components/account/RequireAuth';
import { PageHeader, Panel } from '@/components/account/ui';
import { UserRound } from 'lucide-react';

export const metadata: Metadata = { title: 'Account details - You Mart' };

export default function EditAccountPage() {
  return (
    <RequireAuth>
      <AccountShell active="account">
        <PageHeader title="Account details" icon={UserRound} subtitle="Your profile, contact details and how you sign in." />
        <ProfileCard />
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-[20px]">
          <Panel title="Personal details">
            <EditAccountForm />
          </Panel>
          <LoginSecurityPanel />
        </div>
      </AccountShell>
    </RequireAuth>
  );
}
