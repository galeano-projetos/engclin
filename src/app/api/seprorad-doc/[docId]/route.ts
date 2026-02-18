import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Client } from "pg";

export const dynamic = "force-dynamic";

/**
 * GET /api/seprorad-doc/{docId}
 *
 * Proxy para download de documentos do portal Seprorad.
 * Busca o PDF diretamente do banco da Seprorad e retorna ao usuario.
 * Requer autenticacao via sessao do engclin.
 * Valida que o documento pertence ao tenant do usuario.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { docId } = await params;

  // Validate cross-tenant access: document must be linked to a test in user's tenant
  const linkedTest = await prisma.medicalPhysicsTest.findFirst({
    where: {
      tenantId: session.user.tenantId,
      notes: { contains: `seprorad:${docId}` },
    },
    select: { id: true },
  });

  if (!linkedTest) {
    return NextResponse.json({ error: "Documento nao encontrado" }, { status: 404 });
  }

  const seproradUrl = process.env.SEPRORAD_DATABASE_URL;

  if (!seproradUrl) {
    return NextResponse.json(
      { error: "Servico indisponivel" },
      { status: 503 }
    );
  }

  const client = new Client({ connectionString: seproradUrl });

  try {
    await client.connect();

    const result = await client.query(
      "SELECT arquivo_nome, arquivo_conteudo FROM documentos WHERE id = $1 LIMIT 1",
      [docId]
    );

    if (result.rows.length === 0 || !result.rows[0].arquivo_conteudo) {
      return NextResponse.json(
        { error: "Documento nao encontrado" },
        { status: 404 }
      );
    }

    const { arquivo_nome, arquivo_conteudo } = result.rows[0];
    const buffer = Buffer.from(arquivo_conteudo);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${arquivo_nome || "laudo.pdf"}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar documento" },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
