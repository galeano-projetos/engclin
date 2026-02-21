import Image from "next/image";

interface VitalisLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: { width: 140, height: 79 },
  md: { width: 200, height: 113 },
  lg: { width: 280, height: 158 },
  xl: { width: 380, height: 214 },
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
