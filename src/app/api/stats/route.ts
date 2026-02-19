import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

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

    return NextResponse.json({
      totalEquipments,
      totalTenants,
    });
  } catch {
    return NextResponse.json({ totalEquipments: 0, totalTenants: 0 });
  }
}
