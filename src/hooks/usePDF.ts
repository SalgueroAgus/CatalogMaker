import { useState } from 'react';
import { useProductStore } from '../store/useProductStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { prepareExportContext } from '../utils/capture';
import { acquireExport } from '../store/catalogSession';
import { buildPDF } from '../utils/pdf';

export function usePDF(pagesRef: React.MutableRefObject<(HTMLDivElement | null)[]>) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState('');

  const products = useProductStore((s) => s.products);
  const colors = useSettingsStore((s) => s.colors);
  const storeName = useSettingsStore((s) => s.storeName);
  const bgImage = useSettingsStore((s) => s.bgImage);
  const bgImageOpacity = useSettingsStore((s) => s.bgImageOpacity);

  const exportToPDF = async () => {
    if (products.length === 0) {
      alert('El catálogo está vacío.');
      return;
    }

    const release = acquireExport();
    if (!release) return;
    setIsExporting(true);
    setProgress('Preparando…');
    document.body.classList.add('pdf-exporting');

    try {
      const ctx = await prepareExportContext(products, bgImage, bgImageOpacity, colors.bg || '#fafafa');

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
      release();
      document.body.classList.remove('pdf-exporting');
      setIsExporting(false);
      setProgress('');
    }
  };

  return { exportToPDF, isExporting, progress };
}
