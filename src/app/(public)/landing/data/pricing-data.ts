export interface PricingPlan {
  name: string;
  slug: "essencial" | "profissional" | "enterprise";
  monthlyPrice: number;
  annualMonthlyPrice: number;
  annualTotal: number;
  description: string;
  highlighted: boolean;
  badge?: string;
  features: string[];
  limits: string;
}

export const plans: PricingPlan[] = [
  {
    name: "Essencial",
    slug: "essencial",
    monthlyPrice: 297,
    annualMonthlyPrice: 247,
    annualTotal: 2970,
    description:
      "Para clinicas que estao comecando a organizar sua gestao de equipamentos.",
    highlighted: false,
    limits: "Ate 3 usuarios",
    features: [
      "Inventario completo de equipamentos",
      "Manutencoes preventivas",
      "Relatorio de inventario",
      "Ate 3 usuarios",
      "Suporte por email",
    ],
  },
  {
    name: "Profissional",
    slug: "profissional",
    monthlyPrice: 728,
    annualMonthlyPrice: 607,
    annualTotal: 7280,
    description:
      "Para equipes que precisam de conformidade total e gestao avancada.",
    highlighted: true,
    badge: "Mais Popular",
    limits: "Usuarios ilimitados",
    features: [
      "Tudo do Essencial +",
      "Calibracao e TSE",
      "Chamados corretivos",
      "Fisica Medica (RDC 611)",
      "Relatorios avancados",
      "Fornecedores e contratos",
      "Checklists digitais",
      "Ordens de servico",
      "Treinamentos",
      "Importacao via Excel",
      "Usuarios ilimitados",
      "Suporte prioritario",
    ],
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    monthlyPrice: 998,
    annualMonthlyPrice: 832,
    annualTotal: 9980,
    description:
      "Para redes e hospitais que exigem IA, integracao e controle multi-unidade.",
    highlighted: false,
    badge: "Maximo Poder",
    limits: "Multi-unidade",
    features: [
      "Tudo do Profissional +",
      "Inteligencia Artificial preditiva",
      "Controle de depreciacao (ONA)",
      "QR Code para equipamentos",
      "Integracao ERP (Tasy)",
      "Gestao multi-unidade",
      "Suporte dedicado com SLA",
    ],
  },
];
