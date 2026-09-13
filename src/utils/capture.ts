import html2canvas from 'html2canvas';
import type { Product } from '../types';
import { blobUrlToBase64, imagePositionStyle } from './image';

export const A4_PX = { w: 793.7, h: 1122.5 } as const;
export const A4_MM = { w: 210, h: 297 } as const;
export const CAPTURE = { scale: 2, jpegQuality: 0.92 } as const;

export interface ExportContext {
  imageMap: Map<string, string>;
  bgImageOpacity: number;
  backgroundImage: string | null;
  bgColor: string;
}

export type PageTransform = (clone: HTMLDivElement, ctx: ExportContext) => void;

function freezeAnimations(clone: HTMLDivElement): void {
  const style = document.createElement('style');
  style.textContent = '* { animation: none !important; transition: none !important; }';
  clone.prepend(style);
}

function removeHoverOverlays(clone: HTMLDivElement): void {
  clone.querySelectorAll('.cell-img-overlay, .cell-img-hint, input[type="file"]').forEach((el) => el.remove());
}

function restoreBgImageOpacity(clone: HTMLDivElement, ctx: ExportContext): void {
  clone.querySelectorAll('.page-bg-image').forEach((el) => {
    (el as HTMLElement).style.setProperty('opacity', String(ctx.bgImageOpacity), 'important');
    (el as HTMLElement).style.backgroundImage = ctx.backgroundImage ? `url(${ctx.backgroundImage})` : 'none';
  });
}

function replaceFormElements(clone: HTMLDivElement): void {
  clone.querySelectorAll('input.cell-name, input.cell-price').forEach((el) => {
    const input = el as HTMLInputElement;
    const div = document.createElement('div');
    div.className = input.className;
    div.textContent = input.value;
    div.style.cssText = 'border:none;outline:none;background:transparent;white-space:nowrap;overflow:hidden;';
    input.parentNode!.replaceChild(div, input);
  });
  clone.querySelectorAll('textarea.cell-desc').forEach((el) => {
    const ta = el as HTMLTextAreaElement;
    const div = document.createElement('div');
    div.className = ta.className;
    div.textContent = ta.value;
    div.style.cssText = 'border:none;outline:none;background:transparent;overflow:visible;height:auto;';
    ta.parentNode!.replaceChild(div, ta);
  });
}

function patchProductImages(clone: HTMLDivElement, ctx: ExportContext): void {
  clone.querySelectorAll('img[data-product-id]').forEach((el) => {
    const img = el as HTMLImageElement;
    const src = ctx.imageMap.get(img.dataset.productId!);
    if (src) img.src = src;
    Object.assign(img.style, imagePositionStyle(Number(img.dataset.imagePositionY ?? 50)));
  });
}

export const PAGE_TRANSFORMS: PageTransform[] = [
  freezeAnimations,
  removeHoverOverlays,
  restoreBgImageOpacity,
  replaceFormElements,
  patchProductImages,
];

export async function prepareExportContext(products: Product[], background: string | null, bgImageOpacity: number, bgColor: string): Promise<ExportContext> {
  const imageMap = new Map<string, string>();
  await document.fonts.ready;
  await Promise.all(products.map(async (product) => {
    imageMap.set(product.id, product.image.startsWith('data:') ? product.image : await blobUrlToBase64(product.image));
  }));
  const backgroundImage = background ? await blobUrlToBase64(background) : null;
  return { imageMap, backgroundImage, bgImageOpacity, bgColor };
}

export async function capturePage(page: HTMLDivElement, ctx: ExportContext, transforms: PageTransform[] = PAGE_TRANSFORMS): Promise<HTMLCanvasElement> {
  let wrap: HTMLDivElement | null = null;
  try {
    const clone = page.cloneNode(true) as HTMLDivElement;
    const originals = page.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
    clone.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach((input, index) => {
      if (input.type !== 'file') input.value = originals[index].value;
    });
    clone.style.cssText = [
      `width:${A4_PX.w}px`, `height:${A4_PX.h}px`,
      'position:relative', 'top:0', 'left:0',
      'margin:0', 'box-shadow:none', 'border-radius:0',
      'zoom:1', 'transform:none',
      'animation:none', 'transition:none', 'opacity:1',
    ].join(';');
    for (const transform of transforms) transform(clone, ctx);
    wrap = document.createElement('div');
    wrap.className = 'catalog-capture';
    wrap.style.cssText = [
      'position:absolute', 'top:0', `left:-${A4_PX.w + 100}px`,
      `width:${A4_PX.w}px`, `height:${A4_PX.h}px`,
      'overflow:visible', 'z-index:0', 'pointer-events:none',
    ].join(';');
    wrap.appendChild(clone);
    document.body.appendChild(wrap);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    await Promise.all(Array.from(clone.querySelectorAll('img')).map((img) => img.decode()));
    if (ctx.backgroundImage) {
      const background = new Image();
      background.src = ctx.backgroundImage;
      await background.decode();
    }
    return await html2canvas(clone, {
      scale: CAPTURE.scale,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: ctx.bgColor,
      width: A4_PX.w,
      height: A4_PX.h,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
    });
  } finally {
    wrap?.remove();
  }
}
