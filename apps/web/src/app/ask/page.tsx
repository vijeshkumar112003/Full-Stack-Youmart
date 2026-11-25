import type { Metadata } from 'next';
import { AskHub } from '@/components/ask/AskHub';

export const metadata: Metadata = {
  title: 'Ask YouMart',
  description: 'Chat privately with Yumo, our AI shopping assistant, or ask the YouFind live room.',
};

export default function AskPage() {
  return <AskHub />;
}
