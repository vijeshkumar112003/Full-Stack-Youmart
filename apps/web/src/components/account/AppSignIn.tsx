'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Gift, KeyRound, Lock, MessageSquareMore, UserPlus } from 'lucide-react';
import { ROUTES } from '@youmart/shared-client';
import { OtpLoginForm } from './OtpLoginForm';
import { PasswordLoginForm, UsernameRegisterForm } from './PasswordAuthForms';

// The app's Sign-in screen (apps/mobile/src/app/auth/login.tsx) for phones: lock badge, "Welcome to
// YouMart", OTP | Username switch, the referral hint and "Create an account with a username".

type Mode = 'otp' | 'username' | 'register';

export function AppSignIn({ returnTo }: { returnTo?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('otp');
  const tab = (value: Exclude<Mode, 'register'>, label: string, Icon: typeof Lock) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === value}
      onClick={() => setMode(value)}
      className={`flex h-[46px] flex-1 items-center justify-center gap-[8px] rounded-[12px] font-ui text-[16px] font-semibold transition-colors ${
        mode === value ? 'bg-brand text-white' : 'text-[#334155]'
      }`}
    >
      <Icon aria-hidden="true" className="size-[18px]" /> {label}
    </button>
  );

  return (
    <div className="px-[20px] pb-[32px]">
      <div className="relative flex h-[60px] items-center justify-center">
        <button type="button" onClick={() => router.back()} aria-label="Back" className="absolute left-0 flex size-[44px] items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(15,23,42,0.12)]">
          <ChevronLeft aria-hidden="true" className="size-[22px]" />
        </button>
        <h1 className="font-ui text-[17px] font-bold text-heading">{mode === 'register' ? 'Create account' : 'Sign in'}</h1>
      </div>

      <div className="mt-[18px] flex flex-col items-center text-center">
        <span className="flex size-[64px] items-center justify-center rounded-full bg-brand">
          <Lock aria-hidden="true" className="size-[26px] fill-white text-white" />
        </span>
        <p className="mt-[16px] font-ui text-[24px] font-bold text-heading">Welcome to YouMart</p>
        <p className="mt-[4px] text-[15px] leading-[21px] text-[#475569]">
          {mode === 'register' ? 'Pick a username and password for your account.' : 'Log in or sign up with your mobile number or email.'}
        </p>
      </div>

      {mode === 'register' ? (
        <div className="mt-[20px] [&_button[type=submit]]:!h-[52px] [&_button[type=submit]]:!w-full [&_button[type=submit]]:!rounded-[14px] [&_button[type=submit]]:!normal-case [&_form]:!border-0 [&_form]:!bg-transparent [&_form]:!p-0 [&_input]:!h-[52px] [&_input]:!rounded-[14px]">
          <UsernameRegisterForm returnTo={returnTo} />
          <button type="button" onClick={() => setMode('otp')} className="mt-[16px] w-full text-center font-ui text-[15px] font-semibold text-brand">
            Use mobile number or email instead
          </button>
        </div>
      ) : (
        <>
          <div role="tablist" aria-label="Sign-in method" className="mt-[22px] flex gap-[4px] rounded-[16px] bg-[#e8eef8] p-[4px]">
            {tab('otp', 'OTP', MessageSquareMore)}
            {tab('username', 'Username', KeyRound)}
          </div>
          <div className="mt-[16px] [&_button[type=submit]]:!h-[52px] [&_button[type=submit]]:!w-full [&_button[type=submit]]:!rounded-[14px] [&_button[type=submit]]:!text-[17px] [&_button[type=submit]]:!normal-case [&_form]:!border-0 [&_form]:!bg-transparent [&_form]:!p-0 [&_input]:!h-[52px] [&_input]:!rounded-[14px] [&_input]:!border-[1.5px] [&_input]:!border-brand-accent">
            {mode === 'otp' ? (
              <OtpLoginForm mode="login" returnTo={returnTo} bare />
            ) : (
              <PasswordLoginForm returnTo={returnTo} onUseOtp={() => setMode('otp')} />
            )}
          </div>
          <Link href={ROUTES.refer} className="mt-[14px] flex items-center gap-[8px] font-ui text-[15px] font-semibold text-brand">
            <Gift aria-hidden="true" className="size-[18px]" /> Have a friend&apos;s referral code?
          </Link>
          <div className="my-[20px] flex items-center gap-[12px] text-[14px] text-[#64748b]">
            <span className="h-px flex-1 bg-[#d5deeb]" /> or <span className="h-px flex-1 bg-[#d5deeb]" />
          </div>
          <button
            type="button"
            onClick={() => setMode('register')}
            className="flex h-[52px] w-full items-center justify-center gap-[8px] rounded-[14px] border-2 border-brand bg-white font-ui text-[16px] font-bold text-brand"
          >
            <UserPlus aria-hidden="true" className="size-[20px]" /> Create an account with a username
          </button>
        </>
      )}
    </div>
  );
}
