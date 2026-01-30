interface VitalisLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: { width: 140, height: 40 },
  md: { width: 200, height: 57 },
  lg: { width: 280, height: 80 },
  xl: { width: 380, height: 109 },
};

export function VitalisLogo({ className, size = "md" }: VitalisLogoProps) {
  const { width, height } = sizes[size];

  return (
    <svg
      viewBox="0 0 380 109"
      width={width}
      height={height}
      className={className}
      aria-label="Vitalis"
    >
      <defs>
        <linearGradient id="vitalis-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="50%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#115e59" />
        </linearGradient>
        <linearGradient id="vitalis-ecg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="50%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>

      {/* Full word "Vitalis" centered */}
      <text
        x="190"
        y="84"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
        fontSize="88"
        fontWeight="800"
        fill="url(#vitalis-grad)"
        letterSpacing="-2"
      >
        Vitalis
      </text>

      {/* ECG line on the V */}
      <polyline
        points="56,34 68,34 74,22 80,46 86,14 92,40 100,34 110,34"
        fill="none"
        stroke="url(#vitalis-ecg)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Pulse dot on the first i */}
      <circle cx="152" cy="22" r="5" fill="#14b8a6" />
      <circle cx="152" cy="22" r="9" fill="none" stroke="#14b8a6" strokeWidth="1.5" opacity="0.3" />
    </svg>
  );
}
