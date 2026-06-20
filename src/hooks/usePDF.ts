import { useState } from 'react';
import { useProductStore } from '../store/useProductStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { blobUrlToBase64 } from '../utils/image';
import { buildPDF, type ExportContext } from '../utils/pdf';

export function usePDF(pagesRef: React.MutableRefObject<(HTMLDivElement | null)[]>) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState('');

  const products = useProductStore((s) => s.products);
  const colors = useSettingsStore((s) => s.colors);
  const storeName = useSettingsStore((s) => s.storeName);
  const bgImageOpacity = useSettingsStore((s) => s.bgImageOpacity);

  const exportToPDF = async () => {
    if (products.length === 0) {
      alert('El catálogo está vacío.');
      return;
    }

    setIsExporting(true);
    setProgress('Preparando…');
    document.body.classList.add('pdf-exporting');

    try {
      const imageMap = new Map<string, string>();
      await Promise.all(
        products.map(async (p) => {
          if (!p.image) return;
          imageMap.set(p.id, p.image.startsWith('data:') ? p.image : await blobUrlToBase64(p.image));
        })
      );

      const ctx: ExportContext = {
        imageMap,
        bgImageOpacity,
        bgColor: colors.bg || '#fafafa',
      };

      const pages = pagesRef.current.filter((p): p is HTMLDivElement => p !== null);
      const pdf = await buildPDF(pages, ctx, (current, total) => {
        setProgress(`Pág. ${current} / ${total}…`);
      });

      const filename = (storeName || 'catalogo').toLowerCase().replace(/\s+/g, '-') + '.pdf';
      const blob = pdf.output('blob');
      const file = new File([blob], filename, { type: 'application/pdf' });

      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: storeName || 'Catálogo' });
      } else {
        pdf.save(filename);
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      console.error('PDF export error:', err);
      alert('Error al generar el PDF. Intente de nuevo.');
    } finally {
      document.body.classList.remove('pdf-exporting');
      setIsExporting(false);
      setProgress('');
    }
  };

  return { exportToPDF, isExporting, progress };
}
