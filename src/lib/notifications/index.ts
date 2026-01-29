/**
 * Sistema de Notificações — EngClin
 *
 * Infraestrutura para alertas automáticos via:
 * 1. Sistema interno (painel de notificações)
 * 2. E-mail (via serviço transacional)
 * 3. WhatsApp (via API)
 *
 * Os provedores de e-mail e WhatsApp serão configurados via variáveis de ambiente.
 * Esta camada abstrai o envio para que a troca de provedor seja transparente.
 */

export interface NotificationPayload {
  tenantId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  subject: string;
  message: string;
  type: "VENCIMENTO_CALIBRACAO" | "VENCIMENTO_FISICA_MEDICA" | "NOVO_CHAMADO" | "CHAMADO_RESOLVIDO";
  metadata?: Record<string, string>;
}

/**
 * Envia notificação por e-mail.
 * Em produção, integrar com SendGrid, Resend, AWS SES, etc.
 */
export async function sendEmailNotification(
  payload: NotificationPayload
): Promise<boolean> {
  // TODO: Integrar com serviço de e-mail transacional
  // Exemplo com Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'EngClin <alertas@engclin.com>',
  //   to: payload.recipientEmail,
  //   subject: payload.subject,
  //   html: payload.message,
  // });

  console.log(`[EMAIL] Para: ${payload.recipientEmail} | Assunto: ${payload.subject}`);
  return true;
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

  console.log(`[WHATSAPP] Para: ${payload.recipientPhone} | Msg: ${payload.subject}`);
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

  await Promise.allSettled(promises);
}
