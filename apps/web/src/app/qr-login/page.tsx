import type { Metadata } from 'next';
import { QrScanner } from '@/components/account/QrScanner';

export const metadata: Metadata = { title: 'Confirm sign-in', robots: { index: false } };

/** Where the computer's sign-in QR points: opened by the phone's camera app, it confirms the sign-in. */
export default function QrLoginPage() {
  return <QrScanner fromLink />;
}
