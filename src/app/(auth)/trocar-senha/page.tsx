import { VitalisLogo } from "@/components/ui/vitalis-logo";
import { TrocarSenhaForm } from "./trocar-senha-form";

export default function TrocarSenhaPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex flex-col items-center text-center">
        <VitalisLogo size="lg" />
        <p className="mt-3 text-sm font-light tracking-wide text-gray-500">
          Clinical Asset Management
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-8 shadow-xl shadow-gray-200/50 backdrop-blur-sm">
        <h2 className="mb-2 text-lg font-semibold text-gray-800">
          Alterar senha
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          Sua senha provisoria precisa ser alterada antes de continuar.
        </p>
        <TrocarSenhaForm />
      </div>
    </div>
  );
}
