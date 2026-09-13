import { usePersistenceStore } from '../../store/usePersistenceStore';
import type { MobileView } from '../organisms/MobileNav';

interface Props {
  header: React.ReactNode;
  tools: React.ReactNode;
  center: React.ReactNode;
  nav: React.ReactNode;
  mobileView: MobileView;
  panelOpen: boolean;
}

export function AppLayout({ header, tools, center, nav, mobileView, panelOpen }: Props) {
  const busy = usePersistenceStore((s) => s.managing || s.exporting);
  return <div className="editor-shell" data-view={mobileView} data-panel-open={panelOpen} data-html2canvas-ignore>
    {header}
    <fieldset className="app-layout" disabled={busy} aria-label="Editor de catálogo" aria-busy={busy}>
      {tools}
      {center}
    </fieldset>
    {nav}
  </div>;
}
