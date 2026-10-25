// Gamepad API polling. One poll per animation frame (the 3D loop calls it);
// DOM panels read the same snapshot on their own slower timers.

import { GP_INDEX, STICK_DEADZONE, type ControlId } from "./parts";

export type GamepadStatus = "none" | "connected" | "unsupported" | "blocked";

export interface PadSnapshot {
  status: GamepadStatus;
  id: string;
  /** 0..1 per standard-mapping control. */
  buttons: Partial<Record<ControlId, number>>;
  sticks: { lx: number; ly: number; rx: number; ry: number };
}

const snapshot: PadSnapshot = {
  status: "none",
  id: "",
  buttons: {},
  sticks: { lx: 0, ly: 0, rx: 0, ry: 0 },
};

let pad: Gamepad | null = null;
let lastPoll = 0;

export function pollGamepad(): PadSnapshot {
  const now = performance.now();
  if (now - lastPoll < 8) return snapshot; // already polled this frame
  lastPoll = now;

  pad = null;
  if (typeof navigator === "undefined" || !navigator.getGamepads) {
    snapshot.status = "unsupported";
    return snapshot;
  }
  let pads: (Gamepad | null)[];
  try {
    pads = navigator.getGamepads();
  } catch {
    snapshot.status = "blocked";
    return snapshot;
  }
  for (const p of pads || []) {
    if (p && p.connected) { pad = p; break; }
  }
  if (!pad) {
    snapshot.status = "none";
    snapshot.id = "";
    snapshot.buttons = {};
    snapshot.sticks = { lx: 0, ly: 0, rx: 0, ry: 0 };
    return snapshot;
  }
  snapshot.status = "connected";
  snapshot.id = pad.id || "Unnamed controller";
  for (const id of Object.keys(GP_INDEX) as ControlId[]) {
    const b = pad.buttons[GP_INDEX[id]];
    snapshot.buttons[id] = b ? Math.max(b.value || 0, b.pressed ? 1 : 0) : 0;
  }
  const dz = (v: number) => (Math.abs(v) < STICK_DEADZONE ? 0 : v);
  snapshot.sticks.lx = dz(pad.axes[0] || 0);
  snapshot.sticks.ly = dz(pad.axes[1] || 0);
  snapshot.sticks.rx = dz(pad.axes[2] || 0);
  snapshot.sticks.ry = dz(pad.axes[3] || 0);
  return snapshot;
}

export function currentPad(): Gamepad | null {
  return pad;
}
