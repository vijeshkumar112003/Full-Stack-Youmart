'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  CircleCheck,
  Clock,
  CornerDownRight,
  Globe,
  Lock,
  PencilLine,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { FinderMessage } from '@youmart/shared-client';
import { api } from '@/lib/api';

// The app's Ask hub (apps/mobile/src/app/ask/index.tsx): Yumo (private AI chat) and the YouFind
// Bot live room, with the room's latest questions.

const HERO = 'linear-gradient(160deg,#071530 0%,#0b2a6f 60%,#0142aa 100%)';
const YUMO_BG = 'linear-gradient(150deg,#1e1b4b 0%,#3b0f78 55%,#6d28d9 100%)';
const YUMO_INK = '#2e1065';
const ROOM = '#047857';
const STARTERS = ['Track my order', 'Gift ideas under ₹500', 'How do returns work?'];
const STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: PencilLine, title: 'Ask', text: 'Type any product name' },
  { icon: Zap, title: 'Bot searches', text: 'Replies in seconds' },
  { icon: ShoppingBag, title: 'Get it', text: 'Or request a restock' },
];

function AiOrb({ size }: { size: number }) {
  return (
    <span
      aria-hidden="true"
      className="relative flex shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#a5b4fc_0%,#8b5cf6_45%,#d946ef_100%)] font-ui font-bold italic text-white shadow-[0_6px_16px_rgba(109,40,217,0.45)]"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      <span className="absolute inset-[18%] rotate-[-25deg] rounded-[50%] border-2 border-white/70" />
      AI
      <span className="absolute right-[18%] top-[14%] size-[16%] rounded-full bg-white/80" />
    </span>
  );
}

