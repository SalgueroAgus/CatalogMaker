import { forwardRef } from 'react';
import { ProductCard } from '../molecules/ProductCard';
import { useSettingsStore } from '../../store/useSettingsStore';
import type { Product } from '../../types';

interface Props {
  products: Product[];
  pageIndex: number;
}

function getGridClass(count: number, pageIndex: number): string {
  if (count === 1) return 'grid-single';
  if (count === 2) return 'grid-duo';
  return pageIndex % 2 === 0 ? 'grid-trio' : 'grid-trio-alt';
}

export const ProductPage = forwardRef<HTMLDivElement, Props>(
  ({ products, pageIndex }, ref) => {
    const storeName = useSettingsStore((s) => s.storeName);
    const footerContact = useSettingsStore((s) => s.footerContact);
    const bgImage = useSettingsStore((s) => s.bgImage);
    const bgImageOpacity = useSettingsStore((s) => s.bgImageOpacity);

    const displayPage = pageIndex + 2;
    const gridClass = getGridClass(products.length, pageIndex);

    return (
      <div
        className="page-a4"
        ref={ref}
        style={{ animationDelay: `${(pageIndex + 1) * 0.04}s` }}
      >
        {bgImage && (
          <div
            className="page-bg-image"
            style={{ backgroundImage: `url(${bgImage})`, opacity: bgImageOpacity }}
          />
        )}
        <div className="page-hdr">
          <span className="store-name">{storeName}</span>
          <span className="page-num">Pág. {String(displayPage).padStart(2, '0')}</span>
        </div>

        <div className={`product-grid ${gridClass}`}>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        <div className="page-ftr">
          <span className="footer-contact">{footerContact}</span>
          <span className="footer-tag">Exclusivo</span>
        </div>
      </div>
    );
  }
);

ProductPage.displayName = 'ProductPage';
