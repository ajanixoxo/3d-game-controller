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

function frameForAspect(c: CamState, aspect: number, lift: number): { fov: number; tx: number; ty: number } {
  if (aspect >= REF_ASPECT) return { fov: c.fov, tx: c.tx, ty: c.ty };
  const narrow = (REF_ASPECT - aspect) / REF_ASPECT;
  // Keep the desktop horizontal framing, then back off ~15% more so the model
  // clears the bottom-anchored copy.
  const t = Math.tan(THREE.MathUtils.degToRad(c.fov / 2)) * (REF_ASPECT / aspect) * (1 + 0.18 * narrow);
  return {
    fov: 2 * THREE.MathUtils.radToDeg(Math.atan(t)),
    tx: c.tx * (1 - narrow),
    ty: c.ty - narrow * lift,
  };
}

export function CameraRig() {
  const target = useRef(new THREE.Vector3(DEFAULT_CAM.tx, DEFAULT_CAM.ty, DEFAULT_CAM.tz));

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const cam = state.camera as THREE.PerspectiveCamera;
    const c = store.cam;
    // Feature chapters are close-ups framed low — they need more lift than the
    // full-body shots to clear the copy on phones.
    const f = frameForAspect(c, cam.aspect, store.feature >= 0 ? 3.2 : 2.0);
    if (store.snap) {
      cam.position.set(c.px, c.py, c.pz);
      target.current.set(f.tx, f.ty, c.tz);
      cam.lookAt(target.current);
      cam.fov = f.fov;
      cam.updateProjectionMatrix();
      return;
    }
    const l = 3.4;
    // Gentle pointer parallax on top of the choreographed position.
    const parX = store.reduced ? 0 : state.pointer.x * 0.35;
    const parY = store.reduced ? 0 : state.pointer.y * 0.2;
    cam.position.set(
      THREE.MathUtils.damp(cam.position.x, c.px + parX, l, dt),
      THREE.MathUtils.damp(cam.position.y, c.py + parY, l, dt),
      THREE.MathUtils.damp(cam.position.z, c.pz, l, dt),
    );
    const t = target.current;
    t.set(
      THREE.MathUtils.damp(t.x, f.tx, l, dt),
      THREE.MathUtils.damp(t.y, f.ty, l, dt),
      THREE.MathUtils.damp(t.z, c.tz, l, dt),
    );
    cam.lookAt(t);
    const fov = THREE.MathUtils.damp(cam.fov, f.fov, l, dt);
    if (Math.abs(fov - cam.fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