function Initial({ name }: { name: string }) {
  return (
    <span className="flex size-[28px] shrink-0 items-center justify-center rounded-full bg-[#dbeafe] font-ui text-[12px] font-bold text-brand">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function AskHub() {
  const router = useRouter();
  const [today, setToday] = useState<number | null>(null);
  const [recent, setRecent] = useState<FinderMessage[]>([]);

  useEffect(() => {
    let live = true;
    api.support.finder
      .list({ limit: 3 })
      .then((feed) => {
        if (!live) return;
        setToday(feed.todayCount);
        setRecent([...feed.items].reverse());
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="pb-[24px]">
      <section style={{ backgroundImage: HERO }} className="relative overflow-hidden rounded-b-[28px] px-[16px] pb-[24px] pt-[16px] text-white">
        <span aria-hidden="true" className="absolute -right-[80px] -top-[60px] size-[260px] rounded-full bg-white/[0.07]" />
        <span aria-hidden="true" className="absolute -bottom-[90px] -left-[60px] size-[200px] rounded-full bg-[#1d4ed8]/30" />
        <button type="button" onClick={() => router.back()} aria-label="Back" className="relative flex size-[40px] items-center justify-center rounded-full bg-white/15 lg:hidden">
          <ChevronLeft aria-hidden="true" className="size-[22px]" />
        </button>
        <div className="relative mx-auto max-w-[760px]">
          <p className="mt-[16px] font-ui text-[12px] font-bold tracking-[2px] text-[#93c5fd]">ASK YOUMART</p>
          <h1 className="mt-[4px] font-ui text-[26px] font-bold leading-[32px]">Two ways to get answers</h1>
          <p className="mt-[6px] text-[14px] leading-[20px] text-white/80">
            Chat privately with Yumo, or ask the live room if we have it.
          </p>
          <div className="mt-[16px] grid grid-cols-2 gap-[10px]">
            <Link href="/ask/yumo" className="flex items-center gap-[10px] rounded-[16px] bg-[#f5f3ff] p-[10px]">
              <AiOrb size={34} />
              <span>
                <span className="block font-ui text-[15px] font-bold" style={{ color: YUMO_INK }}>Yumo</span>
                <span className="block font-ui text-[12px] font-medium text-[#6d28d9]">Private AI chat</span>
              </span>
            </Link>
            <Link href="/youfind" className="flex items-center gap-[10px] rounded-[16px] bg-[#ecfdf5] p-[10px]">
              <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-[linear-gradient(120deg,#047857_0%,#10b981_100%)]">
                <Users aria-hidden="true" className="size-[16px] text-white" />
              </span>
              <span>
                <span className="block font-ui text-[15px] font-bold text-[#064e3b]">YouFind Bot</span>
                <span className="block font-ui text-[12px] font-medium" style={{ color: ROOM }}>Live room</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[760px] px-[16px]">
        <p className="mt-[20px] flex items-center gap-[6px] font-ui text-[12px] font-bold tracking-[1.2px] text-[#6d28d9]">
          <Lock aria-hidden="true" className="size-[12px]" /> JUST YOU · AI ASSISTANT
        </p>
        <section style={{ backgroundImage: YUMO_BG }} className="relative mt-[10px] overflow-hidden rounded-[24px] p-[18px] text-white">
          <span aria-hidden="true" className="absolute -right-[40px] -top-[40px] size-[160px] rounded-full bg-[#c026d3]/30" />
          <div className="relative flex items-center gap-[12px]">
            <AiOrb size={58} />
            <div>
              <p className="font-ui text-[22px] font-bold">Yumo</p>
              <p className="text-[13px] text-white/80">Your personal shopping assistant</p>
            </div>
          </div>
          <p className="relative mt-[14px] max-w-[300px] rounded-[16px] border border-white/20 bg-white/10 px-[14px] py-[10px] text-[14px] leading-[20px]">
            Hi! I can find products, track your orders and sort out returns. What do you need today?
          </p>
          <p className="relative mt-[14px] text-right font-ui text-[11px] font-bold tracking-[1.2px] text-white/70">TAP TO ASK</p>
          <div className="relative mt-[8px] flex flex-wrap justify-end gap-[8px]">
            {STARTERS.map((q) => (
              <Link key={q} href={`/ask/yumo?q=${encodeURIComponent(q)}`} className="rounded-[14px] bg-white px-[12px] py-[7px] font-ui text-[13px] font-semibold" style={{ color: YUMO_INK }}>
                {q}
              </Link>
            ))}
          </div>
          <Link href="/ask/yumo" className="relative mt-[16px] flex h-[46px] items-center justify-center gap-[8px] rounded-[14px] bg-white font-ui text-[15px] font-bold" style={{ color: YUMO_INK }}>
            <Sparkles aria-hidden="true" className="size-[16px]" /> Chat with Yumo
          </Link>
          <p className="relative mt-[8px] text-center font-ui text-[11.5px] text-white/70">Only you see this chat</p>
        </section>

        <p className="mt-[24px] flex items-center gap-[6px] font-ui text-[12px] font-bold tracking-[1.2px]" style={{ color: ROOM }}>
          <Globe aria-hidden="true" className="size-[12px]" /> EVERYONE · LIVE ROOM
        </p>
        <section className="mt-[10px] rounded-[24px] border-2 border-[#a7f3d0] bg-white p-[16px]">
          <div className="flex items-start gap-[12px]">
            <span className="flex size-[46px] shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(120deg,#047857_0%,#10b981_100%)]">
              <Search aria-hidden="true" className="size-[22px] text-white" />
            </span>
            <div className="flex-1">
              <p className="font-ui text-[18px] font-bold text-[#064e3b]">YouFind Bot</p>
              <p className="text-[13px] leading-[18px] text-ink-muted">Ask for any product - the bot answers in the room</p>
            </div>
            <span className="flex items-center gap-[5px] rounded-full bg-[#ecfdf5] px-[10px] py-[4px] font-ui text-[11px] font-bold tracking-[1px]" style={{ color: ROOM }}>
              <span className="size-[7px] animate-pulse rounded-full bg-[#10b981]" /> LIVE
            </span>
          </div>
          {today !== null ? (
            <p className="mt-[12px] flex items-center gap-[8px] rounded-[14px] bg-[#ecfdf5] px-[12px] py-[10px] font-ui text-[13.5px] font-semibold" style={{ color: ROOM }}>
              <Users aria-hidden="true" className="size-[16px]" /> {today} question{today === 1 ? '' : 's'} asked today
            </p>
          ) : null}
          {recent.length > 0 ? (
            <ul className="mt-[12px] flex flex-col gap-[10px]">
              {recent.map((m) => (
                <li key={m.id} className="flex gap-[10px]">
                  <Initial name={m.mine ? 'You' : m.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] text-ink-body">
                      <span className="font-ui font-bold text-heading">{m.mine ? 'You' : m.name}</span> &ldquo;{m.text}&rdquo;
                    </p>
                    <p className="mt-[4px] flex items-center gap-[6px]">
                      <CornerDownRight aria-hidden="true" className="size-[12px] text-[#94a3b8]" />
                      <span
                        className={`flex items-center gap-[4px] rounded-full px-[8px] py-[2px] font-ui text-[11.5px] font-bold ${m.result === 'FOUND' ? 'bg-[#d1fae5]' : 'bg-[#fef3c7]'}`}
                        style={{ color: m.result === 'FOUND' ? ROOM : '#b45309' }}
                      >
                        {m.result === 'FOUND' ? <CircleCheck aria-hidden="true" className="size-[11px]" /> : <Clock aria-hidden="true" className="size-[11px]" />}
                        {m.result === 'FOUND' ? `Bot found ${m.found} ${m.found === 1 ? 'match' : 'matches'}` : 'Restock requested'}
                      </span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          <Link href="/youfind" className="mt-[14px] flex h-[48px] items-center justify-between rounded-full border-2 border-[#a7f3d0] bg-[#f6fefb] pl-[16px] pr-[4px]">
            <span className="text-[14px] text-ink-muted">Which product are you looking for?</span>
            <span className="flex size-[38px] items-center justify-center rounded-full bg-[linear-gradient(120deg,#047857_0%,#10b981_100%)]">
              <Send aria-hidden="true" className="size-[15px] text-white" />
            </span>
          </Link>
        </section>

        <div className="mt-[14px] grid grid-cols-3 gap-[8px]">
          {STEPS.map((st, i) => (
            <div key={st.title} className="relative flex flex-col items-center gap-[4px] rounded-[18px] border border-[#d1fae5] bg-white px-[6px] pb-[12px] pt-[14px] text-center">
              <span className="absolute -top-[9px] right-[10px] flex size-[22px] items-center justify-center rounded-full font-ui text-[12px] font-bold text-white" style={{ background: ROOM }}>
                {i + 1}
              </span>
              <span className="flex size-[40px] items-center justify-center rounded-[12px] bg-[#ecfdf5]">
                <st.icon aria-hidden="true" className="size-[19px]" style={{ color: ROOM }} />
              </span>
              <span className="font-ui text-[14px] font-bold text-heading">{st.title}</span>
              <span className="text-[11.5px] leading-[15px] text-ink-muted">{st.text}</span>
            </div>
          ))}
        </div>
        <p className="mt-[14px] flex items-start gap-[8px] rounded-[14px] bg-[#ecfdf5] p-[12px] text-[12.5px] leading-[18px] text-[#065f46]">
          <ShieldCheck aria-hidden="true" className="mt-[1px] size-[18px] shrink-0" style={{ color: ROOM }} />
          Safe by design: only product names are allowed in the live room, shoppers can&apos;t message each other, and only your first name is shown.
        </p>
      </div>
    </div>
  );
}
