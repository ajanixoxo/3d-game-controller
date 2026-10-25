"use client";

import { useRef, useState } from "react";
import { gsap } from "gsap";
import { AnimatePresence, motion } from "motion/react";
import { Activity, Compass, Mic, MousePointer2, Zap } from "lucide-react";
import { hapticSupport, playRumble, type HapticChannel } from "@/lib/haptics";
import { playClick, playHapticThud, playTriggerRatchet } from "@/lib/sounds";
import { LIGHTBAR_REST, store } from "@/lib/store";

/* ---------- Per-feature interactive demos ---------- */

function TriggerDemo() {
  const bar = useRef<HTMLDivElement>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  const lastStep = useRef(0);

  const animate = (to: number, duration: number, ease: string) => {
    tween.current?.kill();
    tween.current = gsap.to(store.uiControls, {
      rt: to,
      duration,
      ease,
      onUpdate: () => {
        const rt = store.uiControls.rt ?? 0;
        if (bar.current) bar.current.style.width = `${Math.round(rt * 100)}%`;
        // Gear-tension ratchet as the trigger sweeps.
        const step = Math.round(rt * 8);
        if (step !== lastStep.current) {
          lastStep.current = step;
          playTriggerRatchet(step);
        }
      },
    });
  };
  const press = () => animate(1, 1.3, "power2.in");
  const release = () => animate(0, 0.5, "power3.out");

  return (
    <div>
      <button
        type="button"
        className="demo-btn"
        onPointerDown={press}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
        onKeyDown={(e) => { if (!e.repeat && (e.key === " " || e.key === "Enter")) press(); }}
        onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") release(); }}
      >
        Hold to pull R2
      </button>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10" aria-hidden>
        <div ref={bar} className="h-full w-0 rounded-full bg-accent transition-none" />
      </div>
      <p className="demo-note">
        Watch the trigger sweep on the model. On PS5, motors inside each trigger
        push back with game-tuned resistance — that force can&apos;t be felt
        through a browser.
      </p>
    </div>
  );
}

function HapticsDemo() {
  const [result, setResult] = useState<HapticChannel | null>(null);
  const [support, setSupport] = useState<{ controllerRumble: boolean; deviceVibrate: boolean } | null>(null);

  const fire = () => {
    playHapticThud(55, 0.35, 0.3);
    setSupport(hapticSupport());
    setResult(playRumble());
  };

  const MESSAGES: Record<HapticChannel, string> = {
    controller: "Rumble sent to your connected controller.",
    device: "A vibration request was sent to this device — phones buzz; most desktops have no motor, so watch the model.",
    visual: "No vibration hardware is reachable from this browser — the model shakes instead.",
  };

  return (
    <div>
      <button type="button" className="demo-btn" onClick={fire}>
        Test the rumble
      </button>
      {result && (
        <p className="mt-3 text-xs font-semibold text-accent" aria-live="polite">{MESSAGES[result]}</p>
      )}
      {support && (
        <p className="mt-1 font-mono text-[11px] text-muted">
          controller rumble: {support.controllerRumble ? "available" : "not available"} · device vibration:{" "}
          {support.deviceVibrate ? "available" : "not available"}
        </p>
      )}
      <p className="demo-note">
        The DualSense replaces rumble motors with voice-coil actuators that can
        render texture — rain, gravel, a bowstring. Browsers only expose simple
        rumble, so treat this as a sketch of the real thing.
      </p>
    </div>
  );
}

function MicDemo() {
  const [muted, setMuted] = useState(false);

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    playClick(next ? 500 : 800, 0.04);
    store.lightbarColor = next ? "#ff8a3d" : "#2f63ff";
    store.lightbar = next ? 1.8 : LIGHTBAR_REST;
  };

  return (
    <div>
      <button type="button" className="demo-btn" onClick={toggle} aria-pressed={muted}>
        {muted ? "Unmute" : "Mute"} the microphone
      </button>
      <p className="demo-note">
        A dual-microphone array sits in the body, with a dedicated mute button
        beneath the PS logo. The light shift on the model mirrors the mute
        indicator — a visual demo only; this page never accesses any microphone.
      </p>
    </div>
  );
}

function MotionDemo() {
  const pad = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const r = pad.current?.getBoundingClientRect();
    if (!r) return;
    store.motionTilt.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    store.motionTilt.y = ((e.clientY - r.top) / r.height) * 2 - 1;
    store.motionTilt.active = true;
  };
  const onLeave = () => {
    store.motionTilt.active = false;
  };

  return (
    <div>
      <div
        ref={pad}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onPointerCancel={onLeave}
        className="flex h-28 w-full cursor-crosshair items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.03] text-xs text-muted"
      >
        Move your pointer here — the controller follows
      </div>
      <p className="demo-note">
        Inside: a gyroscope and accelerometer for six-axis motion sensing.
        Browsers can&apos;t read the controller&apos;s own motion sensors, so
        your pointer stands in for the tilt.
      </p>
    </div>
  );
}

