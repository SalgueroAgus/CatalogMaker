import { useEffect, useRef, useState } from 'react';
import { Dialog, DropdownMenu, Flex } from '@radix-ui/themes';
import { BookOpen, ChevronDown, Download, ExternalLink, Globe, MoreHorizontal, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { usePersistenceStore } from '../../store/usePersistenceStore';
import { useProductStore } from '../../store/useProductStore';
import { Button } from '../atoms/Button';
import { EditorTheme } from '../atoms/EditorTheme';
import { SaveStatus } from '../molecules/SaveStatus';
import { CatalogManagement } from '../molecules/CatalogManagement';
import { useCatalogStore } from '../../store/useCatalogStore';
import { CatalogManager } from './CatalogManager';
import { ThemeSwitch } from '../molecules/ThemeSwitch';
import { useUIThemeStore } from '../../store/useUIThemeStore';

interface Props {
  panelOpen: boolean;
  onTogglePanel: () => void;
  onExport: () => void;
  onPublish: () => void;
  exportProgress: string;
  publishProgress: string;
  isExporting: boolean;
  isPublishing: boolean;
  lastPublishUrl: string | null;
  userEmail: string;
  onLogout: () => void;
}

export function EditorHeader(props: Props) {
  const catalogRef = useRef<HTMLButtonElement>(null);
  const [catalogsOpen, setCatalogsOpen] = useState(false);
  const { activeId, mainId, catalogs, epoch, operationError } = useCatalogStore();
  const catalogName = catalogs.find((item) => item.id === activeId)?.name ?? 'Catálogo actual';
  const conflict = usePersistenceStore((s) => s.saving === 'conflict');
  const menuRef = useRef<HTMLButtonElement>(null);
  const [managementOpen, setManagementOpen] = useState(false);
  const busy = usePersistenceStore((s) => s.managing || s.exporting);
  useEffect(() => { setManagementOpen(false); setCatalogsOpen(false); }, [epoch]);
  const count = useProductStore((s) => s.products.length);
  const disabled = busy || count === 0;
  const themeError = useUIThemeStore((s) => s.persistenceError);
  return <EditorTheme className="header-region">
    <header className="editor-header">
      <Button className="panel-toggle" disabled={busy} aria-label={props.panelOpen ? 'Ocultar herramientas' : 'Mostrar herramientas'} aria-expanded={props.panelOpen} aria-controls="editor-tools" onClick={props.onTogglePanel}>
        {props.panelOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
      </Button>
      <h1 className="editor-brand"><BookOpen size={24} /><span>CatalogMaker</span></h1>
      <Button ref={catalogRef} className="catalog-selector" disabled={busy} aria-label={`Mis catálogos: ${catalogName}`} onClick={() => setCatalogsOpen(true)}><span>{catalogName}</span>{activeId === mainId && <span className="catalog-badge">Principal</span>}<ChevronDown size={16} /></Button>
      <div className="header-preferences">
        <div className="header-save"><SaveStatus compact /></div>
        <ThemeSwitch />
      </div>
      <div className="header-exports">
        {props.lastPublishUrl && <a className="published-link" href={props.lastPublishUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} />Ver publicado</a>}
        <Button onClick={props.onPublish} disabled={disabled || conflict || activeId !== mainId}><Globe size={18} />{props.isPublishing ? props.publishProgress : 'Publicar en Web'}</Button>
        <Button data-export-trigger variant="export" onClick={props.onExport} disabled={disabled}><Download size={18} />{props.isExporting ? props.exportProgress : 'Descargar PDF'}</Button>
      </div>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger><Button data-export-trigger className="mobile-export" disabled={busy} aria-label="Exportar catálogo"><Download size={18} /><ChevronDown size={14} /></Button></DropdownMenu.Trigger>
        <DropdownMenu.Content className="editor-ui">
          <DropdownMenu.Item disabled={disabled} onSelect={props.onExport}>Descargar PDF</DropdownMenu.Item>
          <DropdownMenu.Item disabled={disabled || conflict || activeId !== mainId} onSelect={props.onPublish}>Publicar en Web</DropdownMenu.Item>
          {props.lastPublishUrl && <DropdownMenu.Item asChild><a href={props.lastPublishUrl} target="_blank" rel="noopener noreferrer">Ver catálogo publicado</a></DropdownMenu.Item>}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger><Button ref={menuRef} aria-label="Menú del catálogo" disabled={busy}><MoreHorizontal size={20} /></Button></DropdownMenu.Trigger>
        <DropdownMenu.Content className="editor-ui">
          {props.userEmail && <DropdownMenu.Label>{props.userEmail}</DropdownMenu.Label>}
          <DropdownMenu.Item disabled={busy} onSelect={() => setManagementOpen(true)}>Administración del catálogo</DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item disabled={busy} onSelect={props.onLogout}>Salir</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </header>
    {themeError && <p className="theme-notice" role="status">No se pudo recordar el modo elegido. Se mantendrá mientras esta página esté abierta.</p>}
    <SaveStatus errorsOnly />
    {operationError && !catalogsOpen && <p className="save-status save-error" role="alert">{operationError}</p>}
    {(props.isExporting || props.isPublishing) && <p className="operation-progress" role="status">{props.isExporting ? props.exportProgress : props.publishProgress}</p>}
    <Dialog.Root open={catalogsOpen} onOpenChange={setCatalogsOpen}>
      <Dialog.Content className="editor-ui ui-dialog catalog-dialog" maxWidth="760px" onCloseAutoFocus={(event) => { event.preventDefault(); catalogRef.current?.focus(); }}>
        <Dialog.Title>Mis catálogos</Dialog.Title>
        <Dialog.Description size="3">Elegí un catálogo, hacé una copia o guardá un respaldo completo.</Dialog.Description>
        <CatalogManager />
        <Flex justify="end" mt="4"><Dialog.Close><Button>Cerrar</Button></Dialog.Close></Flex>
      </Dialog.Content>
    </Dialog.Root>
    <Dialog.Root open={managementOpen} onOpenChange={setManagementOpen}>
      <Dialog.Content className="editor-ui ui-dialog" maxWidth="520px" onCloseAutoFocus={(event) => { event.preventDefault(); menuRef.current?.focus(); }}>
        <Dialog.Title>Administración del catálogo</Dialog.Title>
        <Dialog.Description size="3">Administrá los artículos y los ajustes de este catálogo.</Dialog.Description>
        <CatalogManagement />
        <SaveStatus errorsOnly />
        <Flex justify="end" mt="4"><Dialog.Close><Button>Cerrar</Button></Dialog.Close></Flex>
      </Dialog.Content>
    </Dialog.Root>
  </EditorTheme>;
}
