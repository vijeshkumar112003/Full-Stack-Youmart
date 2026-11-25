'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CameraOff, CircleCheck, Laptop, Loader2, QrCode, X } from 'lucide-react';
import { ApiError, loginHref, type QrLoginRequest } from '@youmart/shared-client';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';

// The app's QR Login (apps/mobile/src/app/scan.tsx) in the phone browser: point the camera at the
// sign-in QR on youmart.in on a computer, confirm, and that computer is signed in. YouMart product
// / category QR codes open their page. Uses the browser's BarcodeDetector (Chrome / Edge on
// Android); where it is missing the page says how to scan with the phone's camera app instead.

const PENDING_KEY = 'ym.pendingQr';

type Sheet =
  | { kind: 'none' }
  | { kind: 'loading' }
  | { kind: 'confirm'; qr: string; request: QrLoginRequest }
  | { kind: 'done'; device: string }
  | { kind: 'error'; message: string };

interface Detector {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
}

function classify(data: string): { type: 'login' } | { type: 'link'; path: string } | { type: 'other' } {
  try {
    const url = new URL(data.trim());
    if (!/(^|\.)youmart\.in$/i.test(url.hostname)) return { type: 'other' };
    if (url.pathname.startsWith('/qr-login')) return { type: 'login' };
    const [section, slug] = url.pathname.split('/').filter(Boolean);
    if ((section === 'product' || section === 'category') && slug) return { type: 'link', path: `/${section}/${slug}` };
    return { type: 'other' };
  } catch {
    return { type: 'other' };
  }
}