function TouchpadDemo() {
  const pad = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const r = pad.current?.getBoundingClientRect();
    if (!r) return;
    const x = (e.clientX - r.left) / r.width;
    if (e.buttons > 0) playClick(1100 + x * 400, 0.01);
    store.uiControls.pad = 0.5;
    store.lightbar = 1.8;
    const hue = 205 + x * 110;
    store.lightbarColor = `hsl(${Math.round(hue)} 90% 62%)`;
  };
  const onLeave = () => {
    store.uiControls.pad = 0;
    store.lightbar = LIGHTBAR_REST;
    store.lightbarColor = "#2f63ff";
  };

  return (
    <div>
      <div
        ref={pad}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onPointerCancel={onLeave}
        className="h-20 w-full cursor-ew-resize rounded-xl border border-white/15 bg-gradient-to-r from-accent/10 via-white/[0.04] to-accent/10"
        aria-label="Slide across this pad to drive the light bar"
      />
      <p className="demo-note">
        Slide across the pad — the light bar around the model&apos;s touch pad
        tracks you. The real surface reads two touches at once and clicks as a
        button.
      </p>
    </div>
  );
}

/* ---------- Section ---------- */

export const FEATURES = [
  {
    id: "triggers",
    icon: Zap,
    title: "Adaptive triggers",
    body: "L2 and R2 hide gear-driven motors that vary their resistance in real time — drawing a bow feels different from squeezing a brake.",
    Demo: TriggerDemo,
  },
  {
    id: "haptics",
    icon: Activity,
    title: "Haptic feedback",
    body: "Voice-coil actuators in each grip replace rumble with texture — fine enough to render footsteps on sand or the patter of rain.",
    Demo: HapticsDemo,
  },
  {
    id: "mic",
    icon: Mic,
    title: "Built-in microphone",
    body: "Chat without a headset through the internal mic array, and cut it instantly with the dedicated mute button.",
    Demo: MicDemo,
  },
  {
    id: "motion",
    icon: Compass,
    title: "Motion sensing",
    body: "A six-axis sensor pair — gyroscope and accelerometer — turns the whole controller into a pointer, a steering wheel, a paintbrush.",
    Demo: MotionDemo,
  },
  {
    id: "touchpad",
    icon: MousePointer2,
    title: "Touch pad",
    body: "A clickable two-point touch surface, wrapped by the light bar, sitting at the heart of the controller's face.",
    Demo: TouchpadDemo,
  },
] as const;

interface FeaturesProps {
  feature: number;
  reduced: boolean;
}

export function Features({ feature, reduced }: FeaturesProps) {
  if (reduced) {
    // No pinning with reduced motion: plain stacked chapters.
    return (
      <section data-s-features className="relative space-y-20 py-24">
        {FEATURES.map((f) => (
          <div key={f.id} className="copy-block pointer-events-auto mx-auto w-full max-w-md px-6">
            <f.icon className="h-5 w-5 text-accent" aria-hidden />
            <h3 className="mt-3 text-2xl font-extrabold tracking-tight">{f.title}</h3>
            <p className="mt-3 max-w-sm text-base leading-relaxed text-muted">{f.body}</p>
            <div className="mt-5 max-w-sm">
              <f.Demo />
            </div>
          </div>
        ))}
      </section>
    );
  }

  const current = FEATURES[Math.max(0, Math.min(feature, FEATURES.length - 1))];

  return (
    <section data-s-features className="relative flex h-screen items-end sm:items-center">
      <div className="stage-fade" aria-hidden />
      <div className="copy-block pointer-events-auto w-full max-w-md px-6 pb-10 sm:ml-[7vw] sm:px-0 sm:pb-0">
        <p className="eyebrow">
          Feel the difference · {feature + 1} / {FEATURES.length}
        </p>
        <div className="mt-3 min-h-[20rem]">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <current.icon className="h-6 w-6 text-accent" aria-hidden />
              <h3 className="mt-3 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">{current.title}</h3>
              <p className="mt-4 max-w-sm text-pretty text-base leading-relaxed text-muted">{current.body}</p>
              <div className="mt-5 max-w-sm">
                <current.Demo />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-5 flex max-w-sm gap-1.5" aria-hidden>
          {FEATURES.map((f, i) => (
            <span
              key={f.id}
              className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${i <= feature ? "bg-accent" : "bg-white/15"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
