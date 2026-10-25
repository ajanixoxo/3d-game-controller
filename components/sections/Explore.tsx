"use client";

import { HOTSPOTS } from "@/lib/hotspots";

interface ExploreProps {
  activeHotspot: string | null;
  onSelect: (id: string) => void;
}

export function Explore({ activeHotspot, onSelect }: ExploreProps) {
  const active = HOTSPOTS.find((h) => h.id === activeHotspot) ?? null;

  return (
    <section data-s-explore className="relative min-h-[150vh]">
      <div className="sticky top-0 flex h-screen items-end sm:items-center">
        <div className="stage-fade" aria-hidden />
        <div className="copy-block pointer-events-auto w-full max-w-md px-6 pb-10 sm:ml-[7vw] sm:px-0 sm:pb-0">
          <p className="eyebrow">In your hands</p>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            Explore the controller
          </h2>
          <p className="mt-4 max-w-sm text-pretty text-base leading-relaxed text-muted">
            Drag the controller to turn it. Tap its buttons, pull its sticks —
            or pick a feature below.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2" role="list">
            {HOTSPOTS.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => onSelect(h.id)}
                  aria-pressed={activeHotspot === h.id}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    activeHotspot === h.id
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-white/15 text-muted hover:border-white/35 hover:text-ink"
                  }`}
                >
                  {h.title}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-6 min-h-24 max-w-sm border-l-2 border-accent/60 pl-4" aria-live="polite">
            {active ? (
              <>
                <h3 className="text-sm font-bold text-ink">{active.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{active.body}</p>
              </>
            ) : (
              <p className="text-sm leading-relaxed text-muted">
                Select a feature — the camera will take you there.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
