"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { VitalisLogo } from "@/components/ui/vitalis-logo";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -200, y: -200 });
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

  const createParticle = useCallback((x: number, y: number): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 1.5 + 0.3;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: Math.random() * 2.5 + 1,
      opacity: 1,
      life: 0,
      maxLife: Math.random() * 60 + 40,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // Ambient floating particles
    const ambientParticles: { x: number; y: number; vx: number; vy: number; radius: number; baseOpacity: number; phase: number }[] = [];
    for (let i = 0; i < 50; i++) {
      ambientParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 0.5,
        baseOpacity: Math.random() * 0.3 + 0.1,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let frame = 0;

    function animate() {
      frame++;
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      // Draw ambient particles
      for (const p of ambientParticles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas!.width;
        if (p.x > canvas!.width) p.x = 0;
        if (p.y < 0) p.y = canvas!.height;
        if (p.y > canvas!.height) p.y = 0;

        const pulse = Math.sin(frame * 0.02 + p.phase) * 0.15 + 0.85;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius * pulse, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(20, 184, 166, ${p.baseOpacity * pulse})`;
        ctx!.fill();
      }

      // Draw connection lines between close ambient particles
      for (let i = 0; i < ambientParticles.length; i++) {
        for (let j = i + 1; j < ambientParticles.length; j++) {
          const dx = ambientParticles[i].x - ambientParticles[j].x;
          const dy = ambientParticles[i].y - ambientParticles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx!.beginPath();
            ctx!.moveTo(ambientParticles[i].x, ambientParticles[i].y);
            ctx!.lineTo(ambientParticles[j].x, ambientParticles[j].y);
            ctx!.strokeStyle = `rgba(20, 184, 166, ${0.06 * (1 - dist / 150)})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }

      // Mouse trail particles
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      if (mx > 0 && my > 0 && frame % 2 === 0) {
        particlesRef.current.push(createParticle(mx, my));
      }

      // Connect ambient particles near mouse
      for (const p of ambientParticles) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          ctx!.beginPath();
          ctx!.moveTo(p.x, p.y);
          ctx!.lineTo(mx, my);
          ctx!.strokeStyle = `rgba(45, 212, 191, ${0.15 * (1 - dist / 200)})`;
          ctx!.lineWidth = 0.8;
          ctx!.stroke();

          // Gently push particles away from mouse
          p.x += (dx / dist) * 0.5;
          p.y += (dy / dist) * 0.5;
        }
      }

      // Update and draw mouse trail particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.life++;
        if (p.life >= p.maxLife) return false;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.opacity = 1 - p.life / p.maxLife;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius * p.opacity, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(94, 234, 212, ${p.opacity * 0.7})`;
        ctx!.fill();
        return true;
      });

      // Glow at mouse position
      if (mx > 0 && my > 0) {
        const gradient = ctx!.createRadialGradient(mx, my, 0, mx, my, 80);
        gradient.addColorStop(0, "rgba(20, 184, 166, 0.08)");
        gradient.addColorStop(1, "rgba(20, 184, 166, 0)");
        ctx!.beginPath();
        ctx!.arc(mx, my, 80, 0, Math.PI * 2);
        ctx!.fillStyle = gradient;
        ctx!.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [createParticle]);

  function handleMouseMove(e: React.MouseEvent) {
    mouseRef.current = { x: e.clientX, y: e.clientY };
  }

  function handleMouseLeave() {
    mouseRef.current = { x: -200, y: -200 };
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0"
      />

      {/* Subtle gradient orbs */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-teal-500/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-cyan-500/5 blur-3xl" />

      <main className="relative z-10 flex flex-col items-center text-center">
        <Link
          href="/login"
          className="group inline-block rounded-2xl border border-teal-500/10 bg-white/5 px-10 py-8 backdrop-blur-sm transition-all duration-300 hover:border-teal-400/30 hover:bg-white/10 hover:shadow-2xl hover:shadow-teal-500/10"
        >
          <VitalisLogo size="xl" />
        </Link>

        <p className="mt-6 text-lg font-light tracking-wide text-teal-200/80">
          Gestão de Equipamentos com IA
        </p>
      </main>

      <footer className="absolute bottom-6 z-10 text-xs text-slate-500">
        Uma empresa <span className="font-semibold text-slate-400">Seprorad</span>
      </footer>
    </div>
  );
}
