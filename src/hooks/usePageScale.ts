import { useEffect, type RefObject } from 'react';

const A4_PX = 210 * 96 / 25.4;

export function usePageScale(workspaceRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const update = () => {
      if (!workspace.clientWidth) return;
      const style = getComputedStyle(workspace);
      const available = workspace.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const scale = Math.min(1, Math.max(0.01, available / A4_PX));
      document.documentElement.style.setProperty('--page-scale', scale.toFixed(4));
    };
    const observer = new ResizeObserver(update);
    observer.observe(workspace);
    update();
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--page-scale');
    };
  }, [workspaceRef]);
}
