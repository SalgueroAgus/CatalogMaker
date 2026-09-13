export function scrollToProduct(id: string): void {
  const cell = document.getElementById(`cell-${id}`);
  if (cell) {
    cell.focus({ preventScroll: true });
    cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

export function scrollToLastPage(workspaceEl: HTMLElement | null): void {
  if (!workspaceEl) return;
  setTimeout(() => {
    const pages = workspaceEl.querySelectorAll('.page-a4');
    if (pages.length) pages[pages.length - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 120);
}

export function revealInScrollContainer(container: HTMLElement | null, element: HTMLElement | null): void {
  if (!container || !element || !container.contains(element)) return;
  const bounds = container.getBoundingClientRect();
  const target = element.getBoundingClientRect();
  const top = bounds.top + container.clientTop;
  const left = bounds.left + container.clientLeft;
  if (target.top < top || target.height > container.clientHeight) container.scrollTop += target.top - top;
  else if (target.bottom > top + container.clientHeight) container.scrollTop += target.bottom - top - container.clientHeight;
  if (target.left < left || target.width > container.clientWidth) container.scrollLeft += target.left - left;
  else if (target.right > left + container.clientWidth) container.scrollLeft += target.right - left - container.clientWidth;
}
