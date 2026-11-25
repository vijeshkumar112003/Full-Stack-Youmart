import type { Metadata } from 'next';
import { QrScanner } from '@/components/account/QrScanner';

export const metadata: Metadata = {
  title: 'QR Login',
  description: 'Scan the QR code on youmart.in on your computer to sign it in.',
  robots: { index: false },
};

export default function ScanPage() {
  return <QrScanner />;
}
