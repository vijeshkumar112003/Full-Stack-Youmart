'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  Droplet,
  Leaf,
  Link2,
  Maximize2,
  Minus,
  Palette,
  Plus,
  RotateCcw,
  Ruler,
  Share2,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Tag,
  Truck,
  Weight,
  type LucideIcon,
} from 'lucide-react';
import {
  FREE_DELIVERY_MIN,
  SAFE_CHECKOUT_LABEL,
  SAFE_CHECKOUT_METHODS,
  discountPercent,
  formatMoney,
  type CartProduct,
  type Money,
  type ProductCardData,
  type ProductDetailData,
} from '@youmart/shared-client';
import { FreeDeliveryProgress } from '@/components/cart/FreeDeliveryProgress';
import { Arrows, Head, ROW, useRow } from '@/components/dhome/DesktopSections';
import { MiniProductCard } from '@/components/mhome/MiniProductCard';
import { FaFacebook, FaWhatsapp } from '@/components/ui/FaIcons';
import { skipImageOptimizer } from '@/lib/images';
import { Lightbox } from './ProductGallery';
import { ReviewForm, useProductReviews } from './ProductReviews';
import { usePurchase } from './PurchasePanel';
import { RemindButton } from './RemindButton';
import { VariantPicker } from './VariantPicker';
import { WishlistButton } from './WishlistButton';

// DESKTOP (>= 1025px) product page in the app's design (apps/mobile/src/app/product/[slug].tsx):
// photos, brand + title + rating, the price block, options, key features and "About this item",
// a buy box (Add to Cart / Buy Now / Remind me), then Details, Reviews and the product rails -
// laid out for a wide screen (3 columns up top, a sticky section bar with a mini buy bar).

const money = (m: Money) => formatMoney(m).replace(/\.00$/, '');
const CARD = 'rounded-[24px] border border-brand-popup-border bg-white shadow-rail-card';

const CARD_ICONS: Record<(typeof SAFE_CHECKOUT_METHODS)[number], string> = {
  Visa: '/placeholders/card-visa.svg',
  Mastercard: '/placeholders/card-mastercard.svg',
  'American Express': '/placeholders/card-amex.svg',
  Discover: '/placeholders/card-discover.svg',
};

/** The app's key-feature chips (ProductDetails.tsx), in its order. */
const CHIP_ICON: Record<string, LucideIcon> = {
  'Product Type': Leaf,
  'Item Form': Droplet,
  Organic: ShieldCheck,
  Colour: Palette,
  Color: Palette,
  'Item weight': Weight,
  'Item dimensions': Ruler,
};
const CHIP_KEYS = ['Product Type', 'Item Form', 'Organic', 'Colour', 'Color', 'Item weight', 'Item dimensions'];

type Section = 'd-details' | 'd-reviews' | 'd-explore';

