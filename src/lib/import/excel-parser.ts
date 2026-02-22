import * as XLSX from "xlsx";

export interface RawRow {
  setor?: string;
  equipamento?: string;
  tipoEquipamento?: string;
  criticidade?: string;
  patrimonio?: string;
  marca?: string;
  numeroSerie?: string;
  modelo?: string;
  registroAnvisa?: string;
  tipoPropriedade?: string;
  fornecedorComodato?: string;
  aquisicao?: string;
  valorAquisicao?: string;
  planoContingencia?: string;
  status?: string;
  dataManutencao?: string;
  proximaManutencao?: string;
  dataCalibracao?: string;
  proximaCalibracao?: string;
  dataTse?: string;
  proximaTse?: string;
  quemRealizou?: string;
}

/** Map known column name patterns to our fields */
const COLUMN_MAP: Record<string, keyof RawRow> = {
  // Setor
  setor: "setor",
  "setor/unidade": "setor",
  unidade: "setor",
  // Equipamento
  equipamento: "equipamento",
  "nome equipamento": "equipamento",
  // Tipo de Equipamento
  "tipo equipamento": "tipoEquipamento",
  "tipo de equipamento": "tipoEquipamento",
  // Criticidade
  criticidade: "criticidade",
  // Patrimonio
  patrimonio: "patrimonio",
  "patrimônio": "patrimonio",
  pat: "patrimonio",
  // Marca
  marca: "marca",
  fabricante: "marca",
  // Numero de Serie
  "n/s": "numeroSerie",
  "numero de serie": "numeroSerie",
  "número de série": "numeroSerie",
  "nº serie": "numeroSerie",
  // Modelo
  modelo: "modelo",
  // Registro ANVISA
  "registro anvisa": "registroAnvisa",
  "reg anvisa": "registroAnvisa",
  anvisa: "registroAnvisa",
  // Tipo Propriedade
  "tipo propriedade": "tipoPropriedade",
  propriedade: "tipoPropriedade",
  "proprio/comodato": "tipoPropriedade",
  // Fornecedor Comodato
  "fornecedor comodato": "fornecedorComodato",
  comodato: "fornecedorComodato",
  // Aquisicao
  aquisicao: "aquisicao",
  "aquisição": "aquisicao",
  "data aquisicao": "aquisicao",
  // Valor Aquisicao
  "valor aquisicao": "valorAquisicao",
  "valor aquisição": "valorAquisicao",
  "valor": "valorAquisicao",
  // Plano de Contingencia
  "plano contingencia": "planoContingencia",
  "plano de contingencia": "planoContingencia",
  "plano de contingência": "planoContingencia",
  contingencia: "planoContingencia",
  // Status
  status: "status",
  situacao: "status",
  "situação": "status",
  // Manutencao Preventiva
  "data manutencao": "dataManutencao",
  "data manutenção": "dataManutencao",
  "ultima manutencao": "dataManutencao",
  "ultima manutenção": "dataManutencao",
  "proxima manutencao": "proximaManutencao",
  "próxima manutenção": "proximaManutencao",
  "proxima manutenção": "proximaManutencao",
  // Calibracao
  "data calibracao": "dataCalibracao",
  "data calibração": "dataCalibracao",
  "ultima calibracao": "dataCalibracao",
  "ultima calibração": "dataCalibracao",
  "proxima calibracao": "proximaCalibracao",
  "próxima calibração": "proximaCalibracao",
  "proxima calibração": "proximaCalibracao",
  // TSE
  "data tse": "dataTse",
  "ultima tse": "dataTse",
  "teste seguranca eletrica": "dataTse",
  "proxima tse": "proximaTse",
  "próxima tse": "proximaTse",
  // Fornecedor
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

const MAX_ROWS = 5000;

export function parseExcel(buffer: ArrayBuffer): RawRow[] {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  if (jsonData.length === 0) return [];

  if (jsonData.length > MAX_ROWS) {
    throw new Error(`Planilha excede o limite de ${MAX_ROWS} linhas (encontradas: ${jsonData.length}). Divida o arquivo e tente novamente.`);
  }

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
