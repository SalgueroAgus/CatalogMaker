import { forwardRef } from 'react';
import { ProductCard } from '../molecules/ProductCard';
import { useProductStore } from '../../store/useProductStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { DEFAULT_GRID_SHAPE, SHAPE_ITEM_COUNT } from '../../types';
import { getIndexPageCount } from '../../utils/chunks';
import type { Product } from '../../types';

interface Props {
  products: Product[];
  pageIndex: number;
}

export const ProductPage = forwardRef<HTMLDivElement, Props>(
  ({ products, pageIndex }, ref) => {
    const storeName = useSettingsStore((s) => s.storeName);
    const footerContact = useSettingsStore((s) => s.footerContact);
    const bgImage = useSettingsStore((s) => s.bgImage);
    const bgImageOpacity = useSettingsStore((s) => s.bgImageOpacity);
    const itemsPerPage = useSettingsStore((s) => s.itemsPerPage);
    const pageLayouts = useSettingsStore((s) => s.pageLayouts);
    const allProducts = useProductStore((s) => s.products);

    const indexPageCount = getIndexPageCount(allProducts.length);
    const displayPage = pageIndex + indexPageCount + 1;
    const actualCount = products.length;

    const stored = pageLayouts[pageIndex];
    const gridShape =
      stored && SHAPE_ITEM_COUNT[stored] === actualCount
        ? stored
        : DEFAULT_GRID_SHAPE[actualCount] ?? DEFAULT_GRID_SHAPE[itemsPerPage];

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

        <div className={`product-grid grid-${gridShape}`}>
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
