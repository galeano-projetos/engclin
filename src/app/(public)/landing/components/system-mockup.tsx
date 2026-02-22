"use client";

interface SystemMockupProps {
  title?: string;
  variant?: "light" | "dark";
  className?: string;
}

const sidebarItems = [
  { label: "Dashboard", active: true },
  { label: "Equipamentos" },
  { label: "Preventivas" },
  { label: "Chamados" },
  { label: "Ordens de Serviço" },
  { label: "Física Médica" },
  { label: "Treinamentos" },
  { label: "Relatórios" },
  { label: "PGTS" },
  { label: "Inteligência IA" },
];

const statCards = [
  { label: "Total Equipamentos", value: "2.847", dot: "bg-blue-400" },
  { label: "Serviços Vencidos", value: "12", dot: "bg-red-400" },
  { label: "Chamados Abertos", value: "8", dot: "bg-amber-400" },
  { label: "Equipamentos Ativos", value: "2.691", dot: "bg-green-400" },
];

const barData = [
  { prev: 45, corr: 12 },
  { prev: 52, corr: 18 },
  { prev: 48, corr: 9 },
  { prev: 61, corr: 15 },
  { prev: 55, corr: 11 },
  { prev: 58, corr: 7 },
];

const months = ["Set", "Out", "Nov", "Dez", "Jan", "Fev"];

const upcomingItems = [
  { equip: "Ventilador Pulmonar VP-500", service: "Calibração", days: 3, color: "bg-red-400" },
  { equip: "Monitor Multiparâmetro MX-800", service: "Preventiva", days: 12, color: "bg-amber-400" },
  { equip: "Desfibrilador DEA Pro", service: "TSE", days: 25, color: "bg-blue-400" },
  { equip: "Bomba de Infusão BI-300", service: "Calibração", days: 30, color: "bg-blue-400" },
];

