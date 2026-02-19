import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/pgts/{id}/download
 *
 * Retorna o PDF do PGTS armazenado no banco.
 * Valida que o documento pertence ao tenant do usuario.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const pgts = await prisma.pgtsVersion.findFirst({
    where: {
      id,
      tenantId: session.user.tenantId,
    },
    select: {
      fileName: true,
      fileData: true,
    },
  });

  if (!pgts || !pgts.fileData) {
    return NextResponse.json(
      { error: "PGTS nao encontrado" },
      { status: 404 }
    );
  }

  const buffer = Buffer.from(pgts.fileData);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pgts.fileName}"`,
      "Content-Length": String(buffer.length),
    },
  });
}
