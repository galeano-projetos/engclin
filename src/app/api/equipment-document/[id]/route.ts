import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/equipment-document/{id}
 *
 * Serve um documento anexado ao equipamento.
 * Requer autenticacao e valida que o documento pertence ao tenant do usuario.
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

  const doc = await prisma.equipmentDocument.findFirst({
    where: {
      id,
      tenantId: session.user.tenantId,
    },
    select: {
      name: true,
      fileData: true,
      mimeType: true,
    },
  });

  if (!doc || !doc.fileData) {
    return NextResponse.json({ error: "Documento nao encontrado" }, { status: 404 });
  }

  const buffer = Buffer.from(doc.fileData);
  const isInline = doc.mimeType.startsWith("image/") || doc.mimeType === "application/pdf";
  const disposition = isInline ? "inline" : "attachment";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `${disposition}; filename="${doc.name}"`,
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
