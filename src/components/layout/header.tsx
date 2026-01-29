"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const roleLabels: Record<string, string> = {
  MASTER: "Engenheira Clínica",
  TECNICO: "Técnico",
  COORDENADOR: "Coordenador",
  FISCAL: "Fiscal",
};

interface HeaderProps {
  userName?: string;
  tenantName?: string;
  userRole?: string;
  onMenuToggle: () => void;
}

export function Header({ userName, tenantName, userRole, onMenuToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>

        <h1 className="text-lg font-bold text-gray-900">EngClin</h1>

        {tenantName && (
          <span className="hidden text-sm text-gray-400 sm:inline">
            | {tenantName}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {userRole && (
          <Badge variant="info">
            {roleLabels[userRole] || userRole}
          </Badge>
        )}
        {userName && (
          <span className="hidden text-sm text-gray-600 sm:inline">
            {userName}
          </span>
        )}
        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm"
        >
          Sair
        </Button>
      </div>
    </header>
  );
}
