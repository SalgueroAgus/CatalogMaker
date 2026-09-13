import { useProductStore } from '../src/store/useProductStore';
import { useSettingsStore, DEFAULT_STATE } from '../src/store/useSettingsStore';
import { usePersistenceStore } from '../src/store/usePersistenceStore';
import { hydrateCatalog, retrySave, manageCatalog, acquireExport } from '../src/store/catalogSession';
import { dbLoadCatalog, dbReadLibrary, dbLoadCatalogRecord } from '../src/db';
import { useCatalogStore } from '../src/store/useCatalogStore';
import { openCatalog, createCatalog, changeCatalog, restoreBackup, retainConflictCopy, reloadCurrentCatalog, captureCatalogBackup, refreshCatalogs } from '../src/store/catalogSession';
import { buildCatalogBackup, parseCatalogBackup } from '../src/utils/catalogBackup';
import { buildPDF } from '../src/utils/pdf';
import { prepareExportContext } from '../src/utils/capture';
import { capturePages, extractPageLinks, buildCatalogHTML } from '../src/utils/htmlExport';

export const harness = {
  products: useProductStore,
  settings: useSettingsStore,
  persistence: usePersistenceStore,
  hydrateCatalog,
  retrySave,
  manageCatalog,
  acquireExport,
  catalogs: useCatalogStore,
  openCatalog, createCatalog, changeCatalog, restoreBackup, retainConflictCopy, reloadCurrentCatalog, captureCatalogBackup, refreshCatalogs,
  buildCatalogBackup, parseCatalogBackup, dbReadLibrary, dbLoadCatalogRecord,
  dbLoadCatalog: (id = useCatalogStore.getState().activeId) => dbLoadCatalog(id),
  DEFAULT_STATE,
  async photo(name = 'foto.png', color = '#d22135') {
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 96, 128);
    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((value) => resolve(value!)));
    return new File([blob], name, { type: 'image/png' });
  },
  async fixture(count: number, perPage = 3) {
    await manageCatalog('everything');
    await useSettingsStore.getState().setItemsPerPage(perPage);
    await useProductStore.getState().importProducts(Array.from({ length: count }, (_, i) => ({ name: `PRODUCTO ${String(i + 1).padStart(3, '0')}`, price: `$${i + 1}`, description: `Descripción ${i + 1}` })), []);
  },
  async output(format: 'pdf' | 'html') {
    const release = acquireExport();
    if (!release) throw new Error('Export unavailable');
    document.body.classList.add('pdf-exporting');
    try {
      const products = useProductStore.getState().products;
      const settings = useSettingsStore.getState();
      const ctx = await prepareExportContext(products, settings.bgImage, settings.bgImageOpacity, settings.colors.bg, settings);
      const pages = Array.from(document.querySelectorAll<HTMLDivElement>('.workspace .page-a4'));
      if (format === 'pdf') {
        const pdf = await buildPDF(pages, ctx, () => {});
        return pdf.output('datauristring').split(',')[1];
      }
      const links = extractPageLinks(pages);
      return buildCatalogHTML(settings.storeName, await capturePages(pages, ctx, () => {}), links);
    } finally {
      document.body.classList.remove('pdf-exporting');
      release();
    }
  },
};

declare global {
  interface Window {
    catalogTest: typeof harness;
    faults: {
      failKey: string | null;
      failure: 'quota' | 'abort';
      readFailures: number;
      delay: number;
      writes: number;
      reads: number;
      created: string[];
      revoked: string[];
    };
  }
}
