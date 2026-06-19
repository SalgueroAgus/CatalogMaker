import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useProductStore } from '../store/useProductStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { blobUrlToBase64 } from '../utils/image';

const A4W = 793.7;
const A4H = 1122.5;

export function usePDF(pagesRef: React.MutableRefObject<(HTMLDivElement | null)[]>) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState('');
  const btnRef = useRef<HTMLButtonElement>(null);

  const products = useProductStore((s) => s.products);
  const updateField = useProductStore((s) => s.updateField);
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

    // Convert all blob URLs to base64 so clones have stable srcs
    for (const p of products) {
      if (!p.image || p.image.startsWith('data:')) continue;
      const b64 = await blobUrlToBase64(p.image);
      updateField(p.id, 'image', b64);
    }

    // On mobile the workspace tab may be hidden — force visible during capture
    document.body.classList.add('pdf-exporting');

    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pages = pagesRef.current.filter((p): p is HTMLDivElement => p !== null);

      for (let i = 0; i < pages.length; i++) {
        setProgress(`Pág. ${i + 1} / ${pages.length}…`);

        // Sync live input/textarea values into attributes before cloning
        pages[i].querySelectorAll('input').forEach((inp) => inp.setAttribute('value', inp.value));
        pages[i].querySelectorAll('textarea').forEach((ta) => { ta.textContent = ta.value; });

        // Off-screen wrapper — position:absolute so it never shifts the layout
        const wrap = document.createElement('div');
        wrap.style.cssText = [
          'position:absolute', 'top:0', 'left:-9999px',
          `width:${A4W}px`, `height:${A4H}px`,
          'overflow:visible', 'z-index:0', 'pointer-events:none',
        ].join(';');

        // Freeze animations BEFORE clone — browser must never see opacity:0
        const style = document.createElement('style');
        style.textContent = '* { animation: none !important; transition: none !important; opacity: 1 !important; }';
        wrap.prepend(style);

        const clone = pages[i].cloneNode(true) as HTMLDivElement;
        clone.style.cssText = [
          `width:${A4W}px`, `height:${A4H}px`,
          'position:relative', 'top:0', 'left:0',
          'margin:0', 'box-shadow:none', 'border-radius:0',
          'zoom:1', 'transform:none',
          'animation:none', 'transition:none', 'opacity:1',
        ].join(';');

        // Patch image sources from store (blob → base64 conversion already done above)
        const currentProducts = useProductStore.getState().products;
        clone.querySelectorAll('img[data-product-id]').forEach((el) => {
          const img = el as HTMLImageElement;
          const product = currentProducts.find((p) => p.id === img.dataset.productId);
          if (product?.image) img.src = product.image;
        });

        // Remove hover overlays — they would tint the captured image
        clone.querySelectorAll('.cell-img-overlay').forEach((el) => el.remove());

        // The freeze-style above sets opacity:1 !important on all elements.
        // Restore the bg-image overlay's intended opacity using inline !important,
        // which takes precedence over stylesheet !important at the same origin.
        clone.querySelectorAll('.page-bg-image').forEach((el) => {
          (el as HTMLElement).style.setProperty('opacity', String(bgImageOpacity), 'important');
        });

        // Replace inputs/textareas with divs — html2canvas clips text at overflow boundary
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

        wrap.appendChild(clone);
        document.body.appendChild(wrap);

        // Let the browser flush layout and decode images
        await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
        await Promise.all(
          Array.from(clone.querySelectorAll('img')).map((el) => {
            const img = el as HTMLImageElement;
            return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
          })
        );

        const canvas = await html2canvas(clone, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: colors.bg || '#fafafa',
          width: A4W,
          height: A4H,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
        });

        document.body.removeChild(wrap);

        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297);

        // Add internal link annotations from index page anchors
        const pageEl = pages[i];
        const pageRect = pageEl.getBoundingClientRect();
        pageEl.querySelectorAll('a[href]').forEach((el) => {
          const anchor = el as HTMLAnchorElement;
          const attrHref = anchor.getAttribute('href');
          if (!attrHref) return;
          const rect = anchor.getBoundingClientRect();
          const x = ((rect.left - pageRect.left) / pageRect.width) * 210;
          const y = ((rect.top - pageRect.top) / pageRect.height) * 297;
          const w = (rect.width / pageRect.width) * 210;
          const h = (rect.height / pageRect.height) * 297;
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

  return { exportToPDF, isExporting, progress, btnRef };
}
