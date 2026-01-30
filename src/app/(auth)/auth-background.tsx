"use client";

import { useEffect, useRef } from "react";

export function AuthBackground({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -200, y: -200 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // Ambient floating particles (light theme — teal tones)
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      baseOpacity: number;
      phase: number;
    }[] = [];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2.5 + 0.8,
        baseOpacity: Math.random() * 0.25 + 0.08,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let frame = 0;

    function animate() {
      frame++;
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Draw & update particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas!.width;
        if (p.x > canvas!.width) p.x = 0;
        if (p.y < 0) p.y = canvas!.height;
        if (p.y > canvas!.height) p.y = 0;

        const pulse = Math.sin(frame * 0.015 + p.phase) * 0.2 + 0.8;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius * pulse, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(13, 148, 136, ${p.baseOpacity * pulse})`;
        ctx!.fill();
      }

      // Connection lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `rgba(13, 148, 136, ${0.05 * (1 - dist / 130)})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }

      // Mouse interaction
      if (mx > 0 && my > 0) {
        // Lines from particles to mouse
        for (const p of particles) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(mx, my);
            ctx!.strokeStyle = `rgba(13, 148, 136, ${0.12 * (1 - dist / 180)})`;
            ctx!.lineWidth = 0.7;
            ctx!.stroke();

            // Gentle repulsion
            p.x += (dx / dist) * 0.3;
            p.y += (dy / dist) * 0.3;
          }
        }

        // Soft glow at cursor
        const gradient = ctx!.createRadialGradient(mx, my, 0, mx, my, 100);
        gradient.addColorStop(0, "rgba(13, 148, 136, 0.06)");
        gradient.addColorStop(1, "rgba(13, 148, 136, 0)");
        ctx!.beginPath();
        ctx!.arc(mx, my, 100, 0, Math.PI * 2);
        ctx!.fillStyle = gradient;
        ctx!.fill();
      }

      animId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  function handleMouseMove(e: React.MouseEvent) {
    mouseRef.current = { x: e.clientX, y: e.clientY };
  }

  function handleMouseLeave() {
    mouseRef.current = { x: -200, y: -200 };
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-teal-50 px-4"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0"
      />

      {/* Decorative gradient orbs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-teal-100/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-100/40 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-teal-200/20 blur-3xl" />

      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #0d9488 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10">{children}</div>

      <footer className="absolute bottom-6 z-10 text-xs text-gray-400">
        Uma empresa{" "}
        <span className="font-semibold text-gray-500">Seprorad</span>
      </footer>
    </div>
  );
}
