"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Environment, Lightformer } from "@react-three/drei";

/** Cheap always-soft contact shadow: a radial-gradient canvas texture. */
function GroundShadow() {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, "rgba(0,0,0,0.42)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
      <planeGeometry args={[11, 5]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

/** Studio lighting: softbox environment (no network fetch) + key and rim lights. */
export function Stage() {
  return (
    <>
      <Environment resolution={256} frames={1}>
        {/* Overhead softbox */}
        <Lightformer intensity={2.8} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[9, 9, 1]} />
        {/* Key, camera left */}
        <Lightformer intensity={2.0} position={[-6, 2, 5]} rotation={[0, Math.PI / 3, 0]} scale={[4, 7, 1]} color="#f4f7ff" />
        {/* Cool rim, behind right */}
        <Lightformer intensity={2.4} position={[7, 3, -6]} rotation={[0, -Math.PI / 2.5, 0]} scale={[3, 8, 1]} color="#9cc2ff" />
        {/* Faint fill below */}
        <Lightformer intensity={1.0} position={[0, -5, 2]} rotation={[-Math.PI / 2, 0, 0]} scale={[8, 8, 1]} color="#2b3850" />
      </Environment>
      <hemisphereLight args={["#ffffff", "#3a424d", 0.65]} />
      <directionalLight position={[4, 7, 8]} intensity={1.8} />
      <directionalLight position={[-6, 3, -6]} intensity={0.9} color="#dfe8ff" />
      <GroundShadow />
    </>
  );
}
