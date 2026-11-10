import * as THREE from "three";
import { markerMeta, type MarkerMeta } from "../marker-meta";
import { GROUND_Y, landmarkTop, polarToScene } from "./geo";

// Where each in-world marker floats, keyed by the focus id the HUD uses.

export type MarkerDef = MarkerMeta & { position: THREE.Vector3 };

const LIFT = 9;

function above(landmark: string) {
  const [x, y, z] = landmarkTop(landmark);
  return new THREE.Vector3(x, y + LIFT, z);
}

function horizon(bearing: number) {
  const [x, z] = polarToScene(bearing, 9);
  return new THREE.Vector3(x, 60 + Math.abs(bearing) * 0.6, z);
}

export const markers: MarkerDef[] = markerMeta.map((m) => ({
  ...m,
  position: m.landmark ? above(m.landmark) : horizon(m.bearing ?? 45),
}));

export function markerById(id: string | null) {
  return id ? markers.find((m) => m.id === id) ?? null : null;
}

/** Camera aim and lens that frame a whole tower plus its marker. */
export function frameMarker(m: MarkerDef, from: THREE.Vector3) {
  const base = m.landmark ? GROUND_Y : m.position.y - 30;
  const top = m.position.y + 22;
  const look = new THREE.Vector3(m.position.x, (top + base) / 2, m.position.z);
  const dist = look.distanceTo(from);
  const fov = THREE.MathUtils.radToDeg(2 * Math.atan(((top - base) * 0.6) / dist));
  return { look, fov: THREE.MathUtils.clamp(fov, 8, 30) };
}
