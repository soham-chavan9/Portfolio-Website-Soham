"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { markerScreen } from "../marker-meta";
import { useLobby } from "../store";
import { markers, type MarkerDef } from "./targets";
import { createBeamMaterial } from "./shaders";

// Holographic pins over the skyline. The 3D part (gem, beam, pulse ring) lives
// here; the clickable labels are DOM in the HUD, placed from `markerScreen`.

const CYAN = new THREE.Color(0.35, 0.9, 1.0);
const AMBER = new THREE.Color(1.0, 0.68, 0.22);

function Marker({ m, active, selected }: { m: MarkerDef; active: boolean; selected: boolean }) {
  const beamMat = useMemo(() => createBeamMaterial(CYAN.clone()), []);
  const gemMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: CYAN.clone().multiplyScalar(3),
        wireframe: true,
        transparent: true,
        toneMapped: false,
        depthWrite: false,
      }),
    [],
  );
  const ringMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: CYAN.clone().multiplyScalar(2.2),
        transparent: true,
        side: THREE.DoubleSide,
        toneMapped: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  useEffect(
    () => () => {
      beamMat.dispose();
      gemMat.dispose();
      ringMat.dispose();
    },
    [beamMat, gemMat, ringMat],
  );

  // Recolour in place when selection changes, so nothing remounts.
  useEffect(() => {
    const c = selected ? AMBER : CYAN;
    beamMat.uniforms.uColor.value.copy(c);
    gemMat.color.copy(c).multiplyScalar(3);
    ringMat.color.copy(c).multiplyScalar(2.2);
  }, [selected, beamMat, gemMat, ringMat]);

  const group = useRef<THREE.Group>(null);
  const gem = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const beam = useRef<THREE.Mesh>(null);
  const fade = useRef(0);
  const beamLen = m.landmark ? 9 : 40;
  const scale = m.landmark ? 1 : 3;

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    fade.current = THREE.MathUtils.damp(fade.current, active ? 1 : 0, 5, delta);
    const f = fade.current;
    const visible = f > 0.01;
    if (group.current) group.current.visible = visible;
    if (!visible) return;
    beamMat.uniforms.uTime.value = t;
    beamMat.uniforms.uOpacity.value = f * (selected ? 1 : 0.7);
    gemMat.opacity = f;
    ringMat.opacity = f * (0.5 + 0.5 * Math.sin(t * 3));
    if (gem.current) {
      gem.current.rotation.y = t * 1.2;
      gem.current.position.y = Math.sin(t * 2) * 0.4;
    }
    if (ring.current) ring.current.scale.setScalar((1 + ((t * 0.6) % 1) * 1.6) * scale);
  });

  return (
    <group ref={group} position={m.position} visible={false}>
      <mesh ref={gem} material={gemMat} scale={scale}>
        <octahedronGeometry args={[1.5, 0]} />
      </mesh>
      <mesh ref={beam} material={beamMat} position={[0, -beamLen / 2 - 1.5 * scale, 0]}>
        <cylinderGeometry args={[0.18 * scale, 0.18 * scale, beamLen, 8, 1, true]} />
      </mesh>
      {m.landmark && (
        <mesh ref={ring} material={ringMat} position={[0, -8.7, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[3.2, 3.6, 40]} />
        </mesh>
      )}
    </group>
  );
}

/** Projects every marker's label anchor to CSS pixels for the HUD. */
function Projector() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    for (const m of markers) {
      v.copy(m.position);
      v.y += m.landmark ? 4 : 12;
      v.project(camera);
      const entry = markerScreen[m.id] ?? (markerScreen[m.id] = { x: 0, y: 0, on: false });
      entry.x = ((v.x + 1) / 2) * size.width;
      entry.y = ((1 - v.y) / 2) * size.height;
      entry.on = v.z < 1 && v.z > -1;
    }
  }, 1);
  return null;
}

export default function Markers() {
  const screen = useLobby((s) => s.screen);
  const focus = useLobby((s) => s.focus);
  const phase = useLobby((s) => s.phase);
  const comms = useLobby((s) => s.comms);
  return (
    <group>
      {markers.map((m) => (
        <Marker
          key={m.id}
          m={m}
          active={phase === "lobby" && !comms && m.screen === screen}
          selected={focus === m.id}
        />
      ))}
      <Projector />
    </group>
  );
}
