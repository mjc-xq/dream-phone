"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";

const COLORS = ["#ff2d8a", "#00d4d0", "#ffd400", "#8a2be2", "#5cffb7", "#25e5ff", "#ff8a00"];

// Deterministic PRNG so render output is stable per-mount.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Confetti({ count = 60, seed = 1337 }: { count?: number; seed?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  const pieces = useMemo(() => {
    const rng = mulberry32(seed);
    return Array.from({ length: count }, (_, i) => {
      const color = COLORS[i % COLORS.length];
      const shape = i % 4;
      const size = 8 + rng() * 8;
      const dx = (rng() - 0.5) * 600;
      const dy = -200 - rng() * 200;
      const rot = (rng() - 0.5) * 720;
      const delay = rng() * 0.4;
      const dur = 1.4 + rng() * 1.2;
      const repeatDelay = 0.6 + rng() * 0.8;
      return { color, shape, size, dx, dy, rot, delay, dur, repeatDelay };
    });
  }, [count, seed]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ctx = gsap.context(() => {
      const els = Array.from(wrap.children) as HTMLElement[];
      els.forEach((el, i) => {
        const p = pieces[i];
        gsap.fromTo(
          el,
          { x: 0, y: 0, rotation: 0, opacity: 1 },
          {
            x: p.dx,
            y: p.dy,
            rotation: p.rot,
            opacity: 0,
            duration: p.dur,
            delay: p.delay,
            ease: "power2.out",
            repeat: -1,
            repeatDelay: p.repeatDelay,
          },
        );
      });
    }, wrap);
    return () => ctx.revert();
  }, [pieces]);

  return (
    <div ref={wrapRef} aria-hidden className="pointer-events-none absolute inset-0 flex items-end justify-center overflow-visible">
      {pieces.map((p, i) => {
        const style: React.CSSProperties = { width: p.size, height: p.size, background: p.color };
        if (p.shape === 1) style.borderRadius = "50%";
        else if (p.shape === 2) {
          style.background = "transparent";
          style.borderLeft = `${p.size / 2}px solid transparent`;
          style.borderRight = `${p.size / 2}px solid transparent`;
          style.borderBottom = `${p.size}px solid ${p.color}`;
          style.width = 0;
          style.height = 0;
        } else if (p.shape === 3) {
          style.transform = "rotate(45deg)";
        }
        return <span key={i} className="absolute" style={style} />;
      })}
    </div>
  );
}
