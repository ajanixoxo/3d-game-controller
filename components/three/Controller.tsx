"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import { EffectComposer, SelectiveBloom } from "@react-three/postprocessing";
import {
  EXPLODE, EXPLODE_STATIC, PARTS, PART_TO_CONTROL, STICK_TILT, TRIGGER_SWING,
  type ControlId, type PartConfig,
} from "@/lib/parts";
import { pollGamepad } from "@/lib/gamepad";
import { store } from "@/lib/store";
import { HOTSPOTS } from "@/lib/hotspots";

const MODEL_URL = "/models/controller.glb";
const PRESS_GLOW = new THREE.Color("#4f86ff");

interface PartState {
  name: string;
  node: THREE.Object3D;
  cfg: PartConfig;
  rest: THREE.Vector3;
  restRot: THREE.Euler;
  axis: THREE.Vector3 | null;
  explodeDir: THREE.Vector3;
  mats: THREE.MeshStandardMaterial[];
  anim: number;
  sx: number;
  sy: number;
}

interface ExplodedExtra {
  node: THREE.Object3D;
  rest: THREE.Vector3;
  dir: THREE.Vector3;
}

interface Prepared {
  parts: Record<string, PartState>;
  extras: ExplodedExtra[];
  lightbarMats: THREE.MeshStandardMaterial[];
  lightbarMeshes: THREE.Mesh[];
  scale: number;
  offset: THREE.Vector3;
}

function prepare(scene: THREE.Group): Prepared {
  // prepare() mutates the GLTF scene (clones materials onto meshes), and
  // useGLTF caches that scene. Re-running it (StrictMode double-invoke,
  // remount) would re-clone materials, orphaning the ones the frame loop
  // animates — so compute once per scene and cache the result on it.
  const cached = scene.userData.__prepared as Prepared | undefined;
  if (cached) return cached;

  // precise=true: required for KHR_mesh_quantization (normalized int16 positions),
  // which the fast path of setFromObject measures wrongly.
  const box = new THREE.Box3().setFromObject(scene, true);
  const size = box.getSize(new THREE.Vector3());
  const rawWidth = size.x;
  const scale = 7.4 / rawWidth;
  const offset = box.getCenter(new THREE.Vector3()).multiplyScalar(-1);

  scene.traverse((o) => {
    if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshStandardMaterial) {
      const m = (o.material = o.material.clone());
      m.metalness = 0;
      // Match the reference render: the authored normal maps emboss far too
      // deep at full strength, and the AO bake grays the white shell.
      if (m.normalMap) m.normalScale.set(0.12, 0.12);
      if (m.aoMap) m.aoMapIntensity = 0.55;
      // Neutralize the lavender tint on light plastics — reference is clean white.
      const c = m.color;
      const neutral = Math.abs(c.r - c.g) < 0.1 && Math.abs(c.g - c.b) < 0.12;
      if (neutral && (c.r + c.g + c.b) / 3 > 0.5) c.setScalar(0.93);
    }
  });

  const parts: Record<string, PartState> = {};
  for (const [name, cfg] of Object.entries(PARTS)) {
    const node = scene.getObjectByName(name);
    if (!node) continue;
    const mats: THREE.MeshStandardMaterial[] = [];
    node.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      o.userData.part = name;
      if (name !== "touchpad" && o.material instanceof THREE.MeshStandardMaterial) {
        o.material.emissive = PRESS_GLOW.clone();
        o.material.emissiveIntensity = 0;
        mats.push(o.material);
      }
    });
    const ex = EXPLODE[name];
    parts[name] = {
      name, node, cfg, mats,
      rest: node.position.clone(),
      restRot: node.rotation.clone(),
      axis: cfg.axis ? new THREE.Vector3(...cfg.axis) : null,
      explodeDir: ex ? new THREE.Vector3(...ex).multiplyScalar(rawWidth) : new THREE.Vector3(),
      anim: 0, sx: 0, sy: 0,
    };
  }

  // The authored lightbar strip sits fully inside the touchpad groove, occluded
  // from every angle (the bundled viewer never shows it either). Ease it out so
  // the glow reads like the product render. Runs before extras capture `rest`.
  scene.getObjectByName("lightbar")?.position.add(new THREE.Vector3(0, 0, 0.022 * rawWidth));

  // Shell, core and decorative nodes take part in the exploded view too.
  const extras: ExplodedExtra[] = [];
  const lightbarMats: THREE.MeshStandardMaterial[] = [];
  for (const name of Object.keys(EXPLODE)) {
    if (PARTS[name]) continue;
    const node = scene.getObjectByName(name);
    if (!node) continue;
    extras.push({
      node,
      rest: node.position.clone(),
      dir: new THREE.Vector3(...EXPLODE[name]).multiplyScalar(rawWidth),
    });
  }
  scene.traverse((o) => {
    if (o.name.startsWith("static_")) {
      extras.push({
        node: o,
        rest: o.position.clone(),
        dir: new THREE.Vector3(...EXPLODE_STATIC).multiplyScalar(rawWidth),
      });
    }
  });

  const lightbar = scene.getObjectByName("lightbar");
  const lightbarMeshes: THREE.Mesh[] = [];
  lightbar?.traverse((o) => {
    if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshStandardMaterial) {
      // Dark base so the emissive glow owns the strip's color, like the lit rim
      // in the product render — otherwise white diffuse swamps the blue.
      o.material.color.setScalar(0.06);
      o.material.roughness = 0.6;
      o.material.emissive = new THREE.Color(store.lightbarColor);
      o.material.emissiveIntensity = store.lightbar;
      lightbarMats.push(o.material);
      lightbarMeshes.push(o);
    }
  });

  const prepared: Prepared = { parts, extras, lightbarMats, lightbarMeshes, scale, offset };
  scene.userData.__prepared = prepared;
  return prepared;
}

