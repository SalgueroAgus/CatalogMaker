import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';

interface DropTarget {
  id: string;
  before: boolean;
}

interface DragSession {
  id: string;
  pointerId: number;
  handle: HTMLButtonElement;
  startX: number;
  startY: number;
  x: number;
  y: number;
  active: boolean;
}

interface Options {
  containerRef: RefObject<HTMLDivElement>;
  disabled: boolean;
  onSelect: (id: string) => void;
  onDrop: (id: string, target: DropTarget) => void;
}

export function useProductReorder({ containerRef, disabled, onSelect, onDrop }: Options) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [target, setTarget] = useState<DropTarget | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const session = useRef<DragSession | null>(null);
  const frame = useRef(0);
  const callbacks = useRef({ disabled, onSelect, onDrop });

  useLayoutEffect(() => { callbacks.current = { disabled, onSelect, onDrop }; }, [disabled, onSelect, onDrop]);

  function hitTest(drag: DragSession): DropTarget | null {
    const container = containerRef.current;
    if (!container) return null;
    const bounds = container.getBoundingClientRect();
    if (drag.x < bounds.left || drag.x > bounds.right || drag.y < bounds.top || drag.y > bounds.bottom) return null;
    const card = document.elementFromPoint(drag.x, drag.y)?.closest<HTMLElement>('[data-reorder-id]');
    if (!card || !container.contains(card) || !card.dataset.reorderId || card.dataset.reorderId === drag.id) return null;
    const rect = card.getBoundingClientRect();
    return { id: card.dataset.reorderId, before: drag.x < rect.left + rect.width / 2 };
  }

  function clearDrag() {
    const current = session.current;
    session.current = null;
    cancelAnimationFrame(frame.current);
    if (current?.handle.hasPointerCapture(current.pointerId)) current.handle.releasePointerCapture(current.pointerId);
    return current;
  }

  function cancel() {
    const current = clearDrag();
    setDraggingId(null);
    setTarget(null);
    return !!current;
  }

  function tick(time: number, previous = time) {
    const drag = session.current;
    const container = containerRef.current;
    if (!drag?.active || !container || callbacks.current.disabled) return;
    const bounds = container.getBoundingClientRect();
    const edge = Math.min(64, bounds.height / 4);
    if (drag.x >= bounds.left && drag.x <= bounds.right && drag.y >= bounds.top && drag.y <= bounds.bottom) {
      const speed = drag.y < bounds.top + edge ? -(1 - (drag.y - bounds.top) / edge) : drag.y > bounds.bottom - edge ? 1 - (bounds.bottom - drag.y) / edge : 0;
      container.scrollTop += speed * Math.min(time - previous, 32) * 0.8;
    }
    const next = hitTest(drag);
    setTarget((current) => current?.id === next?.id && current?.before === next?.before ? current : next);
    if (ghostRef.current) ghostRef.current.style.transform = `translate(${Math.max(0, Math.min(drag.x + 12, window.innerWidth - 100))}px, ${Math.max(0, Math.min(drag.y + 12, window.innerHeight - 110))}px)`;
    frame.current = requestAnimationFrame((now) => tick(now, time));
  }

  function start(event: PointerEvent<HTMLButtonElement>, id: string) {
    if (callbacks.current.disabled || !event.isPrimary || event.button !== 0 || session.current) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    callbacks.current.onSelect(id);
    event.currentTarget.setPointerCapture(event.pointerId);
    session.current = { id, pointerId: event.pointerId, handle: event.currentTarget, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, active: false };
  }

  function move(event: PointerEvent<HTMLButtonElement>) {
    const drag = session.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag.x = event.clientX;
    drag.y = event.clientY;
    if (!drag.active && Math.hypot(drag.x - drag.startX, drag.y - drag.startY) >= 6) {
      drag.active = true;
      setDraggingId(drag.id);
      frame.current = requestAnimationFrame((time) => tick(time));
    }
  }

  function end(event: PointerEvent<HTMLButtonElement>) {
    const drag = session.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag.x = event.clientX;
    drag.y = event.clientY;
    const destination = drag.active ? hitTest(drag) : null;
    clearDrag();
    setDraggingId(null);
    setTarget(null);
    if (destination && !callbacks.current.disabled) callbacks.current.onDrop(drag.id, destination);
  }

  useEffect(() => {
    if (disabled) cancel();
  }, [disabled]);

  useEffect(() => {
    const onBlur = () => cancel();
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('blur', onBlur);
      clearDrag();
    };
  }, []);

  return { draggingId, target, ghostRef, start, move, end, cancel };
}
