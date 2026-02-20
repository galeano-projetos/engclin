"use server";

import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { emailSchema, passwordSchema } from "@/lib/validation";
import { z } from "zod";
import { findCustomerByExternalReference, createCustomer, createSubscription, trialEndDate } from "@/lib/asaas";

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
          telefone: phone || null,
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

    // Já possui subscription? (retry/duplo clique)
    if (tenant.asaasSubscriptionId) {
      console.log(`[registerPayment] Tenant ${tenantId} ja possui subscription ${tenant.asaasSubscriptionId}, ignorando`);
      return { success: true };
    }

    // Dados do cartao
    const holderName = (formData.get("holderName") as string)?.trim();
    const cardNumber = (formData.get("cardNumber") as string)?.replace(/\D/g, "");
    const expiryMonth = (formData.get("expiryMonth") as string)?.trim();
    const expiryYear = (formData.get("expiryYear") as string)?.trim();
    const ccv = (formData.get("ccv") as string)?.trim();
    const holderCpfCnpj = (formData.get("holderCpfCnpj") as string)?.replace(/\D/g, "");
    const holderPostalCode = (formData.get("holderPostalCode") as string)?.replace(/\D/g, "");

    if (!holderName || !cardNumber || !expiryMonth || !expiryYear || !ccv || !holderCpfCnpj || !holderPostalCode) {
      return { error: "Preencha todos os dados do cartão" };
    }

    // Validacoes de formato
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      return { error: "Número do cartão inválido" };
    }
    const monthNum = parseInt(expiryMonth, 10);
    if (!monthNum || monthNum < 1 || monthNum > 12) {
      return { error: "Mês de validade inválido" };
    }
    if (ccv.length < 3 || ccv.length > 4) {
      return { error: "CVV inválido" };
    }
    if (holderCpfCnpj.length !== 11 && holderCpfCnpj.length !== 14) {
      return { error: "CPF/CNPJ do titular inválido" };
    }

    // Buscar usuario MASTER para email e telefone (cadastrados no passo 1)
    const masterUser = await prisma.user.findFirst({
      where: { tenantId, role: "MASTER" },
    });
    if (!masterUser?.email) {
      return { error: "Usuário não encontrado. Refaça o cadastro." };
    }

    const email = masterUser.email;
    const phone = tenant.telefone || "";

    // Determinar valor pelo plano
    const planSlug = tenant.plan.toLowerCase() as keyof typeof PLAN_PRICES;
    const prices = PLAN_PRICES[planSlug] || PLAN_PRICES.essencial;
    const value = prices.monthly; // TODO: suportar ciclo anual

    // 1. Reaproveitar customer existente ou criar novo (protege contra retry)
    let customerId = tenant.asaasCustomerId;

    if (!customerId) {
      // Verificar se ja existe no Asaas por externalReference (retry com crash no DB save)
      console.log(`[registerPayment] Buscando customer existente no Asaas para tenant ${tenantId}`);
      const existingCustomer = await findCustomerByExternalReference(tenantId);

      if (existingCustomer) {
        customerId = existingCustomer.id;
        console.log(`[registerPayment] Customer existente encontrado: ${customerId}`);
      } else {
        console.log(`[registerPayment] Criando customer no Asaas para tenant ${tenantId}`);
        const customer = await createCustomer({
          name: tenant.name,
          cpfCnpj: tenant.cnpj,
          email,
          phone,
          postalCode: tenant.cep || holderPostalCode,
          externalReference: tenantId,
        });
        customerId = customer.id;
        console.log(`[registerPayment] Customer criado: ${customerId}`);
      }

      // Salvar customer ID imediatamente (protege contra crash entre criar customer e subscription)
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { asaasCustomerId: customerId },
      });
    }

    // 2. Criar subscription com trial de 30 dias
    console.log(`[registerPayment] Criando subscription no Asaas`);
    const subscription = await createSubscription({
      customer: customerId,
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
        email,
        cpfCnpj: holderCpfCnpj,
        postalCode: holderPostalCode,
        addressNumber: tenant.numero || "0",
        phone,
      },
    });
    console.log(`[registerPayment] Subscription criada: ${subscription.id}`);

    // 3. Salvar subscription ID no Tenant
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        asaasSubscriptionId: subscription.id,
        subscriptionStatus: "TRIAL",
      },
    });

    // 4. Marcar Lead como convertida
    await prisma.lead.updateMany({
      where: { email, converted: false },
      data: { converted: true, tenantId },
    });

    console.log(`[registerPayment] Concluido com sucesso para tenant ${tenantId}`);
    return { success: true };
  } catch (error) {
    console.error("[registerPayment] Erro:", error instanceof Error ? error.message : error);
    return { error: "Erro ao processar pagamento. Verifique os dados do cartão e tente novamente." };
  }
}
