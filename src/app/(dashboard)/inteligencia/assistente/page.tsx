import { requirePermission } from "@/lib/auth/require-role";
import { ChatPanel } from "./chat-panel";
import { getEquipmentOptions } from "./chat-actions";
import Link from "next/link";

export default async function AssistentePage() {
  await requirePermission("ticket.create");

  const equipments = await getEquipmentOptions();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Assistente de Chamados
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Descreva o problema e o assistente ira abrir o chamado para voce.
          </p>
        </div>
        <Link
          href="/inteligencia"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Voltar para Inteligencia IA
        </Link>
      </div>
      <div className="mt-6">
        <ChatPanel equipments={equipments} />
      </div>
    </div>
  );
}
