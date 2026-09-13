import { Button } from '../atoms/Button';
import { Select } from '../atoms/Select';
import { usePersistenceStore } from '../../store/usePersistenceStore';
import { FileText } from 'lucide-react';
import { useRef } from 'react';
import { useProductStore } from '../../store/useProductStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { GridShapePicker } from '../molecules/GridShapePicker';
import { BackToTop } from '../molecules/BackToTop';
import { getIndexPageCount, paginateProducts, resolveGridShape } from '../../utils/chunks';

const COUNTS = [1, 2, 3, 4, 5];

export function PaginasTab() {
  const busy = usePersistenceStore((s) => s.managing || s.exporting || s.saving === 'conflict');
  const listRef = useRef<HTMLDivElement>(null);
  const products = useProductStore((s) => s.products);
  const itemsPerPage = useSettingsStore((s) => s.itemsPerPage);
  const pageLayouts = useSettingsStore((s) => s.pageLayouts);
  const pageItemCounts = useSettingsStore((s) => s.pageItemCounts);
  const setItemsPerPage = useSettingsStore((s) => s.setItemsPerPage);
  const setPageLayout = useSettingsStore((s) => s.setPageLayout);
  const setPageItemCount = useSettingsStore((s) => s.setPageItemCount);

  const pages = paginateProducts(products, itemsPerPage, pageItemCounts);
  const indexPageCount = getIndexPageCount(products.length);

  return (
    <div className="paginas-panel">
      <div className="paginas-global">
        <span className="paginas-global-label">Fotos por página: cantidad general</span>
        <div className="paginas-count-pills">
          {COUNTS.map((n) => (
            <Button
              key={n}
              className={`paginas-pill ${itemsPerPage === n ? 'active' : ''}`}
              aria-pressed={itemsPerPage === n}
              aria-label={`${n} fotos por página`}
              onClick={() => setItemsPerPage(n)}
            >
              {n}
            </Button>
          ))}
        </div>
        <p className="paginas-count-help">Se usa en las páginas que no tengan una cantidad propia.</p>
      </div>

      {pages.length === 0 ? (
        <div className="rs-empty">
          <FileText size={32} />
          <p>Subí fotos para configurar las páginas</p>
        </div>
      ) : (
        <div className="paginas-list" ref={listRef} tabIndex={-1} role="region" aria-label="Configuración de páginas">
          {pages.map((page, i) => {
            const actualCount = page.products.length;
            const isPartial = actualCount < page.capacity;
            const currentShape = resolveGridShape(pageLayouts[i], actualCount);
            const pageNum = indexPageCount + i + 1;

            return (
              <div key={i} className="paginas-page-item">
                <div className="paginas-page-header">
                  <span className="paginas-page-label">Página {pageNum}</span>
                  {isPartial && (
                    <span className="paginas-partial-badge">{actualCount} foto{actualCount !== 1 ? 's' : ''}</span>
                  )}
                </div>
                <label className="paginas-page-count">
                  <span>Fotos en página {pageNum}</span>
                  <Select label={`Fotos en página ${pageNum}`} disabled={busy} value={String(pageItemCounts[i] ?? 'general')} onValueChange={(value) => setPageItemCount(i, value === 'general' ? null : Number(value))} options={[{ value: 'general', label: `General (${itemsPerPage})` }, ...COUNTS.map((count) => ({ value: String(count), label: String(count) }))]} />
                </label>
                <GridShapePicker
                  count={actualCount}
                  value={currentShape}
                  onChange={(shape) => setPageLayout(i, shape)}
                />
              </div>
            );
          })}
          <BackToTop target={listRef} label="Volver arriba en Páginas" />
        </div>
      )}
    </div>
  );
}
