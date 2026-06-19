import { useEffect } from 'react';

const A4_PX = 793.7; // 210mm at 96 dpi

export function usePageScale() {
  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      const isMobile = w < 768;
      const isTablet = w >= 768 && w < 1200;

      if (!isMobile && !isTablet) {
        document.documentElement.style.removeProperty('--page-scale');
        return;
      }

      const leftSidebarWidth = isMobile ? 0 : 260;
      const workspacePadding = isMobile ? 24 : 40;
      const availableWidth = w - leftSidebarWidth - workspacePadding;
      const scale = Math.min(1, availableWidth / A4_PX);
      document.documentElement.style.setProperty('--page-scale', scale.toFixed(4));
    }

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
}
