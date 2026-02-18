"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Equipment {
  id: string;
  name: string;
}

interface ProviderOption {
  id: string;
  name: string;
}

interface MaintenanceFiltersProps {
  equipments: Equipment[];
  providers: ProviderOption[];
  allowedServiceTypes?: string[];
}

const allServiceTypeOptions = [
  { value: "PREVENTIVA", label: "Preventiva" },
  { value: "CALIBRACAO", label: "Calibracao" },
  { value: "TSE", label: "TSE" },
];

export function MaintenanceFilters({ equipments, providers, allowedServiceTypes }: MaintenanceFiltersProps) {
  const serviceTypeOptions = allowedServiceTypes
    ? allServiceTypeOptions.filter(opt => allowedServiceTypes.includes(opt.value))
    : allServiceTypeOptions;
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
    router.push(`/manutencoes?${params.toString()}`);
  }

  function handleClear() {
    router.push("/manutencoes");
  }

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
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
        id="serviceType"
        label="Tipo de Servico"
        placeholder="Todos"
        value={searchParams.get("serviceType") || ""}
        options={serviceTypeOptions}
        onChange={(e) => handleChange("serviceType", e.target.value)}
      />
      <Select
        id="equipmentId"
        label="Equipamento"
        placeholder="Todos"
        value={searchParams.get("equipmentId") || ""}
        options={equipments.map((eq) => ({ value: eq.id, label: eq.name }))}
        onChange={(e) => handleChange("equipmentId", e.target.value)}
      />
      <Select
        id="providerId"
        label="Fornecedor"
        placeholder="Todos"
        value={searchParams.get("providerId") || ""}
        options={providers.map((p) => ({ value: p.id, label: p.name }))}
        onChange={(e) => handleChange("providerId", e.target.value)}
      />
      {searchParams.toString() && (
        <Button variant="ghost" onClick={handleClear}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
