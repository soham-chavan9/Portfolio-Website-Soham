import * as THREE from "three";
import { landmarks } from "@/content/lobby";
import { markerMeta, type MarkerMeta } from "../marker-meta";
import { GROUND_Y, landmarkTop, polarToScene } from "./geo";

// Where each in-world marker floats, keyed by the focus id the HUD uses.
// Built from the content mapping, so any number of markers per screen works.

export type MarkerDef = MarkerMeta & {
  position: THREE.Vector3;
  /** Length of the beam from under the gem down to the tower top (or into the haze). */
  beam: number;
  /** Gem scale: horizon pins are drawn larger so they read at range. */
  scale: number;
  /** Only the first marker on a tower draws the pulse ring on its roof. */
  ring: boolean;
};

const LIFT = 9;
/** Extra height per marker when several on one screen share a tower. */
const STACK = 10;

function isLandmark(id: string | null | undefined): id is string {
  return !!id && Object.prototype.hasOwnProperty.call(landmarks, id);
}

function horizon(bearing: number) {
  const [x, z] = polarToScene(bearing, 9);
  return new THREE.Vector3(x, 60 + Math.abs(bearing) * 0.6, z);
}

function build(): MarkerDef[] {
  // How many markers on the same screen already sit on each tower.
  const stacked = new Map<string, number>();
  return markerMeta.map((m) => {
    if (isLandmark(m.landmark)) {
      const key = `${m.screen}:${m.landmark}`;
      const k = stacked.get(key) ?? 0;
      stacked.set(key, k + 1);
      const [x, y, z] = landmarkTop(m.landmark);
      return {
        ...m,
        position: new THREE.Vector3(x, y + LIFT + k * STACK, z),
        beam: LIFT + k * STACK,
        scale: 1,
        ring: k === 0,
      };
    }
    // Off-map places, or a landmark id the city doesn't model: a horizon pin.
    return {
      ...m,
      landmark: null,
      position: horizon(m.bearing ?? 45),
      beam: 40,
      scale: 3,
      ring: false,
    };
  });
}

export const markers: MarkerDef[] = build();

const byId = new Map(markers.map((m) => [m.id, m]));

export function markerById(id: string | null) {
  return id ? byId.get(id) ?? null : null;
}

/**
 * Camera aim and lens that frame a whole tower plus its marker. Writes the aim
 * into `outLook` and returns the vertical fov, so it is safe to call per frame.
 */
export function frameMarker(m: MarkerDef, from: THREE.Vector3, outLook: THREE.Vector3) {
  const base = m.landmark ? GROUND_Y : m.position.y - 30;
  const top = m.position.y + 22;
  outLook.set(m.position.x, (top + base) / 2, m.position.z);
  const dist = Math.max(1, outLook.distanceTo(from));
  const fov = THREE.MathUtils.radToDeg(2 * Math.atan(((top - base) * 0.6) / dist));
  return THREE.MathUtils.clamp(fov, 8, 30);
}
