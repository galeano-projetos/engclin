import { requirePermission } from "@/lib/auth/require-role";
import { ReportViewer } from "./report-viewer";
import {
  getInventoryReport,
  getCalibrationReport,
  getCostReport,
  getTicketIndicatorsReport,
} from "./actions";
import { getAllowedReportKeys } from "@/lib/auth/plan-features";

export default async function RelatoriosPage() {
  const { plan } = await requirePermission("report.view");
  const allowedReportKeys = getAllowedReportKeys(plan);

  const allReports = [
    {
      key: "inventario",
      label: "Inventário Completo",
      description:
        "Lista todos os equipamentos cadastrados com dados completos de identificação, setor, criticidade e aquisição.",
      fetchAction: getInventoryReport,
    },
    {
      key: "calibracoes",
      label: "Calibrações Vencidas e a Vencer",
      description:
        "Manutenções preventivas vencidas e que vencerão nos próximos 60 dias, ordenadas por urgência.",
      fetchAction: getCalibrationReport,
    },
    {
      key: "custos",
      label: "Histórico de Custos por Equipamento",
      description:
        "Soma de custos de preventivas e corretivas por equipamento, com percentual sobre o valor de aquisição.",
      fetchAction: getCostReport,
    },
    {
      key: "chamados",
      label: "Indicadores de Chamados",
      description:
        "Tempo médio de atendimento e reincidência de chamados por equipamento.",
      fetchAction: getTicketIndicatorsReport,
    },
  ];

  const reports = allReports.filter(r => allowedReportKeys.includes(r.key));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
      <p className="mt-1 text-sm text-gray-500">
        Selecione um relatório para visualizar os dados e exportar em CSV.
      </p>
      <div className="mt-6">
        <ReportViewer reports={reports} />
      </div>
    </div>
  );
}
