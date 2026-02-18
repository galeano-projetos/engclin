"use client";

import { useInView } from "../hooks/use-in-view";

const items = [
  {
    problem: {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      title: "Controle Manual em Planilhas",
      desc: "Dados dispersos, erros humanos e zero rastreabilidade.",
    },
    solution: {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
        </svg>
      ),
      title: "Centralização Total na Nuvem",
      desc: "Inventário completo, histórico rastreável e acesso de qualquer lugar.",
    },
  },
  {
    problem: {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
      title: "Risco de Não Conformidade",
      desc: "Prazos perdidos, auditorias reprovadas e multas da ANVISA.",
    },
    solution: {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
      title: "Conformidade Automatizada (RDC 611)",
      desc: "Alertas de calibração, checklists e relatórios prontos para auditoria.",
    },
  },
  {
    problem: {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 3.065A1.003 1.003 0 015 17.347V6.653a1.003 1.003 0 011.036-.888l5.384 3.065M15.75 7.5l-2.25 3 2.25 3m3.75-9v13.5" />
        </svg>
      ),
      title: "Manutenção Reativa e Custosa",
      desc: "Equipamentos quebram sem aviso, gerando custos altos e downtime.",
    },
    solution: {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
      title: "Manutenção Preditiva com IA",
      desc: "Algoritmos preveem falhas e agendam manutenções antes do problema.",
    },
  },
];

export function ProblemSolution() {
  const { ref, inView } = useInView();

  return (
    <section id="problemas" ref={ref} className="scroll-mt-20 bg-gray-50 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className={`text-center ${inView ? "animate-fade-in-up" : "opacity-0"}`}>
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Sua gestão de equipamentos ainda está no passado?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Planilhas complexas, falta de controle e riscos de conformidade são gargalos
            que impedem o crescimento.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {items.map((item, i) => (
            <div
              key={i}
              className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ${
                inView ? "animate-fade-in-up" : "opacity-0"
              }`}
              style={{ animationDelay: inView ? `${i * 150 + 200}ms` : undefined }}
            >
              {/* Problem */}
              <div className="border-b border-gray-100 p-6">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
                  {item.problem.icon}
                </div>
                <h3 className="text-sm font-semibold text-red-600">{item.problem.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{item.problem.desc}</p>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center py-2">
                <svg className="h-5 w-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                </svg>
              </div>

              {/* Solution */}
              <div className="p-6">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  {item.solution.icon}
                </div>
                <h3 className="text-sm font-semibold text-teal-600">{item.solution.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{item.solution.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
