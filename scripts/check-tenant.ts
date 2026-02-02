import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenants = await prisma.tenant.findMany({
    include: { _count: { select: { users: true, equipments: true, units: true } } },
  });
  console.log(JSON.stringify(tenants, null, 2));
}
main().finally(() => prisma.$disconnect());
