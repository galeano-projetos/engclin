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
      "Para clínicas que estão começando a organizar sua gestão de equipamentos.",
    highlighted: false,
    limits: "Até 3 usuários",
    features: [
      "Inventário completo de equipamentos",
      "Manutenções preventivas",
      "Relatório de inventário",
      "Até 3 usuários",
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
      "Para equipes que precisam de conformidade total e gestão avançada.",
    highlighted: false,
    limits: "Usuários ilimitados",
    features: [
      "Tudo do Essencial +",
      "Calibração e TSE",
      "Chamados corretivos",
      "Física Médica (RDC 611)",
      "Relatórios avançados",
      "Fornecedores e contratos",
      "Checklists digitais",
      "Ordens de serviço",
      "Treinamentos",
      "Importação via Excel",
      "Usuários ilimitados",
      "Suporte prioritário",
    ],
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    monthlyPrice: 998,
    annualMonthlyPrice: 832,
    annualTotal: 9980,
    description:
      "Para redes e hospitais que exigem IA, integração e controle multi-unidade.",
    highlighted: true,
    badge: "Mais Popular",
    limits: "Multi-unidade",
    features: [
      "Tudo do Profissional +",
      "10 agentes de IA (preditiva, causa raiz, ciclo de vida)",
      "Pesquisa de mercado com IA (Manus)",
      "Conformidade regulatória com IA",
      "Insights automáticos em relatórios",
      "Controle de depreciação (ONA)",
      "QR Code para equipamentos",
      "Integração com ERPs hospitalares",
      "Gestão multi-unidade",
      "Suporte dedicado com SLA",
    ],
  },
];
