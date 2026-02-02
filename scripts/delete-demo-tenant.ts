import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenants = await prisma.tenant.findMany({
    include: { _count: { select: { users: true, equipments: true } } },
  });

  if (tenants.length === 0) {
    console.log("Nenhum tenant encontrado.");
    return;
  }

  for (const t of tenants) {
    console.log(`Deletando tenant: ${t.name} (${t.id}) - ${t._count.users} users, ${t._count.equipments} equips`);

    // Delete in order to avoid FK constraints
    await prisma.correctiveMaintenance.deleteMany({ where: { tenantId: t.id } });
    console.log("  -> Corretivas removidas");

    await prisma.preventiveMaintenance.deleteMany({ where: { tenantId: t.id } });
    console.log("  -> Preventivas removidas");

    await prisma.medicalPhysicsTest.deleteMany({ where: { tenantId: t.id } });
    console.log("  -> Testes fisica medica removidos");

    await prisma.contractEquipment.deleteMany({
      where: { contract: { tenantId: t.id } },
    });
    await prisma.contract.deleteMany({ where: { tenantId: t.id } });
    console.log("  -> Contratos removidos");

    await prisma.equipment.deleteMany({ where: { tenantId: t.id } });
    console.log("  -> Equipamentos removidos");

    await prisma.userUnit.deleteMany({ where: { user: { tenantId: t.id } } });
    await prisma.unit.deleteMany({ where: { tenantId: t.id } });
    console.log("  -> Unidades removidas");

    await prisma.user.deleteMany({ where: { tenantId: t.id } });
    console.log("  -> Usuarios removidos");

    await prisma.provider.deleteMany({ where: { tenantId: t.id } });
    console.log("  -> Fornecedores removidos");

    await prisma.equipmentType.deleteMany({ where: { tenantId: t.id } });
    console.log("  -> Tipos de equipamento removidos");

    await prisma.tenant.delete({ where: { id: t.id } });
    console.log("  -> Tenant removido!");
  }

  console.log("Todos os tenants demo removidos.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
