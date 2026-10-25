// Shared mutable state bridging GSAP (writer), DOM panels (writer for user
// input) and the three.js frame loop (reader). Nothing here triggers React
// renders; per-frame consumers read it inside useFrame.

import type { ControlId } from "./parts";

export interface CamState {
  px: number; py: number; pz: number;
  tx: number; ty: number; tz: number;
  fov: number;
}

export const DEFAULT_CAM: CamState = { px: 0, py: 3.4, pz: 12.5, tx: 0, ty: -0.2, tz: 0, fov: 34 };

export const LIGHTBAR_REST = 2.4;

export const store = {
  cam: { ...DEFAULT_CAM } as CamState,
  /** Scroll-choreographed model yaw (radians). */
  baseYaw: -0.35,
  /** Scroll-choreographed model pitch; -0.3 upright display tilt, ~-1.45 lying flat. */
  basePitch: -0.3,
  /** User drag-to-rotate, damped back to 0 outside explore sections. */
  userYaw: 0,
  userPitch: 0,
  /** Whether drag-to-rotate is currently invited (explore/connect sections). */
  exploreEnabled: false,
  /** 0..1 exploded-view progress. */
  explode: 0,
  /** Hotspot part name receiving a glow pulse, or null. */
  focus: null as string | null,
  /** Active feature chapter (0..4) in the "Feel the difference" section, -1 outside it. */
  feature: -1,
  /** DOM-driven control presses (feature demos), 0..1 per control. */
  uiControls: {} as Partial<Record<ControlId, number>>,
  /** Visual rumble until this performance.now() timestamp. */
  shakeUntil: 0,
  /** Light bar emissive boost 0..1 and mode. */
  lightbar: LIGHTBAR_REST,
  lightbarColor: "#2f63ff",
  /** Pointer-driven tilt for the motion-sensing demo, -1..1. */
  motionTilt: { x: 0, y: 0, active: false },
  reduced: false,
  /** Debug (?shot=): camera snaps instead of damping. */
  snap: false,
};

export type Store = typeof store;
