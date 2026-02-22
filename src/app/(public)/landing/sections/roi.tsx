"use client";

import { useInView } from "../hooks/use-in-view";

const roiCards = [
  {
    label: "Pequeno porte",
    subtitle: "Cl\u00ednicas e pequenos hospitais",
    equipment: "R$ 2 mi em equipamentos",
    savings: "R$ 37.500",
    savingsLabel: "de economia anual",
    roi: "~1 m\u00eas",
    roiDetail: "para recuperar o investimento",
    details: [
      { source: "Redu\u00e7\u00e3o de manuten\u00e7\u00e3o corretiva", value: "R$ 12.000/ano" },
      { source: "Ganho de produtividade", value: "R$ 18.000/ano" },
      { source: "Otimiza\u00e7\u00e3o de compras", value: "R$ 7.500/ano" },
    ],
  },
  {
    label: "M\u00e9dio porte",
    subtitle: "Hospitais e redes regionais",
    equipment: "R$ 10 mi em equipamentos",
    savings: "R$ 182.000",
    savingsLabel: "de economia anual",
    roi: "~17 dias",
    roiDetail: "para recuperar o investimento",
    highlighted: true,
    details: [
      { source: "Redu\u00e7\u00e3o de manuten\u00e7\u00e3o corretiva", value: "R$ 72.000/ano" },
      { source: "Ganho de produtividade", value: "R$ 54.000/ano" },
      { source: "Otimiza\u00e7\u00e3o de compras", value: "R$ 56.000/ano" },
    ],
  },
  {
    label: "Grande porte",
    subtitle: "Hospitais universit\u00e1rios e redes",
    equipment: "R$ 30 mi em equipamentos",
    savings: "R$ 650.000",
    savingsLabel: "de economia anual",
    roi: "~7 dias",
    roiDetail: "para recuperar o investimento",
    details: [
      { source: "Redu\u00e7\u00e3o de manuten\u00e7\u00e3o corretiva", value: "R$ 315.000/ano" },
      { source: "Ganho de produtividade", value: "R$ 120.000/ano" },
      { source: "Otimiza\u00e7\u00e3o de compras e PGTS", value: "R$ 215.000/ano" },
    ],
  },
];

const stats = [
  {
    value: "10-15%",
    label: "de redu\u00e7\u00e3o nos custos de manuten\u00e7\u00e3o",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898M2.25 6l3 1.5M2.25 6v2.25m16.5 3.75l-.75-1.5M18.75 12l2.25 1.5m0 0l-1.5 3" />
      </svg>
    ),
  },
  {
    value: "15-20%",
    label: "de ganho em produtividade da equipe",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: "5-10%",
    label: "de redu\u00e7\u00e3o em compras desnecess\u00e1rias",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
];

export function Roi() {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="bg-white px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className={`text-center ${inView ? "animate-fade-in-up" : "opacity-0"}`}>
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-600">
            Retorno sobre investimento
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            O Vitalis se paga em semanas, n{"\u00e3"}o em anos.
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600">
            An{"\u00e1"}lise conservadora baseada em estudo da Universidade Federal do ABC,
            que aponta custos de manuten{"\u00e7\u00e3"}o de 6-7% do valor do parque de equipamentos ao ano.
          </p>
        </div>

        {/* Stats row */}
        <div
          className={`mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-3 ${inView ? "animate-fade-in-up" : "opacity-0"}`}
          style={{ animationDelay: inView ? "150ms" : undefined }}
        >
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center rounded-xl border border-slate-100 bg-slate-50 p-5 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                {s.icon}
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ROI cards */}
        <div className="mt-16 grid items-start gap-8 lg:grid-cols-3">
          {roiCards.map((card, i) => (
            <div
              key={i}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                card.highlighted
                  ? "border-teal-500 bg-white shadow-lg shadow-teal-500/10 lg:scale-105"
                  : "border-slate-200 bg-white shadow-sm"
              } ${inView ? "animate-scale-in" : "opacity-0"}`}
              style={{ animationDelay: inView ? `${i * 100 + 300}ms` : undefined }}
            >
              {/* Header */}
              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900">{card.label}</h3>
                <p className="text-xs text-slate-500">{card.subtitle}</p>
                <p className="mt-1 text-xs text-slate-400">{card.equipment}</p>
              </div>

              {/* ROI highlight */}
              <div className="mt-5 rounded-xl bg-teal-50 p-4 text-center">
                <p className="text-3xl font-extrabold text-teal-700">{card.roi}</p>
                <p className="text-xs text-teal-600">{card.roiDetail}</p>
              </div>

              {/* Savings */}
              <div className="mt-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{card.savings}</p>
                <p className="text-xs text-slate-500">{card.savingsLabel}</p>
              </div>

              {/* Breakdown */}
              <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                {card.details.map((d, j) => (
                  <div key={j} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">{d.source}</span>
                    <span className="whitespace-nowrap text-xs font-medium text-slate-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Source */}
        <div
          className={`mt-12 text-center ${inView ? "animate-fade-in" : "opacity-0"}`}
          style={{ animationDelay: inView ? "700ms" : undefined }}
        >
          <p className="text-xs leading-relaxed text-slate-400">
            Fonte: Nascimento &amp; Tanaka (2014), Universidade Federal do ABC — XXIV Congresso
            Brasileiro de Engenharia Biom{"\u00e9"}dica. Benchmarks CMMS: ClickMaint, eMaint.
            Percentuais conservadores aplicados (10-15% redu{"\u00e7\u00e3"}o de custos, 15-20% produtividade).
          </p>
        </div>
      </div>
    </section>
  );
}
