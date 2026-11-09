"use client";

import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, advance } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { CameraRig } from "./CameraRig";
import { Controller } from "./Controller";
import { Stage } from "./Stage";

interface CanvasLayerProps {
  hotspotsVisible: boolean;
  activeHotspot: string | null;
  onHotspot: (id: string) => void;
  onReady: () => void;
}

export default function CanvasLayer(props: CanvasLayerProps) {
  // Start at a modest pixel ratio and let the measured frame rate decide:
  // smooth devices climb to their native dpr (capped at 2), struggling ones
  // drop to 1x, and a device that keeps oscillating loses the bloom pass too.
  const [dpr, setDpr] = useState(() => Math.min(1.5, typeof window === "undefined" ? 1.5 : window.devicePixelRatio));
  const [degraded, setDegraded] = useState(false);

  // Degraded tier also caps the frame rate at 30: half the GPU work, and on
  // thermally-limited phones steady 30 feels smoother than a wavering 45.
  // ponytail: render-on-demand would idle the GPU completely, but the idle
  // float animation never settles — revisit if 30fps still isn't enough.
  useEffect(() => {
    if (!degraded) return;
    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last >= 33) {
        last = t;
        advance(t / 1000);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [degraded]);

  return (
    <Canvas
      dpr={dpr}
      frameloop={degraded ? "never" : "always"}
      camera={{ fov: 34, near: 0.1, far: 120, position: [0, 3.4, 12.5] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ touchAction: "pan-y" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
      }}
    >
      <PerformanceMonitor
        onIncline={() => setDpr(Math.min(2, window.devicePixelRatio))}
        onDecline={() => setDpr(1)}
        flipflops={3}
        onFallback={() => {
          setDpr(1);
          setDegraded(true);
        }}
      >
        <Suspense fallback={null}>
          <Stage />
          <Controller {...props} effects={!degraded} />
        </Suspense>
        <CameraRig />
      </PerformanceMonitor>
    </Canvas>
  );
}
