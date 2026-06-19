import { useCallback, useEffect, useRef } from 'react';
import { Badge } from '../atoms/Badge';
import { IndexPage } from './IndexPage';
import { ProductPage } from './ProductPage';
import { useProductStore } from '../../store/useProductStore';
import { chunkArray } from '../../utils/chunks';
import { scrollToLastPage } from '../../utils/scroll';

interface Props {
  pagesRef: React.MutableRefObject<(HTMLDivElement | null)[]>;
  onVisibleChange: (ids: Set<string>) => void;
  sidebarRightOpen: boolean;
  onToggleRightSidebar: () => void;
}

export function Workspace({
  pagesRef, onVisibleChange,
  sidebarRightOpen, onToggleRightSidebar,
}: Props) {
  const allProducts = useProductStore((s) => s.products);
  const addProducts = useProductStore((s) => s.addProducts);

  const workspaceRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const prevLengthRef = useRef(allProducts.length);
  const visibleRef = useRef(new Set<string>());

  const chunks = chunkArray(allProducts, 3);
  const totalPages = allProducts.length === 0 ? 0 : chunks.length + 1;

  // Scroll to last page when products are added
  useEffect(() => {
    if (allProducts.length > prevLengthRef.current) {
      scrollToLastPage(workspaceRef.current);
    }
    prevLengthRef.current = allProducts.length;
  }, [allProducts.length]);

  // Scroll spy — highlights visible product cards in the right sidebar
  const setupObserver = useCallback(() => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!workspaceRef.current || allProducts.length === 0) {
      onVisibleChange(new Set());
      return;
    }

    visibleRef.current = new Set();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).dataset.productId;
          if (!id) return;
          if (entry.isIntersecting) visibleRef.current.add(id);
          else visibleRef.current.delete(id);
          onVisibleChange(new Set(visibleRef.current));
        });
      },
      { root: workspaceRef.current, threshold: 0.2 }
    );

    workspaceRef.current
      .querySelectorAll<HTMLElement>('.product-cell[data-product-id]')
      .forEach((cell) => observerRef.current!.observe(cell));
  }, [allProducts, onVisibleChange]);

  useEffect(() => {
    setupObserver();
    return () => observerRef.current?.disconnect();
  }, [setupObserver]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove('drag-over');
    addProducts(Array.from(e.dataTransfer.files));
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.add('drag-over');
  }

  function handleDragLeave(e: React.DragEvent) {
    (e.currentTarget as HTMLElement).classList.remove('drag-over');
  }

  function openFilePicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = (e) =>
      addProducts(Array.from((e.target as HTMLInputElement).files ?? []));
    input.click();
  }

  function setPageRef(index: number) {
    return (el: HTMLDivElement | null) => {
      pagesRef.current[index] = el;
    };
  }

  return (
    <main className="workspace" ref={workspaceRef as React.RefObject<HTMLElement>}>
      <div className="info-bar">
        <div>
          <h2>Vista Previa (A4)</h2>
          <p>3 productos por página · Grilla asimétrica alternada</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            className="sidebar-right-toggle"
            onClick={onToggleRightSidebar}
          >
            {sidebarRightOpen ? '✕ Cerrar' : '📋 Productos'}
          </button>
          <Badge>
            {totalPages} Página{totalPages !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {allProducts.length === 0 && (
        <div
          className="drop-zone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFilePicker}
        >
          <span className="dz-icon">📁</span>
          <p className="dz-title">Arrastrá y soltá tus fotos aquí</p>
          <p className="dz-sub">Se agrupan automáticamente en páginas de 3 productos.</p>
        </div>
      )}

      {allProducts.length > 0 && (
        <div className="pages-container">
          <IndexPage ref={setPageRef(0)} />
          {chunks.map((chunk, i) => (
            <ProductPage
              key={chunk[0].id}
              ref={setPageRef(i + 1)}
              products={chunk}
              pageIndex={i}
            />
          ))}
        </div>
      )}
    </main>
  );
}
