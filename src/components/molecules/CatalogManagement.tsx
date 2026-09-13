import { Button } from '../atoms/Button';
import { useSettingsStore } from '../../store/useSettingsStore';
import { usePersistenceStore } from '../../store/usePersistenceStore';
import { manageCatalog } from '../../store/catalogSession';

const ACTIONS = [
  { action: 'products', label: 'Vaciar catálogo', effect: 'Se eliminarán todos los productos y sus fotos. Se conservarán los ajustes y el fondo.' },
  { action: 'settings', label: 'Restablecer ajustes', effect: 'Se restablecerán los ajustes, las distribuciones y el fondo. Se conservarán los productos, su orden y sus fotos.' },
  { action: 'everything', label: 'Restablecer todo', effect: 'Se eliminarán todos los productos y sus fotos, y se restablecerán los ajustes y el fondo.' },
] as const;

export function CatalogManagement() {
  const name = useSettingsStore((s) => s.storeName) || 'Catálogo actual';
  const managing = usePersistenceStore((s) => s.managing);
  return (
    <div className="sb-accordion-body sb-stack-sm">
      <p>Administrar «{name}»</p>
      {ACTIONS.map(({ action, label, effect }) => (
        <Button key={action} variant="danger" disabled={managing} onClick={async () => {
          if (confirm(`${label} — «${name}»\n\n${effect}\n\n¿Continuar?`)) await manageCatalog(action);
        }}>{label}</Button>
      ))}
    </div>
  );
}
