import { UserRole } from "@prisma/client";

/**
 * Mapa de permissões por funcionalidade e role.
 * true = permitido, false/ausente = negado.
 */
const permissions: Record<string, UserRole[]> = {
  // Equipamentos
  "equipment.view": ["MASTER", "TECNICO", "COORDENADOR", "FISCAL"],
  "equipment.create": ["MASTER", "TECNICO"],
  "equipment.edit": ["MASTER", "TECNICO"],
  "equipment.delete": ["MASTER"],

  // Manutenções Preventivas
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

  // Física Médica
  "physics.view": ["MASTER", "TECNICO", "FISCAL"],
  "physics.create": ["MASTER", "TECNICO"],
  "physics.execute": ["MASTER", "TECNICO"],
  "physics.delete": ["MASTER"],

  // Relatórios
  "report.view": ["MASTER", "TECNICO", "FISCAL"],

  // Dashboard
  "dashboard.view": ["MASTER", "TECNICO", "COORDENADOR", "FISCAL"],

  // Inteligência Artificial
  "ai.view": ["MASTER", "TECNICO"],

  // Administração
  "admin.users": ["MASTER"],
  "admin.units": ["MASTER"],
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

/** Itens de navegação visíveis por role */
export interface NavPermissions {
  dashboard: boolean;
  equipamentos: boolean;
  manutencoes: boolean;
  chamados: boolean;
  fisicaMedica: boolean;
  relatorios: boolean;
  inteligencia: boolean;
  admin: boolean;
}

export function getNavPermissions(role: UserRole): NavPermissions {
  return {
    dashboard: hasPermission(role, "dashboard.view"),
    equipamentos: hasPermission(role, "equipment.view"),
    manutencoes: hasPermission(role, "preventive.view"),
    chamados: hasPermission(role, "ticket.view"),
    fisicaMedica: hasPermission(role, "physics.view"),
    relatorios: hasPermission(role, "report.view"),
    inteligencia: hasPermission(role, "ai.view"),
    admin: hasPermission(role, "admin.users"),
  };
}
