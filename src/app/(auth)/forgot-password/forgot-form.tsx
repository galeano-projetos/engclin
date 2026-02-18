"use client";

import { useState } from "react";
import { requestPasswordReset } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export function ForgotForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);
    const result = await requestPasswordReset(formData);

    if (result.error) {
      setError(result.error);
    } else if (result.message) {
      setSuccess(result.message);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">
        Informe seu email e enviaremos um link para redefinir sua senha.
      </p>

      <Input
        name="email"
        label="Email"
        type="email"
        placeholder="seu@email.com"
        required
        autoComplete="email"
      />

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Enviar link de recuperação
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
