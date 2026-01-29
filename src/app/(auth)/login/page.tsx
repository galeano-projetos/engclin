import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">EngClin</h1>
        <p className="mt-2 text-sm text-gray-500">
          Sistema de Gestão para Engenharia Clínica
        </p>
      </div>
      <div className="rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">
          Entrar no sistema
        </h2>
        <LoginForm />
      </div>
    </div>
  );
}
