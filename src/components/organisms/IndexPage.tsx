import { forwardRef } from 'react';
import { useProductStore } from '../../store/useProductStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { getProductPage } from '../../utils/chunks';
import { scrollToProduct } from '../../utils/scroll';
import type { Product } from '../../types';

interface Props {
  products: Product[];
  globalStartIndex: number;
  pageNum: number;
  totalIndexPages: number;
}

export const IndexPage = forwardRef<HTMLDivElement, Props>(
  ({ products, globalStartIndex, pageNum, totalIndexPages }, ref) => {
    const allProducts = useProductStore((s) => s.products);
    const storeName = useSettingsStore((s) => s.storeName);
    const footerContact = useSettingsStore((s) => s.footerContact);
    const itemsPerPage = useSettingsStore((s) => s.itemsPerPage);

    return (
      <div className="page-a4" ref={ref} id={`index-page-${pageNum}`}>
        <div className="page-hdr">
          <span className="store-name">{storeName}</span>
          <span className="page-num">Pág. {String(pageNum).padStart(2, '0')}</span>
        </div>

        <div className="idx-header">
          <h1 className="idx-title">{storeName}</h1>
          <div className="idx-divider" />
          <h2 className="idx-subtitle">
            Í N D I C E{totalIndexPages > 1 ? ` · ${pageNum} / ${totalIndexPages}` : ''}
          </h2>
        </div>

        <div className="idx-list">
          {products.map((p, localIndex) => {
            const globalIndex = globalStartIndex + localIndex;
            return (
              <div key={p.id}>
                <a
                  className="idx-entry"
                  href={`#cell-${p.id}`}
                  onClick={(e) => { e.preventDefault(); scrollToProduct(p.id); }}
                >
                  <span className="idx-num">{String(globalIndex + 1).padStart(2, '0')}</span>
                  <span className="idx-name">{p.name}</span>
                  <span className="idx-leader" />
                  <span className="idx-page">
                    {String(getProductPage(globalIndex, itemsPerPage, totalIndexPages)).padStart(2, '0')}
                  </span>
                </a>
              </div>
            );
          })}
        </div>

        <div className="page-ftr">
          <span className="footer-contact">{footerContact}</span>
          <span className="footer-tag">Exclusivo</span>
        </div>
      </div>
    );
  }
);

IndexPage.displayName = 'IndexPage';
