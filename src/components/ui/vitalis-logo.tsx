import Image from "next/image";

interface VitalisLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: { width: 140, height: 49 },
  md: { width: 200, height: 70 },
  lg: { width: 280, height: 99 },
  xl: { width: 380, height: 134 },
};

export function VitalisLogo({ className, size = "md" }: VitalisLogoProps) {
  const { width, height } = sizes[size];

  return (
    <Image
      src="/vitalis-logo.png"
      alt="Vitalis - Clinical Asset Management"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}
