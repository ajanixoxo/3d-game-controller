"use client";

import { ChevronDown } from "lucide-react";

export function Hero() {
  return (
    <section data-s-hero className="relative h-[160vh]">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-end px-6 pb-[12vh] text-center">
        <div className="stage-fade" aria-hidden />
        <p data-hero-line className="mb-4 font-mono text-xs uppercase tracking-[0.35em] text-accent">
          DualSense wireless controller
        </p>
        <h1
          data-hero-line
          className="max-w-4xl text-balance text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl"
        >
          Feel everything.
        </h1>
        <p data-hero-line className="mt-5 max-w-md text-pretty text-base text-muted sm:text-lg">
          An interactive study of the PS5 controller — turn it over, take it
          apart, and try its senses in your browser.
        </p>
        <div data-hero-line className="mt-10 flex flex-col items-center gap-2 text-muted" data-scroll-cue>
          <span className="font-mono text-[11px] uppercase tracking-[0.3em]">Scroll to explore</span>
          <ChevronDown className="h-4 w-4 animate-bounce motion-reduce:animate-none" aria-hidden />
        </div>
      </div>
    </section>
  );
}
