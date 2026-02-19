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
    "TIPO EQUIPAMENTO",
    "CRITICIDADE",
    "PATRIMONIO",
    "MARCA",
    "N/S",
    "MODELO",
    "REGISTRO ANVISA",
    "TIPO PROPRIEDADE",
    "FORNECEDOR COMODATO",
    "AQUISICAO",
    "VALOR AQUISICAO",
    "PLANO CONTINGENCIA",
    "STATUS",
    "DATA MANUTENCAO",
    "PROXIMA MANUTENCAO",
    "DATA CALIBRACAO",
    "PROXIMA CALIBRACAO",
    "DATA TSE",
    "PROXIMA TSE",
    "QUEM REALIZOU",
  ];

  const exampleRows = [
    [
      "UTI ADULTO",
      "MONITOR MULTIPARAMETRO",
      "Monitor Multiparametro",
      "1",
      "12345",
      "MINDRAY",
      "SN-001234",
      "BENEVISION N15",
      "80117800256",
      "PROPRIO",
      "",
      "2023-01-15",
      "45000",
      "Usar monitor reserva do setor. Acionar engenharia clinica imediatamente.",
      "ATIVO",
      "2025-03-10",
      "2026-03-10",
      "2025-03-10",
      "2026-03-10",
      "",
      "",
      "SAFETY MEDICAL",
    ],
    [
      "CENTRO CIRURGICO",
      "APARELHO DE ANESTESIA",
      "Aparelho de Anestesia",
      "1",
      "6308",
      "GE",
      "ME16095358",
      "9100C",
      "10349270036",
      "PROPRIO",
      "",
      "2019-07-01",
      "180000",
      "Transferir paciente para sala adjacente. Reserva no deposito central.",
      "ATIVO",
      "2025-02-15",
      "2026-02-15",
      "",
      "",
      "2025-02-15",
      "2026-02-15",
      "M.A HOSPITALAR",
    ],
    [
      "FARMACIA",
      "GELADEIRA CIENTIFICA",
      "Geladeira Cientifica",
      "2",
      "9800",
      "INDREL",
      "RC-2024-001",
      "RVV 440D",
      "",
      "PROPRIO",
      "",
      "2022-06-01",
      "12000",
      "",
      "ATIVO",
      "2025-06-01",
      "2026-06-01",
      "2025-06-01",
      "2026-06-01",
      "",
      "",
      "INDREL",
    ],
    [
      "CME",
      "AUTOCLAVE",
      "Autoclave",
      "1",
      "5500",
      "BAUMER",
      "AUT-5500",
      "HI VAC PLUS",
      "10234560012",
      "COMODATO",
      "BAUMER DO BRASIL",
      "2020-03-20",
      "",
      "Acionar fornecedor BAUMER para substituicao imediata.",
      "ATIVO",
      "2025-01-20",
      "2025-07-20",
      "",
      "",
      "2025-01-20",
      "2025-07-20",
      "BAUMER ASSISTENCIA",
    ],
    [
      "PRONTO ATENDIMENTO",
      "DESFIBRILADOR",
      "Desfibrilador",
      "1",
      "7890",
      "CMOS DRAKE",
      "DEF-7890",
      "LIFE 400 FUTURA",
      "80006700010",
      "PROPRIO",
      "",
      "2021-11-10",
      "28000",
      "Desfibrilador reserva no carro de emergencia do corredor.",
      "ATIVO",
      "2025-05-10",
      "2026-05-10",
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
    { wch: 22 },  // SETOR
    { wch: 28 },  // EQUIPAMENTO
    { wch: 26 },  // TIPO EQUIPAMENTO
    { wch: 12 },  // CRITICIDADE
    { wch: 12 },  // PATRIMONIO
    { wch: 15 },  // MARCA
    { wch: 18 },  // N/S
    { wch: 20 },  // MODELO
    { wch: 16 },  // REGISTRO ANVISA
    { wch: 16 },  // TIPO PROPRIEDADE
    { wch: 22 },  // FORNECEDOR COMODATO
    { wch: 12 },  // AQUISICAO
    { wch: 16 },  // VALOR AQUISICAO
    { wch: 55 },  // PLANO CONTINGENCIA
    { wch: 14 },  // STATUS
    { wch: 18 },  // DATA MANUTENCAO
    { wch: 20 },  // PROXIMA MANUTENCAO
    { wch: 18 },  // DATA CALIBRACAO
    { wch: 20 },  // PROXIMA CALIBRACAO
    { wch: 14 },  // DATA TSE
    { wch: 16 },  // PROXIMA TSE
    { wch: 22 },  // QUEM REALIZOU
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Equipamentos");

  // Instructions sheet
  const instrData = [
    ["INSTRUCOES PARA PREENCHIMENTO DA PLANILHA DE IMPORTACAO - VITALIS"],
    [],
    ["COLUNA", "OBRIGATORIO", "DESCRICAO", "EXEMPLO"],
    ["SETOR", "Sim", "Nome do setor/unidade onde o equipamento esta localizado", "UTI ADULTO"],
    ["EQUIPAMENTO", "Sim", "Nome do equipamento", "MONITOR MULTIPARAMETRO"],
    ["TIPO EQUIPAMENTO", "Nao", "Tipo/categoria do equipamento (criado automaticamente se nao existir)", "Monitor Multiparametro"],
    ["CRITICIDADE", "Nao", "Nivel de criticidade: 1 ou A (Alta), 2 ou B (Media), 3 ou C (Baixa). Padrao: C", "1"],
    ["PATRIMONIO", "Nao", "Numero de patrimonio do equipamento (usado para evitar duplicatas)", "12345"],
    ["MARCA", "Nao", "Marca/fabricante do equipamento", "MINDRAY"],
    ["N/S", "Nao", "Numero de serie do equipamento", "SN-001234"],
    ["MODELO", "Nao", "Modelo do equipamento", "BENEVISION N15"],
    ["REGISTRO ANVISA", "Nao", "Numero do registro ANVISA do equipamento", "80117800256"],
    ["TIPO PROPRIEDADE", "Nao", "PROPRIO ou COMODATO. Padrao: PROPRIO", "PROPRIO"],
    ["FORNECEDOR COMODATO", "Nao", "Nome do fornecedor do comodato (quando tipo propriedade = COMODATO)", "BAUMER DO BRASIL"],
    ["AQUISICAO", "Nao", "Data de aquisicao (formato: AAAA-MM-DD ou DD/MM/AAAA)", "2023-01-15"],
    ["VALOR AQUISICAO", "Nao", "Valor de aquisicao em reais (aceita formatos: 45000, 45.000,00, R$ 45.000)", "45000"],
    ["PLANO CONTINGENCIA", "Nao", "Plano de contingencia para equipamentos criticos (texto livre)", "Usar monitor reserva do setor"],
    ["STATUS", "Nao", "Status: ATIVO, INATIVO, EM MANUTENCAO ou DESCARTADO. Padrao: ATIVO", "ATIVO"],
    ["DATA MANUTENCAO", "Nao", "Data da ultima manutencao preventiva realizada", "2025-03-10"],
    ["PROXIMA MANUTENCAO", "Nao", "Data da proxima manutencao preventiva prevista", "2026-03-10"],
    ["DATA CALIBRACAO", "Nao", "Data da ultima calibracao realizada", "2025-03-10"],
    ["PROXIMA CALIBRACAO", "Nao", "Data da proxima calibracao prevista", "2026-03-10"],
    ["DATA TSE", "Nao", "Data do ultimo Teste de Seguranca Eletrica realizado", "2025-05-10"],
    ["PROXIMA TSE", "Nao", "Data do proximo Teste de Seguranca Eletrica previsto", "2026-05-10"],
    ["QUEM REALIZOU", "Nao", "Nome da empresa/fornecedor que realizou os servicos", "SAFETY MEDICAL"],
    [],
    ["OBSERVACOES IMPORTANTES:"],
    ["1. A primeira aba da planilha sera utilizada para a importacao."],
    ["2. A primeira linha deve conter os nomes das colunas (cabecalho)."],
    ["3. Equipamentos com mesmo PATRIMONIO nao serao duplicados."],
    ["4. Setores, fornecedores e tipos de equipamento serao criados automaticamente se nao existirem."],
    ["5. Apenas SETOR e EQUIPAMENTO sao obrigatorios. Todos os demais campos sao opcionais."],
    ["6. Campos nao preenchidos podem ser completados depois, editando o equipamento no sistema."],
    ["7. As datas podem estar em formato AAAA-MM-DD, DD/MM/AAAA ou numerico do Excel."],
    ["8. Apague as linhas de exemplo antes de preencher com seus dados reais."],
  ];

  const wsInstr = XLSX.utils.aoa_to_sheet(instrData);
  wsInstr["!cols"] = [
    { wch: 22 },
    { wch: 12 },
    { wch: 65 },
    { wch: 30 },
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
