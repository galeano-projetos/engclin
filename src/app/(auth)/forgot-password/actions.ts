"use server";

import { prisma } from "@/lib/db";
import { emailSchema } from "@/lib/validation";
import { sendPasswordResetEmail } from "@/lib/email";
import { hash } from "bcryptjs";
import crypto from "crypto";

export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  const emailResult = emailSchema.safeParse(email);
  if (!emailResult.success) {
    return { error: "Informe um email válido." };
  }

  // Always return generic message for security
  const genericMessage =
    "Se este email estiver cadastrado, você receberá um link para redefinir sua senha.";

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.active) {
      return { success: true, message: genericMessage };
    }

    // Delete any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({ where: { email } });

    // Generate token
    const rawToken = crypto.randomUUID();
    const hashedToken = await hash(rawToken, 10);

    await prisma.passwordResetToken.create({
      data: {
        email,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Build reset URL
    const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    await sendPasswordResetEmail(email, resetUrl);

    return { success: true, message: genericMessage };
  } catch {
    return { error: "Erro ao processar solicitação. Tente novamente." };
  }
}
