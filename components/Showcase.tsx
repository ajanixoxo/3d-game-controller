"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode, useCallback, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { playClick, playTriggerRatchet, playWhoosh } from "@/lib/sounds";
import { DEFAULT_CAM, LIGHTBAR_REST, store, type CamState } from "@/lib/store";
import { HOTSPOTS } from "@/lib/hotspots";
import { Navbar } from "./Navbar";
import { Hero } from "./sections/Hero";
import { Explore } from "./sections/Explore";
import { Inside } from "./sections/Inside";
import { Features, FEATURES } from "./sections/Features";
import { Connect } from "./sections/Connect";
import { Outro } from "./sections/Outro";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const CanvasLayer = dynamic(() => import("./three/CanvasLayer"), { ssr: false });

/** Exploded-view camera beats, shared by the scroll timeline and ?shot= debug. */
const INSIDE_CAM_A: CamState = { px: -6.5, py: 8.5, pz: 10.5, tx: -1.4, ty: 1.7, tz: 0, fov: 38 };
const INSIDE_CAM_B: CamState = { px: 5.5, py: 9.0, pz: 10.5, tx: -1.2, ty: 1.8, tz: 0, fov: 38 };
/** While exploded the controller lies flat (face up) with a slight yaw, layers rising vertically. */
const INSIDE_YAW = -0.45;
const INSIDE_PITCH = -1.45;

/** Camera per feature chapter (triggers, haptics, mic, motion, touchpad). */
/* Targets sit left of center (negative tx; positive for the back view where
   screen-x flips) so the model frames into the right half, clear of the copy. */
const FEATURE_CAMS: CamState[] = [
  { px: 2.2, py: 5.0, pz: -11.5, tx: 2.6, ty: 0.7, tz: -0.4, fov: 33 },
  { px: 5.6, py: 1.6, pz: 8.4, tx: -1.2, ty: 0, tz: 0, fov: 33 },
  { px: 0, py: 2.4, pz: 8.8, tx: -2.0, ty: 0.3, tz: 0, fov: 31 },
  { px: -5.2, py: 3.2, pz: 9.2, tx: -1.2, ty: 0, tz: 0, fov: 34 },
  { px: 0, py: 3.6, pz: 8.4, tx: -2.0, ty: 0.5, tz: 0, fov: 30 },
];
const EXPLORE_CAM: CamState = { px: 0, py: 1.1, pz: 10.6, tx: -1.5, ty: 0, tz: 0, fov: 32 };
const CONNECT_CAM: CamState = { px: 0, py: 1.6, pz: 10.8, tx: -1.5, ty: 0, tz: 0, fov: 33 };

class CanvasBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function Showcase() {
  const root = useRef<HTMLDivElement>(null);
  const introTl = useRef<gsap.core.Timeline | null>(null);
  const [ready, setReady] = useState(false);
  const [loaderGone, setLoaderGone] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [hotspotsVisible, setHotspotsVisible] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [insidePhase, setInsidePhase] = useState(0);
  const [feature, setFeature] = useState(0);

  const onReady = useCallback(() => {
    setReady(true);
    if (store.snap) {
      setLoaderGone(true);
      return;
    }
    introTl.current?.play();
    gsap.to("[data-loader]", {
      autoAlpha: 0,
      duration: 0.6,
      delay: 0.15,
      onComplete: () => setLoaderGone(true),
    });
  }, []);

  const onWebglError = useCallback(() => {
    setWebglFailed(true);
    setLoaderGone(true);
    // The intro timeline's .from() tweens hid the hero copy on creation
    // (immediateRender) and onReady will never play them — jump to the end.
    introTl.current?.progress(1).kill();
  }, []);

  const focusHotspot = useCallback((id: string) => {
    const h = HOTSPOTS.find((x) => x.id === id);
    if (!h) return;
    setActiveHotspot(id);
    store.focus = h.part;
    playClick(1050, 0.04);
    playWhoosh();
    gsap.to(store.cam, { ...h.cam, duration: 1.1, ease: "power3.inOut", overwrite: "auto" });
    gsap.to(store, { userYaw: 0, userPitch: 0, duration: 0.8, ease: "power2.out" });
  }, []);

