import { useEffect } from 'react';
import { revealInScrollContainer } from '../utils/scroll';

export function useArticleScrollSync(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const workspace = document.querySelector<HTMLElement>('.workspace');
    const articles = document.querySelector<HTMLElement>('.articles-content');
    if (!workspace || !articles) return;
    const suppressed = new Map<HTMLElement, number>();
    let frame = 0;
    function sync(source: HTMLElement, target: HTMLElement, sourceSelector: string, targetSelector: string) {
      if (Math.abs(source.scrollTop - (suppressed.get(source) ?? -Infinity)) < 1) return;
      suppressed.delete(source);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = source.getBoundingClientRect();
        const targets = new Map(Array.from(target.querySelectorAll<HTMLElement>(targetSelector)).map((node) => [node.dataset.productId ?? node.dataset.id, node]));
        const candidates = Array.from(source.querySelectorAll<HTMLElement>(sourceSelector)).filter((node) => {
          const rect = node.getBoundingClientRect();
          return rect.bottom > bounds.top && rect.top < bounds.bottom && targets.has(node.dataset.productId ?? node.dataset.id);
        });
        candidates.sort((a, b) => Math.abs(a.getBoundingClientRect().top - bounds.top) - Math.abs(b.getBoundingClientRect().top - bounds.top));
        const first = candidates[0];
        if (!first) return;
        const destination = targets.get(first.dataset.productId ?? first.dataset.id)!;
        revealInScrollContainer(target, destination);
        suppressed.set(target, target.scrollTop);
      });
    }
    const fromWorkspace = () => sync(workspace, articles, '.product-cell[data-product-id]', '.rs-product-card[data-id]');
    const fromArticles = () => sync(articles, workspace, '.rs-product-card[data-id]', '.product-cell[data-product-id]');
    const resume = (event: Event) => suppressed.delete(event.currentTarget as HTMLElement);
    workspace.addEventListener('scroll', fromWorkspace, { passive: true });
    articles.addEventListener('scroll', fromArticles, { passive: true });
    for (const element of [workspace, articles]) for (const event of ['wheel', 'pointerdown', 'keydown', 'touchstart']) element.addEventListener(event, resume, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      workspace.removeEventListener('scroll', fromWorkspace);
      articles.removeEventListener('scroll', fromArticles);
      for (const element of [workspace, articles]) for (const event of ['wheel', 'pointerdown', 'keydown', 'touchstart']) element.removeEventListener(event, resume);
    };
  }, [enabled]);
}
