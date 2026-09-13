import { FooterTag } from '../molecules/FooterTag';
import { forwardRef } from 'react';
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
    const mode = useSettingsStore((s) => s.indexBackgroundMode);
    const bgImage = useSettingsStore((s) => s.indexBackgroundMode === 'global' ? s.bgImage : s.indexBackgroundMode === 'image' ? s.indexBgImage : null);
    const bgImageOpacity = useSettingsStore((s) => s.indexBackgroundMode === 'global' ? s.bgImageOpacity : s.indexBgImageOpacity);
    const storeName = useSettingsStore((s) => s.storeName);
    const footerContact = useSettingsStore((s) => s.footerContact);
    const itemsPerPage = useSettingsStore((s) => s.itemsPerPage);
    const pageItemCounts = useSettingsStore((s) => s.pageItemCounts);

    return (
      <div className="page-a4" data-page-kind="index" style={mode === 'global' ? undefined : { background: 'var(--index-bg)' }} ref={ref} id={`index-page-${pageNum}`}>
        {bgImage && <div className="page-bg-image" style={{ backgroundImage: `url(${bgImage})`, opacity: bgImageOpacity }} />}
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
                    {String(getProductPage(globalIndex, itemsPerPage, totalIndexPages, pageItemCounts)).padStart(2, '0')}
                  </span>
                </a>
              </div>
            );
          })}
        </div>

        <div className="page-ftr">
          <span className="footer-contact">{footerContact}</span>
          <FooterTag />
        </div>
      </div>
    );
  }
);

IndexPage.displayName = 'IndexPage';
