"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SyncSeproradButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/sync-seprorad", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setMessage(`Erro: ${data.error || "Falha na sincronizacao"}`);
        return;
      }

      const parts: string[] = [];
      if (data.updated > 0) parts.push(`${data.updated} atualizado(s)`);
      if (data.created > 0) parts.push(`${data.created} criado(s)`);
      if (data.skipped > 0) parts.push(`${data.skipped} ja sincronizado(s)`);
      if (data.errors?.length > 0) parts.push(`${data.errors.length} erro(s)`);

      if (parts.length === 0) {
        setMessage("Nenhum documento novo encontrado.");
      } else {
        setMessage(parts.join(", "));
      }

      if (data.updated > 0 || data.created > 0) {
        router.refresh();
      }
    } catch {
      setMessage("Erro de conexao com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        onClick={handleSync}
        disabled={loading}
      >
        {loading ? "Sincronizando..." : "Sincronizar Seprorad"}
      </Button>
      {message && (
        <span className="text-sm text-gray-600">{message}</span>
      )}
    </div>
  );
}
