/**
 * Sistema de Notificações — Vitalis
 *
 * Infraestrutura para alertas automáticos via:
 * 1. Sistema interno (painel de notificações)
 * 2. E-mail (via Resend)
 * 3. WhatsApp (via API)
 *
 * Os provedores de e-mail e WhatsApp serão configurados via variáveis de ambiente.
 * Esta camada abstrai o envio para que a troca de provedor seja transparente.
 */

import { Resend } from "resend";

export interface NotificationPayload {
  tenantId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  subject: string;
  message: string;
  type: "VENCIMENTO_CALIBRACAO" | "VENCIMENTO_FISICA_MEDICA" | "NOVO_CHAMADO" | "CHAMADO_RESOLVIDO";
  metadata?: Record<string, string>;
}

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/**
 * Envia notificação por e-mail via Resend.
 * Quando RESEND_API_KEY não está configurada, loga no console como stub.
 */
export async function sendEmailNotification(
  payload: NotificationPayload
): Promise<boolean> {
  const resend = getResend();
  if (!resend || !payload.recipientEmail) {
    console.log(`[EMAIL] (stub) Para: ${payload.recipientEmail} | Assunto: ${payload.subject}`);
    return true;
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Vitalis <noreply@vitalis.app>",
      to: payload.recipientEmail,
      subject: payload.subject,
      text: payload.message,
    });
    return true;
  } catch (error) {
    console.error("[EMAIL] Erro ao enviar:", error);
    return false;
  }
}

/**
 * Envia notificação via WhatsApp.
 * Em produção, integrar com API do WhatsApp Business (Meta) ou Twilio.
 */
export async function sendWhatsAppNotification(
  payload: NotificationPayload
): Promise<boolean> {
  // TODO: Integrar com API do WhatsApp Business
  // Exemplo com Twilio:
  // const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
  // await client.messages.create({
  //   body: payload.message,
  //   from: 'whatsapp:+14155238886',
  //   to: `whatsapp:${payload.recipientPhone}`,
  // });

  console.log(`[WHATSAPP] (stub) Para: ${payload.recipientPhone} | Assunto: ${payload.subject}`);
  return true;
}

/**
 * Envia notificação por todos os canais configurados.
 */
export async function sendNotification(
  payload: NotificationPayload
): Promise<void> {
  const promises: Promise<boolean>[] = [];

  if (payload.recipientEmail) {
    promises.push(sendEmailNotification(payload));
  }

  if (payload.recipientPhone) {
    promises.push(sendWhatsAppNotification(payload));
  }

  const results = await Promise.allSettled(promises);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[Notification] Falha ao enviar:", result.reason);
    }
  }
}
