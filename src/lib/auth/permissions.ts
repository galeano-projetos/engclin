import { UserRole, Plan } from "@prisma/client";
import { planAllows } from "./plan-features";

/**
 * Mapa de permissoes por funcionalidade e role.
 * true = permitido, false/ausente = negado.
 */
const permissions: Record<string, UserRole[]> = {
  // Equipamentos
  "equipment.view": ["MASTER", "TECNICO", "COORDENADOR", "FISCAL"],
  "equipment.create": ["MASTER", "TECNICO"],
  "equipment.edit": ["MASTER", "TECNICO"],
  "equipment.delete": ["MASTER"],

  // Manutencoes Preventivas
  "preventive.view": ["MASTER", "TECNICO", "COORDENADOR", "FISCAL"],
  "preventive.create": ["MASTER", "TECNICO"],
  "preventive.execute": ["MASTER", "TECNICO"],
  "preventive.delete": ["MASTER"],

  // Chamados Corretivos
  "ticket.view": ["MASTER", "TECNICO", "COORDENADOR", "FISCAL"],
  "ticket.create": ["MASTER", "TECNICO", "COORDENADOR"],
  "ticket.accept": ["MASTER", "TECNICO"],
  "ticket.resolve": ["MASTER", "TECNICO"],
  "ticket.close": ["MASTER", "TECNICO", "COORDENADOR"],

  // Fisica Medica
  "physics.view": ["MASTER", "TECNICO", "FISCAL"],
  "physics.create": ["MASTER", "TECNICO"],
  "physics.execute": ["MASTER", "TECNICO"],
  "physics.delete": ["MASTER"],

  // Relatorios
  "report.view": ["MASTER", "TECNICO", "FISCAL"],

  // Dashboard
  "dashboard.view": ["MASTER", "TECNICO", "COORDENADOR", "FISCAL"],

  // Inteligencia Artificial
  "ai.view": ["MASTER", "TECNICO"],

  // Administracao
  "admin.users": ["MASTER"],
  "admin.units": ["MASTER"],

  // Fornecedores
  "provider.view": ["MASTER", "TECNICO"],
  "provider.create": ["MASTER"],
  "provider.edit": ["MASTER"],
  "provider.delete": ["MASTER"],

  // Tipos de Equipamento
  "equipmentType.view": ["MASTER", "TECNICO"],
  "equipmentType.create": ["MASTER"],
  "equipmentType.edit": ["MASTER"],
  "equipmentType.delete": ["MASTER"],

  // Ordens de Servico
  "os.view": ["MASTER", "TECNICO", "COORDENADOR", "FISCAL"],
  "os.manage": ["MASTER", "TECNICO"],

  // Contratos
  "contract.view": ["MASTER", "TECNICO"],
  "contract.create": ["MASTER"],
  "contract.edit": ["MASTER"],
  "contract.delete": ["MASTER"],

  // Importacao
  "import.execute": ["MASTER"],

  // Plataforma (somente PLATFORM_ADMIN)
  "platform.tenants": ["PLATFORM_ADMIN"],
  "platform.dashboard": ["PLATFORM_ADMIN"],
  "platform.manage": ["PLATFORM_ADMIN"],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const allowed = permissions[permission];
  if (!allowed) return false;
  return allowed.includes(role);
}

export function getAllowedPermissions(role: UserRole): string[] {
  return Object.entries(permissions)
    .filter(([, roles]) => roles.includes(role))
    .map(([perm]) => perm);
}

/** Verifica se o role e PLATFORM_ADMIN */
export function isPlatformAdmin(role: UserRole | string): boolean {
  return role === "PLATFORM_ADMIN";
}

/** Itens de navegacao visiveis por role */
export interface NavPermissions {
  dashboard: boolean;
  equipamentos: boolean;
  manutencoes: boolean;
  chamados: boolean;
  ordensServico: boolean;
  fisicaMedica: boolean;
  relatorios: boolean;
  inteligencia: boolean;
  admin: boolean;
}

export function getNavPermissions(role: UserRole, plan?: Plan): NavPermissions {
  const roleBased = {
    dashboard: hasPermission(role, "dashboard.view"),
    equipamentos: hasPermission(role, "equipment.view"),
    manutencoes: hasPermission(role, "preventive.view"),
    chamados: hasPermission(role, "ticket.view"),
    ordensServico: hasPermission(role, "os.view"),
    fisicaMedica: hasPermission(role, "physics.view"),
    relatorios: hasPermission(role, "report.view"),
    inteligencia: hasPermission(role, "ai.view"),
    admin: hasPermission(role, "admin.users"),
  };

  if (!plan || isPlatformAdmin(role)) return roleBased;

  return {
    ...roleBased,
    chamados: roleBased.chamados && planAllows(plan, "ticket.view"),
    ordensServico: roleBased.ordensServico && planAllows(plan, "os.view"),
    fisicaMedica: roleBased.fisicaMedica && planAllows(plan, "physics.view"),
    inteligencia: roleBased.inteligencia && planAllows(plan, "ai.view"),
  };
}
