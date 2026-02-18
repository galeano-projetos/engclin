"use client";

import { useEffect, useRef, useCallback } from "react";

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

interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseOpacity: number;
  phase: number;
}

interface ParticleCanvasProps {
  className?: string;
  particleCount?: number;
}

export function ParticleCanvas({ className, particleCount = 50 }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -200, y: -200 });
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

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
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const count = window.innerWidth < 768 ? Math.min(particleCount, 25) : particleCount;

    function resize() {
      canvas!.width = container!.clientWidth;
      canvas!.height = container!.clientHeight;
    }
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const ambientParticles: AmbientParticle[] = [];
    for (let i = 0; i < count; i++) {
      ambientParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
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
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);

      for (const p of ambientParticles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        const pulse = Math.sin(frame * 0.02 + p.phase) * 0.15 + 0.85;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius * pulse, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(20, 184, 166, ${p.baseOpacity * pulse})`;
        ctx!.fill();
      }

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

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      if (mx > 0 && my > 0 && frame % 2 === 0) {
        particlesRef.current.push(createParticle(mx, my));
      }

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
          p.x += (dx / dist) * 0.5;
          p.y += (dy / dist) * 0.5;
        }
      }

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
      ro.disconnect();
    };
  }, [createParticle, particleCount]);

  function handleMouseMove(e: React.MouseEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
  }

  function handleMouseLeave() {
    mouseRef.current = { x: -200, y: -200 };
  }

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" />
    </div>
  );
}
