"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type MessageType = "success" | "error" | "info";

export function SyncSeproradButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<MessageType>("info");
  const [errorDetails, setErrorDetails] = useState<string[]>([]);

  async function handleSync() {
    setLoading(true);
    setMessage(null);
    setErrorDetails([]);

    try {
      const res = await fetch("/api/sync-seprorad", { method: "POST" });

      let data;
      try {
        data = await res.json();
      } catch {
        setMessage("Resposta invalida do servidor.");
        setMessageType("error");
        return;
      }

      if (!res.ok) {
        setMessage(data.error || "Falha na sincronizacao.");
        setMessageType("error");
        return;
      }

      const hasChanges = data.updated > 0 || data.created > 0;
      const hasErrors = data.errors?.length > 0;

      if (hasChanges) {
        const parts: string[] = [];
        if (data.created > 0) parts.push(`${data.created} teste(s) criado(s)`);
        if (data.updated > 0) parts.push(`${data.updated} teste(s) atualizado(s)`);
        setMessage(`Sincronizacao concluida: ${parts.join(", ")}.`);
        setMessageType("success");
        router.refresh();
      } else if (hasErrors) {
        setMessage("Sincronizacao concluida com erros.");
        setMessageType("error");
      } else if (data.skipped > 0) {
        setMessage(`Nenhum documento novo. ${data.skipped} ja sincronizado(s).`);
        setMessageType("info");
      } else {
        setMessage("Nenhum documento encontrado no portal Seprorad.");
        setMessageType("info");
      }

      if (hasErrors) {
        setErrorDetails(data.errors);
      }
    } catch {
      setMessage("Erro de conexao com o servidor.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  const alertStyles = {
    success: "border-green-300 bg-green-50 text-green-800",
    error: "border-red-300 bg-red-50 text-red-800",
    info: "border-blue-300 bg-blue-50 text-blue-800",
  };

  return (
    <div>
      <Button
        variant="secondary"
        onClick={handleSync}
        loading={loading}
      >
        Sincronizar Seprorad
      </Button>

      {message && (
        <div className={`mt-3 rounded-md border p-3 text-sm ${alertStyles[messageType]}`}>
          <p className="font-medium">{message}</p>
          {errorDetails.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-xs">
              {errorDetails.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
