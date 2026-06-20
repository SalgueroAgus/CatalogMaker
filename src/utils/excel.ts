import * as XLSX from 'xlsx';

export type ExcelRow = {
  name: string;
  description: string;
  price: string;
};

export function downloadExcelTemplate(): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([['Nombre', 'Descripción', 'Precio']]);
  XLSX.utils.book_append_sheet(wb, ws, 'Catálogo');
  XLSX.writeFile(wb, 'plantilla-catalogo.xlsx');
}

export async function parseExcelFile(file: File): Promise<ExcelRow[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
  return rows
    .filter((r) => String(r['Nombre'] ?? '').trim())
    .map((r) => ({
      name: String(r['Nombre'] ?? '').trim().toUpperCase(),
      description: String(r['Descripción'] ?? '').trim(),
      price: String(r['Precio'] ?? '').trim() || '$0.00',
    }));
}

export function countImageMatches(rows: ExcelRow[], files: File[]): number {
  const fileKeys = new Set(
    files.map((f) => f.name.replace(/\.[^.]+$/, '').trim().toLowerCase())
  );
  return rows.filter((r) => fileKeys.has(r.name.trim().toLowerCase())).length;
}
