import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/asaas
 *
 * Recebe eventos do Asaas sobre pagamentos e subscriptions.
 * Atualiza o subscriptionStatus do Tenant conforme o evento.
 */
export async function POST(request: Request) {
  try {
    // Validar token do webhook
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
    if (webhookToken) {
      const authHeader = request.headers.get("asaas-access-token");
      if (authHeader !== webhookToken) {
        console.warn("[Asaas Webhook] Token invalido recebido");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();
    const event = body.event as string;
    const payment = body.payment;
    const subscription = body.subscription;

    // Extrair IDs — subscription pode ser string (ID) ou objeto com .id
    const subscriptionId =
      typeof subscription === "string"
        ? subscription
        : subscription?.id || payment?.subscription || null;
    const customerId = payment?.customer || subscription?.customer || null;

    console.log(`[Asaas Webhook] Event: ${event}, subscription: ${subscriptionId}, customer: ${customerId}`);

    // Encontrar o tenant pelo asaasSubscriptionId ou asaasCustomerId
    let tenant = null;

    if (subscriptionId) {
      tenant = await prisma.tenant.findFirst({
        where: { asaasSubscriptionId: subscriptionId },
      });
    }

    if (!tenant && customerId) {
      tenant = await prisma.tenant.findFirst({
        where: { asaasCustomerId: customerId },
      });
    }

    if (!tenant) {
      console.warn(`[Asaas Webhook] Tenant nao encontrado para evento ${event}, subscription: ${subscriptionId}, customer: ${customerId}`);
      return NextResponse.json({ received: true });
    }

    // Atualizar status conforme o evento
    let newStatus: string | null = null;

    switch (event) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED":
        newStatus = "ACTIVE";
        break;
      case "PAYMENT_OVERDUE":
        newStatus = "OVERDUE";
        break;
      case "PAYMENT_REFUNDED":
      case "SUBSCRIPTION_DELETED":
      case "SUBSCRIPTION_INACTIVATED":
        newStatus = "CANCELLED";
        break;
    }

    if (newStatus) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { subscriptionStatus: newStatus },
      });
      console.log(`[Asaas Webhook] Tenant ${tenant.id} status -> ${newStatus}`);
    }

    // Se recebemos SUBSCRIPTION_CREATED e o tenant nao tem subscriptionId, salvar
    if (event === "SUBSCRIPTION_CREATED" && subscriptionId && !tenant.asaasSubscriptionId) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { asaasSubscriptionId: subscriptionId },
      });
      console.log(`[Asaas Webhook] Tenant ${tenant.id} subscriptionId salvo via webhook: ${subscriptionId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Asaas Webhook] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
