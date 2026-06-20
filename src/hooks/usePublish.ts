import { useState } from 'react';
import { useProductStore } from '../store/useProductStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { blobUrlToBase64 } from '../utils/image';
import type { ExportContext } from '../utils/pdf';
import { capturePages, buildCatalogHTML, extractPageLinks } from '../utils/htmlExport';
import { deployToNetlify } from '../utils/netlify';

export function usePublish(pagesRef: React.MutableRefObject<(HTMLDivElement | null)[]>) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState('');
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  const products = useProductStore((s) => s.products);
  const colors = useSettingsStore((s) => s.colors);
  const storeName = useSettingsStore((s) => s.storeName);
  const bgImageOpacity = useSettingsStore((s) => s.bgImageOpacity);

  async function buildHtml(onProgress: (msg: string) => void): Promise<string> {
    const imageMap = new Map<string, string>();
    await Promise.all(
      products.map(async (p) => {
        if (!p.image) return;
        imageMap.set(p.id, p.image.startsWith('data:') ? p.image : await blobUrlToBase64(p.image));
      }),
    );
    const ctx: ExportContext = { imageMap, bgImageOpacity, bgColor: colors.bg || '#fafafa' };
    const pages = pagesRef.current.filter((p): p is HTMLDivElement => p !== null);
    const pageLinks = extractPageLinks(pages);
    const dataUrls = await capturePages(pages, ctx, (cur, tot) =>
      onProgress(`Capturando pág. ${cur} / ${tot}…`),
    );
    return buildCatalogHTML(storeName, dataUrls, pageLinks);
  }

  const publish = async () => {
    const pat = import.meta.env.VITE_NETLIFY_PAT;
    const siteId = import.meta.env.VITE_NETLIFY_SITE_ID;

    if (!pat || !siteId) {
      alert('Faltan las variables de entorno VITE_NETLIFY_PAT y VITE_NETLIFY_SITE_ID.');
      return;
    }
    if (products.length === 0) {
      alert('El catálogo está vacío.');
      return;
    }

    setIsPublishing(true);
    setProgress('Preparando…');
    document.body.classList.add('pdf-exporting');

    try {
      const html = await buildHtml(setProgress);
      const url = await deployToNetlify(pat, siteId, html, setProgress);
      setLastUrl(url);
    } catch (err: unknown) {
      console.error('Publish error:', err);
      alert(`Error al publicar: ${(err as Error).message || 'intenta de nuevo'}`);
    } finally {
      document.body.classList.remove('pdf-exporting');
      setIsPublishing(false);
      setProgress('');
    }
  };

  const downloadHTML = async () => {
    if (products.length === 0) {
      alert('El catálogo está vacío.');
      return;
    }

    setIsDownloading(true);
    setProgress('Preparando…');
    document.body.classList.add('pdf-exporting');

    try {
      const html = await buildHtml(setProgress);
      const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = (storeName || 'catalogo').toLowerCase().replace(/\s+/g, '-') + '.html';
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (err: unknown) {
      console.error('HTML download error:', err);
      alert(`Error al generar el HTML: ${(err as Error).message || 'intenta de nuevo'}`);
    } finally {
      document.body.classList.remove('pdf-exporting');
      setIsDownloading(false);
      setProgress('');
    }
  };

  return { publish, downloadHTML, isPublishing, isDownloading, progress, lastUrl };
}
