import Link from 'next/link';
import { ChevronDown, LayoutGrid } from 'lucide-react';
import type { TaxonomyMain, TaxonomyNode } from '@youmart/shared-client';
import { TileImage } from './TileImage';

const ROW =
  'relative flex w-full items-center gap-[10px] rounded-[12px] px-[8px] py-[7px] font-ui text-[13.5px] leading-[1.25] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand';
const ON = 'bg-brand-popup-bg font-bold text-brand';
const OFF = 'font-medium text-heading hover:bg-[#f5f8fd] hover:text-brand';

function Bar() {
  return <span aria-hidden="true" className="absolute inset-y-[8px] left-0 w-[3px] rounded-r-[3px] bg-brand" />;
}

function Thumb({ src, on, small = false }: { src: string | null; on: boolean; small?: boolean }) {
  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-[10px] bg-brand-popup-bg ${small ? 'size-[30px]' : 'size-[40px]'} ${on ? 'ring-2 ring-brand' : 'ring-1 ring-cart-line'}`}
    >
      <TileImage src={src} sizes={small ? '30px' : '40px'} />
    </span>
  );
}

/**
 * DESKTOP ONLY (>= 1025px): the app's category rail as a sidebar - "All <main>", then each
 * sub-category with its image; a sub with its own items expands (no JS: <details>) to its list.
 * The branch holding the current page starts open and the current page is highlighted.
 */
export function CategoryTaxonomySidebar({ main, currentHref }: { main: TaxonomyMain; currentHref: string }) {
  const isCurrent = (node: TaxonomyNode) => node.match === 'catalog' && node.href === currentHref;
  const allOn = currentHref === main.href;

  return (
    <aside
      aria-label={`${main.name} categories`}
      className="sticky top-[16px] hidden max-h-[calc(100vh-32px)] w-[272px] shrink-0 self-start overflow-y-auto overscroll-contain rounded-[20px] border border-brand-popup-border bg-white p-[10px] shadow-rail-card [scrollbar-width:thin] lg:block"
    >
      <p className="px-[8px] pb-[8px] pt-[4px] font-ui text-[12px] font-bold uppercase tracking-[1px] text-ink-muted">Categories</p>
      <Link href={main.href} aria-current={allOn ? 'page' : undefined} className={`${ROW} ${allOn ? ON : OFF}`}>
        {allOn ? <Bar /> : null}
        <span className={`flex size-[40px] shrink-0 items-center justify-center rounded-[10px] ${allOn ? 'bg-brand text-white' : 'bg-brand-popup-bg text-brand'}`}>
          <LayoutGrid aria-hidden="true" className="size-[18px]" />
        </span>
        <span className="min-w-0 flex-1 truncate">All {main.name}</span>
      </Link>

      <ul className="mt-[4px] space-y-[2px]">
        {main.subcategories.map((sub) => {
          const current = isCurrent(sub);
          const single = sub.children.length === 0 || (sub.children.length === 1 && sub.children[0]!.name === sub.name);

          if (single) {
            return (
              <li key={sub.slug}>
                <Link href={sub.href} aria-current={current ? 'page' : undefined} className={`${ROW} ${current ? ON : OFF}`}>
                  {current ? <Bar /> : null}
                  <Thumb src={sub.image} on={current} />
                  <span className="min-w-0 flex-1 truncate">{sub.name}</span>
                </Link>
              </li>
            );
          }

          const branch = current || sub.children.some(isCurrent);
          return (
            <li key={sub.slug}>
              <details open={branch} className="group/sub">
                <summary className={`${ROW} cursor-pointer list-none [&::-webkit-details-marker]:hidden ${branch ? 'font-bold text-brand' : OFF}`}>
                  <Thumb src={sub.image} on={branch} />
                  <span className="min-w-0 flex-1 truncate">{sub.name}</span>
                  <span className="shrink-0 rounded-full bg-brand-popup-bg px-[7px] py-[1px] text-[11px] font-bold text-brand">{sub.children.length}</span>
                  <ChevronDown aria-hidden="true" className="size-[14px] shrink-0 text-ink-muted transition-transform group-open/sub:rotate-180" strokeWidth={2.5} />
                </summary>
                <ul className="mb-[6px] ml-[27px] mt-[2px] space-y-[1px] border-l-2 border-brand-popup-border pl-[8px]">
                  <li>
                    <Link href={sub.href} aria-current={current ? 'page' : undefined} className={`${ROW} py-[6px] text-[13px] ${current ? ON : 'font-semibold text-brand hover:bg-[#f5f8fd]'}`}>
                      All {sub.name}
                    </Link>
                  </li>
                  {sub.children.map((child) => {
                    const here = isCurrent(child);
                    return (
                      <li key={child.slug}>
                        <Link
                          href={child.href}
                          aria-current={here ? 'page' : undefined}
                          className={`${ROW} py-[5px] text-[13px] ${here ? ON : 'font-medium text-ink-body hover:bg-[#f5f8fd] hover:text-brand'}`}
                        >
                          <Thumb src={child.image} on={here} small />
                          <span className="min-w-0 flex-1 truncate">{child.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </details>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