  useGSAP(
    () => {
      // Fresh state on (re)mount.
      Object.assign(store.cam, DEFAULT_CAM);
      store.baseYaw = -0.35;
      store.explode = 0;
      store.focus = null;
      store.feature = -1;

      // Debug framing hook: /?shot=inside|insideB|explore|outro|feature0..4
      // jumps straight to that scene state (used for headless visual checks).
      const shot = new URLSearchParams(window.location.search).get("shot");
      if (shot) {
        root.current?.setAttribute("data-shot", shot);
        store.reduced = true;
        store.snap = true;
        if (shot === "inside" || shot === "insideB") {
          store.explode = 1;
          store.baseYaw = INSIDE_YAW;
          store.basePitch = INSIDE_PITCH;
          Object.assign(store.cam, shot === "inside" ? INSIDE_CAM_A : INSIDE_CAM_B);
        } else if (shot.startsWith("feature")) {
          const i = Math.max(0, Math.min(FEATURE_CAMS.length - 1, Number(shot.slice(7)) || 0));
          store.baseYaw = 0;
          Object.assign(store.cam, FEATURE_CAMS[i]);
        } else if (shot === "explore") {
          store.baseYaw = 0;
          Object.assign(store.cam, EXPLORE_CAM);
        } else if (shot === "outro") {
          store.baseYaw = 0.45;
          Object.assign(store.cam, { px: 0, py: 4.6, pz: 15.5, tx: 0, ty: -0.2, tz: 0, fov: 30 });
        }
        return;
      }

      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      store.reduced = prefersReduced;
      setReduced(prefersReduced);

      // Phones: copy and model share the column, so a section's content fades
      // away before it can travel across the model (desktop's side-by-side
      // layout never collides and keeps everything visible).
      const isMobile = window.matchMedia("(max-width: 639px)").matches;
      const fadeCopy = (sel: string, out: boolean) => {
        if (isMobile) gsap.to(`${sel} > div`, { autoAlpha: out ? 0 : 1, duration: 0.3, overwrite: "auto" });
      };

      if (prefersReduced) {
        // Static, non-choreographed experience: default framing, rotation
        // always available, hotspots always on, explode via button.
        store.baseYaw = -0.2;
        store.exploreEnabled = true;
        setHotspotsVisible(true);
        return;
      }

      // Cinematic reveal (plays once the model is ready).
      introTl.current = gsap
        .timeline({ paused: true })
        .from(store.cam, { pz: 20, py: 7.5, fov: 42, duration: 1.8, ease: "power3.out" }, 0)
        .from(store, { baseYaw: -2.4, duration: 1.8, ease: "power3.out" }, 0)
        .from("[data-hero-line]", { yPercent: 40, opacity: 0, stagger: 0.12, duration: 0.9, ease: "power3.out" }, 0.45);

      // Hero → front view.
      gsap
        .timeline({
          scrollTrigger: { trigger: "[data-s-hero]", start: "top top", end: "bottom top", scrub: 1 },
        })
        .to(store, { baseYaw: 0, ease: "none" }, 0)
        .to(store.cam, { px: 0, py: 1.1, pz: 10.6, tx: -1.5, ty: 0, fov: 32, ease: "none" }, 0)
        .to("[data-scroll-cue]", { opacity: 0, duration: 0.2 }, 0);

      // Explore: free rotation + hotspots while in range.
      ScrollTrigger.create({
        id: "explore-range",
        trigger: "[data-s-explore]",
        start: "top 65%",
        end: "bottom 35%",
        onToggle: (self) => {
          store.exploreEnabled = self.isActive;
          setHotspotsVisible(self.isActive);
          if (self.isActive) {
            playWhoosh();
            gsap.to(store.cam, { ...EXPLORE_CAM, duration: 1, ease: "power2.inOut", overwrite: "auto" });
          } else {
            store.focus = null;
            setActiveHotspot(null);
          }
        },
      });

      // Inside: pinned exploded view, scroll-scrubbed apart and back together.
      // The scrub ticks like the adaptive-trigger gears as parts separate.
      let lastExplodeStep = 0;
      gsap
        .timeline({
          scrollTrigger: {
            trigger: "[data-s-inside]",
            start: "top top",
            end: "+=2400",
            scrub: 1,
            pin: true,
            onLeave: () => fadeCopy("[data-s-inside]", true),
            onEnterBack: () => fadeCopy("[data-s-inside]", false),
            onUpdate: (self) => {
              setInsidePhase(self.progress < 0.38 ? 0 : self.progress < 0.72 ? 1 : 2);
              const step = Math.round(store.explode * 10);
              if (step !== lastExplodeStep) {
                lastExplodeStep = step;
                playTriggerRatchet(step);
              }
            },
          },
        })
        .to(store, { explode: 1, baseYaw: INSIDE_YAW, basePitch: INSIDE_PITCH, duration: 0.42, ease: "power2.inOut" }, 0)
        .to(store.cam, { ...INSIDE_CAM_A, ease: "none" }, 0)
        .to(store.cam, { ...INSIDE_CAM_B, ease: "none" }, 0.42)
        .to(store, { explode: 0, baseYaw: 0, basePitch: -0.3, duration: 0.28, ease: "power2.inOut" }, 0.72)
        .to(store.cam, { px: 0, py: 1.4, pz: 10.5, tx: 0, ty: 0, tz: 0, fov: 32, ease: "none" }, 0.72);

      // Features: pinned chapters with snapping.
      ScrollTrigger.create({
        trigger: "[data-s-features]",
        start: "top top",
        end: "+=3000",
        pin: true,
        snap: { snapTo: 1 / (FEATURES.length - 1), duration: 0.4, ease: "power1.inOut" },
        onLeave: () => fadeCopy("[data-s-features]", true),
        onEnterBack: () => fadeCopy("[data-s-features]", false),
        onUpdate: (self) => {
          const i = Math.max(0, Math.min(FEATURES.length - 1, Math.round(self.progress * (FEATURES.length - 1))));
          if (store.feature !== i) {
            store.feature = i;
            setFeature(i);
            playWhoosh();
            gsap.to(store.cam, { ...FEATURE_CAMS[i], duration: 0.9, ease: "power2.inOut", overwrite: "auto" });
          }
        },
        onToggle: (self) => {
          if (!self.isActive) {
            store.feature = -1;
            store.motionTilt.active = false;
            store.uiControls.rt = 0;
            store.uiControls.pad = 0;
            store.lightbar = LIGHTBAR_REST;
            store.lightbarColor = "#2f63ff";
          }
        },
      });

      // Connect: free rotation again, front framing.
      ScrollTrigger.create({
        trigger: "[data-s-connect]",
        start: "top 70%",
        end: "bottom 30%",
        onToggle: (self) => {
          if (self.isActive) {
            store.exploreEnabled = true;
            playWhoosh();
            gsap.to(store.cam, { ...CONNECT_CAM, duration: 1, ease: "power2.inOut", overwrite: "auto" });
          } else if (!ScrollTrigger.getById("explore-range")?.isActive) {
            store.exploreEnabled = false;
          }
        },
      });

      // Outro: slow pull-back, final product shot.
      gsap
        .timeline({
          scrollTrigger: { trigger: "[data-s-outro]", start: "top bottom", end: "bottom bottom", scrub: 1 },
        })
        .to(store.cam, { px: 0, py: 4.6, pz: 15.5, tx: 0, ty: -0.2, tz: 0, fov: 30, ease: "none" }, 0)
        .to(store, { baseYaw: 0.45, ease: "none" }, 0);

      // The unpinned sections scroll away normally, so their fade scrubs with
      // the section's own bottom edge. (The pinned sections fade via their
      // pin triggers' onLeave above — offset start/end math is unreliable
      // across pin spacers.)
      if (isMobile) {
        for (const trigger of ["[data-s-hero]", "[data-s-explore]", "[data-s-connect]"]) {
          gsap.to(`${trigger} > div`, {
            autoAlpha: 0,
            ease: "none",
            scrollTrigger: { trigger, start: "bottom 92%", end: "bottom 65%", scrub: true },
          });
        }
      }
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative">
      {/* The stage is pure CSS on <body> (spotlight + vignette + grain);
          the transparent canvas sits straight over it. */}
      <Navbar />

      {/* One persistent 3D layer for the whole story. */}
      {!webglFailed && (
        <div className="fixed inset-0 z-0">
          <CanvasBoundary onError={onWebglError}>
            <CanvasLayer
              hotspotsVisible={hotspotsVisible}
              activeHotspot={activeHotspot}
              onHotspot={focusHotspot}
              onReady={onReady}
            />
          </CanvasBoundary>
        </div>
      )}

      {/* The scrolling story. Sections pass pointer events through to the 3D
          layer except on their own interactive panels. */}
      <main className="pointer-events-none relative z-10">
        <Hero />
        <Explore activeHotspot={activeHotspot} onSelect={focusHotspot} />
        <Inside phase={insidePhase} reduced={reduced} />
        <Features feature={feature} reduced={reduced} />
        <Connect />
        <Outro />
      </main>

      {!loaderGone && !webglFailed && (
        <div data-loader className="fixed inset-0 z-50 grid place-items-center bg-[#080808]">
          <div className="flex flex-col items-center gap-4">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-accent motion-reduce:animate-pulse"
              aria-hidden
            />
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted">Preparing the controller</p>
          </div>
        </div>
      )}

      {webglFailed && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0a0e16] p-3 text-center text-xs text-muted">
          The interactive 3D experience couldn&apos;t start in this browser — the
          story below still works. Try a recent Chrome, Edge, Firefox or Safari.
        </div>
      )}
    </div>
  );
}