interface ControllerProps {
  hotspotsVisible: boolean;
  activeHotspot: string | null;
  onHotspot: (id: string) => void;
  onReady: () => void;
}

export function Controller({ hotspotsVisible, activeHotspot, onHotspot, onReady }: ControllerProps) {
  const { scene } = useGLTF(MODEL_URL);
  const { camera } = useThree();
  const prepared = useMemo(() => prepare(scene), [scene]);
  const wrapper = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);

  // Pointer interaction state (refs: none of this re-renders React).
  const pointerControls = useRef(new Set<ControlId>());
  const stickDrag = useRef<{ name: string; x0: number; y0: number; x: number; y: number; moved: boolean; pid: number } | null>(null);
  const rotateDrag = useRef<{ x0: number; y0: number; yaw0: number; pitch0: number; pid: number } | null>(null);
  const pulses = useRef<Partial<Record<ControlId, number>>>({});
  const [markerPos, setMarkerPos] = useState<Record<string, THREE.Vector3>>({});

  useEffect(() => {
    onReady();
    if (store.snap) {
      // Headless diagnostics for ?shot= captures (after a few frames settle).
      const timer = setTimeout(() => {
        const cam = camera as THREE.PerspectiveCamera;
        const b = new THREE.Box3().setFromObject(scene, true);
        const s = b.getSize(new THREE.Vector3());
        let minX = Infinity, maxX = -Infinity;
        const v = new THREE.Vector3();
        for (const cx of [b.min.x, b.max.x])
          for (const cy of [b.min.y, b.max.y])
            for (const cz of [b.min.z, b.max.z]) {
              v.set(cx, cy, cz).project(cam);
              minX = Math.min(minX, v.x);
              maxX = Math.max(maxX, v.x);
            }
        document.title =
          `DIAG size=${s.x.toFixed(1)},${s.y.toFixed(1)},${s.z.toFixed(1)}` +
          ` cam=${cam.position.x.toFixed(1)},${cam.position.y.toFixed(1)},${cam.position.z.toFixed(1)}` +
          ` fov=${cam.fov.toFixed(0)} ndcX=${minX.toFixed(2)}..${maxX.toFixed(2)}`;
      }, 1500);
      return () => clearTimeout(timer);
    }
    // Compute hotspot marker positions in the inner group's space.
    const group = inner.current;
    if (!group) return;
    group.updateWorldMatrix(true, true);
    const out: Record<string, THREE.Vector3> = {};
    const v = new THREE.Vector3();
    for (const h of HOTSPOTS) {
      const node = scene.getObjectByName(h.part);
      if (!node) continue;
      node.getWorldPosition(v);
      out[h.id] = group.worldToLocal(v.clone());
    }
    setMarkerPos(out);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  // Window-level move/up so drags survive leaving the canvas.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const sd = stickDrag.current;
      if (sd && e.pointerId === sd.pid) {
        const dx = e.clientX - sd.x0;
        const dy = e.clientY - sd.y0;
        if (Math.hypot(dx, dy) > 6) sd.moved = true;
        let x = dx / 70;
        let y = -dy / 70;
        const m = Math.hypot(x, y);
        if (m > 1) { x /= m; y /= m; }
        sd.x = x; sd.y = y;
        return;
      }
      const rd = rotateDrag.current;
      if (rd && e.pointerId === rd.pid) {
        store.userYaw = rd.yaw0 + (e.clientX - rd.x0) * 0.006;
        store.userPitch = THREE.MathUtils.clamp(rd.pitch0 + (e.clientY - rd.y0) * 0.004, -0.6, 0.6);
      }
    };
    const onUp = (e: PointerEvent) => {
      const sd = stickDrag.current;
      if (sd && e.pointerId === sd.pid) {
        const cfg = PARTS[sd.name];
        if (!sd.moved && cfg.press) pulses.current[cfg.press] = performance.now() + 180;
        stickDrag.current = null;
      }
      if (rotateDrag.current && e.pointerId === rotateDrag.current.pid) rotateDrag.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const startRotate = (e: ThreeEvent<PointerEvent>) => {
    if (!store.exploreEnabled) return;
    rotateDrag.current = {
      x0: e.clientX, y0: e.clientY,
      yaw0: store.userYaw, pitch0: store.userPitch,
      pid: e.pointerId,
    };
  };

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    const part = (e.object as THREE.Object3D).userData.part as string | undefined;
    if (part && PARTS[part]) {
      e.stopPropagation();
      const cfg = PARTS[part];
      if (cfg.kind === "stick") {
        stickDrag.current = { name: part, x0: e.clientX, y0: e.clientY, x: 0, y: 0, moved: false, pid: e.pointerId };
      } else {
        const control = PART_TO_CONTROL[part];
        pointerControls.current.add(control);
        const release = () => {
          pointerControls.current.delete(control);
          window.removeEventListener("pointerup", release);
          window.removeEventListener("pointercancel", release);
        };
        window.addEventListener("pointerup", release);
        window.addEventListener("pointercancel", release);
      }
      return;
    }
    // Any other mesh (shell, core, decoration): rotate the controller.
    e.stopPropagation();
    startRotate(e);
  };

  const tmp = useRef(new THREE.Vector3()).current;

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = state.clock.elapsedTime;
    const now = performance.now();
    const k = 1 - Math.exp(-dt * 28);
    const ks = 1 - Math.exp(-dt * 18);
    const pad = pollGamepad();
    const explode = THREE.MathUtils.smoothstep(store.explode, 0, 1);

    const controlValue = (id: ControlId): number => {
      const pulse = pulses.current[id];
      const local =
        pointerControls.current.has(id) || (pulse !== undefined && pulse > now) ? 1 : 0;
      return Math.max(local, pad.buttons[id] ?? 0, store.uiControls[id] ?? 0);
    };

    for (const p of Object.values(prepared.parts)) {
      const { cfg } = p;
      if (cfg.kind === "press" && p.axis && cfg.depth !== undefined) {
        const v = controlValue(PART_TO_CONTROL[p.name]);
        p.anim += (v - p.anim) * k;
        p.node.position.copy(p.rest)
          .addScaledVector(p.axis, cfg.depth * p.anim)
          .addScaledVector(p.explodeDir, explode);
      } else if (cfg.kind === "trigger") {
        const v = controlValue(PART_TO_CONTROL[p.name]);
        p.anim += (v - p.anim) * k;
        p.node.rotation.x = p.restRot.x + TRIGGER_SWING * p.anim;
        p.node.position.copy(p.rest).addScaledVector(p.explodeDir, explode);
      } else if (cfg.kind === "stick" && cfg.press) {
        const sd = stickDrag.current;
        let tx = 0, ty = 0;
        if (sd && sd.name === p.name) { tx = sd.x; ty = sd.y; }
        else if (p.name === "stick_left" && (pad.sticks.lx || pad.sticks.ly)) { tx = pad.sticks.lx; ty = -pad.sticks.ly; }
        else if (p.name === "stick_right" && (pad.sticks.rx || pad.sticks.ry)) { tx = pad.sticks.rx; ty = -pad.sticks.ry; }
        p.sx += (tx - p.sx) * ks;
        p.sy += (ty - p.sy) * ks;
        const v = controlValue(cfg.press);
        p.anim += (v - p.anim) * k;
        p.node.rotation.set(p.restRot.x - p.sy * STICK_TILT, p.restRot.y + p.sx * STICK_TILT, 0);
        tmp.set(0, 0, -0.018 * p.anim);
        p.node.position.copy(p.rest).add(tmp).addScaledVector(p.explodeDir, explode);
      }
      // Press glow, plus a slow pulse on the focused hotspot part.
      const focusPulse = store.focus === p.name ? 0.35 + Math.sin(t * 5) * 0.2 : 0;
      const glow = Math.max(p.anim * 0.9, focusPulse);
      for (const m of p.mats) m.emissiveIntensity = glow;
    }

    for (const ex of prepared.extras) {
      ex.node.position.copy(ex.rest).addScaledVector(ex.dir, explode);
    }

    // Light bar.
    for (const m of prepared.lightbarMats) {
      m.emissive.set(store.lightbarColor);
      const focusBoost = store.focus === "lightbar" ? 0.6 + Math.sin(t * 5) * 0.3 : 0;
      m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, Math.max(store.lightbar, focusBoost), 8, dt);
    }

    // Wrapper: yaw choreography + user rotation + idle float + rumble shake + motion demo tilt.
    const g = wrapper.current;
    if (!g) return;
    if (!store.exploreEnabled && !rotateDrag.current) {
      store.userYaw = THREE.MathUtils.damp(store.userYaw, 0, 3, dt);
      store.userPitch = THREE.MathUtils.damp(store.userPitch, 0, 3, dt);
    }
    const shaking = now < store.shakeUntil && !store.reduced;
    const motion = store.motionTilt;
    const tiltX = motion.active ? motion.y * 0.4 : 0;
    const tiltZ = motion.active ? -motion.x * 0.35 : 0;
    g.rotation.set(
      store.basePitch + store.userPitch + tiltX,
      store.baseYaw + store.userYaw,
      (shaking ? Math.sin(now * 0.09) * 0.02 : 0) + tiltZ,
    );
    const floatY = store.reduced ? 0 : Math.sin(t * 1.1) * 0.06;
    g.position.set(shaking ? Math.sin(now * 0.13) * 0.05 : 0, 0.35 + floatY, 0);
  });

  return (
    <group ref={wrapper} rotation={[-0.3, store.baseYaw, 0]} position={[0, 0.35, 0]}>
      <group ref={inner} scale={prepared.scale}>
        <group position={prepared.offset}>
          <primitive object={scene} onPointerDown={onPointerDown} />
        </group>
        {hotspotsVisible &&
          HOTSPOTS.map((h) =>
            markerPos[h.id] ? (
              <Html key={h.id} position={markerPos[h.id]} center zIndexRange={[40, 0]}>
                <button
                  type="button"
                  aria-label={`Focus ${h.title}`}
                  onClick={() => onHotspot(h.id)}
                  className={`hotspot-dot ${activeHotspot === h.id ? "is-active" : ""}`}
                >
                  <span />
                </button>
              </Html>
            ) : null,
          )}
      </group>
      {/* Invisible backdrop so drag-to-rotate also starts off the model. */}
      <mesh position={[0, 0, -6]} onPointerDown={startRotate}>
        <planeGeometry args={[80, 50]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* Bloom restricted to the light bar strip — the product-shot glow. */}
      {prepared.lightbarMeshes.length > 0 && (
        <EffectComposer multisampling={4}>
          <SelectiveBloom
            selection={prepared.lightbarMeshes}
            mipmapBlur
            intensity={3.4}
            luminanceThreshold={0.1}
            luminanceSmoothing={0.2}
          />
        </EffectComposer>
      )}
    </group>
  );
}

useGLTF.preload(MODEL_URL);
