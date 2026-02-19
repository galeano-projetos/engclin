"use client";

import { useEffect, useState, useCallback } from "react";
import { useInView } from "../hooks/use-in-view";

interface Stats {
  totalEquipments: number;
  totalTenants: number;
}

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) return;

    let start = 0;
    const startTime = performance.now();

    function step(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);

      if (current !== start) {
        start = current;
        setCount(current);
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    }

    requestAnimationFrame(step);
  }, [target, duration]);

  return <>{count.toLocaleString("pt-BR")}</>;
}

export function PlatformStats() {
  const { ref, inView } = useInView({ threshold: 0.1 });
  const [stats, setStats] = useState<Stats | null>(null);
  const [started, setStarted] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (inView && stats && !started) {
      setStarted(true);
    }
  }, [inView, stats, started]);

  const hasData = stats && stats.totalEquipments > 0;

  return (
    <section
      ref={ref}
      className={`px-4 sm:px-6 lg:px-8 transition-all duration-500 ${
        hasData
          ? "bg-gradient-to-b from-gray-50 to-white py-20"
          : "h-0 overflow-hidden py-0"
      }`}
    >
      {hasData && (
        <div className="mx-auto max-w-4xl text-center">
          <p
            className={`text-sm font-semibold uppercase tracking-widest text-teal-600 ${
              inView ? "animate-fade-in-up" : "opacity-0"
            }`}
          >
            Plataforma em numeros
          </p>
          <h2
            className={`mt-3 text-3xl font-bold text-gray-900 sm:text-4xl ${
              inView ? "animate-fade-in-up" : "opacity-0"
            }`}
            style={{ animationDelay: inView ? "150ms" : undefined }}
          >
            Ja gerenciamos milhares de ativos.
          </h2>

          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            <div
              className={`rounded-2xl border border-gray-200 bg-white p-8 shadow-sm ${
                inView ? "animate-fade-in-up" : "opacity-0"
              }`}
              style={{ animationDelay: inView ? "300ms" : undefined }}
            >
              <div className="text-5xl font-extrabold text-teal-600 sm:text-6xl">
                {started ? <AnimatedCounter target={stats.totalEquipments} /> : "0"}
                <span className="text-3xl text-teal-400">+</span>
              </div>
              <p className="mt-3 text-lg text-gray-600">
                Equipamentos gerenciados
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Ativos monitorados em tempo real
              </p>
            </div>

            <div
              className={`rounded-2xl border border-gray-200 bg-white p-8 shadow-sm ${
                inView ? "animate-fade-in-up" : "opacity-0"
              }`}
              style={{ animationDelay: inView ? "450ms" : undefined }}
            >
              <div className="text-5xl font-extrabold text-teal-600 sm:text-6xl">
                {started ? <AnimatedCounter target={stats.totalTenants} /> : "0"}
              </div>
              <p className="mt-3 text-lg text-gray-600">
                Empresas confiam no Vitalis
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Hospitais, clinicas e laboratorios
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
