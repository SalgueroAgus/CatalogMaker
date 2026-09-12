import jsPDF from 'jspdf';
import { A4_MM, CAPTURE, PAGE_TRANSFORMS, capturePage, type ExportContext, type PageTransform } from './capture';
export { A4_PX, A4_MM, CAPTURE, PAGE_TRANSFORMS } from './capture';
export type { ExportContext, PageTransform } from './capture';

export async function buildPDF(
  pages: HTMLDivElement[],
  ctx: ExportContext,
  onProgress: (current: number, total: number) => void,
  transforms: PageTransform[] = PAGE_TRANSFORMS,
): Promise<jsPDF> {
  if (!pages.length) throw new Error('El catálogo está vacío.');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  for (let i = 0; i < pages.length; i++) {
    onProgress(i + 1, pages.length);

    const canvas = await capturePage(pages[i], ctx, transforms);

    if (i > 0) pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/jpeg', CAPTURE.jpegQuality), 'JPEG', 0, 0, A4_MM.w, A4_MM.h);

    const pageEl = pages[i];
    const pageRect = pageEl.getBoundingClientRect();
    pageEl.querySelectorAll('a[href]').forEach((el) => {
      const anchor = el as HTMLAnchorElement;
      const attrHref = anchor.getAttribute('href');
      if (!attrHref) return;
      const rect = anchor.getBoundingClientRect();
      const x = ((rect.left - pageRect.left) / pageRect.width) * A4_MM.w;
      const y = ((rect.top - pageRect.top) / pageRect.height) * A4_MM.h;
      const w = (rect.width / pageRect.width) * A4_MM.w;
      const h = (rect.height / pageRect.height) * A4_MM.h;
      if (attrHref.startsWith('#')) {
        const targetEl = document.getElementById(attrHref.slice(1));
        if (targetEl) {
          const targetPage = targetEl.closest('.page-a4') as HTMLDivElement | null;
          const targetIdx = targetPage ? pages.indexOf(targetPage) : -1;
          if (targetIdx !== -1) pdf.link(x, y, w, h, { pageNumber: targetIdx + 1 });
        }
      } else if (anchor.href) {
        pdf.link(x, y, w, h, { url: anchor.href });
      }
    });
  }

  return pdf;
}
