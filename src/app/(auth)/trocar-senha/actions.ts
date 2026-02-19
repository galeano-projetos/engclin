"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { passwordSchema } from "@/lib/validation";
import { compare, hash } from "bcryptjs";

export async function changePassword(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Nao autenticado." };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Preencha todos os campos." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "As senhas nao conferem." };
  }

  const passwordResult = passwordSchema.safeParse(newPassword);
  if (!passwordResult.success) {
    return { error: passwordResult.error.issues[0].message };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return { error: "Usuario nao encontrado." };
  }

  const isCurrentValid = await compare(currentPassword, user.password);
  if (!isCurrentValid) {
    return { error: "Senha atual incorreta." };
  }

  const isSamePassword = await compare(newPassword, user.password);
  if (isSamePassword) {
    return { error: "A nova senha deve ser diferente da senha atual." };
  }

  const hashedPassword = await hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword, mustChangePassword: false },
  });

  return { success: true };
}
