"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Unit {
  id: string;
  name: string;
}

interface EquipmentFiltersProps {
  units: Unit[];
}

export function EquipmentFilters({ units }: EquipmentFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") || "");

  const createQueryString = useCallback(
    (params: Record<string, string>) => {
      const current = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(params)) {
        if (value) {
          current.set(key, value);
        } else {
          current.delete(key);
        }
      }

      return current.toString();
    },
    [searchParams]
  );

  function handleSearch() {
    const qs = createQueryString({ q });
    router.push(`/equipamentos?${qs}`);
  }

  function handleFilterChange(key: string, value: string) {
    const qs = createQueryString({ [key]: value });
    router.push(`/equipamentos?${qs}`);
  }

  function handleClear() {
    setQ("");
    router.push("/equipamentos");
  }

  return (
    <div className="mt-4 flex flex-wrap items-end gap-3">
      <div className="flex flex-1 items-end gap-2" style={{ minWidth: 200 }}>
        <div className="flex-1">
          <Input
            id="search"
            label="Buscar"
            placeholder="Nome, marca, modelo, patrimônio..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} className="shrink-0">
          Buscar
        </Button>
      </div>

      <Select
        id="unitId"
        label="Setor"
        placeholder="Todos"
        value={searchParams.get("unitId") || ""}
        options={units.map((u) => ({ value: u.id, label: u.name }))}
        onChange={(e) => handleFilterChange("unitId", e.target.value)}
      />

      <Select
        id="criticality"
        label="Criticidade"
        placeholder="Todas"
        value={searchParams.get("criticality") || ""}
        options={[
          { value: "A", label: "1 - Critico" },
          { value: "B", label: "2 - Moderado" },
          { value: "C", label: "3 - Baixo" },
        ]}
        onChange={(e) => handleFilterChange("criticality", e.target.value)}
      />

      <Select
        id="status"
        label="Status"
        placeholder="Todos"
        value={searchParams.get("status") || ""}
        options={[
          { value: "ATIVO", label: "Ativo" },
          { value: "INATIVO", label: "Inativo" },
          { value: "EM_MANUTENCAO", label: "Em manutenção" },
          { value: "DESCARTADO", label: "Descartado" },
        ]}
        onChange={(e) => handleFilterChange("status", e.target.value)}
      />

      {searchParams.toString() && (
        <Button variant="ghost" onClick={handleClear} className="shrink-0">
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
