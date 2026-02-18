"use client";

import { useState } from "react";
import { useInView } from "../hooks/use-in-view";
import { PricingToggle } from "../components/pricing-toggle";
import { plans } from "../data/pricing-data";

function CheckIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function formatPrice(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const { ref, inView } = useInView();

  return (
    <section id="precos" ref={ref} className="scroll-mt-20 bg-slate-950 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className={`text-center ${inView ? "animate-fade-in-up" : "opacity-0"}`}>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Escolha o plano que acelera o seu crescimento.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            Todos os planos incluem 30 dias gratis e implementacao sem custo.
          </p>
        </div>

        {/* Launch offer banner */}
        <div
          className={`mx-auto mt-8 max-w-3xl rounded-2xl border border-teal-500/20 bg-gradient-to-r from-teal-600/10 to-cyan-600/10 px-6 py-4 text-center ${
            inView ? "animate-fade-in-up" : "opacity-0"
          }`}
          style={{ animationDelay: inView ? "100ms" : undefined }}
        >
          <p className="text-sm font-medium text-teal-300">
            🔥 Oferta de Lancamento:{" "}
            <span className="text-white">Implementacao Gratuita</span>{" "}
            (no valor de R$ 3.000,00) + 30 Dias para Testar Gratis em qualquer plano.
          </p>
        </div>

        {/* Toggle */}
        <div
          className={`mt-10 ${inView ? "animate-fade-in-up" : "opacity-0"}`}
          style={{ animationDelay: inView ? "200ms" : undefined }}
        >
          <PricingToggle isAnnual={isAnnual} onChange={setIsAnnual} />
        </div>

        {/* Plan cards */}
        <div className="mt-12 grid items-start gap-8 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <div
              key={plan.slug}
              className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 ${
                plan.highlighted
                  ? "border-teal-500/50 bg-slate-900/80 shadow-lg shadow-teal-500/10 lg:scale-105"
                  : "border-white/5 bg-slate-900/50"
              } ${inView ? "animate-scale-in" : "opacity-0"}`}
              style={{ animationDelay: inView ? `${i * 100 + 300}ms` : undefined }}
            >
              {/* Badge */}
              {plan.badge && (
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold ${
                    plan.highlighted
                      ? "bg-teal-600 text-white"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {plan.badge}
                </span>
              )}

              {/* Plan name */}
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <p className="mt-2 text-sm text-slate-400">{plan.description}</p>

              {/* Price */}
              <div className="mt-6">
                <span className="text-4xl font-extrabold text-white">
                  R$ {formatPrice(isAnnual ? plan.annualMonthlyPrice : plan.monthlyPrice)}
                </span>
                <span className="text-slate-400">/mes</span>
              </div>
              {isAnnual && (
                <p className="mt-1 text-xs text-teal-400">
                  cobrado R$ {formatPrice(plan.annualTotal)}/ano
                </p>
              )}
              <p className="mt-1 text-xs text-slate-500">{plan.limits}</p>

              {/* Features */}
              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <CheckIcon />
                    <span className="text-sm text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href="/login"
                className={`mt-8 block rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                  plan.highlighted
                    ? "bg-teal-600 text-white shadow-lg shadow-teal-600/25 hover:bg-teal-500"
                    : "border border-white/10 text-slate-300 hover:border-teal-500/30 hover:text-white"
                }`}
              >
                Comece Agora
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
