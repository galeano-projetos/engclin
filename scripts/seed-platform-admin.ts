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
  // Remover usuario antigo se existir
  const old = await prisma.user.findUnique({ where: { email: "diego@seprorad.com.br" } });
  if (old && old.role === "PLATFORM_ADMIN") {
    await prisma.user.delete({ where: { email: "diego@seprorad.com.br" } });
    console.log("Usuario antigo diego@seprorad.com.br removido.");
  }

  const email = "galeano88@gmail.com";
  const name = "Diego Galeano";
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
