import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const TENANT_ID = "cml5dm8vb00001dqj18peomsc";

async function main() {
  const eqCount = await prisma.equipment.count({ where: { tenantId: TENANT_ID } });
  const unitCount = await prisma.unit.count({ where: { tenantId: TENANT_ID } });
  const typeCount = await prisma.equipmentType.count({ where: { tenantId: TENANT_ID } });
  console.log(`Antes: ${eqCount} equips, ${unitCount} units, ${typeCount} types`);

  await prisma.equipment.deleteMany({ where: { tenantId: TENANT_ID } });
  console.log("Equipamentos removidos");
  await prisma.equipmentType.deleteMany({ where: { tenantId: TENANT_ID } });
  console.log("Tipos removidos");
  await prisma.unit.deleteMany({ where: { tenantId: TENANT_ID } });
  console.log("Unidades removidas");
  console.log("Limpo!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
