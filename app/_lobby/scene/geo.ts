import { fromViewpoint, landmarks } from "@/content/lobby";

// The balcony is modelled at 1:1 (meters). The city is modelled at 1:5 and
// placed closer, which reads identically from the balcony but keeps depth
// precision sane. Bearings are squeezed so midtown and downtown share a frame,
// the way a lobby camera would cheat it.

export const CITY_SCALE = 0.2;
/** Water and street level, 140 m below the balcony at city scale. */
export const GROUND_Y = -28;
const CENTER_BEARING = 96;
const ANGLE_K = 0.5;

export function sceneRadius(km: number) {
  return km <= 2.5 ? km * 175 : 437.5 + (km - 2.5) * 120;
}

export function polarToScene(bearing: number, km: number): [number, number] {
  const th = ((bearing - CENTER_BEARING) * ANGLE_K * Math.PI) / 180;
  const r = sceneRadius(km);
  return [r * Math.sin(th), -r * Math.cos(th)];
}

export function latLonToScene(lat: number, lon: number): [number, number] {
  const { km, bearing } = fromViewpoint(lat, lon);
  return polarToScene(bearing, km);
}

export function landmarkPosition(id: string): [number, number, number] {
  const l = landmarks[id];
  const [x, z] = latLonToScene(l.lat, l.lon);
  return [x, GROUND_Y, z];
}

export function landmarkTop(id: string): [number, number, number] {
  const [x, y, z] = landmarkPosition(id);
  return [x, y + landmarks[id].height * CITY_SCALE, z];
}

/** Small deterministic PRNG so the skyline is identical on every visit. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Manhattan's west shore, south to north, as (bearing, km) from Newport. */
export const manhattanShore: [number, number][] = [
  [158, 3.3],
  [150, 2.9],
  [141, 2.05],
  [134, 1.85],
  [118, 1.55],
  [104, 1.45],
  [92, 1.42],
  [78, 1.6],
  [62, 2.15],
  [50, 2.75],
  [42, 3.3],
  [36, 4.1],
  [28, 5.6],
  [20, 8],
];
