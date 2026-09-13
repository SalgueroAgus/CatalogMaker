import { FooterTag } from '../molecules/FooterTag';
import { forwardRef } from 'react';
import { ProductCard } from '../molecules/ProductCard';
import { useSettingsStore } from '../../store/useSettingsStore';
import { resolveGridShape } from '../../utils/chunks';
import type { Product } from '../../types';

interface Props {
  products: Product[];
  pageIndex: number;
  pageNum: number;
}

export const ProductPage = forwardRef<HTMLDivElement, Props>(
  ({ products, pageIndex, pageNum }, ref) => {
    const storeName = useSettingsStore((s) => s.storeName);
    const footerContact = useSettingsStore((s) => s.footerContact);
    const bgImage = useSettingsStore((s) => s.bgImage);
    const bgImageOpacity = useSettingsStore((s) => s.bgImageOpacity);
    const pageLayouts = useSettingsStore((s) => s.pageLayouts);
    const actualCount = products.length;

    const gridShape = resolveGridShape(pageLayouts[pageIndex], actualCount);

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
          <span className="page-num">Pág. {String(pageNum).padStart(2, '0')}</span>
        </div>

        <div className={`product-grid grid-${gridShape}`}>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        <div className="page-ftr">
          <span className="footer-contact">{footerContact}</span>
          <FooterTag />
        </div>
      </div>
    );
  }
);

ProductPage.displayName = 'ProductPage';
