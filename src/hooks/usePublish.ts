import { useEffect, useState } from 'react';
import { useProductStore } from '../store/useProductStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { prepareExportContext } from '../utils/capture';
import { acquireExport } from '../store/catalogSession';
import { capturePages, buildCatalogHTML, extractPageLinks } from '../utils/htmlExport';
import { useCatalogStore } from '../store/useCatalogStore';
import { usePersistenceStore } from '../store/usePersistenceStore';
import { catalogFilename } from '../utils/catalog';
import { deployToNetlify } from '../utils/netlify';

export function usePublish(pagesRef: React.MutableRefObject<(HTMLDivElement | null)[]>) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [publication, setPublication] = useState<{ catalogId: string; url: string } | null>(null);
  const activeId = useCatalogStore((s) => s.activeId);
  const epoch = useCatalogStore((s) => s.epoch);
  const catalogName = useCatalogStore((s) => s.catalogs.find((item) => item.id === s.activeId)?.name ?? 'Catálogo');
  const lastUrl = publication?.catalogId === activeId ? publication.url : null;
  useEffect(() => { setError(null); }, [epoch]);

  const products = useProductStore((s) => s.products);
  const colors = useSettingsStore((s) => s.colors);
  const storeName = useSettingsStore((s) => s.storeName);
  const bgImage = useSettingsStore((s) => s.bgImage);
  const bgImageOpacity = useSettingsStore((s) => s.bgImageOpacity);

  async function buildHtml(onProgress: (msg: string) => void): Promise<string> {
    const ctx = await prepareExportContext(products, bgImage, bgImageOpacity, colors.bg || '#fafafa', useSettingsStore.getState());
    const pages = pagesRef.current.filter((p): p is HTMLDivElement => p !== null);
    const pageLinks = extractPageLinks(pages);
    const dataUrls = await capturePages(pages, ctx, (cur, tot) =>
      onProgress(`Capturando pág. ${cur} / ${tot}…`),
    );
    return buildCatalogHTML(storeName, dataUrls, pageLinks);
  }

  const publish = async () => {
    const catalog = useCatalogStore.getState();
    if (catalog.activeId !== catalog.mainId || usePersistenceStore.getState().saving === 'conflict') {
      setError('Solo se puede publicar Principal, después de resolver cualquier conflicto de guardado.');
      return;
    }
    const pat = import.meta.env.VITE_NETLIFY_PAT;
    const siteId = import.meta.env.VITE_NETLIFY_SITE_ID;

    if (!pat || !siteId) {
      setError('La publicación web no está configurada. Contactá a quien administra CatalogMaker.');
      return;
    }
    if (products.length === 0) {
      setError('El catálogo está vacío.');
      return;
    }

    setError(null);
    const release = acquireExport();
    if (!release) return;
    setIsPublishing(true);
    setProgress('Preparando…');
    document.body.classList.add('pdf-exporting');

    try {
      const html = await buildHtml(setProgress);
      const url = await deployToNetlify(pat, siteId, html, setProgress);
      setPublication({ catalogId: catalog.activeId, url });
    } catch (err: unknown) {
      console.error('Publish error:', err);
      setError(`Error al publicar: ${(err as Error).message || 'intenta de nuevo'}`);
    } finally {
      release();
      document.body.classList.remove('pdf-exporting');
      setIsPublishing(false);
      setProgress('');
    }
  };

  const downloadHTML = async () => {
    if (products.length === 0) {
      setError('El catálogo está vacío.');
      return;
    }

    setError(null);
    const release = acquireExport();
    if (!release) return;
    setIsDownloading(true);
    setProgress('Preparando…');
    document.body.classList.add('pdf-exporting');

    try {
      const html = await buildHtml(setProgress);
      const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = catalogFilename(catalogName) + '.html';
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (err: unknown) {
      console.error('HTML download error:', err);
      setError(`Error al generar el HTML: ${(err as Error).message || 'intenta de nuevo'}`);
    } finally {
      release();
      document.body.classList.remove('pdf-exporting');
      setIsDownloading(false);
      setProgress('');
    }
  };

  return { publish, downloadHTML, isPublishing, isDownloading, progress, lastUrl, error, clearError: () => setError(null) };
}
