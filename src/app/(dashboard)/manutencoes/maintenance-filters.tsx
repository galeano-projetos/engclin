"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Equipment {
  id: string;
  name: string;
}

interface MaintenanceFiltersProps {
  equipments: Equipment[];
}

export function MaintenanceFilters({ equipments }: MaintenanceFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/manutencoes?${params.toString()}`);
  }

  function handleClear() {
    router.push("/manutencoes");
  }

  return (
    <div className="mt-4 flex flex-wrap items-end gap-3">
      <Select
        id="status"
        label="Status"
        placeholder="Todos"
        value={searchParams.get("status") || ""}
        options={[
          { value: "AGENDADA", label: "Agendada" },
          { value: "REALIZADA", label: "Realizada" },
          { value: "VENCIDA", label: "Vencida" },
        ]}
        onChange={(e) => handleChange("status", e.target.value)}
      />
      <Select
        id="equipmentId"
        label="Equipamento"
        placeholder="Todos"
        value={searchParams.get("equipmentId") || ""}
        options={equipments.map((eq) => ({ value: eq.id, label: eq.name }))}
        onChange={(e) => handleChange("equipmentId", e.target.value)}
      />
      {searchParams.toString() && (
        <Button variant="ghost" onClick={handleClear}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
