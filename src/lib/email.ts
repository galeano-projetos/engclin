import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Vitalis <noreply@vitalis.app>";

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Redefinir sua senha - Vitalis",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #0D9488; font-size: 28px; margin: 0;">Vitalis</h1>
          <p style="color: #6B7280; font-size: 14px; margin-top: 4px;">Gestão de Equipamentos com IA</p>
        </div>

        <h2 style="color: #111827; font-size: 20px; margin-bottom: 16px;">Redefinir senha</h2>

        <p style="color: #4B5563; font-size: 14px; line-height: 1.6;">
          Recebemos uma solicitação para redefinir a senha da sua conta.
          Clique no botão abaixo para criar uma nova senha:
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}"
             style="display: inline-block; background-color: #0D9488; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Redefinir minha senha
          </a>
        </div>

        <p style="color: #6B7280; font-size: 12px; line-height: 1.6;">
          Este link expira em <strong>1 hora</strong>. Se você não solicitou a redefinição de senha, ignore este email.
        </p>

        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />

        <p style="color: #9CA3AF; font-size: 11px; text-align: center;">
          Vitalis - Gestão de Equipamentos com IA
        </p>
      </div>
    `,
  });
}
