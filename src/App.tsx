import { useCallback, useEffect, useRef, useState } from 'react';
import { AppLayout } from './components/templates/AppLayout';
import { EditorHeader } from './components/organisms/EditorHeader';
import { ToolPanel, type EditorSection } from './components/organisms/ToolPanel';
import { EditorTheme } from './components/atoms/EditorTheme';
import { AlertDialog, Flex } from '@radix-ui/themes';
import { Button } from './components/atoms/Button';
import { LoginPage } from './components/organisms/LoginPage';
import { Workspace } from './components/organisms/Workspace';
import { MobileNav, type MobileView } from './components/organisms/MobileNav';
import { usePDF } from './hooks/usePDF';
import { usePublish } from './hooks/usePublish';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useIdentity } from './hooks/useIdentity';
import { hydrateCatalog } from './store/catalogSession';
import { usePersistenceStore } from './store/usePersistenceStore';
import { SaveStatus } from './components/molecules/SaveStatus';
import { scrollToProduct } from './utils/scroll';

export default function App() {
  const { user, loading, openLogin, logout } = useIdentity();
  const pagesRef = useRef<(HTMLDivElement | null)[]>([]);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [mobileView, setMobileView] = useState<MobileView>('preview');
  const [section, setSection] = useState<EditorSection>('articles');
  const [panelOpen, setPanelOpen] = useState(true);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const { exportToPDF, isExporting, progress, error: pdfError, clearError: clearPDFError } = usePDF(pagesRef);
  const { publish, isPublishing, progress: publishProgress, lastUrl: lastPublishUrl, error: publishError, clearError: clearPublishError } = usePublish(pagesRef);
  const loadState = usePersistenceStore((s) => s.loading);

  useEffect(() => {
    void hydrateCatalog();
  }, []);

  function switchView(view: MobileView) {
    setMobileView(view);
    if (view !== 'preview') { setSection(view); setPanelOpen(true); }
  }

  function showProduct(id: string) {
    setMobileView('preview');
    requestAnimationFrame(() => scrollToProduct(id));
  }

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

  if (loadState !== 'ready') return <EditorTheme className="startup-status"><SaveStatus /></EditorTheme>;

  return <>
    <AppLayout
      panelOpen={panelOpen}
      mobileView={mobileView}
      header={<EditorHeader panelOpen={panelOpen} onTogglePanel={() => setPanelOpen((value) => !value)} onExport={exportToPDF} onPublish={publish} isExporting={isExporting} exportProgress={progress} isPublishing={isPublishing} publishProgress={publishProgress} lastPublishUrl={lastPublishUrl} userEmail={user?.email ?? ''} onLogout={logout} />}
      tools={<ToolPanel section={section} onSectionChange={switchView} active={isMobile ? mobileView !== 'preview' : panelOpen} visibleIds={visibleIds} onShowProduct={showProduct} />}
      center={<Workspace pagesRef={pagesRef} onVisibleChange={handleVisibleChange} />}
      nav={<MobileNav activeTab={mobileView} onTabChange={switchView} />}
    />
    <EditorTheme className="notice-region">
      <AlertDialog.Root open={!!(pdfError || publishError)} onOpenChange={(open) => { if (!open) { clearPDFError(); clearPublishError(); } }}>
        <AlertDialog.Content className="editor-ui ui-dialog" maxWidth="440px" onCloseAutoFocus={(event) => {
          event.preventDefault();
          Array.from(document.querySelectorAll<HTMLButtonElement>('[data-export-trigger]')).find((button) => button.getClientRects().length)?.focus();
        }}>
          <AlertDialog.Title>No se pudo completar la operación</AlertDialog.Title>
          <AlertDialog.Description size="3">{pdfError || publishError}</AlertDialog.Description>
          <Flex justify="end" mt="4"><AlertDialog.Cancel><Button>Entendido</Button></AlertDialog.Cancel></Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </EditorTheme>
  </>;
}
