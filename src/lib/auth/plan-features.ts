import { Plan } from "@prisma/client";

/**
 * Define quais permissions sao restritas por plano.
 * Se uma permission NAO esta listada aqui, ela e liberada para todos os planos
 * (somente a checagem de role se aplica).
 */
const planRestrictions: Record<string, Plan[]> = {
  // Calibracao + TSE (PROFISSIONAL+)
  "preventive.calibracao": ["PROFISSIONAL", "ENTERPRISE"],
  "preventive.tse": ["PROFISSIONAL", "ENTERPRISE"],

  // Chamados corretivos (PROFISSIONAL+)
  "ticket.view": ["PROFISSIONAL", "ENTERPRISE"],
  "ticket.create": ["PROFISSIONAL", "ENTERPRISE"],
  "ticket.accept": ["PROFISSIONAL", "ENTERPRISE"],
  "ticket.resolve": ["PROFISSIONAL", "ENTERPRISE"],
  "ticket.close": ["PROFISSIONAL", "ENTERPRISE"],

  // Fisica Medica (PROFISSIONAL+)
  "physics.view": ["PROFISSIONAL", "ENTERPRISE"],
  "physics.create": ["PROFISSIONAL", "ENTERPRISE"],
  "physics.execute": ["PROFISSIONAL", "ENTERPRISE"],
  "physics.delete": ["PROFISSIONAL", "ENTERPRISE"],

  // Relatorios alem do inventario (PROFISSIONAL+)
  "report.calibracoes": ["PROFISSIONAL", "ENTERPRISE"],
  "report.custos": ["PROFISSIONAL", "ENTERPRISE"],
  "report.chamados": ["PROFISSIONAL", "ENTERPRISE"],

  // Fornecedores (PROFISSIONAL+)
  "provider.view": ["PROFISSIONAL", "ENTERPRISE"],
  "provider.create": ["PROFISSIONAL", "ENTERPRISE"],
  "provider.edit": ["PROFISSIONAL", "ENTERPRISE"],
  "provider.delete": ["PROFISSIONAL", "ENTERPRISE"],

  // Checklists Digitais (PROFISSIONAL+)
  "checklist.view": ["PROFISSIONAL", "ENTERPRISE"],
  "checklist.create": ["PROFISSIONAL", "ENTERPRISE"],
  "checklist.edit": ["PROFISSIONAL", "ENTERPRISE"],
  "checklist.delete": ["PROFISSIONAL", "ENTERPRISE"],

  // Contratos (PROFISSIONAL+)
  "contract.view": ["PROFISSIONAL", "ENTERPRISE"],
  "contract.create": ["PROFISSIONAL", "ENTERPRISE"],
  "contract.edit": ["PROFISSIONAL", "ENTERPRISE"],
  "contract.delete": ["PROFISSIONAL", "ENTERPRISE"],

  // Importacao Excel (PROFISSIONAL+)
  "import.execute": ["PROFISSIONAL", "ENTERPRISE"],

  // Tipos de Equipamento (PROFISSIONAL+)
  "equipmentType.view": ["PROFISSIONAL", "ENTERPRISE"],
  "equipmentType.create": ["PROFISSIONAL", "ENTERPRISE"],
  "equipmentType.edit": ["PROFISSIONAL", "ENTERPRISE"],
  "equipmentType.delete": ["PROFISSIONAL", "ENTERPRISE"],

  // Ordens de Servico (PROFISSIONAL+)
  "os.view": ["PROFISSIONAL", "ENTERPRISE"],
  "os.manage": ["PROFISSIONAL", "ENTERPRISE"],

  // Treinamentos (PROFISSIONAL+)
  "training.view": ["PROFISSIONAL", "ENTERPRISE"],
  "training.create": ["PROFISSIONAL", "ENTERPRISE"],
  "training.complete": ["PROFISSIONAL", "ENTERPRISE"],

  // Integracoes ERP (ENTERPRISE)
  "integration.view": ["ENTERPRISE"],
  "integration.manage": ["ENTERPRISE"],

  // Inteligencia IA (ENTERPRISE)
  "ai.view": ["ENTERPRISE"],

  // QR Code (ENTERPRISE)
  "qrcode.view": ["ENTERPRISE"],

  // Depreciacao de ativos (ENTERPRISE)
  "depreciation.view": ["ENTERPRISE"],
  "report.depreciacao": ["ENTERPRISE"],

  // PGTS - geracao (ENTERPRISE)
  "pgts.create": ["ENTERPRISE"],
};

/**
 * Verifica se o plano permite uma permission.
 * Retorna true se a permission nao tem restricao ou se o plano esta na lista.
 * Se plan e undefined (PLATFORM_ADMIN), libera tudo.
 */
export function planAllows(plan: Plan | undefined, permission: string): boolean {
  if (!plan) return true;
  const allowedPlans = planRestrictions[permission];
  if (!allowedPlans) return true;
  return allowedPlans.includes(plan);
}

/**
 * Retorna os service types permitidos pelo plano.
 */
export function getAllowedServiceTypes(plan: Plan | undefined): string[] {
  const types = ["PREVENTIVA"];
  if (planAllows(plan, "preventive.calibracao")) types.push("CALIBRACAO");
  if (planAllows(plan, "preventive.tse")) types.push("TSE");
  return types;
}

/**
 * Retorna as keys de relatorios permitidas pelo plano.
 */
export function getAllowedReportKeys(plan: Plan | undefined): string[] {
  const keys = ["inventario"];
  if (planAllows(plan, "report.calibracoes")) keys.push("calibracoes");
  if (planAllows(plan, "report.custos")) keys.push("custos");
  if (planAllows(plan, "report.chamados")) keys.push("chamados");
  if (planAllows(plan, "report.depreciacao")) keys.push("depreciacao");
  return keys;
}
