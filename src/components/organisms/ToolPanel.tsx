import { useRef } from 'react';
import { Tabs } from '@radix-ui/themes';
import { FileText, LayoutList, Palette } from 'lucide-react';
import { EditorTheme } from '../atoms/EditorTheme';
import { ColorPickerActivity } from '../atoms/GradientPickerPopover';
import { BackToTop } from '../molecules/BackToTop';
import { ArticulosTab } from './ArticulosTab';
import { PaginasTab } from './PaginasTab';
import { DesignPanel } from './DesignPanel';

export type EditorSection = 'articles' | 'pages' | 'design';

interface Props {
  section: EditorSection;
  onSectionChange: (section: EditorSection) => void;
  active: boolean;
  visibleIds: Set<string>;
  onShowProduct: (id: string) => void;
}

export function ToolPanel({ section, onSectionChange, active, visibleIds, onShowProduct }: Props) {
  const articlesRef = useRef<HTMLDivElement>(null);
  return <EditorTheme className="tools-region">
    <aside id="editor-tools" className="tool-panel" aria-label="Herramientas del catálogo">
      <Tabs.Root value={section} onValueChange={(value) => onSectionChange(value as EditorSection)} className="tool-tabs">
        <Tabs.List className="tool-tab-list" aria-label="Secciones del editor">
          <Tabs.Trigger value="articles"><LayoutList size={17} />Artículos</Tabs.Trigger>
          <Tabs.Trigger value="pages"><FileText size={17} />Páginas</Tabs.Trigger>
          <Tabs.Trigger value="design"><Palette size={17} />Diseño</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="articles" forceMount hidden={section !== 'articles'} className="tool-content articles-content" ref={articlesRef} tabIndex={-1} aria-label="Artículos">
          <ColorPickerActivity.Provider value={active && section === 'articles'}>
            <ArticulosTab active={active && section === 'articles'} visibleIds={visibleIds} onShowProduct={onShowProduct} />
          </ColorPickerActivity.Provider>
          <BackToTop target={articlesRef} label="Volver arriba en Artículos" />
        </Tabs.Content>
        <Tabs.Content value="pages" forceMount hidden={section !== 'pages'} className="tool-content pages-content"><PaginasTab /></Tabs.Content>
        <Tabs.Content value="design" forceMount hidden={section !== 'design'} className="tool-content">
          <ColorPickerActivity.Provider value={active && section === 'design'}><DesignPanel /></ColorPickerActivity.Provider>
        </Tabs.Content>
      </Tabs.Root>
    </aside>
  </EditorTheme>;
}
