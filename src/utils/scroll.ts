export function scrollToProduct(id: string): void {
  const cell = document.querySelector<HTMLElement>(`[data-product-id="${id}"]`);
  if (cell) cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function scrollToLastPage(workspaceEl: HTMLElement | null): void {
  if (!workspaceEl) return;
  setTimeout(() => {
    const pages = workspaceEl.querySelectorAll('.page-a4');
    if (pages.length) pages[pages.length - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 120);
}
