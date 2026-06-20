import { FileText } from 'lucide-react';
import { useProductStore } from '../../store/useProductStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { GridShapePicker } from '../molecules/GridShapePicker';
import { DEFAULT_GRID_SHAPE, SHAPE_ITEM_COUNT } from '../../types';

const COUNTS = [1, 2, 3, 4, 5];

export function PaginasTab() {
  const products = useProductStore((s) => s.products);
  const itemsPerPage = useSettingsStore((s) => s.itemsPerPage);
  const pageLayouts = useSettingsStore((s) => s.pageLayouts);
  const setItemsPerPage = useSettingsStore((s) => s.setItemsPerPage);
  const setPageLayout = useSettingsStore((s) => s.setPageLayout);

  const pageCount = products.length === 0 ? 0 : Math.ceil(products.length / itemsPerPage);

  function getActualCount(pageIndex: number): number {
    const start = pageIndex * itemsPerPage;
    return Math.min(itemsPerPage, products.length - start);
  }

  function resolveShape(pageIndex: number, actualCount: number) {
    const stored = pageLayouts[pageIndex];
    return stored && SHAPE_ITEM_COUNT[stored] === actualCount
      ? stored
      : DEFAULT_GRID_SHAPE[actualCount];
  }

  return (
    <div className="paginas-panel">
      <div className="paginas-global">
        <span className="paginas-global-label">Fotos por página</span>
        <div className="paginas-count-pills">
          {COUNTS.map((n) => (
            <button
              key={n}
              className={`paginas-pill ${itemsPerPage === n ? 'active' : ''}`}
              onClick={() => setItemsPerPage(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {pageCount === 0 ? (
        <div className="rs-empty">
          <FileText size={32} />
          <p>Subí fotos para configurar las páginas</p>
        </div>
      ) : (
        <div className="paginas-list">
          {Array.from({ length: pageCount }, (_, i) => {
            const actualCount = getActualCount(i);
            const isPartial = actualCount < itemsPerPage;
            const currentShape = resolveShape(i, actualCount);

            return (
              <div key={i} className="paginas-page-item">
                <div className="paginas-page-header">
                  <span className="paginas-page-label">Página {i + 2}</span>
                  {isPartial && (
                    <span className="paginas-partial-badge">{actualCount} foto{actualCount !== 1 ? 's' : ''}</span>
                  )}
                </div>
                <GridShapePicker
                  count={actualCount}
                  value={currentShape}
                  onChange={(shape) => setPageLayout(i, shape)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
