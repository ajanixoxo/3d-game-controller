import type { CamState } from "./store";

export interface Hotspot {
  id: string;
  /** Node name in controller.glb that glows while focused. */
  part: string;
  title: string;
  body: string;
  cam: CamState;
}

export const HOTSPOTS: Hotspot[] = [
  {
    id: "touchpad",
    part: "touchpad",
    title: "Touch pad",
    body: "A clickable multi-touch surface set into the face of the controller, framed by the light bar. Swipe, draw and press — it is a button and a canvas at once.",
    cam: { px: 0, py: 2.6, pz: 7.2, tx: 0, ty: 0.55, tz: 0, fov: 30 },
  },
  {
    id: "triggers",
    part: "trigger_right",
    title: "Adaptive triggers",
    body: "L2 and R2 sweep through a long analog travel. On PS5 their internal gear motors push back against your finger — tension the browser can only hint at.",
    cam: { px: 2.6, py: 4.4, pz: -7.6, tx: 0.7, ty: 0.7, tz: -0.4, fov: 30 },
  },
  {
    id: "sticks",
    part: "stick_left",
    title: "Precision sticks",
    body: "Concave caps with a textured outer ring. Each stick pivots at its base and clicks straight down as L3 and R3.",
    cam: { px: -2.6, py: 2.2, pz: 7.0, tx: -1.0, ty: -0.2, tz: 0.2, fov: 30 },
  },
  {
    id: "lightbar",
    part: "lightbar",
    title: "Light bar",
    body: "A thin band of light wrapping the touch pad. It signals player number, charge and in-game state — here it answers your interactions.",
    cam: { px: 0, py: 1.6, pz: 7.4, tx: 0, ty: 0.4, tz: 0.3, fov: 30 },
  },
  {
    id: "create",
    part: "btn_create",
    title: "Create button",
    body: "The Share button, rethought. One press captures screenshots and clips; a long press starts a broadcast.",
    cam: { px: -2.4, py: 2.8, pz: 7.4, tx: -1.4, ty: 0.45, tz: 0.1, fov: 30 },
  },
];
