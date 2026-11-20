"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { rng } from "./geo";
import { lobby, useLobby } from "../store";

// Cyberpunk rain: short falling streaks in the volume between the balcony and
// the river, lit cyan so bloom catches them. Reduced motion freezes the drops
// in place; the Performance tier draws fewer.

const BOX = { x: [-9, 11], y: [-6, 9], z: [-34, 3] } as const;
const LEN = 0.55;

export default function Rain() {
  const quality = useLobby((s) => s.quality);
  const count = quality === "high" ? 900 : 320;
  const { geometry, material, drops } = useMemo(() => {
    const r = rng(2049);
    const d = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      d[i * 3] = BOX.x[0] + r() * (BOX.x[1] - BOX.x[0]);
      d[i * 3 + 1] = BOX.y[0] + r() * (BOX.y[1] - BOX.y[0]);
      d[i * 3 + 2] = BOX.z[0] + r() * (BOX.z[1] - BOX.z[0]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 6), 3));
    const m = new THREE.LineBasicMaterial({
      color: new THREE.Color(0.35, 1.4, 1.8),
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      toneMapped: false,
    });
    return { geometry: g, material: m, drops: d };
  }, [count]);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((_, delta) => {
    const moving = !lobby.get().reducedMotion;
    const dt = Math.min(delta, 0.05);
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      let y = drops[i * 3 + 1];
      if (moving) {
        y -= (9 + (i % 7)) * dt;
        if (y < BOX.y[0]) y = BOX.y[1];
        drops[i * 3 + 1] = y;
      }
      const x = drops[i * 3];
      const z = drops[i * 3 + 2];
      pos.setXYZ(i * 2, x, y, z);
      pos.setXYZ(i * 2 + 1, x - LEN * 0.08, y + LEN, z);
    }
    pos.needsUpdate = true;
  });

  return <lineSegments geometry={geometry} material={material} frustumCulled={false} renderOrder={5} />;
}
