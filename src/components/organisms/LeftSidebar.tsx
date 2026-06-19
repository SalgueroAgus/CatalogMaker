import { useRef } from 'react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Toggle } from '../atoms/Toggle';
import { FormField } from '../molecules/FormField';
import { ColorGroup } from '../molecules/ColorGroup';
import { FontSelector } from '../molecules/FontSelector';
import { useProductStore } from '../../store/useProductStore';
import { useSettingsStore } from '../../store/useSettingsStore';

interface Props {
  onExport: () => void;
  isExporting: boolean;
  exportProgress: string;
}

export function LeftSidebar({ onExport, isExporting, exportProgress }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addProducts = useProductStore((s) => s.addProducts);
  const addBlankProduct = useProductStore((s) => s.addBlankProduct);
  const resetCatalog = useProductStore((s) => s.resetCatalog);
  const products = useProductStore((s) => s.products);

  const storeName = useSettingsStore((s) => s.storeName);
  const footerContact = useSettingsStore((s) => s.footerContact);
  const presentationMode = useSettingsStore((s) => s.presentationMode);
  const updateStoreName = useSettingsStore((s) => s.updateStoreName);
  const updateContact = useSettingsStore((s) => s.updateContact);
  const togglePresentation = useSettingsStore((s) => s.togglePresentation);

  return (
    <aside className="sidebar-left">
      <div className="sb-header">
        <h1>🎴 CatalogFlow Pro</h1>
        <p>3 productos por página • Offline</p>
      </div>

      <div className="sb-section">
        <div className="sb-section-title">Marca</div>
        <div className="sb-stack-sm">
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
      </div>

      <div className="sb-section">
        <div className="sb-section-title">Tipografía</div>
        <div className="sb-stack-sm">
          <FontSelector label="Encabezados" fontKey="heading" />
          <FontSelector label="Párrafos" fontKey="body" />
          <FontSelector label="Textos pequeños" fontKey="small" />
        </div>
      </div>

      <div className="sb-section">
        <div className="sb-section-title">Colores</div>
        <div className="color-grid">
          <ColorGroup label="Fondo Páginas" colorKey="bg" />
          <ColorGroup label="Acento Primario" colorKey="primary" />
          <ColorGroup label="Acento Secundario" colorKey="secondary" />
          <ColorGroup label="Texto" colorKey="text" />
        </div>
      </div>

      <div className="sb-section">
        <div className="sb-section-title">Catálogo</div>
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
        <div className="sb-stack-sm">
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
      </div>

      <div className="sb-section">
        <div className="sb-section-title">Vista</div>
        <Toggle
          label="Modo Presentación"
          active={presentationMode}
          onToggle={togglePresentation}
        />
      </div>

      <div className="sb-spacer" />

      <Button variant="export" onClick={onExport} disabled={isExporting}>
        {isExporting ? (
          <>
            <span className="spinner" /> {exportProgress}
          </>
        ) : (
          '📥 Descargar PDF'
        )}
      </Button>
    </aside>
  );
}
