"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { playClick, setSoundEnabled, unlockAudio } from "@/lib/sounds";

const LINKS = [
  { label: "Overview", target: "[data-s-hero]" },
  { label: "Explore", target: "[data-s-explore]" },
  { label: "Inside", target: "[data-s-inside]" },
  { label: "Features", target: "[data-s-features]" },
  { label: "Connect", target: "[data-s-connect]" },
];

/* Top navigation + the sound toggle. The sounds themselves fire from the
   story beats and controls (camera whooshes, ratchets, clicks, thuds);
   opt-in via the button, which also satisfies the browsers' user-gesture
   autoplay rule — nothing plays until enabled. */
export function Navbar() {
  const [sound, setSound] = useState(true);

  // Sound is on by default, but the AudioContext can only start from a real
  // user gesture — unlock it on the first one.
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
  };

  const go = (sel: string) => {
    playClick();
    document.querySelector(sel)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-4 sm:px-10">
      <span className="font-mono text-xs font-semibold uppercase tracking-[0.3em]">DualSense</span>
      <nav className="hidden items-center gap-7 sm:flex" aria-label="Sections">
        {LINKS.map((l) => (
          <button
            key={l.label}
            type="button"
            onClick={() => go(l.target)}
            className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted transition-colors hover:text-ink"
          >
            {l.label}
          </button>
        ))}
      </nav>
      <button
        type="button"
        onClick={toggleSound}
        aria-pressed={sound}
        className="flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted transition-colors hover:border-white/40 hover:text-ink"
      >
        {sound ? <Volume2 className="h-3.5 w-3.5" aria-hidden /> : <VolumeX className="h-3.5 w-3.5" aria-hidden />}
        <span className="hidden sm:inline">{sound ? "Sound on" : "Sound off"}</span>
      </button>
    </header>
  );
}
