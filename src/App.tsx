import { useCallback, useRef, useState } from 'react';
import { AppLayout } from './components/templates/AppLayout';
import { LeftSidebar } from './components/organisms/LeftSidebar';
import { Workspace } from './components/organisms/Workspace';
import { RightSidebar } from './components/organisms/RightSidebar';
import { MobileNav } from './components/organisms/MobileNav';
import { usePDF } from './hooks/usePDF';
import { usePageScale } from './hooks/usePageScale';

type Tab = 'preview' | 'settings' | 'products';

export default function App() {
  const pagesRef = useRef<(HTMLDivElement | null)[]>([]);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const [sidebarRightOpen, setSidebarRightOpen] = useState(false);

  const { exportToPDF, isExporting, progress } = usePDF(pagesRef);

  usePageScale();

  function switchTab(tab: Tab) {
    document.body.classList.remove('tab-preview', 'tab-settings', 'tab-products');
    document.body.classList.add(`tab-${tab}`);
    setActiveTab(tab);
  }

  function toggleRightSidebar() {
    setSidebarRightOpen((prev) => {
      document.body.classList.toggle('sidebar-right-open', !prev);
      return !prev;
    });
  }

  const handleVisibleChange = useCallback((ids: Set<string>) => {
    setVisibleIds(ids);
  }, []);

  return (
    <AppLayout
      left={
        <LeftSidebar
          onExport={exportToPDF}
          isExporting={isExporting}
          exportProgress={progress}
        />
      }
      center={
        <Workspace
          pagesRef={pagesRef}
          onVisibleChange={handleVisibleChange}
          sidebarRightOpen={sidebarRightOpen}
          onToggleRightSidebar={toggleRightSidebar}
        />
      }
      right={<RightSidebar visibleIds={visibleIds} />}
      nav={<MobileNav activeTab={activeTab} onTabChange={switchTab} />}
    />
  );
}