export function QrScanner({ fromLink = false }: { fromLink?: boolean }) {
  const router = useRouter();
  const session = useSession();
  const video = useRef<HTMLVideoElement>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [sheet, setSheet] = useState<Sheet>({ kind: 'none' });
  const [toast, setToast] = useState<string | null>(null);
  const busy = useRef(false);

  const onCode = useCallback(
    async (data: string) => {
      if (busy.current) return;
      busy.current = true;
      const what = classify(data);
      if (what.type === 'link') return router.replace(what.path);
      if (what.type === 'other') {
        setToast("This isn't a YouMart code");
        setTimeout(() => {
          setToast(null);
          busy.current = false;
        }, 1800);
        return;
      }
      if (session.status !== 'authenticated') {
        // Sign in first, then come back to /scan, which picks this code up again.
        try {
          window.sessionStorage.setItem(PENDING_KEY, data);
        } catch {
          // ignore
        }
        return router.replace(loginHref('/scan'));
      }
      setSheet({ kind: 'loading' });
      try {
        setSheet({ kind: 'confirm', qr: data, request: await api.auth.qrScan(data) });
      } catch (err) {
        setSheet({ kind: 'error', message: err instanceof ApiError ? err.message : 'Could not read this code. Please try again.' });
      }
    },
    [router, session.status],
  );

  // Opened from the phone's camera app (youmart.in/qr-login?c=...), or back from signing in with a
  // scanned code waiting: confirm that code straight away.
  useEffect(() => {
    if (session.status === 'loading') return;
    let pending: string | null = null;
    try {
      pending = window.sessionStorage.getItem(PENDING_KEY);
      window.sessionStorage.removeItem(PENDING_KEY);
    } catch {
      // ignore
    }
    if (fromLink) void onCode(window.location.href);
    else if (pending) void onCode(pending);
  }, [fromLink, onCode, session.status]);

  useEffect(() => {
    if (fromLink) return;
    const Ctor = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
    if (!Ctor) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const detector = new Ctor({ formats: ['qr_code'] });
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let stopped = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((s) => {
        if (stopped) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (video.current) {
          video.current.srcObject = s;
          void video.current.play();
        }
        timer = setInterval(async () => {
          if (!video.current || busy.current || video.current.readyState < 2) return;
          const codes = await detector.detect(video.current).catch(() => []);
          if (codes[0]?.rawValue) void onCode(codes[0].rawValue);
        }, 350);
      })
      .catch(() => setCameraError(true));
    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onCode, fromLink]);

  const resume = () => {
    busy.current = false;
    setSheet({ kind: 'none' });
  };

  return (
    <div className="relative min-h-[calc(100dvh-160px)] bg-[#0b1220] text-white">
      {fromLink ? (
        <div className="flex flex-col items-center gap-[10px] px-[24px] py-[48px] text-center">
          <Loader2 aria-hidden="true" className="size-[28px] animate-spin" />
          <p className="font-ui text-[16px]">Checking the sign-in code…</p>
        </div>
      ) : supported === false || cameraError ? (
        <div className="mx-auto flex max-w-[420px] flex-col items-center gap-[12px] px-[24px] py-[48px] text-center">
          {cameraError ? <CameraOff aria-hidden="true" className="size-[40px] text-white/70" /> : <QrCode aria-hidden="true" className="size-[40px] text-white/70" />}
          <h1 className="font-ui text-[20px] font-bold">{cameraError ? 'Camera not available' : 'Scan with your camera app'}</h1>
          <p className="text-[14px] leading-[20px] text-white/75">
            {cameraError
              ? 'Allow camera access for youmart.in in your browser settings, then try again.'
              : "This browser can't read QR codes. Open your phone's Camera app and point it at the QR code on your computer - it opens youmart.in here to confirm the sign-in."}
          </p>
          <Link href="/" className="mt-[8px] rounded-[12px] bg-white px-[20px] py-[10px] font-ui text-[14px] font-bold text-brand">
            Back to shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center px-[16px] pb-[32px] pt-[24px]">
          <h1 className="font-ui text-[20px] font-bold">QR Login</h1>
          <p className="mt-[4px] text-center text-[13.5px] text-white/75">Open youmart.in on your computer and scan the code on its sign-in page.</p>
          <div className="relative mt-[20px] size-[260px] overflow-hidden rounded-[24px] ring-2 ring-white/30">
            <video ref={video} playsInline muted className="size-full object-cover" />
            <span aria-hidden="true" className="absolute inset-x-[8px] top-[8px] h-[3px] animate-[ym-scanline_1.8s_ease-in-out_infinite_alternate] rounded-full bg-[#38bdf8] shadow-[0_0_12px_#38bdf8]" />
          </div>
          {toast ? <p className="mt-[16px] rounded-full bg-white/15 px-[14px] py-[6px] text-[13px]">{toast}</p> : null}
        </div>
      )}

      {sheet.kind !== 'none' ? (
        <div className="fixed inset-0 z-[90] flex items-end bg-black/50" role="dialog" aria-modal="true">
          <div className="w-full rounded-t-[24px] bg-white px-[20px] pb-[calc(24px+env(safe-area-inset-bottom))] pt-[20px] text-heading animate-[ym-sheet-up_220ms_ease-out]">
            {sheet.kind === 'loading' ? (
              <p className="flex items-center justify-center gap-[8px] py-[24px] font-ui"><Loader2 aria-hidden="true" className="size-[18px] animate-spin" /> Checking the code…</p>
            ) : sheet.kind === 'confirm' ? (
              <div className="flex flex-col items-center gap-[10px] text-center">
                <Laptop aria-hidden="true" className="size-[36px] text-brand" />
                <p className="font-ui text-[19px] font-bold">Sign in on this computer?</p>
                <p className="text-[14px] text-ink-muted">{sheet.request.device}</p>
                <button
                  type="button"
                  className="mt-[6px] h-[46px] w-full rounded-[12px] bg-brand font-ui text-[15px] font-bold text-white"
                  onClick={async () => {
                    try {
                      await api.auth.qrApprove(sheet.qr);
                      setSheet({ kind: 'done', device: sheet.request.device });
                    } catch (err) {
                      setSheet({ kind: 'error', message: err instanceof ApiError ? err.message : 'Could not sign in. Please try again.' });
                    }
                  }}
                >
                  Yes, sign in
                </button>
                <button
                  type="button"
                  className="h-[44px] w-full rounded-[12px] border border-card-border font-ui text-[15px] font-semibold"
                  onClick={async () => {
                    await api.auth.qrReject(sheet.qr).catch(() => undefined);
                    resume();
                  }}
                >
                  No, it wasn&apos;t me
                </button>
              </div>
            ) : sheet.kind === 'done' ? (
              <div className="flex flex-col items-center gap-[10px] text-center">
                <CircleCheck aria-hidden="true" className="size-[40px] text-[#16a34a]" />
                <p className="font-ui text-[19px] font-bold">Signed in</p>
                <p className="text-[14px] text-ink-muted">{sheet.device} is now signed in to your account.</p>
                <Link href="/" className="mt-[6px] flex h-[46px] w-full items-center justify-center rounded-[12px] bg-brand font-ui text-[15px] font-bold text-white">Done</Link>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-[10px] text-center">
                <X aria-hidden="true" className="size-[36px] text-[#e11d48]" />
                <p className="font-ui text-[17px] font-bold">{sheet.message}</p>
                <button type="button" onClick={resume} className="mt-[6px] h-[46px] w-full rounded-[12px] bg-brand font-ui text-[15px] font-bold text-white">Scan again</button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
