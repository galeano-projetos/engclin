"use client";

import { SystemMockup } from "../components/system-mockup";
import { CircuitCanvas } from "../components/circuit-canvas";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy-950 pt-16">
      {/* Interactive circuit board background */}
      <CircuitCanvas className="absolute inset-0 z-0" />

      {/* Gradient overlay for depth */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-navy-950/40 via-transparent to-navy-950/70" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center px-4 text-center sm:px-6">
        {/* Badge */}
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-sm text-teal-300 opacity-0 backdrop-blur-sm"
          style={{ animation: "fade-in-up 0.6s ease-out 0.1s both" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
          </span>
          Novo: Inteligência Preditiva com IA
        </div>

        {/* Title */}
        <h1
          className="text-4xl font-extrabold leading-tight tracking-tight text-white opacity-0 sm:text-5xl md:text-6xl lg:text-7xl"
          style={{ animation: "fade-in-up 0.6s ease-out 0.2s both" }}
        >
          A Engenharia Clínica{" "}
          <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
            do Futuro
          </span>
          , Hoje.
        </h1>

        {/* Subtitle */}
        <p
          className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 opacity-0 sm:text-xl"
          style={{ animation: "fade-in-up 0.6s ease-out 0.35s both" }}
        >
          Transforme a gestão de ativos clínicos com a primeira plataforma do Brasil que
          integra <span className="font-semibold text-teal-400">IA</span>,{" "}
          <span className="font-semibold text-teal-400">conformidade regulatória</span> e{" "}
          <span className="font-semibold text-teal-400">gestão multi-unidade</span> de forma inteligente.
        </p>

        {/* CTAs */}
        <div
          className="mt-10 flex flex-col items-center gap-4 opacity-0 sm:flex-row sm:justify-center"
          style={{ animation: "fade-in-up 0.6s ease-out 0.5s both" }}
        >
          <a
            href="#precos"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-teal-600/20 transition-all hover:bg-teal-700 hover:shadow-teal-700/25"
          >
            Comece seus 30 Dias Grátis
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <a
            href="mailto:contato@vitalis.app?subject=Demonstração"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-8 py-4 text-lg text-white/80 backdrop-blur-sm transition-all hover:border-teal-400/50 hover:text-teal-300"
          >
            Agendar Demonstração
          </a>
        </div>

        {/* Social proof */}
        <p
          className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-400 opacity-0"
          style={{ animation: "fade-in-up 0.6s ease-out 0.65s both" }}
        >
          <svg className="h-4 w-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Implementação gratuita por tempo limitado{" "}
          <span className="font-medium text-teal-400">(no valor de R$ 3.000,00)</span>
        </p>

        {/* Trust indicators */}
        <div
          className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 opacity-0"
          style={{ animation: "fade-in-up 0.6s ease-out 0.8s both" }}
        >
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            Sem cartão de crédito
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Setup em 24h
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
            Suporte humanizado
          </span>
        </div>
      </div>

      {/* System mockup */}
      <div
        className="relative z-10 mx-auto max-w-5xl px-4 pb-24 opacity-0"
        style={{ animation: "fade-in-up 0.6s ease-out 1s both" }}
      >
        <SystemMockup className="shadow-2xl shadow-teal-500/10" />
      </div>
    </section>
  );
}
