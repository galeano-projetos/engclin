import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const roleLabels: Record<string, string> = {
  MASTER: "Engenharia Clinica",
  TECNICO: "Tecnico",
  COORDENADOR: "Coordenador",
  FISCAL: "Fiscal",
};

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as {
    id: string;
    name: string;
    email: string;
    role: string;
    tenantId: string;
    tenantName?: string;
  };

  const completions = await prisma.trainingCompletion.findMany({
    where: { userId: user.id },
    include: {
      training: {
        select: {
          id: true,
          title: true,
          validityMonths: true,
          equipmentType: { select: { name: true } },
        },
      },
    },
    orderBy: { completedAt: "desc" },
  });

  const now = new Date();

  const trainingStatus = completions.map((c) => {
    const expiry = new Date(c.completedAt);
    expiry.setMonth(expiry.getMonth() + c.training.validityMonths);
    const isValid = expiry > now;

    return {
      trainingId: c.training.id,
      title: c.training.title,
      equipmentTypeName: c.training.equipmentType?.name ?? null,
      completedAt: c.completedAt.toLocaleDateString("pt-BR"),
      expiresAt: expiry.toLocaleDateString("pt-BR"),
      isValid,
    };
  });

  const validCount = trainingStatus.filter((t) => t.isValid).length;
  const expiredCount = trainingStatus.filter((t) => !t.isValid).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>

      {/* Info do usuario */}
      <div className="mt-6 rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {user.name}
            </h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="info">
                {roleLabels[user.role] || user.role}
              </Badge>
              {user.tenantName && (
                <span className="text-xs text-gray-400">
                  {user.tenantName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resumo treinamentos */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Meus Treinamentos
        </h2>

        {trainingStatus.length > 0 && (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-blue-50 p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">
                {trainingStatus.length}
              </p>
              <p className="text-xs text-blue-600">Concluidos</p>
            </div>
            <div className="rounded-md bg-green-50 p-3 text-center">
              <p className="text-2xl font-bold text-green-700">
                {validCount}
              </p>
              <p className="text-xs text-green-600">Validos</p>
            </div>
            <div className="rounded-md bg-red-50 p-3 text-center">
              <p className="text-2xl font-bold text-red-700">
                {expiredCount}
              </p>
              <p className="text-xs text-red-600">Vencidos</p>
            </div>
          </div>
        )}

        {/* Lista */}
        {trainingStatus.length === 0 ? (
          <div className="mt-3 rounded-lg border bg-white p-6 text-center text-sm text-gray-400">
            Voce ainda nao concluiu nenhum treinamento.{" "}
            <Link
              href="/treinamentos"
              className="text-blue-600 hover:text-blue-800"
            >
              Ver treinamentos disponiveis
            </Link>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {trainingStatus.map((t) => (
              <Link key={t.trainingId} href={`/treinamentos/${t.trainingId}`}>
                <div className="rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {t.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t.equipmentTypeName && `${t.equipmentTypeName} — `}
                        Concluido em {t.completedAt}
                      </p>
                    </div>
                    <Badge variant={t.isValid ? "success" : "danger"}>
                      {t.isValid
                        ? `Valido ate ${t.expiresAt}`
                        : `Vencido em ${t.expiresAt}`}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
