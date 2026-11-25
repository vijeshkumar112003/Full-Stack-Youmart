import type { Metadata } from 'next';
import { AssistantChat } from '@/components/info/AssistantChat';

export const metadata: Metadata = {
  title: 'Yumo - YouMart AI assistant',
  description: 'Your personal shopping assistant: find products, track orders and sort out returns.',
};

export default function YumoPage() {
  return (
    <div className="mx-auto max-w-[760px] px-[12px] py-[16px] lg:py-[32px]">
      <AssistantChat />
    </div>
  );
}
