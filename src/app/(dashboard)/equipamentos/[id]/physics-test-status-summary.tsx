"use client";

import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface PhysicsTestInfo {
  testType: string;
  label: string;
  lastExecution: string | null;
  nextDue: string | null;
  providerName: string | null;
  status: "ok" | "warning" | "overdue" | "na";
  testId: string | null;
}

interface PhysicsTestStatusSummaryProps {
  tests: PhysicsTestInfo[];
}

const statusConfig = {
  ok: { label: "Em dia", variant: "success" as const, dot: "bg-green-500" },
  warning: { label: "Vencendo", variant: "warning" as const, dot: "bg-yellow-500" },
  overdue: { label: "Vencido", variant: "danger" as const, dot: "bg-red-500" },
  na: { label: "N/A", variant: "muted" as const, dot: "bg-gray-300" },
};

export function PhysicsTestStatusSummary({ tests }: PhysicsTestStatusSummaryProps) {
  const activeTests = tests.filter((t) => t.status !== "na");

  if (activeTests.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Física Médica (RDC 611)
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {activeTests.map((test) => {
          const cfg = statusConfig[test.status];
          return (
            <div
              key={test.testType}
              className="rounded-lg border bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  {test.label}
                </h3>
                <Badge variant={cfg.variant}>{cfg.label}</Badge>
              </div>
              <div className="mt-3 space-y-1 text-xs text-gray-500">
                <p>
                  <span className="font-medium">Ultima execucao:</span>{" "}
                  {test.lastExecution || "—"}
                </p>
                <p>
                  <span className="font-medium">Proximo vencimento:</span>{" "}
                  {test.nextDue || "—"}
                </p>
                <p>
                  <span className="font-medium">Fornecedor:</span>{" "}
                  {test.providerName || "—"}
                </p>
              </div>
              {test.testId && (
                <div className="mt-3">
                  <Link
                    href={`/fisica-medica/${test.testId}`}
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
