/**
 * Script para criar o usuario PLATFORM_ADMIN (dono do SaaS).
 *
 * Uso:
 *   npx tsx scripts/seed-platform-admin.ts
 *
 * Requer DATABASE_URL no .env
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "diego@seprorad.com.br";
  const name = "Diego - Seprorad";
  const password = "admin123"; // Trocar em producao

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`Usuario ${email} ja existe. Atualizando role para PLATFORM_ADMIN...`);
    await prisma.user.update({
      where: { email },
      data: { role: "PLATFORM_ADMIN", tenantId: null },
    });
    console.log("Atualizado com sucesso.");
  } else {
    const hashedPassword = await hash(password, 10);
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "PLATFORM_ADMIN",
        tenantId: null,
      },
    });
    console.log(`Usuario PLATFORM_ADMIN criado: ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
