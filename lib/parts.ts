// Part behavior for the named nodes inside controller.glb.
// Movement constants come from the reference viewer shipped with the model.

export const CONTROL_IDS = [
  "north", "east", "south", "west",
  "up", "down", "left", "right",
  "lb", "rb", "lt", "rt",
  "create", "options", "home", "pad",
  "l3", "r3",
] as const;
export type ControlId = (typeof CONTROL_IDS)[number];

export type PartKind = "press" | "trigger" | "stick";

export interface PartConfig {
  kind: PartKind;
  /** Local-space press direction. */
  axis?: readonly [number, number, number];
  /** Press travel, in raw model units. */
  depth?: number;
  /** Stick-click control id. */
  press?: ControlId;
}

export const TRIGGER_SWING = 0.32;
export const STICK_TILT = 0.36;
export const STICK_DEADZONE = 0.12;

export const PARTS: Record<string, PartConfig> = {
  btn_north: { kind: "press", axis: [0, 0, -1], depth: 0.022 },
  btn_east: { kind: "press", axis: [0, 0, -1], depth: 0.022 },
  btn_south: { kind: "press", axis: [0, 0, -1], depth: 0.022 },
  btn_west: { kind: "press", axis: [0, 0, -1], depth: 0.022 },
  dpad_up: { kind: "press", axis: [0, 0, -1], depth: 0.016 },
  dpad_down: { kind: "press", axis: [0, 0, -1], depth: 0.016 },
  dpad_left: { kind: "press", axis: [0, 0, -1], depth: 0.016 },
  dpad_right: { kind: "press", axis: [0, 0, -1], depth: 0.016 },
  btn_create: { kind: "press", axis: [0, 0, -1], depth: 0.016 },
  btn_options: { kind: "press", axis: [0, 0, -1], depth: 0.016 },
  btn_home: { kind: "press", axis: [0, 0, -1], depth: 0.016 },
  touchpad: { kind: "press", axis: [0, 0, -1], depth: 0.012 },
  bumper_left: { kind: "press", axis: [0, -1, 0], depth: 0.03 },
  bumper_right: { kind: "press", axis: [0, -1, 0], depth: 0.03 },
  trigger_left: { kind: "trigger" },
  trigger_right: { kind: "trigger" },
  stick_left: { kind: "stick", press: "l3" },
  stick_right: { kind: "stick", press: "r3" },
};

export const CONTROL_TO_PART: Record<ControlId, string> = {
  north: "btn_north", east: "btn_east", south: "btn_south", west: "btn_west",
  up: "dpad_up", down: "dpad_down", left: "dpad_left", right: "dpad_right",
  lb: "bumper_left", rb: "bumper_right", lt: "trigger_left", rt: "trigger_right",
  create: "btn_create", options: "btn_options", home: "btn_home", pad: "touchpad",
  l3: "stick_left", r3: "stick_right",
};

export const PART_TO_CONTROL: Record<string, ControlId> = Object.fromEntries(
  (Object.entries(CONTROL_TO_PART) as [ControlId, string][])
    .filter(([c]) => c !== "l3" && c !== "r3")
    .map(([c, p]) => [p, c]),
) as Record<string, ControlId>;

/** Gamepad API standard-mapping button indices. */
export const GP_INDEX: Record<ControlId, number> = {
  south: 0, east: 1, west: 2, north: 3,
  lb: 4, rb: 5, lt: 6, rt: 7,
  create: 8, options: 9, l3: 10, r3: 11,
  up: 12, down: 13, left: 14, right: 15,
  home: 16, pad: 17,
};

/**
 * Exploded-view offsets, as fractions of the raw model width, in the model's
 * local axes (+Z out of the face, +Y toward the bumpers, +X right).
 * Only real, separately modeled nodes are moved.
 */
export const EXPLODE: Record<string, readonly [number, number, number]> = {
  shell: [0, 0.03, 0.26],
  touchpad: [0, 0.06, 0.44],
  lightbar: [0, 0.04, 0.36],
  btn_north: [0, 0.05, 0.55],
  btn_south: [0, -0.03, 0.55],
  btn_east: [0.05, 0.01, 0.55],
  btn_west: [-0.03, 0.01, 0.55],
  dpad_up: [0, 0.04, 0.5],
  dpad_down: [0, -0.02, 0.5],
  dpad_left: [-0.03, 0.01, 0.5],
  dpad_right: [0.02, 0.01, 0.5],
  btn_create: [-0.02, 0.05, 0.4],
  btn_options: [0.02, 0.05, 0.4],
  btn_home: [0, -0.02, 0.38],
  stick_left: [-0.02, 0, 0.33],
  stick_right: [0.02, 0, 0.33],
  bumper_left: [-0.02, 0.22, -0.05],
  bumper_right: [0.02, 0.22, -0.05],
  trigger_left: [-0.02, 0.3, -0.14],
  trigger_right: [0.02, 0.3, -0.14],
  core: [0, 0, -0.1],
};

/** Fallback offset for `static_*` decorative nodes: drift with the shell. */
export const EXPLODE_STATIC: readonly [number, number, number] = [0, 0.02, 0.2];
