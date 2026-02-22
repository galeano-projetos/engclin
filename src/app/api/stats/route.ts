import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const revalidate = 3600;

/**
 * GET /api/stats
 *
 * Retorna estatisticas publicas da plataforma (sem autenticacao).
 * Usado na landing page para social proof.
 */
export async function GET() {
  try {
    const [totalEquipments, totalTenants] = await Promise.all([
      prisma.equipment.count(),
      prisma.tenant.count({ where: { active: true } }),
    ]);

    const response = NextResponse.json({ totalEquipments, totalTenants });
    response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=1800");
    return response;
  } catch {
    return NextResponse.json({ totalEquipments: 0, totalTenants: 0 });
  }
}