export function DeskProductMain({ product, children }: { product: ProductDetailData; children?: React.ReactNode }) {
  const [skuId, setSkuId] = useState<string | null>(product.skuId);
  const variant = product.variants.find((v) => v.skuId === skuId) ?? null;
  const mrp = variant?.mrp ?? product.mrp;
  const price = variant?.sellingPrice ?? product.sellingPrice;
  const off = discountPercent(mrp, price);
  const title = variant?.title ?? product.title;
  const images = useMemo(() => {
    if (variant?.images.length) return [...variant.images];
    if (variant?.image) return [variant.image, ...product.images.filter((i) => i !== variant.image)];
    return [...product.images];
  }, [variant, product.images]);
  // The picked option's own details win (the app's rule).
  const specs = useMemo(
    () =>
      variant?.specs.length
        ? [
            ...variant.specs.filter((v) => !product.specifications.some((s) => s.label === v.label)),
            ...product.specifications.map((s) => variant.specs.find((v) => v.label === s.label) ?? s),
          ]
        : [...product.specifications],
    [variant, product.specifications],
  );
  const brand = specs.find((s) => s.label === 'Brand')?.value;
  const cartProduct: CartProduct | null = skuId
    ? {
        skuId,
        productId: product.id,
        productSlug: product.slug,
        title: variant ? `${product.title}${variant.label ? ` (${variant.label})` : ''}` : product.title,
        price,
        image: images[0],
      }
    : null;
  const purchase = usePurchase(cartProduct);
  const heroRef = useRef<HTMLDivElement>(null);
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setPastHero(!e!.isIntersecting), { rootMargin: '-120px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const chips = CHIP_KEYS.map((k) => specs.find((s) => s.label === k)).filter((s): s is { label: string; value: string } => Boolean(s));
  const features = chips.length > 0 ? chips : specs.filter((s) => s.label !== 'Brand' && s.value.length <= 40).slice(0, 4);

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-[16px]">
        <ol className="flex flex-wrap items-center gap-[6px] font-ui text-[13px] text-ink-muted">
          <li>
            <Link href="/" className="hover:text-brand hover:underline">
              Home
            </Link>
          </li>
          {product.categories.map((c) => (
            <li key={c.href} className="flex items-center gap-[6px]">
              <ChevronRight aria-hidden="true" className="size-[12px]" strokeWidth={2.5} />
              <Link href={c.href} className="hover:text-brand hover:underline">
                {c.name}
              </Link>
            </li>
          ))}
          <li className="flex min-w-0 items-center gap-[6px]">
            <ChevronRight aria-hidden="true" className="size-[12px]" strokeWidth={2.5} />
            <span aria-current="page" className="max-w-[420px] truncate font-semibold text-heading">
              {product.title}
            </span>
          </li>
        </ol>
      </nav>

      <div ref={heroRef} className="grid grid-cols-[minmax(0,560px)_minmax(0,1fr)_340px] items-start gap-[28px]">
        <div className="sticky top-[84px]">
          <DeskGallery key={images.join('|')} images={images} title={title} off={off} saveProduct={cartProduct ? { ...cartProduct, mrp } : null} />
        </div>

        <div className="min-w-0 font-ui">
          {brand ? (
            <span className="inline-flex items-center gap-[5px] rounded-[8px] bg-[#eaf1ff] px-[10px] py-[4px] text-[12.5px] font-bold tracking-[0.3px] text-brand">
              <BadgeCheck aria-hidden="true" className="size-[14px]" /> {brand}
            </span>
          ) : null}
          <h1 className="mt-[10px] text-[24px] font-semibold leading-[1.35] text-heading">{title}</h1>
          <div className="mt-[12px] flex flex-wrap items-center gap-[10px]">
            {product.rating > 0 ? (
              <>
                <span className="inline-flex items-center gap-[4px] rounded-[8px] bg-[#15803d] px-[8px] py-[3px] text-[13.5px] font-bold text-white">
                  {product.rating.toFixed(1)} <Star aria-hidden="true" className="size-[12px] fill-white" />
                </span>
                <Stars rating={product.rating} />
              </>
            ) : (
              <span className="rounded-[8px] bg-brand-popup-bg px-[8px] py-[3px] text-[12.5px] font-bold text-brand">New</span>
            )}
            <a href="#d-reviews" className="text-[14px] font-semibold text-brand hover:underline">
              {product.ratingCount > 0 ? `${product.ratingCount} rating${product.ratingCount === 1 ? '' : 's'} & reviews` : 'Be the first to review'}
            </a>
          </div>

          <div className="mt-[18px] rounded-[20px] bg-[linear-gradient(135deg,#f6f9ff_0%,#eaf1ff_100%)] px-[20px] py-[16px]">
            <div className="flex flex-wrap items-baseline gap-x-[12px]">
              {off > 0 ? <span className="text-[26px] font-medium tracking-[-0.3px] text-[#e11d48]">-{off}%</span> : null}
              <span className="text-[36px] font-bold leading-none tracking-[-0.5px] text-heading">
                <span className="sr-only">Price </span>
                <span className="mr-[2px] align-top text-[20px] font-semibold">₹</span>
                {money(price).replace(/^₹\s*/, '')}
              </span>
            </div>
            <div className="mt-[6px] flex flex-wrap items-center gap-x-[10px] gap-y-[4px] text-[13px] text-ink-muted">
              {off > 0 ? (
                <span>
                  M.R.P. <del>{money(mrp)}</del>
                </span>
              ) : null}
              <span>Inclusive of all taxes</span>
            </div>
            {off > 0 ? (
              <span className="mt-[8px] inline-flex items-center gap-[5px] rounded-full bg-[#fff1f1] px-[10px] py-[4px] text-[12.5px] font-bold text-[#e11d48]">
                <Tag aria-hidden="true" className="size-[12px]" /> You save {money((Number(mrp) - Number(price)).toFixed(2) as Money)}
              </span>
            ) : null}
          </div>

          {product.variants.length > 1 ? (
            <div className="mt-[18px]">
              <VariantPicker prod={product} selectedSkuId={skuId} onSelect={setSkuId} />
            </div>
          ) : null}

          {features.length > 0 ? (
            <div className="mt-[18px] grid grid-cols-2 gap-[10px]">
              {features.map((c) => {
                const Icon = CHIP_ICON[c.label] ?? Tag;
                return (
                  <div key={c.label} className="flex items-center gap-[10px] rounded-[14px] bg-[#f6f9ff] px-[12px] py-[10px]">
                    <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-white text-brand shadow-[0_2px_6px_rgba(1,66,170,0.1)]">
                      <Icon aria-hidden="true" className="size-[16px]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11.5px] font-medium text-ink-muted">{c.label}</span>
                      <span className="block truncate text-[13.5px] font-bold text-heading">{c.value}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}

          {product.highlights.length > 0 ? (
            <div className="mt-[20px]">
              <h2 className="text-[17px] font-bold text-heading">About this item</h2>
              <ul className="mt-[10px] space-y-[10px]">
                {product.highlights.map((h) => (
                  <li key={h} className="flex gap-[10px] text-[14.5px] leading-[1.55] text-ink-body">
                    <span className="mt-[3px] flex size-[18px] shrink-0 items-center justify-center rounded-full bg-brand">
                      <Check aria-hidden="true" className="size-[11px] text-white" strokeWidth={3} />
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <DeskBuyBox product={cartProduct} purchase={purchase} price={price} mrp={mrp} off={off} />
      </div>

      <DeskSectionBar
        show={pastHero}
        image={images[0]}
        title={title}
        price={price}
        mrp={mrp}
        purchase={purchase}
        canBuy={Boolean(cartProduct)}
        reviewCount={product.ratingCount}
      />

      <section id="d-details" aria-label="Product details" className="scroll-mt-[90px]">
        <DeskDetails specs={specs} description={product.description} />
      </section>
      <section id="d-reviews" aria-label="Reviews" className="mt-[28px] scroll-mt-[90px]">
        <DeskReviews slug={product.slug} title={product.title} rating={product.rating} count={product.ratingCount} />
      </section>
      <section id="d-explore" aria-label="More to explore" className="scroll-mt-[90px]">
        {children}
      </section>
    </>
  );
}

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - i));
        return (
          <span key={i} className="relative" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-[#f5a524]" style={{ width: size, height: size }} strokeWidth={1.8} />
            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="fill-[#f5a524] text-[#f5a524]" style={{ width: size, height: size }} strokeWidth={1.8} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/* ---------------------------------------------------------------- gallery */

function DeskGallery({
  images,
  title,
  off,
  saveProduct,
}: {
  images: string[];
  title: string;
  off: number;
  saveProduct: (CartProduct & { mrp: Money }) | null;
}) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const src = images[index] ?? images[0];
  const count = images.length;

  return (
    <div className="flex gap-[12px]">
      {count > 1 ? (
        <ul className="flex max-h-[560px] w-[72px] shrink-0 flex-col gap-[10px] overflow-y-auto [scrollbar-width:none]">
          {images.map((img, i) => (
            <li key={img}>
              <button
                type="button"
                onMouseEnter={() => setIndex(i)}
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1} of ${count}`}
                aria-current={i === index}
                className={`relative block size-[72px] overflow-hidden rounded-[14px] border-2 bg-white transition-colors ${
                  i === index ? 'border-brand shadow-[0_4px_12px_rgba(1,66,170,0.25)]' : 'border-[#e3e9f3] hover:border-brand/50'
                }`}
              >
                <Image src={img} alt="" fill sizes="72px" unoptimized={skipImageOptimizer(img)} className="object-contain p-[4px]" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className={`relative min-w-0 flex-1 overflow-hidden ${CARD} rounded-[28px]`}>
        <div
          className="relative aspect-square cursor-zoom-in"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
          onClick={() => setLightbox(true)}
        >
          {src ? (
            <Image
              src={src}
              alt={title}
              fill
              priority
              sizes="480px"
              unoptimized={skipImageOptimizer(src)}
              className="object-contain p-[24px] transition-transform duration-150 motion-reduce:transition-none"
              style={zoom ? { transform: 'scale(1.9)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            />
          ) : null}
        </div>
        {off > 0 ? (
          <span className="absolute left-[16px] top-[16px] rounded-[10px] bg-[#e11d48] px-[10px] py-[4px] font-ui text-[13px] font-bold text-white shadow-[0_4px_10px_rgba(225,29,72,0.3)]">
            {off}% OFF
          </span>
        ) : null}
        <div className="absolute right-[14px] top-[14px] flex flex-col gap-[10px]">
          {saveProduct ? (
            <div className="[&>button]:size-[42px] [&>button]:bg-white [&>button]:shadow-[0_4px_12px_rgba(1,66,170,0.18)] [&_svg]:size-[20px]">
              <WishlistButton variant="icon" product={saveProduct} />
            </div>
          ) : null}
          <ShareMenu title={title} />
        </div>
        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label="View images full screen"
          className="absolute bottom-[14px] right-[14px] flex items-center gap-[6px] rounded-full bg-white/95 px-[12px] py-[7px] font-ui text-[12.5px] font-semibold text-heading shadow-[0_4px_12px_rgba(1,66,170,0.15)] hover:text-brand"
        >
          <Maximize2 aria-hidden="true" className="size-[14px]" />
          {count > 1 ? `${index + 1} / ${count}` : 'Full view'}
        </button>
        {!zoom ? (
          <p className="pointer-events-none absolute bottom-[18px] left-[18px] font-ui text-[12px] text-ink-muted">Hover to zoom · click for full view</p>
        ) : null}
      </div>
      {lightbox ? <Lightbox images={images} title={title} index={index} onIndex={setIndex} onClose={() => setLightbox(false)} /> : null}
    </div>
  );
}

function ShareMenu({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => setUrl(window.location.href.split('#')[0]!), []);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  const enc = encodeURIComponent;
  const item = 'flex w-full items-center gap-[10px] rounded-[10px] px-[10px] py-[8px] text-left font-ui text-[13.5px] font-semibold text-heading hover:bg-brand-popup-bg';
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Share ${title}`}
        className="flex size-[42px] items-center justify-center rounded-full bg-white text-brand shadow-[0_4px_12px_rgba(1,66,170,0.18)] transition-transform hover:scale-110"
      >
        <Share2 aria-hidden="true" className="size-[19px]" />
      </button>
      {open ? (
        <div className="absolute right-0 top-[50px] z-20 w-[210px] rounded-[16px] border border-brand-popup-border bg-white p-[6px] shadow-[0_16px_32px_rgba(11,31,77,0.18)]">
          <a className={item} href={`https://api.whatsapp.com/send?text=${enc(`${title} ${url}`)}`} target="_blank" rel="noopener noreferrer">
            <FaWhatsapp className="size-[18px] text-[#25d366]" /> WhatsApp
          </a>
          <a className={item} href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener noreferrer">
            <FaFacebook className="size-[17px] text-[#1877f2]" /> Facebook
          </a>
          <a className={item} href={`https://x.com/intent/post?text=${enc(title)}&url=${enc(url)}`} target="_blank" rel="noopener noreferrer">
            <Link2 aria-hidden="true" className="size-[17px] text-heading" /> X (Twitter)
          </a>
          <button
            type="button"
            className={item}
            onClick={async () => {
              await navigator.clipboard?.writeText(url).catch(() => undefined);
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            }}
          >
            {copied ? <CheckCircle2 aria-hidden="true" className="size-[17px] text-[#16a34a]" /> : <Copy aria-hidden="true" className="size-[17px] text-brand" />}
            {copied ? 'Link copied' : 'Copy link'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- buy box */

type Purchase = ReturnType<typeof usePurchase>;

function DeskBuyBox({
  product,
  purchase,
  price,
  mrp,
  off,
}: {
  product: CartProduct | null;
  purchase: Purchase;
  price: Money;
  mrp: Money;
  off: number;
}) {
  const { cart, inCart, qty, setQty, clamp, busy, run, MAX_QTY } = purchase;
  const rows = [
    { Icon: Truck, title: `FREE delivery over ${money(FREE_DELIVERY_MIN)}`, text: 'Delivered to your door, on time' },
    { Icon: RotateCcw, title: 'Easy returns', text: 'Hassle-free returns & refunds' },
    { Icon: ShieldCheck, title: '100% genuine', text: 'Quality-checked products' },
    { Icon: BadgeCheck, title: 'Sold by YouMart', text: 'Secure payments' },
  ];
  return (
    <aside aria-label="Buy" className={`sticky top-[84px] ${CARD} p-[20px] font-ui`}>
      <div className="flex items-baseline gap-[8px]">
        <span className="text-[26px] font-bold text-heading">{money(price)}</span>
        {off > 0 ? <del className="text-[14px] text-ink-muted">{money(mrp)}</del> : null}
        {off > 0 ? <span className="text-[14px] font-bold text-[#e11d48]">{off}% off</span> : null}
      </div>
      <ul className="mt-[14px] space-y-[10px] border-y border-cart-line py-[14px]">
        {rows.map(({ Icon, title, text }) => (
          <li key={title} className="flex items-center gap-[10px]">
            <span className="flex size-[32px] shrink-0 items-center justify-center rounded-[10px] bg-brand-popup-bg text-brand">
              <Icon aria-hidden="true" className="size-[16px]" />
            </span>
            <span>
              <span className="block text-[13.5px] font-semibold text-heading">{title}</span>
              <span className="block text-[12px] text-ink-muted">{text}</span>
            </span>
          </li>
        ))}
      </ul>

      {product && !inCart ? (
        <div className="mt-[14px] flex items-center justify-between">
          <span className="text-[13.5px] font-semibold text-heading">Quantity</span>
          <div className="flex items-center rounded-[12px] border border-brand-popup-border">
            <button type="button" onClick={() => setQty((q) => clamp(q - 1))} disabled={qty <= 1} aria-label="Decrease quantity" className="flex size-[36px] items-center justify-center text-brand disabled:opacity-40">
              <Minus aria-hidden="true" className="size-[16px]" />
            </button>
            <input
              type="number"
              min={1}
              max={MAX_QTY}
              value={qty}
              onChange={(e) => setQty(clamp(Number(e.target.value)))}
              aria-label="Quantity"
              className="h-[36px] w-[44px] bg-transparent text-center text-[15px] font-bold text-heading outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button type="button" onClick={() => setQty((q) => clamp(q + 1))} disabled={qty >= MAX_QTY} aria-label="Increase quantity" className="flex size-[36px] items-center justify-center text-brand disabled:opacity-40">
              <Plus aria-hidden="true" className="size-[16px]" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-[14px] flex flex-col gap-[10px]">
        {inCart ? (
          <Link href="/cart" className="flex h-[50px] items-center justify-center gap-[8px] rounded-[14px] bg-[#16a34a] text-[15.5px] font-bold text-white shadow-[0_8px_14px_rgba(22,163,74,0.3)] hover:brightness-95">
            <CheckCircle2 aria-hidden="true" className="size-[19px]" /> Go to Cart{inCart.quantity > 1 ? ` (${inCart.quantity})` : ''}
          </Link>
        ) : (
          <button
            type="button"
            disabled={!product || busy !== null}
            onClick={() => void run('add')}
            className="flex h-[50px] items-center justify-center gap-[8px] rounded-[14px] bg-brand text-[15.5px] font-bold text-white shadow-[0_8px_14px_rgba(1,66,170,0.3)] hover:bg-[#013a96] disabled:opacity-60"
          >
            <ShoppingCart aria-hidden="true" className="size-[19px]" /> {busy === 'add' ? 'Adding…' : 'Add to Cart'}
          </button>
        )}
        <button
          type="button"
          disabled={!product || busy !== null}
          onClick={() => void run('buy')}
          className="flex h-[50px] items-center justify-center gap-[8px] rounded-[14px] bg-[#ffd60a] text-[15.5px] font-bold text-[#1f1300] shadow-[0_8px_14px_rgba(255,214,10,0.35)] hover:brightness-95 disabled:opacity-60"
        >
          <ShoppingBag aria-hidden="true" className="size-[19px]" /> {busy === 'buy' ? 'Please wait…' : 'Buy Now'}
        </button>
        {product ? <RemindButton product={product} /> : <p className="text-center text-[14px] font-semibold text-[#e11d48]">This product is currently unavailable.</p>}
      </div>

      {cart && cart.items.length > 0 ? (
        <div className="mt-[14px] rounded-[14px] bg-brand-popup-bg px-[12px] py-[10px]">
          <FreeDeliveryProgress subtotal={cart.subtotal} />
        </div>
      ) : null}

      <div className="mt-[14px] border-t border-cart-line pt-[12px] text-center">
        <p className="text-[11.5px] font-bold uppercase tracking-[0.8px] text-ink-muted">{SAFE_CHECKOUT_LABEL}</p>
        <ul className="mt-[8px] flex justify-center gap-[8px]">
          {SAFE_CHECKOUT_METHODS.map((m) => (
            <li key={m}>
              <Image src={CARD_ICONS[m]} alt={m} width={40} height={25} unoptimized />
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

/* ------------------------------------------------- sticky section bar */

function DeskSectionBar({
  show,
  image,
  title,
  price,
  mrp,
  purchase,
  canBuy,
  reviewCount,
}: {
  show: boolean;
  image: string | undefined;
  title: string;
  price: Money;
  mrp: Money;
  purchase: Purchase;
  canBuy: boolean;
  reviewCount: number;
}) {
  const router = useRouter();
  const [active, setActive] = useState<Section>('d-details');
  const tabs: { id: Section; label: string }[] = [
    { id: 'd-details', label: 'Product details' },
    { id: 'd-reviews', label: `Reviews${reviewCount > 0 ? ` (${reviewCount})` : ''}` },
    { id: 'd-explore', label: 'More to explore' },
  ];
  useEffect(() => {
    const els = tabs.map((t) => document.getElementById(t.id)).filter((e): e is HTMLElement => Boolean(e));
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id as Section);
      },
      { rootMargin: '-110px 0px -60% 0px' },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the section ids are fixed
  }, []);
  const go = (id: Section) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 86, behavior: 'smooth' });
  };
  const { inCart, busy, run } = purchase;
  const off = discountPercent(mrp, price);

  return (
    <div className="sticky top-0 z-30 -mx-[32px] mt-[32px] border-b border-cart-line bg-white/95 px-[32px] shadow-[0_6px_16px_-10px_rgba(1,66,170,0.25)] backdrop-blur">
      <div className="flex h-[68px] items-center gap-[20px]">
        <div className="flex h-full gap-[4px]">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => go(t.id)}
              className={`relative px-[16px] font-ui text-[14.5px] font-semibold transition-colors ${active === t.id ? 'text-brand' : 'text-ink-body hover:text-brand'}`}
            >
              {t.label}
              {active === t.id ? <span aria-hidden="true" className="absolute inset-x-[12px] bottom-0 h-[3px] rounded-t-[3px] bg-brand" /> : null}
            </button>
          ))}
        </div>
        <div className={`ml-auto flex items-center gap-[12px] transition-opacity duration-200 ${show ? 'opacity-100' : 'pointer-events-none opacity-0'}`} aria-hidden={!show}>
          {image ? (
            <span className="relative size-[44px] shrink-0 overflow-hidden rounded-[10px] border border-cart-line bg-white">
              <Image src={image} alt="" fill sizes="44px" unoptimized={skipImageOptimizer(image)} className="object-contain p-[2px]" />
            </span>
          ) : null}
          <div className="min-w-0 max-w-[320px]">
            <p className="truncate font-ui text-[13.5px] font-semibold text-heading">{title}</p>
            <p className="font-ui text-[13px]">
              <span className="font-bold text-heading">{money(price)}</span>
              {off > 0 ? <span className="ml-[6px] font-bold text-[#e11d48]">{off}% off</span> : null}
            </p>
          </div>
          {inCart ? (
            <button type="button" tabIndex={show ? 0 : -1} onClick={() => router.push('/cart')} className="flex h-[42px] items-center gap-[6px] rounded-[12px] bg-[#16a34a] px-[16px] font-ui text-[14px] font-bold text-white">
              <CheckCircle2 aria-hidden="true" className="size-[17px]" /> Go to Cart
            </button>
          ) : (
            <button type="button" tabIndex={show ? 0 : -1} disabled={!canBuy || busy !== null} onClick={() => void run('add')} className="flex h-[42px] items-center gap-[6px] rounded-[12px] bg-brand px-[16px] font-ui text-[14px] font-bold text-white hover:bg-[#013a96] disabled:opacity-60">
              <ShoppingCart aria-hidden="true" className="size-[17px]" /> Add to Cart
            </button>
          )}
          <button type="button" tabIndex={show ? 0 : -1} disabled={!canBuy || busy !== null} onClick={() => void run('buy')} className="flex h-[42px] items-center gap-[6px] rounded-[12px] bg-[#ffd60a] px-[16px] font-ui text-[14px] font-bold text-[#1f1300] hover:brightness-95 disabled:opacity-60">
            <ShoppingBag aria-hidden="true" className="size-[17px]" /> Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- details & reviews */

const SPECS_PREVIEW = 10;

function DeskDetails({ specs, description }: { specs: { label: string; value: string }[]; description: string }) {
  const [allSpecs, setAllSpecs] = useState(false);
  const [fullDesc, setFullDesc] = useState(false);
  const shown = allSpecs ? specs : specs.slice(0, SPECS_PREVIEW);
  const longDesc = description.length > 700;
  if (specs.length === 0 && !description) return null;
  const more = 'mt-[12px] inline-flex items-center gap-[4px] font-ui text-[14px] font-bold text-brand hover:underline';
  return (
    <div className={`mt-[24px] grid gap-[24px] ${specs.length > 0 && description ? 'grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]' : ''}`}>
      {specs.length > 0 ? (
        <div className={`${CARD} p-[24px]`}>
          <Head title="Specifications" sub={`${specs.length} detail${specs.length === 1 ? '' : 's'}`} />
          <dl className="overflow-hidden rounded-[16px] border border-cart-line">
            {shown.map((s, i) => (
              <div key={s.label} className={`grid grid-cols-[40%_1fr] gap-[12px] px-[16px] py-[11px] font-ui ${i % 2 === 0 ? 'bg-[#f6f9ff]' : 'bg-white'}`}>
                <dt className="text-[13.5px] font-medium text-ink-muted">{s.label}</dt>
                <dd className="break-words text-[14px] font-semibold text-heading">{s.value}</dd>
              </div>
            ))}
          </dl>
          {specs.length > SPECS_PREVIEW ? (
            <button type="button" onClick={() => setAllSpecs((v) => !v)} className={more}>
              {allSpecs ? 'Show less' : `Show all ${specs.length} specifications`}
              {allSpecs ? <ChevronUp aria-hidden="true" className="size-[15px]" /> : <ChevronDown aria-hidden="true" className="size-[15px]" />}
            </button>
          ) : null}
        </div>
      ) : null}
      {description ? (
        <div className={`${CARD} self-start p-[24px]`}>
          <Head title="Product description" />
          <div className="relative">
            <p className={`whitespace-pre-line break-words text-[15px] leading-[1.7] text-ink-body ${!fullDesc && longDesc ? 'max-h-[300px] overflow-hidden' : ''}`}>{description}</p>
            {!fullDesc && longDesc ? <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[80px] bg-gradient-to-t from-white" /> : null}
          </div>
          {longDesc ? (
            <button type="button" onClick={() => setFullDesc((v) => !v)} className={more}>
              {fullDesc ? 'Read less' : 'Read more'}
              {fullDesc ? <ChevronUp aria-hidden="true" className="size-[15px]" /> : <ChevronDown aria-hidden="true" className="size-[15px]" />}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const dateFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function DeskReviews({ slug, title, rating, count }: { slug: string; title: string; rating: number; count: number }) {
  const router = useRouter();
  const state = useProductReviews(slug);
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: state.reviews.filter((r) => Math.round(r.rating) === n).length }));
  const shownTotal = Math.max(1, state.reviews.length);
  return (
    <div className={`${CARD} p-[24px]`}>
      <Head title="Ratings & reviews" sub={count > 0 ? `${count} review${count === 1 ? '' : 's'} from customers` : 'No reviews yet'} />
      <div className="grid grid-cols-[300px_minmax(0,1fr)] gap-[32px]">
        <div className="self-start rounded-[20px] bg-[linear-gradient(135deg,#f6f9ff_0%,#eaf1ff_100%)] p-[20px] font-ui">
          <div className="flex items-end gap-[10px]">
            <span className="text-[48px] font-bold leading-none text-heading">{rating > 0 ? rating.toFixed(1) : '–'}</span>
            <span className="pb-[6px] text-[14px] text-ink-muted">out of 5</span>
          </div>
          <div className="mt-[8px]">
            <Stars rating={rating} size={20} />
          </div>
          <ul className="mt-[16px] space-y-[6px]">
            {dist.map(({ n, c }) => (
              <li key={n} className="flex items-center gap-[8px] text-[12.5px] font-semibold text-ink-body">
                <span className="w-[22px]">{n}★</span>
                <span className="h-[8px] flex-1 overflow-hidden rounded-full bg-white">
                  <span className="block h-full rounded-full bg-[#f5a524]" style={{ width: `${(c / shownTotal) * 100}%` }} />
                </span>
                <span className="w-[20px] text-right text-ink-muted">{c}</span>
              </li>
            ))}
          </ul>
          <div className="mt-[18px] [&_form]:mt-0 [&_h2]:text-[16px]">
            <ReviewForm slug={slug} title={title} onSaved={() => { state.refresh(); router.refresh(); }} />
          </div>
        </div>
        <div className="min-w-0">
          {state.failed && state.reviews.length === 0 ? (
            <p className="font-ui text-[15px] text-ink-body">
              We could not load the reviews.{' '}
              <button type="button" onClick={state.refresh} className="font-bold text-brand hover:underline">
                Try again
              </button>
            </p>
          ) : state.reviews.length === 0 ? (
            <div className="flex flex-col items-center gap-[8px] rounded-[20px] border border-dashed border-brand-popup-border py-[48px] text-center font-ui">
              <span className="flex size-[56px] items-center justify-center rounded-full bg-brand-popup-bg">
                <Star aria-hidden="true" className="size-[26px] text-brand" />
              </span>
              <p className="text-[16px] font-bold text-heading">No reviews yet</p>
              <p className="text-[13.5px] text-ink-muted">Bought this? Be the first to share what you think.</p>
            </div>
          ) : (
            <ol className="space-y-[14px]">
              {state.reviews.map((r) => (
                <li key={r.id} className="rounded-[18px] border border-cart-line p-[16px] font-ui">
                  <div className="flex items-center gap-[10px]">
                    <span className="flex size-[38px] items-center justify-center rounded-full bg-brand text-[15px] font-bold text-white">
                      {(r.author || '?').charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-[8px] text-[14px] font-bold text-heading">
                        {r.author}
                        {r.verifiedPurchase ? (
                          <span className="inline-flex items-center gap-[3px] rounded-full bg-[#e8f8ee] px-[8px] py-[1px] text-[11px] font-bold text-[#15803d]">
                            <BadgeCheck aria-hidden="true" className="size-[12px]" /> Verified buyer
                          </span>
                        ) : null}
                      </p>
                      <time dateTime={r.createdAt} className="text-[12px] text-ink-muted">
                        {dateFormat.format(new Date(r.createdAt))}
                      </time>
                    </div>
                    <span className="inline-flex items-center gap-[3px] rounded-[8px] bg-[#15803d] px-[7px] py-[2px] text-[12.5px] font-bold text-white">
                      {r.rating} <Star aria-hidden="true" className="size-[11px] fill-white" />
                    </span>
                  </div>
                  {r.title ? <p className="mt-[10px] text-[15px] font-bold text-heading">{r.title}</p> : null}
                  <p className="mt-[6px] whitespace-pre-line break-words text-[14.5px] leading-[1.6] text-ink-body">{r.body}</p>
                </li>
              ))}
            </ol>
          )}
          {state.hasMore ? (
            <button type="button" onClick={state.loadMore} className="mt-[14px] rounded-full bg-brand-popup-bg px-[18px] py-[9px] font-ui text-[14px] font-bold text-brand hover:bg-brand hover:text-white">
              Show more reviews
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- rails */

export function DeskProductRail({ title, sub, products }: { title: string; sub?: string; products: readonly ProductCardData[] }) {
  const row = useRow();
  if (products.length === 0) return null;
  return (
    <section className={`mt-[28px] ${CARD} p-[24px]`}>
      <Head title={title} sub={sub} right={<Arrows edges={row.edges} page={row.page} />} />
      <div ref={row.ref} onScroll={row.onScroll} className={`${ROW} !gap-[16px]`}>
        {products.map((p) => (
          <div key={p.id} className="w-[calc((100%-64px)/5)] shrink-0 snap-start">
            <MiniProductCard product={p} size="desktop" />
          </div>
        ))}
      </div>
    </section>
  );
}
