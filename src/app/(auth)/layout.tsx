import { SessionProviderWrapper } from "@/components/layout/session-provider-wrapper";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProviderWrapper>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        {children}
      </div>
    </SessionProviderWrapper>
  );
}
