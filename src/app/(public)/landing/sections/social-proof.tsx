"use client";

import { useInView } from "../hooks/use-in-view";

const testimonials = [
  {
    quote:
      "O Vitalis transformou nossa operação. Reduzimos em 40% o tempo gasto com relatórios e nunca mais perdemos um prazo de calibração.",
    name: "Dr. Ricardo Almeida",
    role: "Engenheiro Clínico",
    company: "Hospital Metropolitano",
  },
  {
    quote:
      "A IA preditiva e os relatórios automáticos nos deram uma visão que nunca tivemos antes. Agora antecipamos problemas em vez de reagir a eles.",
    name: "Ana Paula Ferreira",
    role: "Gerente de Qualidade",
    company: "Rede Clínica Saúde Mais",
  },
  {
    quote:
      "Implementação rápida, suporte excelente e uma plataforma que realmente entende as necessidades da engenharia clínica brasileira.",
    name: "Carlos Eduardo Santos",
    role: "Coordenador de Manutenção",
    company: "Hospital Regional Norte",
  },
];

export function SocialProof() {
  const { ref, inView } = useInView();

  return (
    <section
      id="depoimentos"
      ref={ref}
      className="scroll-mt-20 bg-white px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className={`text-center ${inView ? "animate-fade-in-up" : "opacity-0"}`}>
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Confiança que gera resultados.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Veja o que profissionais de engenharia clínica estão dizendo sobre o Vitalis.
          </p>
        </div>

        {/* Testimonials */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ${
                inView ? "animate-fade-in-up" : "opacity-0"
              }`}
              style={{ animationDelay: inView ? `${i * 150 + 300}ms` : undefined }}
            >
              {/* Quote icon */}
              <svg
                className="absolute right-4 top-4 h-8 w-8 text-teal-100"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
              </svg>

              <p className="text-sm leading-relaxed text-gray-700">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-6 border-t border-gray-100 pt-4">
                <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-500">
                  {t.role} — {t.company}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
