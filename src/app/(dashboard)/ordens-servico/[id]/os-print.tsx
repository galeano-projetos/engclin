function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface OsPrintData {
  number: number;
  status: string;
  issuedAt: string;
  completedAt: string | null;
  tenantName: string;
  tipo: string;
  equipmentName: string;
  equipmentBrand: string | null;
  equipmentModel: string | null;
  equipmentSerialNumber: string | null;
  equipmentPatrimony: string | null;
  unitName: string;
  serviceType: string | null;
  description: string | null;
  provider: string | null;
  urgency: string | null;
  scheduledDate: string | null;
  dueDate: string | null;
  executionDate: string | null;
  diagnosis: string | null;
  solution: string | null;
  partsUsed: string | null;
  timeSpent: number | null;
  cost: number | null;
  openedByName: string | null;
  assignedToName: string | null;
  notes: string | null;
}

const urgencyLabels: Record<string, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  CRITICA: "Crítica",
};

const serviceTypeLabels: Record<string, string> = {
  PREVENTIVA: "Preventiva",
  CALIBRACAO: "Calibração",
  TSE: "TSE",
};

const statusLabels: Record<string, string> = {
  ABERTA: "Aberta",
  EM_EXECUCAO: "Em Execução",
  CONCLUIDA: "Concluída",
};

export function printOs(os: OsPrintData, osNumber: string) {
  const w = window.open("", "_blank", "width=800,height=1000");
  if (!w) return;

  const brandModel = [os.equipmentBrand, os.equipmentModel].filter(Boolean).join(" / ");

  // Build observation rows
  const obsRows: string[] = [];
  if (os.description) obsRows.push(row("Descrição", escapeHtml(os.description)));
  if (os.diagnosis) obsRows.push(row("Diagnóstico", escapeHtml(os.diagnosis)));
  if (os.solution) obsRows.push(row("Solução", escapeHtml(os.solution)));
  if (os.partsUsed) obsRows.push(row("Peças utilizadas", escapeHtml(os.partsUsed)));
  if (os.timeSpent != null) obsRows.push(row("Tempo gasto", `${os.timeSpent} min`));
  if (os.cost != null)
    obsRows.push(
      row("Custo", os.cost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }))
    );
  if (os.notes) obsRows.push(row("Notas", escapeHtml(os.notes)));

  w.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${osNumber} — Ordem de Serviço</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      color: #333;
      padding: 15mm;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #333;
      padding-bottom: 10px;
      margin-bottom: 16px;
    }
    .header-left h1 {
      font-size: 14pt;
      font-weight: bold;
    }
    .header-left p {
      font-size: 9pt;
      color: #666;
      margin-top: 2px;
    }
    .header-right {
      text-align: right;
    }
    .header-right h2 {
      font-size: 16pt;
      font-weight: bold;
    }
    .header-right p {
      font-size: 10pt;
      margin-top: 2px;
    }
    .section {
      margin-bottom: 14px;
    }
    .section-title {
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      background: #f3f4f6;
      padding: 5px 8px;
      border: 1px solid #d1d5db;
      border-bottom: none;
    }
    .section-body {
      border: 1px solid #d1d5db;
      padding: 8px;
    }
    .row {
      display: flex;
      padding: 3px 0;
    }
    .row-label {
      font-weight: bold;
      width: 140px;
      flex-shrink: 0;
      font-size: 10pt;
    }
    .row-value {
      font-size: 10pt;
      flex: 1;
    }
    .signatures {
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
      gap: 40px;
    }
    .sig-block {
      flex: 1;
      text-align: center;
    }
    .sig-line {
      border-top: 1px solid #333;
      margin-top: 50px;
      padding-top: 6px;
      font-size: 10pt;
      font-weight: bold;
    }
    .sig-date {
      font-size: 9pt;
      color: #666;
      margin-top: 4px;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 8pt;
      color: #999;
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
    }
    @media print {
      body { padding: 10mm; }
      @page { size: A4; margin: 10mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${escapeHtml(os.tenantName || "Vitalis")}</h1>
      <p>Sistema de Gestão de Engenharia Clínica</p>
    </div>
    <div class="header-right">
      <h2>ORDEM DE SERVIÇO</h2>
      <p><strong>${osNumber}</strong></p>
      <p>Emissão: ${formatDate(os.issuedAt)}</p>
      <p>Status: ${statusLabels[os.status] || os.status}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Dados do Equipamento</div>
    <div class="section-body">
      ${row("Nome", escapeHtml(os.equipmentName))}
      ${brandModel ? row("Marca / Modelo", escapeHtml(brandModel)) : ""}
      ${os.equipmentSerialNumber ? row("Nº de Série", escapeHtml(os.equipmentSerialNumber)) : ""}
      ${os.equipmentPatrimony ? row("Patrimônio", escapeHtml(os.equipmentPatrimony)) : ""}
      ${row("Setor", escapeHtml(os.unitName))}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Dados do Serviço</div>
    <div class="section-body">
      ${row("Tipo", os.tipo === "Preventiva" ? "Manutenção Preventiva" : "Manutenção Corretiva")}
      ${os.serviceType ? row("Serviço", serviceTypeLabels[os.serviceType] || os.serviceType) : ""}
      ${os.provider ? row("Fornecedor", escapeHtml(os.provider)) : ""}
      ${os.urgency ? row("Urgência", urgencyLabels[os.urgency] || os.urgency) : ""}
      ${os.openedByName ? row("Aberto por", escapeHtml(os.openedByName)) : ""}
      ${os.assignedToName ? row("Técnico", escapeHtml(os.assignedToName)) : ""}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Cronograma</div>
    <div class="section-body">
      ${row("Emissão", formatDate(os.issuedAt))}
      ${os.scheduledDate ? row("Agendamento", formatDate(os.scheduledDate)) : ""}
      ${os.dueDate ? row("Vencimento", formatDate(os.dueDate)) : ""}
      ${os.executionDate ? row("Execução", formatDate(os.executionDate)) : ""}
      ${row("Conclusão", formatDate(os.completedAt))}
    </div>
  </div>

  ${obsRows.length > 0 ? `
  <div class="section">
    <div class="section-title">Observações</div>
    <div class="section-body">
      ${obsRows.join("")}
    </div>
  </div>
  ` : ""}

  <div class="signatures">
    <div class="sig-block">
      <div class="sig-line">Técnico Responsável</div>
      <div class="sig-date">Data: ____/____/________</div>
    </div>
    <div class="sig-block">
      <div class="sig-line">Solicitante</div>
      <div class="sig-date">Data: ____/____/________</div>
    </div>
  </div>

  <div class="footer">
    Documento gerado pelo sistema Vitalis — ${formatDate(new Date().toISOString())}
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`);
  w.document.close();
}

function row(label: string, value: string): string {
  return `<div class="row"><span class="row-label">${label}:</span><span class="row-value">${value}</span></div>`;
}
