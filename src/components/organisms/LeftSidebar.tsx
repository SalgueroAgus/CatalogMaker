import { useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { FormField } from '../molecules/FormField';
import { ColorGroup } from '../molecules/ColorGroup';
import { TypographyRole } from '../molecules/TypographyRole';
import { useProductStore } from '../../store/useProductStore';
import { useSettingsStore } from '../../store/useSettingsStore';

interface Props {
  onExport: () => void;
  isExporting: boolean;
  exportProgress: string;
}

type SectionKey = 'catalogo' | 'marca' | 'tipografia' | 'pagina';

export function LeftSidebar({ onExport, isExporting, exportProgress }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const [openSections, setOpenSections] = useState<Set<SectionKey>>(
    new Set(['catalogo'])
  );
  const [fondoMode, setFondoMode] = useState<'color' | 'imagen'>('color');

  const addProducts = useProductStore((s) => s.addProducts);
  const addBlankProduct = useProductStore((s) => s.addBlankProduct);
  const resetCatalog = useProductStore((s) => s.resetCatalog);
  const products = useProductStore((s) => s.products);

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
          <h1>🎴 CatalogFlow Pro</h1>
          <p>Offline</p>
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
              <Button
                variant="ghost"
                onClick={() => {
                  if (products.length === 0) return;
                  if (confirm('Se eliminarán todos los productos. ¿Continuar?')) resetCatalog();
                }}
              >
                🗑 Vaciar Catálogo
              </Button>
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
              <div className="color-grid">
                <ColorGroup label="Acento primario" colorKey="primary"  />
                <ColorGroup label="Acento secundario" colorKey="secondary"  />
                <ColorGroup label="Texto" colorKey="text"  />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sb-export-footer">
        <Button variant="export" onClick={onExport} disabled={isExporting}>
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
