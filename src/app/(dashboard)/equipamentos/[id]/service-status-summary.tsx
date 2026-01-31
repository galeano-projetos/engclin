"use client";

import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface ServiceInfo {
  serviceType: string;
  label: string;
  lastExecution: string | null;
  nextDue: string | null;
  providerName: string | null;
  status: "ok" | "warning" | "overdue" | "na";
  maintenanceId: string | null;
}

interface ServiceStatusSummaryProps {
  services: ServiceInfo[];
}

const statusConfig = {
  ok: { label: "Em dia", variant: "success" as const, dot: "bg-green-500" },
  warning: { label: "Vencendo", variant: "warning" as const, dot: "bg-yellow-500" },
  overdue: { label: "Vencido", variant: "danger" as const, dot: "bg-red-500" },
  na: { label: "N/A", variant: "muted" as const, dot: "bg-gray-300" },
};

export function ServiceStatusSummary({ services }: ServiceStatusSummaryProps) {
  return (
    <div className="mt-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Status dos Servicos
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {services.map((svc) => {
          const cfg = statusConfig[svc.status];
          return (
            <div
              key={svc.serviceType}
              className="rounded-lg border bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  {svc.label}
                </h3>
                <Badge variant={cfg.variant}>{cfg.label}</Badge>
              </div>
              <div className="mt-3 space-y-1 text-xs text-gray-500">
                <p>
                  <span className="font-medium">Ultima execucao:</span>{" "}
                  {svc.lastExecution || "—"}
                </p>
                <p>
                  <span className="font-medium">Proximo vencimento:</span>{" "}
                  {svc.nextDue || "—"}
                </p>
                <p>
                  <span className="font-medium">Fornecedor:</span>{" "}
                  {svc.providerName || "—"}
                </p>
              </div>
              {svc.maintenanceId && (
                <div className="mt-3">
                  <Link
                    href={`/manutencoes/${svc.maintenanceId}`}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    Ver detalhes
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
