"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

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
            <main className="flex-1 p-4 lg:p-6">{children}</main>
            <footer className="border-t bg-white px-4 py-3 text-center text-xs text-gray-400">
              Uma empresa <span className="font-semibold text-gray-500">Seprorad</span>
            </footer>
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}