export function SystemMockup({
  title = "Dashboard",
  variant = "dark",
  className,
}: SystemMockupProps) {
  const isLight = variant === "light";

  // Color helpers
  const bg = isLight ? "bg-white/[0.03]" : "bg-white";
  const bgSidebar = isLight ? "bg-white/[0.05]" : "bg-white";
  const bgMain = isLight ? "bg-slate-800/50" : "bg-gray-50";
  const border = isLight ? "border-white/[0.06]" : "border-slate-200";
  const borderLight = isLight ? "border-white/[0.04]" : "border-slate-100";
  const textPrimary = isLight ? "text-white/90" : "text-slate-900";
  const textSecondary = isLight ? "text-white/50" : "text-slate-500";
  const textMuted = isLight ? "text-white/30" : "text-slate-300";
  const cardShadow = isLight ? "" : "shadow-sm";
  const activeItem = isLight ? "bg-blue-500/15 text-blue-300" : "bg-blue-50 text-blue-700";
  const inactiveItem = isLight ? "text-white/40" : "text-slate-500";

  const maxBar = 61;

  return (
    <div className={`overflow-hidden rounded-xl shadow-2xl ${className ?? ""}`}>
      {/* Browser chrome bar */}
      <div className={`flex items-center gap-2 px-4 py-2 ${isLight ? "bg-white/[0.06] backdrop-blur" : "bg-slate-800"}`}>
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
        </div>
        <div className={`ml-2 flex-1 rounded-md px-3 py-1 text-[10px] ${isLight ? "bg-white/[0.06] text-white/50" : "bg-slate-700 text-slate-400"}`}>
          app.vitalis.com/{title.toLowerCase().replace(/\s/g, "-")}
        </div>
      </div>

      {/* App content */}
      <div className={`relative ${isLight ? "bg-slate-900" : "bg-gray-100"}`}>
        {/* App header */}
        <div className={`flex h-7 items-center border-b px-3 ${border} ${bg}`}>
          <div className={`text-[8px] font-bold ${isLight ? "text-white/70" : "text-slate-800"}`}>
            Vitalis
          </div>
          <div className={`ml-1.5 text-[7px] ${textSecondary}`}>|</div>
          <div className={`ml-1.5 text-[7px] ${textSecondary}`}>Hospital Metropolitano</div>
          <div className="flex-1" />
          <div className={`flex items-center gap-1.5`}>
            <div className={`rounded px-1.5 py-0.5 text-[6px] font-medium ${isLight ? "bg-blue-500/20 text-blue-300" : "bg-blue-50 text-blue-600"}`}>
              Coordenador
            </div>
            <div className={`h-3.5 w-3.5 rounded-full ${isLight ? "bg-white/10" : "bg-slate-300"}`} />
          </div>
        </div>

        <div className="flex" style={{ height: "clamp(200px, 28vw, 420px)" }}>
          {/* Sidebar */}
          <div className={`w-[18%] shrink-0 border-r ${border} ${bgSidebar} overflow-hidden`}>
            <div className="space-y-0.5 p-1.5 pt-2">
              {sidebarItems.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 rounded px-1.5 py-1 text-[7px] ${
                    item.active ? activeItem : inactiveItem
                  }`}
                >
                  <div className={`h-2.5 w-2.5 rounded-sm ${item.active ? (isLight ? "bg-blue-400/40" : "bg-blue-200") : (isLight ? "bg-white/10" : "bg-slate-200")}`} />
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className={`flex-1 overflow-hidden ${bgMain} p-2.5`}>
            {/* Page title */}
            <div className="mb-2">
              <div className={`text-[9px] font-bold ${textPrimary}`}>Dashboard</div>
              <div className={`text-[6px] ${textSecondary}`}>Visão geral do parque tecnológico</div>
            </div>

            {/* 4 Stat cards */}
            <div className="mb-2 grid grid-cols-4 gap-1.5">
              {statCards.map((card, i) => (
                <div key={i} className={`rounded-md border p-1.5 ${border} ${bg} ${cardShadow}`}>
                  <div className="flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${card.dot}`} />
                    <span className={`text-[5px] ${textSecondary}`}>{card.label}</span>
                  </div>
                  <div className={`mt-0.5 text-[11px] font-bold ${textPrimary}`}>{card.value}</div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-5 gap-1.5">
              {/* Bar chart - Manutenções por Mês */}
              <div className={`col-span-3 rounded-md border p-2 ${border} ${bg} ${cardShadow}`}>
                <div className={`mb-1.5 text-[6px] font-semibold ${textPrimary}`}>Manutenções por Mês</div>
                <div className="flex items-end gap-0.5" style={{ height: "60%" }}>
                  {barData.map((d, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
                      <div className="flex w-full items-end justify-center gap-px" style={{ height: "100%" }}>
                        <div
                          className="w-[40%] rounded-t bg-blue-400/70"
                          style={{ height: `${(d.prev / maxBar) * 100}%` }}
                        />
                        <div
                          className="w-[40%] rounded-t bg-amber-400/70"
                          style={{ height: `${(d.corr / maxBar) * 100}%` }}
                        />
                      </div>
                      <span className={`text-[5px] ${textMuted}`}>{months[i]}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 flex items-center justify-center gap-3">
                  <div className="flex items-center gap-0.5">
                    <span className="h-1 w-2 rounded-sm bg-blue-400/70" />
                    <span className={`text-[5px] ${textSecondary}`}>Preventivas</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <span className="h-1 w-2 rounded-sm bg-amber-400/70" />
                    <span className={`text-[5px] ${textSecondary}`}>Corretivas</span>
                  </div>
                </div>
              </div>

              {/* Pie chart - Equipamentos por Status */}
              <div className={`col-span-2 rounded-md border p-2 ${border} ${bg} ${cardShadow}`}>
                <div className={`mb-1 text-[6px] font-semibold ${textPrimary}`}>Equip. por Status</div>
                <div className="flex items-center justify-center" style={{ height: "65%" }}>
                  {/* CSS donut chart */}
                  <div
                    className="aspect-square w-[60%] rounded-full"
                    style={{
                      background: `conic-gradient(
                        #22c55e 0% 72%,
                        #94a3b8 72% 82%,
                        #f59e0b 82% 92%,
                        #ef4444 92% 100%
                      )`,
                    }}
                  >
                    <div className={`flex h-full w-full items-center justify-center rounded-full ${isLight ? "m-[20%] h-[60%] w-[60%] bg-slate-900" : "m-[20%] h-[60%] w-[60%] bg-white"}`}>
                      <span className={`text-[7px] font-bold ${textPrimary}`}>2.847</span>
                    </div>
                  </div>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5">
                  {[
                    { color: "bg-green-400", label: "Ativo", pct: "72%" },
                    { color: "bg-slate-400", label: "Inativo", pct: "10%" },
                    { color: "bg-amber-400", label: "Manutenção", pct: "10%" },
                    { color: "bg-red-400", label: "Descartado", pct: "8%" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-0.5">
                      <span className={`h-1 w-1 rounded-full ${item.color}`} />
                      <span className={`text-[4.5px] ${textSecondary}`}>{item.label}</span>
                      <span className={`ml-auto text-[4.5px] font-medium ${textMuted}`}>{item.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom row - Upcoming & Tickets */}
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {/* Próximos Vencimentos */}
              <div className={`rounded-md border p-1.5 ${border} ${bg} ${cardShadow}`}>
                <div className={`mb-1 text-[6px] font-semibold ${textPrimary}`}>Próximos Vencimentos</div>
                <div className="space-y-1">
                  {upcomingItems.map((item, i) => (
                    <div key={i} className={`flex items-center justify-between border-b pb-1 ${borderLight}`}>
                      <div className="min-w-0 flex-1">
                        <div className={`truncate text-[5.5px] font-medium ${textPrimary}`}>{item.equip}</div>
                        <div className={`text-[4.5px] ${textSecondary}`}>{item.service}</div>
                      </div>
                      <div className={`ml-1 shrink-0 rounded px-1 py-0.5 text-[4.5px] font-medium text-white ${item.color}`}>
                        {item.days}d
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MTTR / MTBF */}
              <div className={`rounded-md border p-1.5 ${border} ${bg} ${cardShadow}`}>
                <div className={`mb-1 text-[6px] font-semibold ${textPrimary}`}>Indicadores de Confiabilidade</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className={`rounded border p-1.5 text-center ${borderLight}`}>
                    <div className={`text-[5px] ${textSecondary}`}>MTTR</div>
                    <div className={`text-[10px] font-bold ${isLight ? "text-blue-300" : "text-blue-600"}`}>4.2h</div>
                    <div className={`text-[4px] ${textMuted}`}>Tempo médio de reparo</div>
                  </div>
                  <div className={`rounded border p-1.5 text-center ${borderLight}`}>
                    <div className={`text-[5px] ${textSecondary}`}>MTBF</div>
                    <div className={`text-[10px] font-bold ${isLight ? "text-blue-300" : "text-blue-600"}`}>1.247h</div>
                    <div className={`text-[4px] ${textMuted}`}>Tempo entre falhas</div>
                  </div>
                </div>
                {/* Mini status bars */}
                <div className="mt-1.5 space-y-0.5">
                  {[
                    { label: "Calibrações em dia", pct: 85, color: "bg-green-400" },
                    { label: "Preventivas em dia", pct: 92, color: "bg-blue-400" },
                    { label: "TSE em dia", pct: 78, color: "bg-amber-400" },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[4.5px] ${textSecondary}`}>{item.label}</span>
                        <span className={`text-[4.5px] font-medium ${textPrimary}`}>{item.pct}%</span>
                      </div>
                      <div className={`mt-0.5 h-1 overflow-hidden rounded-full ${isLight ? "bg-white/5" : "bg-slate-100"}`}>
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
