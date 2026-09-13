import { useCallback, useEffect, useRef, useState } from 'react';
import { AppLayout } from './components/templates/AppLayout';
import { LeftSidebar } from './components/organisms/LeftSidebar';
import { LoginPage } from './components/organisms/LoginPage';
import { Workspace } from './components/organisms/Workspace';
import { RightSidebar } from './components/organisms/RightSidebar';
import { MobileNav } from './components/organisms/MobileNav';
import { usePDF } from './hooks/usePDF';
import { usePublish } from './hooks/usePublish';
import { usePageScale } from './hooks/usePageScale';
import { useIdentity } from './hooks/useIdentity';
import { hydrateCatalog } from './store/catalogSession';
import { usePersistenceStore } from './store/usePersistenceStore';
import { SaveStatus } from './components/molecules/SaveStatus';
import { scrollToProduct } from './utils/scroll';

type Tab = 'preview' | 'settings' | 'products';

export default function App() {
  const { user, loading, openLogin, logout } = useIdentity();
  const pagesRef = useRef<(HTMLDivElement | null)[]>([]);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const [sidebarRightOpen, setSidebarRightOpen] = useState(false);

  const { exportToPDF, isExporting, progress } = usePDF(pagesRef);
  const { publish, downloadHTML, isPublishing, isDownloading, progress: publishProgress, lastUrl: lastPublishUrl } = usePublish(pagesRef);
  const loadState = usePersistenceStore((s) => s.loading);

  usePageScale();

  useEffect(() => {
    void hydrateCatalog();
  }, []);

  function switchTab(tab: Tab) {
    document.body.classList.remove('tab-preview', 'tab-settings', 'tab-products');
    document.body.classList.add(`tab-${tab}`);
    setActiveTab(tab);
  }

  function showProduct(id: string) {
    switchTab('preview');
    document.body.classList.remove('sidebar-right-open');
    setSidebarRightOpen(false);
    requestAnimationFrame(() => scrollToProduct(id));
  }

  function toggleRightSidebar() {
    const next = !sidebarRightOpen;
    document.body.classList.toggle('sidebar-right-open', next);
    setSidebarRightOpen(next);
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(next ? '[data-drawer-close]' : '.sidebar-right-toggle')?.focus());
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && sidebarRightOpen) toggleRightSidebar();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sidebarRightOpen]);

  useEffect(() => {
    const onUnload = (event: BeforeUnloadEvent) => {
      if (usePersistenceStore.getState().saving !== 'saved') {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  const handleVisibleChange = useCallback((ids: Set<string>) => {
    setVisibleIds(ids);
  }, []);

  if (!import.meta.env.DEV && (loading || !user)) {
    return <LoginPage onLogin={openLogin} loading={loading} />;
  }

  if (loadState !== 'ready') return <div className="startup-status"><SaveStatus /></div>;

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
          userEmail={user?.email ?? ''}
          onLogout={logout}
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
      right={<RightSidebar visibleIds={visibleIds} onClose={toggleRightSidebar} onShowProduct={showProduct} />}
      nav={<MobileNav activeTab={activeTab} onTabChange={switchTab} />}
    />
  );
}
