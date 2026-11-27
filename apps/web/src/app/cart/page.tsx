import type { Metadata } from 'next';
import { CategoryBar } from '@/components/category/CategoryBar';
import { DeskCart } from '@/components/cart/DeskCart';
import { AppCart } from '@/components/cart/AppCart';
import { categoryBarMains } from '@/lib/category-taxonomy';

export const metadata: Metadata = { title: 'Cart - You Mart' };

export default function CartPage() {
  return (
    <>
      <CategoryBar mains={categoryBarMains()} />
      {/* Phones / tablets: the app's My Cart. */}
      <div className="lg:hidden">
        <AppCart />
      </div>
      {/* Desktop: the app's My Cart laid out for a wide screen. */}
      <div className="mx-auto hidden max-w-[1440px] px-[32px] pb-[24px] pt-[24px] lg:block">
        <DeskCart />
      </div>
    </>
  );
}
