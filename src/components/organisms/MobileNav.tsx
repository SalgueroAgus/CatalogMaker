import { Eye, FileText, LayoutList, Palette, type LucideIcon } from 'lucide-react';
import { EditorTheme } from '../atoms/EditorTheme';
import type { EditorSection } from './ToolPanel';
import { usePersistenceStore } from '../../store/usePersistenceStore';

export type MobileView = 'preview' | EditorSection;

interface Props {
  activeTab: MobileView;
  onTabChange: (tab: MobileView) => void;
}

const TABS: { id: MobileView; Icon: LucideIcon; label: string }[] = [
  { id: 'preview', Icon: Eye, label: 'Vista previa' },
  { id: 'articles', Icon: LayoutList, label: 'Artículos' },
  { id: 'pages', Icon: FileText, label: 'Páginas' },
  { id: 'design', Icon: Palette, label: 'Diseño' },
];

export function MobileNav({ activeTab, onTabChange }: Props) {
  const busy = usePersistenceStore((s) => s.managing || s.exporting);
  return <EditorTheme className="mobile-nav-region">
    <nav className="mobile-nav" aria-label="Navegación principal">
      {TABS.map(({ id, Icon, label }) => <button key={id} className="mnav-tab" disabled={busy} onClick={() => onTabChange(id)} aria-current={activeTab === id ? 'page' : undefined}>
        <Icon size={20} aria-hidden="true" /><span>{label}</span>
      </button>)}
    </nav>
  </EditorTheme>;
}
