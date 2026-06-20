import { useCallback, useEffect, useRef, useState } from 'react';
import { AppLayout } from './components/templates/AppLayout';
import { LeftSidebar } from './components/organisms/LeftSidebar';
import { Workspace } from './components/organisms/Workspace';
import { RightSidebar } from './components/organisms/RightSidebar';
import { MobileNav } from './components/organisms/MobileNav';
import { usePDF } from './hooks/usePDF';
import { usePublish } from './hooks/usePublish';
import { usePageScale } from './hooks/usePageScale';
import { useProductStore } from './store/useProductStore';
import { useSettingsStore } from './store/useSettingsStore';
import { dbLoadProducts, dbLoadBgImage, dbLoadSettings } from './db';

type Tab = 'preview' | 'settings' | 'products';

export default function App() {
  const pagesRef = useRef<(HTMLDivElement | null)[]>([]);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const [sidebarRightOpen, setSidebarRightOpen] = useState(false);

  const { exportToPDF, isExporting, progress } = usePDF(pagesRef);
  const { publish, downloadHTML, isPublishing, isDownloading, progress: publishProgress, lastUrl: lastPublishUrl } = usePublish(pagesRef);
  const hydrateProducts  = useProductStore((s) => s.hydrateProducts);
  const hydrateSettings  = useSettingsStore((s) => s.hydrateSettings);

  usePageScale();

  useEffect(() => {
    dbLoadProducts().then(hydrateProducts).catch(console.error);
    Promise.all([dbLoadSettings(), dbLoadBgImage()])
      .then(([settings, bgImageUrl]) => {
        if (settings) hydrateSettings(settings, bgImageUrl);
      })
      .catch(console.error);
  }, []);

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
          onPublish={publish}
          isPublishing={isPublishing}
          onDownloadHTML={downloadHTML}
          isDownloading={isDownloading}
          publishProgress={publishProgress}
          lastPublishUrl={lastPublishUrl}
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
