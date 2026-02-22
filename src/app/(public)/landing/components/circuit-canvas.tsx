"use client";

import { useEffect, useRef } from "react";

interface CircuitCanvasProps {
  className?: string;
}

interface Node {
  x: number;
  y: number;
  connections: number[];
  pulse: number;
  baseGlow: number;
}

export function CircuitCanvas({ className }: CircuitCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -999, y: -999 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let nodes: Node[] = [];
    let pulses: { fromIdx: number; toIdx: number; progress: number; speed: number }[] = [];

    function buildGrid() {
      w = container!.clientWidth;
      h = container!.clientHeight;
      canvas!.width = w;
      canvas!.height = h;
      nodes = [];
      pulses = [];

      const spacing = w < 768 ? 80 : 60;
      const cols = Math.ceil(w / spacing) + 1;
      const rows = Math.ceil(h / spacing) + 1;
      const offsetX = (w - (cols - 1) * spacing) / 2;
      const offsetY = (h - (rows - 1) * spacing) / 2;

      // Create nodes with slight random offset
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const jitterX = (Math.random() - 0.5) * spacing * 0.3;
          const jitterY = (Math.random() - 0.5) * spacing * 0.3;
          nodes.push({
            x: offsetX + c * spacing + jitterX,
            y: offsetY + r * spacing + jitterY,
            connections: [],
            pulse: Math.random() * Math.PI * 2,
            baseGlow: Math.random() * 0.3 + 0.05,
          });
        }
      }

      // Build connections (only to nearby nodes, prefer orthogonal)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < spacing * 1.5 && Math.random() < 0.4) {
            nodes[i].connections.push(j);
            nodes[j].connections.push(i);
          }
        }
      }

      // Seed initial pulses
      for (let i = 0; i < Math.floor(nodes.length * 0.04); i++) {
        spawnPulse();
      }
    }

    function spawnPulse() {
      const fromIdx = Math.floor(Math.random() * nodes.length);
      const node = nodes[fromIdx];
      if (node.connections.length === 0) return;
      const toIdx = node.connections[Math.floor(Math.random() * node.connections.length)];
      pulses.push({
        fromIdx,
        toIdx,
        progress: 0,
        speed: 0.005 + Math.random() * 0.01,
      });
    }

    buildGrid();

    const ro = new ResizeObserver(buildGrid);
    ro.observe(container);

    let frame = 0;

    function animate() {
      frame++;
      ctx!.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const mouseRadius = 180;

      // Draw connections (traces)
      const drawnEdges = new Set<string>();
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        for (const j of n.connections) {
          const key = i < j ? `${i}-${j}` : `${j}-${i}`;
          if (drawnEdges.has(key)) continue;
          drawnEdges.add(key);

          const n2 = nodes[j];
          const midX = (n.x + n2.x) / 2;
          const midY = (n.y + n2.y) / 2;

          // Mouse proximity for trace
          const dxm = midX - mx;
          const dym = midY - my;
          const distMouse = Math.sqrt(dxm * dxm + dym * dym);
          const mouseInfluence = distMouse < mouseRadius ? (1 - distMouse / mouseRadius) : 0;

          const alpha = 0.04 + mouseInfluence * 0.15;

          ctx!.beginPath();
          ctx!.moveTo(n.x, n.y);
          // Draw as right-angle traces (circuit board style)
          const dx = n2.x - n.x;
          const dy = n2.y - n.y;
          if (Math.abs(dx) > Math.abs(dy)) {
            const midPx = n.x + dx * 0.5;
            ctx!.lineTo(midPx, n.y);
            ctx!.lineTo(midPx, n2.y);
            ctx!.lineTo(n2.x, n2.y);
          } else {
            const midPy = n.y + dy * 0.5;
            ctx!.lineTo(n.x, midPy);
            ctx!.lineTo(n2.x, midPy);
            ctx!.lineTo(n2.x, n2.y);
          }
          ctx!.strokeStyle = `rgba(20, 184, 166, ${alpha})`;
          ctx!.lineWidth = mouseInfluence > 0 ? 1 + mouseInfluence : 0.5;
          ctx!.stroke();
        }
      }

      // Draw nodes
      for (const n of nodes) {
        const dxm = n.x - mx;
        const dym = n.y - my;
        const distMouse = Math.sqrt(dxm * dxm + dym * dym);
        const mouseInfluence = distMouse < mouseRadius ? (1 - distMouse / mouseRadius) : 0;

        const pulse = Math.sin(frame * 0.015 + n.pulse) * 0.3 + 0.7;
        const glow = n.baseGlow * pulse + mouseInfluence * 0.6;
        const radius = 1.5 + mouseInfluence * 2.5;

        // Outer glow
        if (mouseInfluence > 0.1) {
          const grad = ctx!.createRadialGradient(n.x, n.y, 0, n.x, n.y, radius * 4);
          grad.addColorStop(0, `rgba(20, 184, 166, ${mouseInfluence * 0.15})`);
          grad.addColorStop(1, "rgba(20, 184, 166, 0)");
          ctx!.beginPath();
          ctx!.arc(n.x, n.y, radius * 4, 0, Math.PI * 2);
          ctx!.fillStyle = grad;
          ctx!.fill();
        }

        // Node dot
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(20, 184, 166, ${glow})`;
        ctx!.fill();
      }

      // Draw data pulses traveling along traces
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p];
        pulse.progress += pulse.speed;

        if (pulse.progress >= 1) {
          // Pulse reached destination, maybe chain
          if (Math.random() < 0.6) {
            const nextNode = nodes[pulse.toIdx];
            if (nextNode.connections.length > 0) {
              const nextTo = nextNode.connections[Math.floor(Math.random() * nextNode.connections.length)];
              pulses[p] = {
                fromIdx: pulse.toIdx,
                toIdx: nextTo,
                progress: 0,
                speed: pulse.speed,
              };
              continue;
            }
          }
          pulses.splice(p, 1);
          continue;
        }

        const from = nodes[pulse.fromIdx];
        const to = nodes[pulse.toIdx];
        const t = pulse.progress;

        // Interpolate along the right-angle path
        let px: number, py: number;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          const midPx = from.x + dx * 0.5;
          if (t < 0.33) {
            px = from.x + (midPx - from.x) * (t / 0.33);
            py = from.y;
          } else if (t < 0.66) {
            px = midPx;
            py = from.y + (to.y - from.y) * ((t - 0.33) / 0.33);
          } else {
            px = midPx + (to.x - midPx) * ((t - 0.66) / 0.34);
            py = to.y;
          }
        } else {
          const midPy = from.y + dy * 0.5;
          if (t < 0.33) {
            px = from.x;
            py = from.y + (midPy - from.y) * (t / 0.33);
          } else if (t < 0.66) {
            px = from.x + (to.x - from.x) * ((t - 0.33) / 0.33);
            py = midPy;
          } else {
            px = to.x;
            py = midPy + (to.y - midPy) * ((t - 0.66) / 0.34);
          }
        }

        // Bright traveling dot
        const grad = ctx!.createRadialGradient(px, py, 0, px, py, 8);
        grad.addColorStop(0, "rgba(94, 234, 212, 0.8)");
        grad.addColorStop(0.5, "rgba(20, 184, 166, 0.3)");
        grad.addColorStop(1, "rgba(20, 184, 166, 0)");
        ctx!.beginPath();
        ctx!.arc(px, py, 8, 0, Math.PI * 2);
        ctx!.fillStyle = grad;
        ctx!.fill();

        ctx!.beginPath();
        ctx!.arc(px, py, 2, 0, Math.PI * 2);
        ctx!.fillStyle = "rgba(167, 243, 208, 0.9)";
        ctx!.fill();
      }

      // Spawn new pulses periodically
      if (frame % 60 === 0) {
        spawnPulse();
      }

      // Mouse cursor glow
      if (mx > 0 && my > 0) {
        const grad = ctx!.createRadialGradient(mx, my, 0, mx, my, mouseRadius);
        grad.addColorStop(0, "rgba(20, 184, 166, 0.06)");
        grad.addColorStop(0.5, "rgba(20, 184, 166, 0.02)");
        grad.addColorStop(1, "rgba(20, 184, 166, 0)");
        ctx!.beginPath();
        ctx!.arc(mx, my, mouseRadius, 0, Math.PI * 2);
        ctx!.fillStyle = grad;
        ctx!.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, []);

  function handleMouseMove(e: React.MouseEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
  }

  function handleMouseLeave() {
    mouseRef.current = { x: -999, y: -999 };
  }

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
