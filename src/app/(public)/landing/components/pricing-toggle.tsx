"use client";

interface PricingToggleProps {
  isAnnual: boolean;
  onChange: (isAnnual: boolean) => void;
}

export function PricingToggle({ isAnnual, onChange }: PricingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className={`text-sm ${!isAnnual ? "font-medium text-gray-900" : "text-gray-500"}`}>
        Mensal
      </span>
      <button
        onClick={() => onChange(!isAnnual)}
        className={`relative h-7 w-14 rounded-full transition-colors ${
          isAnnual ? "bg-teal-600" : "bg-gray-300"
        }`}
        aria-label="Alternar entre mensal e anual"
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
            isAnnual ? "translate-x-7.5" : "translate-x-0.5"
          }`}
        />
      </button>
      <span className={`text-sm ${isAnnual ? "font-medium text-gray-900" : "text-gray-500"}`}>
        Anual
      </span>
      {isAnnual && (
        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
          2 meses grátis
        </span>
      )}
    </div>
  );
}
