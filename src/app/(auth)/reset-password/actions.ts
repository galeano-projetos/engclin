"use server";

import { prisma } from "@/lib/db";
import { passwordSchema } from "@/lib/validation";
import { hash, compare } from "bcryptjs";

export async function resetPassword(formData: FormData) {
  const token = formData.get("token") as string;
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token || !email) {
    return { error: "Link inválido ou expirado." };
  }

  if (password !== confirmPassword) {
    return { error: "As senhas não conferem." };
  }

  const passwordResult = passwordSchema.safeParse(password);
  if (!passwordResult.success) {
    return { error: passwordResult.error.issues[0].message };
  }

  try {
    // Find valid tokens for this email
    const tokens = await prisma.passwordResetToken.findMany({
      where: {
        email,
        expiresAt: { gt: new Date() },
      },
    });

    if (tokens.length === 0) {
      return { error: "Link inválido ou expirado. Solicite um novo." };
    }

    // Check if any token matches
    let validToken = false;
    for (const t of tokens) {
      const matches = await compare(token, t.token);
      if (matches) {
        validToken = true;
        break;
      }
    }

    if (!validToken) {
      return { error: "Link inválido ou expirado. Solicite um novo." };
    }

    // Update password and clear forced change flag
    const hashedPassword = await hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, mustChangePassword: false },
    });

    // Delete all tokens for this email
    await prisma.passwordResetToken.deleteMany({ where: { email } });

    return { success: true };
  } catch {
    return { error: "Erro ao redefinir senha. Tente novamente." };
  }
}
