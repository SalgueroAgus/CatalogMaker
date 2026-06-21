import { useRef } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import * as Tabs from '@radix-ui/react-tabs';
import {
  ArrowRight, BookOpen, Check, ChevronRight,
  Download, FilePlus, FolderOpen, Globe,
  Image as ImageIcon, ImagePlus, RotateCcw, Trash2, X,
} from 'lucide-react';
import { Button } from '../atoms/Button';
import { ColorGroup } from '../molecules/ColorGroup';
import { FormField } from '../molecules/FormField';
import { Input } from '../atoms/Input';
import { TypographyRole } from '../molecules/TypographyRole';
import { useProductStore } from '../../store/useProductStore';
import { useSettingsStore } from '../../store/useSettingsStore';

interface Props {
  onExport: () => void;
  isExporting: boolean;
  exportProgress: string;
  onPublish: () => void;
  isPublishing: boolean;
  onDownloadHTML: () => void;
  isDownloading: boolean;
  publishProgress: string;
  lastPublishUrl: string | null;
  userEmail: string;
  onLogout: () => void;
}

export function LeftSidebar({
  onExport, isExporting, exportProgress,
  onPublish, isPublishing,
  onDownloadHTML: _onDownloadHTML, isDownloading,
  publishProgress, lastPublishUrl,
  userEmail, onLogout,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const addProducts     = useProductStore((s) => s.addProducts);
  const addBlankProduct = useProductStore((s) => s.addBlankProduct);
  const resetCatalog    = useProductStore((s) => s.resetCatalog);
  const products        = useProductStore((s) => s.products);
  const resetSettings   = useSettingsStore((s) => s.resetSettings);

  const storeName = useSettingsStore((s) => s.storeName);
  const footerContact = useSettingsStore((s) => s.footerContact);
  const bgImage = useSettingsStore((s) => s.bgImage);
  const bgImageOpacity = useSettingsStore((s) => s.bgImageOpacity);
  const updateStoreName = useSettingsStore((s) => s.updateStoreName);
  const updateContact = useSettingsStore((s) => s.updateContact);
  const setBgImage = useSettingsStore((s) => s.setBgImage);
  const setBgImageOpacity = useSettingsStore((s) => s.setBgImageOpacity);

  function handleFondoMode(mode: string) {
    if (mode === 'color') setBgImage(null);
  }

  return (
    <aside className="sidebar-left">
      <div className="sb-scroll-area">
        <div className="sb-header">
          <h1><BookOpen size={20} aria-hidden="true" /> CatalogMaker</h1>
          <div className="sb-user-row">
            <span className="sb-user-email">{userEmail}</span>
            <button className="sb-logout-btn" onClick={onLogout}>Salir</button>
          </div>
        </div>

        <Accordion.Root type="multiple" defaultValue={['catalogo']} className="sb-stack">

          <Accordion.Item value="catalogo" className="sb-section">
            <Accordion.Trigger className="sb-accordion-header">
              <span>Catálogo</span>
              <ChevronRight className="sb-chevron" size={12} aria-hidden="true" />
            </Accordion.Trigger>
            <Accordion.Content>
              <div className="sb-accordion-body sb-stack-sm">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    addProducts(Array.from(e.target.files ?? []));
                    e.target.value = '';
                  }}
                />
                <Button onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus size={14} aria-hidden="true" /> Cargar Fotos
                </Button>
                <Button onClick={addBlankProduct}>
                  <FilePlus size={14} aria-hidden="true" /> Agregar Producto
                </Button>
              </div>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="marca" className="sb-section">
            <Accordion.Trigger className="sb-accordion-header">
              <span>Marca</span>
              <ChevronRight className="sb-chevron" size={12} aria-hidden="true" />
            </Accordion.Trigger>
            <Accordion.Content>
              <div className="sb-accordion-body sb-stack-sm">
                <FormField label="Empresa">
                  <Input
                    value={storeName}
                    onChange={(e) => updateStoreName(e.target.value)}
                    style={{ textTransform: 'uppercase' }}
                  />
                </FormField>
                <FormField label="Contacto">
                  <Input
                    value={footerContact}
                    onChange={(e) => updateContact(e.target.value)}
                  />
                </FormField>
              </div>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="tipografia" className="sb-section">
            <Accordion.Trigger className="sb-accordion-header">
              <span>Tipografía</span>
              <ChevronRight className="sb-chevron" size={12} aria-hidden="true" />
            </Accordion.Trigger>
            <Accordion.Content>
              <div className="sb-accordion-body">
                <div className="typo-group">
                  <span className="typo-group-label">Página</span>
                  <TypographyRole label="Nombre empresa" fontKey="company" sizeKey="company" sizeMin={5} sizeMax={50} />
                  <TypographyRole label="Pie de página" fontKey="small" sizeKey="small" sizeMin={5} sizeMax={50} />
                  <TypographyRole label="Numeración de página" fontKey="pageNum" sizeKey="pageNum" sizeMin={5} sizeMax={50} />
                </div>
                <div className="typo-group">
                  <span className="typo-group-label">Artículos</span>
                  <TypographyRole label="Nombre del artículo" fontKey="heading" sizeKey="heading" sizeMin={5} sizeMax={50} />
                  <TypographyRole label="Precio" fontKey="price" sizeKey="price" sizeMin={5} sizeMax={50} />
                  <TypographyRole label="Descripción" fontKey="body" sizeKey="body" sizeMin={5} sizeMax={50} />
                </div>
                <div className="typo-group">
                  <span className="typo-group-label">Índice</span>
                  <TypographyRole label="Título principal" fontKey="idxTitle" sizeKey="idxTitle" sizeMin={5} sizeMax={50} />
                  <TypographyRole label="Subtítulo «Índice»" fontKey="idxSubtitle" sizeKey="idxSubtitle" sizeMin={5} sizeMax={50} />
                  <TypographyRole label="Entradas de lista" fontKey="idxEntry" sizeKey="idxEntry" sizeMin={5} sizeMax={50} />
                  <TypographyRole label="Numeración" fontKey="idxNum" sizeKey="idxNum" sizeMin={5} sizeMax={50} />
                </div>
              </div>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="pagina" className="sb-section">
            <Accordion.Trigger className="sb-accordion-header">
              <span>Página</span>
              <ChevronRight className="sb-chevron" size={12} aria-hidden="true" />
            </Accordion.Trigger>
            <Accordion.Content>
              <div className="sb-accordion-body">
                <div className="sb-subsection-label">Fondo</div>

                <Tabs.Root
                  defaultValue={bgImage ? 'imagen' : 'color'}
                  onValueChange={handleFondoMode}
                >
                  <Tabs.List className="sb-fondo-tabs">
                    <Tabs.Trigger value="color" className="sb-fondo-tab">Color</Tabs.Trigger>
                    <Tabs.Trigger value="imagen" className="sb-fondo-tab">Imagen</Tabs.Trigger>
                  </Tabs.List>
                  <Tabs.Content value="color" className="sb-fondo-color">
                    <ColorGroup label="Fondo páginas" colorKey="bg" />
                  </Tabs.Content>
                  <Tabs.Content value="imagen">
                    <div className="sb-stack-sm">
                      <input
                        ref={bgFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setBgImage(file);
                          e.target.value = '';
                        }}
                      />
                      <button
                        className={`sb-bg-upload ${bgImage ? 'has-image' : ''}`}
                        onClick={() => bgFileInputRef.current?.click()}
                      >
                        {bgImage
                          ? <><ImageIcon size={14} aria-hidden="true" /> Cambiar imagen</>
                          : <><FolderOpen size={14} aria-hidden="true" /> Cargar imagen</>}
                      </button>
                      {bgImage && (
                        <button className="sb-btn sb-btn-ghost" onClick={() => setBgImage(null)}>
                          <X size={14} aria-hidden="true" /> Quitar imagen
                        </button>
                      )}
                      <div className="sb-opacity-row">
                        <span className="sb-opacity-label">Opacidad</span>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={bgImageOpacity}
                          onChange={(e) => setBgImageOpacity(Number(e.target.value))}
                          className="sb-opacity-slider"
                          aria-label="Opacidad de imagen de fondo"
                        />
                        <span className="sb-opacity-value" aria-live="polite">
                          {Math.round(bgImageOpacity * 100)}%
                        </span>
                      </div>
                    </div>
                  </Tabs.Content>
                </Tabs.Root>

                <div className="sb-subsection-label" style={{ marginTop: 10 }}>Colores</div>

                <Accordion.Root
                  type="multiple"
                  defaultValue={['pagina-col', 'articulos-col', 'indice-col']}
                  className="typo-group"
                >
                  <Accordion.Item value="pagina-col" className="typo-role">
                    <Accordion.Trigger className="typo-role-header">
                      <ChevronRight className="typo-chevron" size={12} aria-hidden="true" />
                      <span className="typo-role-name">Página</span>
                    </Accordion.Trigger>
                    <Accordion.Content>
                      <div className="typo-role-body">
                        <ColorGroup label="Nombre empresa" colorKey="company" solidOnly />
                        <ColorGroup label="Numeración" colorKey="pageNum" solidOnly />
                        <ColorGroup label="Separadores" colorKey="divider" solidOnly />
                        <ColorGroup label="Pie de página" colorKey="footer" solidOnly />
                      </div>
                    </Accordion.Content>
                  </Accordion.Item>

                  <Accordion.Item value="articulos-col" className="typo-role">
                    <Accordion.Trigger className="typo-role-header">
                      <ChevronRight className="typo-chevron" size={12} aria-hidden="true" />
                      <span className="typo-role-name">Artículos</span>
                    </Accordion.Trigger>
                    <Accordion.Content>
                      <div className="typo-role-body">
                        <ColorGroup label="Nombre" colorKey="name" solidOnly />
                        <ColorGroup label="Precio" colorKey="price" solidOnly />
                        <ColorGroup label="Descripción" colorKey="desc" solidOnly />
                      </div>
                    </Accordion.Content>
                  </Accordion.Item>

                  <Accordion.Item value="indice-col" className="typo-role">
                    <Accordion.Trigger className="typo-role-header">
                      <ChevronRight className="typo-chevron" size={12} aria-hidden="true" />
                      <span className="typo-role-name">Índice</span>
                    </Accordion.Trigger>
                    <Accordion.Content>
                      <div className="typo-role-body">
                        <ColorGroup label="Título" colorKey="idxTitle" solidOnly />
                        <ColorGroup label="Entradas" colorKey="idxText" solidOnly />
                        <ColorGroup label="Números / acentos" colorKey="idxAccent" solidOnly />
                      </div>
                    </Accordion.Content>
                  </Accordion.Item>
                </Accordion.Root>

              </div>
            </Accordion.Content>
          </Accordion.Item>

        </Accordion.Root>
      </div>

      <div className="sb-export-footer">
        <div className="sb-footer-actions">
          <Button
            variant="danger"
            disabled={products.length === 0}
            onClick={() => {
              if (confirm('Se eliminarán todos los productos. ¿Continuar?')) resetCatalog();
            }}
          >
            <Trash2 size={14} aria-hidden="true" /> Vaciar Catálogo
          </Button>
          <Button
            variant="reset"
            onClick={() => {
              if (confirm('Se eliminarán todos los productos y se restablecerá la configuración. ¿Continuar?')) {
                resetCatalog();
                resetSettings();
              }
            }}
          >
            <RotateCcw size={14} aria-hidden="true" /> Restablecer Todo
          </Button>
        </div>
        <Button variant="publish" onClick={onPublish} disabled={isPublishing || isDownloading || isExporting}>
          {isPublishing
            ? <><span className="spinner" aria-hidden="true" /> {publishProgress}</>
            : <><Globe size={14} aria-hidden="true" /> Publicar en Web</>}
        </Button>
        {lastPublishUrl && (
          <a
            href={lastPublishUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sb-publish-url"
          >
            <Check size={14} aria-hidden="true" /> Ver catálogo publicado <ArrowRight size={12} aria-hidden="true" />
          </a>
        )}
        <Button variant="export" onClick={onExport} disabled={isExporting || isPublishing || isDownloading}>
          {isExporting
            ? <><span className="spinner" aria-hidden="true" /> {exportProgress}</>
            : <><Download size={14} aria-hidden="true" /> Descargar PDF</>}
        </Button>
      </div>
    </aside>
  );
}
