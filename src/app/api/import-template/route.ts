import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  // Create workbook with template
  const wb = XLSX.utils.book_new();

  // Main sheet with headers and example data
  const headers = [
    "SETOR",
    "EQUIPAMENTO",
    "CRITICIDADE",
    "PATRIMONIO",
    "MARCA",
    "N/S",
    "MODELO",
    "AQUISICAO",
    "DATA MANUTENCAO",
    "PROXIMA MANUTENCAO",
    "DATA CALIBRACAO",
    "PROXIMA CALIBRACAO",
    "QUEM REALIZOU",
  ];

  const exampleRows = [
    [
      "UTI ADULTO",
      "MONITOR MULTIPARAMETRO",
      "1",
      "12345",
      "MINDRAY",
      "SN-001234",
      "BENEVISION N15",
      "2023-01-15",
      "2025-03-10",
      "2026-03-10",
      "2025-03-10",
      "2026-03-10",
      "SAFETY MEDICAL",
    ],
    [
      "CENTRO CIRURGICO",
      "APARELHO DE ANESTESIA",
      "1",
      "6308",
      "GE",
      "ME16095358",
      "9100C",
      "2019-07-01",
      "2025-02-15",
      "2026-02-15",
      "",
      "",
      "M.A HOSPITALAR",
    ],
    [
      "FARMACIA",
      "GELADEIRA CIENTIFICA",
      "2",
      "9800",
      "INDREL",
      "RC-2024-001",
      "RVV 440D",
      "2022-06-01",
      "2025-06-01",
      "2026-06-01",
      "2025-06-01",
      "2026-06-01",
      "INDREL",
    ],
    [
      "CME",
      "AUTOCLAVE",
      "1",
      "5500",
      "BAUMER",
      "AUT-5500",
      "HI VAC PLUS",
      "2020-03-20",
      "2025-01-20",
      "2025-07-20",
      "",
      "",
      "BAUMER ASSISTENCIA",
    ],
    [
      "PRONTO ATENDIMENTO",
      "DESFIBRILADOR",
      "1",
      "7890",
      "CMOS DRAKE",
      "DEF-7890",
      "LIFE 400 FUTURA",
      "2021-11-10",
      "2025-05-10",
      "2026-05-10",
      "2025-05-10",
      "2026-05-10",
      "CMOS DRAKE",
    ],
  ];

  const wsData = [headers, ...exampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws["!cols"] = [
    { wch: 22 }, // SETOR
    { wch: 30 }, // EQUIPAMENTO
    { wch: 12 }, // CRITICIDADE
    { wch: 12 }, // PATRIMONIO
    { wch: 15 }, // MARCA
    { wch: 18 }, // N/S
    { wch: 20 }, // MODELO
    { wch: 12 }, // AQUISICAO
    { wch: 18 }, // DATA MANUTENCAO
    { wch: 20 }, // PROXIMA MANUTENCAO
    { wch: 18 }, // DATA CALIBRACAO
    { wch: 20 }, // PROXIMA CALIBRACAO
    { wch: 20 }, // QUEM REALIZOU
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Equipamentos");

  // Instructions sheet
  const instrData = [
    ["INSTRUCOES PARA PREENCHIMENTO DA PLANILHA DE IMPORTACAO"],
    [],
    ["COLUNA", "OBRIGATORIO", "DESCRICAO", "EXEMPLO"],
    ["SETOR", "Sim", "Nome do setor/unidade onde o equipamento esta localizado", "UTI ADULTO"],
    ["EQUIPAMENTO", "Sim", "Nome/tipo do equipamento", "MONITOR MULTIPARAMETRO"],
    ["CRITICIDADE", "Nao", "Nivel de criticidade: 1 (Alta/A), 2 (Media/B), 3 (Baixa/C)", "1"],
    ["PATRIMONIO", "Nao", "Numero de patrimonio do equipamento", "12345"],
    ["MARCA", "Nao", "Marca/fabricante do equipamento", "MINDRAY"],
    ["N/S", "Nao", "Numero de serie do equipamento", "SN-001234"],
    ["MODELO", "Nao", "Modelo do equipamento", "BENEVISION N15"],
    ["AQUISICAO", "Nao", "Data de aquisicao (formato: AAAA-MM-DD ou DD/MM/AAAA)", "2023-01-15"],
    ["DATA MANUTENCAO", "Nao", "Data da ultima manutencao preventiva realizada", "2025-03-10"],
    ["PROXIMA MANUTENCAO", "Nao", "Data da proxima manutencao preventiva prevista", "2026-03-10"],
    ["DATA CALIBRACAO", "Nao", "Data da ultima calibracao realizada", "2025-03-10"],
    ["PROXIMA CALIBRACAO", "Nao", "Data da proxima calibracao prevista", "2026-03-10"],
    ["QUEM REALIZOU", "Nao", "Nome da empresa/fornecedor que realizou o servico", "SAFETY MEDICAL"],
    [],
    ["OBSERVACOES IMPORTANTES:"],
    ["1. A primeira aba da planilha sera utilizada para a importacao."],
    ["2. A primeira linha deve conter os nomes das colunas (cabecalho)."],
    ["3. Equipamentos com mesmo PATRIMONIO nao serao duplicados."],
    ["4. Setores e fornecedores serao criados automaticamente se nao existirem."],
    ["5. Apenas SETOR e EQUIPAMENTO sao obrigatorios. Os demais campos sao opcionais."],
    ["6. As datas podem estar em formato AAAA-MM-DD, DD/MM/AAAA ou numerico do Excel."],
    ["7. Apague as linhas de exemplo antes de preencher com seus dados reais."],
  ];

  const wsInstr = XLSX.utils.aoa_to_sheet(instrData);
  wsInstr["!cols"] = [
    { wch: 22 },
    { wch: 12 },
    { wch: 60 },
    { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(wb, wsInstr, "Instrucoes");

  // Generate buffer
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=modelo_importacao_equipamentos.xlsx",
    },
  });
}
