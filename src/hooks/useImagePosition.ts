import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useProductStore } from '../store/useProductStore';
import { usePersistenceStore } from '../store/usePersistenceStore';
import { PLACEHOLDER_IMG } from '../utils/image';
import type { Product } from '../types';

interface Drag {
  pointerId: number;
  element: HTMLDivElement;
  startY: number;
  startPosition: number;
  freeSpace: number;
  position: number;
}

export function useImagePosition(product: Product) {
  const busy = usePersistenceStore((s) => s.managing || s.exporting);
  const setImagePosition = useProductStore((s) => s.setImagePosition);
  const drag = useRef<Drag | null>(null);
  const [draft, setDraft] = useState<number | null>(null);
  const storedPosition = product.imagePositionY ?? 50;
  const enabled = !busy && product.image !== PLACEHOLDER_IMG;

  function cancel() {
    const current = drag.current;
    drag.current = null;
    setDraft(null);
    if (current?.element.hasPointerCapture(current.pointerId)) current.element.releasePointerCapture(current.pointerId);
  }

  useEffect(() => {
    cancel();
    window.addEventListener('blur', cancel);
    window.addEventListener('resize', cancel);
    return () => {
      window.removeEventListener('blur', cancel);
      window.removeEventListener('resize', cancel);
      const current = drag.current;
      drag.current = null;
      if (current?.element.hasPointerCapture(current.pointerId)) current.element.releasePointerCapture(current.pointerId);
    };
  }, [busy, product.id, product.image, storedPosition]);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!enabled || event.pointerType !== 'mouse' || event.button !== 0 || !event.isPrimary || drag.current || window.innerWidth < 768) return;
    const image = event.currentTarget.querySelector('img');
    if (!image || event.target !== image || !image.complete || !image.naturalHeight) return;
    const freeSpace = event.currentTarget.getBoundingClientRect().height - image.getBoundingClientRect().height;
    if (freeSpace < 1) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, element: event.currentTarget, startY: event.clientY, startPosition: storedPosition, freeSpace, position: storedPosition };
    setDraft(storedPosition);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!enabled || !current || current.pointerId !== event.pointerId) return;
    current.position = Math.max(0, Math.min(100, current.startPosition + (event.clientY - current.startY) / current.freeSpace * 100));
    setDraft(current.position);
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const position = current.position;
    cancel();
    if (enabled) void setImagePosition(product.id, position);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && drag.current) {
      event.preventDefault();
      cancel();
      return;
    }
    if (!enabled || drag.current) return;
    const positions: Record<string, number> = { ArrowUp: storedPosition - 5, ArrowDown: storedPosition + 5, Home: 0, End: 100 };
    const position = positions[event.key];
    if (position === undefined) return;
    event.preventDefault();
    void setImagePosition(product.id, Math.max(0, Math.min(100, position)));
  }

  return {
    busy,
    enabled,
    position: enabled ? draft ?? storedPosition : storedPosition,
    dragging: draft !== null,
    center: () => { cancel(); void setImagePosition(product.id, 50); },
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: cancel, onLostPointerCapture: cancel, onBlur: cancel, onKeyDown },
  };
}
