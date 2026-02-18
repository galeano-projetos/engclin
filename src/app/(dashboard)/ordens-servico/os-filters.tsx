"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function OsFilters() {
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
    router.push(`/ordens-servico?${params.toString()}`);
  }

  function handleClear() {
    router.push("/ordens-servico");
  }

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <Select
        id="status"
        label="Status"
        placeholder="Todos"
        value={searchParams.get("status") || ""}
        options={[
          { value: "ABERTA", label: "Aberta" },
          { value: "EM_EXECUCAO", label: "Em Execução" },
          { value: "CONCLUIDA", label: "Concluída" },
        ]}
        onChange={(e) => handleChange("status", e.target.value)}
      />
      <Input
        id="dateFrom"
        label="Data de"
        type="date"
        value={searchParams.get("dateFrom") || ""}
        onChange={(e) => handleChange("dateFrom", e.target.value)}
      />
      <Input
        id="dateTo"
        label="Data até"
        type="date"
        value={searchParams.get("dateTo") || ""}
        onChange={(e) => handleChange("dateTo", e.target.value)}
      />
      {searchParams.toString() && (
        <Button variant="ghost" onClick={handleClear}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
