// 3D mapping for the lobby. No facts live here: every label shown in the HUD
// comes from resume.ts. This file only says which screen exists, where each
// resume item is pinned in the city, and the neutral UI copy around them.

export type ScreenId =
  | "home"
  | "experience"
  | "projects"
  | "skills"
  | "education"
  | "contact";

export const screens: { id: ScreenId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
];

/** Portrait shown on the identity card. */
export const operatorAvatar = "/operator/soham-avatar.jpg";

// Scene geometry: the camera's vantage point across the Hudson. Used only to
// place towers; never shown as a location in the HUD.
export const viewpoint = {
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

// Experience: resume bullet id -> downtown tower. OurFreedom.ai was in New
// York, so its shipped work is pinned on the skyline.
export const experiencePins: Record<string, string> = {
  "of-feed": "threeWtc",
  "of-updates": "oneWtc",
  "of-releases": "sevenWtc",
  "of-moderation": "leonard",
  "of-messaging": "woolworth",
  "of-safety": "spruce",
};

// Projects: resume project id -> midtown tower.
export const projectPins: Record<string, string> = {
  lumina: "empire",
  fundflow: "hudsonYards",
};

// Education: off-map places sit on the horizon at a compass bearing (degrees,
// spread for legibility rather than true direction).
export const educationPins: Record<string, number> = {
  northeastern: 26,
  mumbai: -8,
};

export const bootLines = [
  "Loading the skyline",
  "Lighting the windows",
  "Calibrating reflections",
  "Loading the character",
];

export const tips = [
  "Press Q and E to switch tabs, Esc to come back home.",
  "Click the character, or press G, to wave.",
  "Prefer a plain page? Open the classic view.",
  "Work on the Experience tab is pinned to real towers.",
];
