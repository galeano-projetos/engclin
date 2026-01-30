import { VitalisLogo } from "@/components/ui/vitalis-logo";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex flex-col items-center text-center">
        <VitalisLogo size="lg" />
        <p className="mt-3 text-sm font-light tracking-wide text-gray-500">
          Gestão de Equipamentos com IA
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-8 shadow-xl shadow-gray-200/50 backdrop-blur-sm">
        <h2 className="mb-6 text-lg font-semibold text-gray-800">
          Entrar no sistema
        </h2>
        <LoginForm />
      </div>
    </div>
  );
}
