// Game-lobby layer over the portfolio content. Everything factual still comes
// from site.ts / portfolio.ts; this file only maps it onto the 3D scene.

export type ScreenId =
  | "lobby"
  | "missions"
  | "arsenal"
  | "loadout"
  | "career"
  | "intel";

export const screens: { id: ScreenId; label: string; plain: string }[] = [
  { id: "lobby", label: "Lobby", plain: "Home" },
  { id: "missions", label: "Missions", plain: "Featured work" },
  { id: "arsenal", label: "Arsenal", plain: "Projects" },
  { id: "loadout", label: "Loadout", plain: "Skills" },
  { id: "career", label: "Career", plain: "Experience" },
  { id: "intel", label: "Intel", plain: "About" },
];

/** Player-card portrait shown in the lobby HUD. */
export const operatorAvatar = "/operator/soham-avatar.webp";

// The penthouse: a Newport tower on the Jersey City waterfront.
export const viewpoint = {
  name: "Newport, Jersey City",
  lat: 40.7268,
  lon: -74.033,
};

export type Landmark = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** Height to the tip, in meters. */
  height: number;
};

export const landmarks: Record<string, Landmark> = {
  oneWtc: { id: "oneWtc", name: "One World Trade Center", lat: 40.71274, lon: -74.01338, height: 541 },
  threeWtc: { id: "threeWtc", name: "3 World Trade Center", lat: 40.71106, lon: -74.01182, height: 329 },
  fourWtc: { id: "fourWtc", name: "4 World Trade Center", lat: 40.71016, lon: -74.01166, height: 297 },
  sevenWtc: { id: "sevenWtc", name: "7 World Trade Center", lat: 40.71339, lon: -74.01214, height: 226 },
  woolworth: { id: "woolworth", name: "Woolworth Building", lat: 40.7124, lon: -74.0082, height: 241 },
  leonard: { id: "leonard", name: "56 Leonard", lat: 40.71825, lon: -74.00568, height: 250 },
  spruce: { id: "spruce", name: "8 Spruce Street", lat: 40.71074, lon: -74.00553, height: 265 },
  brookfield: { id: "brookfield", name: "Brookfield Place", lat: 40.7133, lon: -74.0157, height: 225 },
  empire: { id: "empire", name: "Empire State Building", lat: 40.74844, lon: -73.98566, height: 443 },
  chrysler: { id: "chrysler", name: "Chrysler Building", lat: 40.75162, lon: -73.97545, height: 319 },
  vanderbilt: { id: "vanderbilt", name: "One Vanderbilt", lat: 40.753, lon: -73.9785, height: 427 },
  hudsonYards: { id: "hudsonYards", name: "30 Hudson Yards", lat: 40.75385, lon: -74.00055, height: 387 },
  parkAve: { id: "parkAve", name: "432 Park Avenue", lat: 40.7617, lon: -73.9718, height: 426 },
  cpt: { id: "cpt", name: "Central Park Tower", lat: 40.7663, lon: -73.981, height: 472 },
  brooklyn: { id: "brooklyn", name: "The Brooklyn Tower", lat: 40.6908, lon: -73.9837, height: 325 },
};

/** Flat-earth approximation, accurate to a few meters across the Hudson. */
export function fromViewpoint(lat: number, lon: number) {
  const north = (lat - viewpoint.lat) * 111.32;
  const east =
    (lon - viewpoint.lon) * 111.32 * Math.cos((viewpoint.lat * Math.PI) / 180);
  const km = Math.hypot(north, east);
  const bearing = ((Math.atan2(east, north) * 180) / Math.PI + 360) % 360;
  return { km, bearing };
}

const compass = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
export function compassPoint(bearing: number) {
  return compass[Math.round(bearing / 45) % 8];
}

export function rangeLabel(id: string) {
  const l = landmarks[id];
  const { km, bearing } = fromViewpoint(l.lat, l.lon);
  return `${km.toFixed(2)} km · ${Math.round(bearing)}° ${compassPoint(bearing)}`;
}

// Missions = the three OurFreedom.ai systems, pinned on downtown towers.
export const missionTargets: Record<string, string> = {
  release: "oneWtc",
  moderation: "leonard",
  messaging: "woolworth",
};

export const missionReports: Record<string, string> = {
  release: "release-pipeline",
  moderation: "on-device-moderation",
  messaging: "direct-messaging",
};

// Arsenal = side projects, pinned on midtown towers.
export const projectTargets = ["empire", "hudsonYards", "parkAve"];

// Career = where each chapter happened. Off-map places get a horizon arrow.
export const careerPins = [
  {
    id: "ourfreedom",
    org: "OurFreedom.ai",
    landmark: "vanderbilt",
    note: "New York City",
  },
  {
    id: "northeastern",
    org: "Northeastern University",
    landmark: null,
    note: "Boston · 307 km NE",
    // Off-map pins sit on the horizon; placement is spread for legibility.
    bearing: 26,
  },
  {
    id: "acn",
    org: "ACN Fiber",
    landmark: null,
    note: "Mumbai · 12,550 km",
    bearing: -8,
  },
];

export const loadoutSlots = [
  { slot: "Primary", groupIndex: 0 },
  { slot: "Secondary", groupIndex: 1 },
  { slot: "Perks", groupIndex: 2 },
  { slot: "Support", groupIndex: 3 },
];

export const bootLines = [
  "Streaming Lower Manhattan",
  "Lighting 40,000 windows",
  "Calibrating Hudson reflections",
  "Warming up the fire table",
  "Loading operator",
];

export const tips = [
  "Press Q and E to switch tabs, Esc to come back to the lobby.",
  "Click the operator, or press G, to emote.",
  "Every distance on the scope is real, measured from Newport.",
  "Prefer a plain page? The classic view is in Settings.",
  "Missions are real shipped systems. Each one has a field report.",
];

export const ticker = [
  "Open to full-time roles from January 2027",
  "Graduating M.S. Information Systems, December 2026",
  "Based in Boston, open to relocation and remote",
  "Release, platform, and trust and safety engineering",
  "No App Store release rejections on my watch",
];

/** Degree progress for the XP bar: Sep 2024 to Dec 2026. */
export function degreeProgress(now = new Date()) {
  const start = Date.UTC(2024, 8, 1);
  const end = Date.UTC(2026, 11, 15);
  return Math.min(1, Math.max(0, (now.getTime() - start) / (end - start)));
}
