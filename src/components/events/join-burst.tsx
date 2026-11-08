"use client";

import * as React from "react";

interface Particle {
  id: number;
  tx: number;
  ty: number;
  color: string;
  size: number;
  delay: number;
  isStar?: boolean;
}

const COLORS = [
  "#FF0055", // YouTube Red/Pink
  "#FF5722", // Deep Orange
  "#FFC107", // Vivid Amber
  "#00E676", // Bright Green
  "#00BCD4", // Cyan
  "#2979FF", // Royal Blue
  "#D500F9", // Neon Purple
  "#FF1744", // Crimson
  "#FF9100", // Gold
  "#00E5FF", // Turquoise
];

export function JoinBurstEffect({ active }: { active: boolean }) {
  const [particles, setParticles] = React.useState<Particle[]>([]);

  React.useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    // Generate 18 radial burst particles
    const count = 18;
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i * (360 / count) + (Math.random() * 14 - 7)) * (Math.PI / 180);
      const distance = 42 + Math.random() * 32; // 42px to 74px outward
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      const color = COLORS[i % COLORS.length];
      const size = 5 + (i % 3) * 2;
      const delay = (i % 4) * 0.02;
      const isStar = i % 2 === 0;

      newParticles.push({
        id: i,
        tx,
        ty,
        color,
        size,
        delay,
        isStar,
      });
    }

    setParticles(newParticles);
  }, [active]);

  if (!active || particles.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-visible"
      aria-hidden="true"
    >
      {/* 1. YouTube Expanding Ring Shockwave */}
      <div
        className="absolute h-12 w-12 rounded-full border-2 border-red-500/80 dark:border-red-400/90 animate-yt-ring"
        style={{ left: "50%", top: "50%" }}
      />
      <div
        className="absolute h-10 w-10 rounded-full border border-amber-400/80 animate-yt-ring"
        style={{ left: "50%", top: "50%", animationDelay: "0.08s" }}
      />

      {/* 2. Floating "+1 Joined! 🎉" Pill */}
      <div
        className="absolute left-1/2 -top-2 select-none whitespace-nowrap rounded-full bg-foreground text-background px-3 py-1 text-xs font-bold tracking-tight shadow-lg animate-yt-float"
      >
        +1 Joined! 🎉
      </div>

      {/* 3. Radial Particle Burst */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full animate-yt-particle"
          style={
            {
              "--tx": `${p.tx}px`,
              "--ty": `${p.ty}px`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              animationDelay: `${p.delay}s`,
              borderRadius: p.isStar ? "2px" : "9999px",
              transform: p.isStar ? "rotate(45deg)" : "none",
              boxShadow: `0 0 8px ${p.color}`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
