export function fitTextareaHeight(element: HTMLTextAreaElement | null): void {
  if (!element || element.clientWidth === 0) return;
  element.style.height = 'auto';
  const borderHeight = element.offsetHeight - element.clientHeight;
  element.style.height = `${element.scrollHeight + borderHeight}px`;
}
