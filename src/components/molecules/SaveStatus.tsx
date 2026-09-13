import { CheckCircle2, LoaderCircle } from 'lucide-react';
import { hydrateCatalog, retrySave } from '../../store/catalogSession';
import { usePersistenceStore } from '../../store/usePersistenceStore';
import { Button } from '../atoms/Button';

export function SaveStatus({ compact = false, errorsOnly = false }: { compact?: boolean; errorsOnly?: boolean }) {
  const { loading, saving, error, managing, exporting } = usePersistenceStore();
  const failed = loading === 'failed' || saving === 'failed';
  if (errorsOnly && !failed) return null;
  if (compact && failed) return null;
  if (loading === 'loading') return <p className="save-status" role="status">Cargando catálogo…</p>;
  if (loading === 'failed') return <div className="save-status save-error" role="alert">
    <p>No se pudo cargar el catálogo. Tus datos no se modificaron.</p><p>{error}</p>
    <Button onClick={() => void hydrateCatalog()}>Reintentar carga</Button>
  </div>;
  if (saving === 'failed') return <div className="save-status save-error" role="alert">
    <p>No se guardaron los últimos cambios. {error}</p>
    <p>Mantené esta pestaña abierta para reintentar o descargar el PDF con tus cambios.</p>
    <Button disabled={managing || exporting} onClick={() => void retrySave()}>Reintentar guardado</Button>
  </div>;
  return <p className="save-status" role="status">
    {saving === 'saving' ? <LoaderCircle size={15} aria-hidden="true" /> : <CheckCircle2 size={15} aria-hidden="true" />}
    {saving === 'saving' ? 'Guardando…' : 'Guardado en este navegador'}
  </p>;
}
