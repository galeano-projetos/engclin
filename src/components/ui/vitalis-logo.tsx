import Image from "next/image";

interface VitalisLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "white";
}

const sizes = {
  sm: { width: 140, height: 49 },
  md: { width: 200, height: 70 },
  lg: { width: 280, height: 99 },
  xl: { width: 323, height: 114 },
};

export function VitalisLogo({ className, size = "md", variant = "default" }: VitalisLogoProps) {
  const { width, height } = sizes[size];

  return (
    <Image
      src="/vitalis-logo.png"
      alt="Vitalis - Clinical Asset Management"
      width={width}
      height={height}
      className={`${variant === "white" ? "brightness-0 invert" : ""} ${className ?? ""}`}
      priority
    />
  );
}
