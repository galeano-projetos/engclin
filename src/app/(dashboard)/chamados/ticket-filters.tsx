"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function TicketFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/chamados?${params.toString()}`);
  }

  function handleClear() {
    router.push("/chamados");
  }

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <Select
        id="status"
        label="Status"
        placeholder="Todos"
        value={searchParams.get("status") || ""}
        options={[
          { value: "ABERTO", label: "Aberto" },
          { value: "EM_ATENDIMENTO", label: "Em atendimento" },
          { value: "RESOLVIDO", label: "Resolvido" },
          { value: "FECHADO", label: "Fechado" },
        ]}
        onChange={(e) => handleChange("status", e.target.value)}
      />
      <Select
        id="urgency"
        label="Urgência"
        placeholder="Todas"
        value={searchParams.get("urgency") || ""}
        options={[
          { value: "BAIXA", label: "Baixa" },
          { value: "MEDIA", label: "Média" },
          { value: "ALTA", label: "Alta" },
          { value: "CRITICA", label: "Crítica" },
        ]}
        onChange={(e) => handleChange("urgency", e.target.value)}
      />
      {searchParams.toString() && (
        <Button variant="ghost" onClick={handleClear}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
