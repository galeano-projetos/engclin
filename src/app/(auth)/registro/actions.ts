"use server";

import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { emailSchema, passwordSchema } from "@/lib/validation";
import { z } from "zod";
import { createCustomer, createSubscription, trialEndDate } from "@/lib/asaas";

const cnpjSchema = z.string().min(14).max(18);

const PLAN_PRICES: Record<string, { monthly: number; annual: number }> = {
  essencial: { monthly: 297, annual: 247 },
  profissional: { monthly: 728, annual: 607 },
  enterprise: { monthly: 998, annual: 832 },
};

// ============================================================
// Etapa 1: Cadastro (empresa + usuario)
// ============================================================

export async function registerStep1(formData: FormData): Promise<{ error?: string; tenantId?: string }> {
  try {
    const cnpj = (formData.get("cnpj") as string)?.trim();
    const name = (formData.get("name") as string)?.trim();
    const responsavel = (formData.get("responsavel") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim();
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const plan = (formData.get("plan") as string)?.trim() || "essencial";
    const ciclo = (formData.get("ciclo") as string)?.trim() || "mensal";

    // Validacoes
    if (!name) return { error: "Nome da empresa é obrigatório" };
    if (!responsavel) return { error: "Nome do responsável é obrigatório" };

    const cnpjResult = cnpjSchema.safeParse(cnpj);
    if (!cnpjResult.success) return { error: "CNPJ inválido" };

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) return { error: "Email inválido" };

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) return { error: passwordResult.error.issues[0].message };

    if (password !== confirmPassword) return { error: "As senhas não conferem" };

    const normalizedCnpj = cnpj.replace(/\D/g, "");

    // Verificar duplicados
    const existingCnpj = await prisma.tenant.findFirst({ where: { cnpj: normalizedCnpj } });
    if (existingCnpj) return { error: "Já existe uma empresa cadastrada com este CNPJ" };

    const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingEmail) return { error: "Este email já está cadastrado" };

    // Mapear plano
    const planMap: Record<string, "ESSENCIAL" | "PROFISSIONAL" | "ENTERPRISE"> = {
      essencial: "ESSENCIAL",
      profissional: "PROFISSIONAL",
      enterprise: "ENTERPRISE",
    };
    const tenantPlan = planMap[plan] || "ESSENCIAL";

    const hashedPassword = await hash(password, 10);
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 30);

    // Dados CNPJ opcionais
    const razaoSocial = (formData.get("razaoSocial") as string)?.trim() || null;
    const nomeFantasia = (formData.get("nomeFantasia") as string)?.trim() || null;

    let tenantId = "";

    await prisma.$transaction(async (tx) => {
      // Criar Lead
      await tx.lead.create({
        data: {
          name: responsavel,
          email: email.toLowerCase(),
          phone: phone || null,
          cnpj: normalizedCnpj,
          plan: `${plan}_${ciclo}`,
          source: "landing-page",
        },
      });

      // Criar Tenant em trial
      const tenant = await tx.tenant.create({
        data: {
          name,
          cnpj: normalizedCnpj,
          plan: tenantPlan,
          razaoSocial,
          nomeFantasia,
          subscriptionStatus: "TRIAL",
          trialEndsAt: trialEnds,
        },
      });

      tenantId = tenant.id;

      // Criar User MASTER
      await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: responsavel,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: "MASTER",
        },
      });
    });

    return { tenantId };
  } catch (error) {
    console.error("[registerStep1] Erro:", error instanceof Error ? error.message : error);
    return { error: "Erro ao criar cadastro. Tente novamente." };
  }
}

// ============================================================
// Etapa 2: Pagamento (cria subscription no Asaas)
// ============================================================

export async function registerPayment(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  try {
    const tenantId = formData.get("tenantId") as string;
    if (!tenantId) return { error: "Sessão inválida" };

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return { error: "Empresa não encontrada" };

    // Dados do cartao
    const holderName = (formData.get("holderName") as string)?.trim();
    const cardNumber = (formData.get("cardNumber") as string)?.replace(/\D/g, "");
    const expiryMonth = (formData.get("expiryMonth") as string)?.trim();
    const expiryYear = (formData.get("expiryYear") as string)?.trim();
    const ccv = (formData.get("ccv") as string)?.trim();
    const holderCpfCnpj = (formData.get("holderCpfCnpj") as string)?.replace(/\D/g, "");
    const holderPostalCode = (formData.get("holderPostalCode") as string)?.replace(/\D/g, "");
    const holderEmail = (formData.get("holderEmail") as string)?.trim();

    if (!holderName || !cardNumber || !expiryMonth || !expiryYear || !ccv || !holderCpfCnpj || !holderPostalCode) {
      return { error: "Preencha todos os dados do cartão" };
    }

    // Buscar usuario MASTER para email
    const masterUser = await prisma.user.findFirst({
      where: { tenantId, role: "MASTER" },
    });

    // Determinar valor pelo plano
    const planSlug = tenant.plan.toLowerCase() as keyof typeof PLAN_PRICES;
    const prices = PLAN_PRICES[planSlug] || PLAN_PRICES.essencial;
    const value = prices.monthly; // TODO: suportar ciclo anual

    // 1. Criar customer no Asaas
    const customer = await createCustomer({
      name: tenant.name,
      cpfCnpj: tenant.cnpj,
      email: masterUser?.email || holderEmail || "",
      phone: tenant.telefone || undefined,
      postalCode: tenant.cep || holderPostalCode,
      externalReference: tenantId,
    });

    // 2. Criar subscription com trial de 30 dias
    const subscription = await createSubscription({
      customer: customer.id,
      value,
      nextDueDate: trialEndDate(),
      cycle: "MONTHLY",
      description: `Vitalis - Plano ${tenant.plan}`,
      creditCard: {
        holderName,
        number: cardNumber,
        expiryMonth,
        expiryYear,
        ccv,
      },
      creditCardHolderInfo: {
        name: holderName,
        email: masterUser?.email || holderEmail || "",
        cpfCnpj: holderCpfCnpj,
        postalCode: holderPostalCode,
        addressNumber: tenant.numero || "0",
        phone: tenant.telefone || undefined,
      },
    });

    // 3. Salvar IDs no Tenant
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        asaasCustomerId: customer.id,
        asaasSubscriptionId: subscription.id,
        subscriptionStatus: "TRIAL",
      },
    });

    // 4. Marcar Lead como convertida
    await prisma.lead.updateMany({
      where: { email: masterUser?.email || "", converted: false },
      data: { converted: true, tenantId },
    });

    return { success: true };
  } catch (error) {
    console.error("[registerPayment] Erro:", error instanceof Error ? error.message : error);
    return { error: "Erro ao processar pagamento. Verifique os dados do cartão e tente novamente." };
  }
}
