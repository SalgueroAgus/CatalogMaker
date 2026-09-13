import { useArticleScrollSync } from '../../hooks/useArticleScrollSync';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useEffect, useRef, useState } from 'react';
import { LayoutGrid, LayoutList, Search, X } from 'lucide-react';
import { AddArticles } from '../molecules/AddArticles';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { ProductListItem } from '../molecules/ProductListItem';
import { ExcelImportPanel } from '../molecules/ExcelImportPanel';
import { ReorderProducts } from './ReorderProducts';
import { useProductStore } from '../../store/useProductStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { usePersistenceStore } from '../../store/usePersistenceStore';
import { paginateProducts, getIndexPageCount } from '../../utils/chunks';
import { normalizeProductSearch } from '../../utils/products';

interface Props {
  active: boolean;
  visibleIds: Set<string>;
  onShowProduct: (id: string) => void;
}

export function ArticulosTab({ active, visibleIds, onShowProduct }: Props) {
  const products = useProductStore((s) => s.products);
  const addBlankProduct = useProductStore((s) => s.addBlankProduct);
  const itemsPerPage = useSettingsStore((s) => s.itemsPerPage);
  const pageItemCounts = useSettingsStore((s) => s.pageItemCounts);
  const busy = usePersistenceStore((s) => s.managing || s.exporting || s.saving === 'conflict');
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const [reordering, setReordering] = useState(false);
  const desktop = useMediaQuery('(min-width: 768px)');
  useArticleScrollSync(active && desktop && !busy && !reordering);
  const searchRef = useRef<HTMLInputElement>(null);
  const pointerInteraction = useRef(false);
  const count = products.length;
  const search = normalizeProductSearch(query);
  const pages = paginateProducts(products, itemsPerPage, pageItemCounts);
  const indexPages = getIndexPageCount(count);
  const entries = pages.flatMap((page, pageIndex) => page.products.map((product, offset) => ({ product, index: page.startIndex + offset, page: indexPages + pageIndex + 1 })));
  const matches = entries.filter(({ product }) => normalizeProductSearch(product.name).includes(search));
  const filtered = entries.filter(({ product }) => product.id === editingId || normalizeProductSearch(product.name).includes(search));
  const retained = filtered.length > matches.length;

  useEffect(() => {
    if (count !== 0) return;
    setQuery('');
    setEditingId(null);
    setOpenIds((current) => current.size ? new Set() : current);
  }, [count]);

  function changeSearch(value: string) {
    setQuery(value);
    setEditingId(null);
  }

  function toggleDetails(id: string) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <AddArticles />
      {count > 0 && <div className="rs-articles-toolbar">
        <label className="rs-field-label" htmlFor="articles-search">Buscar artículos</label>
        <div className="rs-search-field">
          <Search size={18} aria-hidden="true" />
          <Input ref={searchRef} id="articles-search" type="search" className="rs-input" placeholder="Nombre del artículo" value={query} onChange={(e) => changeSearch(e.target.value)} />
          {query && <Button className="rs-action" aria-label="Limpiar búsqueda" onClick={() => { changeSearch(''); searchRef.current?.focus(); }}><X size={18} aria-hidden="true" /></Button>}
        </div>
        <div className="rs-articles-tools">
          <p className="rs-results" role="status">{search ? `${matches.length} de ${count} artículos${retained ? ' · 1 en edición' : ''}` : `${count} artículos`}</p>
          <Button className="rs-action" disabled={busy || count < 2} onClick={() => setReordering(true)}><LayoutGrid size={16} aria-hidden="true" /> Reordenar</Button>
        </div>
      </div>}
      <details className="rs-import" open={count === 0 ? true : undefined}>
        <summary>Importar artículos desde Excel</summary>
        <ExcelImportPanel />
      </details>
      {count === 0 ? <div className="rs-empty">
        <LayoutList size={32} aria-hidden="true" />
        <p>Todavía no hay artículos.</p>
        <Button className="rs-action" disabled={busy} onClick={() => void addBlankProduct()}>Agregar artículo</Button>
      </div> : filtered.length === 0 ? <div className="rs-empty">
        <p>No encontramos artículos con ese nombre.</p>
        <Button className="rs-action" onClick={() => { changeSearch(''); searchRef.current?.focus(); }}>Mostrar todos</Button>
      </div> : <div className="rs-list" onPointerDownCapture={() => { pointerInteraction.current = true; }} onPointerCancel={() => { pointerInteraction.current = false; }} onKeyDownCapture={() => { pointerInteraction.current = false; }} onClickCapture={() => { pointerInteraction.current = false; }}>
        {filtered.map(({ product, index, page }, position) => <div key={product.id}>
          {(position === 0 || filtered[position - 1].page !== page) && <div className="rs-page-sep">Página {page}</div>}
          <ProductListItem product={product} index={index} total={count} active={active && !reordering} isVisible={visibleIds.has(product.id)} detailsOpen={openIds.has(product.id)} onToggleDetails={() => toggleDetails(product.id)} onEdit={(id) => { if (!pointerInteraction.current) setEditingId(id); }} onShowProduct={onShowProduct} />
        </div>)}
      </div>}
      {reordering && <ReorderProducts initialId={editingId ?? filtered[0]?.product.id} onClose={() => setReordering(false)} />}
    </>
  );
}
