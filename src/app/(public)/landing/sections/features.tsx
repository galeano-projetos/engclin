"use client";

import { useInView } from "../hooks/use-in-view";

const features = [
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
      </svg>
    ),
    title: "Gestão Inteligente de Ativos",
    description:
      "Inventário completo, QR Code para acesso rápido, histórico de vida do equipamento. Classificação por criticidade e rastreabilidade total.",
    iconBg: "bg-teal-50 text-teal-600",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    title: "Manutenção Preditiva com IA",
    description:
      "Nosso algoritmo analisa o histórico de falhas e prevê problemas antes que aconteçam, reduzindo custos e downtime em até 40%.",
    iconBg: "bg-cyan-50 text-cyan-600",
    badge: "Enterprise",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Conformidade Simplificada",
    description:
      "Checklists digitais, alertas automáticos de calibração e relatórios prontos para auditorias. RDC 611, TSE e física médica cobertas.",
    iconBg: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
      </svg>
    ),
    title: "Gestão Multi-Unidade",
    description:
      "Controle todas as suas filiais de um único painel, com dados e permissões segmentadas. Dashboard consolidado e comparativos.",
    iconBg: "bg-blue-50 text-blue-600",
    badge: "Enterprise",
  },
];

export function Features() {
  const { ref, inView } = useInView();

  return (
    <section
      id="funcionalidades"
      ref={ref}
      className="scroll-mt-20 bg-white px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className={`text-center ${inView ? "animate-fade-in-up" : "opacity-0"}`}>
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Inteligência que você pode ver.{" "}
            <span className="text-teal-600">
              Eficiência que você pode medir.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Funcionalidades pensadas para equipes de engenharia clínica que precisam de
            controle total, conformidade e inteligência.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`group relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                inView ? "animate-scale-in" : "opacity-0"
              }`}
              style={{ animationDelay: inView ? `${i * 100 + 200}ms` : undefined }}
            >
              {feature.badge && (
                <span className="absolute right-4 top-4 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-teal-600">
                  {feature.badge}
                </span>
              )}
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${feature.iconBg}`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
