import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Criar tenant de demonstração
  const tenant = await prisma.tenant.upsert({
    where: { cnpj: "00000000000100" },
    update: {},
    create: {
      name: "Hospital Demo HCAN",
      cnpj: "00000000000100",
      plan: "PROFISSIONAL",
    },
  });

  console.log("Tenant criado:", tenant.name);

  // Criar unidades/setores
  const uti = await prisma.unit.create({
    data: { tenantId: tenant.id, name: "UTI" },
  });

  const centroCirurgico = await prisma.unit.create({
    data: { tenantId: tenant.id, name: "Centro Cirúrgico" },
  });

  const radiologia = await prisma.unit.create({
    data: { tenantId: tenant.id, name: "Radiologia" },
  });

  console.log("Unidades criadas: UTI, Centro Cirúrgico, Radiologia");

  // Criar usuários
  const senhaHash = await hash("123456", 10);

  const master = await prisma.user.upsert({
    where: { email: "admin@engclin.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Ana Silva (Engenheira Clínica)",
      email: "admin@engclin.com",
      password: senhaHash,
      role: "MASTER",
    },
  });

  const tecnico = await prisma.user.upsert({
    where: { email: "tecnico@engclin.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Carlos Santos (Técnico)",
      email: "tecnico@engclin.com",
      password: senhaHash,
      role: "TECNICO",
    },
  });

  const coordenador = await prisma.user.upsert({
    where: { email: "coordenador@engclin.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Maria Oliveira (Coordenadora)",
      email: "coordenador@engclin.com",
      password: senhaHash,
      role: "COORDENADOR",
    },
  });

  console.log("Usuários criados: admin, tecnico, coordenador");

  // Associar usuários às unidades
  await prisma.userUnit.createMany({
    data: [
      { userId: master.id, unitId: uti.id },
      { userId: master.id, unitId: centroCirurgico.id },
      { userId: master.id, unitId: radiologia.id },
      { userId: tecnico.id, unitId: uti.id },
      { userId: tecnico.id, unitId: centroCirurgico.id },
      { userId: coordenador.id, unitId: uti.id },
    ],
    skipDuplicates: true,
  });

  // Criar alguns equipamentos de exemplo
  await prisma.equipment.createMany({
    data: [
      {
        tenantId: tenant.id,
        unitId: uti.id,
        name: "Monitor Multiparâmetro",
        brand: "Philips",
        model: "IntelliVue MX450",
        serialNumber: "SN-001234",
        patrimony: "PAT-0001",
        criticality: "A",
        status: "ATIVO",
        acquisitionDate: new Date("2022-03-15"),
        acquisitionValue: 45000,
      },
      {
        tenantId: tenant.id,
        unitId: uti.id,
        name: "Ventilador Pulmonar",
        brand: "Dräger",
        model: "Evita V500",
        serialNumber: "SN-005678",
        patrimony: "PAT-0002",
        criticality: "A",
        status: "ATIVO",
        acquisitionDate: new Date("2021-08-10"),
        acquisitionValue: 120000,
      },
      {
        tenantId: tenant.id,
        unitId: centroCirurgico.id,
        name: "Bisturi Elétrico",
        brand: "Medcir",
        model: "BE-3000",
        serialNumber: "SN-009876",
        patrimony: "PAT-0003",
        criticality: "B",
        status: "ATIVO",
        acquisitionDate: new Date("2023-01-20"),
        acquisitionValue: 15000,
      },
      {
        tenantId: tenant.id,
        unitId: radiologia.id,
        name: "Raio-X Digital",
        brand: "Siemens",
        model: "Ysio Max",
        serialNumber: "SN-112233",
        patrimony: "PAT-0004",
        criticality: "A",
        status: "ATIVO",
        acquisitionDate: new Date("2020-06-01"),
        acquisitionValue: 350000,
      },
    ],
  });

  console.log("Equipamentos de exemplo criados");
  console.log("\n--- Seed concluído! ---");
  console.log("Login: admin@engclin.com / 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
