import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/equipment/{id}/photo
 *
 * Serve a foto do equipamento armazenada no banco.
 * Rota publica (usada na pagina do QR Code).
 * Cache de 1 hora para evitar queries repetidas.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const equipment = await prisma.equipment.findUnique({
    where: { id },
    select: { photoData: true, photoMimeType: true },
  });

  if (!equipment?.photoData) {
    return NextResponse.json({ error: "Foto nao encontrada" }, { status: 404 });
  }

  const buffer = Buffer.from(equipment.photoData);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": equipment.photoMimeType || "image/jpeg",
      "Content-Length": String(buffer.length),
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
