'use client';

import { useState } from 'react';
import { BRAND_DOMAINS } from '@youmart/shared-client/src/brand-domains.data';
import { bundledBrandLogo } from '@/lib/brand-logo-files';

// A brand's logo in a "Shop by Brand" tile - same order as the app's BrandLogo: a bundled logo
// (public/brand-logos), else Brandfetch's wordmark, then its square icon, then a styled name.

const CLIENT_ID = process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID ?? '';
const TONES = ['#0142aa', '#7c3aed', '#047857', '#c2410c', '#be123c', '#0e7490', '#4d7c0f', '#6d28d9'];

function tone(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length]!;
}

function remote(name: string, type: 'logo' | 'icon'): string | null {
  const domain = BRAND_DOMAINS[name.trim().toLowerCase()];
  if (!domain || !CLIENT_ID) return null;
  return `https://cdn.brandfetch.io/domain/${domain}/w/300/h/120/fallback/404/type/${type}?c=${encodeURIComponent(CLIENT_ID)}`;
}

export function BrandLogo({ name }: { name: string }) {
  const bundled = bundledBrandLogo(name);
  const [stage, setStage] = useState(0);
  const src = bundled ?? (stage === 0 ? remote(name, 'logo') : stage === 1 ? remote(name, 'icon') : null);

  if (!src) {
    return (
      <span className="line-clamp-2 px-[6px] text-center font-ui text-[13px] font-bold leading-[15px]" style={{ color: tone(name) }}>
        {name}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote logo CDN; sizes vary per brand
    <img
      src={src}
      alt={`${name} logo`}
      loading="lazy"
      onError={() => setStage((s) => s + 1)}
      className="max-h-[48px] max-w-[calc(100%-22px)] object-contain"
    />
  );
}
