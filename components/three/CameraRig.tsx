"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { DEFAULT_CAM, store, type CamState } from "@/lib/store";

/** Aspect the camera beats were framed at (desktop). Narrower viewports widen
    the fov so the controller keeps its desktop horizontal size instead of
    being cropped, pull the sideways target offsets back to center (they exist
    to clear the desktop copy column; mobile copy sits at the bottom), and aim
    lower so the model rides the upper half above the copy. */
const REF_ASPECT = 1.6;

/** Phone copy block is a roughly constant ~420px tall at the viewport bottom,
    so clearing it is a screen-space problem: a short visible viewport (mobile
    browser bars shown) leaves far less room above the copy than the full one
    the beats were tuned on (844px). Shrink the model in step with that free
    band and aim it into the band's middle. */
const COPY_PX = 420;
const REF_H = 844;
function frameForAspect(
  c: CamState,
  size: { width: number; height: number },
  liftK: number,
): { tx: number; ty: number; px: number; py: number; pz: number } {
  const aspect = size.width / size.height;
  if (aspect >= REF_ASPECT) return { tx: c.tx, ty: c.ty, px: c.px, py: c.py, pz: c.pz };
  const narrow = (REF_ASPECT - aspect) / REF_ASPECT;
  const phone = size.width < 640; // below sm the copy is bottom-anchored (matches the CSS)
  const free = Math.max(size.height - COPY_PX, size.height * 0.25);
  const fit = phone ? Math.max(1, (size.height / free) / (REF_H / (REF_H - COPY_PX))) : 1;
  // Keep the desktop horizontal framing, back off ~15% more so the model
  // clears the bottom-anchored copy, then shrink by how much shorter the
  // free band is than at the reference height — all by DOLLYING the camera
  // away from the beat's aim point, never by widening the fov: a wide lens
  // stretches the body toward the screen edges.
  const s = (REF_ASPECT / aspect) * (1 + 0.18 * narrow) * fit;
  const dx = c.px - c.tx;
  const dy = c.py - c.ty;
  const dz = c.pz - c.tz;
  let lift = narrow * 2.0; // tablet portrait: a gentle aim-down is enough
  if (phone) {
    const dist = Math.hypot(dx, dy, dz) * s;
    const worldH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(c.fov / 2));
    lift = liftK * (COPY_PX / 2 / size.height) * worldH;
  }
  return {
    tx: c.tx * (1 - narrow),
    ty: c.ty - lift,
    px: c.tx + dx * s,
    py: c.ty + dy * s,
    pz: c.tz + dz * s,
  };
}

export function CameraRig() {
  const target = useRef(new THREE.Vector3(DEFAULT_CAM.tx, DEFAULT_CAM.ty, DEFAULT_CAM.tz));

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const cam = state.camera as THREE.PerspectiveCamera;
    const c = store.cam;
    // The look-target shift lands the model higher on screen than the pure
    // at-target-distance math predicts (the body sits nearer the camera than
    // the aim point), so damp the converted lift; the feature close-ups are
    // framed low by design and need more. Both tuned against screenshots.
    const f = frameForAspect(c, state.size, store.feature >= 0 ? 1.15 : 0.7);
    if (store.snap) {
      cam.position.set(f.px, f.py, f.pz);
      target.current.set(f.tx, f.ty, c.tz);
      cam.lookAt(target.current);
      cam.fov = c.fov;
      cam.updateProjectionMatrix();
      return;
    }
    const l = 3.4;
    // Gentle pointer parallax on top of the choreographed position.
    const parX = store.reduced ? 0 : state.pointer.x * 0.35;
    const parY = store.reduced ? 0 : state.pointer.y * 0.2;
    cam.position.set(
      THREE.MathUtils.damp(cam.position.x, f.px + parX, l, dt),
      THREE.MathUtils.damp(cam.position.y, f.py + parY, l, dt),
      THREE.MathUtils.damp(cam.position.z, f.pz, l, dt),
    );
    const t = target.current;
    t.set(
      THREE.MathUtils.damp(t.x, f.tx, l, dt),
      THREE.MathUtils.damp(t.y, f.ty, l, dt),
      THREE.MathUtils.damp(t.z, c.tz, l, dt),
    );
    cam.lookAt(t);
    const fov = THREE.MathUtils.damp(cam.fov, c.fov, l, dt);
    if (Math.abs(fov - cam.fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
