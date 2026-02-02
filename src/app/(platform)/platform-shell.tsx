"use client";

import { useState } from "react";
import { SessionProvider, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VitalisLogo } from "@/components/ui/vitalis-logo";

interface PlatformShellProps {
  children: React.ReactNode;
  userName: string;
}

const navItems = [
  {
    label: "Dashboard",
    href: "/platform",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    label: "Tenants",
    href: "/platform/tenants",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
];

export function PlatformShell({ children, userName }: PlatformShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <SessionProvider>
      <div className="flex min-h-screen flex-col bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
              aria-label="Abrir menu de navegacao"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <VitalisLogo size="sm" />
            <span className="hidden text-sm text-gray-400 sm:inline">| Plataforma</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="info">Plataforma</Badge>
            <span className="hidden text-sm text-gray-600 sm:inline">{userName}</span>
            <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/login" })} className="text-sm">
              Sair
            </Button>
          </div>
        </header>

        <div className="flex flex-1">
          {/* Sidebar overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              role="button"
              aria-label="Fechar menu"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Escape") setSidebarOpen(false); }}
            />
          )}

          {/* Sidebar */}
          <aside
            className={cn(
              "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-white transition-transform lg:static lg:translate-x-0",
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <nav className="flex flex-col gap-1 p-4" aria-label="Navegacao plataforma">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/platform" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main content */}
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
