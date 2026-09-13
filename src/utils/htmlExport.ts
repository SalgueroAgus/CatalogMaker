import { escapeHtmlAttribute } from './links';
import { capturePage, type ExportContext } from './capture';

export interface LinkOverlay {
  href: string;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
}

export function extractPageLinks(pages: HTMLDivElement[]): LinkOverlay[][] {
  const idToPage = new Map<string, number>();
  pages.forEach((page, i) => {
    page.querySelectorAll('[id]').forEach((el) => idToPage.set(el.id, i));
  });

  return pages.map((page) => {
    const pageRect = page.getBoundingClientRect();
    if (pageRect.width === 0) return [];

    const links: LinkOverlay[] = [];
    page.querySelectorAll('a[href]').forEach((el) => {
      const anchor = el as HTMLAnchorElement;
      const attrHref = anchor.getAttribute('href');
      if (!attrHref) return;

      const rect = anchor.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      let href: string;
      if (attrHref.startsWith('#')) {
        const targetPage = idToPage.get(attrHref.slice(1));
        if (targetPage === undefined) return;
        href = `#page-${targetPage}`;
      } else {
        href = anchor.href;
      }

      links.push({
        href,
        xPct: ((rect.left - pageRect.left) / pageRect.width) * 100,
        yPct: ((rect.top - pageRect.top) / pageRect.height) * 100,
        wPct: (rect.width / pageRect.width) * 100,
        hPct: (rect.height / pageRect.height) * 100,
      });
    });

    return links;
  });
}

export async function capturePages(
  pages: HTMLDivElement[],
  ctx: ExportContext,
  onProgress: (current: number, total: number) => void,
): Promise<string[]> {
  const dataUrls: string[] = [];

  for (let i = 0; i < pages.length; i++) {
    onProgress(i + 1, pages.length);

    const canvas = await capturePage(pages[i], ctx);
    dataUrls.push(canvas.toDataURL('image/jpeg', 0.88));
  }

  return dataUrls;
}

export function buildCatalogHTML(
  storeName: string,
  pageDataUrls: string[],
  pageLinks: LinkOverlay[][],
): string {
  const escaped = storeName
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const pages = pageDataUrls.map((url, i) => {
    const overlays = (pageLinks[i] ?? [])
      .map(({ href, xPct, yPct, wPct, hPct }) =>
        `  <a class="pg-link" href="${escapeHtmlAttribute(href)}"${href.startsWith('#') ? '' : ' target="_blank" rel="noopener noreferrer"'} style="left:${xPct.toFixed(2)}%;top:${yPct.toFixed(2)}%;width:${wPct.toFixed(2)}%;height:${hPct.toFixed(2)}%"></a>`,
      )
      .join('\n');
    return `<div class="pg-wrap">\n  <img id="page-${i}" class="pg" src="${url}" alt="">\n${overlays}\n</div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escaped}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#111827;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:32px 16px;gap:20px;font-family:sans-serif}
h1{color:rgba(255,255,255,.5);font-size:12px;font-weight:500;letter-spacing:.12em;text-transform:uppercase}
.pg-wrap{position:relative;width:794px;max-width:100%}
.pg{width:100%;display:block;box-shadow:0 8px 40px rgba(0,0,0,.6)}
.pg-link{position:absolute;display:block;z-index:1}
</style>
</head>
<body>
<h1>${escaped}</h1>
${pages}
</body>
</html>`;
}
