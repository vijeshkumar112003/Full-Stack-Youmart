import { BadgeCheck, Gift, HelpCircle, Home as HomeIcon, Info, Lock, Navigation, Phone, RefreshCw, Rocket, ShoppingBag, type LucideIcon } from 'lucide-react';
import { ROUTES } from '@youmart/shared-client';

// The app footer's promises + quick links (shared by the phone AppFooter and the desktop SiteFooter,
// a server component - so plain data here, not in a 'use client' module).

export const PROMISES: { icon: LucideIcon; label: string }[] = [
  { icon: BadgeCheck, label: 'Genuine products' },
  { icon: Rocket, label: 'Fast delivery' },
  { icon: RefreshCw, label: 'Easy returns' },
  { icon: Lock, label: 'Secure payments' },
];
export const QUICK_LINKS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Home', href: ROUTES.home, icon: HomeIcon },
  { label: 'My Orders', href: ROUTES.orders, icon: ShoppingBag },
  { label: 'Track Order', href: ROUTES.trackOrder, icon: Navigation },
  { label: 'Refer & Earn', href: ROUTES.refer, icon: Gift },
  { label: 'About Us', href: '/about', icon: Info },
  { label: 'Contact Us', href: ROUTES.contact, icon: Phone },
  { label: 'FAQs', href: '/faq', icon: HelpCircle },
];

