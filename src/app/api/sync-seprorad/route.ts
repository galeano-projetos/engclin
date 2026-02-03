import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncSeproradDocuments } from "@/lib/seprorad/sync";

export const dynamic = "force-dynamic";

/**
 * POST /api/sync-seprorad
 *
 * Sincroniza documentos do portal Seprorad com os testes de fisica medica do engclin.
 *
 * Autenticacao:
 * - Via sessao do usuario logado (engclin) — usa tenantId da sessao
 * - Via API key (portal Seprorad) — requer header x-api-key + body { cnpj }
 */
export async function POST(request: Request) {
  // Try session-based auth first
  const session = await auth();

  let tenantId: string;
  let tenantCnpj: string;

  if (session?.user?.tenantId) {
    // Authenticated engclin user
    tenantId = session.user.tenantId;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { cnpj: true },
    });

    if (!tenant?.cnpj) {
      return NextResponse.json(
        { error: "Tenant sem CNPJ configurado" },
        { status: 400 }
      );
    }

    tenantCnpj = tenant.cnpj;
  } else {
    // Try API key auth (for Seprorad portal)
    const apiKey = request.headers.get("x-api-key");
    const expectedKey = process.env.SEPRORAD_API_KEY;

    if (!expectedKey || !apiKey || apiKey !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const cnpj = body?.cnpj;

    if (!cnpj) {
      return NextResponse.json(
        { error: "CNPJ obrigatorio no body da requisicao" },
        { status: 400 }
      );
    }

    // Find tenant by CNPJ
    const cnpjDigits = cnpj.replace(/\D/g, "");
    const tenant = await prisma.tenant.findFirst({
      where: {
        cnpj: { contains: cnpjDigits },
      },
      select: { id: true, cnpj: true },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: `Tenant com CNPJ ${cnpj} nao encontrado` },
        { status: 404 }
      );
    }

    tenantId = tenant.id;
    tenantCnpj = tenant.cnpj!;
  }

  const result = await syncSeproradDocuments(tenantId, tenantCnpj);

  return NextResponse.json(result);
}
