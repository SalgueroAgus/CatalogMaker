import { useRef, useState } from 'react';
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

type SectionKey = 'catalogo' | 'marca' | 'tipografia' | 'pagina';

export function LeftSidebar({
  onExport, isExporting, exportProgress,
  onPublish, isPublishing,
  onDownloadHTML, isDownloading,
  publishProgress, lastPublishUrl,
  userEmail, onLogout,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const [openSections, setOpenSections] = useState<Set<SectionKey>>(
    new Set(['catalogo'])
  );
  const [openColorGroups, setOpenColorGroups] = useState<Set<string>>(
    new Set(['pagina', 'articulos', 'indice'])
  );
  const [fondoMode, setFondoMode] = useState<'color' | 'imagen'>('color');

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

  function toggleSection(key: SectionKey) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleColorGroup(key: string) {
    setOpenColorGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleFondoMode(mode: 'color' | 'imagen') {
    setFondoMode(mode);
    if (mode === 'color') setBgImage(null);
  }

  function SectionHeader({ label, sectionKey }: { label: string; sectionKey: SectionKey }) {
    const isOpen = openSections.has(sectionKey);
    return (
      <button className="sb-accordion-header" onClick={() => toggleSection(sectionKey)}>
        <span>{label}</span>
        <span className={`sb-chevron ${isOpen ? 'open' : ''}`}>▸</span>
      </button>
    );
  }

  return (
    <aside className="sidebar-left">
      <div className="sb-scroll-area">
        <div className="sb-header">
          <h1>🎴 CatalogMaker</h1>
          <div className="sb-user-row">
            <span className="sb-user-email">{userEmail}</span>
            <button className="sb-logout-btn" onClick={onLogout}>Salir</button>
          </div>
        </div>

        <div className="sb-section">
          <SectionHeader label="Catálogo" sectionKey="catalogo" />
          {openSections.has('catalogo') && (
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
              <Button onClick={() => fileInputRef.current?.click()}>➕ Cargar Fotos</Button>
              <Button onClick={addBlankProduct}>📄 Agregar Producto</Button>
            </div>
          )}
        </div>

        <div className="sb-section">
          <SectionHeader label="Marca" sectionKey="marca" />
          {openSections.has('marca') && (
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
          )}
        </div>

        <div className="sb-section">
          <SectionHeader label="Tipografía" sectionKey="tipografia" />
          {openSections.has('tipografia') && (
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
          )}
        </div>

        <div className="sb-section">
          <SectionHeader label="Página" sectionKey="pagina" />
          {openSections.has('pagina') && (
            <div className="sb-accordion-body">
              <div className="sb-subsection-label">Fondo</div>
              <div className="sb-fondo-tabs">
                <button
                  className={`sb-fondo-tab ${fondoMode === 'color' ? 'active' : ''}`}
                  onClick={() => handleFondoMode('color')}
                >
                  Color
                </button>
                <button
                  className={`sb-fondo-tab ${fondoMode === 'imagen' ? 'active' : ''}`}
                  onClick={() => handleFondoMode('imagen')}
                >
                  Imagen
                </button>
              </div>

              {fondoMode === 'color' && (
                <div className="sb-fondo-color">
                  <ColorGroup label="Fondo páginas" colorKey="bg" />
                </div>
              )}

              {fondoMode === 'imagen' && (
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
                    {bgImage ? '🖼 Cambiar imagen' : '📂 Cargar imagen'}
                  </button>
                  {bgImage && (
                    <button className="sb-btn sb-btn-ghost" onClick={() => setBgImage(null)}>
                      ✕ Quitar imagen
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
                    />
                    <span className="sb-opacity-value">
                      {Math.round(bgImageOpacity * 100)}%
                    </span>
                  </div>
                </div>
              )}

              <div className="sb-subsection-label" style={{ marginTop: 10 }}>Colores</div>

              <div className="typo-group">
                <div className="typo-role">
                  <button className="typo-role-header" onClick={() => toggleColorGroup('pagina')}>
                    <span className={`typo-chevron ${openColorGroups.has('pagina') ? 'open' : ''}`}>▸</span>
                    <span className="typo-role-name">Página</span>
                  </button>
                  {openColorGroups.has('pagina') && (
                    <div className="typo-role-body">
                      <ColorGroup label="Nombre empresa" colorKey="company" solidOnly />
                      <ColorGroup label="Numeración" colorKey="pageNum" solidOnly />
                      <ColorGroup label="Separadores" colorKey="divider" solidOnly />
                      <ColorGroup label="Pie de página" colorKey="footer" solidOnly />
                    </div>
                  )}
                </div>

                <div className="typo-role">
                  <button className="typo-role-header" onClick={() => toggleColorGroup('articulos')}>
                    <span className={`typo-chevron ${openColorGroups.has('articulos') ? 'open' : ''}`}>▸</span>
                    <span className="typo-role-name">Artículos</span>
                  </button>
                  {openColorGroups.has('articulos') && (
                    <div className="typo-role-body">
                      <ColorGroup label="Nombre" colorKey="name" solidOnly />
                      <ColorGroup label="Precio" colorKey="price" solidOnly />
                      <ColorGroup label="Descripción" colorKey="desc" solidOnly />
                    </div>
                  )}
                </div>

                <div className="typo-role">
                  <button className="typo-role-header" onClick={() => toggleColorGroup('indice')}>
                    <span className={`typo-chevron ${openColorGroups.has('indice') ? 'open' : ''}`}>▸</span>
                    <span className="typo-role-name">Índice</span>
                  </button>
                  {openColorGroups.has('indice') && (
                    <div className="typo-role-body">
                      <ColorGroup label="Título" colorKey="idxTitle" solidOnly />
                      <ColorGroup label="Entradas" colorKey="idxText" solidOnly />
                      <ColorGroup label="Números / acentos" colorKey="idxAccent" solidOnly />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

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
            🗑 Vaciar Catálogo
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
            ↺ Restablecer Todo
          </Button>
        </div>
        <Button variant="publish" onClick={onPublish} disabled={isPublishing || isDownloading || isExporting}>
          {isPublishing ? (
            <>
              <span className="spinner" /> {publishProgress}
            </>
          ) : (
            '🌐 Publicar en Web'
          )}
        </Button>
        {lastPublishUrl && (
          <a
            href={lastPublishUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sb-publish-url"
          >
            ✓ Ver catálogo publicado →
          </a>
        )}
        <Button variant="export" onClick={onExport} disabled={isExporting || isPublishing || isDownloading}>
          {isExporting ? (
            <>
              <span className="spinner" /> {exportProgress}
            </>
          ) : (
            '📥 Descargar PDF'
          )}
        </Button>
      </div>
    </aside>
  );
}
