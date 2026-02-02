import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isPlatformAdmin } from "@/lib/auth/permissions";
import { PlatformShell } from "./platform-shell";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!isPlatformAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <PlatformShell userName={session.user.name}>
      {children}
    </PlatformShell>
  );
}
