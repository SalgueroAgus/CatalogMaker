import { useEffect, useLayoutEffect, useRef } from 'react';
import { fitTextareaHeight } from '../utils/text';

export function useTextareaAutoHeight(value: string, fontFamily?: string, fontSize?: number) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    fitTextareaHeight(ref.current);
  }, [value, fontFamily, fontSize]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let width = -1;
    const resize = () => fitTextareaHeight(element);
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === width) return;
      width = entry.contentRect.width;
      resize();
    });
    observer.observe(element);
    document.fonts.addEventListener('loadingdone', resize);
    return () => {
      observer.disconnect();
      document.fonts.removeEventListener('loadingdone', resize);
    };
  }, []);

  return ref;
}
