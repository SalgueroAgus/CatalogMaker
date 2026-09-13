import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Grip, Undo2 } from 'lucide-react';
import { useProductStore } from '../../store/useProductStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { usePersistenceStore } from '../../store/usePersistenceStore';
import { useProductReorder } from '../../hooks/useProductReorder';
import { getIndexPageCount, paginateProducts, resolveGridShape } from '../../utils/chunks';
import { normalizeProductSearch } from '../../utils/products';
import { revealInScrollContainer } from '../../utils/scroll';
import { PLACEHOLDER_IMG } from '../../utils/image';
import { SaveStatus } from '../molecules/SaveStatus';
import { ProductPageThumbnail } from '../molecules/ProductPageThumbnail';

interface Props {
  initialId?: string;
  onClose: () => void;
}

interface LastMove {
  id: string;
  from: number;
  order: string[];
}

export function ReorderProducts({ initialId, onClose }: Props) {
  const products = useProductStore((s) => s.products);
  const itemsPerPage = useSettingsStore((s) => s.itemsPerPage);
  const pageItemCounts = useSettingsStore((s) => s.pageItemCounts);
  const pageLayouts = useSettingsStore((s) => s.pageLayouts);
  const busy = usePersistenceStore((s) => s.managing || s.exporting);
  const [selectedId, setSelectedId] = useState(initialId ?? products[0]?.id);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState('');
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const pagesNavRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const positionRef = useRef<HTMLInputElement>(null);
  const cardRefs = useRef(new Map<string, HTMLButtonElement>());
  const pageRefs = useRef(new Map<number, HTMLButtonElement>());
  const upRef = useRef<HTMLButtonElement>(null);
  const downRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const helpId = useId();
  const searchId = useId();
  const positionId = useId();
  const errorId = useId();
  const pages = paginateProducts(products, itemsPerPage, pageItemCounts);
  const indexPages = getIndexPageCount(products.length);
  const pageById = new Map(pages.flatMap((page, pageIndex) => page.products.map((product) => [product.id, pageIndex + indexPages + 1] as const)));
  const selected = products.find((product) => product.id === selectedId) ?? products[0];
  const selectedIndex = products.findIndex((product) => product.id === selected?.id);
  const selectedPage = selected ? pageById.get(selected.id) : undefined;
  const search = normalizeProductSearch(query);
  const matches = search ? products.filter((product) => normalizeProductSearch(product.name).includes(search)) : [];
  const matchIndex = matches.findIndex((product) => product.id === selected?.id);
  const canUndo = !!lastMove && lastMove.order.length === products.length && products.every((product, index) => product.id === lastMove.order[index]);

  function reveal(id: string, focus = false) {
    requestAnimationFrame(() => {
      const button = cardRefs.current.get(id);
      revealInScrollContainer(galleryRef.current, button?.closest<HTMLElement>('.reorder-card') ?? null);
      if (focus) button?.focus({ preventScroll: true });
    });
  }

  function select(id: string, focus = false) {
    setSelectedId(id);
    setError('');
    reveal(id, focus);
  }

  function moveTo(id: string, to: number, remember = true) {
    const state = useProductStore.getState();
    const status = usePersistenceStore.getState();
    const from = state.products.findIndex((product) => product.id === id);
    if (status.managing || status.exporting || from < 0 || from === to || !Number.isInteger(to) || to < 0 || to >= state.products.length) return;
    const target = state.products[to];
    void state.reorderProduct(id, target.id, from > to);
    const reordered = useProductStore.getState().products;
    if (reordered === state.products) return;
    setLastMove(remember ? { id, from, order: reordered.map((product) => product.id) } : null);
    setSelectedId(id);
    setError('');
    const currentPages = paginateProducts(reordered, itemsPerPage, pageItemCounts);
    const page = currentPages.findIndex((chunk) => chunk.products.some((product) => product.id === id)) + getIndexPageCount(reordered.length) + 1;
    setAnnouncement(`${remember ? 'Artículo movido' : 'Movimiento deshecho'}. Posición ${to + 1} de ${reordered.length}, página ${page}.`);
    reveal(id);
  }

  const drag = useProductReorder({
    containerRef: galleryRef,
    disabled: busy,
    onSelect: (id) => { setSelectedId(id); setError(''); },
    onDrop: (id, target) => {
      const ordered = useProductStore.getState().products;
      const from = ordered.findIndex((product) => product.id === id);
      const destination = ordered.findIndex((product) => product.id === target.id);
      if (from < 0 || destination < 0) return;
      moveTo(id, destination - (from < destination ? 1 : 0) + (target.before ? 0 : 1));
    },
  });
  const dragging = products.find((product) => product.id === drag.draggingId);

  function step(direction: -1 | 1) {
    if (!selected) return;
    moveTo(selected.id, selectedIndex + direction);
    requestAnimationFrame(() => {
      const button = direction === -1 ? upRef.current : downRef.current;
      const other = direction === -1 ? downRef.current : upRef.current;
      (button?.disabled ? other : button)?.focus({ preventScroll: true });
    });
  }

  function changeSearch(value: string) {
    setQuery(value);
    const normalized = normalizeProductSearch(value);
    if (!normalized) return;
    const found = products.find((product) => normalizeProductSearch(product.name).includes(normalized));
    if (found) select(found.id);
  }

  function nextMatch(direction: -1 | 1) {
    if (!matches.length) return;
    const next = matchIndex < 0 ? (direction === 1 ? 0 : matches.length - 1) : (matchIndex + direction + matches.length) % matches.length;
    select(matches[next].id);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    setPosition(selectedIndex < 0 ? '' : String(selectedIndex + 1));
  }, [selected?.id, selectedIndex]);

  useEffect(() => {
    if (selectedPage !== undefined) revealInScrollContainer(pagesNavRef.current, pageRefs.current.get(selectedPage) ?? null);
  }, [selectedPage, products]);

  useEffect(() => {
    if (initialId) reveal(initialId);
  }, [initialId]);

  return createPortal(
    <dialog ref={dialogRef} className="reorder-view" aria-labelledby={titleId} aria-describedby={helpId} onCancel={(event) => { event.preventDefault(); onClose(); }} onKeyDown={(event) => {
      if (event.key === 'Tab') {
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]')).filter((element) => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      if (drag.cancel()) event.preventDefault();
    }}>
      <header className="reorder-header">
        <div className="reorder-title-row">
          <h2 id={titleId}>Reordenar artículos</h2>
          <button className="rs-action" onClick={onClose}><ArrowLeft size={18} aria-hidden="true" /> Volver al editor</button>
        </div>
        <p id={helpId}>Usá el agarre o seleccioná una foto para moverla. Los cambios se guardan automáticamente.</p>
        <SaveStatus />
        <div className="reorder-search">
          <label htmlFor={searchId}>Buscar artículo</label>
          <input ref={searchRef} id={searchId} type="search" className="rs-input" value={query} placeholder="Buscar sin ocultar los demás" onChange={(event) => changeSearch(event.target.value)} />
          {query && <button className="rs-action" onClick={() => { changeSearch(''); searchRef.current?.focus(); }}>Limpiar</button>}
          {search && <div className="reorder-search-results">
            <span role="status">{matches.length === 0 ? 'Sin coincidencias' : `${matchIndex >= 0 ? `${matchIndex + 1} de ` : ''}${matches.length} coincidencias`}</span>
            <button className="rs-action" disabled={!matches.length} onClick={() => nextMatch(-1)}>Anterior</button>
            <button className="rs-action" disabled={!matches.length} onClick={() => nextMatch(1)}>Siguiente</button>
          </div>}
        </div>
        <button className="rs-action reorder-skip" onClick={() => positionRef.current?.focus()}>Ir a controles de movimiento</button>
      </header>
      <div className="reorder-content">
        <div ref={galleryRef} className="reorder-gallery" aria-label="Artículos en orden" tabIndex={-1}>
          <div className="reorder-grid">
            {products.map((product, index) => <div key={product.id} data-reorder-id={product.id} className={`reorder-card${selected?.id === product.id ? ' reorder-selected' : ''}${search && normalizeProductSearch(product.name).includes(search) ? ' reorder-match' : ''}${drag.draggingId === product.id ? ' reorder-dragging' : ''}${drag.target?.id === product.id ? drag.target.before ? ' reorder-before' : ' reorder-after' : ''}`}>
              <div className="reorder-card-header">
                <span>#{index + 1} · Pág. {pageById.get(product.id)}</span>
                <button className="reorder-grip" disabled={busy} aria-label={`Arrastrar artículo ${index + 1}`} onClick={() => setSelectedId(product.id)} onPointerDown={(event) => drag.start(event, product.id)} onPointerMove={drag.move} onPointerUp={drag.end} onPointerCancel={drag.cancel} onLostPointerCapture={drag.cancel}><Grip size={22} aria-hidden="true" /></button>
              </div>
              <button ref={(node) => { if (node) cardRefs.current.set(product.id, node); else cardRefs.current.delete(product.id); }} className="reorder-select" aria-pressed={selected?.id === product.id} aria-label={`Seleccionar artículo ${index + 1}: ${product.name}`} onClick={() => select(product.id)}>
                <img src={product.image} alt="" loading="lazy" draggable={false} onError={(event) => { event.currentTarget.src = PLACEHOLDER_IMG; }} />
                <span>{product.name || 'Sin nombre'}</span>
              </button>
            </div>)}
          </div>
        </div>
        <nav ref={pagesNavRef} className="reorder-pages" aria-label="Páginas del catálogo">
          {pages.map((page, index) => {
            const pageNumber = indexPages + index + 1;
            return <ProductPageThumbnail key={pageNumber} ref={(node) => { if (node) pageRefs.current.set(pageNumber, node); else pageRefs.current.delete(pageNumber); }} products={page.products} shape={resolveGridShape(pageLayouts[index], page.products.length)} pageNumber={pageNumber} selected={pageNumber === selectedPage} onSelect={() => select(page.products[0].id, true)} />;
          })}
        </nav>
      </div>
      <footer className="reorder-controls">
        <p className="reorder-selection">{selected ? `Artículo ${selectedIndex + 1} de ${products.length} · Página ${selectedPage}: ${selected.name || 'Sin nombre'}` : 'No hay artículos para reordenar.'}</p>
        <div className="reorder-actions">
          <button ref={upRef} className="rs-action" disabled={busy || selectedIndex <= 0} onClick={() => step(-1)}>Subir</button>
          <button ref={downRef} className="rs-action" disabled={busy || selectedIndex < 0 || selectedIndex === products.length - 1} onClick={() => step(1)}>Bajar</button>
          <button className="rs-action" disabled={busy || !canUndo} aria-label="Deshacer último movimiento" onClick={() => {
            if (!lastMove) return;
            moveTo(lastMove.id, lastMove.from, false);
            positionRef.current?.focus({ preventScroll: true });
          }}><Undo2 size={18} aria-hidden="true" /> Deshacer</button>
          <form className="reorder-position" onSubmit={(event) => {
            event.preventDefault();
            const to = Number(position);
            if (!Number.isInteger(to) || to < 1 || to > products.length) { setError(`Elegí una posición entre 1 y ${products.length}.`); return; }
            if (selected) moveTo(selected.id, to - 1);
          }} noValidate>
            <label htmlFor={positionId}>Mover a posición</label>
            <input ref={positionRef} id={positionId} className="rs-input" type="number" inputMode="numeric" min={1} max={products.length} value={position} disabled={busy || !selected} aria-invalid={!!error} aria-describedby={error ? errorId : undefined} onChange={(event) => { setPosition(event.target.value); setError(''); }} />
            <button className="rs-action" disabled={busy || !selected}>Mover</button>
          </form>
        </div>
        {error && <p id={errorId} className="field-error" role="alert">{error}</p>}
        <p className="reorder-announcement" role="status">{announcement}</p>
      </footer>
      {dragging && <div ref={drag.ghostRef} className="reorder-drag-ghost" aria-hidden="true"><img src={dragging.image} alt="" />Moviendo</div>}
    </dialog>, document.body,
  );
}
