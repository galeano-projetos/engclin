import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Criar tenant de demonstracao
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
    data: { tenantId: tenant.id, name: "Centro Cirurgico" },
  });

  const radiologia = await prisma.unit.create({
    data: { tenantId: tenant.id, name: "Radiologia" },
  });

  console.log("Unidades criadas: UTI, Centro Cirurgico, Radiologia");

  // Criar fornecedores
  const labcal = await prisma.provider.create({
    data: {
      tenantId: tenant.id,
      name: "LabCal Calibracoes",
      cnpj: "11111111000101",
      phone: "(11) 99999-0001",
      email: "contato@labcal.com",
      contactPerson: "Joao Calibrador",
    },
  });

  const tsetech = await prisma.provider.create({
    data: {
      tenantId: tenant.id,
      name: "TSE Tech Seguranca",
      cnpj: "22222222000102",
      phone: "(11) 99999-0002",
      email: "contato@tsetech.com",
      contactPerson: "Pedro Eletrico",
    },
  });

  const prevmed = await prisma.provider.create({
    data: {
      tenantId: tenant.id,
      name: "PrevMed Manutencao",
      cnpj: "33333333000103",
      phone: "(11) 99999-0003",
      email: "contato@prevmed.com",
      contactPerson: "Ana Preventiva",
    },
  });

  console.log("Fornecedores criados: LabCal, TSE Tech, PrevMed");

  // Criar tipos de equipamento
  const tipoMonitor = await prisma.equipmentType.create({
    data: {
      tenantId: tenant.id,
      name: "Monitor Multiparametro",
      defaultCriticality: "A",
      preventivaPeriodicity: "SEMESTRAL",
      calibracaoPeriodicity: "ANUAL",
      tsePeriodicity: "ANUAL",
      reserveCount: 2,
      defaultPreventivaProviderId: prevmed.id,
      defaultCalibracaoProviderId: labcal.id,
      defaultTseProviderId: tsetech.id,
    },
  });

  const tipoVentilador = await prisma.equipmentType.create({
    data: {
      tenantId: tenant.id,
      name: "Ventilador Pulmonar",
      defaultCriticality: "A",
      preventivaPeriodicity: "TRIMESTRAL",
      calibracaoPeriodicity: "ANUAL",
      tsePeriodicity: "SEMESTRAL",
      reserveCount: 1,
      defaultPreventivaProviderId: prevmed.id,
      defaultCalibracaoProviderId: labcal.id,
      defaultTseProviderId: tsetech.id,
    },
  });

  const tipoBisturi = await prisma.equipmentType.create({
    data: {
      tenantId: tenant.id,
      name: "Bisturi Eletrico",
      defaultCriticality: "B",
      preventivaPeriodicity: "ANUAL",
      calibracaoPeriodicity: "ANUAL",
      tsePeriodicity: "SEMESTRAL",
      reserveCount: 1,
      defaultPreventivaProviderId: prevmed.id,
      defaultCalibracaoProviderId: labcal.id,
      defaultTseProviderId: tsetech.id,
    },
  });

  const tipoRaioX = await prisma.equipmentType.create({
    data: {
      tenantId: tenant.id,
      name: "Raio-X Digital",
      defaultCriticality: "A",
      preventivaPeriodicity: "SEMESTRAL",
      calibracaoPeriodicity: "ANUAL",
      tsePeriodicity: "ANUAL",
      reserveCount: 0,
      defaultPreventivaProviderId: prevmed.id,
      defaultCalibracaoProviderId: labcal.id,
      defaultTseProviderId: tsetech.id,
    },
  });

  console.log("Tipos de equipamento criados");

  // Criar usuarios
  const senhaHash = await hash("123456", 10);

  const master = await prisma.user.upsert({
    where: { email: "admin@engclin.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Ana Silva (Engenheira Clinica)",
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
      name: "Carlos Santos (Tecnico)",
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

  console.log("Usuarios criados: admin, tecnico, coordenador");

  // Associar usuarios as unidades
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

  // Criar equipamentos
  const monitor = await prisma.equipment.create({
    data: {
      tenantId: tenant.id,
      unitId: uti.id,
      equipmentTypeId: tipoMonitor.id,
      name: "Monitor Multiparametro",
      brand: "Philips",
      model: "IntelliVue MX450",
      serialNumber: "SN-001234",
      patrimony: "PAT-0001",
      criticality: "A",
      status: "ATIVO",
      ownershipType: "PROPRIO",
      acquisitionDate: new Date("2022-03-15"),
      acquisitionValue: 45000,
    },
  });

  const ventilador = await prisma.equipment.create({
    data: {
      tenantId: tenant.id,
      unitId: uti.id,
      equipmentTypeId: tipoVentilador.id,
      name: "Ventilador Pulmonar",
      brand: "Drager",
      model: "Evita V500",
      serialNumber: "SN-005678",
      patrimony: "PAT-0002",
      criticality: "A",
      status: "ATIVO",
      ownershipType: "PROPRIO",
      acquisitionDate: new Date("2021-08-10"),
      acquisitionValue: 120000,
    },
  });

  const bisturi = await prisma.equipment.create({
    data: {
      tenantId: tenant.id,
      unitId: centroCirurgico.id,
      equipmentTypeId: tipoBisturi.id,
      name: "Bisturi Eletrico",
      brand: "Medcir",
      model: "BE-3000",
      serialNumber: "SN-009876",
      patrimony: "PAT-0003",
      criticality: "B",
      status: "ATIVO",
      ownershipType: "PROPRIO",
      acquisitionDate: new Date("2023-01-20"),
      acquisitionValue: 15000,
    },
  });

  const raioX = await prisma.equipment.create({
    data: {
      tenantId: tenant.id,
      unitId: radiologia.id,
      equipmentTypeId: tipoRaioX.id,
      name: "Raio-X Digital",
      brand: "Siemens",
      model: "Ysio Max",
      serialNumber: "SN-112233",
      patrimony: "PAT-0004",
      criticality: "A",
      status: "ATIVO",
      ownershipType: "COMODATO",
      loanProvider: "Siemens Healthineers",
      acquisitionDate: new Date("2020-06-01"),
      acquisitionValue: 350000,
    },
  });

  console.log("Equipamentos criados");

  // Criar manutencoes preventivas com serviceType
  const now = new Date();

  // Monitor: calibracao realizada, proxima agendada
  await prisma.preventiveMaintenance.create({
    data: {
      tenantId: tenant.id,
      equipmentId: monitor.id,
      type: "Calibracao",
      serviceType: "CALIBRACAO",
      scheduledDate: new Date("2025-06-01"),
      dueDate: new Date("2025-06-30"),
      executionDate: new Date("2025-06-15"),
      status: "REALIZADA",
      providerId: labcal.id,
      provider: labcal.name,
      periodicityMonths: 12,
      cost: 800,
    },
  });

  await prisma.preventiveMaintenance.create({
    data: {
      tenantId: tenant.id,
      equipmentId: monitor.id,
      type: "Calibracao",
      serviceType: "CALIBRACAO",
      scheduledDate: new Date("2026-06-15"),
      dueDate: new Date("2026-06-15"),
      status: "AGENDADA",
      providerId: labcal.id,
      provider: labcal.name,
      periodicityMonths: 12,
    },
  });

  // Monitor: TSE vencendo em breve
  await prisma.preventiveMaintenance.create({
    data: {
      tenantId: tenant.id,
      equipmentId: monitor.id,
      type: "Teste de Seguranca Eletrica",
      serviceType: "TSE",
      scheduledDate: new Date("2026-01-15"),
      dueDate: new Date("2026-02-15"),
      status: "AGENDADA",
      providerId: tsetech.id,
      provider: tsetech.name,
      periodicityMonths: 12,
    },
  });

  // Monitor: preventiva em dia
  await prisma.preventiveMaintenance.create({
    data: {
      tenantId: tenant.id,
      equipmentId: monitor.id,
      type: "Manutencao Preventiva Geral",
      serviceType: "PREVENTIVA",
      scheduledDate: new Date("2026-04-01"),
      dueDate: new Date("2026-04-30"),
      status: "AGENDADA",
      providerId: prevmed.id,
      provider: prevmed.name,
      periodicityMonths: 6,
    },
  });

  // Ventilador: calibracao vencida
  await prisma.preventiveMaintenance.create({
    data: {
      tenantId: tenant.id,
      equipmentId: ventilador.id,
      type: "Calibracao",
      serviceType: "CALIBRACAO",
      scheduledDate: new Date("2025-12-01"),
      dueDate: new Date("2025-12-31"),
      status: "AGENDADA",
      providerId: labcal.id,
      provider: labcal.name,
      periodicityMonths: 12,
    },
  });

  // Ventilador: preventiva em dia
  await prisma.preventiveMaintenance.create({
    data: {
      tenantId: tenant.id,
      equipmentId: ventilador.id,
      type: "Manutencao Preventiva Geral",
      serviceType: "PREVENTIVA",
      scheduledDate: new Date("2026-03-01"),
      dueDate: new Date("2026-03-31"),
      status: "AGENDADA",
      providerId: prevmed.id,
      provider: prevmed.name,
      periodicityMonths: 3,
    },
  });

  // Bisturi: TSE agendada, calibracao em dia
  await prisma.preventiveMaintenance.create({
    data: {
      tenantId: tenant.id,
      equipmentId: bisturi.id,
      type: "Teste de Seguranca Eletrica",
      serviceType: "TSE",
      scheduledDate: new Date("2026-05-01"),
      dueDate: new Date("2026-05-31"),
      status: "AGENDADA",
      providerId: tsetech.id,
      provider: tsetech.name,
      periodicityMonths: 6,
    },
  });

  await prisma.preventiveMaintenance.create({
    data: {
      tenantId: tenant.id,
      equipmentId: bisturi.id,
      type: "Calibracao",
      serviceType: "CALIBRACAO",
      scheduledDate: new Date("2026-08-01"),
      dueDate: new Date("2026-08-31"),
      status: "AGENDADA",
      providerId: labcal.id,
      provider: labcal.name,
      periodicityMonths: 12,
    },
  });

  // Raio-X: tudo vencido (cenario critico)
  await prisma.preventiveMaintenance.create({
    data: {
      tenantId: tenant.id,
      equipmentId: raioX.id,
      type: "Calibracao",
      serviceType: "CALIBRACAO",
      scheduledDate: new Date("2025-10-01"),
      dueDate: new Date("2025-11-01"),
      status: "AGENDADA",
      providerId: labcal.id,
      provider: labcal.name,
      periodicityMonths: 12,
    },
  });

  await prisma.preventiveMaintenance.create({
    data: {
      tenantId: tenant.id,
      equipmentId: raioX.id,
      type: "Teste de Seguranca Eletrica",
      serviceType: "TSE",
      scheduledDate: new Date("2025-09-01"),
      dueDate: new Date("2025-10-01"),
      status: "AGENDADA",
      providerId: tsetech.id,
      provider: tsetech.name,
      periodicityMonths: 12,
    },
  });

  await prisma.preventiveMaintenance.create({
    data: {
      tenantId: tenant.id,
      equipmentId: raioX.id,
      type: "Manutencao Preventiva Geral",
      serviceType: "PREVENTIVA",
      scheduledDate: new Date("2025-11-01"),
      dueDate: new Date("2025-12-01"),
      status: "AGENDADA",
      providerId: prevmed.id,
      provider: prevmed.name,
      periodicityMonths: 6,
    },
  });

  // Criar chamado corretivo de exemplo
  await prisma.correctiveMaintenance.create({
    data: {
      tenantId: tenant.id,
      equipmentId: ventilador.id,
      openedById: coordenador.id,
      description: "Ventilador apresentando alarme de pressao intermitente durante uso em paciente.",
      urgency: "ALTA",
      status: "ABERTO",
    },
  });

  // Criar contrato de exemplo
  await prisma.contract.create({
    data: {
      tenantId: tenant.id,
      providerId: labcal.id,
      name: "Contrato Anual Calibracao 2026",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      value: 25000,
      equipments: {
        create: [
          { equipmentId: monitor.id },
          { equipmentId: ventilador.id },
          { equipmentId: raioX.id },
        ],
      },
    },
  });

  console.log("Manutencoes, chamados e contratos criados");
  console.log("\n--- Seed concluido! ---");
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
