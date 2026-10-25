"use client";

import { Suspense } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
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
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 34, near: 0.1, far: 120, position: [0, 3.4, 12.5] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ touchAction: "pan-y" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
      }}
    >
      <Suspense fallback={null}>
        <Stage />
        <Controller {...props} />
      </Suspense>
      <CameraRig />
    </Canvas>
  );
}
