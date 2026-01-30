import { SessionProviderWrapper } from "@/components/layout/session-provider-wrapper";
import { AuthBackground } from "./auth-background";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProviderWrapper>
      <AuthBackground>{children}</AuthBackground>
    </SessionProviderWrapper>
  );
}
