import type { Page } from '@playwright/test';

export async function measureThemeContrast(page: Page) {
  return page.evaluate(() => {
    type RGB = [number, number, number];
    const parse = (color: string) => color.match(/[\d.]+/g)!.map(Number);
    const blend = (fg: number[], bg: RGB): RGB => bg.map((channel, i) => fg[i] * (fg[3] ?? 1) + channel * (1 - (fg[3] ?? 1))) as RGB;
    const background = (element: Element | null): RGB => element ? blend(parse(getComputedStyle(element).backgroundColor), background(element.parentElement)) : [255, 255, 255];
    const luminance = (rgb: RGB) => rgb.map((v) => v / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (a: RGB, b: RGB) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
    return Array.from(document.querySelectorAll<HTMLElement>('.editor-ui *, .gpp-popover *, .drop-zone, .drop-zone *, .back-to-top')).filter((element) => {
      if (!element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) || element.closest('.page-a4, :disabled, [data-disabled]')) return false;
      return element.matches('input, textarea') || Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && !!node.textContent?.trim());
    }).map((element) => {
      const style = getComputedStyle(element);
      const bg = background(element);
      const placeholder = element.matches('input[placeholder], textarea[placeholder]') ? getComputedStyle(element, '::placeholder') : null;
      return {
        name: element.getAttribute('aria-label') || element.id || element.textContent?.trim().slice(0, 80),
        className: element.className,
        foreground: style.color,
        background: bg,
        text: ratio(blend(parse(style.color), bg), bg),
        placeholder: placeholder ? ratio(blend(parse(placeholder.color), bg), bg) : null,
      };
    });
  });
}

export async function measureThemeBoundaries(page: Page) {
  return page.evaluate(() => {
    type RGB = [number, number, number];
    const parse = (color: string) => color.match(/[\d.]+/g)!.map(Number);
    const blend = (fg: number[], bg: RGB): RGB => bg.map((channel, i) => fg[i] * (fg[3] ?? 1) + channel * (1 - (fg[3] ?? 1))) as RGB;
    const background = (element: Element | null): RGB => element ? blend(parse(getComputedStyle(element).backgroundColor), background(element.parentElement)) : [255, 255, 255];
    const luminance = (rgb: RGB) => rgb.map((v) => v / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (a: RGB, b: RGB) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
    return Array.from(document.querySelectorAll<HTMLElement>('.header-region, .tools-region, .mobile-nav-region, .sb-section, .rs-card, .editor-ui .rt-TextFieldRoot, .editor-ui .rt-TextAreaRoot, .editor-ui .ui-select, .gsp-btn, .gpp-popover, .ui-dialog, .reorder-view, .editor-ui :focus-visible')).filter((el) => el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })).flatMap((el) => {
      const style = getComputedStyle(el);
      const bg = background(el);
      const parentBG = background(el.parentElement);
      const borders = ['Top', 'Bottom', 'Left', 'Right'].flatMap((side) => {
        const width = style.getPropertyValue(`border-${side.toLowerCase()}-width`);
        const color = parse(style.getPropertyValue(`border-${side.toLowerCase()}-color`));
        return parseFloat(width) > 0 && (color[3] ?? 1) > 0 ? [Math.min(ratio(blend(color, bg), bg), ratio(blend(color, parentBG), parentBG))] : [];
      });
      if (el.matches('.rt-TextFieldRoot, .rt-TextAreaRoot, .ui-select')) {
        const color = style.boxShadow.match(/rgba?\([^)]+\)/)?.[0];
        if (color) borders.push(ratio(blend(parse(color), bg), bg));
      }
      if (el.matches(':focus-visible') && parseFloat(style.outlineWidth) > 0) {
        const adjacent = parseFloat(style.outlineOffset) < 0 ? bg : parentBG;
        borders.push(ratio(blend(parse(style.outlineColor), adjacent), adjacent));
      }
      return borders.map((contrast) => ({ name: el.className, contrast }));
    });
  });
}
