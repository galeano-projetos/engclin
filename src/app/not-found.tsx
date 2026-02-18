import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <h2 className="text-xl font-semibold text-gray-900">
        Pagina nao encontrada
      </h2>
      <p className="text-sm text-gray-600">
        O endereco que voce acessou nao existe ou foi movido.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
      >
        Voltar ao inicio
      </Link>
    </div>
  );
}
