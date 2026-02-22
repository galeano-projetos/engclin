"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MaintenanceBulkBar } from "./maintenance-bulk-bar";

interface MaintenanceItem {
  id: string;
  type: string;
  serviceType: string;
  serviceTypeLabel: string;
  displayStatus: string;
  scheduledDate: string;
  dueDate: string;
  equipmentName: string;
  equipmentPatrimony: string | null;
  providerName: string | null;
  isScheduled: boolean;
}

interface MaintenanceListClientProps {
  items: MaintenanceItem[];
  canBulkExecute: boolean;
}

const statusLabels: Record<string, string> = {
  AGENDADA: "Agendada",
  REALIZADA: "Realizada",
  VENCIDA: "Vencida",
};

const statusVariant: Record<string, "info" | "success" | "danger"> = {
  AGENDADA: "info",
  REALIZADA: "success",
  VENCIDA: "danger",
};

export function MaintenanceListClient({ items, canBulkExecute }: MaintenanceListClientProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Only scheduled items can be selected for bulk execution
  const selectableItems = items.filter((m) => m.isScheduled);
  const allSelected = selectableItems.length > 0 && selectableItems.every((m) => selectedIds.has(m.id));

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableItems.map((m) => m.id)));
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <>
      {/* Mobile: Cards */}
      <div className="mt-4 space-y-3 lg:hidden">
        {items.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-400">
            Nenhuma manutencao encontrada.
          </div>
        ) : (
          items.map((m) => (
            <div key={m.id} className="flex items-start gap-3 rounded-lg border bg-white p-4 shadow-sm">
              {canBulkExecute && m.isScheduled && (
                <input
                  type="checkbox"
                  checked={selectedIds.has(m.id)}
                  onChange={() => toggleOne(m.id)}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
              )}
              <Link href={`/manutencoes/${m.id}`} className="min-w-0 flex-1 active:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{m.equipmentName}</p>
                    {m.equipmentPatrimony && (
                      <p className="text-xs text-gray-400">{m.equipmentPatrimony}</p>
                    )}
                  </div>
                  <Badge variant={statusVariant[m.displayStatus] || "info"}>
                    {statusLabels[m.displayStatus] || m.displayStatus}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="muted">{m.serviceTypeLabel}</Badge>
                  <span className="text-sm text-gray-600">{m.type}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                  {m.providerName && <span>{m.providerName}</span>}
                  <span>Agendada: {m.scheduledDate}</span>
                  <span>Vencimento: {m.dueDate}</span>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>

      {/* Desktop: Tabela */}
      <div className="mt-4 hidden overflow-x-auto rounded-lg border bg-white shadow-sm lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              {canBulkExecute && (
                <th scope="col" className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </th>
              )}
              <th scope="col" className="px-4 py-3">Equipamento</th>
              <th scope="col" className="px-4 py-3">Servico</th>
              <th scope="col" className="px-4 py-3">Fornecedor</th>
              <th scope="col" className="px-4 py-3">Data Agendada</th>
              <th scope="col" className="px-4 py-3">Vencimento</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Acoes</span></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.length === 0 ? (
              <tr>
                <td colSpan={canBulkExecute ? 8 : 7} className="px-4 py-8 text-center text-gray-400">
                  Nenhuma manutencao encontrada.
                </td>
              </tr>
            ) : (
              items.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  {canBulkExecute && (
                    <td className="px-3 py-3">
                      {m.isScheduled ? (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(m.id)}
                          onChange={() => toggleOne(m.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      ) : (
                        <span />
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {m.equipmentName}
                    </div>
                    {m.equipmentPatrimony && (
                      <div className="text-xs text-gray-400">
                        {m.equipmentPatrimony}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="muted">{m.serviceTypeLabel}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {m.providerName || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {m.scheduledDate}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {m.dueDate}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[m.displayStatus] || "info"}>
                      {statusLabels[m.displayStatus] || m.displayStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/manutencoes/${m.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk action bar */}
      {canBulkExecute && (
        <MaintenanceBulkBar
          selectedIds={Array.from(selectedIds)}
          onClear={() => setSelectedIds(new Set())}
        />
      )}
    </>
  );
}
