"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EquipmentBulkBar } from "./equipment-bulk-bar";

interface EquipmentItem {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  patrimony: string | null;
  criticality: string;
  status: string;
  unitName: string;
  dots: { type: string; label: string; color: string }[];
  critLabel: string;
  critVariant: string;
}

interface EquipmentListClientProps {
  equipments: EquipmentItem[];
  providers: { id: string; name: string }[];
  allowedServiceTypes: string[];
  canBulk: boolean;
}

const statusLabels: Record<string, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  EM_MANUTENCAO: "Em manutencao",
  DESCARTADO: "Descartado",
};

const statusVariant: Record<string, "success" | "muted" | "info" | "danger"> = {
  ATIVO: "success",
  INATIVO: "muted",
  EM_MANUTENCAO: "info",
  DESCARTADO: "danger",
};

export function EquipmentListClient({ equipments, providers, allowedServiceTypes, canBulk }: EquipmentListClientProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allSelected = equipments.length > 0 && selectedIds.size === equipments.length;

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(equipments.map((e) => e.id)));
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
        {equipments.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-400">
            Nenhum equipamento encontrado.
          </div>
        ) : (
          equipments.map((eq) => (
            <div key={eq.id} className="flex items-start gap-3 rounded-lg border bg-white p-4 shadow-sm">
              {canBulk && (
                <input
                  type="checkbox"
                  checked={selectedIds.has(eq.id)}
                  onChange={() => toggleOne(eq.id)}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
              )}
              <Link href={`/equipamentos/${eq.id}`} className="min-w-0 flex-1 active:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{eq.name}</p>
                    <p className="text-sm text-gray-500">
                      {[eq.brand, eq.model].filter(Boolean).join(" — ") || ""}
                    </p>
                  </div>
                  <div className="ml-2 flex flex-shrink-0 gap-1.5">
                    <Badge variant={eq.critVariant as "success" | "muted" | "info" | "danger" | "warning"}>{eq.critLabel}</Badge>
                    <Badge variant={statusVariant[eq.status]}>{statusLabels[eq.status]}</Badge>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span>{eq.unitName}</span>
                  {eq.patrimony && <span>Pat: {eq.patrimony}</span>}
                  <div className="flex items-center gap-1">
                    {eq.dots.map((d) => (
                      <span
                        key={d.type}
                        className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white ${d.color}`}
                        title={d.type}
                      >
                        {d.label}
                      </span>
                    ))}
                  </div>
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
              {canBulk && (
                <th scope="col" className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </th>
              )}
              <th scope="col" className="px-4 py-3">Nome</th>
              <th scope="col" className="px-4 py-3">Marca / Modelo</th>
              <th scope="col" className="px-4 py-3">Setor</th>
              <th scope="col" className="px-4 py-3">Patrimonio</th>
              <th scope="col" className="px-4 py-3">Criticidade</th>
              <th scope="col" className="px-4 py-3">Servicos</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Acoes</span></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {equipments.length === 0 ? (
              <tr>
                <td colSpan={canBulk ? 9 : 8} className="px-4 py-8 text-center text-gray-400">
                  Nenhum equipamento encontrado.
                </td>
              </tr>
            ) : (
              equipments.map((eq) => (
                <tr key={eq.id} className="hover:bg-gray-50">
                  {canBulk && (
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(eq.id)}
                        onChange={() => toggleOne(eq.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {eq.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {[eq.brand, eq.model].filter(Boolean).join(" — ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {eq.unitName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {eq.patrimony || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={eq.critVariant as "success" | "muted" | "info" | "danger" | "warning"}>
                      {eq.critLabel}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {eq.dots.map((d) => (
                        <span
                          key={d.type}
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white ${d.color}`}
                          title={d.type}
                        >
                          {d.label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[eq.status]}>
                      {statusLabels[eq.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/equipamentos/${eq.id}`}
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
      {canBulk && (
        <EquipmentBulkBar
          selectedIds={Array.from(selectedIds)}
          onClear={() => setSelectedIds(new Set())}
          providers={providers}
          allowedServiceTypes={allowedServiceTypes}
        />
      )}
    </>
  );
}
