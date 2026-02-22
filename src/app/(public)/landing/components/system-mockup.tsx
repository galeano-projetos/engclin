"use client";

import Image from "next/image";

interface SystemMockupProps {
  className?: string;
}

export function SystemMockup({ className }: SystemMockupProps) {
  return (
    <div className={`overflow-hidden rounded-xl border border-white/10 shadow-2xl ${className ?? ""}`}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 bg-[#1e293b] px-4 py-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
        </div>
        <div className="ml-2 flex-1 rounded-md bg-[#0f172a] px-3 py-1 text-[11px] text-slate-500">
          app.vitalis.com/dashboard
        </div>
      </div>

      {/* App UI */}
      <div className="flex bg-[#0f172a]">
        {/* Sidebar */}
        <div className="hidden w-40 shrink-0 border-r border-white/5 bg-white/[0.02] p-3 sm:block">
          {/* Logo */}
          <div className="mb-4 flex items-center gap-2">
            <Image src="/vitalis-icon.png" alt="" width={20} height={20} className="brightness-0 invert opacity-60" />
            <span className="text-[11px] font-semibold text-white/60">Vitalis</span>
          </div>
          {/* Nav items */}
          <div className="space-y-0.5">
            {[
              { label: "Dashboard", active: true },
              { label: "Equipamentos" },
              { label: "Preventivas" },
              { label: "Chamados" },
              { label: "Ordens de Serviço" },
              { label: "Física Médica" },
              { label: "Relatórios" },
              { label: "Inteligência IA" },
            ].map((item, i) => (
              <div
                key={i}
                className={`rounded px-2 py-1.5 text-[10px] ${
                  item.active
                    ? "bg-teal-500/15 font-medium text-teal-400"
                    : "text-white/30"
                }`}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-3 sm:p-4">
          {/* Title */}
          <div className="mb-3">
            <div className="text-xs font-bold text-white/80">Dashboard</div>
            <div className="text-[9px] text-white/30">Visão geral do parque tecnológico</div>
          </div>

          {/* Stat cards */}
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Equipamentos", value: "2.847", color: "bg-blue-400" },
              { label: "Serv. Vencidos", value: "12", color: "bg-red-400" },
              { label: "Chamados", value: "8", color: "bg-amber-400" },
              { label: "Ativos", value: "2.691", color: "bg-emerald-400" },
            ].map((card, i) => (
              <div key={i} className="rounded-lg border border-white/5 bg-white/[0.03] p-2.5">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${card.color}`} />
                  <span className="text-[8px] text-white/40">{card.label}</span>
                </div>
                <div className="mt-1 text-lg font-bold text-white/90">{card.value}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
            {/* Bar chart */}
            <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2.5 sm:col-span-3">
              <div className="mb-2 text-[9px] font-semibold text-white/60">Manutenções por Mês</div>
              <div className="flex items-end gap-1.5" style={{ height: 80 }}>
                {[
                  { p: 45, c: 12 },
                  { p: 52, c: 18 },
                  { p: 48, c: 9 },
                  { p: 61, c: 15 },
                  { p: 55, c: 11 },
                  { p: 58, c: 7 },
                ].map((d, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center">
                    <div className="flex w-full items-end justify-center gap-px" style={{ height: 65 }}>
                      <div
                        className="w-[38%] rounded-t-sm bg-blue-400/60"
                        style={{ height: `${(d.p / 61) * 100}%` }}
                      />
                      <div
                        className="w-[38%] rounded-t-sm bg-amber-400/60"
                        style={{ height: `${(d.c / 61) * 100}%` }}
                      />
                    </div>
                    <span className="mt-1 text-[7px] text-white/20">
                      {["Set", "Out", "Nov", "Dez", "Jan", "Fev"][i]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-center gap-4">
                <span className="flex items-center gap-1 text-[7px] text-white/30">
                  <span className="h-1.5 w-3 rounded-sm bg-blue-400/60" /> Preventivas
                </span>
                <span className="flex items-center gap-1 text-[7px] text-white/30">
                  <span className="h-1.5 w-3 rounded-sm bg-amber-400/60" /> Corretivas
                </span>
              </div>
            </div>

            {/* Donut chart */}
            <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2.5 sm:col-span-2">
              <div className="mb-2 text-[9px] font-semibold text-white/60">Equipamentos por Status</div>
              <div className="flex items-center justify-center" style={{ height: 80 }}>
                <div className="relative h-16 w-16">
                  <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(34,197,94,0.6)" strokeWidth="5" strokeDasharray="63 37" strokeDashoffset="0" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(148,163,184,0.5)" strokeWidth="5" strokeDasharray="9 91" strokeDashoffset="-63" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(245,158,11,0.6)" strokeWidth="5" strokeDasharray="9 91" strokeDashoffset="-72" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(239,68,68,0.5)" strokeWidth="5" strokeDasharray="7 93" strokeDashoffset="-81" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white/80">2.847</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                {[
                  { c: "bg-green-400", l: "Ativo", p: "72%" },
                  { c: "bg-slate-400", l: "Inativo", p: "10%" },
                  { c: "bg-amber-400", l: "Manutenção", p: "10%" },
                  { c: "bg-red-400", l: "Descartado", p: "8%" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${item.c}`} />
                    <span className="text-[7px] text-white/30">{item.l}</span>
                    <span className="ml-auto text-[7px] text-white/20">{item.p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {/* Upcoming */}
            <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2.5">
              <div className="mb-1.5 text-[9px] font-semibold text-white/60">Próximos Vencimentos</div>
              {[
                { name: "Ventilador Pulmonar VP-500", type: "Calibração", days: 3, c: "bg-red-400" },
                { name: "Monitor Multiparâmetro MX-800", type: "Preventiva", days: 12, c: "bg-amber-400" },
                { name: "Desfibrilador DEA Pro", type: "TSE", days: 25, c: "bg-blue-400" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b border-white/5 py-1.5 last:border-0">
                  <div className="min-w-0">
                    <div className="truncate text-[8px] font-medium text-white/70">{item.name}</div>
                    <div className="text-[7px] text-white/30">{item.type}</div>
                  </div>
                  <span className={`ml-2 shrink-0 rounded px-1.5 py-0.5 text-[7px] font-bold text-white ${item.c}`}>
                    {item.days}d
                  </span>
                </div>
              ))}
            </div>

            {/* MTTR/MTBF */}
            <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2.5">
              <div className="mb-1.5 text-[9px] font-semibold text-white/60">Confiabilidade</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border border-white/5 p-2 text-center">
                  <div className="text-[7px] text-white/30">MTTR</div>
                  <div className="text-base font-bold text-blue-400">4.2h</div>
                </div>
                <div className="rounded border border-white/5 p-2 text-center">
                  <div className="text-[7px] text-white/30">MTBF</div>
                  <div className="text-base font-bold text-blue-400">1.247h</div>
                </div>
              </div>
              <div className="mt-2 space-y-1.5">
                {[
                  { l: "Calibrações em dia", pct: 85, c: "bg-emerald-400" },
                  { l: "Preventivas em dia", pct: 92, c: "bg-blue-400" },
                ].map((b, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between">
                      <span className="text-[7px] text-white/30">{b.l}</span>
                      <span className="text-[7px] font-medium text-white/50">{b.pct}%</span>
                    </div>
                    <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-white/5">
                      <div className={`h-full rounded-full ${b.c}`} style={{ width: `${b.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
