import { Button } from '../atoms/Button';
import { TextArea } from '@radix-ui/themes';
import { useRef, useState } from 'react';
import { Download, Upload, AlertTriangle, X, ImagePlus, Check } from 'lucide-react';
import { downloadExcelTemplate, parseExcelFile, countImageMatches, type ExcelRow } from '../../utils/excel';
import { DESCRIPTION_LIMIT, validateProductFields } from '../../utils/products';
import { useProductStore } from '../../store/useProductStore';

type Step = 'idle' | 'confirm' | 'error';

export function ExcelImportPanel() {
  const importProducts = useProductStore((s) => s.importProducts);

  const xlsxInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<Step>('idle');
  const [parsedRows, setParsedRows] = useState<ExcelRow[]>([]);
  const [correctionRows, setCorrectionRows] = useState<Set<number>>(() => new Set());
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleXlsxSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const rows = await parseExcelFile(file);
      if (!rows.length) {
        setErrorMsg('El archivo no contiene filas válidas. Verificá que tenga una columna "Nombre".');
        setStep('error');
        return;
      }
      setErrorMsg('');
      setParsedRows(rows);
      setCorrectionRows(new Set(rows.flatMap((row, index) => row.description.length > DESCRIPTION_LIMIT ? [index] : [])));
      setImageFiles([]);
      setStep('confirm');
    } catch {
      setErrorMsg('No se pudo leer el archivo. Asegurate de que sea un .xlsx válido.');
      setStep('error');
    }
  }

  function handleImagesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    setImageFiles(files);
  }

  async function handleConfirm() {
    if (importing) return;
    const invalid = parsedRows.findIndex((row) => validateProductFields(row));
    if (invalid >= 0) {
      setErrorMsg(`Fila ${invalid + 2}: la descripción supera ${DESCRIPTION_LIMIT} caracteres. Corregí la fila antes de importar.`);
      return;
    }
    setImporting(true);
    const result = await importProducts(parsedRows, imageFiles);
    setImporting(false);
    if (result.status === 'invalid' || result.status === 'ignored') {
      setErrorMsg(result.status === 'invalid' ? result.error : 'Esperá a que termine la operación actual y reintentá.');
      return;
    }
    setStep('idle');
    setParsedRows([]);
    setCorrectionRows(new Set());
    setImageFiles([]);
  }

  function handleCancel() {
    setStep('idle');
    setParsedRows([]);
    setCorrectionRows(new Set());
    setImageFiles([]);
    setErrorMsg('');
  }

  const matchCount = countImageMatches(parsedRows, imageFiles);

  return (
    <div className="excel-panel-wrap">
      <div className="excel-toolbar">
        <Button className="excel-btn" onClick={downloadExcelTemplate}>
          <Download size={13} />
          Descargar plantilla
        </Button>
        <Button className="excel-btn excel-btn-accent" onClick={() => xlsxInputRef.current?.click()}>
          <Upload size={13} />
          Importar Excel
        </Button>
      </div>

      <input
        ref={xlsxInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleXlsxSelected}
      />
      <input
        ref={imgInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleImagesSelected}
      />

      {step === 'error' && (
        <div className="excel-confirm-panel">
          <div className="excel-warning">
            <AlertTriangle size={15} className="excel-warning-icon" />
            <p className="excel-warning-text">{errorMsg}</p>
          </div>
          <Button className="excel-btn" onClick={handleCancel} disabled={importing}>
            <X size={13} />
            Cerrar
          </Button>
        </div>
      )}

      {step === 'confirm' && (
        <div className="excel-confirm-panel">
          <p className="excel-found-label">
            Se encontraron <strong>{parsedRows.length}</strong> artículo{parsedRows.length !== 1 ? 's' : ''} en el archivo.
          </p>

          <div className="excel-warning">
            <AlertTriangle size={15} className="excel-warning-icon" />
            <p className="excel-warning-text">
              Los artículos se importan <strong>sin imagen</strong>. Para asignar imágenes automáticamente,
              seleccioná archivos de imagen cuyos nombres coincidan exactamente con el nombre del artículo
              (sin distinguir mayúsculas ni la extensión del archivo).
            </p>
          </div>

          <div className="excel-img-section">
            <Button className="excel-btn excel-btn-full" onClick={() => imgInputRef.current?.click()}>
              <ImagePlus size={13} />
              {imageFiles.length === 0 ? 'Seleccionar imágenes (opcional)' : `${imageFiles.length} imagen${imageFiles.length !== 1 ? 'es' : ''} seleccionada${imageFiles.length !== 1 ? 's' : ''}`}
            </Button>
            {imageFiles.length > 0 && (
              <p className="excel-match-label">
                {matchCount > 0
                  ? <><Check size={12} className="excel-match-icon" /> {matchCount} de {parsedRows.length} artículos con imagen asignada</>
                  : <><AlertTriangle size={12} className="excel-match-icon-warn" /> Ninguna imagen coincide con los nombres del archivo</>
                }
              </p>
            )}
          </div>

          {errorMsg && <p className="field-error" role="alert">{errorMsg}</p>}
          {parsedRows.map((row, index) => correctionRows.has(index) && (
            <label key={index} className="rs-field-label">
              Corregir descripción, fila {index + 2}: {row.name}
              <TextArea className="rs-desc-textarea" value={row.description} aria-invalid={row.description.length > DESCRIPTION_LIMIT} onChange={(e) => {
                const description = e.target.value;
                setParsedRows((rows) => rows.map((value, i) => i === index ? { ...value, description } : value));
                setErrorMsg('');
              }} />
            </label>
          ))}
          <div className="excel-actions">
            <Button className="excel-btn" onClick={handleCancel} disabled={importing}>
              <X size={13} />
              Cancelar
            </Button>
            <Button className="excel-btn excel-btn-accent" onClick={handleConfirm} disabled={importing}>
              <Check size={13} />
              Importar {parsedRows.length} artículo{parsedRows.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
