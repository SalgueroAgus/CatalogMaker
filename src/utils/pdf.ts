import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const A4_PX = { w: 793.7, h: 1122.5 } as const;
export const A4_MM = { w: 210, h: 297 } as const;
export const CAPTURE = { scale: 2, jpegQuality: 0.92 } as const;

export interface ExportContext {
  imageMap: Map<string, string>;
  bgImageOpacity: number;
  bgColor: string;
}

export type PageTransform = (clone: HTMLDivElement, ctx: ExportContext) => void;

function freezeAnimations(clone: HTMLDivElement): void {
  const style = document.createElement('style');
  style.textContent = '* { animation: none !important; transition: none !important; opacity: 1 !important; }';
  clone.prepend(style);
}

function removeHoverOverlays(clone: HTMLDivElement): void {
  clone.querySelectorAll('.cell-img-overlay').forEach((el) => el.remove());
}

function restoreBgImageOpacity(clone: HTMLDivElement, ctx: ExportContext): void {
  clone.querySelectorAll('.page-bg-image').forEach((el) => {
    (el as HTMLElement).style.setProperty('opacity', String(ctx.bgImageOpacity), 'important');
  });
}

function replaceFormElements(clone: HTMLDivElement): void {
  clone.querySelectorAll('input.cell-name, input.cell-price').forEach((el) => {
    const input = el as HTMLInputElement;
    const div = document.createElement('div');
    div.className = input.className;
    div.textContent = input.getAttribute('value') || '';
    div.style.cssText = 'border:none;outline:none;background:transparent;white-space:nowrap;overflow:hidden;';
    input.parentNode!.replaceChild(div, input);
  });
  clone.querySelectorAll('textarea.cell-desc').forEach((el) => {
    const ta = el as HTMLTextAreaElement;
    const div = document.createElement('div');
    div.className = ta.className;
    div.textContent = ta.textContent || '';
    div.style.cssText = 'border:none;outline:none;background:transparent;overflow:visible;height:auto;';
    ta.parentNode!.replaceChild(div, ta);
  });
}

function patchProductImages(clone: HTMLDivElement, ctx: ExportContext): void {
  clone.querySelectorAll('img[data-product-id]').forEach((el) => {
    const img = el as HTMLImageElement;
    const src = ctx.imageMap.get(img.dataset.productId!);
    if (src) img.src = src;
  });
}

export const PAGE_TRANSFORMS: PageTransform[] = [
  freezeAnimations,
  removeHoverOverlays,
  restoreBgImageOpacity,
  replaceFormElements,
  patchProductImages,
];

export async function buildPDF(
  pages: HTMLDivElement[],
  ctx: ExportContext,
  onProgress: (current: number, total: number) => void,
  transforms: PageTransform[] = PAGE_TRANSFORMS,
): Promise<jsPDF> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  for (let i = 0; i < pages.length; i++) {
    onProgress(i + 1, pages.length);

    pages[i].querySelectorAll('input').forEach((inp) => inp.setAttribute('value', inp.value));
    pages[i].querySelectorAll('textarea').forEach((ta) => { ta.textContent = ta.value; });

    let wrap: HTMLDivElement | null = null;
    try {
      const clone = pages[i].cloneNode(true) as HTMLDivElement;
      clone.style.cssText = [
        `width:${A4_PX.w}px`, `height:${A4_PX.h}px`,
        'position:relative', 'top:0', 'left:0',
        'margin:0', 'box-shadow:none', 'border-radius:0',
        'zoom:1', 'transform:none',
        'animation:none', 'transition:none', 'opacity:1',
      ].join(';');

      for (const transform of transforms) transform(clone, ctx);

      wrap = document.createElement('div');
      wrap.style.cssText = [
        'position:absolute', 'top:0', `left:-${A4_PX.w + 100}px`,
        `width:${A4_PX.w}px`, `height:${A4_PX.h}px`,
        'overflow:visible', 'z-index:0', 'pointer-events:none',
      ].join(';');
      wrap.appendChild(clone);
      document.body.appendChild(wrap);

      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      await Promise.all(
        Array.from(clone.querySelectorAll('img')).map((img) =>
          img.decode ? img.decode().catch(() => {}) : Promise.resolve()
        )
      );

      const canvas = await html2canvas(clone, {
        scale: CAPTURE.scale,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: ctx.bgColor,
        width: A4_PX.w,
        height: A4_PX.h,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
      });

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
    } finally {
      if (wrap?.parentNode) document.body.removeChild(wrap);
    }
  }

  return pdf;
}
