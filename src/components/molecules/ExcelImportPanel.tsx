import { useRef, useState } from 'react';
import { Download, Upload, AlertTriangle, X, ImagePlus, Check } from 'lucide-react';
import { downloadExcelTemplate, parseExcelFile, countImageMatches, type ExcelRow } from '../../utils/excel';
import { useProductStore } from '../../store/useProductStore';

type Step = 'idle' | 'confirm' | 'error';

export function ExcelImportPanel() {
  const importProducts = useProductStore((s) => s.importProducts);

  const xlsxInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('idle');
  const [parsedRows, setParsedRows] = useState<ExcelRow[]>([]);
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
      setParsedRows(rows);
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

  function handleConfirm() {
    importProducts(parsedRows, imageFiles);
    setStep('idle');
    setParsedRows([]);
    setImageFiles([]);
  }

  function handleCancel() {
    setStep('idle');
    setParsedRows([]);
    setImageFiles([]);
    setErrorMsg('');
  }

  const matchCount = countImageMatches(parsedRows, imageFiles);

  return (
    <div className="excel-panel-wrap">
      <div className="excel-toolbar">
        <button className="excel-btn" onClick={downloadExcelTemplate}>
          <Download size={13} />
          Descargar plantilla
        </button>
        <button className="excel-btn excel-btn-accent" onClick={() => xlsxInputRef.current?.click()}>
          <Upload size={13} />
          Importar Excel
        </button>
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
          <button className="excel-btn" onClick={handleCancel}>
            <X size={13} />
            Cerrar
          </button>
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
            <button className="excel-btn excel-btn-full" onClick={() => imgInputRef.current?.click()}>
              <ImagePlus size={13} />
              {imageFiles.length === 0 ? 'Seleccionar imágenes (opcional)' : `${imageFiles.length} imagen${imageFiles.length !== 1 ? 'es' : ''} seleccionada${imageFiles.length !== 1 ? 's' : ''}`}
            </button>
            {imageFiles.length > 0 && (
              <p className="excel-match-label">
                {matchCount > 0
                  ? <><Check size={12} className="excel-match-icon" /> {matchCount} de {parsedRows.length} artículos con imagen asignada</>
                  : <><AlertTriangle size={12} className="excel-match-icon-warn" /> Ninguna imagen coincide con los nombres del archivo</>
                }
              </p>
            )}
          </div>

          <div className="excel-actions">
            <button className="excel-btn" onClick={handleCancel}>
              <X size={13} />
              Cancelar
            </button>
            <button className="excel-btn excel-btn-accent" onClick={handleConfirm}>
              <Check size={13} />
              Importar {parsedRows.length} artículo{parsedRows.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
