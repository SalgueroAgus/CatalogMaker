import { hydrateCatalog, retrySave } from '../../store/catalogSession';
import { usePersistenceStore } from '../../store/usePersistenceStore';

export function SaveStatus() {
  const { loading, saving, error } = usePersistenceStore();
  if (loading === 'loading') return <p className="save-status" role="status">Cargando catálogo…</p>;
  if (loading === 'failed') return (
    <div className="save-status" role="alert">
      <p>No se pudo cargar el catálogo. Tus datos no se modificaron.</p>
      <p>{error}</p>
      <button className="sb-btn" onClick={() => void hydrateCatalog()}>Reintentar carga</button>
    </div>
  );
  if (saving === 'failed') return (
    <div className="save-status save-error" role="alert">
      <p>No se guardaron los últimos cambios. {error}</p>
      <p>Mantené esta pestaña abierta para reintentar o descargar el PDF con tus cambios.</p>
      <button className="sb-btn" onClick={() => void retrySave()}>Reintentar guardado</button>
    </div>
  );
  return <p className="save-status" role="status">{saving === 'saving' ? 'Guardando…' : 'Guardado en este navegador'}</p>;
}
