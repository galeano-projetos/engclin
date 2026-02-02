import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * API Route para verificar vencimentos e enviar alertas.
 * Deve ser chamado por um cron job (ex: Vercel Cron, GitHub Actions).
 *
 * GET /api/alerts/check?key=SECRET
 *
 * Frequência de alertas conforme PRD 3.5:
 * 60, 30, 20, 15, 10, 5 dias antes, no dia, e a cada 5 dias após.
 */

const ALERT_DAYS = [60, 30, 20, 15, 10, 5, 0];

export async function GET(request: Request) {
  // Autenticação simples via chave
  const authHeader = request.headers.get("authorization");
  const key = authHeader?.replace("Bearer ", "");

  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let alertsSent = 0;

  // 1. Verificar preventivas a vencer
  for (const daysAhead of ALERT_DAYS) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysAhead);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const preventives = await prisma.preventiveMaintenance.findMany({
      where: {
        status: "AGENDADA",
        dueDate: {
          gte: targetDate,
          lt: nextDay,
        },
      },
      include: {
        equipment: {
          select: { name: true, patrimony: true, tenantId: true },
        },
      },
    });

    for (const p of preventives) {
      // Buscar usuários MASTER e TECNICO do tenant
      const users = await prisma.user.findMany({
        where: {
          tenantId: p.equipment.tenantId,
          role: { in: ["MASTER", "TECNICO"] },
          active: true,
        },
        select: { email: true },
      });

      for (const user of users) {
        await sendNotification({
          tenantId: p.equipment.tenantId,
          recipientEmail: user.email,
          subject: `Calibração ${daysAhead === 0 ? "vence HOJE" : `vence em ${daysAhead} dias`}: ${p.equipment.name}`,
          message: `O equipamento ${p.equipment.name} (${p.equipment.patrimony || "s/ patrimônio"}) tem ${p.type} com vencimento em ${p.dueDate.toLocaleDateString("pt-BR")}.`,
          type: "VENCIMENTO_CALIBRACAO",
        });
        alertsSent++;
      }
    }
  }

  // 2. Verificar vencidas (a cada 5 dias após)
  const overdue = await prisma.preventiveMaintenance.findMany({
    where: {
      status: "AGENDADA",
      dueDate: { lt: today },
    },
    include: {
      equipment: {
        select: { name: true, patrimony: true, tenantId: true },
      },
    },
  });

  for (const p of overdue) {
    const daysPast = Math.floor(
      (today.getTime() - p.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Alertar a cada 5 dias após vencimento
    if (daysPast % 5 !== 0) continue;

    const users = await prisma.user.findMany({
      where: {
        tenantId: p.equipment.tenantId,
        role: { in: ["MASTER", "TECNICO"] },
        active: true,
      },
      select: { email: true },
    });

    for (const user of users) {
      await sendNotification({
        tenantId: p.equipment.tenantId,
        recipientEmail: user.email,
        subject: `VENCIDA há ${daysPast} dias: ${p.equipment.name}`,
        message: `O equipamento ${p.equipment.name} tem ${p.type} vencida desde ${p.dueDate.toLocaleDateString("pt-BR")}.`,
        type: "VENCIMENTO_CALIBRACAO",
      });
      alertsSent++;
    }
  }

  // 3. Verificar testes de física médica
  for (const daysAhead of ALERT_DAYS) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysAhead);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const physicsTests = await prisma.medicalPhysicsTest.findMany({
      where: {
        status: "AGENDADA",
        dueDate: {
          gte: targetDate,
          lt: nextDay,
        },
      },
      include: {
        equipment: {
          select: { name: true, patrimony: true, tenantId: true },
        },
      },
    });

    for (const t of physicsTests) {
      const users = await prisma.user.findMany({
        where: {
          tenantId: t.equipment.tenantId,
          role: { in: ["MASTER", "TECNICO"] },
          active: true,
        },
        select: { email: true },
      });

      for (const user of users) {
        await sendNotification({
          tenantId: t.equipment.tenantId,
          recipientEmail: user.email,
          subject: `Teste de física médica ${daysAhead === 0 ? "vence HOJE" : `vence em ${daysAhead} dias`}: ${t.equipment.name}`,
          message: `O equipamento ${t.equipment.name} tem teste de física médica com vencimento em ${t.dueDate.toLocaleDateString("pt-BR")}.`,
          type: "VENCIMENTO_FISICA_MEDICA",
        });
        alertsSent++;
      }
    }
  }

  return NextResponse.json({
    success: true,
    alertsSent,
    checkedAt: now.toISOString(),
  });
}
