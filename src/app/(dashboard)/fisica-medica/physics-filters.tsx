"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Equipment {
  id: string;
  name: string;
}

interface PhysicsFiltersProps {
  equipments: Equipment[];
}

const typeOptions = [
  { value: "CONTROLE_QUALIDADE", label: "Controle de Qualidade" },
  { value: "TESTE_CONSTANCIA", label: "Teste de Constância" },
  { value: "LEVANTAMENTO_RADIOMETRICO", label: "Levantamento Radiométrico" },
  { value: "TESTE_RADIACAO_FUGA", label: "Radiação de Fuga" },
];

export function PhysicsFilters({ equipments }: PhysicsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/fisica-medica?${params.toString()}`);
  }

  function handleClear() {
    router.push("/fisica-medica");
  }

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <Select
        id="status"
        label="Status"
        placeholder="Todos"
        value={searchParams.get("status") || ""}
        options={[
          { value: "AGENDADA", label: "Agendado" },
          { value: "REALIZADA", label: "Realizado" },
          { value: "VENCIDA", label: "Vencido" },
        ]}
        onChange={(e) => handleChange("status", e.target.value)}
      />
      <Select
        id="type"
        label="Tipo de Teste"
        placeholder="Todos"
        value={searchParams.get("type") || ""}
        options={typeOptions}
        onChange={(e) => handleChange("type", e.target.value)}
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
