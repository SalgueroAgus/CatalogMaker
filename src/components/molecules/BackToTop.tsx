import { useEffect, useState, type RefObject } from 'react';
import { ArrowUp } from 'lucide-react';

interface Props {
  target: RefObject<HTMLElement>;
  label: string;
}

export function BackToTop({ target, label }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = target.current;
    if (!element) return;
    const update = () => setVisible(element.scrollTop > 200);
    update();
    element.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      element.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [target]);

  return (
    <button className="back-to-top" hidden={!visible} aria-label={label} title="Volver arriba" onClick={() => {
      const element = target.current;
      if (!element) return;
      element.focus({ preventScroll: true });
      requestAnimationFrame(() => {
        element.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      });
    }}>
      <ArrowUp size={24} aria-hidden="true" />
    </button>
  );
}
