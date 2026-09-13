import { Button } from '../atoms/Button';
import { ConfirmAction } from './ConfirmAction';
import { useCatalogStore } from '../../store/useCatalogStore';
import { usePersistenceStore } from '../../store/usePersistenceStore';
import { manageCatalog } from '../../store/catalogSession';

const ACTIONS = [
  { action: 'products', label: 'Vaciar catálogo', effect: 'Se eliminarán todos los productos y sus fotos. Se conservarán los ajustes y el fondo.' },
  { action: 'settings', label: 'Restablecer ajustes', effect: 'Se restablecerán los ajustes, las distribuciones y el fondo. Se conservarán los productos, su orden y sus fotos.' },
  { action: 'everything', label: 'Restablecer todo', effect: 'Se eliminarán todos los productos y sus fotos, y se restablecerán los ajustes y el fondo.' },
] as const;

export function CatalogManagement() {
  const name = useCatalogStore((s) => s.catalogs.find((item) => item.id === s.activeId)?.name) || 'Catálogo actual';
  const busy = usePersistenceStore((s) => s.managing || s.exporting || s.saving === 'conflict');
  return <div className="management-actions">
    {ACTIONS.map(({ action, label, effect }) => <div key={action}>
      <p>{effect}</p>
      <ConfirmAction title={`${label} — «${name}»`} description={effect} onConfirm={() => manageCatalog(action)}>
        <Button variant="danger" disabled={busy}>{label}</Button>
      </ConfirmAction>
    </div>)}
  </div>;
}
