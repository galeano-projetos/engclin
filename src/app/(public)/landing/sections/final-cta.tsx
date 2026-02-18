"use client";

import { useInView } from "../hooks/use-in-view";

export function FinalCta() {
  const { ref, inView } = useInView();

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 px-4 py-24 sm:px-6 lg:px-8"
    >
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none absolute left-1/3 top-0 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/3 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-3xl text-center">
        <h2
          className={`text-3xl font-bold text-white sm:text-4xl lg:text-5xl ${
            inView ? "animate-fade-in-up" : "opacity-0"
          }`}
        >
          Pronto para entrar no futuro da Engenharia Clinica?
        </h2>

        <p
          className={`mx-auto mt-6 max-w-xl text-lg text-slate-400 ${
            inView ? "animate-fade-in-up" : "opacity-0"
          }`}
          style={{ animationDelay: inView ? "150ms" : undefined }}
        >
          Sem risco, sem compromisso. Cancele a qualquer momento.
        </p>

        <div
          className={`mt-10 flex flex-col items-center gap-4 ${
            inView ? "animate-fade-in-up" : "opacity-0"
          }`}
          style={{ animationDelay: inView ? "300ms" : undefined }}
        >
          <a
            href="#precos"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-teal-600/25 transition-all animate-pulse-glow hover:bg-teal-500 hover:shadow-teal-500/30"
          >
            Quero meus 30 Dias Gratis Agora
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <a
            href="mailto:contato@vitalis.app?subject=Demonstracao"
            className="text-sm text-slate-400 underline-offset-4 transition-colors hover:text-teal-400 hover:underline"
          >
            Ou agende uma demonstracao personalizada
          </a>
        </div>

        <p
          className={`mt-8 text-sm text-slate-500 ${
            inView ? "animate-fade-in" : "opacity-0"
          }`}
          style={{ animationDelay: inView ? "450ms" : undefined }}
        >
          Nao pedimos cartao de credito.
        </p>
      </div>
    </section>
  );
}
