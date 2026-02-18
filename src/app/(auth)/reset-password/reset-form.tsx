"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.set("token", token);
    formData.set("email", email);

    const result = await resetPassword(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (!token || !email) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          Link inválido. Solicite um novo link de recuperação.
        </div>
        <div className="text-center">
          <Link
            href="/forgot-password"
            className="text-sm text-teal-600 hover:text-teal-800"
          >
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          Senha redefinida com sucesso!
        </div>
        <div className="text-center">
          <Link
            href="/login"
            className="inline-block rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">
        Defina sua nova senha. Ela deve ter no mínimo 8 caracteres, incluindo
        letra maiúscula, número e caractere especial.
      </p>

      <div className="relative">
        <Input
          name="password"
          label="Nova senha"
          type={showPassword ? "text" : "password"}
          placeholder="Sua nova senha"
          required
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[34px] text-gray-500 hover:text-gray-700"
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
        >
          {showPassword ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>

      <Input
        name="confirmPassword"
        label="Confirmar senha"
        type={showPassword ? "text" : "password"}
        placeholder="Confirme sua nova senha"
        required
        autoComplete="new-password"
      />

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Redefinir senha
      </Button>

      <div className="text-center">
        <Link
          href="/login"
          className="text-sm text-teal-600 hover:text-teal-800"
        >
          Voltar ao login
        </Link>
      </div>
    </form>
  );
}
