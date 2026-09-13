import { useRef } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { Tabs } from '@radix-ui/themes';
import { ChevronRight, FolderOpen, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '../atoms/Button';
import { ColorGroup } from '../molecules/ColorGroup';
import { FormField } from '../molecules/FormField';
import { Input } from '../atoms/Input';
import { TypographyRole } from '../molecules/TypographyRole';
import { useSettingsStore } from '../../store/useSettingsStore';

export function DesignPanel() {
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const storeName = useSettingsStore((s) => s.storeName);
  const footerContact = useSettingsStore((s) => s.footerContact);
  const footerTag = useSettingsStore((s) => s.footerTag);
  const bgImage = useSettingsStore((s) => s.bgImage);
  const bgImageOpacity = useSettingsStore((s) => s.bgImageOpacity);
  const updateStoreName = useSettingsStore((s) => s.updateStoreName);
  const updateContact = useSettingsStore((s) => s.updateContact);
  const updateFooterTag = useSettingsStore((s) => s.updateFooterTag);
  const setBgImage = useSettingsStore((s) => s.setBgImage);
  const setBgImageOpacity = useSettingsStore((s) => s.setBgImageOpacity);
  return <Accordion.Root type="multiple" defaultValue={['marca']} className="design-panel sb-stack">
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
        <FormField label="Etiqueta del pie">
          <Input
            value={footerTag}
            onChange={(e) => updateFooterTag(e.target.value)}
            placeholder="Dejar vacío para ocultar"
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
      <span>Fondo y colores</span>
      <ChevronRight className="sb-chevron" size={12} aria-hidden="true" />
    </Accordion.Trigger>
    <Accordion.Content>
      <div className="sb-accordion-body">
        <div className="sb-subsection-label">Fondo</div>

        <Tabs.Root
          defaultValue={bgImage ? 'imagen' : 'color'}
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
                  if (file) setBgImage(file);
                  e.target.value = '';
                }}
              />
              <Button
                className="sb-bg-upload"
                onClick={() => bgFileInputRef.current?.click()}
              >
                {bgImage
                  ? <><ImageIcon size={14} aria-hidden="true" /> Cambiar imagen</>
                  : <><FolderOpen size={14} aria-hidden="true" /> Cargar imagen</>}
              </Button>
              {bgImage && (
                <Button variant="ghost" onClick={() => setBgImage(null)}>
                  <X size={14} aria-hidden="true" /> Quitar imagen
                </Button>
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

        <div className="sb-subsection-label">Colores</div>

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

  </Accordion.Root>;
}
