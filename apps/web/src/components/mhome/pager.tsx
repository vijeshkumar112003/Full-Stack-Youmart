'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Phone home (below 1025px): the app's swipeable rows built on CSS scroll-snap - native swipe, no
// library. `usePager` tracks which page is in view and can scroll to one (dots, arrows, autoplay).

export function usePager(count: number, opts: { autoMs?: number } = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const touching = useRef(false);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const step = first ? first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0') : el.clientWidth;
    if (step > 0) setIndex(Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / step))));
  }, [count]);

  const goTo = useCallback((i: number) => {
    const el = ref.current;
    const child = el?.children[i] as HTMLElement | undefined;
    if (!el || !child) return;
    el.scrollTo({ left: child.offsetLeft - el.offsetLeft - parseFloat(getComputedStyle(el).paddingLeft || '0'), behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!opts.autoMs || count < 2) return;
    const t = setInterval(() => {
      if (touching.current || document.hidden) return;
      goTo((index + 1) % count);
    }, opts.autoMs);
    return () => clearInterval(t);
  }, [opts.autoMs, count, index, goTo]);

  const bind = {
    ref,
    onScroll,
    onPointerDown: () => (touching.current = true),
    onPointerUp: () => (touching.current = false),
    onTouchStart: () => (touching.current = true),
    onTouchEnd: () => (touching.current = false),
  };
  return { bind, index, goTo };
}

/** Scroll-snap row classes: horizontal, swipeable, no scrollbar. */
export const SNAP_ROW =
  'flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export function Dots({
  count,
  index,
  onPick,
  className = '',
}: {
  count: number;
  index: number;
  onPick?: (i: number) => void;
  className?: string;
}) {
  if (count < 2) return null;
  return (
    <div className={`flex items-center justify-center gap-[6px] ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to slide ${i + 1}`}
          onClick={() => onPick?.(i)}
          className={`h-[7px] rounded-full transition-all duration-300 ${
            i === index ? 'w-[18px] bg-brand' : 'w-[7px] bg-card-border'
          }`}
        />
      ))}
    </div>
  );
}

/** The app's section heading: a blue accent bar + title (+ optional subtitle). */
export function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-[10px] px-[16px]">
      <span aria-hidden="true" className={`w-[4px] shrink-0 rounded-[2px] bg-brand ${sub ? 'h-[34px]' : 'h-[18px]'}`} />
      <div>
        <h2 className="font-ui text-[17px] font-bold text-heading">{title}</h2>
        {sub ? <p className="text-[12.5px] text-ink-muted">{sub}</p> : null}
      </div>
    </div>
  );
}
