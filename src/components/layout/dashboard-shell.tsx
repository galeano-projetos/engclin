"use client";

import { useState, useMemo } from "react";
import { SessionProvider } from "next-auth/react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { CommandBar } from "@/components/ui/command-bar";

interface DashboardShellProps {
  children: React.ReactNode;
  userName?: string;
  tenantName?: string;
  userRole?: string;
  navPermissions: Record<string, boolean>;
}

export function DashboardShell({
  children,
  userName,
  tenantName,
  userRole,
  navPermissions,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const commandBarItems = useMemo(() => {
    const items: { id: string; label: string; group: string; href: string }[] = [];

    // Navigation items filtered by permissions
    const navLinks = [
      { id: "dashboard", label: "Dashboard", href: "/dashboard", perm: "dashboard.view" },
      { id: "equipamentos", label: "Equipamentos", href: "/equipamentos", perm: "equipment.view" },
      { id: "manutencoes", label: "Manutencoes", href: "/manutencoes", perm: "preventive.view" },
      { id: "chamados", label: "Chamados", href: "/chamados", perm: "ticket.view" },
      { id: "ordens", label: "Ordens de Servico", href: "/ordens-servico", perm: "ticket.view" },
      { id: "fisica", label: "Fisica Medica", href: "/fisica-medica", perm: "physics.view" },
      { id: "relatorios", label: "Relatorios", href: "/relatorios", perm: "report.view" },
      { id: "treinamentos", label: "Treinamentos", href: "/treinamentos", perm: "training.view" },
      { id: "ia", label: "Inteligencia Artificial", href: "/inteligencia", perm: "ai.view" },
      { id: "admin", label: "Administracao", href: "/admin", perm: "admin.view" },
    ];

    for (const link of navLinks) {
      if (navPermissions[link.perm] !== false) {
        items.push({ ...link, group: "Navegacao" });
      }
    }

    // Quick actions
    const actions = [
      { id: "novo-chamado", label: "Novo Chamado", href: "/chamados/novo", perm: "ticket.create" },
      { id: "nova-preventiva", label: "Nova Preventiva", href: "/manutencoes/nova", perm: "preventive.create" },
      { id: "novo-equipamento", label: "Novo Equipamento", href: "/equipamentos/novo", perm: "equipment.create" },
    ];

    for (const action of actions) {
      if (navPermissions[action.perm] !== false) {
        items.push({ ...action, group: "Acoes" });
      }
    }

    return items;
  }, [navPermissions]);

  return (
    <SessionProvider>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header
          userName={userName}
          tenantName={tenantName}
          userRole={userRole}
          onMenuToggle={() => setSidebarOpen(prev => !prev)}
        />
        <div className="flex flex-1">
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            navPermissions={navPermissions}
          />
          <div className="flex flex-1 flex-col">
            <main className="flex-1 p-4 pb-20 lg:p-6 lg:pb-6">{children}</main>
            <footer className="mb-16 border-t bg-white px-4 py-3 text-center text-xs text-gray-400 lg:mb-0">
              Uma empresa <span className="font-semibold text-gray-500">Seprorad</span>
            </footer>
          </div>
        </div>
        <BottomNav
          navPermissions={navPermissions}
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        />
        <CommandBar navItems={commandBarItems} />
      </div>
    </SessionProvider>
  );
}
