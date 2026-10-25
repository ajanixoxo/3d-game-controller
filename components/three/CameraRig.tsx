"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { DEFAULT_CAM, store } from "@/lib/store";

export function CameraRig() {
  const target = useRef(new THREE.Vector3(DEFAULT_CAM.tx, DEFAULT_CAM.ty, DEFAULT_CAM.tz));

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const cam = state.camera as THREE.PerspectiveCamera;
    const c = store.cam;
    if (store.snap) {
      cam.position.set(c.px, c.py, c.pz);
      target.current.set(c.tx, c.ty, c.tz);
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
      THREE.MathUtils.damp(cam.position.x, c.px + parX, l, dt),
      THREE.MathUtils.damp(cam.position.y, c.py + parY, l, dt),
      THREE.MathUtils.damp(cam.position.z, c.pz, l, dt),
    );
    const t = target.current;
    t.set(
      THREE.MathUtils.damp(t.x, c.tx, l, dt),
      THREE.MathUtils.damp(t.y, c.ty, l, dt),
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
