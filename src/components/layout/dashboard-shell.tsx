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
      <div className="min-h-screen bg-gray-50">
        <Header
          userName={userName}
          tenantName={tenantName}
          userRole={userRole}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className="flex">
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            navPermissions={navPermissions}
          />
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
