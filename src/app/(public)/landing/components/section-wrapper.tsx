"use client";

import { useInView } from "../hooks/use-in-view";

interface SectionWrapperProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionWrapper({ id, children, className }: SectionWrapperProps) {
  const { ref, inView } = useInView({ threshold: 0.1 });

  return (
    <section
      id={id}
      ref={ref}
      className={`scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8 ${
        inView ? "animate-fade-in-up" : "opacity-0"
      } ${className ?? ""}`}
    >
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}
