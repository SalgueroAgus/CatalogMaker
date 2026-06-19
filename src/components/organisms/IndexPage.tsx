import { forwardRef } from 'react';
import { useProductStore } from '../../store/useProductStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { getProductPage } from '../../utils/chunks';
import { scrollToProduct } from '../../utils/scroll';

export const IndexPage = forwardRef<HTMLDivElement>((_, ref) => {
  const products = useProductStore((s) => s.products);
  const storeName = useSettingsStore((s) => s.storeName);
  const footerContact = useSettingsStore((s) => s.footerContact);

  return (
    <div className="page-a4" ref={ref} id="index-page">
      <div className="idx-header">
        <h1 className="idx-title">{storeName}</h1>
        <div className="idx-divider" />
        <h2 className="idx-subtitle">Í N D I C E</h2>
      </div>

      <div className="idx-list">
        {products.map((p, i) => (
          <div key={p.id}>
            <a
              className="idx-entry"
              href={`#cell-${p.id}`}
              onClick={(e) => { e.preventDefault(); scrollToProduct(p.id); }}
            >
              <span className="idx-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="idx-name">{p.name}</span>
              <span className="idx-leader" />
              <span className="idx-page">{String(getProductPage(i)).padStart(2, '0')}</span>
            </a>
            {(i + 1) % 3 === 0 && i < products.length - 1 && (
              <div className="idx-gap" />
            )}
          </div>
        ))}
      </div>

      <div className="page-ftr">
        <span className="footer-contact">{footerContact}</span>
        <span className="footer-tag">Exclusivo</span>
      </div>
    </div>
  );
});

IndexPage.displayName = 'IndexPage';
