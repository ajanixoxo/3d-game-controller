"use client";

import { gsap } from "gsap";
import { useState } from "react";
import { playClick } from "@/lib/sounds";
import { store } from "@/lib/store";

const PHASES = [
  {
    eyebrow: "Coming apart",
    title: "Inside the DualSense",
    body: "Every piece you see separate here is a real, separately modeled part — shells, sticks, triggers, touch pad, and the core that carries them.",
  },
  {
    eyebrow: "The layers",
    title: "Built in layers",
    body: "The face components float above the inner core; bumpers and triggers lift from the top edge. On the real controller this core houses the haptic actuators and trigger motors.",
  },
  {
    eyebrow: "Back together",
    title: "Precision assembly",
    body: "Everything returns to its seat. Keep scrolling — next, the controller shows you what it can feel.",
  },
];

interface InsideProps {
  phase: number;
  reduced: boolean;
}

export function Inside({ phase, reduced }: InsideProps) {
  const [exploded, setExploded] = useState(false);
  const current = PHASES[Math.min(phase, PHASES.length - 1)];

  const toggleExplode = () => {
    const next = !exploded;
    setExploded(next);
    playClick();
    gsap.to(store, {
      explode: next ? 1 : 0,
      basePitch: next ? -1.45 : -0.3,
      baseYaw: next ? -0.45 : -0.2,
      duration: reduced ? 0 : 1.2,
      ease: "power2.inOut",
    });
  };

  return (
    <section data-s-inside className="relative flex h-screen items-end sm:items-center">
      <div className="stage-fade" aria-hidden />
      <div
        className="copy-block pointer-events-auto w-full max-w-md px-6 pb-10 sm:ml-[7vw] sm:px-0 sm:pb-0"
        aria-live="polite"
      >
        <p className="eyebrow">{current.eyebrow}</p>
        <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">{current.title}</h2>
        <p className="mt-4 max-w-sm text-pretty text-base leading-relaxed text-muted">{current.body}</p>
        {reduced && (
          <button
            type="button"
            onClick={toggleExplode}
            className="mt-5 rounded-full bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent/85"
          >
            {exploded ? "Reassemble" : "Exploded view"}
          </button>
        )}
      </div>
    </section>
  );
}
