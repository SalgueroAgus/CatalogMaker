import { useEffect, useRef, useState } from 'react';
import { Flex } from '@radix-ui/themes';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { ConfirmAction } from '../molecules/ConfirmAction';
import { useCatalogStore } from '../../store/useCatalogStore';
import { usePersistenceStore } from '../../store/usePersistenceStore';
import { captureCatalogBackup, changeCatalog, createCatalog, openCatalog, refreshCatalogs, restoreBackup } from '../../store/catalogSession';
import { availableCatalogName, catalogFilename } from '../../utils/catalog';
import { buildCatalogBackup, downloadCatalogFile, parseCatalogBackup, type ParsedCatalogBackup } from '../../utils/catalogBackup';

type Form = { action: 'blank' | 'copy' | 'rename' | 'restore'; id?: string; name: string };

export function CatalogManager() {
  const { catalogs, activeId, mainId, epoch, operationError } = useCatalogStore();
  const busy = usePersistenceStore((s) => s.managing || s.exporting);
  const conflicted = usePersistenceStore((s) => s.saving === 'conflict');
  const [form, setForm] = useState<Form | null>(null);
  const [backup, setBackup] = useState<ParsedCatalogBackup | null>(null);
  const [reading, setReading] = useState(false);
  const [notice, setNotice] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const generation = useRef(0);
  const disabled = busy || reading;
  const available = catalogs.filter((item) => !item.deletedAt).sort((a, b) => a.id === mainId ? -1 : b.id === mainId ? 1 : b.lastSavedAt.localeCompare(a.lastSavedAt) || a.name.localeCompare(b.name));
  const deleted = catalogs.filter((item) => item.deletedAt);
  const suggest = (name: string) => availableCatalogName(name, available.map((item) => item.name));

  useEffect(() => {
    void refreshCatalogs().catch((error: unknown) => useCatalogStore.setState({ operationError: error instanceof Error ? error.message : 'No se pudo actualizar la lista.' }));
  }, []);
  useEffect(() => {
    generation.current++;
    setForm(null); setBackup(null); setReading(false);
    return () => { generation.current++; };
  }, [epoch]);

  async function downloadBackup() {
    const captured = captureCatalogBackup();
    if (!captured) return;
    setNotice('Preparando respaldo…');
    try {
      const blob = await buildCatalogBackup(captured.record);
      downloadCatalogFile(blob, `${catalogFilename(captured.record.metadata.name)}.catalogmaker.json`);
      setNotice(`Respaldo preparado para descargar. Buscalo en Descargas o en la ubicación elegida.${captured.draft ? ' Incluye los cambios de esta sesión que todavía no se guardaron.' : ''}`);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'No se pudo crear el respaldo.'); }
    finally { captured.release(); }
  }

  async function readBackup(file: File) {
    const request = ++generation.current;
    setReading(true); setNotice('Leyendo respaldo…'); setBackup(null); setForm(null);
    try {
      const parsed = await parseCatalogBackup(file);
      if (request !== generation.current) return;
      setBackup(parsed); setForm({ action: 'restore', name: suggest(parsed.name) }); setNotice('');
    } catch (error) { if (request === generation.current) setNotice(error instanceof Error ? error.message : 'No se pudo leer el respaldo.'); }
    finally { if (request === generation.current) setReading(false); }
  }

  async function submitForm() {
    if (!form || disabled) return;
    const result = form.action === 'rename' && form.id ? await changeCatalog(form.id, 'rename', form.name)
      : form.action === 'restore' && backup ? await restoreBackup(form.name, backup.data)
      : await createCatalog(form.name, form.action === 'copy' ? form.id : undefined);
    if (result.status === 'saved') { setForm(null); setBackup(null); setNotice('Catálogo guardado en este navegador.'); }
  }

  return <div className="catalog-manager">
    <p>Los catálogos y Eliminados se guardan en este navegador. Un respaldo permite recuperarlos o llevarlos a otro dispositivo. El inicio de sesión no sincroniza estos datos.</p>
    <Flex gap="2" wrap="wrap">
      <Button disabled={disabled || conflicted} onClick={() => { setForm({ action: 'blank', name: suggest('Nuevo catálogo') }); }}>Crear catálogo vacío</Button>
      <Button disabled={disabled} onClick={() => void downloadBackup()}>Descargar respaldo del actual</Button>
      <Button disabled={disabled || conflicted} onClick={() => fileRef.current?.click()}>Restaurar respaldo</Button>
    </Flex>
    <p className="catalog-help">El respaldo conserva productos, fotos y diseño editables. El PDF sirve para compartir; Excel permite agregar productos.</p>
    <input ref={fileRef} type="file" accept=".catalogmaker.json,application/json" hidden disabled={disabled} onChange={(event) => {
      const file = event.target.files?.[0]; event.target.value = ''; if (file) void readBackup(file);
    }} />
    {operationError && <p role="alert" className="field-error">{operationError}</p>}
    {notice && <p role="status">{notice}</p>}
    {form && <form className="catalog-form" onSubmit={(event) => { event.preventDefault(); void submitForm(); }}>
      <h3>{form.action === 'restore' ? 'Restaurar como nuevo catálogo' : form.action === 'rename' ? 'Renombrar catálogo' : form.action === 'copy' ? 'Hacer una copia' : 'Crear catálogo vacío'}</h3>
      {form.action === 'restore' && backup && <p>Respaldo «{backup.name}»: {backup.data.products.length} productos. Se creará un catálogo independiente.</p>}
      <label htmlFor="catalog-name">Nombre del catálogo</label>
      <Input id="catalog-name" autoFocus value={form.name} disabled={disabled} onChange={(event) => setForm({ ...form, name: event.target.value })} />
      <Flex gap="2" wrap="wrap"><Button type="submit" disabled={disabled || !form.name.trim()}>Guardar catálogo</Button><Button type="button" disabled={disabled} onClick={() => { setForm(null); setBackup(null); }}>Cancelar</Button></Flex>
    </form>}
    <ul className="catalog-list">
      {available.map((item) => <li key={item.id} className="catalog-entry" aria-label={`Catálogo ${item.name}`}>
        <div className="catalog-entry-title"><strong>{item.name}</strong>{item.id === mainId && <span className="catalog-badge">Principal</span>}{item.id === activeId && <span className="catalog-badge">Abierto</span>}</div>
        <p>{item.productCount} productos · Último guardado: {new Date(item.lastSavedAt).toLocaleString()}</p>
        <Flex gap="2" wrap="wrap">
          <Button disabled={disabled || conflicted || item.id === activeId} onClick={() => void openCatalog(item.id)}>Abrir</Button>
          <Button disabled={disabled || conflicted} onClick={() => { setForm({ action: 'copy', id: item.id, name: suggest(`Copia de ${item.name}`) }); }}>Hacer una copia</Button>
          <Button disabled={disabled || conflicted} onClick={() => { setForm({ action: 'rename', id: item.id, name: item.name }); }}>Renombrar</Button>
          {item.id !== mainId && <ConfirmAction title={`Eliminar catálogo — «${item.name}»`} description="Podrás recuperarlo desde Eliminados. Sus fotos y diseño se conservarán en este navegador." onConfirm={() => changeCatalog(item.id, 'delete')}><Button variant="danger" disabled={disabled || conflicted}>Eliminar</Button></ConfirmAction>}
        </Flex>
      </li>)}
    </ul>
    <details className="catalog-trash"><summary>Eliminados ({deleted.length})</summary>
      <p>Se conservan hasta que los borres definitivamente. Siguen ocupando espacio en este navegador.</p>
      <ul className="catalog-list">{deleted.map((item) => <li key={item.id} className="catalog-entry" aria-label={`Catálogo eliminado ${item.name}`}>
        <strong>{item.name}</strong><p>{item.productCount} productos</p>
        <Flex gap="2" wrap="wrap"><Button disabled={disabled || conflicted} onClick={() => void changeCatalog(item.id, 'restore', suggest(item.name))}>Recuperar</Button><ConfirmAction title={`Borrar definitivamente — «${item.name}»`} description="Se borrarán sus productos, fotos y diseño. Solo podrás recuperarlo si tenés un archivo de respaldo." onConfirm={() => changeCatalog(item.id, 'purge')}><Button variant="danger" disabled={disabled || conflicted}>Borrar definitivamente</Button></ConfirmAction></Flex>
      </li>)}</ul>
    </details>
  </div>;
}
