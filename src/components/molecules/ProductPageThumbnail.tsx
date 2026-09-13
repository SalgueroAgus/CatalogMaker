import { forwardRef } from 'react';
import { PLACEHOLDER_IMG } from '../../utils/image';
import type { GridShape, Product } from '../../types';

interface Props {
  products: Product[];
  shape: GridShape;
  pageNumber: number;
  selected: boolean;
  onSelect: () => void;
}

export const ProductPageThumbnail = forwardRef<HTMLButtonElement, Props>(
  ({ products, shape, pageNumber, selected, onSelect }, ref) => (
    <button ref={ref} className={`reorder-page${selected ? ' reorder-page-selected' : ''}`} aria-label={`Ir a página ${pageNumber}`} aria-current={selected ? 'page' : undefined} onClick={onSelect}>
      <span className={`reorder-page-sheet grid-${shape}`} aria-hidden="true">
        {products.map((product) => <span key={product.id} className="grid-item reorder-page-cell">
          <img src={product.image} alt="" loading="lazy" draggable={false} onError={(event) => { event.currentTarget.src = PLACEHOLDER_IMG; }} />
        </span>)}
      </span>
      <span>Página {pageNumber}</span>
    </button>
  ),
);

ProductPageThumbnail.displayName = 'ProductPageThumbnail';
