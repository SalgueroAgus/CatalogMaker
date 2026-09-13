import { useEffect, useState } from 'react';
import { useProductStore } from '../store/useProductStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { prepareExportContext } from '../utils/capture';
import { acquireExport } from '../store/catalogSession';
import { useCatalogStore } from '../store/useCatalogStore';
import { catalogFilename } from '../utils/catalog';
import { buildPDF } from '../utils/pdf';

export function usePDF(pagesRef: React.MutableRefObject<(HTMLDivElement | null)[]>) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const products = useProductStore((s) => s.products);
  const colors = useSettingsStore((s) => s.colors);
  const catalogName = useCatalogStore((s) => s.catalogs.find((item) => item.id === s.activeId)?.name ?? 'Catálogo');
  const epoch = useCatalogStore((s) => s.epoch);
  useEffect(() => { setError(null); }, [epoch]);
  const bgImage = useSettingsStore((s) => s.bgImage);
  const bgImageOpacity = useSettingsStore((s) => s.bgImageOpacity);

  const exportToPDF = async () => {
    if (products.length === 0) {
      setError('El catálogo está vacío.');
      return;
    }

    setError(null);
    const release = acquireExport();
    if (!release) return;
    setIsExporting(true);
    setProgress(`Preparando ${catalogName}…`);
    document.body.classList.add('pdf-exporting');

    try {
      const ctx = await prepareExportContext(products, bgImage, bgImageOpacity, colors.bg || '#fafafa', useSettingsStore.getState());

      const pages = pagesRef.current.filter((p): p is HTMLDivElement => p !== null);
      const pdf = await buildPDF(pages, ctx, (current, total) => {
        setProgress(`${catalogName}: pág. ${current} / ${total}…`);
      });

      const filename = catalogFilename(catalogName) + '.pdf';
      const blob = pdf.output('blob');
      const file = new File([blob], filename, { type: 'application/pdf' });

      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: catalogName });
      } else {
        pdf.save(filename);
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      console.error('PDF export error:', err);
      setError('Error al generar el PDF. Intente de nuevo.');
    } finally {
      release();
      document.body.classList.remove('pdf-exporting');
      setIsExporting(false);
      setProgress('');
    }
  };

  return { exportToPDF, isExporting, progress, error, clearError: () => setError(null) };
}
