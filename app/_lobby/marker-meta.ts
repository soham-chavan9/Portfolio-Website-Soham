import {
  educationPins,
  experiencePins,
  landmarks,
  projectPins,
  rangeLabel,
  type ScreenId,
} from "@/content/scene";
import { resume } from "@/content/resume";

// What each in-world marker says. Positions live in scene/targets.ts; the
// projected screen positions are written into `markerScreen` every frame.
// Titles come from resume.ts; pins from scene.ts. Anything without a known
// landmark or bearing simply gets no marker instead of crashing.

export type MarkerMeta = {
  id: string;
  screen: ScreenId;
  code: string;
  title: string;
  sub: string;
  landmark: string | null;
  bearing?: number;
};

/** True when `id` names a landmark the scene knows how to place. */
export function isLandmark(id: string | null | undefined): id is string {
  return typeof id === "string" && Object.prototype.hasOwnProperty.call(landmarks, id);
}

/** "One World Trade Center · 2.41 km · 118° SE" */
export const pinLabel = (landmark: string) => `${landmarks[landmark].name} · ${rangeLabel(landmark)}`;

/** Stable two-digit codes that keep working past nine entries: E-01 … E-12. */
export const markerCode = (prefix: string, index: number) => `${prefix}-${String(index + 1).padStart(2, "0")}`;

const pinnedBullets = resume.experience
  .flatMap((role) => role.bullets)
  .filter((b) => isLandmark(experiencePins[b.id]));

export const markerMeta: MarkerMeta[] = [
  ...pinnedBullets.map((b, i): MarkerMeta => {
    const landmark = experiencePins[b.id];
    return {
      id: b.id,
      screen: "experience",
      code: markerCode("E", i),
      title: b.label,
      sub: pinLabel(landmark),
      landmark,
    };
  }),
  ...resume.projects.flatMap((p, i): MarkerMeta[] => {
    const landmark = projectPins[p.id];
    if (!isLandmark(landmark)) return [];
    return [
      {
        id: p.id,
        screen: "projects",
        code: markerCode("P", i),
        title: p.name,
        sub: pinLabel(landmark),
        landmark,
      },
    ];
  }),
  ...resume.education.flatMap((e, i): MarkerMeta[] => {
    const bearing = educationPins[e.id];
    if (typeof bearing !== "number") return [];
    return [
      {
        id: e.id,
        screen: "education",
        code: markerCode("S", i),
        title: e.school,
        sub: e.location,
        landmark: null,
        bearing,
      },
    ];
  }),
];

/** Landmark the scope reads out for a screen's focus, or null if it has none. */
export function focusLandmark(screen: ScreenId, focus: string | null): string | null {
  const m = focus
    ? markerMeta.find((x) => x.id === focus && x.screen === screen)
    : markerMeta.find((x) => x.screen === screen);
  return m?.landmark ?? null;
}

/** Screen-space label anchors, in CSS px, written by the 3D scene each frame. */
export const markerScreen: Record<string, { x: number; y: number; on: boolean }> = {};
