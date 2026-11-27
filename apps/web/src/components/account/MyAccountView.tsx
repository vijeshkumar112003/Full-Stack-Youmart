'use client';

import { useEffect } from 'react';
import { LogIn, PackageSearch, UserPlus, UserRound, Wallet, Zap } from 'lucide-react';
import { reloadUser, useSession } from '@/lib/session';
import { AccountShell } from './AccountShell';
import { DeskAccount } from './DeskAccount';
import { AppAccount } from './AppAccount';
import { AppSignIn } from './AppSignIn';
import { LoginMethods } from './LoginMethods';
import { RegisterMethods } from './RegisterMethods';

const HEADING = 'font-ui text-[22px] font-bold leading-[1.25] text-heading';

/** /account is the login page when signed out (as on live) and the dashboard when signed in. */
export function MyAccountView({ returnTo }: { returnTo?: string }) {
  const session = useSession();
  if (session.status === 'loading') {
    return <div aria-busy="true" className="min-h-[480px]" />;
  }
  // Phones / tablets: the app's Account tab; "Sign in" (any returnTo) opens the app's sign-in.
  const phone =
    session.status === 'anonymous' && returnTo ? <AppSignIn returnTo={returnTo} /> : <AppAccount />;
  return (
    <>
      <div className="lg:hidden">{phone}</div>
      <div className="hidden lg:block">
        {session.status === 'anonymous' ? (
          <LoginView returnTo={returnTo} />
        ) : (
          <Dashboard />
        )}
      </div>
    </>
  );
}

function Dashboard() {
  useEffect(() => {
    // Real authenticated read (GET /api/auth/me): refreshes the profile and exercises the
    // expired-token path (401 -> silent refresh -> retry).
    void reloadUser().catch(() => undefined);
  }, []);

  return (
    <AccountShell active="dashboard">
      <DeskAccount />
    </AccountShell>
  );
}

// Logged-out /account on desktop: a welcome band, then Login and Register side by side as cards.
function LoginView({ returnTo }: { returnTo?: string }) {
  return (
    <div className="mx-auto max-w-[1240px] px-[20px] pt-[10px] font-ui lg:mb-[64px] lg:mt-[32px] lg:pt-0">
      <h1 className="sr-only">My account</h1>
      <section className="relative mb-[22px] overflow-hidden rounded-[28px] bg-[linear-gradient(125deg,#0142aa_0%,#1d5fd1_55%,#3b82f6_100%)] px-[32px] py-[26px] text-white shadow-[0_18px_40px_rgba(1,66,170,0.25)]">
        <span aria-hidden="true" className="absolute -right-[60px] -top-[80px] size-[240px] rounded-full bg-white/10" />
        <div className="relative flex items-center gap-[24px]">
          <span className="flex size-[64px] shrink-0 items-center justify-center rounded-[20px] bg-white/15">
            <UserRound aria-hidden="true" className="size-[32px]" />
          </span>
          <div className="flex-1">
            <p className="text-[28px] font-bold leading-[1.2]">Welcome to YouMart</p>
            <p className="mt-[2px] text-[15px] text-white/85">Sign in for order tracking, instant wallet refunds and faster checkout.</p>
          </div>
          <ul className="flex gap-[10px]">
            {[
              { Icon: PackageSearch, text: 'Track orders' },
              { Icon: Wallet, text: 'Instant refunds' },
              { Icon: Zap, text: 'Faster checkout' },
            ].map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-[8px] rounded-full bg-white/15 px-[14px] py-[8px] text-[13.5px] font-semibold">
                <Icon aria-hidden="true" className="size-[16px] text-[#ffd60a]" /> {text}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <div className="min-[922px]:flex min-[922px]:items-start min-[922px]:justify-between min-[922px]:gap-[22px]">
        {[
          { id: 'login', title: 'Login', sub: 'Welcome back - use your mobile number, email or username.', Icon: LogIn, body: <LoginMethods returnTo={returnTo} /> },
          { id: 'register', title: 'Register', sub: 'New here? Create your account in under a minute.', Icon: UserPlus, body: <RegisterMethods returnTo={returnTo} /> },
        ].map(({ id, title, sub, Icon, body }) => (
          <section
            key={id}
            aria-labelledby={`${id}-heading`}
            className="mb-[20px] rounded-[24px] border border-brand-popup-border bg-white p-[28px] shadow-rail-card min-[922px]:w-1/2"
          >
            <div className="mb-[8px] flex items-center gap-[14px]">
              <span className="flex size-[48px] items-center justify-center rounded-[16px] bg-[linear-gradient(140deg,#0142aa,#3b82f6)] text-white">
                <Icon aria-hidden="true" className="size-[22px]" />
              </span>
              <div>
                <h2 id={`${id}-heading`} className={HEADING}>
                  {title}
                </h2>
                <p className="text-[13.5px] text-ink-muted">{sub}</p>
              </div>
            </div>
            {body}
          </section>
        ))}
      </div>
    </div>
  );
}
