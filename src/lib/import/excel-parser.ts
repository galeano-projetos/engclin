import * as XLSX from "xlsx";

export interface RawRow {
  setor?: string;
  equipamento?: string;
  criticidade?: string;
  patrimonio?: string;
  marca?: string;
  numeroSerie?: string;
  modelo?: string;
  aquisicao?: string;
  dataManutencao?: string;
  proximaManutencao?: string;
  dataCalibracao?: string;
  proximaCalibracao?: string;
  quemRealizou?: string;
}

/** Map known column name patterns to our fields */
const COLUMN_MAP: Record<string, keyof RawRow> = {
  setor: "setor",
  "setor/unidade": "setor",
  unidade: "setor",
  equipamento: "equipamento",
  "nome equipamento": "equipamento",
  criticidade: "criticidade",
  patrimonio: "patrimonio",
  "patrimônio": "patrimonio",
  "pat": "patrimonio",
  marca: "marca",
  "n/s": "numeroSerie",
  "numero de serie": "numeroSerie",
  "número de série": "numeroSerie",
  "nº serie": "numeroSerie",
  modelo: "modelo",
  aquisicao: "aquisicao",
  "aquisição": "aquisicao",
  "data aquisicao": "aquisicao",
  "data manutencao": "dataManutencao",
  "data manutenção": "dataManutencao",
  "ultima manutencao": "dataManutencao",
  "ultima manutenção": "dataManutencao",
  "proxima manutencao": "proximaManutencao",
  "próxima manutenção": "proximaManutencao",
  "proxima manutenção": "proximaManutencao",
  "data calibracao": "dataCalibracao",
  "data calibração": "dataCalibracao",
  "ultima calibracao": "dataCalibracao",
  "ultima calibração": "dataCalibracao",
  "proxima calibracao": "proximaCalibracao",
  "próxima calibração": "proximaCalibracao",
  "proxima calibração": "proximaCalibracao",
  "quem realizou": "quemRealizou",
  fornecedor: "quemRealizou",
  empresa: "quemRealizou",
};

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-záàâãéèêíïóôõúüç\s/]/gi, "");
}

export function parseExcel(buffer: ArrayBuffer): RawRow[] {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  if (jsonData.length === 0) return [];

  // Detect column mapping
  const firstRow = jsonData[0];
  const mapping: Record<string, keyof RawRow> = {};

  for (const col of Object.keys(firstRow)) {
    const normalized = normalizeHeader(col);
    if (COLUMN_MAP[normalized]) {
      mapping[col] = COLUMN_MAP[normalized];
    } else {
      // Try partial match
      for (const [pattern, field] of Object.entries(COLUMN_MAP)) {
        if (normalized.includes(pattern)) {
          mapping[col] = field;
          break;
        }
      }
    }
  }

  return jsonData.map((row) => {
    const parsed: RawRow = {};
    for (const [col, field] of Object.entries(mapping)) {
      const val = row[col];
      if (val instanceof Date) {
        parsed[field] = val.toISOString();
      } else if (val != null && val !== "") {
        parsed[field] = String(val).trim();
      }
    }
    return parsed;
  });
}
