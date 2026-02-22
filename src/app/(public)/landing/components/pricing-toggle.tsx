"use client";

interface PricingToggleProps {
  isAnnual: boolean;
  onChange: (isAnnual: boolean) => void;
}

export function PricingToggle({ isAnnual, onChange }: PricingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className={`text-sm ${!isAnnual ? "font-medium text-white" : "text-slate-400"}`}>
        Mensal
      </span>
      <button
        onClick={() => onChange(!isAnnual)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
          isAnnual ? "bg-teal-600" : "bg-slate-600"
        }`}
        aria-label="Alternar entre mensal e anual"
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            isAnnual ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <span className={`text-sm ${isAnnual ? "font-medium text-white" : "text-slate-400"}`}>
        Anual
      </span>
      {isAnnual && (
        <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-medium text-teal-300">
          2 meses grátis
        </span>
      )}
    </div>
  );
}
